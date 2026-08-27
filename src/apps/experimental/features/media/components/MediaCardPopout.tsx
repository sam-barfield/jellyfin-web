import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import PlayArrow from '@mui/icons-material/PlayArrow';
import FavoriteIcon from '@mui/icons-material/Favorite';
import CheckCircleOutline from '@mui/icons-material/CheckCircleOutline';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import StarRounded from '@mui/icons-material/StarRounded';
import { useQueryClient } from '@tanstack/react-query';

import { type ItemDto } from 'types/base/models/item-dto';
import { useItem } from 'hooks/useItem';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { useToggleFavoriteMutation, useTogglePlayedMutation } from 'hooks/useFetchItems';
import { playbackManager } from 'components/playback/playbackmanager';
import { appRouter } from 'components/router/appRouter';
import { useItemTrailer } from '../api/useItemTrailer';
import { YoutubeTrailerPreview } from './YoutubeTrailerPreview';

interface MediaCardPopoutProps {
    /** The item from the list query (may have partial data). `null` when no card is hovered. */
    item: ItemDto | null;
    /** Bounding rect of the hovered card element. `null` when no card is hovered. */
    anchorRect: DOMRect | null;
    /** Called to close immediately, with no grace period (e.g. on scroll) */
    onClose: () => void;
    /** Called when the mouse enters the popout — lets the parent cancel its pending close timer.
     *  Shares MediaRow's single close-timer/grace-period, same as entering a card does. */
    onMouseEnterPopout?: () => void;
    /** Called when the mouse leaves the popout — starts MediaRow's close timer, same as leaving a
     *  card does. There is deliberately no separate close timer owned by this component: the
     *  popout is wider than a card, so moving between adjacent cards often crosses over it, and a
     *  second independent timer here could fire after a retarget already superseded it. */
    onMouseLeavePopout?: () => void;
}

/** Delay after the popout opens before the trailer preview starts playing (ms) */
const TRAILER_START_DELAY = 1000;

/** Stable placeholder passed to hooks that require a non-null ItemDto before anything has ever
 *  been hovered — module-level so its identity never changes across renders. */
const EMPTY_ITEM: ItemDto = {};

/** Returns the best backdrop/fallback image URL for the given item */
function getBackdropUrl(mergedItem: ItemDto): string {
    if (!mergedItem.Id) return '';
    const apiClient = ServerConnections.currentApiClient();
    if (!apiClient) return '';

    // For episodes, prefer the series backdrop
    if (
        mergedItem.Type === 'Episode'
        && mergedItem.ParentBackdropItemId
        && mergedItem.ParentBackdropImageTags?.length
    ) {
        return apiClient.getScaledImageUrl(mergedItem.ParentBackdropItemId, {
            type: 'Backdrop',
            maxWidth: 700,
            quality: 80
        });
    }

    // Direct backdrop
    if (mergedItem.BackdropImageTags?.length) {
        return apiClient.getScaledImageUrl(mergedItem.Id, {
            type: 'Backdrop',
            maxWidth: 700,
            quality: 80
        });
    }

    // Fallback to primary image
    if (mergedItem.ImageTags?.Primary) {
        return apiClient.getScaledImageUrl(mergedItem.Id, {
            type: 'Primary',
            maxWidth: 700,
            quality: 80
        });
    }

    return '';
}

/** Classifies an incoming (non-null) item against the previously-displayed item's id */
function classifyOpen(prevId: string | null | undefined, nextId: string | null | undefined): 'fresh' | 'retarget' | 'same' {
    if (prevId === undefined) return 'fresh';
    if (prevId !== nextId) return 'retarget';
    return 'same';
}

/**
 * Owns the "what should currently be shown/animating" state for `MediaCardPopoutInner`, so a
 * persistently-mounted popout can retarget to a new item in place: `displayItem`/`displayRect`
 * persist the last-shown item/rect (so there's content to animate out from or crossfade between),
 * `isVisible` drives the mount/exit scale+opacity transition, `contentReady` drives a quick
 * content crossfade specifically for a retarget (skipping the full mount transition, since the
 * popout is already on screen), and `glidePosition` gates the top/left position transition to
 * retargets only — a fresh open (after being fully closed) must NOT animate position: since
 * `displayRect` is sticky (kept around for the exit animation, never reset to null), a fresh open
 * would otherwise visibly slide in from wherever the popout was last shown, which can be
 * completely unrelated to the newly-hovered card.
 */
function usePopoutDisplay(item: ItemDto | null, anchorRect: DOMRect | null) {
    const [displayItem, setDisplayItem] = useState<ItemDto | null>(item);
    const [displayRect, setDisplayRect] = useState<DOMRect | null>(anchorRect);
    const [isVisible, setIsVisible] = useState(false);
    const [contentReady, setContentReady] = useState(true);
    const [glidePosition, setGlidePosition] = useState(false);
    const prevItemIdRef = useRef<string | null | undefined>(undefined);

    useEffect(() => {
        if (!item || !anchorRect) {
            setIsVisible(false);
            setGlidePosition(false);
            prevItemIdRef.current = undefined;
            return;
        }

        const openKind = classifyOpen(prevItemIdRef.current, item.Id);
        prevItemIdRef.current = item.Id;
        setGlidePosition(openKind === 'retarget');
        setDisplayItem(item);
        setDisplayRect(anchorRect);

        if (openKind === 'fresh') {
            // Defer so the browser paints the pre-transition (scaled down/transparent) state
            // first — flipping isVisible synchronously here would skip the enter transition.
            const frame = requestAnimationFrame(() => setIsVisible(true));
            return () => cancelAnimationFrame(frame);
        }

        setIsVisible(true);

        if (openKind === 'retarget') {
            setContentReady(false);
            const frame = requestAnimationFrame(() => setContentReady(true));
            return () => cancelAnimationFrame(frame);
        }
    }, [item, anchorRect]);

    return { displayItem, displayRect, isVisible, contentReady, glidePosition };
}

/** Position/opacity transition for the popout's root — only glides top/left during a retarget (see
 *  `usePopoutDisplay`'s docs on why a fresh open must not animate position) */
function popoutTransition(glidePosition: boolean): string {
    const base = 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease';
    return glidePosition ? `${base}, top 0.2s ease, left 0.2s ease` : base;
}

/** Computes where the popout should sit relative to the hovered card's rect, clamped to the viewport */
function computePopoutPosition(displayRect: DOMRect | null) {
    const popoutWidth = 350;
    if (!displayRect) return { left: 0, top: 0, width: popoutWidth };

    const popoutMaxHeight = 460;
    const margin = 12;
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    // Center horizontally on the anchor card, clamped to the viewport
    const idealLeft = displayRect.left + displayRect.width / 2 - popoutWidth / 2;
    const left = Math.min(Math.max(idealLeft, margin), viewportW - margin - popoutWidth);

    // Position below the card if there's room (or more room than above), else above
    const spaceBelow = viewportH - displayRect.bottom;
    const spaceAbove = displayRect.top;
    const idealTop = spaceBelow >= popoutMaxHeight + margin || spaceBelow >= spaceAbove ?
        displayRect.top + displayRect.height * 0.15 :
        displayRect.bottom - popoutMaxHeight - displayRect.height * 0.15;
    const top = Math.min(Math.max(idealTop, margin), viewportH - margin - popoutMaxHeight);

    return { left, top, width: popoutWidth };
}

/** Renders the runtime or season-count metadata chip */
function RuntimeOrSeasonCount({ isSeries, mergedItem, runtimeMinutes }: Readonly<{
    isSeries: boolean;
    mergedItem: ItemDto;
    runtimeMinutes: number | null;
}>) {
    if (isSeries && mergedItem.ChildCount != null) {
        return (
            <Typography variant='caption' sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                {mergedItem.ChildCount} Season{mergedItem.ChildCount !== 1 ? 's' : ''}
            </Typography>
        );
    }

    if (runtimeMinutes) {
        return (
            <Typography variant='caption' sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                {runtimeMinutes} min
            </Typography>
        );
    }

    return null;
}

/**
 * Netflix-style hover popout that appears over a media card.
 * Rendered via portal at the document body to avoid overflow clipping.
 *
 * This component is permanently mounted by `MediaRow` (rather than conditionally rendered) so
 * that hovering a different card while one is already open retargets the same instance in place
 * — a quick content crossfade and a position glide — instead of paying a full close+reopen
 * animation cycle. `item`/`anchorRect` becoming `null` means "nothing is hovered right now"; the
 * last-shown item/rect are kept in `displayItem`/`displayRect` so the popout has content to fade
 * out from, and are only ever replaced by a genuinely new item, never cleared back to null.
 */
function MediaCardPopoutInner({ item, anchorRect, onClose, onMouseEnterPopout, onMouseLeavePopout }: MediaCardPopoutProps) {
    const queryClient = useQueryClient();
    const popoutRef = useRef<HTMLDivElement>(null);

    const { displayItem, displayRect, isVisible, contentReady, glidePosition } = usePopoutDisplay(item, anchorRect);

    // Reset per-item optimistic state when the displayed item actually changes
    useEffect(() => {
        setOptFavorite(null);
        setOptPlayed(null);
    }, [displayItem?.Id]);

    // Fetch full item details (Overview, Genres, OfficialRating, etc.)
    const { data: fullItem } = useItem(displayItem?.Id ?? undefined);
    // Merge: prefer fullItem data when available, fall back to list-level item. Defaults to
    // EMPTY_ITEM (never null) before anything has ever been hovered, so the action handlers
    // below don't need their own null guards — the final `if (!displayItem) return null;` before
    // the JSX return means they're never actually reachable while mergedItem would be empty.
    const mergedItem = useMemo(
        () => ({ ...(displayItem ?? EMPTY_ITEM), ...fullItem }),
        [displayItem, fullItem]
    );

    const { mutateAsync: toggleFavorite } = useToggleFavoriteMutation();
    const { mutateAsync: togglePlayed } = useTogglePlayedMutation();
    const [optFavorite, setOptFavorite] = useState<boolean | null>(null);
    const [optPlayed, setOptPlayed] = useState<boolean | null>(null);

    const isFavorite = optFavorite ?? (mergedItem.UserData?.IsFavorite ?? false);
    const isPlayed = optPlayed ?? (mergedItem.UserData?.Played ?? false);

    // --- Trailer preview ---
    const [trailerArmed, setTrailerArmed] = useState(false);
    useEffect(() => {
        setTrailerArmed(false);
        const timer = setTimeout(() => setTrailerArmed(true), TRAILER_START_DELAY);
        return () => clearTimeout(timer);
    }, [displayItem?.Id]);
    const trailer = useItemTrailer(mergedItem, trailerArmed && Boolean(displayItem));
    // Whether the trailer has actually started playing — the preview element is mounted (and
    // playing) as soon as `trailer` resolves, but stays invisible until this flips true, so we
    // never show YouTube's brief loading/title chrome or a blank first frame.
    const [trailerPlaying, setTrailerPlaying] = useState(false);
    useEffect(() => setTrailerPlaying(false), [displayItem?.Id]);
    const handleTrailerPlaying = useCallback(() => setTrailerPlaying(true), []);

    // --- Position calculation ---
    const position = useMemo(() => computePopoutPosition(displayRect), [displayRect]);

    // --- Close handling ---
    // No timer owned here — both handlers just delegate to MediaRow, which owns the single
    // close-timer/grace-period shared with leaving/entering a card (see prop docs above).
    const handleMouseEnter = useCallback(() => {
        onMouseEnterPopout?.();
    }, [onMouseEnterPopout]);

    const handleMouseLeave = useCallback(() => {
        onMouseLeavePopout?.();
    }, [onMouseLeavePopout]);

    // Close popout on any page or container scroll
    useEffect(() => {
        const handleScroll = () => {
            onClose();
        };

        window.addEventListener('scroll', handleScroll, { capture: true, passive: true });
        return () => {
            window.removeEventListener('scroll', handleScroll, { capture: true });
        };
    }, [onClose]);

    const backdropUrl = useMemo(() => getBackdropUrl(mergedItem), [mergedItem]);

    // --- Action handlers ---
    const handlePlay = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        playbackManager.play({
            items: [mergedItem],
            startPositionTicks: mergedItem.UserData?.PlaybackPositionTicks || 0
        }).catch(console.error);
    }, [mergedItem]);

    const handleFavorite = useCallback(async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!mergedItem.Id) return;
        const next = !isFavorite;
        setOptFavorite(next);
        try {
            await toggleFavorite({ itemId: mergedItem.Id, isFavorite: !next });
            await queryClient.invalidateQueries({ queryKey: ['Items'] });
        } catch { setOptFavorite(null); }
    }, [isFavorite, mergedItem.Id, queryClient, toggleFavorite]);

    const handlePlayed = useCallback(async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!mergedItem.Id) return;
        const next = !isPlayed;
        setOptPlayed(next);
        try {
            await togglePlayed({ itemId: mergedItem.Id, isPlayed: !next });
            await queryClient.invalidateQueries({ queryKey: ['Items'] });
        } catch { setOptPlayed(null); }
    }, [isPlayed, mergedItem.Id, queryClient, togglePlayed]);

    const handleMoreInfo = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        appRouter.showItem(mergedItem);
    }, [mergedItem]);

    // Nothing has ever been hovered yet — nothing to render.
    if (!displayItem) return null;

    // --- Metadata ---
    const isEpisode = mergedItem.Type === 'Episode';
    const isSeries = mergedItem.Type === 'Series';

    const runtimeMinutes = mergedItem.RunTimeTicks ?
        Math.floor(mergedItem.RunTimeTicks / 600000000) :
        null;

    const episodeLabel = isEpisode ?
        `S${mergedItem.ParentIndexNumber ?? '?'}:E${mergedItem.IndexNumber ?? '?'}` :
        null;

    const genres = (mergedItem.Genres ?? []).slice(0, 3);

    // --- Progress bar ---
    const playedPercentage = mergedItem.UserData?.PlayedPercentage ?? 0;

    const actionButtonSx = {
        color: 'white',
        width: 38,
        height: 38,
        transition: 'all 0.2s ease',
        '&:hover': {
            backgroundColor: 'rgba(255,255,255,0.15)',
            transform: 'scale(1.1)'
        }
    };

    return createPortal(
        <Box
            ref={popoutRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            sx={{
                position: 'fixed',
                left: position.left,
                top: position.top,
                width: position.width,
                zIndex: 9999,
                borderRadius: '12px',
                overflow: 'hidden',
                backgroundColor: '#181818',
                boxShadow: '0 14px 40px rgba(0,0,0,0.7), 0 0px 0px 1px rgba(255,255,255,0.08)',
                transform: isVisible ? 'scale(1)' : 'scale(0.85)',
                opacity: isVisible ? 1 : 0,
                transition: popoutTransition(glidePosition),
                transformOrigin: 'center top',
                // Avoid blocking clicks/hover on the cards underneath while faded out — this stays
                // permanently mounted now rather than being removed from the DOM when hidden.
                pointerEvents: isVisible ? 'auto' : 'none',
                cursor: 'default'
            }}
        >
            <Box sx={{ opacity: Number(contentReady), transition: 'opacity 0.15s ease' }}>
                {/* Backdrop Image */}
                <Box
                    onClick={handleMoreInfo}
                    sx={{
                        position: 'relative',
                        width: '100%',
                        aspectRatio: '16/9',
                        cursor: 'pointer',
                        overflow: 'hidden',
                        backgroundColor: '#111'
                    }}
                >
                    {backdropUrl ? (
                        <Box
                            component='img'
                            src={backdropUrl}
                            alt={mergedItem.Name ?? ''}
                            sx={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                display: 'block'
                            }}
                        />
                    ) : (
                        <Skeleton variant='rectangular' width='100%' height='100%' sx={{ bgcolor: '#222' }} />
                    )}

                    {/* Trailer preview — mounted (and playing) as soon as it resolves, but stays
                        invisible until playback actually starts, then fades in over the backdrop
                        image. Avoids ever showing YouTube's brief loading/title chrome. */}
                    {trailer && (
                        <Box
                            sx={{
                                position: 'absolute',
                                inset: 0,
                                opacity: trailerPlaying ? 1 : 0,
                                transition: 'opacity 0.4s ease'
                            }}
                        >
                            {trailer.kind === 'video' ? (
                                <Box
                                    component='video'
                                    src={trailer.src}
                                    autoPlay
                                    muted
                                    loop
                                    playsInline
                                    onPlaying={handleTrailerPlaying}
                                    sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                />
                            ) : (
                                <Box sx={{ width: '100%', height: '100%', pointerEvents: 'none' }}>
                                    <YoutubeTrailerPreview videoId={trailer.videoId} onPlaying={handleTrailerPlaying} />
                                </Box>
                            )}
                        </Box>
                    )}

                    {/* Bottom gradient overlay */}
                    <Box
                        sx={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: '40%',
                            background: 'linear-gradient(to top, #181818 0%, transparent 100%)'
                        }}
                    />

                    {/* Progress bar (if partially watched) */}
                    {playedPercentage > 0 && playedPercentage < 100 && (
                        <Box
                            sx={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                height: 4,
                                backgroundColor: 'rgba(255,255,255,0.2)',
                                zIndex: 2
                            }}
                        >
                            <Box
                                sx={{
                                    height: '100%',
                                    width: `${playedPercentage}%`,
                                    backgroundColor: '#00A4DC',
                                    borderRadius: '0 2px 2px 0'
                                }}
                            />
                        </Box>
                    )}
                </Box>

                {/* Content area */}
                <Box sx={{ p: 2, pt: 1.5 }}>
                    {/* Action buttons row */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                        {/* Play button — prominent */}
                        <IconButton
                            size='small'
                            onClick={handlePlay}
                            title='Play'
                            sx={{
                                ...actionButtonSx,
                                color: '#181818',
                                backgroundColor: 'white',
                                '&:hover': {
                                    backgroundColor: 'rgba(255,255,255,0.85)',
                                    transform: 'scale(1.1)'
                                }
                            }}
                        >
                            <PlayArrow sx={{ fontSize: 22 }} />
                        </IconButton>

                        <IconButton
                            size='small'
                            onClick={handleFavorite}
                            title={isFavorite ? 'Remove from favourites' : 'Add to favourites'}
                            sx={{
                                ...actionButtonSx,
                                color: isFavorite ? '#e91e63' : 'white'
                            }}
                        >
                            <FavoriteIcon sx={{ fontSize: 22 }} />
                        </IconButton>

                        <IconButton
                            size='small'
                            onClick={handlePlayed}
                            title={isPlayed ? 'Mark as unplayed' : 'Mark as played'}
                            sx={{
                                ...actionButtonSx,
                                color: isPlayed ? '#4caf50' : 'white'
                            }}
                        >
                            <CheckCircleOutline sx={{ fontSize: 22 }} />
                        </IconButton>

                        {/* Spacer */}
                        <Box sx={{ flex: 1 }} />

                        <IconButton
                            size='small'
                            onClick={handleMoreInfo}
                            title='More info'
                            sx={actionButtonSx}
                        >
                            <InfoOutlined sx={{ fontSize: 22 }} />
                        </IconButton>
                    </Box>

                    {/* Metadata line */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                        {/* Rating */}
                        {mergedItem.CommunityRating != null && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                                <StarRounded sx={{ fontSize: 16, color: '#f5c518' }} />
                                <Typography variant='caption' sx={{ fontWeight: 700, color: '#f5c518', fontSize: '0.8rem' }}>
                                    {mergedItem.CommunityRating.toFixed(1)}
                                </Typography>
                            </Box>
                        )}

                        {/* Year */}
                        {mergedItem.ProductionYear && (
                            <Typography variant='caption' sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                                {mergedItem.ProductionYear}
                            </Typography>
                        )}

                        {/* Content rating badge */}
                        {mergedItem.OfficialRating && (
                            <Box
                                sx={{
                                    border: '1px solid rgba(255,255,255,0.4)',
                                    borderRadius: '4px',
                                    px: 0.7,
                                    py: 0.1,
                                    lineHeight: 1
                                }}
                            >
                                <Typography variant='caption' sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.65rem', fontWeight: 600 }}>
                                    {mergedItem.OfficialRating}
                                </Typography>
                            </Box>
                        )}

                        <RuntimeOrSeasonCount
                            isSeries={isSeries}
                            mergedItem={mergedItem}
                            runtimeMinutes={runtimeMinutes}
                        />
                    </Box>

                    {/* Episode-specific info */}
                    {isEpisode && (
                        <Box sx={{ mb: 0.8 }}>
                            {/* Series name — smaller, muted */}
                            {mergedItem.SeriesName && (
                                <Typography
                                    variant='caption'
                                    sx={{
                                        display: 'block',
                                        color: 'rgba(255,255,255,0.5)',
                                        fontSize: '0.7rem',
                                        fontWeight: 600,
                                        letterSpacing: '0.03em',
                                        textTransform: 'uppercase',
                                        mb: 0.2
                                    }}
                                >
                                    {mergedItem.SeriesName}
                                </Typography>
                            )}
                            {/* Episode title + S×E */}
                            <Typography variant='body2' sx={{ color: 'white', fontWeight: 600, fontSize: '0.85rem' }}>
                                {episodeLabel && (
                                    <Box component='span' sx={{ color: 'rgba(255,255,255,0.6)', mr: 0.8 }}>
                                        {episodeLabel}
                                    </Box>
                                )}
                                {mergedItem.Name}
                            </Typography>
                        </Box>
                    )}

                    {/* Overview */}
                    {mergedItem.Overview && (
                        <Typography
                            variant='body2'
                            sx={{
                                color: 'rgba(255,255,255,0.65)',
                                fontSize: '0.75rem',
                                lineHeight: 1.5,
                                display: '-webkit-box',
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                mb: genres.length > 0 ? 1.2 : 0
                            }}
                        >
                            {mergedItem.Overview}
                        </Typography>
                    )}

                    {/* Genre pills */}
                    {genres.length > 0 && (
                        <Box sx={{ display: 'flex', gap: 0.7, flexWrap: 'wrap' }}>
                            {genres.map((genre) => (
                                <Chip
                                    key={genre}
                                    label={genre}
                                    size='small'
                                    sx={{
                                        height: 22,
                                        fontSize: '0.65rem',
                                        fontWeight: 600,
                                        backgroundColor: 'rgba(255,255,255,0.1)',
                                        color: 'rgba(255,255,255,0.7)',
                                        border: '1px solid rgba(255,255,255,0.12)',
                                        '&:hover': {
                                            backgroundColor: 'rgba(255,255,255,0.18)'
                                        }
                                    }}
                                />
                            ))}
                        </Box>
                    )}
                </Box>
            </Box>
        </Box>,
        document.body
    );
}

export const MediaCardPopout = React.memo(MediaCardPopoutInner);

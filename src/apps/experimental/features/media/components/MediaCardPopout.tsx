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

interface MediaCardPopoutProps {
    /** The item from the list query (may have partial data) */
    item: ItemDto;
    /** Bounding rect of the hovered card element */
    anchorRect: DOMRect;
    /** Called when the popout should close */
    onClose: () => void;
    /** Called when the mouse enters the popout — lets the parent cancel its close timer */
    onMouseEnterPopout?: () => void;
}

/** Delay before the popout closes when the mouse leaves (ms) */
const CLOSE_DELAY = 300;

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
 */
function MediaCardPopoutInner({ item, anchorRect, onClose, onMouseEnterPopout }: MediaCardPopoutProps) {
    const queryClient = useQueryClient();
    const popoutRef = useRef<HTMLDivElement>(null);
    const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    // Fetch full item details (Overview, Genres, OfficialRating, etc.)
    const { data: fullItem } = useItem(item.Id ?? undefined);
    // Merge: prefer fullItem data when available, fall back to list-level item
    const mergedItem = useMemo(() => ({ ...item, ...fullItem }), [item, fullItem]);

    const { mutateAsync: toggleFavorite } = useToggleFavoriteMutation();
    const { mutateAsync: togglePlayed } = useTogglePlayedMutation();
    const [optFavorite, setOptFavorite] = useState<boolean | null>(null);
    const [optPlayed, setOptPlayed] = useState<boolean | null>(null);

    const isFavorite = optFavorite ?? (mergedItem.UserData?.IsFavorite ?? false);
    const isPlayed = optPlayed ?? (mergedItem.UserData?.Played ?? false);

    // Animate in on mount
    useEffect(() => {
        const frame = requestAnimationFrame(() => setIsVisible(true));
        return () => cancelAnimationFrame(frame);
    }, []);

    // --- Position calculation ---
    const position = useMemo(() => {
        const popoutWidth = 350;
        const popoutMaxHeight = 460;
        const margin = 12;
        const viewportW = window.innerWidth;
        const viewportH = window.innerHeight;

        // Center horizontally on the anchor card
        let left = anchorRect.left + anchorRect.width / 2 - popoutWidth / 2;
        // Clamp to viewport
        if (left < margin) left = margin;
        if (left + popoutWidth > viewportW - margin) left = viewportW - margin - popoutWidth;

        // Position below or above the card, whichever has more space
        let top: number;
        const spaceBelow = viewportH - anchorRect.bottom;
        const spaceAbove = anchorRect.top;

        if (spaceBelow >= popoutMaxHeight + margin || spaceBelow >= spaceAbove) {
            // Position below, overlapping slightly from the card center
            top = anchorRect.top + anchorRect.height * 0.15;
        } else {
            // Position above
            top = anchorRect.bottom - popoutMaxHeight - anchorRect.height * 0.15;
        }

        // Clamp vertically
        if (top < margin) top = margin;
        if (top + popoutMaxHeight > viewportH - margin) {
            top = viewportH - margin - popoutMaxHeight;
        }

        return { left, top, width: popoutWidth };
    }, [anchorRect]);

    // --- Close handling ---
    const clearCloseTimer = useCallback(() => {
        if (closeTimerRef.current) {
            clearTimeout(closeTimerRef.current);
            closeTimerRef.current = null;
        }
    }, []);

    const startCloseTimer = useCallback(() => {
        clearCloseTimer();
        closeTimerRef.current = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onClose, 200); // Wait for exit animation
        }, CLOSE_DELAY);
    }, [clearCloseTimer, onClose]);

    const handleMouseEnter = useCallback(() => {
        clearCloseTimer();
        // Also cancel the parent (MediaRow) close timer so the popout stays mounted
        if (onMouseEnterPopout) onMouseEnterPopout();
    }, [clearCloseTimer, onMouseEnterPopout]);

    const handleMouseLeave = useCallback(() => {
        startCloseTimer();
    }, [startCloseTimer]);

    useEffect(() => {
        return () => clearCloseTimer();
    }, [clearCloseTimer]);

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
                transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease',
                transformOrigin: 'center top',
                pointerEvents: 'auto',
                cursor: 'default'
            }}
        >
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
        </Box>,
        document.body
    );
}

export const MediaCardPopout = React.memo(MediaCardPopoutInner);

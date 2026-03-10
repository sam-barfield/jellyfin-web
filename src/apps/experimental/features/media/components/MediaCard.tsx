import React, { useState, useCallback, useMemo } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import FavoriteIcon from '@mui/icons-material/Favorite';
import CheckCircleOutline from '@mui/icons-material/CheckCircleOutline';
import PlayArrow from '@mui/icons-material/PlayArrow';
import { useQueryClient } from '@tanstack/react-query';

import { type ItemDto } from 'types/base/models/item-dto';
import { CardShape } from 'utils/card';
import Card from 'components/cardbuilder/Card/Card';
import { useToggleFavoriteMutation, useTogglePlayedMutation } from 'hooks/useFetchItems';
import { appRouter } from 'components/router/appRouter';
import { playbackManager } from 'components/playback/playbackmanager';

/**
 * A single card with hover-reveal favourite + played buttons.
 */
export const MediaCard = ({ item, shape, cardOptions, fullWidth = false }: { item: ItemDto; shape: string; cardOptions?: Record<string, unknown>; fullWidth?: boolean }) => {
    const queryClient = useQueryClient();
    const { mutateAsync: toggleFavorite } = useToggleFavoriteMutation();
    const { mutateAsync: togglePlayed } = useTogglePlayedMutation();

    const [optFavorite, setOptFavorite] = useState<boolean | null>(null);
    const [optPlayed, setOptPlayed] = useState<boolean | null>(null);

    const isFavorite = optFavorite ?? (item.UserData?.IsFavorite ?? false);
    const isPlayed = optPlayed ?? (item.UserData?.Played ?? false);

    const handleFavorite = useCallback(async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!item.Id) return;
        const next = !isFavorite;
        setOptFavorite(next);
        try {
            await toggleFavorite({ itemId: item.Id, isFavorite: !next });
            await queryClient.invalidateQueries({ queryKey: ['Items'] });
        } catch { setOptFavorite(null); }
    }, [isFavorite, item.Id, queryClient, toggleFavorite]);

    const handlePlayed = useCallback(async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!item.Id) return;
        const next = !isPlayed;
        setOptPlayed(next);
        try {
            await togglePlayed({ itemId: item.Id, isPlayed: !next });
            await queryClient.invalidateQueries({ queryKey: ['Items'] });
        } catch { setOptPlayed(null); }
    }, [isPlayed, item.Id, queryClient, togglePlayed]);

    const handlePlay = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        playbackManager.play({ items: [item] }).catch(console.error);
    }, [item]);

    const cardOpts = useMemo(() => ({
        ...cardOptions,
        shape: shape === 'backdrop' ? CardShape.Backdrop : CardShape.Portrait,
        showTitle: Boolean(cardOptions?.showTitle ?? true),
        showParentTitle: Boolean(cardOptions?.showParentTitle ?? true),
        showYear: Boolean(cardOptions?.showYear ?? true),
        centerText: Boolean(cardOptions?.centerText ?? true),
        overlayText: Boolean(cardOptions?.overlayText ?? false),
        overlayPlayButton: false, // Disabled default so we can use our custom action bar
        centerPlayButton: false, // Disable the big central play button
        disableHoverMenu: true, // Disable desktop hover menu which renders another play button
        enableMoreOptions: false,
        enablePlayedButton: false,
        enableRatingButton: false,
        allowBottomPadding: Boolean(cardOptions?.allowBottomPadding ?? true),
        cardLayout: Boolean(cardOptions?.cardLayout ?? true)
    } as Record<string, unknown>), [cardOptions, shape]);

    const aspectRatioMap: Record<string, string> = { backdrop: '16/9', portrait: '2/3', square: '1/1' };
    const dynamicAspectRatio = aspectRatioMap[shape] ?? '16/9';

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            appRouter.showItem(item);
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            const next = e.currentTarget.nextElementSibling as HTMLElement | null;
            next?.focus();
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            const prev = e.currentTarget.previousElementSibling as HTMLElement | null;
            prev?.focus();
        }
    }, [item]);

    let cardWidth: string | Record<string, number> = fullWidth ? '100%' : { xs: 120, md: 160 };
    if (!fullWidth && shape === 'backdrop') {
        cardWidth = { xs: 200, md: 280 };
    }

    const handleCardImageClick = useCallback(() => {
        appRouter.showItem(item);
    }, [item]);

    const handleContextMenu = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        import('scripts/inputManager').then(({ default: inputManager }) => {
            inputManager.handleCommand('menu', {
                sourceElement: e.currentTarget
            });
        }).catch(console.error);
    }, []);

    return (
        <Box
            className='media-card-root'
            tabIndex={0}
            role='button'
            aria-label={item.Name ?? 'Media item'}
            onKeyDown={handleKeyDown}
            onContextMenu={handleContextMenu}
            data-id={item.Id}
            data-serverid={item.ServerId}
            data-type={item.Type}
            data-mediatype={item.MediaType}
            data-isfolder={item.IsFolder ? 'true' : 'false'}
            sx={{
                position: 'relative',
                flexShrink: 0,
                width: cardWidth,
                transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'pointer',
                willChange: 'transform',
                backfaceVisibility: 'hidden', // Prevent rendering flicker at end of animation
                WebkitFontSmoothing: 'subpixel-antialiased',
                '&:hover': { transform: 'scale(1.05)', zIndex: 2 },
                // Show action buttons on hover OR keyboard focus
                '&:hover .card-actions': { opacity: 1, transform: 'translateY(0) translateZ(0)' },
                // Adjust spacing and weight for title text
                '& .cardText:first-of-type': {
                    fontSize: { xs: '0.68rem', sm: '0.8rem', md: '0.9rem' },
                    lineHeight: 1.2
                },
                '& .cardText-secondary': {
                    fontSize: { xs: '0.6rem', sm: '0.7rem' },
                    lineHeight: 1.2
                },
                '& .cardText-first': {
                    marginTop: { xs: '-2px', sm: 0 },
                    paddingTop: 0, // Override legacy 0.24em
                    fontWeight: 500
                },
                '& .cardFooter': {
                    paddingTop: 0,
                    paddingBottom: 0 // Override legacy 0.5em
                }
            }}
        >
            <Card item={item} cardOptions={cardOpts} />

            <Box
                className='card-actions'
                onClick={handleCardImageClick}
                sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    boxSizing: 'border-box',
                    aspectRatio: dynamicAspectRatio,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    alignItems: 'flex-end',
                    p: 1,
                    gap: 0.5,
                    opacity: 0,
                    transform: 'translateY(4px) translateZ(0)',
                    transition: 'opacity 0.2s ease, transform 0.2s ease',
                    willChange: 'opacity, transform',
                    backfaceVisibility: 'hidden',
                    zIndex: 5
                }}
            >
                <IconButton
                    size='small'
                    onClick={handlePlay}
                    title='Play'
                    sx={{
                        pointerEvents: 'auto',
                        color: 'white',
                        backgroundColor: 'primary.main',
                        backdropFilter: 'blur(6px)',
                        width: 30,
                        height: 30,
                        '&:hover': {
                            backgroundColor: 'primary.dark',
                            color: 'white'
                        }
                    }}
                >
                    <PlayArrow sx={{ fontSize: 18 }} />
                </IconButton>
                <IconButton
                    size='small'
                    onClick={handleFavorite}
                    title={isFavorite ? 'Remove from favourites' : 'Add to favourites'}
                    sx={{
                        pointerEvents: 'auto',
                        color: isFavorite ? 'error.main' : 'white',
                        backgroundColor: 'rgba(0,0,0,0.65)',
                        backdropFilter: 'blur(6px)',
                        width: 30,
                        height: 30,
                        '&:hover': {
                            backgroundColor: 'rgba(0,0,0,0.85)',
                            color: 'error.light'
                        }
                    }}
                >
                    <FavoriteIcon sx={{ fontSize: 14 }} />
                </IconButton>
                <IconButton
                    size='small'
                    onClick={handlePlayed}
                    title={isPlayed ? 'Mark as unplayed' : 'Mark as played'}
                    sx={{
                        pointerEvents: 'auto',
                        color: isPlayed ? 'success.main' : 'white',
                        backgroundColor: 'rgba(0,0,0,0.65)',
                        backdropFilter: 'blur(6px)',
                        width: 30,
                        height: 30,
                        '&:hover': {
                            backgroundColor: 'rgba(0,0,0,0.85)',
                            color: 'success.light'
                        }
                    }}
                >
                    <CheckCircleOutline sx={{ fontSize: 14 }} />
                </IconButton>
            </Box>
        </Box>
    );
};

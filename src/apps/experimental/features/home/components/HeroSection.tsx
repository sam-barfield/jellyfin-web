import React, { useMemo, useCallback, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { type ItemDto } from 'types/base/models/item-dto';
import { useApi } from 'hooks/useApi';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { playbackManager } from 'components/playback/playbackmanager';
import { appRouter } from 'components/router/appRouter';
import { useToggleFavoriteMutation } from 'hooks/useFetchItems';
import { useQueryClient } from '@tanstack/react-query';

interface HeroSectionProps {
    item?: ItemDto;
    isPending?: boolean;
    /** The pool of hero items being cycled */
    heroItems?: ItemDto[];
    /** Index of the currently active hero item */
    heroIndex?: number;
    /** Callback for when the user swipes left (next) */
    onSwipeLeft?: () => void;
    /** Callback for when the user swipes right (previous) */
    onSwipeRight?: () => void;
    /** Callback for when the user selects a specific hero index */
    onSelect?: (index: number) => void;
}

export const HeroSection = ({ isPending, heroItems = [], heroIndex = 0, onSwipeLeft, onSwipeRight, onSelect }: HeroSectionProps) => {
    const [touchStartX, setTouchStartX] = useState<number | null>(null);
    const [touchEndX, setTouchEndX] = useState<number | null>(null);

    const minSwipeDistance = 50;

    const handlePointerDown = useCallback((e: React.PointerEvent) => {
        // Only track single touch or left click
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        setTouchStartX(e.clientX);
        setTouchEndX(null);
    }, []);

    const handlePointerMove = useCallback((e: React.PointerEvent) => {
        if (touchStartX !== null) {
            setTouchEndX(e.clientX);
        }
    }, [touchStartX]);

    const handlePointerUp = useCallback(() => {
        if (touchStartX === null || touchEndX === null) {
            setTouchStartX(null);
            setTouchEndX(null);
            return;
        }

        const distance = touchStartX - touchEndX;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe && onSwipeLeft) {
            onSwipeLeft();
        } else if (isRightSwipe && onSwipeRight) {
            onSwipeRight();
        }

        setTouchStartX(null);
        setTouchEndX(null);
    }, [touchStartX, touchEndX, onSwipeLeft, onSwipeRight]);

    if (isPending) {
        return (
            <Box sx={{ height: { xs: 300, md: 500 }, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 4, animate: 'pulse' }} />
        );
    }

    if (!heroItems || heroItems.length === 0) return null;

    // Use integer multiples of 100% so translateX never produces a fractional
    // pixel value — fractional percentages cause a 1px subpixel rendering gap.
    const slideOffset = `translateX(-${heroIndex * 100}%)`;

    return (
        <Box
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            sx={{
                position: 'relative',
                height: { xs: 400, md: 600 },
                width: '100%',
                borderRadius: 4,
                overflow: 'hidden',
                // Force a GPU compositing layer so overflow+border-radius clips
                // transformed children correctly, eliminating the 1px edge artifact.
                transform: 'translateZ(0)',
                mb: 4,
                boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                touchAction: 'pan-y', // Allow vertical scroll, capture horizontal swipe
                userSelect: 'none', // Prevent text selection while dragging
                cursor: touchStartX !== null ? 'grabbing' : 'grab'
            }}
        >
            {/* Sliding Track — 100% wide, slides absolutely positioned at 100% intervals */}
            <Box
                sx={{
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    transform: slideOffset,
                    transition: touchStartX !== null ? 'none' : 'transform 0.5s cubic-bezier(0.25, 0.8, 0.25, 1)'
                }}
            >
                {heroItems.map((item, i) => (
                    <Box key={item.Id} sx={{ position: 'absolute', left: `${i * 100}%`, width: '100%', height: '100%' }}>
                        <HeroSlide item={item} />
                    </Box>
                ))}
            </Box>

            {/* Cycling progress bar — CSS animation, no React state per frame */}
            {heroItems.length > 1 && (
                <Box
                    sx={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        display: 'flex',
                        gap: '4px',
                        px: 3,
                        pb: 2,
                        zIndex: 2
                    }}
                >
                    {heroItems.map((hero, i) => (
                        <ProgressSegment
                            key={hero.Id ?? `seg-${i}`}
                            heroIndex={heroIndex}
                            i={i}
                            onSelect={onSelect}
                        />
                    ))}
                </Box>
            )}
        </Box>
    );
};

const HeroSlide = React.memo(({ item }: { item: ItemDto }) => {
    const { api } = useApi();
    const queryClient = useQueryClient();
    const { mutateAsync: toggleFavoriteMutation } = useToggleFavoriteMutation();
    const [isFavoriteOptimistic, setIsFavoriteOptimistic] = React.useState<boolean | null>(null);

    const isFavorite = isFavoriteOptimistic ?? (item?.UserData?.IsFavorite ?? false);

    const onPlayClick = useCallback(() => {
        if (!item) return;
        playbackManager.play({
            items: [item],
            startPositionTicks: item.UserData?.PlaybackPositionTicks || 0
        }).catch(err => {
            console.error('[HeroSection] failed to play', err);
        });
    }, [item]);

    const onTitleClick = useCallback(() => {
        if (item) appRouter.showItem(item);
    }, [item]);

    const onFavoriteClick = useCallback(async () => {
        if (!item?.Id) return;
        const newFavoriteState = !isFavorite;
        setIsFavoriteOptimistic(newFavoriteState);
        try {
            await toggleFavoriteMutation({
                itemId: item.Id,
                isFavorite: !isFavorite // current state to toggle
            });
            await queryClient.invalidateQueries({ queryKey: ['Items'] });
        } catch (e) {
            console.error('[HeroSection] failed to toggle favorite', e);
            setIsFavoriteOptimistic(null); // revert on error
        }
    }, [isFavorite, item?.Id, queryClient, toggleFavoriteMutation]);

    const handleLogoError = useCallback(() => {
        setLogoLoadFailed(true);
    }, []);

    const backdropUrl = useMemo(() => {
        if (!item || !api) return '';
        const apiClient = ServerConnections.currentApiClient();
        if (!item.Id || !apiClient) return '';
        return apiClient.getScaledImageUrl(item.Id, {
            type: 'Backdrop',
            maxWidth: 1920,
            quality: 90
        });
    }, [item, api]);

    const logoUrl = useMemo(() => {
        if (!item || !api) return '';
        const apiClient = ServerConnections.currentApiClient();
        if (!item.Id || !apiClient) return '';
        return apiClient.getScaledImageUrl(item.Id, {
            type: 'Logo',
            maxWidth: 600,
            quality: 90
        });
    }, [item, api]);

    const [logoLoadFailed, setLogoLoadFailed] = useState(false);
    // Reset failure flag when the item changes
    React.useEffect(() => {
        setLogoLoadFailed(false);
    }, [item?.Id]);

    return (
        <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
            {/* Backdrop Image */}
            <Box
                sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundImage: `url(${backdropUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    '&::after': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'linear-gradient(to right, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0) 100%), linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 50%)'
                    }
                }}
            />

            {/* Content Overlay */}
            <Box
                sx={{
                    position: 'relative',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    px: { xs: 4, md: 8 },
                    pb: { xs: 12, md: 0 }, // Increased padding to push content higher on mobile
                    zIndex: 1
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        maxWidth: { xs: '100%', md: '55%' }
                    }}
                >
                    {logoUrl && !logoLoadFailed ? (
                        <ButtonBase
                            onClick={onTitleClick}
                            sx={{ alignSelf: 'flex-start', mb: { xs: 1.5, md: 3 } }}
                            disableRipple
                        >
                            <img
                                src={logoUrl}
                                alt={item.Name ?? undefined}
                                onError={handleLogoError}
                                style={{
                                    maxHeight: 120, // Slightly smaller on mobile
                                    maxWidth: '100%',
                                    objectFit: 'contain',
                                    filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))'
                                }}
                            />
                        </ButtonBase>
                    ) : (
                        <ButtonBase
                            onClick={onTitleClick}
                            sx={{ alignSelf: 'flex-start', textAlign: 'left' }}
                            disableRipple
                        >
                            <Typography
                                variant='h2'
                                sx={{
                                    fontWeight: 900,
                                    mb: 2,
                                    fontSize: { xs: '2.5rem', md: '4rem' },
                                    textShadow: '0 4px 10px rgba(0,0,0,0.5)',
                                    letterSpacing: '-0.02em',
                                    lineHeight: 1.1,
                                    display: 'inline-block',
                                    transition: 'color 0.2s ease',
                                    '&:hover': {
                                        color: 'primary.main'
                                    }
                                }}
                            >
                                {item.Name}
                            </Typography>
                        </ButtonBase>
                    )}

                    <Box sx={{ display: 'flex', gap: 2, mb: { xs: 1.5, md: 3 }, alignItems: 'center' }}>
                        {!!item.ProductionYear && (
                            <Typography variant='subtitle2' sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '1rem' }}>
                                {item.ProductionYear}
                            </Typography>
                        )}
                        {item.CommunityRating && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <FavoriteIcon sx={{ fontSize: 16, color: 'error.main' }} />
                                <Typography variant='subtitle2' sx={{ fontWeight: 600, fontSize: '1rem' }}>
                                    {item.CommunityRating.toFixed(1)}
                                </Typography>
                            </Box>
                        )}
                        {item.Type === 'Series' && !!item.ChildCount && (
                            <Typography variant='subtitle2' sx={{ opacity: 0.7, fontWeight: 600, fontSize: '1rem' }}>
                                {item.ChildCount} Season{item.ChildCount !== 1 ? 's' : ''}
                            </Typography>
                        )}
                        {item.Type !== 'Series' && !!item.RunTimeTicks && item.RunTimeTicks > 0 && (
                            <Typography variant='subtitle2' sx={{ opacity: 0.7, fontWeight: 600, fontSize: '1rem' }}>
                                {Math.floor(item.RunTimeTicks / 600000000)} min
                            </Typography>
                        )}
                    </Box>

                    <Typography
                        variant='body1'
                        sx={{
                            mb: { xs: 2.5, md: 4 },
                            display: '-webkit-box',
                            WebkitLineClamp: { xs: 2, md: 3 },
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            opacity: 0.8,
                            lineHeight: 1.6,
                            maxWidth: 500
                        }}
                    >
                        {item.Overview}
                    </Typography>

                    <Box sx={{
                        display: 'flex',
                        gap: 1.2,
                        flexDirection: 'row',
                        width: 'auto'
                    }}>
                        <Button
                            variant='contained'
                            size='large'
                            startIcon={<PlayArrowIcon />}
                            onClick={onPlayClick}
                            sx={{
                                borderRadius: '12px',
                                px: { xs: 2, sm: 4 },
                                py: { xs: 1.2, sm: 1.5 },
                                fontSize: { xs: '0.95rem', sm: '1.1rem' },
                                fontWeight: 'bold',
                                textTransform: 'none',
                                backgroundColor: '#00A4DC', // Jellyfin Blue
                                '&:hover': {
                                    backgroundColor: '#0084B0'
                                },
                                boxShadow: '0 8px 16px rgba(0,164,220,0.3)',
                                width: 'auto'
                            }}
                        >
                            Play
                        </Button>
                        <Button
                            variant='outlined'
                            size='large'
                            startIcon={<FavoriteIcon sx={{ color: isFavorite ? 'error.main' : 'inherit' }} />}
                            onClick={onFavoriteClick}
                            sx={{
                                borderRadius: '12px',
                                px: { xs: 2, sm: 4 },
                                py: { xs: 1.2, sm: 1.5 },
                                fontSize: { xs: '0.95rem', sm: '1.1rem' },
                                fontWeight: 'bold',
                                textTransform: 'none',
                                color: 'white',
                                borderColor: 'rgba(255,255,255,0.3)',
                                backgroundColor: 'rgba(255,255,255,0.1)',
                                backdropFilter: 'blur(10px)',
                                '&:hover': {
                                    borderColor: 'rgba(255,255,255,0.5)',
                                    backgroundColor: 'rgba(255,255,255,0.2)'
                                },
                                width: 'auto'
                            }}
                        >
                            {isFavorite ? 'In Favourites' : 'Favourite'}
                        </Button>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
});
HeroSlide.displayName = 'HeroSlide';

const ProgressSegment = React.memo(({ heroIndex, i, onSelect }: { heroIndex: number, i: number, onSelect?: (index: number) => void }) => {
    const handleClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        if (onSelect) onSelect(i);
    }, [onSelect, i]);

    return (
        <Box
            onClick={handleClick}
            sx={{
                flex: 1,
                height: 4,
                borderRadius: 99,
                backgroundColor: 'rgba(255,255,255,0.25)',
                overflow: 'hidden',
                cursor: 'pointer'
            }}
        >
            {i <= heroIndex && (
                <Box
                    // key forces DOM remount on hero change, restarting the animation
                    key={i === heroIndex ? `active-${heroIndex}` : `done-${i}`}
                    sx={{
                        height: '100%',
                        borderRadius: 99,
                        backgroundColor: 'white',
                        transformOrigin: 'left center',
                        ...(i < heroIndex ?
                            { transform: 'scaleX(1)' } :
                            {
                                animation: 'heroBarFill 12s linear forwards',
                                '@keyframes heroBarFill': {
                                    from: { transform: 'scaleX(0)' },
                                    to: { transform: 'scaleX(1)' }
                                }
                            }
                        )
                    }}
                />
            )}
        </Box>
    );
});
ProgressSegment.displayName = 'ProgressSegment';

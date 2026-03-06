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
}

export const HeroSection = ({ item, isPending, heroItems = [], heroIndex = 0 }: HeroSectionProps) => {
    const { api } = useApi();
    const queryClient = useQueryClient();
    const { mutateAsync: toggleFavoriteMutation } = useToggleFavoriteMutation();
    const [isFavoriteOptimistic, setIsFavoriteOptimistic] = React.useState<boolean | null>(null);

    const isFavorite = isFavoriteOptimistic ?? (item?.UserData?.IsFavorite ?? false);

    const onPlayClick = useCallback(() => {
        if (!item) return;
        playbackManager.play({
            items: [item]
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

    if (isPending) {
        return (
            <Box sx={{ height: { xs: 300, md: 500 }, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 4, animate: 'pulse' }} />
        );
    }

    if (!item) return null;

    return (
        <Box
            sx={{
                position: 'relative',
                height: { xs: 400, md: 600 },
                width: '100%',
                borderRadius: 4,
                overflow: 'hidden',
                mb: 4,
                boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
            }}
        >
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
                            sx={{ alignSelf: 'flex-start', mb: 3 }}
                            disableRipple
                        >
                            <img
                                src={logoUrl}
                                alt={item.Name ?? undefined}
                                onError={handleLogoError}
                                style={{
                                    maxHeight: 150,
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

                    <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
                        <Typography variant='subtitle1' sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                            {item.ProductionYear}
                        </Typography>
                        {item.CommunityRating && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <FavoriteIcon sx={{ fontSize: 16, color: 'error.main' }} />
                                <Typography variant='subtitle2' sx={{ fontWeight: 'bold' }}>
                                    {item.CommunityRating.toFixed(1)}
                                </Typography>
                            </Box>
                        )}
                        {!!item.RunTimeTicks && item.RunTimeTicks > 0 && (
                            <Typography variant='subtitle2' sx={{ opacity: 0.7 }}>
                                {Math.floor(item.RunTimeTicks / 600000000)} min
                            </Typography>
                        )}
                    </Box>

                    <Typography
                        variant='body1'
                        sx={{
                            mb: 4,
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            opacity: 0.8,
                            lineHeight: 1.6,
                            maxWidth: 500
                        }}
                    >
                        {item.Overview}
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button
                            variant='contained'
                            size='large'
                            startIcon={<PlayArrowIcon />}
                            onClick={onPlayClick}
                            sx={{
                                borderRadius: '12px',
                                px: 4,
                                py: 1.5,
                                fontSize: '1.1rem',
                                fontWeight: 'bold',
                                textTransform: 'none',
                                backgroundColor: '#00A4DC', // Jellyfin Blue
                                '&:hover': {
                                    backgroundColor: '#0084B0'
                                },
                                boxShadow: '0 8px 16px rgba(0,164,220,0.3)'
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
                                px: 4,
                                py: 1.5,
                                fontSize: '1.1rem',
                                fontWeight: 'bold',
                                textTransform: 'none',
                                color: 'white',
                                borderColor: 'rgba(255,255,255,0.3)',
                                backgroundColor: 'rgba(255,255,255,0.1)',
                                backdropFilter: 'blur(10px)',
                                '&:hover': {
                                    borderColor: 'rgba(255,255,255,0.5)',
                                    backgroundColor: 'rgba(255,255,255,0.2)'
                                }
                            }}
                        >
                            {isFavorite ? 'In Favourites' : 'Favourite'}
                        </Button>
                    </Box>
                </Box>
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
                        <Box
                            key={hero.Id ?? `seg-${i}`}
                            sx={{
                                flex: 1,
                                height: 3,
                                borderRadius: 99,
                                backgroundColor: 'rgba(255,255,255,0.25)',
                                overflow: 'hidden'
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
                    ))}
                </Box>
            )}
        </Box>
    );
};

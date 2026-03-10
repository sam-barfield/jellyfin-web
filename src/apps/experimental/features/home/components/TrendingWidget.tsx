import React, { useCallback, useMemo, useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import ButtonBase from '@mui/material/ButtonBase';
import IconButton from '@mui/material/IconButton';
import PlayArrow from '@mui/icons-material/PlayArrow';
import CheckCircleOutline from '@mui/icons-material/CheckCircleOutline';
import FavoriteIcon from '@mui/icons-material/Favorite';
import Collapse from '@mui/material/Collapse';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { type ItemDto } from 'types/base/models/item-dto';
import { appRouter } from 'components/router/appRouter';
import { playbackManager } from 'components/playback/playbackmanager';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { useToggleFavoriteMutation, useTogglePlayedMutation } from 'hooks/useFetchItems';
import { useQueryClient } from '@tanstack/react-query';
import { useApi } from 'hooks/useApi';

const TrendingRow = ({ item, index }: { item: ItemDto; index: number }) => {
    const { api } = useApi();
    const queryClient = useQueryClient();
    const { mutateAsync: toggleFavorite } = useToggleFavoriteMutation();
    const { mutateAsync: togglePlayed } = useTogglePlayedMutation();

    const [optFavorite, setOptFavorite] = useState<boolean | null>(null);
    const [optPlayed, setOptPlayed] = useState<boolean | null>(null);

    const isFavorite = optFavorite ?? (item.UserData?.IsFavorite ?? false);
    const isPlayed = optPlayed ?? (item.UserData?.Played ?? false);

    // Uniform size for all rows
    const imgW = 72;
    const imgH = 108;
    const rankFontSize = '2rem';

    // Type-safe mapping for custom anime metadata attached by backend
    const tagItem = item as ItemDto & { IsAnime?: boolean; DubAvailable?: string; SubAvailable?: string };

    const thumbUrl = useMemo(() => {
        if (!item || !api) return '';
        const apiClient = ServerConnections.currentApiClient();
        if (!item.Id || !apiClient) return '';
        return apiClient.getScaledImageUrl(item.Id, { type: 'Primary', maxWidth: 200, quality: 90 });
    }, [item, api]);

    const handleRowClick = useCallback(() => {
        appRouter.showItem(item);
    }, [item]);

    const handlePlay = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        playbackManager.play({ items: [item] }).catch(console.error);
    }, [item]);

    const handleFavorite = useCallback(async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!item.Id) return;
        const nextState = !isFavorite;
        setOptFavorite(nextState);
        try {
            await toggleFavorite({ itemId: item.Id, isFavorite: !nextState });
            await queryClient.invalidateQueries({ queryKey: ['Items'] });
        } catch { setOptFavorite(null); }
    }, [isFavorite, item.Id, queryClient, toggleFavorite]);

    const handlePlayed = useCallback(async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!item.Id) return;
        const nextState = !isPlayed;
        setOptPlayed(nextState);
        try {
            await togglePlayed({ itemId: item.Id, isPlayed: !nextState });
            await queryClient.invalidateQueries({ queryKey: ['Items'] });
        } catch { setOptPlayed(null); }
    }, [isPlayed, item.Id, queryClient, togglePlayed]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleRowClick();
        } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
            e.preventDefault();
            const next = e.currentTarget.nextElementSibling as HTMLElement | null;
            next?.focus();
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
            e.preventDefault();
            const prev = e.currentTarget.previousElementSibling as HTMLElement | null;
            prev?.focus();
        }
    }, [handleRowClick]);

    return (
        <Box
            onClick={handleRowClick}
            onKeyDown={handleKeyDown}
            tabIndex={0}
            role='button'
            aria-label={item.Name ?? 'Trending item'}
            className='trending-row-item'
            sx={{
                display: 'flex',
                alignItems: { xs: 'flex-start', sm: 'center' }, // Top-align on mobile so title sits nicely
                gap: { xs: 0.5, sm: 1.5 }, // Reduced gap on mobile
                cursor: 'pointer',
                position: 'relative',
                py: 0.5,
                overflow: 'visible',
                transition: 'all 0.2s ease',
                // Mobile: tight fixed-width card for horizontal scroll
                width: { xs: 80, sm: 'unset' }, // Replaced minWidth/maxWidth with tight standard width
                flexShrink: 0,
                flexDirection: { xs: 'column', sm: 'row' },
                '&:hover, &:focus-visible': {
                    zIndex: 10,
                    '& .trending-poster': {
                        transform: 'scale(1.05) translateY(-2px)',
                        boxShadow: '0 14px 36px rgba(0,0,0,0.75)',
                        zIndex: 10
                    },
                    '& .hover-actions': { opacity: 1, transform: 'translateY(0)' }
                }
            }}
        >
            {/* Mobile Title - Renders above poster */}
            <Typography
                sx={{
                    display: { xs: '-webkit-box', sm: 'none' },
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    lineHeight: 1.2,
                    mb: 0.5,
                    width: '100%',
                    minHeight: '2.4em', // Enforce height of 2 lines so posters align perfectly
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                }}
            >
                {item.Name}
            </Typography>

            {/* Poster with rank overlaid */}
            <Box
                className='trending-poster'
                sx={{
                    position: 'relative',
                    width: imgW,
                    height: imgH,
                    flexShrink: 0,
                    borderRadius: '10px',
                    overflow: 'hidden',
                    backgroundColor: 'rgba(0,0,0,0.35)',
                    boxShadow: '0 6px 20px rgba(0,0,0,0.55)',
                    transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                    zIndex: 10
                }}
            >
                {!!thumbUrl && (
                    <img
                        src={thumbUrl}
                        alt={item.Name || ''}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                )}
                <Box sx={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.05) 40%, transparent 60%)'
                }} />
                <Typography sx={{
                    position: 'absolute', bottom: 4, left: 6,
                    fontSize: rankFontSize, fontWeight: 900, lineHeight: 1,
                    color: 'white', letterSpacing: '-0.06em',
                    textShadow: '0 2px 12px rgba(0,0,0,1)', fontFamily: 'inherit'
                }}>
                    {index + 1}
                </Typography>

                {Boolean(tagItem.IsAnime && (tagItem.DubAvailable || tagItem.SubAvailable)) && (
                    <Box sx={{
                        position: 'absolute',
                        top: '4px',
                        left: '4px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 0.5,
                        zIndex: 2,
                        pointerEvents: 'none'
                    }}>
                        {tagItem.DubAvailable === 'Full' && <Box sx={{ backgroundColor: 'rgba(43, 179, 66, 0.7)', backdropFilter: 'blur(8px)', color: '#fff', fontSize: '0.6rem', fontWeight: 800, px: 0.75, py: 0.15, borderRadius: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', letterSpacing: '0.05em' }}>DUB</Box>}
                        {tagItem.DubAvailable === 'Partial' && <Box sx={{ backgroundColor: 'rgba(201, 43, 64, 0.7)', backdropFilter: 'blur(8px)', color: '#fff', fontSize: '0.6rem', fontWeight: 800, px: 0.75, py: 0.15, borderRadius: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', letterSpacing: '0.05em' }}>DUB</Box>}
                        {tagItem.SubAvailable === 'Full' && <Box sx={{ backgroundColor: 'rgba(153, 53, 192, 0.7)', backdropFilter: 'blur(8px)', color: '#fff', fontSize: '0.6rem', fontWeight: 800, px: 0.75, py: 0.15, borderRadius: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', letterSpacing: '0.05em' }}>SUB</Box>}
                        {tagItem.SubAvailable === 'Partial' && <Box sx={{ backgroundColor: 'rgba(201, 43, 64, 0.7)', backdropFilter: 'blur(8px)', color: '#fff', fontSize: '0.6rem', fontWeight: 800, px: 0.75, py: 0.15, borderRadius: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', letterSpacing: '0.05em' }}>SUB</Box>}
                    </Box>
                )}
            </Box>

            {/* Details — hidden on mobile horizontal strip */}
            <Box sx={{ flexGrow: 1, minWidth: 0, display: { xs: 'none', sm: 'block' } }}>
                <Typography
                    sx={{ fontWeight: 700, fontSize: '1rem', lineHeight: 1.3, mb: 0.5, letterSpacing: '0.01em' }}
                    noWrap
                >
                    {item.Name}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    {!!item.ProductionYear && (
                        <Typography variant='body2' color='text.secondary' sx={{ opacity: 0.7, fontWeight: 600, fontSize: '0.8rem' }}>
                            {item.ProductionYear}
                        </Typography>
                    )}
                    {!!item.CommunityRating && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <FavoriteIcon sx={{ fontSize: 12, color: 'error.main' }} />
                            <Typography variant='body2' color='text.secondary' sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
                                {item.CommunityRating.toFixed(1)}
                            </Typography>
                        </Box>
                    )}
                    {item.Type === 'Series' && !!item.ChildCount && (
                        <Typography variant='body2' color='text.secondary' sx={{ opacity: 0.7, fontWeight: 600, fontSize: '0.8rem' }}>
                            {item.ChildCount} Season{item.ChildCount !== 1 ? 's' : ''}
                        </Typography>
                    )}
                    {item.Type !== 'Series' && !!item.RunTimeTicks && item.RunTimeTicks > 0 && (
                        <Typography variant='body2' color='text.secondary' sx={{ opacity: 0.7, fontWeight: 600, fontSize: '0.8rem' }}>
                            {Math.floor(item.RunTimeTicks / 600000000)}m
                        </Typography>
                    )}
                </Box>
            </Box>

            {/* Hover actions — bottom-right */}
            <Box
                className='hover-actions'
                sx={{
                    position: 'absolute', right: 0, bottom: 4,
                    display: 'flex', alignItems: 'center', gap: 0.5,
                    opacity: 0, transform: 'translateY(4px)',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    pr: 0.5
                }}
            >
                <IconButton size='small' onClick={handlePlay} sx={{ color: 'white', backgroundColor: 'rgba(0,164,220,0.25)', '&:hover': { backgroundColor: 'primary.main' } }}>
                    <PlayArrow fontSize='small' />
                </IconButton>
                <IconButton size='small' onClick={handleFavorite} sx={{ color: isFavorite ? 'error.main' : 'text.secondary', '&:hover': { color: 'error.light', backgroundColor: 'rgba(255,255,255,0.1)' } }}>
                    <FavoriteIcon fontSize='small' />
                </IconButton>
                <IconButton size='small' onClick={handlePlayed} sx={{ color: isPlayed ? 'success.main' : 'text.secondary', '&:hover': { color: 'success.light', backgroundColor: 'rgba(255,255,255,0.1)' } }}>
                    <CheckCircleOutline fontSize='small' />
                </IconButton>
            </Box>
        </Box>
    );
};

const TRENDING_STORAGE_KEY = 'home_trending_collapsed';

interface TrendingWidgetProps {
    trendingMovies: ItemDto[];
    trendingShows: ItemDto[];
}

export const TrendingWidget = ({ trendingMovies, trendingShows }: TrendingWidgetProps) => {
    const [tab, setTab] = useState<'Movies' | 'Shows'>('Shows');

    const [isCollapsed, setIsCollapsed] = useState(() => {
        const saved = localStorage.getItem(TRENDING_STORAGE_KEY);
        // Default to OPEN (false) if no saved state
        return saved === 'true';
    });

    useEffect(() => {
        localStorage.setItem(TRENDING_STORAGE_KEY, String(isCollapsed));
    }, [isCollapsed]);

    const handleToggleCollapse = useCallback(() => {
        setIsCollapsed((prev: boolean) => !prev);
    }, []);

    const handleTabShows = useCallback(() => setTab('Shows'), []);
    const handleTabMovies = useCallback(() => setTab('Movies'), []);

    const activeItems = tab === 'Shows' ? trendingShows : trendingMovies;

    return (
        <Box sx={{ mb: 4 }}>
            <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant='h6' component='h2' sx={{ fontWeight: 800, letterSpacing: '-0.02em', fontSize: '1.5rem' }}>
                    Top Trending
                </Typography>
                <IconButton
                    size='small'
                    onClick={handleToggleCollapse}
                    sx={{ color: 'text.secondary' }}
                >
                    {isCollapsed ? <ExpandMoreIcon /> : <ExpandLessIcon />}
                </IconButton>
            </Box>
            <Typography variant='body2' sx={{ color: 'text.secondary', fontSize: '0.75rem', mb: 3, opacity: 0.7 }}>
                Current most trending shows and movies.
            </Typography>

            <Collapse in={!isCollapsed}>
                <Paper
                    elevation={0}
                    sx={{
                        p: { xs: 1.5, sm: 2.5 },
                        backgroundColor: 'rgba(20, 20, 20, 0.4)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        borderRadius: '24px',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                        overflow: 'visible'
                    }}
                >
                    {/* Pill Tab Toggle */}
                    <Box
                        sx={{
                            display: 'flex',
                            backgroundColor: 'rgba(0, 0, 0, 0.2)',
                            borderRadius: '30px',
                            p: 0.5,
                            mb: 3
                        }}
                    >
                        <ButtonBase
                            onClick={handleTabShows}
                            sx={{
                                flex: 1,
                                py: 1,
                                borderRadius: '24px',
                                backgroundColor: tab === 'Shows' ? 'primary.main' : 'transparent',
                                color: tab === 'Shows' ? 'white' : 'text.secondary',
                                fontWeight: 700,
                                fontFamily: 'inherit',
                                fontSize: '0.85rem',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            TV Shows
                        </ButtonBase>
                        <ButtonBase
                            onClick={handleTabMovies}
                            sx={{
                                flex: 1,
                                py: 1,
                                borderRadius: '24px',
                                backgroundColor: tab === 'Movies' ? 'primary.main' : 'transparent',
                                color: tab === 'Movies' ? 'white' : 'text.secondary',
                                fontWeight: 700,
                                fontFamily: 'inherit',
                                fontSize: '0.85rem',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            Movies
                        </ButtonBase>
                    </Box>

                    {/* List Items — vertical scroll on desktop, horizontal strip on mobile */}
                    <Box sx={{
                        // Desktop: vertical column
                        display: 'flex',
                        flexDirection: { xs: 'row', sm: 'column' },
                        gap: { xs: 0.5, sm: 1.5 },
                        // Mobile: horizontal scroll
                        overflowX: { xs: 'auto', sm: 'visible' },
                        overflowY: { xs: 'hidden', sm: 'auto' },
                        mx: { xs: -1.5, sm: -0.5 }, // Pull container boundaries into parent padding
                        px: { xs: 1.5, sm: 0.5 }, // Push content back to original alignment
                        maxHeight: { xs: 'none', sm: 520 },
                        pb: { xs: 1, sm: 0.5 },
                        pr: { xs: 0, sm: 0.5 },
                        scrollbarWidth: 'none',
                        '&::-webkit-scrollbar': { display: { xs: 'none', sm: 'block' }, width: 4 },
                        '&::-webkit-scrollbar-track': { background: 'transparent' },
                        '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.15)', borderRadius: 2 },
                        '&::-webkit-scrollbar-thumb:hover': { background: 'rgba(255,255,255,0.3)' }
                    }}>
                        {activeItems.length > 0 ? (
                            activeItems.map((item, index) => (
                                <TrendingRow key={`${tab}-${item.Id}`} item={item} index={index} />
                            ))
                        ) : (
                            <Typography variant='body2' color='text.secondary' sx={{ textAlign: 'center', py: 4 }}>
                                No trending {tab.toLowerCase()} found.
                            </Typography>
                        )}
                    </Box>
                </Paper>
            </Collapse>
        </Box>
    );
};

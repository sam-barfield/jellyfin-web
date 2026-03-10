import React, { useMemo, useState, useCallback, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid2';
import ButtonBase from '@mui/material/ButtonBase';

import { useGetItems } from 'hooks/useFetchItems';
import { ItemFields } from '@jellyfin/sdk/lib/generated-client/models/item-fields';
import { ImageType } from '@jellyfin/sdk/lib/generated-client/models/image-type';
import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models/item-sort-by';
import { SortOrder } from '@jellyfin/sdk/lib/generated-client/models/sort-order';
import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { MediaCard } from '../media/components/MediaCard';
import { useBackdropColor } from 'hooks/useBackdropColor';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import type { ItemDto } from 'types/base/models/item-dto';

// Icons
import FavoriteRounded from '@mui/icons-material/FavoriteRounded';
import MovieRounded from '@mui/icons-material/MovieRounded';
import TvRounded from '@mui/icons-material/TvRounded';
import VideoLibraryRounded from '@mui/icons-material/VideoLibraryRounded';
import CollectionsBookmarkRounded from '@mui/icons-material/CollectionsBookmarkRounded';
import LiveTvRounded from '@mui/icons-material/LiveTvRounded';
import MusicNoteRounded from '@mui/icons-material/MusicNoteRounded';

const TABS = [
    { label: 'All', types: [] as BaseItemKind[], icon: <FavoriteRounded sx={{ fontSize: '1.1rem' }} /> },
    { label: 'Movies', types: ['Movie'] as BaseItemKind[], icon: <MovieRounded sx={{ fontSize: '1.1rem' }} /> },
    { label: 'Shows', types: ['Series'] as BaseItemKind[], icon: <TvRounded sx={{ fontSize: '1.1rem' }} /> },
    { label: 'Episodes', types: ['Episode'] as BaseItemKind[], icon: <VideoLibraryRounded sx={{ fontSize: '1.1rem' }} /> },
    { label: 'Collections', types: ['BoxSet'] as BaseItemKind[], icon: <CollectionsBookmarkRounded sx={{ fontSize: '1.1rem' }} /> },
    { label: 'Live TV', types: ['LiveTvChannel', 'LiveTvProgram'] as BaseItemKind[], icon: <LiveTvRounded sx={{ fontSize: '1.1rem' }} /> },
    { label: 'Music', types: ['MusicArtist', 'MusicAlbum', 'Audio', 'MusicVideo'] as BaseItemKind[], icon: <MusicNoteRounded sx={{ fontSize: '1.1rem' }} /> }
];

const TabButton = ({ tab, idx, activeTab, onClick }: { tab: typeof TABS[0], idx: number, activeTab: number, onClick: (idx: number) => void }) => {
    const handleTabClick = useCallback(() => {
        onClick(idx);
    }, [onClick, idx]);

    const isActive = activeTab === idx;

    return (
        <ButtonBase
            onClick={handleTabClick}
            className='home-nav-item'
            sx={{
                px: 2.2,
                py: 1.1,
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: 1.2,
                transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                position: 'relative',
                overflow: 'hidden',
                background: isActive ?
                    'linear-gradient(135deg, #00a4dc 0%, #007bb5 100%)' :
                    'rgba(255, 255, 255, 0.03)',
                backdropFilter: isActive ? 'none' : 'blur(12px)',
                border: '1px solid',
                borderColor: isActive ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                color: isActive ? 'white' : 'rgba(255, 255, 255, 0.6)',
                boxShadow: isActive ? '0 4px 15px rgba(0, 164, 220, 0.4)' : 'none',
                '&:hover': {
                    background: isActive ?
                        'linear-gradient(135deg, #00b4ec 0%, #008cc5 100%)' :
                        'rgba(255, 255, 255, 0.08)',
                    color: 'white',
                    transform: 'translateY(-2px) scale(1.02)',
                    '& .tab-icon': {
                        transform: 'scale(1.1) rotate(-5deg)'
                    }
                }
            }}
        >
            <Box className='tab-icon' sx={{
                display: 'flex',
                transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                color: isActive ? 'white' : 'rgba(255, 255, 255, 0.4)'
            }}>
                {tab.icon}
            </Box>
            <Typography sx={{
                fontWeight: isActive ? 700 : 600,
                fontSize: '0.88rem',
                letterSpacing: '0.01em',
                userSelect: 'none'
            }}>
                {tab.label}
            </Typography>
        </ButtonBase>
    );
};

export const ModernFavorites = ({ onColorChange }: { onColorChange?: (color: string | null) => void }) => {
    const [activeTab, setActiveTab] = useState(0);

    const handleTabChange = useCallback((idx: number) => {
        setActiveTab(idx);
    }, []);

    const activeFilter = TABS[activeTab];

    const { data: favoritesData, isPending, isError } = useGetItems({
        filters: ['IsFavorite'],
        recursive: true,
        sortBy: [ItemSortBy.SortName],
        sortOrder: [SortOrder.Ascending],
        includeItemTypes: activeFilter.types.length > 0 ? activeFilter.types : undefined,
        fields: [
            ItemFields.PrimaryImageAspectRatio,
            'ImageTags' as ItemFields,
            'ServerId' as ItemFields,
            'IsAnime' as ItemFields,
            'DubAvailable' as ItemFields,
            'SubAvailable' as ItemFields,
            'DubAvailability' as ItemFields,
            'SubAvailability' as ItemFields
        ],
        enableUserData: true,
        enableImageTypes: [ImageType.Primary, ImageType.Thumb, ImageType.Backdrop],
        imageTypeLimit: 1
    });

    const items = useMemo(() => favoritesData?.Items ?? [], [favoritesData]);

    const samplingItem = useMemo(() => {
        // Prefer an item with a backdrop tag
        const backdropItem = items.find((item: ItemDto) => item.ImageTags?.Backdrop);
        if (backdropItem) return { item: backdropItem, type: 'Backdrop' };

        // Fallback to the first item with a primary image tag
        const primaryItem = items.find((item: ItemDto) => item.ImageTags?.Primary);
        if (primaryItem) return { item: primaryItem, type: 'Primary' };

        return null;
    }, [items]);

    const apiClient = ServerConnections.currentApiClient();
    const backdropUrl = samplingItem?.item.Id ?
        (apiClient?.getScaledImageUrl(samplingItem.item.Id, {
            type: samplingItem.type as 'Backdrop' | 'Primary',
            maxWidth: 400,
            quality: 60
        }) ?? undefined) :
        undefined;

    const bgColor = useBackdropColor(backdropUrl);

    useEffect(() => {
        if (onColorChange) {
            onColorChange(bgColor);
        }
    }, [bgColor, onColorChange]);

    return (
        <Box sx={{ pb: 8 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, gap: 1, flexWrap: 'wrap' }}>
                {TABS.map((tab, idx) => (
                    <TabButton
                        key={tab.label}
                        tab={tab}
                        idx={idx}
                        activeTab={activeTab}
                        onClick={handleTabChange}
                    />
                ))}
            </Box>

            {isPending && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                    <CircularProgress />
                </Box>
            )}

            {isError && (
                <Box sx={{ textAlign: 'center', py: 10 }}>
                    <Typography color='error'>Failed to load favorites. Please try again.</Typography>
                </Box>
            )}

            {!isPending && !isError && items.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 10 }}>
                    <Typography variant='h6' color='text.secondary' sx={{ opacity: 0.7 }}>
                        No favorites found.
                    </Typography>
                </Box>
            )}

            {!isPending && !isError && items.length > 0 && (
                <Grid
                    container
                    spacing={{ xs: 2, sm: 3 }}
                    justifyContent={{ xs: 'center', sm: 'flex-start' }}
                    sx={{ mt: 2 }}
                >
                    {items.map((item) => {
                        const isPortrait = !['Episode', 'Audio', 'MusicVideo'].includes(item.Type || '');
                        const shape = isPortrait ? 'portrait' : 'backdrop';
                        return (
                            <Grid
                                key={item.Id}
                                size='auto'
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'center'
                                }}
                            >
                                <MediaCard
                                    item={item}
                                    shape={shape}
                                    cardOptions={{
                                        showTitle: true,
                                        showYear: true,
                                        showParentTitle: true
                                    }}
                                />
                            </Grid>
                        );
                    })}
                </Grid>
            )}
        </Box>
    );
};

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
import { MediaCard } from '../home/components/MediaRow';
import { useBackdropColor } from 'hooks/useBackdropColor';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import type { ItemDto } from 'types/base/models/item-dto';

const TABS = [
    { label: 'All', types: [] as BaseItemKind[] },
    { label: 'Movies', types: ['Movie'] as BaseItemKind[] },
    { label: 'Shows', types: ['Series'] as BaseItemKind[] },
    { label: 'Episodes', types: ['Episode'] as BaseItemKind[] },
    { label: 'Collections', types: ['BoxSet'] as BaseItemKind[] },
    { label: 'Live TV', types: ['LiveTvChannel', 'LiveTvProgram'] as BaseItemKind[] },
    { label: 'Music', types: ['MusicArtist', 'MusicAlbum', 'Audio', 'MusicVideo'] as BaseItemKind[] }
];

const TabButton = ({ tab, idx, activeTab, onClick }: { tab: { label: string }, idx: number, activeTab: number, onClick: (idx: number) => void }) => {
    const handleTabClick = useCallback(() => {
        onClick(idx);
    }, [onClick, idx]);

    return (
        <ButtonBase
            onClick={handleTabClick}
            className='home-nav-item'
            sx={{
                px: 2.5,
                py: 1,
                borderRadius: '24px',
                backgroundColor: activeTab === idx ? 'primary.main' : 'rgba(255,255,255,0.05)',
                color: activeTab === idx ? 'white' : 'text.secondary',
                fontWeight: activeTab === idx ? 700 : 500,
                fontFamily: 'inherit',
                fontSize: '0.85rem',
                transition: 'all 0.3s ease',
                border: '1px solid',
                borderColor: activeTab === idx ? 'transparent' : 'rgba(255,255,255,0.1)',
                '&:hover': {
                    backgroundColor: activeTab === idx ? 'primary.dark' : 'rgba(255,255,255,0.1)',
                    color: 'white'
                }
            }}
        >
            {tab.label}
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
            'DubAvailability' as ItemFields
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
                <Grid container spacing={3} sx={{ mt: 2 }}>
                    {items.map((item) => {
                        const isPortrait = !['Episode', 'Audio', 'MusicVideo'].includes(item.Type || '');
                        const shape = isPortrait ? 'portrait' : 'backdrop';
                        return (
                            <Grid key={item.Id} size='auto'>
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

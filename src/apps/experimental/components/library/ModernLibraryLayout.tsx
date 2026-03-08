import React, { useMemo, useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { useHomeData } from 'hooks/useHomeData';
import { useGetItems } from 'hooks/useFetchItems';
import { ItemFields } from '@jellyfin/sdk/lib/generated-client/models/item-fields';
import { ImageType } from '@jellyfin/sdk/lib/generated-client/models/image-type';
import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models/item-sort-by';
import { SortOrder } from '@jellyfin/sdk/lib/generated-client/models/sort-order';
import { useBackdropColor } from 'hooks/useBackdropColor';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { UnifiedNav } from '../../features/home/components/ModernTopNav';
import { type ItemDto } from 'types/base/models/item-dto';
import { appRouter } from 'components/router/appRouter';
import { clearBackdrop } from 'components/backdrop/backdrop';

interface ModernLibraryLayoutProps {
    children: React.ReactNode;
    libraryId: string;
}

export const ModernLibraryLayout = ({ children, libraryId }: ModernLibraryLayoutProps) => {
    const { libraries, isPending: isHomeDataPending } = useHomeData();
    const [ bgColor, setBgColor ] = useState<string | null>(null);

    // Find the index of the current library to pass to UnifiedNav
    // UnifiedNav uses: 0 = Home, 1 = Favourites, 2+ = Libraries
    const activeTabIndex = useMemo(() => {
        if (!libraries || libraries.length === 0 || !libraryId) return -1;
        const index = libraries.findIndex((lib: ItemDto) => lib.Id === libraryId);
        return index >= 0 ? index + 2 : -1;
    }, [libraries, libraryId]);

    const handleTabChange = useCallback((index: number) => {
        if (index === 0) {
            appRouter.goHome()?.catch((e: unknown) => {
                console.error('Error navigating home', e);
            });
        } else if (index === 1) {
            appRouter.showFavorites()?.catch((e: unknown) => {
                console.error('Error navigating to favorites', e);
            });
        } else {
            const lib = libraries[index - 2];
            if (lib) appRouter.showItem(lib);
        }
    }, [libraries]);

    // Fetch some items specifically from this library to get a background color
    const { data: libraryItemsData } = useGetItems({
        parentId: libraryId,
        limit: 20,
        recursive: true,
        sortBy: [ItemSortBy.Random],
        sortOrder: [SortOrder.Descending],
        fields: [
            ItemFields.PrimaryImageAspectRatio,
            'ImageTags' as ItemFields,
            'ServerId' as ItemFields
        ],
        enableImageTypes: [ImageType.Primary, ImageType.Backdrop],
        imageTypeLimit: 1
    }, { enabled: !!libraryId, refetchOnWindowFocus: false });

    const items = useMemo(() => libraryItemsData?.Items ?? [], [libraryItemsData]);

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

    const computedBgColor = useBackdropColor(backdropUrl);

    useEffect(() => {
        if (computedBgColor) {
            setBgColor(computedBgColor);
        }
    }, [computedBgColor]);

    useEffect(() => {
        clearBackdrop();
        const skinHeader = document.querySelector('.skinHeader') as HTMLElement | null;
        if (skinHeader) {
            skinHeader.style.display = 'none';
        }

        return () => {
            if (skinHeader) {
                skinHeader.style.display = '';
            }
        };
    }, []);

    if (isHomeDataPending) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box
            sx={{
                position: 'relative',
                minHeight: '100vh',
                transition: 'background 1.5s ease',
                ...(bgColor ? {
                    background: `radial-gradient(ellipse 150% 100% at 50% 0%, rgba(${bgColor}, 0.55) 0%, transparent 85%)`
                } : {
                    background: 'transparent'
                })
            }}
        >
            <UnifiedNav
                activeTab={activeTabIndex}
                onTabChange={handleTabChange}
                libraries={libraries}
            />

            <Box sx={{
                px: { xs: 1.5, sm: 3, md: 6 },
                pb: { xs: 'calc(6rem + 56px)', md: '6rem' }
            }}>
                {children}
            </Box>
        </Box>
    );
};

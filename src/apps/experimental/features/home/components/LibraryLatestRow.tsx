import React from 'react';
import { ImageType } from '@jellyfin/sdk/lib/generated-client/models/image-type';
import { ItemFields } from '@jellyfin/sdk/lib/generated-client/models/item-fields';
import { useGetLatestItems } from '../../../../../hooks/useFetchItems';
import { MediaRow } from '../../media/components/MediaRow';

import { appRouter } from 'components/router/appRouter';
import { type ItemDto } from 'types/base/models/item-dto';

interface LibraryLatestRowProps {
    library: ItemDto;
}

/**
 * Dynamically fetches and renders the latest items for a given library.
 */
export function LibraryLatestRow({ library }: Readonly<LibraryLatestRowProps>) {
    const { data: latestItems, isPending, isError } = useGetLatestItems(
        {
            limit: 16,
            fields: [
                ItemFields.PrimaryImageAspectRatio,
                'Path' as ItemFields,
                'IsAnime' as ItemFields,
                'DubAvailable' as ItemFields,
                'SubAvailable' as ItemFields,
                'DubAvailability' as ItemFields,
                'SubAvailability' as ItemFields
            ],
            enableImageTypes: [ImageType.Primary, ImageType.Backdrop, ImageType.Thumb],
            imageTypeLimit: 1,
            parentId: library?.Id as string | undefined
        },
        { enabled: !!library?.Id }
    );

    const handleViewAll = React.useCallback(() => {
        appRouter.showItem(library);
    }, [library]);

    if (isPending || isError || !latestItems || latestItems.length === 0) {
        return null;
    }

    const viewType = library.CollectionType;
    const itemType = library.Type;

    // Use square for music, otherwise portrait
    const isSquare = viewType === 'music' || viewType === 'homevideos';
    const shape = isSquare ? 'square' : 'portrait';

    return (
        <MediaRow
            title={`Recently Added ${library.Name}`}
            items={latestItems}
            shape={shape}
            onViewAll={handleViewAll}
            cardOptions={{
                preferThumb: viewType !== 'movies' && viewType !== 'tvshows' && itemType !== 'Channel' && viewType !== 'music' ? 'auto' : null,
                showUnplayedIndicator: false,
                showChildCountIndicator: true,
                showTitle: viewType !== 'photos',
                showYear: viewType === 'movies' || viewType === 'tvshows' || !viewType,
                showParentTitle: viewType === 'music' || viewType === 'tvshows' || !viewType,
                lines: 2
            }}
        />
    );
}

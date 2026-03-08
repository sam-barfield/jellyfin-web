import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import { ItemFields } from '@jellyfin/sdk/lib/generated-client/models/item-fields';
import { ImageType } from '@jellyfin/sdk/lib/generated-client/models/image-type';
import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models/item-sort-by';
import { SortOrder } from '@jellyfin/sdk/lib/generated-client/models/sort-order';
import React, { type FC } from 'react';

import { useApi } from 'hooks/useApi';
import { useGetItems } from 'hooks/useFetchItems';
import Loading from 'components/loading/LoadingComponent';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { MediaRow } from '../../features/home/components/MediaRow';

import type { ParentId } from 'types/library';
import type { ItemDto } from 'types/base/models/item-dto';

interface GenresSectionContainerProps {
    parentId: ParentId;
    collectionType: CollectionType | undefined;
    itemType: BaseItemKind[];
    genre: ItemDto;
}

const GenresSectionContainer: FC<GenresSectionContainerProps> = ({
    parentId,
    collectionType,
    itemType,
    genre
}) => {
    const { __legacyApiClient__ } = useApi();
    const getParametersOptions = () => {
        return {
            sortBy: [ItemSortBy.Random],
            sortOrder: [SortOrder.Ascending],
            includeItemTypes: itemType,
            recursive: true,
            fields: [
                ItemFields.PrimaryImageAspectRatio,
                ItemFields.MediaSourceCount,
                'IsAnime' as ItemFields,
                'DubAvailable' as ItemFields,
                'SubAvailable' as ItemFields,
                'DubAvailability' as ItemFields,
                'SubAvailability' as ItemFields
            ],
            imageTypeLimit: 1,
            enableImageTypes: [ImageType.Primary],
            limit: 25,
            genreIds: genre.Id ? [genre.Id] : undefined,
            enableTotalRecordCount: false,
            parentId: parentId ?? undefined
        };
    };

    const { isLoading, data: itemsResult } = useGetItems(getParametersOptions());

    if (isLoading) {
        return <Loading />;
    }

    return (
        <Box key={genre.Name} sx={{ display: 'flex', flexDirection: 'column', mb: 1.5 }}>
            <Typography
                variant='h6'
                sx={{
                    px: 2,
                    mb: 0.5,
                    fontWeight: 600,
                    color: 'rgba(255, 255, 255, 0.9)',
                    letterSpacing: '0.5px'
                }}
            >
                {genre.Name || ''}
            </Typography>
            <MediaRow
                title=''
                items={itemsResult?.Items ?? []}
                shape={collectionType === CollectionType.Music ? 'square' : 'portrait'}
                cardOptions={{
                    scalable: true,
                    overlayPlayButton: true,
                    showTitle: true,
                    centerText: true,
                    cardLayout: false,
                    showParentTitle: collectionType === CollectionType.Music,
                    showYear: collectionType !== CollectionType.Music,
                    serverId: __legacyApiClient__?.serverId()
                }}
            />
        </Box>
    );
};

export default GenresSectionContainer;

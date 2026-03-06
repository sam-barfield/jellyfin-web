import { ItemFields } from '@jellyfin/sdk/lib/generated-client/models/item-fields';
import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models/item-sort-by';
import { SortOrder } from '@jellyfin/sdk/lib/generated-client/models/sort-order';
import { ImageType } from '@jellyfin/sdk/lib/generated-client/models/image-type';
import type { ItemDto } from 'types/base/models/item-dto';
import { useGetItems, useGetNextUp } from './useFetchItems';
import { useTrendingMovies, useTrendingShows } from 'apps/dashboard/features/trending/api/useTrending';

/**
 * Hook to fetch data for the Modern Home layout.
 * Provides Hero item, Next Up, Resume, and Recently Added content.
 */
export const useHomeData = () => {
    // 5. Libraries (Fetch for dynamic rows in Home)
    const librariesQuery = useGetItems({
        recursive: false,
        fields: [ItemFields.PrimaryImageAspectRatio, 'ImageTags' as ItemFields, 'ServerId' as ItemFields],
        includeItemTypes: ['CollectionFolder']
    });

    // 1. Hero Item: Fetch latest high-rated movie or series as a "Featured" item
    const heroQuery = useGetItems({
        limit: 6,
        recursive: true,
        sortBy: [ItemSortBy.Random],
        sortOrder: [SortOrder.Descending],
        fields: [
            ItemFields.PrimaryImageAspectRatio,
            ItemFields.Overview,
            'CommunityRating' as ItemFields,
            ItemFields.Genres,
            'RunTimeTicks' as ItemFields,
            'ProductionYear' as ItemFields,
            'IsAnime' as ItemFields,
            'DubAvailability' as ItemFields
        ],
        imageTypeLimit: 1,
        enableImageTypes: [ImageType.Primary, ImageType.Backdrop, ImageType.Banner, ImageType.Thumb],
        includeItemTypes: ['Movie', 'Series']
    });

    // 2. Resume / Continue Watching
    const resumeQuery = useGetItems({
        limit: 12,
        recursive: true,
        fields: [
            ItemFields.PrimaryImageAspectRatio,
            ItemFields.CanDelete,
            'ImageTags' as ItemFields,
            'ServerId' as ItemFields,
            'IsAnime' as ItemFields,
            'DubAvailability' as ItemFields
        ],
        enableImageTypes: [ImageType.Primary, ImageType.Thumb, ImageType.Backdrop],
        imageTypeLimit: 1,
        parentId: undefined,
        filters: ['IsResumable']
    });

    // 3. Next Up
    const nextUpQuery = useGetNextUp({
        limit: 12,
        fields: [
            ItemFields.PrimaryImageAspectRatio,
            ItemFields.DateCreated,
            'Path' as ItemFields,
            'MediaSourceCount' as ItemFields,
            'IsAnime' as ItemFields,
            'DubAvailability' as ItemFields
        ],
        enableImageTypes: [ImageType.Primary, ImageType.Thumb, ImageType.Backdrop, ImageType.Banner],
        imageTypeLimit: 1,
        enableTotalRecordCount: false,
        disableFirstEpisode: false,
        enableResumable: false,
        enableRewatching: false
    });

    // 4. Fetch Trakt Trending Movies Header
    const trendingMoviesRes = useTrendingMovies();
    const trendingMoviesIds = trendingMoviesRes.data?.map(t => t.JellyfinItemId).filter(id => id != null) as string[];

    // 4.5 Hydrate Trending Movies with Internal Jellyfin Metadata
    const trendingMoviesQuery = useGetItems({
        ids: trendingMoviesIds,
        fields: [
            ItemFields.PrimaryImageAspectRatio,
            'ImageTags' as ItemFields,
            'ServerId' as ItemFields,
            'IsAnime' as ItemFields,
            'DubAvailability' as ItemFields
        ],
        enableImageTypes: [ImageType.Primary, ImageType.Thumb],
        imageTypeLimit: 1
    }, { enabled: !!trendingMoviesIds?.length });

    // 5. Fetch Trakt Trending Shows Header
    const trendingShowsRes = useTrendingShows();
    const trendingShowsIds = trendingShowsRes.data?.map(t => t.JellyfinItemId).filter(id => id != null) as string[];

    // 5.5 Hydrate Trending Shows with Internal Jellyfin Metadata
    const trendingShowsQuery = useGetItems({
        ids: trendingShowsIds,
        fields: [
            ItemFields.PrimaryImageAspectRatio,
            'ImageTags' as ItemFields,
            'ServerId' as ItemFields,
            'IsAnime' as ItemFields,
            'DubAvailability' as ItemFields
        ],
        enableImageTypes: [ImageType.Primary, ImageType.Thumb],
        imageTypeLimit: 1
    }, { enabled: !!trendingShowsIds?.length });

    const isPending = heroQuery.isPending || resumeQuery.isPending || nextUpQuery.isPending || librariesQuery.isPending || trendingMoviesRes.isPending || trendingShowsRes.isPending || trendingMoviesQuery.isPending || trendingShowsQuery.isPending;
    const isError = heroQuery.isError || resumeQuery.isError || nextUpQuery.isError || librariesQuery.isError || trendingMoviesRes.isError || trendingShowsRes.isError || trendingMoviesQuery.isError || trendingShowsQuery.isError;

    // Helper: Sort hydrated items back into their correct Trakt ranking order
    const orderedMovies = (trendingMoviesIds?.map(id => trendingMoviesQuery.data?.Items?.find(i => i.Id === id)).filter(Boolean) ?? []) as ItemDto[];
    const orderedShows = (trendingShowsIds?.map(id => trendingShowsQuery.data?.Items?.find(i => i.Id === id)).filter(Boolean) ?? []) as ItemDto[];

    return {
        heroItems: heroQuery.data?.Items ?? [],
        heroItem: heroQuery.data?.Items?.[0],
        resumeItems: resumeQuery.data?.Items ?? [],
        nextUpItems: nextUpQuery.data?.Items ?? [],
        libraries: librariesQuery.data?.Items ?? [],
        trendingMovies: orderedMovies,
        trendingShows: orderedShows,
        isPending,
        isError,
        refetch: () => {
            void heroQuery.refetch();
            void resumeQuery.refetch();
            void nextUpQuery.refetch();
            void librariesQuery.refetch();
            void trendingMoviesRes.refetch();
            void trendingShowsRes.refetch();
        }
    };
};

import { useMemo } from 'react';
import { ItemFields } from '@jellyfin/sdk/lib/generated-client/models/item-fields';
import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models/item-sort-by';
import { SortOrder } from '@jellyfin/sdk/lib/generated-client/models/sort-order';
import { ImageType } from '@jellyfin/sdk/lib/generated-client/models/image-type';
import type { ItemDto } from 'types/base/models/item-dto';
import { useGetItems, useGetNextUp, useGetResumeItems } from './useFetchItems';
import { useTrendingMovies, useTrendingShows } from 'apps/dashboard/features/trending/api/useTrending';
import { useApi } from './useApi';
import { EXCLUDE_VIEW_TYPES } from 'constants/libraries';

/** Stable reference to avoid re-creating empty arrays on every render. */
const EMPTY_ITEMS: ItemDto[] = [];

/**
 * Filter items whose ID or ancestor IDs appear in the exclusion set.
 *
 * NOTE: For episodes (NextUp / Resume), `ParentId` refers to the Season — not
 * the top-level library.  Library-level exclusion is therefore only fully
 * effective for items that sit directly under a library (Movies, Series).
 * Full episode-level exclusion would require server-side support.
 */
function filterExcludedItems(
    items: ItemDto[],
    excludeSet: Set<string>,
    ancestorKeys: (keyof ItemDto)[] = ['ParentId']
): ItemDto[] {
    if (!excludeSet.size) return items;
    return items.filter(item => {
        if (item.Id && excludeSet.has(item.Id)) return false;
        return !ancestorKeys.some(key => {
            const val = item[key];
            return typeof val === 'string' && excludeSet.has(val);
        });
    });
}

/**
 * Hook to fetch data for the Modern Home layout.
 * Provides Hero item, Next Up, Resume, and Recently Added content.
 */
export const useHomeData = () => {
    const { user } = useApi();
    const excludeSet = useMemo(() => new Set(user?.Configuration?.LatestItemsExcludes ?? []), [user?.Configuration?.LatestItemsExcludes]);

    // 5. Libraries (Fetch for dynamic rows in Home)
    const librariesQuery = useGetItems({
        recursive: false,
        fields: [ItemFields.PrimaryImageAspectRatio, 'ImageTags' as ItemFields, 'ServerId' as ItemFields],
        includeItemTypes: ['CollectionFolder'],
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
            'DubAvailability' as ItemFields,
            'ServerId' as ItemFields,
            'ChildCount' as ItemFields,
            'ParentId' as ItemFields
        ],
        enableUserData: true,
        imageTypeLimit: 1,
        enableImageTypes: [ImageType.Primary, ImageType.Backdrop, ImageType.Banner, ImageType.Thumb],
        includeItemTypes: ['Movie', 'Series']
    });

    // 2. Resume / Continue Watching (filtered client-side against LatestItemsExcludes)
    const resumeQuery = useGetResumeItems({
        limit: 12,
        fields: [
            ItemFields.PrimaryImageAspectRatio,
            ItemFields.CanDelete,
            'ImageTags' as ItemFields,
            'ServerId' as ItemFields,
            'IsAnime' as ItemFields,
            'DubAvailability' as ItemFields,
            'MediaSourceCount' as ItemFields,
            'ParentId' as ItemFields
        ],
        enableUserData: true,
        enableImageTypes: [ImageType.Primary, ImageType.Thumb, ImageType.Backdrop],
        imageTypeLimit: 1,
        enableTotalRecordCount: false
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
            'DubAvailability' as ItemFields,
            'ServerId' as ItemFields,
            'ParentId' as ItemFields
        ],
        enableUserData: true,
        enableImageTypes: [ImageType.Primary, ImageType.Thumb, ImageType.Backdrop, ImageType.Banner],
        imageTypeLimit: 1,
        enableTotalRecordCount: false,
        disableFirstEpisode: false,
        enableResumable: false,
        enableRewatching: false
    });

    // 4. Fetch TMDB Trending Movies Header
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
            'DubAvailability' as ItemFields,
            'ChildCount' as ItemFields,
            'RunTimeTicks' as ItemFields,
            'Status' as ItemFields
        ],
        enableUserData: true,
        enableImageTypes: [ImageType.Primary, ImageType.Thumb],
        imageTypeLimit: 1
    }, { enabled: !!trendingMoviesIds?.length });

    // 5. Fetch TMDB Trending Shows Header
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
            'DubAvailability' as ItemFields,
            'ChildCount' as ItemFields,
            'RunTimeTicks' as ItemFields,
            'Status' as ItemFields
        ],
        enableUserData: true,
        enableImageTypes: [ImageType.Primary, ImageType.Thumb],
        imageTypeLimit: 1
    }, { enabled: !!trendingShowsIds?.length });

    // Use isLoading (isPending && isFetching) for trending queries — React Query reports
    // isPending=true for disabled queries that have never fetched, which would block the
    // page forever when TMDB returns empty results and the hydration queries stay disabled.
    const isPending = heroQuery.isPending || resumeQuery.isPending || nextUpQuery.isPending || librariesQuery.isPending || trendingMoviesRes.isLoading || trendingShowsRes.isLoading || trendingMoviesQuery.isLoading || trendingShowsQuery.isLoading;
    const isError = heroQuery.isError || resumeQuery.isError || nextUpQuery.isError || librariesQuery.isError || trendingMoviesRes.isError || trendingShowsRes.isError || trendingMoviesQuery.isError || trendingShowsQuery.isError;

    // Helper: Sort hydrated items back into their correct TMDB ranking order
    const orderedMovies = (trendingMoviesIds?.map(id => trendingMoviesQuery.data?.Items?.find(i => i.Id === id)).filter(Boolean) ?? []) as ItemDto[];
    const orderedShows = (trendingShowsIds?.map(id => trendingShowsQuery.data?.Items?.find(i => i.Id === id)).filter(Boolean) ?? []) as ItemDto[];

    // Filter libraries for Recently Added rows based on user exclusions and view types
    const latestLibraries = useMemo(() => {
        const libs = librariesQuery.data?.Items;
        if (!libs) return EMPTY_ITEMS;
        return libs.filter((lib: ItemDto) => {
            if (!lib.Id) return false;
            if (excludeSet.has(lib.Id)) return false;
            if (lib.CollectionType && EXCLUDE_VIEW_TYPES.includes(lib.CollectionType)) return false;
            return true;
        });
    }, [librariesQuery.data?.Items, excludeSet]);

    // Filter hero, resume, and next up items belonging to excluded libraries
    const filteredHeroItems = useMemo(
        () => filterExcludedItems(heroQuery.data?.Items ?? [], excludeSet),
        [heroQuery.data?.Items, excludeSet]
    );
    const filteredResumeItems = useMemo(
        () => filterExcludedItems(resumeQuery.data?.Items ?? [], excludeSet),
        [resumeQuery.data?.Items, excludeSet]
    );
    const filteredNextUpItems = useMemo(
        () => filterExcludedItems(nextUpQuery.data?.Items ?? [], excludeSet, ['ParentId', 'SeriesId']),
        [nextUpQuery.data?.Items, excludeSet]
    );

    return {
        heroItems: filteredHeroItems,
        heroItem: filteredHeroItems[0],
        resumeItems: filteredResumeItems,
        nextUpItems: filteredNextUpItems,
        libraries: librariesQuery.data?.Items ?? EMPTY_ITEMS,
        latestLibraries,
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

import type { RecommendationDto } from '@jellyfin/sdk/lib/generated-client/models/recommendation-dto';
import { RecommendationType } from '@jellyfin/sdk/lib/generated-client/models/recommendation-type';
import React, { type FC } from 'react';

import { useApi } from 'hooks/useApi';
import {
    useGetMovieRecommendations,
    useGetSuggestionSectionsWithItems
} from 'hooks/useFetchItems';

import globalize from 'lib/globalize';
import Loading from 'components/loading/LoadingComponent';
import NoItemsMessage from 'components/common/NoItemsMessage';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { MediaRow } from '../../features/media/components/MediaRow';
import { CardShape } from 'utils/card';
import type { ParentId } from 'types/library';
import { SectionType } from 'types/sections';
import type { ItemDto } from 'types/base/models/item-dto';

interface SuggestionsSectionViewProps {
    parentId: ParentId;
    sectionType: SectionType[];
    isMovieRecommendationEnabled: boolean | undefined;
}

const SuggestionsSectionView: FC<SuggestionsSectionViewProps> = ({
    parentId,
    sectionType,
    isMovieRecommendationEnabled = false
}) => {
    const { __legacyApiClient__ } = useApi();
    const { isLoading, data: sectionsWithItems } =
        useGetSuggestionSectionsWithItems(parentId, sectionType);

    const {
        isLoading: isRecommendationsLoading,
        data: movieRecommendationsItems
    } = useGetMovieRecommendations(isMovieRecommendationEnabled, parentId);

    const uniqueRecommendations = React.useMemo(() => {
        if (!movieRecommendationsItems) return [];
        const seenItemSets = new Set<string>();
        return movieRecommendationsItems.filter((rec) => {
            const itemIds = rec.Items?.map((i) => i.Id).sort().join(',') || '';
            if (!itemIds) return true; // Keep empty categories if any
            if (seenItemSets.has(itemIds)) return false;
            seenItemSets.add(itemIds);
            return true;
        });
    }, [movieRecommendationsItems]);

    if (isLoading || isRecommendationsLoading) {
        return <Loading />;
    }

    if (!sectionsWithItems?.length && !movieRecommendationsItems?.length) {
        return <NoItemsMessage />;
    }

    const getRecommendationTittle = (recommendation: RecommendationDto) => {
        let title = '';

        switch (recommendation.RecommendationType) {
            case RecommendationType.SimilarToRecentlyPlayed:
                title = globalize.translate(
                    'RecommendationBecauseYouWatched',
                    recommendation.BaselineItemName
                );
                break;

            case RecommendationType.SimilarToLikedItem:
                title = globalize.translate(
                    'RecommendationBecauseYouLike',
                    recommendation.BaselineItemName
                );
                break;

            case RecommendationType.HasDirectorFromRecentlyPlayed:
            case RecommendationType.HasLikedDirector:
                title = globalize.translate(
                    'RecommendationDirectedBy',
                    recommendation.BaselineItemName
                );
                break;

            case RecommendationType.HasActorFromRecentlyPlayed:
            case RecommendationType.HasLikedActor:
                title = globalize.translate(
                    'RecommendationStarring',
                    recommendation.BaselineItemName
                );
                break;
        }
        return title;
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, my: 2 }}>
            {sectionsWithItems?.map(({ section, items }) => {
                const isBackdrop = section.type === SectionType.ContinueWatchingMovies
                    || section.type === SectionType.ContinueWatchingEpisode
                    || section.type === SectionType.NextUp
                    || section.type === SectionType.LatestEpisode;
                return (
                    <Box key={section.type}>
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
                            {globalize.translate(section.name)}
                        </Typography>
                        <MediaRow
                            title=''
                            items={items}
                            shape={isBackdrop ? CardShape.Backdrop : CardShape.Portrait}
                            cardOptions={{
                                ...section.cardOptions,
                                queryKey: ['SuggestionSectionWithItems'],
                                showTitle: true,
                                centerText: true,
                                cardLayout: false,
                                overlayText: false,
                                serverId: __legacyApiClient__?.serverId()
                            }}
                        />
                    </Box>
                );
            })}

            {uniqueRecommendations.map((recommendation, index) => (
                // eslint-disable-next-line react/no-array-index-key
                <Box key={`${recommendation.CategoryId}-${index}`}>
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
                        {getRecommendationTittle(recommendation)}
                    </Typography>
                    <MediaRow
                        title=''
                        items={recommendation.Items as ItemDto[]}
                        shape={CardShape.Portrait}
                        cardOptions={{
                            queryKey: ['MovieRecommendations'],
                            showYear: true,
                            scalable: true,
                            overlayPlayButton: true,
                            showTitle: true,
                            centerText: true,
                            cardLayout: false,
                            serverId: __legacyApiClient__?.serverId()
                        }}
                    />
                </Box>
            ))}
        </Box>
    );
};

export default SuggestionsSectionView;

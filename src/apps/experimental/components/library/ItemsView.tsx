import type { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import { ImageType } from '@jellyfin/sdk/lib/generated-client/models/image-type';
import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models/item-sort-by';
import Box from '@mui/material/Box';
import ButtonGroup from '@mui/material/ButtonGroup';
import type { Theme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import classNames from 'classnames';
import React, { type FC, useCallback } from 'react';

import { useApi } from 'hooks/useApi';
import { useLocalStorage } from 'hooks/useLocalStorage';
import { useGetItemsViewByType } from 'hooks/useFetchItems';
import { getDefaultLibraryViewSettings, getSettingsKey } from 'utils/items';
import { CardShape } from 'utils/card';
import Loading from 'components/loading/LoadingComponent';
import { playbackManager } from 'components/playback/playbackmanager';
import ItemsContainer from 'elements/emby-itemscontainer/ItemsContainer';
import NoItemsMessage from 'components/common/NoItemsMessage';
import Lists from 'components/listview/List/Lists';
import { LibraryTab } from 'types/libraryTab';
import { type LibraryViewSettings, type ParentId, ViewMode } from 'types/library';
import type { CardOptions } from 'types/cardOptions';
import type { ListOptions } from 'types/listOptions';
import { useItem } from 'hooks/useItem';
import { MediaCard } from '../../features/home/components/MediaRow';

import AlphabetPicker from './AlphabetPicker';
import FilterButton from './filter/FilterButton';
import NewCollectionButton from './NewCollectionButton';
import Pagination from './Pagination';
import PlayAllButton from './PlayAllButton';
import QueueButton from './QueueButton';
import ShuffleButton from './ShuffleButton';
import SortButton from './SortButton';
import LibraryViewMenu from './LibraryViewMenu';
import ViewSettingsButton from './ViewSettingsButton';

interface ItemsViewProps {
    viewType: LibraryTab;
    parentId: ParentId;
    itemType: BaseItemKind[];
    collectionType?: CollectionType;
    isPaginationEnabled?: boolean;
    isBtnPlayAllEnabled?: boolean;
    isBtnQueueEnabled?: boolean;
    isBtnShuffleEnabled?: boolean;
    isBtnSortEnabled?: boolean;
    isBtnFilterEnabled?: boolean;
    isBtnNewCollectionEnabled?: boolean;
    isBtnGridListEnabled?: boolean;
    isAlphabetPickerEnabled?: boolean;
    noItemsMessage: string;
}

const ItemsView: FC<ItemsViewProps> = ({
    viewType,
    parentId,
    collectionType,
    isPaginationEnabled = true,
    isBtnPlayAllEnabled = false,
    isBtnQueueEnabled = false,
    isBtnShuffleEnabled = false,
    isBtnSortEnabled = true,
    isBtnFilterEnabled = true,
    isBtnNewCollectionEnabled = false,
    isBtnGridListEnabled = true,
    isAlphabetPickerEnabled = true,
    itemType,
    noItemsMessage
}) => {
    const [libraryViewSettings, setLibraryViewSettings] =
        useLocalStorage<LibraryViewSettings>(
            getSettingsKey(viewType, parentId),
            getDefaultLibraryViewSettings(viewType)
        );
    const isSmallScreen = useMediaQuery((t: Theme) => t.breakpoints.up('sm'));

    const { __legacyApiClient__ } = useApi();
    const {
        isPending,
        data: itemsResult,
        isPlaceholderData,
        refetch
    } = useGetItemsViewByType(
        viewType,
        parentId,
        itemType,
        libraryViewSettings
    );
    const { data: item } = useItem(parentId || undefined);

    const getListOptions = useCallback(() => {
        const listOptions: ListOptions = {
            items: itemsResult?.Items ?? [],
            context: collectionType
        };

        if (viewType === LibraryTab.Songs) {
            listOptions.showParentTitle = true;
            listOptions.action = 'playallfromhere';
            listOptions.smallIcon = true;
            listOptions.showArtist = true;
            listOptions.addToListButton = true;
        } else if (viewType === LibraryTab.Albums) {
            listOptions.sortBy = libraryViewSettings.SortBy;
            listOptions.addToListButton = true;
        } else if (viewType === LibraryTab.Episodes) {
            listOptions.showParentTitle = true;
        }

        return listOptions;
    }, [itemsResult?.Items, collectionType, viewType, libraryViewSettings.SortBy]);

    const getCardOptions = useCallback(() => {
        let shape;
        let preferThumb;
        let preferDisc;
        let preferLogo;

        if (libraryViewSettings.ImageType === ImageType.Banner) {
            shape = CardShape.Banner;
        } else if (libraryViewSettings.ImageType === ImageType.Disc) {
            shape = CardShape.Square;
            preferDisc = true;
        } else if (libraryViewSettings.ImageType === ImageType.Logo) {
            shape = CardShape.Backdrop;
            preferLogo = true;
        } else if (libraryViewSettings.ImageType === ImageType.Thumb) {
            shape = CardShape.Backdrop;
            preferThumb = true;
        } else {
            shape = CardShape.Auto;
        }

        const cardOptions: CardOptions = {
            shape: shape,
            showTitle: libraryViewSettings.ShowTitle,
            showYear: libraryViewSettings.ShowYear,
            cardLayout: libraryViewSettings.CardLayout,
            centerText: true,
            context: collectionType,
            coverImage: true,
            preferThumb: preferThumb,
            preferDisc: preferDisc,
            preferLogo: preferLogo,
            overlayText: !libraryViewSettings.ShowTitle,
            imageType: libraryViewSettings.ImageType,
            queryKey: ['ItemsViewByType'],
            serverId: __legacyApiClient__?.serverId()
        };

        if (
            viewType === LibraryTab.Songs
            || viewType === LibraryTab.Albums
            || viewType === LibraryTab.Episodes
        ) {
            cardOptions.showParentTitle = libraryViewSettings.ShowTitle;
            cardOptions.overlayPlayButton = true;
        } else if (viewType === LibraryTab.Artists) {
            cardOptions.lines = 1;
            cardOptions.showYear = false;
            cardOptions.overlayPlayButton = true;
        } else if (viewType === LibraryTab.Channels) {
            cardOptions.shape = CardShape.Square;
            cardOptions.showDetailsMenu = true;
            cardOptions.showCurrentProgram = true;
            cardOptions.showCurrentProgramTime = true;
        } else if (viewType === LibraryTab.SeriesTimers) {
            cardOptions.shape = CardShape.Backdrop;
            cardOptions.showSeriesTimerTime = true;
            cardOptions.showSeriesTimerChannel = true;
            cardOptions.overlayMoreButton = true;
            cardOptions.lines = 3;
        } else if (viewType === LibraryTab.Movies) {
            cardOptions.overlayPlayButton = true;
        } else if (viewType === LibraryTab.Series || viewType === LibraryTab.Networks) {
            cardOptions.overlayMoreButton = true;
        }

        return cardOptions;
    }, [libraryViewSettings.ImageType, libraryViewSettings.ShowTitle, libraryViewSettings.ShowYear, libraryViewSettings.CardLayout, collectionType, __legacyApiClient__, viewType]);

    const getItems = useCallback(() => {
        if (!itemsResult?.Items?.length) {
            return <NoItemsMessage message={noItemsMessage} />;
        }

        if (libraryViewSettings.ViewMode === ViewMode.ListView) {
            return (
                <Lists
                    items={itemsResult?.Items ?? []}
                    listOptions={getListOptions()}
                />
            );
        }
        const shapeStr = getCardOptions().shape;
        let mediaShape: 'portrait' | 'backdrop' | 'square' = 'portrait';
        if (shapeStr === CardShape.Backdrop) mediaShape = 'backdrop';
        else if (shapeStr === CardShape.Square) mediaShape = 'square';
        else if (viewType === LibraryTab.Movies) mediaShape = 'portrait'; // Default movies to portrait
        else if (viewType === LibraryTab.Series) mediaShape = 'portrait'; // Default shows to portrait
        else if (viewType === LibraryTab.Episodes) mediaShape = 'backdrop'; // Default episodes to backdrop

        return (
            <Box sx={{
                display: 'grid',
                gridTemplateColumns: {
                    xs: 'repeat(3, 1fr)',
                    sm: mediaShape === 'portrait' ?
                        'repeat(auto-fill, minmax(180px, 1fr))' :
                        'repeat(auto-fill, minmax(280px, 1fr))'
                },
                gap: { xs: 0.5, sm: 2 },
                width: '100%',
                px: { xs: 0.5, sm: 2 },
                pb: 4,
                mt: { xs: 1, sm: 4 }
            }}>
                {itemsResult?.Items?.map(mappedItem => (
                    <Box key={mappedItem.Id} sx={{ minWidth: 0, width: '100%', position: 'relative' }}>
                        <MediaCard
                            item={mappedItem}
                            shape={mediaShape}
                            cardOptions={getCardOptions() as Record<string, unknown>}
                            fullWidth={true}
                        />
                    </Box>
                ))}
            </Box>
        );
    }, [itemsResult?.Items, libraryViewSettings.ViewMode, getCardOptions, viewType, noItemsMessage, getListOptions]);

    const totalRecordCount = itemsResult?.TotalRecordCount ?? 0;
    const items = itemsResult?.Items ?? [];
    const hasFilters = Object.values(libraryViewSettings.Filters ?? {}).some(
        (filter) => !!filter
    );
    const hasSortName = libraryViewSettings.SortBy !== ItemSortBy.Random;

    const itemsContainerClass = classNames(
        'centered padded-left padded-right',
        libraryViewSettings.ViewMode === ViewMode.ListView ?
            'vertical-list' :
            'vertical-wrap'
    );

    return (
        <Box className='padded-bottom-page'>
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                    px: { xs: 1, sm: 3, md: 6 },
                    pt: 2
                }}
            >
                {/* Row 1: Title & Main Filter/Sort Buttons */}
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 1
                }}>
                    <Box>
                        <LibraryViewMenu />
                    </Box>

                    <ButtonGroup
                        color='inherit'
                        variant='outlined'
                        sx={{
                            borderRadius: '14px',
                            '& .MuiButton-root': {
                                background: 'rgba(255, 255, 255, 0.03)',
                                backdropFilter: 'blur(12px)',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                color: 'rgba(255, 255, 255, 0.6)',
                                textTransform: 'none',
                                px: { xs: 1.5, sm: 2 },
                                transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                '&:hover': {
                                    background: 'rgba(255, 255, 255, 0.08)',
                                    color: 'white',
                                    borderColor: 'rgba(255, 255, 255, 0.15)',
                                    transform: 'translateY(-2px)'
                                }
                            },
                            '& .MuiButton-root:first-of-type': {
                                borderTopLeftRadius: '14px !important',
                                borderBottomLeftRadius: '14px !important'
                            },
                            '& .MuiButton-root:last-of-type': {
                                borderTopRightRadius: '14px !important',
                                borderBottomRightRadius: '14px !important'
                            }
                        }}
                    >
                        {isBtnFilterEnabled && (
                            <FilterButton
                                parentId={parentId}
                                itemType={itemType}
                                viewType={viewType}
                                hasFilters={hasFilters}
                                libraryViewSettings={libraryViewSettings}
                                setLibraryViewSettings={setLibraryViewSettings}
                            />
                        )}
                        {isBtnSortEnabled && (
                            <SortButton
                                viewType={viewType}
                                libraryViewSettings={libraryViewSettings}
                                setLibraryViewSettings={setLibraryViewSettings}
                            />
                        )}
                        {isBtnGridListEnabled && (
                            <ViewSettingsButton
                                viewType={viewType}
                                libraryViewSettings={libraryViewSettings}
                                setLibraryViewSettings={setLibraryViewSettings}
                            />
                        )}
                    </ButtonGroup>
                </Box>

                {/* Row 2: Playback Actions & Pagination */}
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 1,
                    flexDirection: { xs: 'row-reverse', sm: 'row' }
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {!isPending && (
                            <ButtonGroup
                                variant='outlined'
                                sx={{
                                    borderRadius: '14px',
                                    '& .MuiButton-root': {
                                        background: 'rgba(255, 255, 255, 0.03)',
                                        backdropFilter: 'blur(12px)',
                                        border: '1px solid rgba(255, 255, 255, 0.08)',
                                        color: 'rgba(255, 255, 255, 0.6)',
                                        textTransform: 'none',
                                        px: { xs: 2.5, sm: 3 },
                                        transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                        '&:hover': {
                                            background: 'rgba(255, 255, 255, 0.08)',
                                            color: 'white',
                                            borderColor: 'rgba(255, 255, 255, 0.15)',
                                            transform: 'translateY(-1px)'
                                        }
                                    },
                                    '& .MuiButton-root:first-of-type': {
                                        borderTopLeftRadius: '14px !important',
                                        borderBottomLeftRadius: '14px !important'
                                    },
                                    '& .MuiButton-root:last-of-type': {
                                        borderTopRightRadius: '14px !important',
                                        borderBottomRightRadius: '14px !important'
                                    }
                                }}
                            >
                                {isBtnPlayAllEnabled && (
                                    <PlayAllButton
                                        item={item}
                                        items={items}
                                        viewType={viewType}
                                        hasFilters={hasFilters}
                                        isTextVisible={isSmallScreen}
                                        libraryViewSettings={libraryViewSettings}
                                    />
                                )}
                                {isBtnShuffleEnabled && totalRecordCount > 1 && (
                                    <ShuffleButton
                                        item={item}
                                        items={items}
                                        viewType={viewType}
                                        hasFilters={hasFilters}
                                        isTextVisible={isSmallScreen && !isBtnPlayAllEnabled}
                                        libraryViewSettings={libraryViewSettings}
                                    />
                                )}
                                {isBtnQueueEnabled && item && playbackManager.canQueue(item) && (
                                    <QueueButton
                                        item={item}
                                        items={items}
                                        hasFilters={hasFilters}
                                        isTextVisible={isSmallScreen && !isBtnPlayAllEnabled && !isBtnShuffleEnabled}
                                    />
                                )}
                            </ButtonGroup>
                        )}

                        {isBtnNewCollectionEnabled && (
                            <NewCollectionButton isTextVisible={isSmallScreen} />
                        )}
                    </Box>

                    {!isPending && isPaginationEnabled && (
                        <Box sx={{ flexGrow: { xs: 1, sm: 0 }, display: 'flex', justifyContent: 'center' }}>
                            <Pagination
                                totalRecordCount={totalRecordCount}
                                libraryViewSettings={libraryViewSettings}
                                isPlaceholderData={isPlaceholderData}
                                setLibraryViewSettings={setLibraryViewSettings}
                            />
                        </Box>
                    )}
                </Box>
            </Box>

            {isAlphabetPickerEnabled && hasSortName && (
                <AlphabetPicker
                    libraryViewSettings={libraryViewSettings}
                    setLibraryViewSettings={setLibraryViewSettings}
                />
            )}

            {isPending ? (
                <Loading />
            ) : (
                <ItemsContainer
                    className={itemsContainerClass}
                    parentId={parentId}
                    reloadItems={refetch}
                    queryKey={['ItemsViewByType']}
                >
                    {getItems()}
                </ItemsContainer>
            )}

            {!isPending && isPaginationEnabled && (
                <Box
                    className='padded-left padded-right'
                    sx={{
                        display: 'flex',
                        justifyContent: 'flex-end'
                    }}
                >
                    <Pagination
                        totalRecordCount={totalRecordCount}
                        libraryViewSettings={libraryViewSettings}
                        isPlaceholderData={isPlaceholderData}
                        setLibraryViewSettings={setLibraryViewSettings}
                    />
                </Box>
            )}
        </Box>
    );
};

export default ItemsView;

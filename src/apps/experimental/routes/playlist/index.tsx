import React, { FC, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import Page from 'components/Page';
import { useItem } from 'hooks/useItem';
import { ModernLibraryLayout } from '../../components/library/ModernLibraryLayout';
import PageTabContent from '../../components/library/PageTabContent';
import { LibraryTabContent } from 'types/libraryTabContent';
import { LibraryTab } from 'types/libraryTab';

const PlaylistDetailsPage: FC = () => {
    const [searchParams] = useSearchParams();
    const id = searchParams.get('id');

    const { data: item } = useItem(id ?? undefined);

    const playlistTabContent: LibraryTabContent = useMemo(() => ({
        viewType: LibraryTab.Playlists,
        collectionType: (item?.CollectionType as CollectionType) || CollectionType.Music,
        isBtnPlayAllEnabled: true,
        isBtnShuffleEnabled: true,
        isBtnFilterEnabled: true,
        isBtnSortEnabled: true,
        isAlphabetPickerEnabled: true,
        isBtnGridListEnabled: true,
        itemType: [BaseItemKind.Audio, BaseItemKind.Video, BaseItemKind.Movie, BaseItemKind.Episode]
    }), [item]);

    // We use the playlist ID as parentId for ItemsView to show its children.
    // LibraryId can be left empty for playlists if they don't belong to a specific library.
    // ModernLibraryLayout will handle it.

    return (
        <Page
            id='playlistDetailsPage'
            className='mainAnimatedPage libraryPage backdropPage playlistEditorPage pageWithAbsoluteTabs withTabs homePage'
            backDropType='music,video'
        >
            <ModernLibraryLayout libraryId={id ?? ''}>
                <PageTabContent
                    key={`playlist-${id}`}
                    currentTab={playlistTabContent}
                    parentId={id ?? ''}
                />
            </ModernLibraryLayout>
        </Page>
    );
};

export default PlaylistDetailsPage;

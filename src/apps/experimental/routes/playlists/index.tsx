import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import React, { FC } from 'react';
import useCurrentTab from 'hooks/useCurrentTab';
import Page from 'components/Page';
import PageTabContent from '../../components/library/PageTabContent';
import { LibraryTab } from 'types/libraryTab';
import { LibraryTabContent, LibraryTabMapping } from 'types/libraryTabContent';
import { ModernLibraryLayout } from '../../components/library/ModernLibraryLayout';

const playlistsTabContent: LibraryTabContent = {
    viewType: LibraryTab.Playlists,
    isBtnFilterEnabled: true,
    isBtnSortEnabled: true,
    isAlphabetPickerEnabled: true,
    isBtnGridListEnabled: true,
    itemType: [BaseItemKind.Playlist]
};

const playlistsTabMapping: LibraryTabMapping = {
    0: playlistsTabContent
};

const PlaylistsPage: FC = () => {
    const { libraryId, activeTab } = useCurrentTab();
    const currentTab = playlistsTabMapping[activeTab] || playlistsTabMapping[0];

    return (
        <Page
            id='playlistsPage'
            className='mainAnimatedPage libraryPage backdropPage collectionEditorPage pageWithAbsoluteTabs withTabs homePage'
            backDropType='musicartist,video'
        >
            <ModernLibraryLayout libraryId={libraryId ?? ''}>
                <PageTabContent
                    key={`${currentTab.viewType} - ${libraryId}`}
                    currentTab={currentTab}
                    parentId={undefined} // Playlists are global
                />
            </ModernLibraryLayout>
        </Page>
    );
};

export default PlaylistsPage;

import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import React, { FC } from 'react';
import useCurrentTab from 'hooks/useCurrentTab';
import Page from 'components/Page';
import PageTabContent from '../../components/library/PageTabContent';
import { LibraryTab } from 'types/libraryTab';
import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import { LibraryTabContent, LibraryTabMapping } from 'types/libraryTabContent';
import { ModernLibraryLayout } from '../../components/library/ModernLibraryLayout';

const collectionsTabContent: LibraryTabContent = {
    viewType: LibraryTab.Collections,
    collectionType: CollectionType.Boxsets,
    isBtnFilterEnabled: true,
    isBtnSortEnabled: true,
    isBtnGridListEnabled: true,
    isAlphabetPickerEnabled: true,
    isBtnNewCollectionEnabled: true,
    itemType: [BaseItemKind.BoxSet],
    noItemsMessage: 'MessageNoCollectionsAvailable'
};

const collectionsTabMapping: LibraryTabMapping = {
    0: collectionsTabContent
};

const CollectionsPage: FC = () => {
    const { libraryId, activeTab } = useCurrentTab();
    const currentTab = collectionsTabMapping[activeTab] || collectionsTabMapping[0];

    return (
        <Page
            id='collectionsPage'
            className='mainAnimatedPage libraryPage backdropPage collectionEditorPage pageWithAbsoluteTabs withTabs homePage'
            backDropType='movie,series'
        >
            <ModernLibraryLayout libraryId={libraryId ?? ''}>
                <PageTabContent
                    key={`${currentTab.viewType} - ${libraryId}`}
                    currentTab={currentTab}
                    parentId={libraryId}
                />
            </ModernLibraryLayout>
        </Page>
    );
};

export default CollectionsPage;

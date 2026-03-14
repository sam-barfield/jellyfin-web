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

const CollectionDetailsPage: FC = () => {
    const [searchParams] = useSearchParams();
    const id = searchParams.get('id');

    const { data: item } = useItem(id ?? undefined);

    const collectionTabContent: LibraryTabContent = useMemo(() => ({
        viewType: LibraryTab.Collections,
        collectionType: (item?.CollectionType as CollectionType) || CollectionType.Movies,
        isBtnPlayAllEnabled: true,
        isBtnShuffleEnabled: true,
        isBtnFilterEnabled: true,
        isBtnSortEnabled: true,
        isAlphabetPickerEnabled: true,
        isBtnGridListEnabled: true,
        itemType: [BaseItemKind.Movie, BaseItemKind.Series, BaseItemKind.Episode, BaseItemKind.MusicAlbum, BaseItemKind.Book]
    }), [item]);

    // We use the collection ID as parentId for ItemsView to show its children.
    // We use item?.ParentId as libraryId for ModernLibraryLayout to highlight the correct library tab.

    return (
        <Page
            id='collectionDetailsPage'
            className='mainAnimatedPage libraryPage backdropPage collectionEditorPage pageWithAbsoluteTabs withTabs homePage'
            backDropType='movie,series,book'
        >
            <ModernLibraryLayout libraryId={id ?? ''}>
                <PageTabContent
                    key={`collection-${id}`}
                    currentTab={collectionTabContent}
                    parentId={id ?? ''}
                />
            </ModernLibraryLayout>
        </Page>
    );
};

export default CollectionDetailsPage;

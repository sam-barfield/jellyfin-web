import React, { useCallback, useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Page from 'components/Page';
import { clearBackdrop } from 'components/backdrop/backdrop';
import { EventType } from 'constants/eventType';
import Events from 'utils/events';
import { UnifiedNav } from '../../features/home/components/ModernTopNav';
import { FriendsPage } from 'apps/experimental/features/friends/FriendsPage';
import { useHomeData } from 'hooks/useHomeData';
import { appRouter } from 'components/router/appRouter';

export const Component = () => {
    const { libraries } = useHomeData();
    const [bgColor, setBgColor] = useState<string | null>(null);
    const documentRef = useRef<Document>(document);

    const onResume = useCallback(() => {
        clearBackdrop();
        // Hide legacy skinHeader
        const skinHeader = documentRef.current.querySelector('.skinHeader') as HTMLElement | null;
        if (skinHeader) skinHeader.style.display = 'none';

        // Inject CSS to hide legacy home/fav buttons if not present
        if (!documentRef.current.getElementById('modern-home-styles-legacy-hide')) {
            const style = documentRef.current.createElement('style');
            style.id = 'modern-home-styles-legacy-hide';
            style.innerHTML = `
                .noHomeButtonHeader .headerHomeButton,
                .noHomeButtonHeader .headerFavoritesButton {
                    display: none !important;
                }
            `;
            documentRef.current.head.appendChild(style);
        }
    }, []);

    const onPause = useCallback(() => {
        const skinHeader = documentRef.current.querySelector('.skinHeader') as HTMLElement | null;
        if (skinHeader) skinHeader.style.display = '';
    }, []);

    useEffect(() => {
        onResume();
        return () => onPause();
    }, [onResume, onPause]);

    useEffect(() => {
        const doc = documentRef.current;
        if (doc) Events.on(doc, EventType.HEADER_RENDERED, onResume);
        return () => {
            if (doc) Events.off(doc, EventType.HEADER_RENDERED, onResume);
        };
    }, [onResume]);

    const handleTabChange = useCallback((index: number) => {
        if (index === 0) {
            void appRouter.goHome();
        } else if (index === 1) {
            void appRouter.showFavorites();
        }
    }, []);

    return (
        <Page
            id='friendsPage'
            title='Friends'
            className='mainAnimatedPage homePage libraryPage allLibraryPage backdropPage'
            isBackButtonEnabled={false}
        >
            <Box
                sx={{
                    position: 'relative',
                    transition: 'background 1.5s ease',
                    minHeight: '100vh',
                    ...(bgColor ? {
                        background: `radial-gradient(ellipse 150% 100% at 50% 0%, rgba(${bgColor}, 0.55) 0%, transparent 85%)`
                    } : {
                        background: 'transparent'
                    })
                }}
            >
                <UnifiedNav
                    activeTab={-1} // No tab active
                    onTabChange={handleTabChange}
                    libraries={libraries}
                />

                <Box sx={{ px: { xs: 1.5, sm: 3, md: 6 } }}>
                    <FriendsPage onColorChange={setBgColor} />
                </Box>
            </Box>
        </Page>
    );
};

Component.displayName = 'FriendsPage';

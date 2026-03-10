import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import { useSearchParams } from 'react-router-dom';

import Page from '../../../components/Page';
import { clearBackdrop } from '../../../components/backdrop/backdrop';
import { EventType } from 'constants/eventType';
import Events from 'utils/events';
import { HeroSection } from '../features/home/components/HeroSection';
import { UnifiedNav } from '../features/home/components/ModernTopNav';
import { HomeSidebar } from '../features/home/components/HomeSidebar';
import { MediaRow } from '../features/media/components/MediaRow';
import { LibraryLatestRow } from '../features/home/components/LibraryLatestRow';
import { useHomeData } from '../../../hooks/useHomeData';
import { type ItemDto } from 'types/base/models/item-dto';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import Grid from '@mui/material/Grid2';
import CircularProgress from '@mui/material/CircularProgress';
import { useBackdropColor } from '../../../hooks/useBackdropColor';

import '../../../elements/emby-tabs/emby-tabs';
import '../../../elements/emby-button/emby-button';
import '../../../elements/emby-scroller/emby-scroller';

const Home = () => {
    const [ searchParams, setSearchParams ] = useSearchParams();
    const initialTabIndex = parseInt(searchParams.get('tab') ?? '0', 10);

    const libraryMenu = useMemo(async () => ((await import('../../../scripts/libraryMenu')).default), []);

    const documentRef = useRef<Document>(document);
    const element = useRef<HTMLDivElement>(null);

    const setTitle = useCallback(async () => {
        (await libraryMenu).setTitle(null);
    }, [ libraryMenu ]);

    // Handling tab change locally
    const onTabChange = useCallback((index: number) => {
        setSearchParams(prev => {
            prev.set('tab', index.toString());
            return prev;
        }, { replace: true });
    }, [setSearchParams]);

    const onResume = useCallback(async () => {
        void setTitle();
        clearBackdrop();

        // Completely hide the legacy skinHeader — our UnifiedNav replaces it on home
        const skinHeader = documentRef.current.querySelector('.skinHeader') as HTMLElement | null;
        if (skinHeader) {
            skinHeader.style.display = 'none';
            // Inject CSS if not present
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
        }
    }, [ setTitle ]);

    const onPause = useCallback(() => {
        // Restore the legacy skinHeader when leaving home page
        const skinHeader = documentRef.current.querySelector('.skinHeader') as HTMLElement | null;
        if (skinHeader) skinHeader.style.display = '';
    }, []);

    const renderHome = useCallback(() => {
        void onResume();
    }, [ onResume ]);

    useEffect(() => {
        if (documentRef.current?.querySelector('.headerTabs')) {
            renderHome();
        }

        return () => {
            onPause();
        };
    }, [onPause, renderHome]);

    useEffect(() => {
        const doc = documentRef.current;
        if (doc) Events.on(doc, EventType.HEADER_RENDERED, renderHome);

        return () => {
            if (doc) Events.off(doc, EventType.HEADER_RENDERED, renderHome);
        };
    }, [ renderHome ]);

    return (
        <div ref={element}>
            <Page
                id='indexPage'
                className='mainAnimatedPage homePage libraryPage allLibraryPage backdropPage'
                isBackButtonEnabled={false}
                backDropType='movie,series,book'
            >
                <div className='tabContent pageTabContent is-active' id='homeTab' data-index='0'>
                    <ModernHome initialTabIndex={initialTabIndex} onTabChangeUrl={onTabChange} />
                </div>
            </Page>
        </div>
    );
};

import { ModernFavorites } from '../features/favorites/ModernFavorites';

const HERO_INTERVAL_MS = 12000; // 12 seconds per hero

interface ModernHomeProps {
    initialTabIndex: number;
    onTabChangeUrl: (index: number) => void;
}

const ModernHome = ({ initialTabIndex, onTabChangeUrl }: ModernHomeProps) => {
    const {
        heroItems,
        resumeItems,
        nextUpItems,
        libraries,
        isPending
    } = useHomeData();

    const [activeTab, setActiveTab] = React.useState(initialTabIndex);
    const [ heroIndex, setHeroIndex ] = useState(0);
    const [ favoritesBgColor, setFavoritesBgColor ] = useState<string | null>(null);
    const [ lastHeroInteraction, setLastHeroInteraction ] = useState(0);

    // Advance hero every HERO_INTERVAL_MS — CSS animation handles the smooth progress bar
    useEffect(() => {
        if (heroItems.length <= 1) return;
        const id = setInterval(() => {
            setHeroIndex(prev => (prev + 1) % heroItems.length);
        }, HERO_INTERVAL_MS);
        return () => clearInterval(id);
    }, [ heroItems.length, lastHeroInteraction ]);

    const handleSwipeLeft = useCallback(() => {
        if (heroItems.length <= 1) return;
        setHeroIndex(prev => (prev + 1) % heroItems.length);
        setLastHeroInteraction(Date.now());
    }, [heroItems.length]);

    const handleSwipeRight = useCallback(() => {
        if (heroItems.length <= 1) return;
        setHeroIndex(prev => (prev === 0 ? heroItems.length - 1 : prev - 1));
        setLastHeroInteraction(Date.now());
    }, [heroItems.length]);

    const handleHeroSelect = useCallback((index: number) => {
        setHeroIndex(index);
        setLastHeroInteraction(Date.now());
    }, []);

    const handleTabChange = useCallback((index: number) => {
        setActiveTab(index);
        onTabChangeUrl(index);
    }, [ onTabChangeUrl ]);

    const heroItem = heroItems[heroIndex];
    const apiClient = ServerConnections.currentApiClient();
    const backdropUrl = heroItem?.Id ?
        (apiClient?.getScaledImageUrl(heroItem.Id, { type: 'Backdrop', maxWidth: 400, quality: 60 }) ?? undefined) :
        undefined;
    const heroBgColor = useBackdropColor(backdropUrl);

    const activeBgColor = activeTab === 0 ? heroBgColor : favoritesBgColor;

    if (isPending && !heroItem && activeTab === 0) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box
            sx={{
                position: 'relative',
                transition: 'background 1.5s ease',
                ...(activeBgColor ? {
                    background: `radial-gradient(ellipse 150% 100% at 50% 0%, rgba(${activeBgColor}, 0.55) 0%, transparent 85%)`
                } : {
                    background: 'transparent'
                })
            }}
        >
            <UnifiedNav
                activeTab={activeTab}
                onTabChange={handleTabChange}
                libraries={libraries}
            />

            <Box
                sx={{
                    px: { xs: 1.5, sm: 3, md: 6 },
                    pb: { xs: 'calc(6rem + 56px)', md: '6rem' }
                }}
            >
                {activeTab === 1 && <ModernFavorites onColorChange={setFavoritesBgColor} />}

                {activeTab === 0 && (
                    <Grid container spacing={4}>
                        {/* Main Content Column */}
                        <Grid size={{ xs: 12, lg: 9 }}>
                            <HeroSection
                                item={heroItem}
                                isPending={isPending}
                                heroItems={heroItems}
                                heroIndex={heroIndex}
                                onSwipeLeft={handleSwipeLeft}
                                onSwipeRight={handleSwipeRight}
                                onSelect={handleHeroSelect}
                            />

                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                <MediaRow
                                    title='Continue Watching'
                                    items={resumeItems}
                                    shape='backdrop'
                                    cardOptions={{
                                        preferThumb: true,
                                        inheritThumb: true,
                                        lines: 2
                                    }}
                                />
                                <MediaRow
                                    title='Next Up'
                                    items={nextUpItems}
                                    shape='backdrop'
                                    cardOptions={{
                                        preferThumb: true,
                                        inheritThumb: true,
                                        lines: 2
                                    }}
                                />
                                {libraries?.map((library: ItemDto) => (
                                    <LibraryLatestRow key={library.Id} library={library} />
                                ))}
                            </Box>
                        </Grid>

                        {/* Sidebar Column */}
                        <Grid size={{ xs: 12, lg: 3 }}>
                            <HomeSidebar />
                        </Grid>
                    </Grid>
                )}
            </Box>
        </Box>
    );
};

export default Home;

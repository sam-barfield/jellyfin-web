import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import { useSearchParams } from 'react-router-dom';

import globalize from '../../../lib/globalize';
import { clearBackdrop } from '../../../components/backdrop/backdrop';
import layoutManager from '../../../components/layoutManager';
import Page from '../../../components/Page';
import { EventType } from 'constants/eventType';
import Events from 'utils/events';
import { HeroSection } from '../features/home/components/HeroSection';
import { ModernTopNav } from '../features/home/components/ModernTopNav';
import { HomeSidebar } from '../features/home/components/HomeSidebar';
import { MediaRow } from '../features/home/components/MediaRow';
import { LibraryLatestRow } from '../features/home/components/LibraryLatestRow';
import { useHomeData } from '../../../hooks/useHomeData';
import { type ItemDto } from 'types/base/models/item-dto';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import Grid from '@mui/material/Grid2';
import CircularProgress from '@mui/material/CircularProgress';

import '../../../elements/emby-tabs/emby-tabs';
import '../../../elements/emby-button/emby-button';
import '../../../elements/emby-scroller/emby-scroller';

type OnResumeOptions = {
    autoFocus?: boolean;
    refresh?: boolean
};

type ControllerProps = {
    onResume: (
        options: OnResumeOptions
    ) => void;
    refreshed: boolean;
    onPause: () => void;
    destroy: () => void;
};

const Home = () => {
    const [ searchParams ] = useSearchParams();
    const initialTabIndex = parseInt(searchParams.get('tab') ?? '0', 10);

    const libraryMenu = useMemo(async () => ((await import('../../../scripts/libraryMenu')).default), []);
    const mainTabsManager = useMemo(() => import('../../../components/maintabsmanager'), []);
    const tabController = useRef<ControllerProps | null>();
    const tabControllers = useMemo<ControllerProps[]>(() => [], []);

    const documentRef = useRef<Document>(document);
    const element = useRef<HTMLDivElement>(null);

    const setTitle = useCallback(async () => {
        (await libraryMenu).setTitle(null);
    }, [ libraryMenu ]);

    const getTabs = () => {
        return [{
            name: globalize.translate('Home')
        }, {
            name: globalize.translate('Favorites')
        }];
    };

    const getTabContainers = () => {
        return element.current?.querySelectorAll('.tabContent');
    };

    const getTabController = useCallback((index: number) => {
        if (index == null) {
            throw new Error('index cannot be null');
        }

        if (index === 0) {
            // Bypass legacy hometab.js for the modern home view
            return Promise.resolve({
                onResume: () => { /* noop */ },
                onPause: () => { /* noop */ },
                destroy: () => { /* noop */ },
                refreshed: true
            } as ControllerProps);
        }

        let depends = '';

        switch (index) {
            case 0:
                depends = 'hometab';
                break;

            case 1:
                depends = 'favorites';
        }

        return import(/* webpackChunkName: "[request]" */ `../../../controllers/${depends}`).then(({ default: ControllerFactory }) => {
            let controller = tabControllers[index];

            if (!controller) {
                const tabContent = element.current?.querySelector(".tabContent[data-index='" + index + "']");
                controller = new ControllerFactory(tabContent, null);
                tabControllers[index] = controller;
            }

            return controller;
        });
    }, [ tabControllers ]);

    const loadTab = useCallback((index: number, previousIndex: number | null) => {
        getTabController(index).then((controller) => {
            const refresh = !controller.refreshed;

            controller.onResume({
                autoFocus: previousIndex == null && layoutManager.tv,
                refresh: refresh
            });

            controller.refreshed = true;
            tabController.current = controller;
        }).catch(err => {
            console.error('[Home] failed to get tab controller', err);
        });
    }, [ getTabController ]);

    const onTabChange = useCallback((e: { detail: { selectedTabIndex: string; previousIndex: number | null }; }) => {
        const newIndex = parseInt(e.detail.selectedTabIndex, 10);
        const previousIndex = e.detail.previousIndex;

        const previousTabController = previousIndex == null ? null : tabControllers[previousIndex];
        if (previousTabController?.onPause) {
            previousTabController.onPause();
        }

        loadTab(newIndex, previousIndex);
    }, [ loadTab, tabControllers ]);

    const onSetTabs = useCallback(async () => {
        (await mainTabsManager).setTabs(element.current, initialTabIndex, getTabs, getTabContainers, null, onTabChange, false);
    }, [ initialTabIndex, mainTabsManager, onTabChange ]);

    const onResume = useCallback(async () => {
        void setTitle();
        clearBackdrop();

        const currentTabController = tabController.current;

        if (!currentTabController) {
            (await mainTabsManager).selectedTabIndex(initialTabIndex);
        } else if (currentTabController?.onResume) {
            currentTabController.onResume({});
        }

        // Hide legacy Home/Favorites buttons and style modern cards
        const skinHeader = documentRef.current.querySelector('.skinHeader');
        if (skinHeader) {
            skinHeader.classList.add('noHomeButtonHeader');
            // Inject CSS if not present
            if (!documentRef.current.getElementById('modern-home-styles')) {
                const style = documentRef.current.createElement('style');
                style.id = 'modern-home-styles';
                style.innerHTML = `
                    .noHomeButtonHeader .headerHomeButton,
                    .noHomeButtonHeader .headerFavoritesButton {
                        display: none !important;
                    }
                    /* Card Sizing and Container */
                    .homePage .portraitCard,
                    .homePage .backdropCard {
                        width: 100% !important;
                        background: transparent !important;
                        padding-bottom: 0 !important;
                    }
                    .homePage .cardBox {
                        margin: 0 !important;
                        background: transparent;
                        box-shadow: none !important;
                        border: none !important;
                    }
                    /* Image styling */
                    .homePage .cardImageContainer {
                        border-radius: 10px;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.4);
                        transition: all 0.3s ease;
                        border: 1px solid rgba(255,255,255,0.05);
                    }
                    /* Hover effect on the image container instead of the whole box */
                    .homePage .portraitCard:hover,
                    .homePage .backdropCard:hover,
                    .homePage .squareCard:hover {
                        z-index: 10; /* Prevent shadow clipping from neighboring cards */
                    }
                    /* Text below the card */
                    .homePage .cardFooter {
                        background: transparent !important;
                        backdrop-filter: none !important;
                        -webkit-backdrop-filter: none !important;
                        position: relative !important;
                        padding: 12px 4px 0 4px !important;
                        border: none !important;
                        text-align: center !important;
                    }
                    .homePage .cardText {
                        font-family: "Inter", "Roboto", sans-serif;
                        text-align: center !important;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        margin: 0 !important;
                        text-shadow: none !important;
                    }
                    /* Ensure child anchor tags and buttons inherit text styles */
                    .homePage .cardText * {
                        color: inherit !important;
                        font-weight: inherit !important;
                        font-size: inherit !important;
                        letter-spacing: inherit !important;
                        text-transform: inherit !important;
                    }
                    .homePage .cardText:first-child {
                        font-weight: 600;
                        font-size: 0.95rem;
                        color: rgba(255,255,255,0.95);
                        letter-spacing: 0.2px;
                    }
                    .homePage .cardText:not(:first-child) {
                        font-weight: 500;
                        font-size: 0.8rem !important;
                        color: rgba(255,255,255,0.5) !important;
                        margin-top: 2px !important;
                    }
                    /* Hide unnecessary padding below card */
                    .homePage .cardPadder {
                        background-color: transparent !important;
                    }
                    /* Play button hover overlay */
                    .homePage .cardOverlayContainer {
                        border-radius: 10px;
                        background: rgba(0,0,0,0.3);
                    }
                    /* Count / Unplayed Indicator */
                    .homePage .countIndicator,
                    .homePage .playedIndicator {
                        position: absolute;
                        top: 4px;
                        right: 4px;
                        background: rgba(40, 40, 40, 0.85) !important;
                        backdrop-filter: blur(10px);
                        -webkit-backdrop-filter: blur(10px);
                        color: #ffffff !important;
                        font-weight: 700;
                        font-size: 0.75rem !important;
                        padding: 2px 8px !important;
                        border-radius: 99px !important;
                        border: 1px solid rgba(255,255,255,0.1) !important;
                        box-shadow: 0 4px 10px rgba(0,0,0,0.5) !important;
                        z-index: 5;
                    }
                `;
                documentRef.current.head.appendChild(style);
            }
        }
    }, [ initialTabIndex, mainTabsManager, setTitle ]);

    const onPause = useCallback(() => {
        const currentTabController = tabController.current;
        if (currentTabController?.onPause) {
            currentTabController.onPause();
        }
        (documentRef.current.querySelector('.skinHeader') as HTMLDivElement).classList.remove('noHomeButtonHeader');
    }, []);

    const renderHome = useCallback(() => {
        void onSetTabs();
        void onResume();
    }, [ onResume, onSetTabs ]);

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
                className='mainAnimatedPage homePage libraryPage allLibraryPage backdropPage pageWithAbsoluteTabs withTabs'
                isBackButtonEnabled={false}
                backDropType='movie,series,book'
            >
                <div className='tabContent pageTabContent' id='homeTab' data-index='0'>
                    <ModernHome />
                </div>
                <div className='tabContent pageTabContent' id='favoritesTab' data-index='1'>
                    <div className='sections'></div>
                </div>
            </Page>
        </div>
    );
};

/**
 * Samples the average color of a hero backdrop image via an off-screen canvas.
 * Returns an rgb(...) string or null while loading.
 */
function useBackdropColor(imageUrl: string | undefined): string | null {
    const [color, setColor] = useState<string | null>(null);

    useEffect(() => {
        if (!imageUrl) {
            setColor(null);
            return;
        }

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = 40;
                canvas.height = 22;
                const ctx = canvas.getContext('2d');
                if (!ctx) return;
                ctx.drawImage(img, 0, 0, 40, 22);
                const data = ctx.getImageData(0, 0, 40, 22).data;
                let r = 0;
                let g = 0;
                let b = 0;
                let count = 0;
                for (let i = 0; i < data.length; i += 4) {
                    const pr = data[i];
                    const pg = data[i + 1];
                    const pb = data[i + 2];
                    const luminance = 0.299 * pr + 0.587 * pg + 0.114 * pb;
                    if (luminance > 30) {
                        r += pr;
                        g += pg;
                        b += pb;
                        count++;
                    }
                }
                if (count === 0) {
                    setColor(null);
                    return;
                }
                // Mute/darken the sampled color so it's a subtle tint
                const factor = 0.45;
                setColor(`${Math.round(r / count * factor)},${Math.round(g / count * factor)},${Math.round(b / count * factor)}`);
            } catch {
                setColor(null);
            }
        };
        img.onerror = () => setColor(null);
        img.src = imageUrl;
    }, [imageUrl]);

    return color;
}

const HERO_INTERVAL_MS = 12000; // 12 seconds per hero

const ModernHome = () => {
    const {
        heroItems,
        resumeItems,
        nextUpItems,
        libraries,
        isPending
    } = useHomeData();
    const mainTabsManagerPromise = useMemo(() => import('../../../components/maintabsmanager'), []);

    const [activeTab, setActiveTab] = React.useState(0);
    const [heroIndex, setHeroIndex] = useState(0);

    // Advance hero every HERO_INTERVAL_MS — CSS animation handles the smooth progress bar
    useEffect(() => {
        if (heroItems.length <= 1) return;
        const id = setInterval(() => {
            setHeroIndex(prev => (prev + 1) % heroItems.length);
        }, HERO_INTERVAL_MS);
        return () => clearInterval(id);
    }, [heroItems.length]);

    const handleTabChange = useCallback(async (index: number) => {
        setActiveTab(index);
        const manager = await mainTabsManagerPromise;
        const mainManager = manager as unknown as { selectedTabIndex?: (i: number) => void };
        if (mainManager?.selectedTabIndex) {
            mainManager.selectedTabIndex(index);
        }
    }, [mainTabsManagerPromise]);

    const heroItem = heroItems[heroIndex];
    const apiClient = ServerConnections.currentApiClient();
    const backdropUrl = heroItem?.Id ?
        (apiClient?.getScaledImageUrl(heroItem.Id, { type: 'Backdrop', maxWidth: 400, quality: 60 }) ?? undefined) :
        undefined;
    const bgColor = useBackdropColor(backdropUrl);

    if (isPending && !heroItem) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box
            sx={{
                px: { xs: 1.5, sm: 3, md: 6 },
                pb: 6,
                mt: -8,
                pt: 8,
                position: 'relative',
                transition: 'background 1.2s ease',
                ...(bgColor ? {
                    background: `radial-gradient(ellipse 120% 55% at 50% 0%, rgba(${bgColor},0.4) 0%, transparent 65%)`
                } : {})
            }}
        >
            <ModernTopNav
                activeTab={activeTab}
                onTabChange={handleTabChange}
                libraries={libraries}
            />

            <Grid container spacing={4}>
                {/* Main Content Column */}
                <Grid size={{ xs: 12, lg: 9 }}>
                    <HeroSection item={heroItem} isPending={isPending} heroItems={heroItems} heroIndex={heroIndex} />

                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <MediaRow
                            title='Continue Watching'
                            items={resumeItems}
                            shape='backdrop'
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
        </Box>
    );
};

export default Home;

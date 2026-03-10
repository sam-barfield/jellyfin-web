import { ThemeProvider } from '@mui/material/styles';
import React from 'react';
import {
    RouterProvider,
    createHashRouter,
    Outlet,
    useLocation
} from 'react-router-dom';

import { DASHBOARD_APP_PATHS, DASHBOARD_APP_ROUTES } from 'apps/dashboard/routes/routes';
import { EXPERIMENTAL_APP_ROUTES } from 'apps/experimental/routes/routes';
import { STABLE_APP_ROUTES } from 'apps/stable/routes/routes';
import { WIZARD_APP_ROUTES } from 'apps/wizard/routes/routes';
import AppHeader from 'components/AppHeader';
import Backdrop from 'components/Backdrop';
import BangRedirect from 'components/router/BangRedirect';
import { createRouterHistory } from 'components/router/routerHistory';
import appTheme from 'themes/themes';
import { ThemeStorageManager } from 'themes/themeStorageManager';

const layoutMode = localStorage.getItem('layout');
const isExperimentalLayout = layoutMode === 'experimental';

const router = createHashRouter([
    {
        element: <RootAppLayout />,
        children: [
            ...(isExperimentalLayout ? EXPERIMENTAL_APP_ROUTES : STABLE_APP_ROUTES),
            ...DASHBOARD_APP_ROUTES,
            ...WIZARD_APP_ROUTES,
            {
                path: '!/*',
                Component: BangRedirect
            }
        ]
    }
]);

export const history = createRouterHistory(router);

export default function RootAppRouter() {
    return <RouterProvider router={router} />;
}

/**
 * Layout component that renders legacy components required on all pages.
 * NOTE: The app will crash if these get removed from the DOM.
 */
function RootAppLayout() {
    const location = useLocation();
    const isNewLayoutPath = Object.values(DASHBOARD_APP_PATHS)
        .some(path => location.pathname.startsWith(`/${path}`));

    React.useEffect(() => {
        let shortcutsModule: { on: (context: Document | HTMLElement) => void; off: (context: Document | HTMLElement) => void } | null = null;
        import('components/shortcuts').then(({ default: shortcuts }) => {
            shortcutsModule = shortcuts;
            shortcuts.on(document);
        }).catch(err => {
            console.error('Failed to load shortcuts module:', err);
        });

        return () => {
            if (shortcutsModule) {
                shortcutsModule.off(document);
            }
        };
    }, []);

    React.useEffect(() => {
        if (!document.getElementById('modern-home-styles')) {
            const style = document.createElement('style');
            style.id = 'modern-home-styles';
            style.innerHTML = `
                /* Remove padding-top added by AppOverrides.scss for the legacy fixed AppBar */
                .homePage.libraryPage.withTabs,
                .homePage.libraryPage {
                    padding-top: 0 !important;
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
                    padding: 4px 4px 0 4px !important;
                    border: none !important;
                    text-align: center !important;
                }
                .homePage .cardText {
                    font-family: "Noto Sans", sans-serif;
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
                /* Duplicate Hover Buttons Fix */
                .homePage .cardOverlayContainer > div.cardOverlayButton-br > button[is="emby-ratingbutton"],
                .homePage .cardOverlayContainer > div.cardOverlayButton-br > button[is="emby-playstatebutton"] {
                    display: none !important;
                }
                /* Move Legacy Play Button to Bottom Left and Stylize */
                .homePage .cardOverlayContainer .cardOverlayButton-br.flex {
                    position: absolute !important;
                    top: auto !important;
                    bottom: 0 !important;
                    left: 0 !important;
                    right: auto !important;
                    padding: 10px !important;
                    display: flex !important;
                }
                .homePage .cardOverlayContainer .cardOverlayButton-br.flex button[is="emby-playbutton"] {
                    background-color: rgba(0, 0, 0, 0.65) !important;
                    backdrop-filter: blur(6px) !important;
                    -webkit-backdrop-filter: blur(6px) !important;
                    color: white !important;
                    border-radius: 50% !important;
                    width: 34px !important;
                    height: 34px !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    transition: all 0.2s ease !important;
                    padding: 0 !important;
                    margin: 0 !important;
                }
                .homePage .cardOverlayContainer .cardOverlayButton-br.flex button[is="emby-playbutton"]:hover {
                    background-color: rgba(0, 164, 220, 0.85) !important;
                    transform: scale(1.1) !important;
                    color: white !important;
                }
                .homePage .cardOverlayContainer .cardOverlayButton-br.flex button[is="emby-playbutton"] * {
                    font-size: 22px !important;
                    margin: 0 !important;
                }
                /* Hide Announcements Button during video playback */
                html:has(.videoPlayerContainer-onTop) button[aria-label="announcements"],
                html:has(.videoPlayerContainer-onTop) .headerAnnouncementsButtonContainer {
                    display: none !important;
                }
                /* ── TV / Controller Focus Styles ─────────────────────────── */
                /* Global: remove outline only for mouse, keep for keyboard/controller */
                :focus { outline: none; }
                :focus-visible {
                    outline: 3px solid #00a4dc !important;
                    outline-offset: 3px !important;
                    border-radius: 6px !important;
                    box-shadow: 0 0 0 6px rgba(0,164,220,0.25) !important;
                }
                /* Focused media card — scale up and highlight */
                .homePage .media-card-root:focus-visible {
                    transform: scale(1.08) !important;
                    outline: 3px solid #00a4dc !important;
                    outline-offset: 4px !important;
                    box-shadow: 0 0 20px rgba(0,164,220,0.5) !important;
                    border-radius: 10px !important;
                    z-index: 10 !important;
                }
                /* Card actions visible when card is focused */
                .homePage .media-card-root:focus-visible .card-actions {
                    opacity: 1 !important;
                    transform: translateY(0) !important;
                }
                /* Nav Items */
                .home-nav-item:focus-visible {
                    outline: 3px solid #00a4dc !important;
                    background: rgba(0,164,220,0.15) !important;
                    border-radius: 8px !important;
                    box-shadow: 0 0 12px rgba(0,164,220,0.3) !important;
                }
                /* Trending rows */
                .trending-row-item:focus-visible {
                    outline: 3px solid #00a4dc !important;
                    background: rgba(0,164,220,0.12) !important;
                    border-radius: 10px !important;
                }
                /* ── Legacy Sidebar Modernization (Home Page Only) ── */
                .mainDrawer.touch-menu-la {
                    background: rgba(20, 20, 25, 0.75) !important;
                    background-color: rgba(20, 20, 25, 0.75) !important;
                    backdrop-filter: blur(20px) !important;
                    -webkit-backdrop-filter: blur(20px) !important;
                    border-right: 1px solid rgba(255, 255, 255, 0.1) !important;
                    box-shadow: 4px 0 24px rgba(0, 0, 0, 0.5) !important;
                    width: 280px !important; /* Slightly wider than React drawer for legacy content */
                }
                .mainDrawer-scrollContainer {
                    padding: 12px 0 !important;
                }
                .mainDrawer .navMenuOption {
                    border-radius: 10px !important;
                    margin: 4px 12px !important;
                    padding: 10px 16px !important;
                    color: rgba(255, 255, 255, 0.7) !important;
                    background: transparent !important;
                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
                    display: flex !important;
                    align-items: center !important;
                    text-decoration: none !important;
                }
                .mainDrawer .navMenuOption:hover {
                    background-color: rgba(255, 255, 255, 0.08) !important;
                    color: #fff !important;
                    transform: translateX(4px) !important;
                }
                .mainDrawer .navMenuOption-selected,
                .mainDrawer .navMenuOption.selected {
                    background-color: rgba(0, 164, 220, 0.15) !important;
                    color: #00a4dc !important;
                    font-weight: 700 !important;
                }
                .mainDrawer .navMenuOptionIcon {
                    margin-right: 14px !important;
                    color: inherit !important;
                    font-size: 24px !important;
                    transition: transform 0.2s ease !important;
                }
                .mainDrawer .navMenuOption:hover .navMenuOptionIcon {
                    color: #00a4dc !important;
                    transform: scale(1.1) !important;
                }
                .mainDrawer .sidebarHeader {
                    padding: 20px 24px 8px !important;
                    font-size: 0.72rem !important;
                    text-transform: uppercase !important;
                    letter-spacing: 0.15em !important;
                    color: rgba(255, 255, 255, 0.4) !important;
                    font-weight: 800 !important;
                    margin: 0 !important;
                }
                .tmla-mask {
                    background-color: rgba(0, 0, 0, 0.45) !important;
                    backdrop-filter: blur(4px) !important;
                    -webkit-backdrop-filter: blur(4px) !important;
                }
                /* Hide scrollbar */
                .mainDrawer-scrollContainer::-webkit-scrollbar {
                    display: none !important;
                }
            `;
            document.head.appendChild(style);
        }
    }, []);

    return (
        <ThemeProvider
            theme={appTheme}
            defaultMode='dark'
            storageManager={ThemeStorageManager}
        >
            <Backdrop />
            <AppHeader isHidden={isExperimentalLayout || isNewLayoutPath} />

            <Outlet />
        </ThemeProvider>
    );
}

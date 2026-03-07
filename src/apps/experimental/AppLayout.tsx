import React, { StrictMode, useCallback, useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import { type Theme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { Outlet, useLocation } from 'react-router-dom';

import AppBody from 'components/AppBody';
import CustomCss from 'components/CustomCss';
import ElevationScroll from 'components/ElevationScroll';
import ThemeCss from 'components/ThemeCss';
import { useApi } from 'hooks/useApi';

import AppToolbar from './components/AppToolbar';
import AppDrawer, { isDrawerPath } from './components/drawers/AppDrawer';
import MainDrawerContent from './components/drawers/MainDrawerContent';
import { NavContext } from './contexts/NavContext';

import Events from 'utils/events';

import './AppOverrides.scss';

export const Component = () => {
    const [ isDrawerActive, setIsDrawerActive ] = useState(false);
    const { user } = useApi();
    const location = useLocation();

    const isMediumScreen = useMediaQuery((t: Theme) => t.breakpoints.up('md'));
    const isHomePage = location.pathname === '/home';
    const isDrawerAvailable = Boolean(user) && (isHomePage || (isDrawerPath(location.pathname) && !isMediumScreen));

    // Force drawer open state logic
    const isDrawerOpen = isDrawerActive && isDrawerAvailable;

    // Use events as the single source of truth for toggling
    const onToggleDrawer = useCallback(() => {
        Events.trigger(window, 'jellyfin-toggle-drawer');
    }, []);

    const onOpenDrawer = useCallback(() => setIsDrawerActive(true), []);
    const onCloseDrawer = useCallback(() => setIsDrawerActive(false), []);

    // Global toggle function for absolute robustness
    React.useEffect(() => {
        interface WindowWithDrawerFunctions extends Window {
            jellyfinToggleDrawer?: () => void
            jellyfinOpenDrawer?: () => void
            jellyfinCloseDrawer?: () => void
        }
        const win = window as unknown as WindowWithDrawerFunctions;
        win.jellyfinToggleDrawer = () => setIsDrawerActive(prev => !prev);
        win.jellyfinOpenDrawer = () => setIsDrawerActive(true);
        win.jellyfinCloseDrawer = () => setIsDrawerActive(false);

        const handleToggle = () => setIsDrawerActive(prev => !prev);
        Events.on(window, 'jellyfin-toggle-drawer', handleToggle);
        Events.on(window, 'jellyfin-open-drawer', onOpenDrawer);
        Events.on(window, 'jellyfin-close-drawer', onCloseDrawer);

        return () => {
            delete win.jellyfinToggleDrawer;
            delete win.jellyfinOpenDrawer;
            delete win.jellyfinCloseDrawer;
            Events.off(window, 'jellyfin-toggle-drawer', handleToggle);
            Events.off(window, 'jellyfin-open-drawer', onOpenDrawer);
            Events.off(window, 'jellyfin-close-drawer', onCloseDrawer);
        };
    }, [onOpenDrawer, onCloseDrawer]);

    return (
        <NavContext.Provider value={{ isDrawerOpen, isDrawerAvailable, onToggleDrawer }}>
            <Box sx={{ position: 'relative', display: 'flex', height: '100%' }}>
                <StrictMode>
                    {/* Hide the legacy AppBar on the home page — UnifiedNav handles it there */}
                    {!isHomePage && (
                        <ElevationScroll elevate={false}>
                            <AppBar
                                position='fixed'
                                sx={{ width: '100%', ml: 0 }}
                            >
                                <AppToolbar
                                    isDrawerAvailable={!isMediumScreen && isDrawerAvailable}
                                    isDrawerOpen={isDrawerOpen}
                                    onDrawerButtonClick={onToggleDrawer}
                                />
                            </AppBar>
                        </ElevationScroll>
                    )}

                    {/* On the home page use a SwipeableDrawer overlay so it toggles properly.
                        On other pages use the standard AppDrawer (permanent on desktop). */}
                    {isHomePage ? (
                        <Drawer
                            anchor='left'
                            open={isDrawerActive}
                            onClose={onCloseDrawer}
                            variant='temporary'
                            ModalProps={{ keepMounted: true }}
                            slotProps={{
                                paper: {
                                    sx: {
                                        width: 240,
                                        background: 'rgba(20, 20, 25, 0.75) !important',
                                        backgroundColor: 'rgba(20, 20, 25, 0.75) !important',
                                        backdropFilter: 'blur(20px) !important',
                                        WebkitBackdropFilter: 'blur(20px) !important',
                                        boxSizing: 'border-box',
                                        borderRight: '1px solid rgba(255,255,255,0.1) !important',
                                        boxShadow: '4px 0 24px rgba(0,0,0,0.5) !important'
                                    }
                                }
                            }}
                        >
                            <Box
                                role='presentation'
                                onClick={onCloseDrawer}
                                onKeyDown={onCloseDrawer}
                                sx={{ height: '100%' }}
                            >
                                <MainDrawerContent />
                            </Box>
                        </Drawer>
                    ) : (
                        isDrawerAvailable && (
                            <AppDrawer
                                open={isDrawerOpen}
                                onClose={onCloseDrawer}
                                onOpen={onOpenDrawer}
                            />
                        )
                    )}
                </StrictMode>

                <Box
                    component='main'
                    sx={{
                        width: '100%',
                        flexGrow: 1
                    }}
                >
                    <AppBody>
                        <Outlet />
                    </AppBody>
                </Box>
            </Box>
            <ThemeCss />
            <CustomCss />
        </NavContext.Provider>
    );
};

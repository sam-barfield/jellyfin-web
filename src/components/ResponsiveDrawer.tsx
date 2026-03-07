import type { Theme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import SwipeableDrawer from '@mui/material/SwipeableDrawer';
import useMediaQuery from '@mui/material/useMediaQuery';
import React, { type FC, type PropsWithChildren } from 'react';

import browser from 'scripts/browser';

export const DRAWER_WIDTH = 240;

export interface ResponsiveDrawerProps {
    open: boolean
    onClose: () => void
    onOpen: () => void
}

const ResponsiveDrawer: FC<PropsWithChildren<ResponsiveDrawerProps>> = ({
    children,
    open = false,
    onClose,
    onOpen
}) => {
    const isMediumScreen = useMediaQuery((theme: Theme) => theme.breakpoints.up('md'));

    return ( isMediumScreen ? (
        /* DESKTOP DRAWER */
        <Drawer
            sx={{
                width: DRAWER_WIDTH,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                    width: DRAWER_WIDTH,
                    background: 'rgba(20, 20, 25, 0.75) !important',
                    backgroundColor: 'rgba(20, 20, 25, 0.75) !important',
                    backdropFilter: 'blur(20px) !important',
                    WebkitBackdropFilter: 'blur(20px) !important',
                    paddingBottom: '4.2rem', // Padding for now playing bar
                    boxSizing: 'border-box',
                    borderRight: '1px solid rgba(255,255,255,0.1) !important',
                    boxShadow: '4px 0 24px rgba(0,0,0,0.5) !important'
                }
            }}
            variant='permanent'
            anchor='left'
        >
            {children}
        </Drawer>
    ) : (
        /* MOBILE DRAWER */
        <SwipeableDrawer
            anchor='left'
            open={open}
            onClose={onClose}
            onOpen={onOpen}
            // Disable swipe to open on iOS since it interferes with back navigation
            disableDiscovery={browser.iOS}
            ModalProps={{
                keepMounted: true // Better open performance on mobile.
            }}
            slotProps={{
                paper: {
                    sx: {
                        width: DRAWER_WIDTH,
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
                // Close the drawer when the content is clicked
                onClick={onClose}
                onKeyDown={onClose}
                sx={{ height: '100%', background: 'transparent !important' }}
            >
                {children}
            </Box>
        </SwipeableDrawer>
    ));
};

export default ResponsiveDrawer;

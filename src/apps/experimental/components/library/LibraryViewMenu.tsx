
import ArrowDropDown from '@mui/icons-material/ArrowDropDown';
import Button from '@mui/material/Button/Button';
import Menu from '@mui/material/Menu/Menu';
import MenuItem from '@mui/material/MenuItem/MenuItem';
import React, { FC, useCallback, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';

import { LibraryRoutes } from 'apps/experimental/features/libraries/constants/libraryRoutes';
import useCurrentTab from 'hooks/useCurrentTab';
import globalize from 'lib/globalize';

const LIBRARY_VIEW_MENU_ID = 'library-view-menu';

const LibraryViewMenu: FC = () => {
    const location = useLocation();
    const [ searchParams, setSearchParams ] = useSearchParams();
    const { activeTab } = useCurrentTab();

    const [ menuAnchorEl, setMenuAnchorEl ] = useState<null | HTMLElement>(null);
    const isMenuOpen = Boolean(menuAnchorEl);

    const onMenuButtonClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
        setMenuAnchorEl(event.currentTarget);
    }, []);

    const onMenuClose = useCallback(() => {
        setMenuAnchorEl(null);
    }, []);

    const currentRoute = LibraryRoutes.find(({ path }) => path === location.pathname);
    const currentTab = currentRoute?.views.find(({ index }) => index === activeTab);

    if (!currentTab) return null;

    return (
        <>
            <Button
                variant='text'
                size='large'
                color='inherit'
                endIcon={<ArrowDropDown />}
                aria-controls={LIBRARY_VIEW_MENU_ID}
                aria-haspopup='true'
                onClick={onMenuButtonClick}
                sx={{ borderRadius: '14px', px: 2, py: 0.5 }}
            >
                {globalize.translate(currentTab.label)}
            </Button>

            <Menu
                anchorEl={menuAnchorEl}
                id={LIBRARY_VIEW_MENU_ID}
                keepMounted
                open={isMenuOpen}
                onClose={onMenuClose}
                slotProps={{
                    paper: {
                        sx: {
                            mt: 1.5,
                            background: 'rgba(20, 20, 25, 0.75)',
                            backdropFilter: 'blur(20px)',
                            WebkitBackdropFilter: 'blur(20px)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '16px',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                            overflow: 'hidden',
                            '& .MuiList-root': {
                                p: 0.25
                            },
                            '& .MuiMenuItem-root': {
                                transition: 'all 0.2s',
                                borderRadius: '8px',
                                m: 0.75,
                                px: 2,
                                py: 1,
                                color: 'rgba(255, 255, 255, 0.8)',
                                '&:hover': {
                                    background: 'rgba(255, 255, 255, 0.08)',
                                    color: 'white'
                                },
                                '&.Mui-selected': {
                                    fontWeight: 600,
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    color: 'white',
                                    '&:hover': {
                                        background: 'rgba(255, 255, 255, 0.15)'
                                    }
                                }
                            }
                        }
                    }
                }}
            >
                {currentRoute?.views.map(tab => (
                    <MenuItem
                        key={tab.view}
                        // eslint-disable-next-line react/jsx-no-bind
                        onClick={() => {
                            searchParams.set('tab', `${tab.index}`);
                            setSearchParams(searchParams);
                            onMenuClose();
                        }}
                        selected={tab.index === currentTab.index}
                    >
                        {globalize.translate(tab.label)}
                    </MenuItem>
                ))}
            </Menu>
        </>
    );
};

export default LibraryViewMenu;

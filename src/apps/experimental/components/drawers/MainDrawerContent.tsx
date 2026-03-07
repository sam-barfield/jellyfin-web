import Favorite from '@mui/icons-material/Favorite';
import Home from '@mui/icons-material/Home';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Icon from '@mui/material/Icon';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import React from 'react';
import { useLocation } from 'react-router-dom';

import ListItemLink from 'components/ListItemLink';
import { appRouter } from 'components/router/appRouter';
import { useApi } from 'hooks/useApi';
import { useUserViews } from 'hooks/useUserViews';
import { useWebConfig } from 'hooks/useWebConfig';
import globalize from 'lib/globalize';

import LibraryIcon from '../LibraryIcon';
import DrawerHeaderLink from './DrawerHeaderLink';

const MainDrawerContent = () => {
    const { user } = useApi();
    const location = useLocation();
    const { data: userViewsData } = useUserViews(user?.Id);
    const userViews = userViewsData?.Items || [];
    const webConfig = useWebConfig();

    const isHomeSelected = location.pathname === '/home' && (!location.search || location.search === '?tab=0');

    return (
        <Box sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            pt: 1,
            px: 1, // Add side padding for hover pills
            background: 'transparent !important', // Ensure container is transparent for glass effect
            '& .MuiList-root': {
                p: 0,
                background: 'transparent !important'
            },
            '& .MuiListItem-root': {
                mb: 0.5,
                background: 'transparent !important'
            },
            '& .MuiListItemButton-root': {
                borderRadius: '8px !important', // Force rounded corners
                py: 1.25,
                px: 2,
                transition: 'all 0.2s ease',
                '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.05) !important', // Force hover background
                    '& .MuiListItemIcon-root': {
                        color: 'primary.main !important',
                        transform: 'scale(1.1)'
                    }
                },
                '&.Mui-selected': {
                    backgroundColor: 'rgba(0, 164, 220, 0.15) !important', // Force selection background
                    '&:hover': {
                        backgroundColor: 'rgba(0, 164, 220, 0.2) !important'
                    },
                    '& .MuiListItemIcon-root': {
                        color: 'primary.main !important'
                    },
                    '& .MuiListItemText-primary': {
                        color: 'primary.main !important',
                        fontWeight: 700
                    }
                }
            },
            '& .MuiListItemIcon-root': {
                color: 'rgba(255, 255, 255, 0.7) !important',
                minWidth: 40,
                transition: 'all 0.2s ease'
            },
            '& .MuiListItemText-primary': {
                fontSize: '0.95rem',
                fontWeight: 500,
                transition: 'color 0.2s ease'
            },
            '& .MuiDivider-root': {
                my: 1.5,
                mx: 2,
                borderColor: 'rgba(255, 255, 255, 0.1) !important'
            },
            '& .MuiListSubheader-root': {
                backgroundColor: 'transparent !important',
                color: 'rgba(255, 255, 255, 0.4) !important',
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                lineHeight: '2rem',
                mt: 2,
                mb: 0.5,
                px: 3
            }
        }}>
            {/* MAIN LINKS */}
            <List>
                <ListItem disablePadding>
                    <DrawerHeaderLink />
                </ListItem>
                <ListItem disablePadding>
                    <ListItemLink to='/home' selected={isHomeSelected}>
                        <ListItemIcon>
                            <Home />
                        </ListItemIcon>
                        <ListItemText primary={globalize.translate('Home')} />
                    </ListItemLink>
                </ListItem>
                <ListItem disablePadding>
                    <ListItemLink to='/home?tab=1'>
                        <ListItemIcon>
                            <Favorite />
                        </ListItemIcon>
                        <ListItemText primary={globalize.translate('Favorites')} />
                    </ListItemLink>
                </ListItem>
            </List>

            {/* CUSTOM LINKS */}
            {(!!webConfig.menuLinks && webConfig.menuLinks.length > 0) && (
                <>
                    <Divider />
                    <List>
                        {webConfig.menuLinks.map(menuLink => (
                            <ListItem
                                key={`${menuLink.name}_${menuLink.url}`}
                                disablePadding
                            >
                                <ListItemButton
                                    component='a'
                                    href={menuLink.url}
                                    target='_blank'
                                    rel='noopener noreferrer'
                                >
                                    <ListItemIcon>
                                        <Icon>{menuLink.icon ?? 'link'}</Icon>
                                    </ListItemIcon>
                                    <ListItemText primary={menuLink.name} />
                                </ListItemButton>
                            </ListItem>
                        ))}
                    </List>
                </>
            )}

            {/* LIBRARY LINKS */}
            {userViews.length > 0 && (
                <>
                    <Divider />
                    <List
                        aria-labelledby='libraries-subheader'
                        subheader={
                            <ListSubheader component='div' id='libraries-subheader'>
                                {globalize.translate('HeaderLibraries')}
                            </ListSubheader>
                        }
                    >
                        {userViews.map(view => (
                            <ListItem key={view.Id} disablePadding>
                                <ListItemLink
                                    to={appRouter.getRouteUrl(view, { context: view.CollectionType }).substring(1)}
                                >
                                    <ListItemIcon>
                                        <LibraryIcon item={view} />
                                    </ListItemIcon>
                                    <ListItemText primary={view.Name} />
                                </ListItemLink>
                            </ListItem>
                        ))}

                    </List>
                </>
            )}
        </Box>
    );
};

export default MainDrawerContent;

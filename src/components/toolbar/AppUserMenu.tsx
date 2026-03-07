import AccountCircle from '@mui/icons-material/AccountCircle';
import AppSettingsAlt from '@mui/icons-material/AppSettingsAlt';
import Close from '@mui/icons-material/Close';
import DashboardIcon from '@mui/icons-material/Dashboard';
import Download from '@mui/icons-material/Download';
import Edit from '@mui/icons-material/Edit';
import Logout from '@mui/icons-material/Logout';
import PhonelinkLock from '@mui/icons-material/PhonelinkLock';
import Settings from '@mui/icons-material/Settings';
import Storage from '@mui/icons-material/Storage';
import Divider from '@mui/material/Divider';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu, { MenuProps } from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import React, { FC, useCallback } from 'react';
import { Link } from 'react-router-dom';

import { appHost } from 'components/apphost';
import { AppFeature } from 'constants/appFeature';
import { useApi } from 'hooks/useApi';
import { useQuickConnectEnabled } from 'hooks/useQuickConnect';
import globalize from 'lib/globalize';
import shell from 'scripts/shell';
import Dashboard from 'utils/dashboard';

export const ID = 'app-user-menu';

interface AppUserMenuProps extends MenuProps {
    onMenuClose: () => void
}

const AppUserMenu: FC<AppUserMenuProps> = ({
    anchorEl,
    open,
    onMenuClose
}) => {
    const { user } = useApi();
    const { data: isQuickConnectEnabled } = useQuickConnectEnabled();

    const onDownloadManagerClick = useCallback(() => {
        shell.openDownloadManager();
        onMenuClose();
    }, [ onMenuClose ]);

    const onClientSettingsClick = useCallback(() => {
        shell.openClientSettings();
        onMenuClose();
    }, [ onMenuClose ]);

    const onExitAppClick = useCallback(() => {
        appHost.exit();
        onMenuClose();
    }, [ onMenuClose ]);

    const onLogoutClick = useCallback(() => {
        Dashboard.logout();
        onMenuClose();
    }, [ onMenuClose ]);

    const onSelectServerClick = useCallback(() => {
        Dashboard.selectServer();
        onMenuClose();
    }, [ onMenuClose ]);

    return (
        <Menu
            anchorEl={anchorEl}
            anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right'
            }}
            transformOrigin={{
                vertical: 'top',
                horizontal: 'right'
            }}
            id={ID}
            keepMounted
            open={open}
            onClose={onMenuClose}
            sx={{
                '& .MuiPaper-root': {
                    backgroundColor: 'rgba(20, 20, 25, 0.75)',
                    background: 'rgba(20, 20, 25, 0.75)', // Match AnnouncementButton exactly
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                    borderRadius: '16px',
                    mt: 1.5,
                    minWidth: 220, // Slightly narrower
                    px: 0.5, // Reduced outer horizontal padding
                    py: 1 // Reduced outer vertical padding
                },
                '& .MuiMenuItem-root': {
                    borderRadius: 2,
                    mx: 0.5,
                    my: 0.15, // Reduced vertical margin between items
                    px: 1.5, // Reduced horizontal padding within items
                    py: 0.75, // Reduced vertical padding within items
                    minHeight: '36px', // Ensure consistent but smaller height
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                        backgroundColor: 'rgba(0,164,220,0.2)', // Slightly stronger hover tint
                        transform: 'translateX(3px)', // Slightly less extreme slide
                        '& .MuiListItemIcon-root': {
                            color: 'primary.main',
                            transform: 'scale(1.05)' // Subtler scale
                        },
                        '& .MuiTypography-root': {
                            color: 'primary.main'
                        }
                    }
                },
                '& .MuiListItemIcon-root': {
                    color: 'rgba(255,255,255,0.7)',
                    minWidth: 40,
                    transition: 'all 0.2s ease'
                },
                '& .MuiTypography-root': {
                    fontWeight: 500,
                    fontSize: '0.95rem',
                    transition: 'all 0.2s ease'
                },
                '& .MuiDivider-root': {
                    my: 1,
                    mx: 1.5,
                    borderColor: 'rgba(255,255,255,0.1)'
                }
            }}
        >
            <MenuItem
                component={Link}
                to={`/userprofile?userId=${user?.Id}`}
                onClick={onMenuClose}
            >
                <ListItemIcon>
                    <AccountCircle />
                </ListItemIcon>
                <ListItemText>
                    {globalize.translate('Profile')}
                </ListItemText>
            </MenuItem>
            <MenuItem
                component={Link}
                to='/mypreferencesmenu'
                onClick={onMenuClose}
            >
                <ListItemIcon>
                    <Settings />
                </ListItemIcon>
                <ListItemText>
                    {globalize.translate('Settings')}
                </ListItemText>
            </MenuItem>

            {(appHost.supports(AppFeature.DownloadManagement) || appHost.supports(AppFeature.ClientSettings)) && (
                <Divider />
            )}

            {appHost.supports(AppFeature.DownloadManagement) && (
                <MenuItem
                    onClick={onDownloadManagerClick}
                >
                    <ListItemIcon>
                        <Download />
                    </ListItemIcon>
                    <ListItemText>
                        {globalize.translate('DownloadManager')}
                    </ListItemText>
                </MenuItem>
            )}

            {appHost.supports(AppFeature.ClientSettings) && (
                <MenuItem
                    onClick={onClientSettingsClick}
                >
                    <ListItemIcon>
                        <AppSettingsAlt />
                    </ListItemIcon>
                    <ListItemText>
                        {globalize.translate('ClientSettings')}
                    </ListItemText>
                </MenuItem>
            )}

            {/* ADMIN LINKS */}
            {user?.Policy?.IsAdministrator && ([
                <Divider key='admin-links-divider' />,
                <MenuItem
                    key='admin-dashboard-link'
                    component={Link}
                    to='/dashboard'
                    onClick={onMenuClose}
                >

                    <ListItemIcon>
                        <DashboardIcon />
                    </ListItemIcon>
                    <ListItemText primary={globalize.translate('TabDashboard')} />
                </MenuItem>,
                <MenuItem
                    key='admin-metadata-link'
                    component={Link}
                    to='/metadata'
                    onClick={onMenuClose}
                >
                    <ListItemIcon>
                        <Edit />
                    </ListItemIcon>
                    <ListItemText primary={globalize.translate('MetadataManager')} />
                </MenuItem>
            ])}

            <Divider />
            {isQuickConnectEnabled && (
                <MenuItem
                    component={Link}
                    to='/quickconnect'
                    onClick={onMenuClose}
                >
                    <ListItemIcon>
                        <PhonelinkLock />
                    </ListItemIcon>
                    <ListItemText>
                        {globalize.translate('QuickConnect')}
                    </ListItemText>
                </MenuItem>
            )}

            {appHost.supports(AppFeature.MultiServer) && (
                <MenuItem
                    onClick={onSelectServerClick}
                >
                    <ListItemIcon>
                        <Storage />
                    </ListItemIcon>
                    <ListItemText>
                        {globalize.translate('SelectServer')}
                    </ListItemText>
                </MenuItem>
            )}

            <MenuItem
                onClick={onLogoutClick}
            >
                <ListItemIcon>
                    <Logout />
                </ListItemIcon>
                <ListItemText>
                    {globalize.translate('ButtonSignOut')}
                </ListItemText>
            </MenuItem>

            {appHost.supports(AppFeature.ExitMenu) && ([
                <Divider key='exit-menu-divider' />,
                <MenuItem
                    key='exit-menu-button'
                    onClick={onExitAppClick}
                >
                    <ListItemIcon>
                        <Close />
                    </ListItemIcon>
                    <ListItemText>
                        {globalize.translate('ButtonExitApp')}
                    </ListItemText>
                </MenuItem>
            ])}
        </Menu>
    );
};

export default AppUserMenu;

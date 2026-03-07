import { SyncPlayUserAccessType } from '@jellyfin/sdk/lib/generated-client/models/sync-play-user-access-type';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import React, { useCallback, useState } from 'react';

import { pluginManager } from 'components/pluginManager';
import { useApi } from 'hooks/useApi';
import globalize from 'lib/globalize';
import { PluginType } from 'types/plugin';

import AppSyncPlayMenu, { ID } from './menus/SyncPlayMenu';

const navIconSx = {
    color: 'rgba(255,255,255,0.75)',
    padding: '8px',
    transition: 'color 0.2s ease, transform 0.2s ease',
    '&:hover': {
        color: '#00a4dc',
        transform: 'scale(1.15)',
        backgroundColor: 'transparent'
    },
    '&:focus-visible': { outline: '2px solid #00a4dc', outlineOffset: '2px', borderRadius: '8px' }
};

const SyncPlayButton = () => {
    const { user } = useApi();

    const [ syncPlayMenuAnchorEl, setSyncPlayMenuAnchorEl ] = useState<null | HTMLElement>(null);
    const isSyncPlayMenuOpen = Boolean(syncPlayMenuAnchorEl);

    const onSyncPlayButtonClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
        setSyncPlayMenuAnchorEl(event.currentTarget);
    }, [ setSyncPlayMenuAnchorEl ]);

    const onSyncPlayMenuClose = useCallback(() => {
        setSyncPlayMenuAnchorEl(null);
    }, [ setSyncPlayMenuAnchorEl ]);

    if (
        // SyncPlay not enabled for user
        (user?.Policy && user.Policy.SyncPlayAccess === SyncPlayUserAccessType.None)
        // SyncPlay plugin is not loaded
        || pluginManager.ofType(PluginType.SyncPlay).length === 0
    ) {
        return null;
    }

    return (
        <>
            <Tooltip title={globalize.translate('ButtonSyncPlay')}>
                <IconButton
                    aria-label={globalize.translate('ButtonSyncPlay')}
                    aria-controls={ID}
                    aria-haspopup='true'
                    onClick={onSyncPlayButtonClick}
                    color='inherit'
                    disableRipple
                    sx={navIconSx}
                >
                    <GroupsRoundedIcon />
                </IconButton>
            </Tooltip>

            <AppSyncPlayMenu
                open={isSyncPlayMenuOpen}
                anchorEl={syncPlayMenuAnchorEl}
                onMenuClose={onSyncPlayMenuClose}
            />
        </>
    );
};

export default SyncPlayButton;

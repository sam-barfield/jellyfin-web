import React, { useCallback, useState, useMemo } from 'react';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Badge from '@mui/material/Badge';
import PeopleRoundedIcon from '@mui/icons-material/PeopleRounded';
import { SyncPlayUserAccessType } from '@jellyfin/sdk/lib/generated-client/models/sync-play-user-access-type';

import { pluginManager } from 'components/pluginManager';
import { useApi } from 'hooks/useApi';
import { PluginType } from 'types/plugin';
import { useLiveFriendsList } from '../../features/friends/api/useFriends';
import FriendsSyncMenu, { ID } from './menus/FriendsSyncMenu';

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

const FriendsSyncButton = () => {
    const { user } = useApi();
    const { data: friends } = useLiveFriendsList();

    const onlineCount = useMemo(() =>
        friends?.filter(f => f.IsOnline).length ?? 0
    , [friends]);

    const [ menuAnchorEl, setMenuAnchorEl ] = useState<null | HTMLElement>(null);
    const isMenuOpen = Boolean(menuAnchorEl);

    const onButtonClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
        setMenuAnchorEl(event.currentTarget);
    }, []);

    const onMenuClose = useCallback(() => {
        setMenuAnchorEl(null);
    }, []);

    // If SyncPlay is disabled, we still show the friends button
    const isSyncPlayAvailable = !(
        (user?.Policy && user.Policy.SyncPlayAccess === SyncPlayUserAccessType.None)
        || pluginManager.ofType(PluginType.SyncPlay).length === 0
    );

    return (
        <>
            <Tooltip title={isSyncPlayAvailable ? 'Friends & SyncPlay' : 'Friends'}>
                <IconButton
                    aria-label='Friends and SyncPlay'
                    aria-controls={ID}
                    aria-haspopup='true'
                    onClick={onButtonClick}
                    color='inherit'
                    disableRipple
                    sx={navIconSx}
                >
                    <Badge
                        badgeContent={onlineCount}
                        color='primary'
                        invisible={onlineCount === 0}
                        sx={{
                            '& .MuiBadge-badge': {
                                backgroundColor: '#00a4dc',
                                color: 'white',
                                fontSize: '0.65rem',
                                height: 16,
                                minWidth: 16,
                                padding: '0 4px',
                                border: '2px solid rgba(10, 10, 15, 1)',
                                fontWeight: 800
                            }
                        }}
                    >
                        <PeopleRoundedIcon />
                    </Badge>
                </IconButton>
            </Tooltip>

            <FriendsSyncMenu
                open={isMenuOpen}
                anchorEl={menuAnchorEl}
                onMenuClose={onMenuClose}
                onlineCount={onlineCount}
                isSyncPlayAvailable={isSyncPlayAvailable}
            />
        </>
    );
};

export default FriendsSyncButton;

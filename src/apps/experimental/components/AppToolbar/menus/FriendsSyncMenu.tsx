import type { GroupInfoDto } from '@jellyfin/sdk/lib/generated-client/models/group-info-dto';
import { SyncPlayUserAccessType } from '@jellyfin/sdk/lib/generated-client/models/sync-play-user-access-type';
import { getSyncPlayApi } from '@jellyfin/sdk/lib/utils/api/sync-play-api';
import GroupAdd from '@mui/icons-material/GroupAdd';
import PersonAdd from '@mui/icons-material/PersonAdd';
import PersonOff from '@mui/icons-material/PersonOff';
import PersonRemove from '@mui/icons-material/PersonRemove';
import PlayCircle from '@mui/icons-material/PlayCircle';
import StopCircle from '@mui/icons-material/StopCircle';
import Tune from '@mui/icons-material/Tune';
import PeopleIcon from '@mui/icons-material/People';
import Divider from '@mui/material/Divider';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import Menu, { MenuProps } from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import type { ApiClient } from 'jellyfin-apiclient';
import React, { FC, useCallback, useEffect, useState, ReactNode } from 'react';

import { pluginManager } from 'components/pluginManager';
import { useApi } from 'hooks/useApi';
import { useSyncPlayGroups } from 'hooks/useSyncPlayGroups';
import globalize from 'lib/globalize';
import { PluginType } from 'types/plugin';
import Events, { Event } from 'utils/events';
import { appRouter } from 'components/router/appRouter';

export const ID = 'friends-sync-play-menu';

interface FriendsSyncMenuProps extends MenuProps {
    onMenuClose: () => void;
    onlineCount: number;
    isSyncPlayAvailable: boolean;
}

interface SyncPlayInstance {
    Manager: {
        getGroupInfo: () => GroupInfoDto | null | undefined
        getTimeSyncCore: () => object
        isPlaybackActive: () => boolean
        isPlaylistEmpty: () => boolean
        haltGroupPlayback: (apiClient: ApiClient) => void
        resumeGroupPlayback: (apiClient: ApiClient) => void
    }
}

const FriendsSyncMenu: FC<FriendsSyncMenuProps> = ({
    anchorEl,
    open,
    onMenuClose,
    onlineCount,
    isSyncPlayAvailable
}) => {
    const [ syncPlay, setSyncPlay ] = useState<SyncPlayInstance>();
    const { __legacyApiClient__, api, user } = useApi();
    const [ currentGroup, setCurrentGroup ] = useState<GroupInfoDto>();
    const isSyncPlayEnabled = Boolean(currentGroup);

    useEffect(() => {
        setSyncPlay(pluginManager.firstOfType(PluginType.SyncPlay)?.instance);
    }, []);

    const { data: groups } = useSyncPlayGroups();

    const handleFriendsClick = useCallback(() => {
        appRouter.showFriends();
        onMenuClose();
    }, [onMenuClose]);

    const onGroupAddClick = useCallback(() => {
        if (api && user) {
            getSyncPlayApi(api)
                .syncPlayCreateGroup({
                    newGroupRequestDto: { GroupName: globalize.translate('SyncPlayGroupDefaultTitle', user.Name) }
                })
                .catch(err => console.error('[SyncPlayMenu] failed to create group', err));
            onMenuClose();
        }
    }, [ api, onMenuClose, user ]);

    const onGroupLeaveClick = useCallback(() => {
        if (api) {
            getSyncPlayApi(api).syncPlayLeaveGroup().catch(err => console.error('[SyncPlayMenu] failed to leave group', err));
            onMenuClose();
        }
    }, [ api, onMenuClose ]);

    const onGroupJoinClick = useCallback((GroupId: string) => {
        if (api) {
            getSyncPlayApi(api).syncPlayJoinGroup({ joinGroupRequestDto: { GroupId } }).catch(err => console.error('[SyncPlayMenu] failed to join group', err));
            onMenuClose();
        }
    }, [ api, onMenuClose ]);

    const onGroupSettingsClick = useCallback(async () => {
        if (!syncPlay) return;
        const SettingsEditor = (await import('../../../../../plugins/syncPlay/ui/settings/SettingsEditor')).default;
        new SettingsEditor(__legacyApiClient__, syncPlay.Manager.getTimeSyncCore(), { groupInfo: currentGroup }).embed().catch(err => {
            if (err) console.error('[SyncPlayMenu] Error creating settings editor', err);
        });
        onMenuClose();
    }, [ __legacyApiClient__, currentGroup, onMenuClose, syncPlay ]);

    const onStartGroupPlaybackClick = useCallback(() => {
        if (__legacyApiClient__) {
            syncPlay?.Manager.resumeGroupPlayback(__legacyApiClient__);
            onMenuClose();
        }
    }, [ __legacyApiClient__, onMenuClose, syncPlay ]);

    const onStopGroupPlaybackClick = useCallback(() => {
        if (__legacyApiClient__) {
            syncPlay?.Manager.haltGroupPlayback(__legacyApiClient__);
            onMenuClose();
        }
    }, [ __legacyApiClient__, onMenuClose, syncPlay ]);

    const updateSyncPlayGroup = useCallback((_e: Event, enabled: boolean) => {
        setCurrentGroup(syncPlay && enabled ? (syncPlay.Manager.getGroupInfo() ?? undefined) : undefined);
    }, [ syncPlay ]);

    useEffect(() => {
        if (!syncPlay) return;
        Events.on(syncPlay.Manager, 'enabled', updateSyncPlayGroup);
        return () => Events.off(syncPlay.Manager, 'enabled', updateSyncPlayGroup);
    }, [ updateSyncPlayGroup, syncPlay ]);

    const renderActiveGroupItems = (items: ReactNode[]) => {
        if (!syncPlay?.Manager.isPlaylistEmpty() && !syncPlay?.Manager.isPlaybackActive()) {
            items.push(
                <MenuItem key='sync-play-start-playback' onClick={onStartGroupPlaybackClick}>
                    <ListItemIcon sx={{ color: '#00a4dc' }}><PlayCircle /></ListItemIcon>
                    <ListItemText primary={globalize.translate('LabelSyncPlayResumePlayback')} />
                </MenuItem>
            );
        } else if (syncPlay?.Manager.isPlaybackActive()) {
            items.push(
                <MenuItem key='sync-play-stop-playback' onClick={onStopGroupPlaybackClick}>
                    <ListItemIcon sx={{ color: '#ff3d00' }}><StopCircle /></ListItemIcon>
                    <ListItemText primary={globalize.translate('LabelSyncPlayHaltPlayback')} />
                </MenuItem>
            );
        }
        items.push(
            <MenuItem key='sync-play-settings' onClick={onGroupSettingsClick}>
                <ListItemIcon><Tune /></ListItemIcon>
                <ListItemText primary={globalize.translate('Settings')} />
            </MenuItem>,
            <Divider key='sync-play-controls-divider' sx={{ opacity: 0.05, my: 0.5 }} />,
            <MenuItem key='sync-play-exit' onClick={onGroupLeaveClick}>
                <ListItemIcon><PersonRemove /></ListItemIcon>
                <ListItemText primary={globalize.translate('LabelSyncPlayLeaveGroup')} />
            </MenuItem>
        );
    };

    const renderSyncPlayItems = () => {
        if (!isSyncPlayAvailable) return null;
        const items: ReactNode[] = [];

        // SYNCPLAY Header
        items.push(
            <ListSubheader
                key='syncplay-header'
                component='div'
                sx={{
                    background: 'transparent',
                    color: 'rgba(255, 255, 255, 0.4)',
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    lineHeight: '24px', // Reduced from 36px
                    px: 2.5,
                    mt: 0 // Removed mt: 0.5
                }}
            >
                {isSyncPlayEnabled ? `SyncPlay — ${currentGroup?.GroupName}` : 'SyncPlay'}
            </ListSubheader>
        );

        if (isSyncPlayEnabled) {
            renderActiveGroupItems(items);
        } else if (!groups?.length && user?.Policy?.SyncPlayAccess !== SyncPlayUserAccessType.CreateAndJoinGroups) {
            items.push(
                <MenuItem key='sync-play-unavailable' disabled>
                    <ListItemIcon><PersonOff /></ListItemIcon>
                    <ListItemText primary={globalize.translate('LabelSyncPlayNoGroups')} />
                </MenuItem>
            );
        } else {
            if (groups?.length) {
                groups.forEach(group => {
                    const handleJoin = () => group.GroupId && onGroupJoinClick(group.GroupId);
                    items.push(
                        <MenuItem key={group.GroupId} onClick={handleJoin}>
                            <ListItemIcon><PersonAdd /></ListItemIcon>
                            <ListItemText
                                primary={group.GroupName}
                                secondary={group.Participants?.join(', ')}
                                secondaryTypographyProps={{ sx: { fontSize: '0.7rem', opacity: 0.6 } }}
                            />
                        </MenuItem>
                    );
                });
                items.push(<Divider key='sync-play-groups-divider' sx={{ opacity: 0.05, my: 0.5 }} />);
            }
            if (user?.Policy?.SyncPlayAccess === SyncPlayUserAccessType.CreateAndJoinGroups) {
                items.push(
                    <MenuItem key='sync-play-new-group' onClick={onGroupAddClick}>
                        <ListItemIcon><GroupAdd /></ListItemIcon>
                        <ListItemText primary={globalize.translate('LabelSyncPlayNewGroupDescription')} />
                    </MenuItem>
                );
            }
        }
        return items;
    };

    return (
        <Menu
            anchorEl={anchorEl}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            id={ID}
            keepMounted
            open={open}
            onClose={onMenuClose}
            slotProps={{
                paper: {
                    sx: {
                        mt: 1.5,
                        width: 280,
                        background: 'rgba(20, 20, 25, 0.75)', // Matched with Announcements
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '16px',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                        overflow: 'hidden',
                        padding: '4px 0',
                        '& .MuiMenuItem-root': {
                            py: 1, // Reduced vertical spacing
                            px: 2.5,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                '& .MuiListItemIcon-root': { color: '#00a4dc' }
                            },
                            '& .MuiListItemText-primary': {
                                fontSize: '0.875rem',
                                fontWeight: 500
                            },
                            '& .MuiListItemIcon-root': {
                                minWidth: '36px',
                                transition: 'color 0.2s ease'
                            }
                        }
                    }
                }
            }}
        >
            <MenuItem key='friends-entry' onClick={handleFriendsClick} sx={{ mb: 0.5, display: 'flex', alignItems: 'center' }}>
                <ListItemIcon><PeopleIcon /></ListItemIcon>
                <ListItemText
                    primary='Friends'
                    secondary={`${onlineCount} Online`}
                    secondaryTypographyProps={{ sx: { fontSize: '0.7rem', color: onlineCount > 0 ? '#4caf50' : 'text.secondary', fontWeight: 600 } }}
                />
                <Typography variant='caption' sx={{ color: 'primary.main', fontWeight: 700, ml: 'auto', textTransform: 'uppercase', fontSize: '0.65rem' }}>
                    View
                </Typography>
            </MenuItem>

            <Divider key='friends-divider' sx={{ opacity: 0.08, mx: 2, my: 0.5 }} />

            {renderSyncPlayItems()}
        </Menu>
    );
};

export default FriendsSyncMenu;

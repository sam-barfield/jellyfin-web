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
                    <ListItemIcon><PlayCircle /></ListItemIcon>
                    <ListItemText primary={globalize.translate('LabelSyncPlayResumePlayback')} />
                </MenuItem>
            );
        } else if (syncPlay?.Manager.isPlaybackActive()) {
            items.push(
                <MenuItem key='sync-play-stop-playback' onClick={onStopGroupPlaybackClick}>
                    <ListItemIcon><StopCircle /></ListItemIcon>
                    <ListItemText primary={globalize.translate('LabelSyncPlayHaltPlayback')} />
                </MenuItem>
            );
        }
        items.push(
            <MenuItem key='sync-play-settings' onClick={onGroupSettingsClick}>
                <ListItemIcon><Tune /></ListItemIcon>
                <ListItemText primary={globalize.translate('Settings')} />
            </MenuItem>,
            <Divider key='sync-play-controls-divider' />,
            <MenuItem key='sync-play-exit' onClick={onGroupLeaveClick}>
                <ListItemIcon><PersonRemove /></ListItemIcon>
                <ListItemText primary={globalize.translate('LabelSyncPlayLeaveGroup')} />
            </MenuItem>
        );
    };

    const renderSyncPlayItems = () => {
        if (!isSyncPlayAvailable) return null;
        const items: ReactNode[] = [<Divider key='friends-divider' sx={{ my: 1, opacity: 0.1 }} />];

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
                            <ListItemText primary={group.GroupName} secondary={group.Participants?.join(', ')} />
                        </MenuItem>
                    );
                });
                items.push(<Divider key='sync-play-groups-divider' />);
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
                        background: 'rgba(20, 20, 25, 0.75)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '16px',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                        overflow: 'hidden',
                        '& .MuiMenuItem-root': {
                            py: 1.5,
                            px: 2,
                            transition: 'background-color 0.2s ease',
                            '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.05)' }
                        }
                    }
                }
            }}
        >
            {isSyncPlayEnabled && (
                <ListSubheader component='div' sx={{ background: 'transparent', color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', lineHeight: '32px', px: 2 }}>
                    Group: {currentGroup?.GroupName}
                </ListSubheader>
            )}
            <MenuItem key='friends-entry' onClick={handleFriendsClick}>
                <ListItemIcon><PeopleIcon /></ListItemIcon>
                <ListItemText primary={`Friends (${onlineCount})`} secondary={`${onlineCount} online`} />
            </MenuItem>
            {renderSyncPlayItems()}
        </Menu>
    );
};

export default FriendsSyncMenu;

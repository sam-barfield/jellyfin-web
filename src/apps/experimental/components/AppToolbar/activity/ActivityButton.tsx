import React, { useState, useCallback, useEffect, useMemo } from 'react';
import Badge from '@mui/material/Badge';
import IconButton from '@mui/material/IconButton';
import Popover from '@mui/material/Popover';
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import { format } from 'date-fns';
import {
    useActiveAnnouncements,
    useUnreadAnnouncements,
    useMarkAnnouncementRead,
    useMarkAllAnnouncementsRead,
    AnnouncementInfoDto
} from 'apps/dashboard/features/announcements/api/useAnnouncements';
import {
    useLiveNotifications,
    useUnreadNotificationsCount,
    useMarkNotificationRead,
    useMarkAllNotificationsRead,
    NotificationDto,
    NotificationType,
    useNotifications
} from 'apps/experimental/features/notifications/api/useNotifications';
import { playbackManager } from 'components/playback/playbackmanager';
import { useApi } from 'hooks/useApi';
import Events from 'utils/events';

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

const AnnouncementItem = ({ announcement, onClose }: { announcement: AnnouncementInfoDto, onClose: () => void }) => {
    const { mutate: markRead } = useMarkAnnouncementRead();
    const isUnread = !announcement.IsRead;

    const handleClick = useCallback(() => {
        if (isUnread) {
            markRead(announcement.Id);
        }
        onClose();
    }, [isUnread, markRead, announcement.Id, onClose]);

    return (
        <ListItemButton
            onClick={handleClick}
            sx={{
                alignItems: 'flex-start',
                py: 2,
                px: 2.5,
                bgcolor: isUnread ? 'rgba(0, 164, 220, 0.05)' : 'transparent',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                transition: 'background-color 0.2s ease',
                '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.05)'
                },
                position: 'relative',
                ...(isUnread && {
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        left: 0,
                        top: '20%',
                        bottom: '20%',
                        width: '3px',
                        backgroundColor: '#00a4dc',
                        borderRadius: '0 4px 4px 0'
                    }
                })
            }}
        >
            <ListItemText
                primary={
                    <Typography
                        component='div'
                        variant='subtitle2'
                        fontWeight={isUnread ? 'bold' : 'normal'}
                    >
                        {announcement.Title}
                    </Typography>
                }
                secondary={
                    <Box component='span'>
                        <Typography
                            component='span'
                            variant='body2'
                            color='text.primary'
                            sx={{ display: 'block', mb: 0.5 }}
                        >
                            {format(new Date(announcement.DateCreatedUtc), 'PPp')}
                        </Typography>
                        <Typography component='span' variant='body2' color='text.secondary'>
                            {announcement.Text}
                        </Typography>
                    </Box>
                }
            />
        </ListItemButton>
    );
};

const NotificationItem = ({ notification, onClose }: { notification: NotificationDto, onClose: () => void }) => {
    const { mutate: markRead } = useMarkNotificationRead();
    const { api } = useApi();
    const isUnread = !notification.IsRead;

    const data = useMemo(() => {
        try {
            return JSON.parse(notification.Data);
        } catch {
            return {};
        }
    }, [notification.Data]);

    const handleClick = useCallback(() => {
        if (isUnread) {
            markRead(notification.Id);
        }
        onClose();
    }, [isUnread, markRead, notification.Id, onClose]);

    const renderMessage = () => {
        if (notification.Type === NotificationType.FriendRequestAccepted) {
            return (
                <Typography variant='subtitle2' sx={{ fontWeight: isUnread ? 700 : 500 }}>
                    <strong>{data.username || 'Someone'}</strong> is now your friend!
                </Typography>
            );
        }

        if (notification.Type === NotificationType.FriendRequestReceived) {
            return (
                <Typography variant='subtitle2' sx={{ fontWeight: isUnread ? 700 : 500 }}>
                    <strong>{data.username || 'Someone'}</strong> sent you a friend request.
                </Typography>
            );
        }

        if (notification.Type === NotificationType.FriendRemoved) {
            return (
                <Typography variant='subtitle2' sx={{ fontWeight: isUnread ? 700 : 500 }}>
                    <strong>{data.username || 'Someone'}</strong> removed you from their friends.
                </Typography>
            );
        }

        return (
            <Typography variant='subtitle2' sx={{ fontWeight: isUnread ? 700 : 500 }}>
                New notification
            </Typography>
        );
    };

    const avatarUrl = data.userId ? api?.getUri(`/Users/${data.userId}/Images/Primary`) : undefined;

    return (
        <ListItemButton
            onClick={handleClick}
            sx={{
                alignItems: 'center',
                py: 2,
                px: 2.5,
                bgcolor: isUnread ? 'rgba(0, 164, 220, 0.05)' : 'transparent',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                transition: 'background-color 0.2s ease',
                '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.05)'
                },
                position: 'relative',
                ...(isUnread && {
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        left: 0,
                        top: '20%',
                        bottom: '20%',
                        width: '3px',
                        backgroundColor: '#00a4dc',
                        borderRadius: '0 4px 4px 0'
                    }
                })
            }}
        >
            <ListItemAvatar sx={{ minWidth: 48 }}>
                <Avatar
                    src={avatarUrl}
                    sx={{
                        width: 36,
                        height: 36,
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}
                />
            </ListItemAvatar>
            <ListItemText
                primary={renderMessage()}
                secondary={
                    <Typography variant='caption' color='text.secondary'>
                        {format(new Date(notification.CreatedAt), 'PPp')}
                    </Typography>
                }
            />
        </ListItemButton>
    );
};

const TabButton = ({ active, label, onClick, hasBadge }: { active: boolean, label: string, onClick: () => void, hasBadge: boolean }) => (
    <Button
        onClick={onClick}
        disableRipple
        sx={{
            flex: 1,
            textTransform: 'none',
            borderRadius: '10px',
            fontSize: '0.85rem',
            fontWeight: 700,
            py: 1,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            ...(active ? {
                bgcolor: 'rgba(0, 164, 220, 0.15)',
                color: '#00a4dc',
                '&:hover': { bgcolor: 'rgba(0, 164, 220, 0.2)' }
            } : {
                bgcolor: 'transparent',
                color: 'rgba(255, 255, 255, 0.5)',
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.05)', color: 'rgba(255, 255, 255, 0.8)' }
            })
        }}
    >
        {label}
        {hasBadge && (
            <Box sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                width: 6,
                height: 6,
                borderRadius: '50%',
                bgcolor: '#00a4dc',
                boxShadow: '0 0 10px #00a4dc'
            }} />
        )}
    </Button>
);

const ActivityMenuContent = ({ onClose }: { onClose: () => void }) => {
    // Announcements
    const { data: announcements, isPending: announcementsPending } = useActiveAnnouncements();
    const { mutate: markAllAnnouncementsRead, isPending: isMarkingAnnouncementsRead } = useMarkAllAnnouncementsRead();

    // Notifications (Already subscribed at button level)
    const { data: notifications, isPending: notificationsPending } = useNotifications();
    const { mutate: markAllNotificationsRead, isPending: isMarkingNotificationsRead } = useMarkAllNotificationsRead();

    const [activeTab, setActiveTab] = useState<'notifications' | 'announcements'>('notifications');

    const setNotificationsTab = useCallback(() => setActiveTab('notifications'), []);
    const setAnnouncementsTab = useCallback(() => setActiveTab('announcements'), []);

    const hasUnreadAnnouncements = announcements?.some(a => !a.IsRead) ?? false;
    const hasUnreadNotifications = notifications?.some((n: NotificationDto) => !n.IsRead) ?? false;

    const handleMarkAllRead = useCallback(() => {
        if (activeTab === 'announcements') {
            markAllAnnouncementsRead();
        } else {
            markAllNotificationsRead();
        }
    }, [activeTab, markAllAnnouncementsRead, markAllNotificationsRead]);

    const isPending = activeTab === 'announcements' ? announcementsPending : notificationsPending;
    const isMarkingRead = activeTab === 'announcements' ? isMarkingAnnouncementsRead : isMarkingNotificationsRead;
    const hasUnread = activeTab === 'announcements' ? hasUnreadAnnouncements : hasUnreadNotifications;

    const renderListContent = useCallback(() => {
        if (activeTab === 'announcements') {
            return (announcements || []).map((a) => (
                <AnnouncementItem key={a.Id} announcement={a} onClose={onClose} />
            ));
        }
        return (notifications || []).map((n) => (
            <NotificationItem key={n.Id} notification={n} onClose={onClose} />
        ));
    }, [activeTab, announcements, notifications, onClose]);

    return (
        <Box sx={{
            width: { xs: 'calc(100vw - 32px)', sm: 380 },
            maxWidth: '100%',
            height: 550,
            maxHeight: '70vh',
            display: 'flex',
            flexDirection: 'column'
        }}>
            <Box sx={{
                p: 2.5,
                pb: 1.5,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'rgba(255, 255, 255, 0.02)'
            }}>
                <Typography variant='h6' sx={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '-0.01em' }}>
                    Activity
                </Typography>
                {hasUnread && (
                    <Button
                        size='small'
                        onClick={handleMarkAllRead}
                        disabled={isMarkingRead}
                        sx={{
                            textTransform: 'none',
                            fontWeight: 700,
                            borderRadius: '8px',
                            px: 1.5,
                            fontSize: '0.75rem'
                        }}
                    >
                        Mark all read
                    </Button>
                )}
            </Box>

            <Box sx={{
                display: 'flex',
                gap: 1,
                p: 1,
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '14px',
                mb: 1.5,
                mt: 1,
                mx: 2.5
            }}>
                <TabButton
                    active={activeTab === 'notifications'}
                    label='Notifications'
                    onClick={setNotificationsTab}
                    hasBadge={hasUnreadNotifications}
                />
                <TabButton
                    active={activeTab === 'announcements'}
                    label='Announcements'
                    onClick={setAnnouncementsTab}
                    hasBadge={hasUnreadAnnouncements}
                />
            </Box>

            <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 0 }}>
                {isPending ? (
                    <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
                        <CircularProgress size={32} thickness={5} sx={{ color: '#00a4dc' }} />
                    </Box>
                ) : (
                    <>
                        {activeTab === 'announcements' && (!announcements || announcements.length === 0) && (
                            <Box sx={{ p: 6, textAlign: 'center' }}>
                                <Typography color='text.secondary' variant='body2' sx={{ opacity: 0.6 }}>No announcements yet</Typography>
                            </Box>
                        )}
                        {activeTab === 'notifications' && (!notifications || notifications.length === 0) && (
                            <Box sx={{ p: 6, textAlign: 'center' }}>
                                <Typography color='text.secondary' variant='body2' sx={{ opacity: 0.6 }}>No notifications yet</Typography>
                            </Box>
                        )}
                        <List sx={{ p: 0 }}>
                            {renderListContent()}
                        </List>
                    </>
                )}
            </Box>
        </Box>
    );
};

const ActivityButton = () => {
    // Real-time notifications subscription
    useLiveNotifications();

    // Poll for unread status
    const { data: unreadAnnouncements } = useUnreadAnnouncements(60000);
    const { data: unreadNotifications } = useUnreadNotificationsCount();

    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
    const [isPlayingVideo, setIsPlayingVideo] = useState(() => playbackManager.isPlayingVideo());

    useEffect(() => {
        const onPlaybackStart = () => setIsPlayingVideo(playbackManager.isPlayingVideo());
        const onPlaybackStop = () => setIsPlayingVideo(false);
        Events.on(playbackManager, 'playbackstart', onPlaybackStart);
        Events.on(playbackManager, 'playbackstop', onPlaybackStop);
        return () => {
            Events.off(playbackManager, 'playbackstart', onPlaybackStart);
            Events.off(playbackManager, 'playbackstop', onPlaybackStop);
        };
    }, []);

    const handleClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    }, []);

    const handleClose = useCallback(() => {
        setAnchorEl(null);
    }, []);

    const open = Boolean(anchorEl);
    const id = open ? 'activity-popover' : undefined;

    const hasUnread = (unreadAnnouncements?.HasUnread ?? false) || (unreadNotifications?.HasUnread ?? false);

    if (isPlayingVideo) return null;

    return (
        <>
            <IconButton
                onClick={handleClick}
                disableRipple
                aria-label='activity'
                sx={navIconSx}
            >
                <Badge
                    color='error'
                    variant='dot'
                    invisible={!hasUnread}
                    sx={{
                        '& .MuiBadge-badge': {
                            backgroundColor: '#00a4dc',
                            boxShadow: '0 0 10px rgba(0, 164, 220, 0.5)'
                        }
                    }}
                >
                    <NotificationsRoundedIcon />
                </Badge>
            </IconButton>
            <Popover
                id={id}
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right'
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right'
                }}
                slotProps={{
                    paper: {
                        sx: {
                            maxWidth: 'calc(100vw - 16px)',
                            mt: 1.5,
                            background: 'rgba(20, 20, 25, 0.75)',
                            backdropFilter: 'blur(25px)',
                            WebkitBackdropFilter: 'blur(25px)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '20px',
                            boxShadow: '0 12px 48px rgba(0, 0, 0, 0.5)',
                            overflow: 'hidden'
                        }
                    }
                }}
            >
                {open && <ActivityMenuContent onClose={handleClose} />}
            </Popover>
        </>
    );
};

export default ActivityButton;

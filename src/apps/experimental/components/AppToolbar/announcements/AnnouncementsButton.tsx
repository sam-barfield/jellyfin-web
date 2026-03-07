import React, { useState, useCallback, useEffect } from 'react';
import Badge from '@mui/material/Badge';
import IconButton from '@mui/material/IconButton';
import Popover from '@mui/material/Popover';
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
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
import { playbackManager } from 'components/playback/playbackmanager';
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
                        variant='subtitle2'
                        fontWeight={isUnread ? 'bold' : 'normal'}
                    >
                        {announcement.Title}
                    </Typography>
                }
                secondary={
                    <React.Fragment>
                        <Typography
                            component='span'
                            variant='body2'
                            color='text.primary'
                            sx={{ display: 'block', mb: 0.5 }}
                        >
                            {format(new Date(announcement.DateCreatedUtc), 'PPp')}
                        </Typography>
                        <Typography variant='body2' color='text.secondary'>
                            {announcement.Text}
                        </Typography>
                    </React.Fragment>
                }
            />
        </ListItemButton>
    );
};

const AnnouncementsList = ({ onClose }: { onClose: () => void }) => {
    const { data: announcements, isPending } = useActiveAnnouncements();
    const { mutate: markAllRead, isPending: isMarkingAllRead } = useMarkAllAnnouncementsRead();

    const handleMarkAllRead = useCallback(() => {
        markAllRead();
    }, [markAllRead]);

    const hasUnread = announcements?.some(a => !a.IsRead) ?? false;

    if (isPending) {
        return (
            <Box sx={{ width: { xs: '100vw', sm: 350 }, maxWidth: '100%', p: 4, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!announcements || announcements.length === 0) {
        return (
            <Box sx={{ width: { xs: '100vw', sm: 350 }, maxWidth: '100%', p: 3, textAlign: 'center' }}>
                <Typography color='text.secondary'>
                    No announcements
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{
            width: { xs: '100vw', sm: 380 },
            maxWidth: '100%',
            maxHeight: 550,
            display: 'flex',
            flexDirection: 'column'
        }}>
            <Box sx={{
                p: 2.5,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'rgba(255, 255, 255, 0.02)'
            }}>
                <Typography variant='h6' sx={{ fontSize: '1.1rem', fontWeight: 700, letterSpacing: '-0.01em' }}>
                    Announcements
                </Typography>
                {hasUnread && (
                    <Button
                        size='small'
                        onClick={handleMarkAllRead}
                        disabled={isMarkingAllRead}
                        sx={{
                            textTransform: 'none',
                            fontWeight: 600,
                            borderRadius: '8px',
                            px: 1.5
                        }}
                    >
                        Mark all read
                    </Button>
                )}
            </Box>
            <List sx={{ p: 0, overflowY: 'auto', flexGrow: 1 }}>
                {announcements.map((announcement) => (
                    <AnnouncementItem
                        key={announcement.Id}
                        announcement={announcement}
                        onClose={onClose}
                    />
                ))}
            </List>
        </Box>
    );
};

const AnnouncementsButton = () => {
    // Poll for unread announcements every 60 seconds
    const { data: unreadStatus } = useUnreadAnnouncements(60000);
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
    const id = open ? 'announcements-popover' : undefined;

    // Follow the same pattern as RemotePlayButton — hide during video playback
    if (isPlayingVideo) return null;

    return (
        <>
            <IconButton
                onClick={handleClick}
                disableRipple
                aria-label='announcements'
                sx={navIconSx}
            >
                <Badge
                    color='error'
                    variant='dot'
                    invisible={!unreadStatus?.HasUnread}
                    sx={{
                        '& .MuiBadge-badge': {
                            backgroundColor: '#00a4dc',
                            boxShadow: '0 0 0 2px rgba(10, 10, 15, 1)'
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
                            backdropFilter: 'blur(20px)',
                            WebkitBackdropFilter: 'blur(20px)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '16px',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                            overflow: 'hidden'
                        }
                    }
                }}
            >
                {open && <AnnouncementsList onClose={handleClose} />}
            </Popover>
        </>
    );
};

export default AnnouncementsButton;

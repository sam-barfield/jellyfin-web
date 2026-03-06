import React, { useState, useCallback } from 'react';
import Badge from '@mui/material/Badge';
import IconButton from '@mui/material/IconButton';
import Popover from '@mui/material/Popover';
import NotificationsIcon from '@mui/icons-material/Notifications';
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
                bgcolor: isUnread ? 'action.hover' : 'transparent',
                borderBottom: '1px solid',
                borderColor: 'divider'
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
            <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!announcements || announcements.length === 0) {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography color='text.secondary'>
                    No announcements
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ width: 350, maxHeight: 500, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant='h6'>
                    Announcements
                </Typography>
                {hasUnread && (
                    <Button
                        size='small'
                        onClick={handleMarkAllRead}
                        disabled={isMarkingAllRead}
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

    const handleClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    }, []);

    const handleClose = useCallback(() => {
        setAnchorEl(null);
    }, []);

    const open = Boolean(anchorEl);
    const id = open ? 'announcements-popover' : undefined;

    return (
        <>
            <IconButton
                color='inherit'
                aria-label='announcements'
                onClick={handleClick}
            >
                <Badge
                    color='error'
                    variant='dot'
                    invisible={!unreadStatus?.HasUnread}
                >
                    <NotificationsIcon />
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
            >
                {open && <AnnouncementsList onClose={handleClose} />}
            </Popover>
        </>
    );
};

export default AnnouncementsButton;

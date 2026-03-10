import React, { useCallback, useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import Collapse from '@mui/material/Collapse';
import Drawer from '@mui/material/Drawer';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import PersonAddRoundedIcon from '@mui/icons-material/PersonAddRounded';
import PeopleRoundedIcon from '@mui/icons-material/PeopleRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';

import {
    useLiveFriendsWidget,
    useFriendRequests,
    useAcceptFriendRequest,
    useDeclineFriendRequest,
    useSendFriendRequest,
    type FriendDto,
    type FriendRequestDto
} from '../api/useFriends';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { appRouter } from 'components/router/appRouter';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatLastOnline(lastOnline?: string): string {
    if (!lastOnline) return 'Never';
    const diff = Date.now() - new Date(lastOnline).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(lastOnline).toLocaleDateString();
}

function getInitials(name: string): string {
    return name
        .split(' ')
        .map(w => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
}

function avatarColor(username: string): string {
    const palette = [
        '#1976d2', '#388e3c', '#f57c00', '#7b1fa2',
        '#c62828', '#00838f', '#5d4037', '#455a64'
    ];
    let hash = 0;
    for (let i = 0; i < username.length; i++) hash = username.charCodeAt(i) + ((hash << 5) - hash);
    return palette[Math.abs(hash) % palette.length];
}

// ─── Shared TextField sx ─────────────────────────────────────────────────────

const inputSx = {
    '& .MuiOutlinedInput-root': {
        borderRadius: '14px',
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        transition: 'all 0.2s ease',
        '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(255, 255, 255, 0.1)',
            transition: 'border-color 0.2s ease'
        },
        '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(255, 255, 255, 0.2)'
        },
        '&.Mui-focused': {
            backgroundColor: 'rgba(255, 255, 255, 0.06)',
            outline: 'none !important',
            boxShadow: 'none !important',
            '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'primary.main',
                borderWidth: '2px',
                outline: 'none !important'
            }
        }
    },
    '& .MuiInputBase-input': {
        fontSize: '0.88rem',
        padding: '11px 14px',
        color: '#ffffff',
        outline: 'none !important',
        boxShadow: 'none !important',
        '&::placeholder': {
            color: 'rgba(255, 255, 255, 0.35)',
            opacity: 1
        }
    },
    '& .MuiInputAdornment-root .MuiIconButton-root': {
        color: 'text.secondary'
    }
};

// ─── FriendCard ───────────────────────────────────────────────────────────────

const FriendCard = ({ friend }: { friend: FriendDto }) => {
    const { NowPlaying } = friend;
    const apiClient = ServerConnections.currentApiClient();

    const profileImageUrl = (friend.HasProfileImage && apiClient) ?
        apiClient.getUserImageUrl(friend.UserId, { type: 'Primary', width: 76 }) :
        undefined;

    const thumbUrl = (NowPlaying?.ItemId && apiClient) ?
        apiClient.getScaledImageUrl(NowPlaying.ItemId, { type: 'Primary', maxWidth: 80, quality: 85 }) :
        null;

    const progressPct = (NowPlaying?.PositionTicks && NowPlaying?.RunTimeTicks) ?
        Math.min(100, (NowPlaying.PositionTicks / NowPlaying.RunTimeTicks) * 100) :
        null;

    const handleClick = useCallback(() => {
        if (NowPlaying?.ItemId) {
            appRouter.showItem({
                Id: NowPlaying.ItemId,
                ServerId: apiClient?.serverId()
            } as never);
        }
    }, [NowPlaying?.ItemId, apiClient]);

    const nowPlayingLabel = NowPlaying?.SeriesName ?
        `${NowPlaying.SeriesName} · ${NowPlaying.Name}` :
        (NowPlaying?.Name ?? '');

    const statusLabel = friend.IsOnline ? 'Online now' : formatLastOnline(friend.LastOnline);

    return (
        <Box
            onClick={NowPlaying ? handleClick : undefined}
            sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                p: 1,
                borderRadius: '12px',
                cursor: NowPlaying ? 'pointer' : 'default',
                transition: 'background 0.2s ease',
                '&:hover': NowPlaying ? { backgroundColor: 'rgba(255,255,255,0.05)' } : {}
            }}
        >
            <Box sx={{ position: 'relative', flexShrink: 0 }}>
                <Avatar
                    src={profileImageUrl}
                    sx={{ width: 38, height: 38, fontSize: '0.85rem', fontWeight: 700, backgroundColor: avatarColor(friend.Username) }}
                >
                    {getInitials(friend.Username)}
                </Avatar>
                <Box sx={{
                    position: 'absolute', bottom: -1, right: -1,
                    width: 10, height: 10, borderRadius: '50%',
                    backgroundColor: friend.IsOnline ? '#4caf50' : '#555555',
                    border: '2px solid #101014'
                }} />
            </Box>

            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', lineHeight: 1.2 }} noWrap>
                    {friend.Username}
                </Typography>

                {NowPlaying ? (
                    <>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, mt: 0.25 }}>
                            <PlayArrowRoundedIcon sx={{ fontSize: 12, color: 'primary.main', flexShrink: 0 }} />
                            <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', lineHeight: 1.2 }} noWrap>
                                {nowPlayingLabel}
                            </Typography>
                        </Box>
                        {progressPct !== null && (
                            <LinearProgress
                                variant='determinate'
                                value={progressPct}
                                sx={{
                                    mt: 0.75, height: 3, borderRadius: 2,
                                    backgroundColor: 'rgba(255,255,255,0.1)',
                                    '& .MuiLinearProgress-bar': { backgroundColor: 'primary.main', borderRadius: 2 }
                                }}
                            />
                        )}
                    </>
                ) : (
                    <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', mt: 0.25 }} noWrap>
                        {statusLabel}
                    </Typography>
                )}
            </Box>

            {thumbUrl && (
                <Box sx={{ width: 32, height: 48, borderRadius: '6px', overflow: 'hidden', flexShrink: 0, backgroundColor: 'rgba(0,0,0,0.3)' }}>
                    <img
                        src={thumbUrl}
                        alt={NowPlaying?.Name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                </Box>
            )}
        </Box>
    );
};

// ─── RequestCard ──────────────────────────────────────────────────────────────

interface RequestCardProps {
    req: FriendRequestDto;
    onAccept: (req: FriendRequestDto) => Promise<void>;
    onDecline: (req: FriendRequestDto) => Promise<void>;
    globalBusy: boolean;
}

const RequestCard = ({ req, onAccept, onDecline, globalBusy }: RequestCardProps) => {
    const [busy, setBusy] = useState(false);
    const isBusy = busy || globalBusy;

    const handleAccept = useCallback(async () => {
        setBusy(true);
        try {
            await onAccept(req);
        } finally {
            setBusy(false);
        }
    }, [req, onAccept]);

    const handleDecline = useCallback(async () => {
        setBusy(true);
        try {
            await onDecline(req);
        } finally {
            setBusy(false);
        }
    }, [req, onDecline]);

    const handleAcceptClick = useCallback(() => { void handleAccept(); }, [handleAccept]);
    const handleDeclineClick = useCallback(() => { void handleDecline(); }, [handleDecline]);

    return (
        <Paper
            elevation={0}
            sx={{
                p: 1.5,
                backgroundColor: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: 1.5
            }}
        >
            <Avatar sx={{ width: 36, height: 36, fontSize: '0.8rem', fontWeight: 700, backgroundColor: avatarColor(req.RequesterName), flexShrink: 0 }}>
                {getInitials(req.RequesterName)}
            </Avatar>

            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography sx={{ fontWeight: 700, fontSize: '0.88rem' }} noWrap>
                    {req.RequesterName}
                </Typography>
                <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                    {formatLastOnline(req.CreatedAt)}
                </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                <Tooltip title='Accept'>
                    <span>
                        <IconButton size='small' disabled={isBusy} onClick={handleAcceptClick}
                            sx={{ color: 'success.main', backgroundColor: 'rgba(76,175,80,0.12)', '&:hover': { backgroundColor: 'rgba(76,175,80,0.25)' } }}
                        >
                            {isBusy ? <CircularProgress size={16} /> : <CheckRoundedIcon fontSize='small' />}
                        </IconButton>
                    </span>
                </Tooltip>
                <Tooltip title='Decline'>
                    <span>
                        <IconButton size='small' disabled={isBusy} onClick={handleDeclineClick}
                            sx={{ color: 'error.main', backgroundColor: 'rgba(198,40,40,0.12)', '&:hover': { backgroundColor: 'rgba(198,40,40,0.25)' } }}
                        >
                            {isBusy ? <CircularProgress size={16} /> : <CloseRoundedIcon fontSize='small' />}
                        </IconButton>
                    </span>
                </Tooltip>
            </Box>
        </Paper>
    );
};

// ─── RequestsDrawer ───────────────────────────────────────────────────────────

interface RequestsDrawerProps {
    open: boolean;
    onClose: () => void;
    onMutated: () => void;
}

const drawerPaperSx = {
    width: { xs: '100vw', sm: 380 },
    background: 'rgba(16, 16, 20, 0.88)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
    p: 3,
    display: 'flex',
    flexDirection: 'column',
    gap: 0
};

const RequestsDrawer = ({ open, onClose, onMutated }: RequestsDrawerProps) => {
    const { data: requests, isLoading, refetch } = useFriendRequests();
    const { mutateAsync: accept } = useAcceptFriendRequest();
    const { mutateAsync: decline } = useDeclineFriendRequest();
    const { mutateAsync: sendRequest, isPending: sending } = useSendFriendRequest();

    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [mutating, setMutating] = useState(false);
    const [addUsername, setAddUsername] = useState('');
    const [addError, setAddError] = useState<string | null>(null);
    const [addSuccess, setAddSuccess] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleAccept = useCallback(async (req: FriendRequestDto) => {
        setErrorMsg(null);
        setMutating(true);
        try {
            await accept(req.RequestId);
            void refetch();
            onMutated();
        } catch (err: unknown) {
            const body = (err as { response?: { data?: unknown } })?.response?.data;
            setErrorMsg(typeof body === 'string' ? body : 'Failed to accept request.');
        } finally {
            setMutating(false);
        }
    }, [accept, refetch, onMutated]);

    const handleDecline = useCallback(async (req: FriendRequestDto) => {
        setErrorMsg(null);
        setMutating(true);
        try {
            await decline(req.RequestId);
            void refetch();
            onMutated();
        } catch (err: unknown) {
            const body = (err as { response?: { data?: unknown } })?.response?.data;
            setErrorMsg(typeof body === 'string' ? body : 'Failed to decline request.');
        } finally {
            setMutating(false);
        }
    }, [decline, refetch, onMutated]);

    const handleSend = useCallback(async () => {
        const username = addUsername.trim();
        if (!username) return;
        setAddError(null);
        setAddSuccess(false);
        try {
            await sendRequest(username);
            setAddSuccess(true);
            setAddUsername('');
        } catch (err: unknown) {
            const body = (err as { response?: { data?: unknown } })?.response?.data;
            setAddError(typeof body === 'string' ? body : 'User not found or request already exists.');
        }
    }, [addUsername, sendRequest]);

    const handleSendClick = useCallback(() => { void handleSend(); }, [handleSend]);

    const handleAddKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter') void handleSend();
    }, [handleSend]);

    const handleUsernameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setAddUsername(e.target.value);
        setAddError(null);
        setAddSuccess(false);
    }, []);

    const handleClose = useCallback(() => { onClose(); }, [onClose]);

    return (
        <Drawer
            anchor='right'
            open={open}
            onClose={handleClose}
            slotProps={{ paper: { sx: drawerPaperSx } }}
        >
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant='h6' sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
                    Friends
                </Typography>
                <IconButton onClick={handleClose} size='small' sx={{ color: 'text.secondary' }}>
                    <CloseRoundedIcon />
                </IconButton>
            </Box>
            <Divider sx={{ mb: 3, borderColor: 'rgba(255,255,255,0.08)' }} />

            {/* Send request */}
            <Typography sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'text.secondary', mb: 1.25 }}>
                Add Friend
            </Typography>
            <TextField
                variant='outlined'
                inputRef={inputRef}
                value={addUsername}
                onChange={handleUsernameChange}
                onKeyDown={handleAddKeyDown}
                placeholder='Enter username…'
                size='small'
                fullWidth
                error={!!addError}
                helperText={addError ?? (addSuccess ? 'Friend request sent!' : undefined)}
                FormHelperTextProps={{
                    sx: {
                        color: addError ? '#ff5252' : '#4caf50',
                        fontWeight: 700,
                        fontSize: '0.74rem',
                        marginTop: '10px',
                        marginLeft: '4px',
                        display: (addError || addSuccess) ? 'flex' : 'none',
                        alignItems: 'center',
                        '&::before': {
                            content: '""',
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            backgroundColor: 'currentColor',
                            marginRight: '8px',
                        }
                    }
                }}
                autoComplete='off'
                slotProps={{
                    input: {
                        endAdornment: (
                            <InputAdornment position='end'>
                                <IconButton
                                    size='small'
                                    onClick={handleSendClick}
                                    disabled={sending || !addUsername.trim()}
                                    edge='end'
                                    sx={{
                                        color: addUsername.trim() ? 'primary.main' : 'text.secondary',
                                        '&:hover': { backgroundColor: 'rgba(0,164,220,0.12)' }
                                    }}
                                >
                                    {sending ? <CircularProgress size={16} /> : <SendRoundedIcon fontSize='small' />}
                                </IconButton>
                            </InputAdornment>
                        )
                    }
                }}
                sx={{ ...inputSx, mb: 3 }}
            />

            <Divider sx={{ mb: 3, borderColor: 'rgba(255,255,255,0.06)' }} />

            {/* Incoming requests label */}
            <Typography sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'text.secondary', mb: 1.5 }}>
                Incoming Requests
            </Typography>

            {errorMsg && (
                <Typography sx={{ color: 'error.main', fontSize: '0.8rem', mb: 1.5, p: 1, backgroundColor: 'rgba(198,40,40,0.1)', borderRadius: '8px' }}>
                    {errorMsg}
                </Typography>
            )}

            {isLoading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                    <CircularProgress size={32} />
                </Box>
            )}

            {!isLoading && !requests?.length && (
                <Box sx={{ textAlign: 'center', py: 5 }}>
                    <PeopleRoundedIcon sx={{ fontSize: 44, color: 'rgba(255,255,255,0.12)', mb: 1 }} />
                    <Typography color='text.secondary' sx={{ fontSize: '0.83rem' }}>
                        No pending requests
                    </Typography>
                </Box>
            )}

            {!isLoading && !!requests?.length && (
                <Box sx={{
                    display: 'flex', flexDirection: 'column', gap: 1,
                    overflowY: 'auto',
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'rgba(255,255,255,0.15) transparent',
                    '&::-webkit-scrollbar': { width: 4 },
                    '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.15)', borderRadius: 2 }
                }}>
                    {requests.map(req => (
                        <RequestCard
                            key={req.RequestId}
                            req={req}
                            onAccept={handleAccept}
                            onDecline={handleDecline}
                            globalBusy={mutating}
                        />
                    ))}
                </Box>
            )}
        </Drawer>
    );
};

// ─── FriendsWidget ────────────────────────────────────────────────────────────

const FRIENDS_STORAGE_KEY = 'home_friends_collapsed';

export const FriendsWidget = () => {
    const { data: widget, refetch } = useLiveFriendsWidget();
    // const navigate = useNavigate();

    const [isCollapsed, setIsCollapsed] = useState(() => {
        return localStorage.getItem(FRIENDS_STORAGE_KEY) === 'true';
    });

    const [drawerOpen, setDrawerOpen] = useState(false);

    useEffect(() => {
        localStorage.setItem(FRIENDS_STORAGE_KEY, String(isCollapsed));
    }, [isCollapsed]);

    const handleToggleCollapse = useCallback(() => {
        setIsCollapsed(prev => !prev);
    }, []);

    const handleOpenDrawer = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        setDrawerOpen(true);
    }, []);

    const handleCloseDrawer = useCallback(() => {
        setDrawerOpen(false);
    }, []);

    const handleMutated = useCallback(() => {
        void refetch();
    }, [refetch]);

    const handleViewAll = useCallback(() => {
        void appRouter.showFriends();
    }, []);

    const friends = widget?.Friends ?? [];
    const pendingCount = widget?.PendingRequestCount ?? 0;

    return (
        <Box sx={{ mb: 4 }}>
            {/* Header row */}
            <Box
                sx={{ mb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                onClick={handleToggleCollapse}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant='h6' component='h2' sx={{ fontWeight: 800, letterSpacing: '-0.02em', fontSize: '1.5rem' }}>
                        Friends
                    </Typography>
                    {friends.length > 0 && (
                        <Chip
                            label={`${friends.filter(f => f.IsOnline).length} online`}
                            size='small'
                            sx={{
                                height: 20, fontSize: '0.65rem', fontWeight: 700,
                                backgroundColor: 'rgba(76,175,80,0.18)',
                                color: '#4caf50',
                                border: '1px solid rgba(76,175,80,0.3)'
                            }}
                        />
                    )}
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Tooltip title='Add friends / view requests'>
                        <Box sx={{ position: 'relative' }}>
                            <IconButton
                                size='small'
                                onClick={handleOpenDrawer}
                                sx={{ color: pendingCount > 0 ? 'primary.main' : 'text.secondary' }}
                            >
                                <PersonAddRoundedIcon fontSize='small' />
                            </IconButton>
                            {pendingCount > 0 && (
                                <Box sx={{
                                    position: 'absolute', top: 2, right: 2,
                                    width: 8, height: 8, borderRadius: '50%',
                                    backgroundColor: 'primary.main',
                                    border: '1.5px solid rgba(16,16,20,1)'
                                }} />
                            )}
                        </Box>
                    </Tooltip>
                    <IconButton size='small' sx={{ color: 'text.secondary' }}>
                        {isCollapsed ? <ExpandMoreIcon /> : <ExpandLessIcon />}
                    </IconButton>
                </Box>
            </Box>

            <Typography variant='body2' sx={{ color: 'text.secondary', fontSize: '0.75rem', mb: 3, opacity: 0.7 }}>
                See what your friends are watching right now.
            </Typography>

            <Collapse in={!isCollapsed}>
                <Paper
                    elevation={0}
                    sx={{
                        p: { xs: 1, sm: 1.5 },
                        backgroundColor: 'rgba(20, 20, 20, 0.4)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        borderRadius: '24px',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                        overflow: 'hidden'
                    }}
                >
                    {friends.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <PeopleAltRoundedIcon sx={{ fontSize: 40, color: 'rgba(255,255,255,0.15)', mb: 1 }} />
                            <Typography color='text.secondary' sx={{ fontSize: '0.82rem' }}>
                                No friends yet
                            </Typography>
                            <Typography color='text.secondary' sx={{ fontSize: '0.72rem', opacity: 0.6, mt: 0.5 }}>
                                Use the <PersonAddRoundedIcon sx={{ fontSize: 11, verticalAlign: 'middle' }} /> button above to add friends.
                            </Typography>
                        </Box>
                    ) : (
                        <>
                            <Box sx={{
                                display: 'flex', flexDirection: 'column',
                                maxHeight: 400, overflowY: 'auto',
                                scrollbarWidth: 'thin',
                                scrollbarColor: 'rgba(255,255,255,0.2) transparent',
                                '&::-webkit-scrollbar': { width: 4 },
                                '&::-webkit-scrollbar-track': { background: 'transparent' },
                                '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.2)', borderRadius: 2 }
                            }}>
                                {friends.map((friend, idx) => (
                                    <React.Fragment key={friend.UserId}>
                                        <FriendCard friend={friend} />
                                        {idx < friends.length - 1 && (
                                            <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)', mx: 1 }} />
                                        )}
                                    </React.Fragment>
                                ))}
                            </Box>

                            <Box sx={{ pt: 1.5, mt: 0.5, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                <Button
                                    fullWidth
                                    variant='contained'
                                    size='small'
                                    onClick={handleViewAll}
                                    sx={{
                                        backgroundColor: 'primary.main',
                                        color: '#ffffff',
                                        fontSize: '0.85rem', fontWeight: 700,
                                        textTransform: 'none', py: 1,
                                        borderRadius: '12px',
                                        transition: 'all 0.2s ease',
                                        '&:hover': {
                                            backgroundColor: '#00b4ed',
                                            boxShadow: '0 4px 14px 0 rgba(0,164,220,0.4)',
                                            transform: 'translateY(-1px)'
                                        },
                                        '&:active': { transform: 'translateY(0)' }
                                    }}
                                >
                                    View Friends
                                </Button>
                            </Box>
                        </>
                    )}
                </Paper>
            </Collapse>

            <RequestsDrawer open={drawerOpen} onClose={handleCloseDrawer} onMutated={handleMutated} />
        </Box>
    );
};

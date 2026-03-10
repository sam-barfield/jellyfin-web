import React, { useCallback, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';

import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import PersonRemoveRoundedIcon from '@mui/icons-material/PersonRemoveRounded';
import PersonAddRoundedIcon from '@mui/icons-material/PersonAddRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';

import {
    useLiveFriendsList,
    useFriendRequests,
    useSendFriendRequest,
    useRemoveFriend,
    useAcceptFriendRequest,
    useDeclineFriendRequest,
    type FriendDto,
    type FriendRequestDto
} from './api/useFriends';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { appRouter } from 'components/router/appRouter';
import { useBackdropColor } from 'hooks/useBackdropColor';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatLastOnline(lastOnline?: string): string {
    if (!lastOnline) return 'Never online';
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

// ─── Shared TextField sx ──────────────────────────────────────────────────────

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
    }
};

// ─── FriendRow ────────────────────────────────────────────────────────────────

const FriendRow = ({ friend, onRemove }: { friend: FriendDto; onRemove: (id: string) => void }) => {
    const { NowPlaying } = friend;
    const apiClient = ServerConnections.currentApiClient();

    const profileImageUrl = (friend.HasProfileImage && apiClient) ?
        apiClient.getUserImageUrl(friend.UserId, { type: 'Primary', width: 92 }) :
        undefined;

    const thumbUrl = (NowPlaying?.ItemId && apiClient) ?
        apiClient.getScaledImageUrl(NowPlaying.ItemId, { type: 'Primary', maxWidth: 100, quality: 85 }) :
        null;

    const progressPct = (NowPlaying?.PositionTicks && NowPlaying?.RunTimeTicks) ?
        Math.min(100, (NowPlaying.PositionTicks / NowPlaying.RunTimeTicks) * 100) :
        null;

    const handleNowPlayingClick = useCallback(() => {
        if (NowPlaying?.ItemId) {
            appRouter.showItem({
                Id: NowPlaying.ItemId,
                ServerId: apiClient?.serverId()
            } as never);
        }
    }, [NowPlaying?.ItemId, apiClient]);

    const handleRemoveClick = useCallback(() => {
        onRemove(friend.UserId);
    }, [friend.UserId, onRemove]);

    return (
        <Paper
            elevation={0}
            sx={{
                p: { xs: 1.5, sm: 2 },
                backgroundColor: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                transition: 'background 0.2s ease',
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)' }
            }}
        >
            {/* Avatar + online dot */}
            <Box sx={{ position: 'relative', flexShrink: 0 }}>
                <Avatar
                    src={profileImageUrl}
                    sx={{ width: 46, height: 46, fontSize: '1rem', fontWeight: 700, backgroundColor: avatarColor(friend.Username) }}
                >
                    {getInitials(friend.Username)}
                </Avatar>
                <Box sx={{
                    position: 'absolute', bottom: 0, right: 0,
                    width: 11, height: 11, borderRadius: '50%',
                    backgroundColor: friend.IsOnline ? '#4caf50' : '#555555',
                    border: '2px solid #121216'
                }} />
            </Box>

            {/* Info */}
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.95rem' }} noWrap>
                        {friend.Username}
                    </Typography>
                </Box>

                {NowPlaying ? (
                    <Box onClick={handleNowPlayingClick} sx={{ cursor: 'pointer' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <PlayArrowRoundedIcon sx={{ fontSize: 13, color: 'primary.main', flexShrink: 0 }} />
                            <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }} noWrap>
                                {NowPlaying.SeriesName ?
                                    `${NowPlaying.SeriesName} · ${NowPlaying.Name}` :
                                    NowPlaying.Name}
                            </Typography>
                        </Box>
                        {progressPct !== null && (
                            <LinearProgress
                                variant='determinate'
                                value={progressPct}
                                sx={{
                                    mt: 0.5, height: 3, borderRadius: 2,
                                    backgroundColor: 'rgba(255,255,255,0.1)',
                                    '& .MuiLinearProgress-bar': { backgroundColor: 'primary.main', borderRadius: 2 }
                                }}
                            />
                        )}
                    </Box>
                ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <AccessTimeRoundedIcon sx={{ fontSize: 12, color: 'text.secondary', opacity: 0.6 }} />
                        <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary', opacity: 0.7 }}>
                            {friend.IsOnline ? 'Online now' : formatLastOnline(friend.LastOnline)}
                        </Typography>
                    </Box>
                )}

                <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', opacity: 0.5, mt: 0.5 }}>
                    {friend.HoursWatchedLastMonth.toFixed(1)} hrs this month
                </Typography>
            </Box>

            {/* Now-playing thumbnail */}
            {thumbUrl && (
                <Box
                    onClick={handleNowPlayingClick}
                    sx={{
                        width: 40, height: 58, borderRadius: '8px',
                        overflow: 'hidden', flexShrink: 0,
                        backgroundColor: 'rgba(0,0,0,0.3)', cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                        transition: 'transform 0.2s ease',
                        '&:hover': { transform: 'scale(1.05)' }
                    }}
                >
                    <img
                        src={thumbUrl}
                        alt={NowPlaying?.Name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                </Box>
            )}

            {/* Remove button */}
            <Tooltip title='Remove friend'>
                <IconButton
                    size='small'
                    onClick={handleRemoveClick}
                    sx={{
                        flexShrink: 0, color: 'text.secondary',
                        '&:hover': { color: 'error.main', backgroundColor: 'rgba(198,40,40,0.12)' }
                    }}
                >
                    <PersonRemoveRoundedIcon fontSize='small' />
                </IconButton>
            </Tooltip>
        </Paper>
    );
};

// ─── RequestRow ───────────────────────────────────────────────────────────────

interface RequestRowProps {
    req: FriendRequestDto;
    onAccept: (req: FriendRequestDto) => void;
    onDecline: (req: FriendRequestDto) => void;
    busy: boolean;
}

const RequestRow = ({ req, onAccept, onDecline, busy }: RequestRowProps) => {
    const handleAccept = useCallback(() => {
        onAccept(req);
    }, [req, onAccept]);
    const handleDecline = useCallback(() => {
        onDecline(req);
    }, [req, onDecline]);

    return (
        <Paper
            elevation={0}
            sx={{
                p: { xs: 1.5, sm: 2 },
                backgroundColor: 'rgba(0,164,220,0.05)',
                border: '1px solid rgba(0,164,220,0.15)',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: 2
            }}
        >
            <Avatar sx={{ width: 44, height: 44, fontSize: '0.9rem', fontWeight: 700, backgroundColor: avatarColor(req.RequesterName), flexShrink: 0 }}>
                {getInitials(req.RequesterName)}
            </Avatar>

            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography sx={{ fontWeight: 700, fontSize: '0.92rem' }} noWrap>
                    {req.RequesterName}
                </Typography>
                <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary' }}>
                    Sent {formatLastOnline(req.CreatedAt)}
                </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
                <Button
                    variant='contained'
                    size='small'
                    disabled={busy}
                    onClick={handleAccept}
                    startIcon={busy ? <CircularProgress size={12} /> : <CheckRoundedIcon />}
                    sx={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'none', borderRadius: '8px' }}
                >
                    Accept
                </Button>
                <Button
                    variant='outlined'
                    size='small'
                    disabled={busy}
                    onClick={handleDecline}
                    startIcon={<CloseRoundedIcon />}
                    sx={{
                        fontSize: '0.75rem', fontWeight: 700, textTransform: 'none', borderRadius: '8px',
                        borderColor: 'rgba(255,255,255,0.15)', color: 'text.secondary',
                        '&:hover': { borderColor: 'error.main', color: 'error.main', backgroundColor: 'rgba(198,40,40,0.08)' }
                    }}
                >
                    Decline
                </Button>
            </Box>
        </Paper>
    );
};

// ─── FriendsPage ──────────────────────────────────────────────────────────────
interface FriendsPageProps {
    onColorChange?: (color: string | null) => void;
}

export const FriendsPage = ({ onColorChange }: FriendsPageProps) => {
    const { data: friends, isLoading: loadingFriends, refetch: refetchFriends } = useLiveFriendsList();
    const { data: requests, refetch: refetchRequests } = useFriendRequests();

    const { mutateAsync: removeFriend } = useRemoveFriend();
    const { mutateAsync: sendRequest, isPending: sendingRequest } = useSendFriendRequest();
    const { mutateAsync: acceptRequest } = useAcceptFriendRequest();
    const { mutateAsync: declineRequest } = useDeclineFriendRequest();

    const [addUsername, setAddUsername] = useState('');
    const [addError, setAddError] = useState<string | null>(null);
    const [addSuccess, setAddSuccess] = useState(false);
    const [actionId, setActionId] = useState<string | null>(null);
    const [removeError, setRemoveError] = useState<string | null>(null);

    // Dynamic background sampling
    const samplingItem = useMemo(() => {
        const playing = friends?.find(f => f.IsOnline && f.NowPlaying?.ItemId);
        return playing?.NowPlaying?.ItemId ?? null;
    }, [friends]);

    const apiClient = ServerConnections.currentApiClient();
    const backdropUrl = samplingItem ?
        (apiClient?.getScaledImageUrl(samplingItem, { type: 'Backdrop', maxWidth: 400, quality: 60 }) ?? undefined) :
        undefined;

    const bgColor = useBackdropColor(backdropUrl);

    React.useEffect(() => {
        if (onColorChange) onColorChange(bgColor);
    }, [bgColor, onColorChange]);

    const handleSendRequest = useCallback(async () => {
        if (!addUsername.trim()) return;
        setAddError(null);
        setAddSuccess(false);
        try {
            await sendRequest(addUsername.trim());
            setAddSuccess(true);
            setAddUsername('');
        } catch (err: unknown) {
            const body = (err as { response?: { data?: unknown } })?.response?.data;
            setAddError(typeof body === 'string' ? body : 'Failed to send request. Check the username and try again.');
        }
    }, [addUsername, sendRequest]);

    const handleAddKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter') void handleSendRequest();
    }, [handleSendRequest]);

    const handleUsernameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setAddUsername(e.target.value);
        setAddError(null);
        setAddSuccess(false);
    }, []);

    const handleSendClick = useCallback(() => {
        void handleSendRequest();
    }, [handleSendRequest]);

    const handleRemove = useCallback(async (friendId: string) => {
        setRemoveError(null);
        try {
            await removeFriend(friendId);
            void refetchFriends();
        } catch (err: unknown) {
            const body = (err as { response?: { data?: unknown } })?.response?.data;
            setRemoveError(typeof body === 'string' ? body : 'Failed to remove friend.');
        }
    }, [removeFriend, refetchFriends]);

    const handleAccept = useCallback(async (req: FriendRequestDto) => {
        setActionId(req.RequestId);
        try {
            await acceptRequest(req.RequestId);
            void refetchRequests();
            void refetchFriends();
        } finally {
            setActionId(null);
        }
    }, [acceptRequest, refetchRequests, refetchFriends]);

    const handleDecline = useCallback(async (req: FriendRequestDto) => {
        setActionId(req.RequestId);
        try {
            await declineRequest(req.RequestId);
            void refetchRequests();
        } finally {
            setActionId(null);
        }
    }, [declineRequest, refetchRequests]);

    // Cast to the callback shape RequestRow expects (void not Promise<void>)
    const handleAcceptSync = useCallback((req: FriendRequestDto) => {
        void handleAccept(req);
    }, [handleAccept]);
    const handleDeclineSync = useCallback((req: FriendRequestDto) => {
        void handleDecline(req);
    }, [handleDecline]);

    const onlineCount = friends?.filter(f => f.IsOnline).length ?? 0;

    return (
        <Box
            sx={{
                maxWidth: 800,
                mx: 'auto',
                px: { xs: 2, sm: 3 },
                py: { xs: 3, sm: 4 },
                pb: { xs: 'calc(6rem + 56px)', md: '6rem' }
            }}
        >
            {/* Page header */}
            <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                    <PeopleAltRoundedIcon sx={{ fontSize: 28, color: 'primary.main' }} />
                    <Typography variant='h4' sx={{ fontWeight: 800, letterSpacing: '-0.03em' }}>
                        Friends
                    </Typography>
                    {onlineCount > 0 && (
                        <Chip
                            label={`${onlineCount} Online`}
                            size='small'
                            sx={{
                                height: 22, fontSize: '0.7rem', fontWeight: 600,
                                backgroundColor: 'rgba(76,175,80,0.18)',
                                color: '#4caf50',
                                border: '1px solid rgba(76,175,80,0.3)'
                            }}
                        />
                    )}
                </Box>
                <Typography color='text.secondary' sx={{ fontSize: '0.85rem' }}>
                    See what your friends are watching and manage your friend list.
                </Typography>
            </Box>

            {/* Pending requests */}
            {!!requests?.length && (
                <Box sx={{ mb: 4 }}>
                    <Typography variant='h6' sx={{ fontWeight: 700, mb: 1.5, fontSize: '1rem', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Pending Requests ({requests.length})
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        {requests.map(req => (
                            <RequestRow
                                key={req.RequestId}
                                req={req}
                                onAccept={handleAcceptSync}
                                onDecline={handleDeclineSync}
                                busy={actionId === req.RequestId}
                            />
                        ))}
                    </Box>
                    <Divider sx={{ mt: 4, borderColor: 'rgba(255,255,255,0.06)' }} />
                </Box>
            )}

            {/* Add friend */}
            <Box sx={{ mb: 4 }}>
                <Typography variant='h6' sx={{ fontWeight: 700, mb: 1.5, fontSize: '1rem', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonAddRoundedIcon fontSize='small' />
                        Add Friend
                    </Box>
                </Typography>

                <Paper
                    elevation={0}
                    sx={{
                        p: 2,
                        backgroundColor: 'rgba(20, 20, 20, 0.4)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        borderRadius: '16px'
                    }}
                >
                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                        <TextField
                            variant='outlined'
                            value={addUsername}
                            onChange={handleUsernameChange}
                            onKeyDown={handleAddKeyDown}
                            placeholder='Enter username…'
                            size='small'
                            fullWidth
                            error={!!addError}
                            autoComplete='off'
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
                                        marginRight: '8px'
                                    }
                                }
                            }}
                            sx={inputSx}
                        />
                        <Button
                            variant='contained'
                            onClick={handleSendClick}
                            disabled={sendingRequest || !addUsername.trim()}
                            sx={{
                                flexShrink: 0, borderRadius: '10px',
                                fontWeight: 700, textTransform: 'none',
                                px: 2.5, minWidth: 100, height: 40
                            }}
                        >
                            {sendingRequest ? <CircularProgress size={18} color='inherit' /> : 'Send'}
                        </Button>
                    </Box>
                </Paper>
            </Box>

            {/* Friends list */}
            <Box>
                <Typography variant='h6' sx={{ fontWeight: 700, mb: 1.5, fontSize: '1rem', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Your Friends {friends?.length ? `(${friends.length})` : ''}
                </Typography>

                {removeError && (
                    <Typography sx={{ color: 'error.main', fontSize: '0.8rem', mb: 1.5, p: 1, backgroundColor: 'rgba(198,40,40,0.1)', borderRadius: '8px' }}>
                        {removeError}
                    </Typography>
                )}

                {loadingFriends && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                        <CircularProgress />
                    </Box>
                )}

                {!loadingFriends && !friends?.length && (
                    <Paper
                        elevation={0}
                        sx={{
                            py: 8, textAlign: 'center',
                            backgroundColor: 'rgba(20, 20, 20, 0.4)',
                            border: '1px solid rgba(255,255,255,0.05)',
                            borderRadius: '16px'
                        }}
                    >
                        <PeopleAltRoundedIcon sx={{ fontSize: 56, color: 'rgba(255,255,255,0.12)', mb: 2 }} />
                        <Typography color='text.secondary' sx={{ fontSize: '0.9rem' }}>
                            Your friends list is empty
                        </Typography>
                        <Typography color='text.secondary' sx={{ fontSize: '0.78rem', opacity: 0.6, mt: 0.5 }}>
                            Send a friend request above to get started.
                        </Typography>
                    </Paper>
                )}

                {!loadingFriends && !!friends?.length && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        {friends.map(friend => (
                            <FriendRow key={friend.UserId} friend={friend} onRemove={handleRemove} />
                        ))}
                    </Box>
                )}
            </Box>
        </Box>
    );
};

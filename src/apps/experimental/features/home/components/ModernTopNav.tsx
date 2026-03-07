import React, { useCallback } from 'react';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import LocalMoviesRoundedIcon from '@mui/icons-material/LocalMoviesRounded';
import TvRoundedIcon from '@mui/icons-material/TvRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import LiveTvRoundedIcon from '@mui/icons-material/LiveTvRounded';
import VideoLibraryRoundedIcon from '@mui/icons-material/VideoLibraryRounded';
import QueueMusicRoundedIcon from '@mui/icons-material/QueueMusicRounded';
import type { SvgIconProps } from '@mui/material/SvgIcon';

import { type ItemDto } from 'types/base/models/item-dto';
import { appRouter } from 'components/router/appRouter';
import { useNavContext } from '../../../contexts/NavContext';

import Events from 'utils/events';

import SearchButton from '../../../components/AppToolbar/SearchButton';
import AnnouncementsButton from '../../../components/AppToolbar/announcements/AnnouncementsButton';
import SyncPlayButton from '../../../components/AppToolbar/SyncPlayButton';
import RemotePlayButton from '../../../components/AppToolbar/RemotePlayButton';
import UserMenuButton from 'components/toolbar/UserMenuButton';

// ─── Icon button style ─────────────────────────────────────────────────────────
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

// ─── Animated Hamburger ───────────────────────────────────────────────────────
const HamburgerButton = () => {
    const { isDrawerOpen } = useNavContext();

    const handleHamburgerClick = useCallback(() => {
        const win = window as any;
        // 1. Try modern React-based drawer toggle via global bridge
        if (win.jellyfinToggleDrawer) {
            win.jellyfinToggleDrawer();
        } else if (win.LibraryMenu?.onHardwareMenuButtonClick) {
            // 2. Fallback to legacy drawer toggle if modern layout bridge is missing
            win.LibraryMenu.onHardwareMenuButtonClick();
        } else {
            // 3. Last resort: trigger global event
            Events.trigger(window, 'jellyfin-toggle-drawer');
        }
    }, []);

    return (
        <Tooltip title={isDrawerOpen ? 'Close menu' : 'Open menu'} placement='bottom'>
            <IconButton
                onClick={handleHamburgerClick}
                disableRipple
                aria-label={isDrawerOpen ? 'Close menu' : 'Open menu'}
                sx={{
                    ...navIconSx,
                    flexShrink: 0,
                    // Hover animation for the internal lines
                    '&:hover div:nth-of-type(1)': {
                        width: isDrawerOpen ? 22 : 14,
                        ml: isDrawerOpen ? 0 : 'auto'
                    },
                    '&:hover div:nth-of-type(3)': {
                        width: isDrawerOpen ? 22 : 18,
                        ml: isDrawerOpen ? 0 : 'auto'
                    }
                }}
            >
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: '5px', width: 22, height: 16, justifyContent: 'center' }}>
                    <Box sx={{
                        display: 'block', height: 2, width: 22, backgroundColor: 'currentColor', borderRadius: 1,
                        transition: 'transform 0.25s ease, opacity 0.25s ease, width 0.2s ease, margin-left 0.2s ease',
                        ...(isDrawerOpen ? { transform: 'translateY(7px) rotate(45deg)' } : {})
                    }} />
                    <Box sx={{
                        display: 'block', height: 2, width: 22, backgroundColor: 'currentColor', borderRadius: 1,
                        transition: 'opacity 0.25s ease, width 0.2s ease',
                        ...(isDrawerOpen ? { opacity: 0 } : {})
                    }} />
                    <Box sx={{
                        display: 'block', height: 2, width: 22, backgroundColor: 'currentColor', borderRadius: 1,
                        transition: 'transform 0.25s ease, opacity 0.25s ease, width 0.2s ease, margin-left 0.2s ease',
                        ...(isDrawerOpen ? { transform: 'translateY(-7px) rotate(-45deg)' } : {})
                    }} />
                </Box>
            </IconButton>
        </Tooltip>
    );
};

// ─── Action strip ─────────────────────────────────────────────────────────────
const ActionButtons = () => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0 }}>
        <SearchButton />
        <AnnouncementsButton />
        <RemotePlayButton />
        <SyncPlayButton />
        <UserMenuButton />
    </Box>
);

// ─── Single nav tab ───────────────────────────────────────────────────────────
const NavTab = ({
    icon: Icon,
    label,
    active,
    onClick
}: {
    icon: React.ElementType<SvgIconProps>
    label: string
    active: boolean
    onClick: () => void
}) => {
    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLButtonElement>) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            e.preventDefault();
            const next = e.currentTarget.parentElement?.nextElementSibling?.querySelector('button') as HTMLElement | null;
            next?.focus();
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            e.preventDefault();
            const prev = e.currentTarget.parentElement?.previousElementSibling?.querySelector('button') as HTMLElement | null;
            prev?.focus();
        }
    }, []);

    return (
        <Box sx={{ position: 'relative', flexShrink: 0 }}>
            <Tooltip title={label} placement='bottom'>
                <ButtonBase
                    onClick={onClick}
                    onKeyDown={handleKeyDown}
                    className='home-nav-item'
                    aria-label={label}
                    aria-pressed={active}
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 0.5,
                        px: { xs: 2.5, sm: 4 }, // Reduced horizontal space on mobile
                        py: 1,
                        borderRadius: 2,
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        position: 'relative',
                        color: active ? 'primary.main' : 'text.secondary',
                        '&:hover': {
                            color: 'text.primary',
                            transform: 'translateY(-2px)'
                        },
                        '&:focus-visible': {
                            outline: '2px solid #00a4dc',
                            outlineOffset: '2px',
                            borderRadius: '8px'
                        },
                        ...(active && {
                            '&::after': {
                                content: '""',
                                position: 'absolute',
                                bottom: 0,
                                width: '20px',
                                height: '3px',
                                backgroundColor: 'primary.main',
                                borderRadius: '2px',
                                boxShadow: '0 0 10px rgba(0,164,220,0.5)'
                            }
                        })
                    }}
                >
                    <Icon sx={{ fontSize: 24 }} />
                    <Typography
                        variant='caption'
                        sx={{ fontWeight: active ? 'bold' : 'medium', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                    >
                        {label}
                    </Typography>
                </ButtonBase>
            </Tooltip>
        </Box>
    );
};

// ─── Bar styles ───────────────────────────────────────────────────────────────
const TOP_BAR_HEIGHT = 64;

// ─── Main component ───────────────────────────────────────────────────────────
interface UnifiedNavProps {
    activeTab: number
    onTabChange: (index: number) => void
    libraries?: ItemDto[]
}

export const UnifiedNav = ({ activeTab, onTabChange, libraries = [] }: UnifiedNavProps) => {
    const handleHomeClick = useCallback(() => onTabChange(0), [onTabChange]);
    const handleFavouritesClick = useCallback(() => onTabChange(1), [onTabChange]);
    const handleLibraryClick = useCallback((lib: ItemDto) => {
        appRouter.showItem(lib);
    }, []);

    const getLibraryIcon = (item: ItemDto): React.ElementType<SvgIconProps> => {
        const type = item.CollectionType;
        const name = item.Name?.toLowerCase() || '';
        if (type === 'movies') return LocalMoviesRoundedIcon;
        if (name.includes('anime')) return AutoAwesomeRoundedIcon;
        if (type === 'tvshows') return TvRoundedIcon;
        if (type === 'livetv') return LiveTvRoundedIcon;
        if (type === 'music' || type === 'musicvideos') return QueueMusicRoundedIcon;
        return VideoLibraryRoundedIcon;
    };

    const allTabs = [
        { icon: HomeRoundedIcon, label: 'Home', onClick: handleHomeClick, active: activeTab === 0 },
        { icon: FavoriteRoundedIcon, label: 'Favourites', onClick: handleFavouritesClick, active: activeTab === 1 },
        ...libraries.map(lib => ({
            icon: getLibraryIcon(lib),
            label: lib.Name || '',
            onClick: () => handleLibraryClick(lib),
            active: false
        }))
    ];

    return (
        <>
            {/* ── Top bar ─────────────────────────────────────────── */}
            <Box
                component='nav'
                aria-label='Main navigation'
                sx={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 100,
                    height: TOP_BAR_HEIGHT,
                    display: 'flex',
                    alignItems: 'center',
                    px: { xs: 0.5, md: 1 },
                    py: 1.5,
                    gap: 0,
                    // Glass background for readability over hero media
                    background: 'rgba(10, 10, 15, 0.55)',
                    backdropFilter: 'blur(18px)',
                    WebkitBackdropFilter: 'blur(18px)',
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                    mb: 4
                }}
            >
                {/* Left: hamburger only */}
                <HamburgerButton />

                {/* Centre: nav tabs — absolutely centred on desktop, hidden on mobile */}
                <Box
                    sx={{
                        display: { xs: 'none', md: 'flex' },
                        alignItems: 'center',
                        position: 'absolute',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        overflowX: 'auto',
                        scrollbarWidth: 'none',
                        '&::-webkit-scrollbar': { display: 'none' }
                    }}
                >
                    {allTabs.map(tab => (
                        <NavTab
                            key={tab.label}
                            icon={tab.icon}
                            label={tab.label}
                            active={tab.active}
                            onClick={tab.onClick}
                        />
                    ))}
                </Box>

                {/* Right: action icons */}
                <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center' }}>
                    <ActionButtons />
                </Box>
            </Box>

            {/* ── Bottom tab bar (mobile only) ─────────────────────── */}
            <Box
                component='nav'
                aria-label='Tab navigation'
                sx={{
                    display: { xs: 'flex', md: 'none' },
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    zIndex: 200,
                    backgroundColor: 'rgba(12, 12, 16, 0.88)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    borderTop: '1px solid rgba(255,255,255,0.08)',
                    overflowX: 'auto',
                    scrollbarWidth: 'none',
                    '&::-webkit-scrollbar': { display: 'none' },
                    py: 0.5,
                    pb: 'max(0.5rem, env(safe-area-inset-bottom))',
                    px: 0.5
                }}
            >
                {allTabs.map(tab => (
                    <Box key={tab.label} sx={{ flexShrink: 0, flex: libraries.length < 4 ? 1 : 'none' }}>
                        <NavTab
                            icon={tab.icon}
                            label={tab.label}
                            active={tab.active}
                            onClick={tab.onClick}
                        />
                    </Box>
                ))}
            </Box>
        </>
    );
};

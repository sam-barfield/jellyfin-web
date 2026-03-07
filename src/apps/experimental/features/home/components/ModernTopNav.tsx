import React, { useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import LocalMoviesIcon from '@mui/icons-material/LocalMovies';
import TvIcon from '@mui/icons-material/Tv';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import LiveTvIcon from '@mui/icons-material/LiveTv';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import QueueMusicIcon from '@mui/icons-material/QueueMusic';
import ButtonBase from '@mui/material/ButtonBase';
import { type ItemDto } from 'types/base/models/item-dto';
import { appRouter } from 'components/router/appRouter';

import type { SvgIconProps } from '@mui/material/SvgIcon';

const NavItem = function({
    icon: Icon,
    label,
    active = false,
    onClick
}: {
    icon: React.ElementType<SvgIconProps>,
    label: string,
    active?: boolean,
    onClick?: () => void
}) {
    return (
        <ButtonBase
            onClick={onClick}
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 0.5,
                px: 2,
                py: 1,
                borderRadius: 2,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                color: active ? 'primary.main' : 'text.secondary',
                '&:hover': {
                    color: 'text.primary',
                    transform: 'translateY(-2px)'
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
            <Typography variant='caption' sx={{ fontWeight: active ? 'bold' : 'medium', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {label}
            </Typography>
        </ButtonBase>
    );
};

interface ModernTopNavProps {
    activeTab: number;
    onTabChange: (index: number) => void;
    libraries?: ItemDto[];
}

interface LibraryNavItemProps {
    lib: ItemDto;
    onClick: (lib: ItemDto) => void;
    getIcon: (item: ItemDto) => React.ElementType<SvgIconProps>;
}

const LibraryNavItem = React.memo(({ lib, onClick, getIcon }: LibraryNavItemProps) => {
    const handleClick = useCallback(() => onClick(lib), [lib, onClick]);
    return (
        <NavItem
            icon={getIcon(lib)}
            label={lib.Name || ''}
            onClick={handleClick}
        />
    );
});

LibraryNavItem.displayName = 'LibraryNavItem';

export const ModernTopNav = ({ activeTab, onTabChange, libraries = [] }: ModernTopNavProps) => {
    const handleLibraryClick = useCallback((lib: ItemDto) => {
        appRouter.showItem(lib);
    }, []);

    const handleHomeClick = useCallback(() => onTabChange(0), [onTabChange]);
    const handleFavoritesClick = useCallback(() => onTabChange(1), [onTabChange]);

    const getLibraryIcon = useCallback((item: ItemDto) => {
        const type = item.CollectionType;
        const name = item.Name?.toLowerCase() || '';

        if (type === 'movies') return LocalMoviesIcon;
        if (name.includes('anime')) return AutoAwesomeIcon;
        if (type === 'tvshows') return TvIcon;
        if (type === 'livetv') return LiveTvIcon;
        if (type === 'music' || type === 'musicvideos') return QueueMusicIcon;
        return VideoLibraryIcon;
    }, []);

    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: { xs: 'flex-start', md: 'center' },
                gap: { xs: 0.5, sm: 2, md: 4 },
                mb: 4,
                width: '100%',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                pb: 1,
                overflowX: 'auto',
                scrollbarWidth: 'none',
                '&::-webkit-scrollbar': { display: 'none' }
            }}
        >
            <NavItem
                icon={HomeRoundedIcon}
                label='Home'
                active={activeTab === 0}
                onClick={handleHomeClick}
            />
            <NavItem
                icon={FavoriteBorderIcon}
                label='Favorites'
                active={activeTab === 1}
                onClick={handleFavoritesClick}
            />

            {libraries.map((lib) => (
                <LibraryNavItem
                    key={lib.Id}
                    lib={lib}
                    getIcon={getLibraryIcon}
                    onClick={handleLibraryClick}
                />
            ))}
        </Box>
    );
};

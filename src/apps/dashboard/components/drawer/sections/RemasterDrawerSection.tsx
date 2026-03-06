import Schedule from '@mui/icons-material/Schedule';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import NotificationsIcon from '@mui/icons-material/Notifications';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import React from 'react';

import ListItemLink from 'components/ListItemLink';
import Home from '@mui/icons-material/Home';

const RemasterDrawerSection = () => {
    return (
        <List
            aria-labelledby='server-subheader'
            subheader={
                <ListSubheader component='div' id='server-subheader'>
                    Sam&apos;s Remaster
                </ListSubheader>
            }
        >
            <ListItem disablePadding>
                <ListItemLink to='/dashboard/remaster'>
                    <ListItemIcon>
                        <Home />
                    </ListItemIcon>
                    <ListItemText primary={'Home'} />
                </ListItemLink>
            </ListItem>
            <ListItem disablePadding>
                <ListItemLink to='/dashboard/remaster/dubbing'>
                    <ListItemIcon>
                        <Schedule />
                    </ListItemIcon>
                    <ListItemText primary={'Dubbing'} />
                </ListItemLink>
            </ListItem>
            <ListItem disablePadding>
                <ListItemLink to='/dashboard/remaster/announcements'>
                    <ListItemIcon>
                        <NotificationsIcon />
                    </ListItemIcon>
                    <ListItemText primary={'Announcements'} />
                </ListItemLink>
            </ListItem>
            <ListItem disablePadding>
                <ListItemLink to='/dashboard/remaster/calendar'>
                    <ListItemIcon>
                        <Schedule />
                    </ListItemIcon>
                    <ListItemText primary={'Calendar Settings'} />
                </ListItemLink>
            </ListItem>
            <ListItem disablePadding>
                <ListItemLink to='/dashboard/remaster/trending'>
                    <ListItemIcon>
                        <TrendingUpIcon />
                    </ListItemIcon>
                    <ListItemText primary={'Trending Settings'} />
                </ListItemLink>
            </ListItem>
        </List>
    );
};

export default RemasterDrawerSection;

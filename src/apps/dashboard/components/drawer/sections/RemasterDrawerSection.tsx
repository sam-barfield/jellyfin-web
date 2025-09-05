import Schedule from '@mui/icons-material/Schedule';
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
                <ListItemLink to='/dashboard/remaster/tasks'>
                    <ListItemIcon>
                        <Schedule />
                    </ListItemIcon>
                    <ListItemText primary={'Tasks'} />
                </ListItemLink>
            </ListItem>
        </List>
    );
};

export default RemasterDrawerSection;

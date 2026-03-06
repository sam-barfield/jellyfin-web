import React from 'react';
import Page from 'components/Page';
import Box from '@mui/material/Box';
import { AnnouncementsAdmin } from 'apps/dashboard/components/announcements/AnnouncementsAdmin';

export const Component = () => {
    return (
        <Page
            id='remasterAnnouncementsPage'
            title={'Announcements Admin'}
            className='mainAnimatedPage type-interior'
        >
            <Box className='content-primary'>
                <AnnouncementsAdmin />
            </Box>
        </Page>
    );
};

Component.displayName = 'RemasterAnnouncementsPage';

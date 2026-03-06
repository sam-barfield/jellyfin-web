import React from 'react';
import Page from 'components/Page';
import Box from '@mui/material/Box';
import { CalendarSettings } from 'apps/dashboard/components/calendar/CalendarSettings';

export const Component = () => {
    return (
        <Page
            id='remasterCalendarPage'
            title={'Calendar Settings'}
            className='mainAnimatedPage type-interior remasterCalendarPage'
        >
            <Box className='content-primary'>
                <CalendarSettings />
            </Box>
        </Page>
    );
};

Component.displayName = 'RemasterCalendarPage';

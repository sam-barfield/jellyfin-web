import React from 'react';
import Box from '@mui/material/Box';
import { ReleaseCalendar } from './components/ReleaseCalendar';

export const CalendarPage = () => {
    return (
        <Box sx={{ p: { xs: 2, md: 4 } }}>
            <ReleaseCalendar />
        </Box>
    );
};

export default CalendarPage;

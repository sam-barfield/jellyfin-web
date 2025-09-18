import React from 'react';
import Page from 'components/Page';
import { DubbingTask } from 'apps/dashboard/components/remaster/dubbing/DubbingTask';
import Box from '@mui/material/Box';
import { DubbingSettings } from 'apps/dashboard/components/remaster/dubbing/DubbingSettings';

export const Component = () => {
    return (
        <Page
            id='remasterDubbingPage'
            title={'Remaster Dubbing'}
            className='mainAnimatedPage type-interior'
        >
            <Box className='content-primary'>
                <DubbingSettings />
                <DubbingTask />
            </Box>
        </Page>
    );
};

Component.displayName = 'RemasterDubbingPage';

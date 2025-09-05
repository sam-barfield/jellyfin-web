import React from 'react';
import Page from 'components/Page';
import Box from '@mui/material/Box';

export const Component = () => {
    return (
        <Page
            id='remasterHomePage'
            title={'Remaster Home'}
            className='mainAnimatedPage type-interior'
        >
            <Box className='content-primary'>
                <Box className='readOnlyContent'>
                    YOOOO HOME PAGE
                </Box>
            </Box>
        </Page>
    );
};

Component.displayName = 'TasksPage';

import React from 'react';
import Page from 'components/Page';
import Box from '@mui/material/Box';
import { TrendingSettings } from 'apps/dashboard/components/trending/TrendingSettings';

export const Component = () => {
    return (
        <Page
            id='remasterTrendingPage'
            title={'Trending Settings'}
            className='mainAnimatedPage type-interior remasterTrendingPage'
        >
            <Box className='content-primary'>
                <TrendingSettings />
            </Box>
        </Page>
    );
};

Component.displayName = 'RemasterTrendingPage';

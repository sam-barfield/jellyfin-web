import React from 'react';
import Page from 'components/Page';
import { CalendarPage } from 'apps/experimental/features/calendar/CalendarPage';

export const Component = () => {
    return (
        <Page
            id='releaseCalendarPage'
            title={'Release Calendar'}
            className='mainAnimatedPage type-interior releaseCalendarPage'
        >
            <CalendarPage />
        </Page>
    );
};

Component.displayName = 'ReleaseCalendarPage';

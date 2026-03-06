import React, { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Collapse from '@mui/material/Collapse';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { ReleaseCalendar } from '../../calendar/components/ReleaseCalendar';
import { TrendingWidget } from './TrendingWidget';
import { useHomeData } from 'hooks/useHomeData';

const STORAGE_KEY = 'home_schedule_collapsed';

export const HomeSidebar = () => {
    const { trendingMovies, trendingShows, isPending } = useHomeData();

    const [isScheduleCollapsed, setIsScheduleCollapsed] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        // Default to OPEN (false) if no saved state
        return saved === 'true';
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, String(isScheduleCollapsed));
    }, [isScheduleCollapsed]);

    const handleToggleCollapse = useCallback(() => {
        setIsScheduleCollapsed((prev: boolean) => !prev);
    }, []);

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ mb: 2 }}>
                {!isPending && (
                    <TrendingWidget trendingMovies={trendingMovies} trendingShows={trendingShows} />
                )}
            </Box>

            {/* Estimated Schedule Section at the Bottom */}
            <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant='h6' component='h2' sx={{ fontWeight: 800, letterSpacing: '-0.02em', fontSize: '1.25rem' }}>
                        Estimated Schedule
                    </Typography>
                    <IconButton
                        size='small'
                        onClick={handleToggleCollapse}
                        sx={{ color: 'text.secondary' }}
                    >
                        {isScheduleCollapsed ? <ExpandMoreIcon /> : <ExpandLessIcon />}
                    </IconButton>
                </Box>
                <Typography variant='body2' sx={{ color: 'text.secondary', fontSize: '0.75rem', mb: 2, opacity: 0.7 }}>
                    Episodes scheduled for download once they air.
                </Typography>

                <Collapse in={!isScheduleCollapsed}>
                    <ReleaseCalendar
                        title=''
                        showTimestamp={false}
                        sx={{
                            '& .MuiPaper-root': {
                                backgroundColor: 'rgba(255,255,255,0.03)',
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255,255,255,0.05)'
                            }
                        }}
                    />
                </Collapse>
            </Box>
        </Box>
    );
};

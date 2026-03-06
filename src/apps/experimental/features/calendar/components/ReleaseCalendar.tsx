import React, { useCallback, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import { SxProps, Theme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import ButtonBase from '@mui/material/ButtonBase';
import IconButton from '@mui/material/IconButton';
import ChevronLeft from '@mui/icons-material/ChevronLeft';
import ChevronRight from '@mui/icons-material/ChevronRight';
import PlayArrow from '@mui/icons-material/PlayArrow';
import { useCalendar, ReleaseCalendarItem, ReleaseCalendarType } from 'apps/dashboard/features/calendar/api/useCalendar';
import { format, startOfDay, endOfDay, isSameDay, addDays, startOfWeek, eachDayOfInterval } from 'date-fns';

const DateTab = React.memo(({ date, active, onClick }: { date: Date; active: boolean; onClick: (date: Date) => void }) => {
    const handleClick = useCallback(() => {
        onClick(date);
    }, [date, onClick]);

    return (
        <ButtonBase
            onClick={handleClick}
            sx={{
                flex: 1,
                minWidth: 80,
                py: 1.5,
                px: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                borderRadius: 1,
                backgroundColor: active ? 'primary.main' : 'rgba(255, 255, 255, 0.05)',
                color: active ? 'primary.contrastText' : 'text.secondary',
                transition: 'all 0.2s',
                '&:hover': {
                    backgroundColor: active ? 'primary.main' : 'rgba(255, 255, 255, 0.1)',
                    color: active ? 'primary.contrastText' : 'text.primary'
                }
            }}
        >
            <Typography variant='caption' sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
                {format(date, 'EEE')}
            </Typography>
            <Typography variant='body2' sx={{ fontWeight: 'bold' }}>
                {format(date, 'MMM d')}
            </Typography>
        </ButtonBase>
    );
});

DateTab.displayName = 'DateTab';

const ReleaseRow = ({ item }: { item: ReleaseCalendarItem }) => {
    const isMovie = item.Type === ReleaseCalendarType.Movie;
    const time = format(new Date(item.AirDateUtc), 'HH:mm');
    const typeLabel = isMovie ? 'Movie' : `Ep ${item.EpisodeNumber || '?'}`;

    return (
        <Paper
            elevation={0}
            sx={{
                p: { xs: 1.5, sm: 2 },
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'transparent',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.03)'
                }
            }}
        >
            <Typography variant='subtitle2' sx={{ width: 50, fontWeight: 'bold', color: 'text.secondary', flexShrink: 0 }}>
                {time}
            </Typography>

            <Box sx={{ flexGrow: 1, mx: { xs: 1, sm: 2 }, minWidth: 0 }}>
                <Typography variant='subtitle2' sx={{ fontWeight: 500 }} noWrap>
                    {item.Title}
                </Typography>
                {!isMovie && item.SeriesTitle && (
                    <Typography variant='caption' color='text.secondary' sx={{ opacity: 0.7 }} noWrap display='block'>
                        {item.SeriesTitle}
                    </Typography>
                )}
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                <Paper
                    variant='outlined'
                    sx={{
                        px: { xs: 1, sm: 1.5 },
                        py: 0.5,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: 1
                    }}
                >
                    <PlayArrow sx={{ fontSize: 14, color: 'primary.main' }} />
                    <Typography variant='caption' sx={{ fontWeight: 'bold', fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                        {typeLabel}
                    </Typography>
                </Paper>
            </Box>
        </Paper>
    );
};

interface ReleaseCalendarProps {
    title?: string;
    showTimestamp?: boolean;
    sx?: SxProps<Theme>;
}

export const ReleaseCalendar = ({ title = 'Estimated Schedule', showTimestamp = true, sx }: ReleaseCalendarProps) => {
    const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));

    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Start on Monday
    const weekDates = useMemo(() => {
        return eachDayOfInterval({
            start: weekStart,
            end: addDays(weekStart, 6)
        });
    }, [weekStart]);

    const start = format(startOfDay(weekDates[0]), "yyyy-MM-dd'T'HH:mm:ss'Z'");
    const end = format(endOfDay(weekDates[6]), "yyyy-MM-dd'T'HH:mm:ss'Z'");

    const { data: items, isPending, isError } = useCalendar(start, end);

    const dayItems = useMemo(() => {
        if (!items) return [];
        return items
            .filter(item => isSameDay(new Date(item.AirDateUtc), selectedDate))
            .sort((a, b) => new Date(a.AirDateUtc).getTime() - new Date(b.AirDateUtc).getTime());
    }, [items, selectedDate]);

    const handlePrevWeek = useCallback(() => setSelectedDate(prev => addDays(prev, -7)), []);
    const handleNextWeek = useCallback(() => setSelectedDate(prev => addDays(prev, 7)), []);
    const handleDateSelect = useCallback((date: Date) => setSelectedDate(date), []);

    const renderContent = () => {
        if (isPending) {
            return (
                <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
                    <CircularProgress size={30} />
                </Box>
            );
        }

        if (dayItems.length > 0) {
            return (
                <Stack spacing={0}>
                    {dayItems.map(item => (
                        <ReleaseRow key={`${item.Title}-${item.AirDateUtc}`} item={item} />
                    ))}
                </Stack>
            );
        }

        return (
            <Box sx={{ py: 6, textAlign: 'center' }}>
                <Typography variant='body2' color='text.secondary'>
                    No releases found for this day.
                </Typography>
            </Box>
        );
    };

    if (isError) {
        return (
            <Box sx={{ p: 3, ...sx }}>
                <Alert severity='error'>
                    Failed to load release calendar.
                </Alert>
            </Box>
        );
    }

    return (
        <Box sx={sx}>
            <Box sx={{ mb: 2, display: 'flex', alignItems: 'baseline', gap: 1.5, flexWrap: 'wrap' }}>
                <Typography variant='h5' component='h2' sx={{ fontWeight: 'bold' }}>
                    {title}
                </Typography>
                {showTimestamp && (
                    <Typography variant='caption' color='text.secondary'>
                        (GMT{format(new Date(), 'xxx')}) {format(new Date(), 'MM/dd/yyyy hh:mm:ss a')}
                    </Typography>
                )}
            </Box>

            <Paper sx={{ p: { xs: 1, sm: 2 }, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 0.5 }}>
                    <IconButton size='small' onClick={handlePrevWeek}>
                        <ChevronLeft />
                    </IconButton>

                    <Box
                        sx={{
                            display: 'flex',
                            flexGrow: 1,
                            gap: 1,
                            overflowX: 'auto',
                            pb: 1,
                            scrollbarWidth: 'none',
                            '&::-webkit-scrollbar': { display: 'none' }
                        }}
                    >
                        {weekDates.map(date => (
                            <DateTab
                                key={date.toISOString()}
                                date={date}
                                active={isSameDay(date, selectedDate)}
                                onClick={handleDateSelect}
                            />
                        ))}
                    </Box>

                    <IconButton size='small' onClick={handleNextWeek}>
                        <ChevronRight />
                    </IconButton>
                </Box>

                {renderContent()}
            </Paper>
        </Box>
    );
};

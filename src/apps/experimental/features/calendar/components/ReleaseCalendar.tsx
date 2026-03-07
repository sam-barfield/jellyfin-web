import React, { useCallback, useMemo, useState, useRef, useEffect } from 'react';
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
            data-today={isSameDay(date, new Date()) ? 'true' : undefined}
            sx={{
                flex: { xs: '0 0 auto', sm: '1 0 auto' },
                minWidth: { xs: 52, sm: 64 },
                py: 1,
                px: 0.5,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                borderRadius: '24px',
                backgroundColor: active ? 'primary.main' : 'transparent',
                color: active ? 'primary.contrastText' : 'text.secondary',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                    backgroundColor: active ? 'primary.main' : 'rgba(255, 255, 255, 0.08)',
                    color: active ? 'primary.contrastText' : 'text.primary',
                    transform: active ? 'none' : 'translateY(-2px)'
                },
                ...(active && {
                    boxShadow: '0 4px 15px rgba(0, 164, 220, 0.4)'
                })
            }}
        >
            <Typography variant='caption' sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: { xs: '0.6rem', sm: '0.65rem' }, mb: 0.25 }}>
                {isSameDay(date, new Date()) ? 'TODAY' : format(date, 'EEE')}
            </Typography>
            <Typography variant='body2' sx={{ fontWeight: 800, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                {format(date, 'MMM d')}
            </Typography>
        </ButtonBase>
    );
});

DateTab.displayName = 'DateTab';

const ReleaseRow = ({ item }: { item: ReleaseCalendarItem }) => {
    const isMovie = item.Type === ReleaseCalendarType.Movie;
    const date = new Date(item.AirDateUtc);
    const time = date.getMinutes() === 0 ? format(date, 'ha') : format(date, 'h:mma');
    const typeLabel = isMovie ? 'Movie' : `Ep ${item.EpisodeNumber || '?'}`;

    return (
        <Paper
            elevation={0}
            sx={{
                p: { xs: 1.5, sm: 2 },
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: '16px',
                transition: 'all 0.2s ease',
                '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                    borderColor: 'rgba(255, 255, 255, 0.15)',
                    transform: 'translateX(4px)'
                }
            }}
        >
            <Typography variant='subtitle2' sx={{ width: 50, fontWeight: 700, color: 'primary.main', flexShrink: 0 }}>
                {time}
            </Typography>

            <Box sx={{ flexGrow: 1, mx: { xs: 1, sm: 2 }, minWidth: 0 }}>
                <Typography variant='subtitle2' sx={{ fontWeight: 600, letterSpacing: '0.02em' }} noWrap>
                    {item.Title}
                </Typography>
                {!isMovie && item.SeriesTitle && (
                    <Typography variant='caption' color='text.secondary' sx={{ opacity: 0.8, fontWeight: 500 }} noWrap display='block'>
                        {item.SeriesTitle}
                    </Typography>
                )}
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                <Paper
                    variant='outlined'
                    sx={{
                        px: { xs: 1.5, sm: 2 },
                        py: 0.5,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        backgroundColor: 'rgba(0, 164, 220, 0.1)',
                        borderColor: 'transparent',
                        borderRadius: '12px',
                        color: 'primary.main'
                    }}
                >
                    <PlayArrow sx={{ fontSize: 16 }} />
                    <Typography variant='caption' sx={{ fontWeight: 700, fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
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

export const ReleaseCalendar = ({ title = 'Estimated Schedule', showTimestamp = false, sx }: ReleaseCalendarProps) => {
    const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));
    const tabsContainerRef = useRef<HTMLDivElement>(null);

    // On mount, scroll today's tab to the center of the nav
    useEffect(() => {
        const container = tabsContainerRef.current;
        if (!container) return;
        const todayEl = container.querySelector<HTMLElement>('[data-today="true"]');
        if (!todayEl) return;
        const containerCenter = container.clientWidth / 2;
        const elCenter = todayEl.offsetLeft + todayEl.offsetWidth / 2;
        container.scrollLeft = elCenter - containerCenter;
    }, []);

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

    const handlePrev = useCallback(() => {
        if (tabsContainerRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = tabsContainerRef.current;
            if (scrollLeft <= 5) {
                // At the start, load previous week and snap scroll to the end
                setSelectedDate(prev => addDays(prev, -7));
                setTimeout(() => tabsContainerRef.current?.scrollTo({ left: scrollWidth, behavior: 'instant' }), 0);
            } else {
                // Just scroll left
                tabsContainerRef.current.scrollBy({ left: -(clientWidth / 2), behavior: 'smooth' });
            }
        } else {
            setSelectedDate(prev => addDays(prev, -7));
        }
    }, []);

    const handleNext = useCallback(() => {
        if (tabsContainerRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = tabsContainerRef.current;
            if (Math.ceil(scrollLeft + clientWidth) >= scrollWidth - 5) {
                // At the end, load next week and snap scroll to the start
                setSelectedDate(prev => addDays(prev, 7));
                setTimeout(() => tabsContainerRef.current?.scrollTo({ left: 0, behavior: 'instant' }), 0);
            } else {
                // Just scroll right
                tabsContainerRef.current.scrollBy({ left: clientWidth / 2, behavior: 'smooth' });
            }
        } else {
            setSelectedDate(prev => addDays(prev, 7));
        }
    }, []);

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
                <Stack spacing={1.5}>
                    {dayItems.map(item => (
                        <ReleaseRow key={`${item.Title}-${item.AirDateUtc}`} item={item} />
                    ))}
                </Stack>
            );
        }

        return (
            <Box sx={{ py: 6, textAlign: 'center' }}>
                <Typography variant='body2' color='text.secondary'>
                    Stay tuned! No releases scheduled for this day yet.
                </Typography>
            </Box>
        );
    };

    if (isError) {
        return (
            <Box sx={{ p: 3, ...sx }}>
                <Alert severity='error' sx={{ borderRadius: 3 }}>
                    Failed to load estimated schedule. Please try again later.
                </Alert>
            </Box>
        );
    }

    return (
        <Box sx={sx}>
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant='h6' component='h2' sx={{ fontWeight: 800, letterSpacing: '-0.02em', fontSize: '1.25rem' }}>
                    {title}
                </Typography>
                {showTimestamp && (
                    <Typography variant='caption' color='text.secondary' sx={{ fontWeight: 500, opacity: 0.7 }}>
                        {format(new Date(), 'MMM d, h:mm a')}
                    </Typography>
                )}
            </Box>

            <Paper
                elevation={0}
                sx={{
                    p: { xs: 1.5, sm: 2.5 },
                    backgroundColor: 'rgba(20, 20, 20, 0.4)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: '24px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                } as SxProps<Theme>}
            >
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    mb: 3,
                    gap: 1,
                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                    borderRadius: '30px',
                    p: 0.5
                }}>
                    <IconButton size='small' onClick={handlePrev} sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main', backgroundColor: 'transparent' }, flexShrink: 0 }}>
                        <ChevronLeft />
                    </IconButton>

                    <Box
                        ref={tabsContainerRef}
                        sx={{
                            display: 'flex',
                            flexGrow: 1,
                            justifyContent: { xs: 'flex-start', sm: 'space-between' },
                            gap: { xs: 1, sm: 0.25 },
                            overflowX: 'auto',
                            scrollbarWidth: 'none',
                            '&::-webkit-scrollbar': { display: 'none' },
                            px: 1,
                            mx: -1,
                            py: 1
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

                    <IconButton size='small' onClick={handleNext} sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main', backgroundColor: 'transparent' }, flexShrink: 0 }}>
                        <ChevronRight />
                    </IconButton>
                </Box>

                <Box sx={{
                    mt: 1,
                    pb: 1,
                    pr: 1,
                    maxHeight: 400,
                    overflowY: 'auto',
                    scrollbarWidth: 'none',
                    '&::-webkit-scrollbar': { display: { xs: 'none', sm: 'block' }, width: 4 },
                    '&::-webkit-scrollbar-track': { background: 'transparent' },
                    '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.15)', borderRadius: 2 },
                    '&::-webkit-scrollbar-thumb:hover': { background: 'rgba(255,255,255,0.3)' }
                }}>
                    {renderContent()}
                </Box>
            </Paper>
        </Box>
    );
};

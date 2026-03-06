import React, { useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Stack from '@mui/material/Stack';
import { useQuery } from '@tanstack/react-query';
import { useApi } from 'hooks/useApi';
import Loading from 'components/loading/LoadingComponent';

export interface EnabledLibrary {
    LibraryId: string;
    LibraryName: string;
    MissingDubEpisodeCount: number;
    MissingSubEpisodeCount: number;
}

export interface MissingReportEpisode {
    EpisodeId: string;
    EpisodeName: string;
    SeasonNumber: number;
    EpisodeNumber: number;
    DubAvailable: 'Missing' | 'Full';
    SubAvailable: 'Missing' | 'Full';
}

export type AvailabilityStatus = 'Full' | 'Partial' | 'Missing' | null;

export interface MissingReportSeason {
    SeasonId: string;
    SeasonName: string;
    SeasonNumber: number;
    DubAvailable: AvailabilityStatus;
    SubAvailable: AvailabilityStatus;
    MissingDubEpisodeCount: number;
    MissingSubEpisodeCount: number;
    Episodes?: MissingReportEpisode[];
}

export interface MissingReportSeries {
    SeriesId: string;
    SeriesName: string;
    DubAvailable: AvailabilityStatus;
    SubAvailable: AvailabilityStatus;
    MissingDubEpisodeCount: number;
    MissingSubEpisodeCount: number;
    Seasons: MissingReportSeason[];
}

export interface MissingReport {
    LibraryId: string;
    LibraryName: string;
    MissingDubEpisodeCount: number;
    MissingSubEpisodeCount: number;
    Series: MissingReportSeries[];
}

const EpisodeRow = ({ episode }: { episode: MissingReportEpisode }) => {
    return (
        <Box sx={{ pl: 4, py: 1, display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <Typography variant='body2'>
                Episode {episode.EpisodeNumber} - {episode.EpisodeName}
            </Typography>
            <Typography variant='body2' color='error'>
                {episode.DubAvailable === 'Missing' && 'Dub Missing'}
                {episode.DubAvailable === 'Missing' && episode.SubAvailable === 'Missing' && ' | '}
                {episode.SubAvailable === 'Missing' && 'Sub Missing'}
            </Typography>
        </Box>
    );
};

const SeasonAccordion = ({ season }: { season: MissingReportSeason }) => {
    return (
        <Accordion disableGutters elevation={0} sx={{ background: 'transparent', '&:before': { display: 'none' } }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', pr: 2 }}>
                    <Typography>{season.SeasonName}</Typography>
                    <Typography color='error' variant='body2' sx={{ alignSelf: 'center' }}>
                        {season.MissingDubEpisodeCount > 0 ? `${season.MissingDubEpisodeCount} Dubs Missing` : ''}
                        {season.MissingDubEpisodeCount > 0 && season.MissingSubEpisodeCount > 0 ? ' • ' : ''}
                        {season.MissingSubEpisodeCount > 0 ? `${season.MissingSubEpisodeCount} Subs Missing` : ''}
                    </Typography>
                </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0, pb: 1 }}>
                {season.Episodes && season.Episodes.length > 0 ? (
                    season.Episodes.map(ep => <EpisodeRow key={ep.EpisodeId} episode={ep} />)
                ) : (
                    <Typography variant='body2' color='text.secondary'>No missing episodes found or data not loaded.</Typography>
                )}
            </AccordionDetails>
        </Accordion>
    );
};

const SeriesAccordion = ({ series }: { series: MissingReportSeries }) => {
    return (
        <Accordion disableGutters elevation={0} sx={{ background: 'rgba(255, 255, 255, 0.05)', mb: 1, '&:before': { display: 'none' }, borderRadius: 1 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', pr: 2 }}>
                    <Typography fontWeight='bold'>{series.SeriesName}</Typography>
                    <Typography color='error' variant='body2' sx={{ alignSelf: 'center' }}>
                        {series.MissingDubEpisodeCount > 0 ? `${series.MissingDubEpisodeCount} Dubs Missing` : ''}
                        {series.MissingDubEpisodeCount > 0 && series.MissingSubEpisodeCount > 0 ? ' • ' : ''}
                        {series.MissingSubEpisodeCount > 0 ? `${series.MissingSubEpisodeCount} Subs Missing` : ''}
                    </Typography>
                </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>
                {series.Seasons && series.Seasons.length > 0 ? (
                    series.Seasons.map(season => <SeasonAccordion key={season.SeasonId} season={season} />)
                ) : (
                    <Box sx={{ p: 2 }}>
                        <Typography variant='body2' color='text.secondary'>No missing seasons found.</Typography>
                    </Box>
                )}
            </AccordionDetails>
        </Accordion>
    );
};

const LibraryAccordionDetails = ({ isPending, expanded, report }: { isPending: boolean; expanded: boolean; report?: MissingReport }) => {
    if (isPending && expanded) {
        return <Loading />;
    }

    if (report && report.Series && report.Series.length > 0) {
        return (
            <>
                {report.Series.map(series => <SeriesAccordion key={series.SeriesId} series={series} />)}
            </>
        );
    }

    if (expanded) {
        return <Typography color='text.secondary'>No missing dubs or subs found for this library.</Typography>;
    }

    return null;
};

const LibraryAccordion = ({ library }: { library: EnabledLibrary }) => {
    const { api } = useApi();
    const [expanded, setExpanded] = useState(false);

    const { data: report, isPending } = useQuery({
        queryKey: ['DubSubMissingReport', library.LibraryId],
        queryFn: async () => {
            const url = api!.getUri(`/Library/DubSub/MissingReport?libraryId=${library.LibraryId}&includeSeasons=true&includeEpisodes=true`);
            const response = await api!.axiosInstance.get<MissingReport>(url, {
                headers: {
                    Authorization: api!.authorizationHeader
                }
            });
            return response.data;
        },
        enabled: !!api && expanded
    });

    const handleChange = useCallback((_event: React.SyntheticEvent, isExpanded: boolean) => {
        setExpanded(isExpanded);
    }, []);

    return (
        <Accordion expanded={expanded} onChange={handleChange} sx={{ mb: 2, background: 'rgba(255,255,255,0.02)' }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', pr: 2 }}>
                    <Typography variant='h6'>{library.LibraryName}</Typography>
                    <Typography color={library.MissingDubEpisodeCount === 0 && library.MissingSubEpisodeCount === 0 ? 'success.main' : 'error'} sx={{ alignSelf: 'center' }}>
                        {library.MissingDubEpisodeCount > 0 ? `${library.MissingDubEpisodeCount} Dubs Missing` : ''}
                        {library.MissingDubEpisodeCount > 0 && library.MissingSubEpisodeCount > 0 ? ' | ' : ''}
                        {library.MissingSubEpisodeCount > 0 ? `${library.MissingSubEpisodeCount} Subs Missing` : ''}
                        {library.MissingDubEpisodeCount === 0 && library.MissingSubEpisodeCount === 0 ? 'Complete' : ''}
                    </Typography>
                </Box>
            </AccordionSummary>
            <AccordionDetails>
                <LibraryAccordionDetails isPending={isPending} expanded={expanded} report={report} />
            </AccordionDetails>
        </Accordion>
    );
};

export const DubbingMissingReport = () => {
    const { api } = useApi();

    const { data: libraries, isPending } = useQuery({
        queryKey: ['DubSubEnabledLibraries'],
        queryFn: async () => {
            const url = api!.getUri('/Library/DubSub/EnabledLibraries');
            const response = await api!.axiosInstance.get<EnabledLibrary[]>(url, {
                headers: {
                    Authorization: api!.authorizationHeader
                }
            });
            return response.data;
        },
        enabled: !!api
    });

    if (isPending) {
        return <Loading />;
    }

    if (!libraries || libraries.length === 0) {
        return (
            <Box mt={4}>
                <Typography variant='h2' mb={2}>Dub/Sub Missing Report</Typography>
                <Typography color='text.secondary'>No Dub/Sub enabled libraries found.</Typography>
            </Box>
        );
    }

    return (
        <Box mt={4}>
            <Typography variant='h2' mb={3}>Dub/Sub Missing Report</Typography>
            <Stack spacing={1}>
                {libraries.map(lib => (
                    <LibraryAccordion key={lib.LibraryId} library={lib} />
                ))}
            </Stack>
        </Box>
    );
};

DubbingMissingReport.displayName = 'DubbingMissingReport';

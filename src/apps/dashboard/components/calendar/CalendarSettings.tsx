import React, { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid2';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import { useCalendarConfiguration, useUpdateCalendarConfiguration, ReleaseCalendarConfiguration } from 'apps/dashboard/features/calendar/api/useCalendar';

export const CalendarSettings = () => {
    const { data: config, isPending, isError } = useCalendarConfiguration();
    const { mutate: updateConfig, isPending: isUpdating, isSuccess: isUpdateSuccess } = useUpdateCalendarConfiguration();

    const [formData, setFormData] = useState<ReleaseCalendarConfiguration>({
        RadarrUrl: '',
        RadarrApiKey: '',
        SonarrUrl: '',
        SonarrApiKey: '',
        CacheTimeToLiveMinutes: 30
    });

    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        if (config) {
            setFormData(config);
        }
    }, [config]);

    useEffect(() => {
        if (isUpdateSuccess) {
            setShowSuccess(true);
            const timer = setTimeout(() => setShowSuccess(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [isUpdateSuccess]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? Number(value) : value
        }));
    }, []);

    const handleSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        updateConfig(formData);
    }, [formData, updateConfig]);

    if (isPending) {
        return (
            <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3, maxWidth: 800 }}>
            <Typography variant='h5' component='h2' sx={{ mb: 3 }}>
                Release Calendar Settings
            </Typography>

            {isError && (
                <Alert severity='error' sx={{ mb: 3 }}>
                    Failed to load calendar configuration.
                </Alert>
            )}

            {showSuccess && (
                <Alert severity='success' sx={{ mb: 3 }}>
                    Settings saved successfully!
                </Alert>
            )}

            <form onSubmit={handleSubmit}>
                <Stack spacing={3}>
                    <Paper sx={{ p: 3, background: 'rgba(255, 255, 255, 0.05)' }}>
                        <Typography variant='h6' sx={{ mb: 2 }}>Radarr Integration</Typography>
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 8 }}>
                                <TextField
                                    fullWidth
                                    label='Radarr URL'
                                    name='RadarrUrl'
                                    value={formData.RadarrUrl}
                                    onChange={handleChange}
                                    placeholder='http://localhost:7878'
                                    helperText='Internal or external URL for Radarr'
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <TextField
                                    fullWidth
                                    label='API Key'
                                    name='RadarrApiKey'
                                    type='password'
                                    value={formData.RadarrApiKey}
                                    onChange={handleChange}
                                />
                            </Grid>
                        </Grid>
                    </Paper>

                    <Paper sx={{ p: 3, background: 'rgba(255, 255, 255, 0.05)' }}>
                        <Typography variant='h6' sx={{ mb: 2 }}>Sonarr Integration</Typography>
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 8 }}>
                                <TextField
                                    fullWidth
                                    label='Sonarr URL'
                                    name='SonarrUrl'
                                    value={formData.SonarrUrl}
                                    onChange={handleChange}
                                    placeholder='http://localhost:8989'
                                    helperText='Internal or external URL for Sonarr'
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <TextField
                                    fullWidth
                                    label='API Key'
                                    name='SonarrApiKey'
                                    type='password'
                                    value={formData.SonarrApiKey}
                                    onChange={handleChange}
                                />
                            </Grid>
                        </Grid>
                    </Paper>

                    <Paper sx={{ p: 3, background: 'rgba(255, 255, 255, 0.05)' }}>
                        <Typography variant='h6' sx={{ mb: 2 }}>General Settings</Typography>
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    type='number'
                                    label='Cache TTL (Minutes)'
                                    name='CacheTimeToLiveMinutes'
                                    value={formData.CacheTimeToLiveMinutes}
                                    onChange={handleChange}
                                    helperText='How long to cache calendar results on the server'
                                />
                            </Grid>
                        </Grid>
                    </Paper>

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                            type='submit'
                            variant='contained'
                            color='primary'
                            size='large'
                            disabled={isUpdating}
                        >
                            {isUpdating ? <CircularProgress size={24} color='inherit' /> : 'Save Settings'}
                        </Button>
                    </Box>
                </Stack>
            </form>
        </Box>
    );
};

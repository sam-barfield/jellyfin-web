import React, { useState, useEffect, useCallback } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Grid from '@mui/material/Grid2';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import {
    useCreateAnnouncement,
    useUpdateAnnouncement,
    AnnouncementInfoDto,
    AnnouncementRequest
} from 'apps/dashboard/features/announcements/api/useAnnouncements';

interface AnnouncementModalProps {
    open: boolean;
    onClose: () => void;
    announcement?: AnnouncementInfoDto;
}

export const AnnouncementModal = ({ open, onClose, announcement }: AnnouncementModalProps) => {
    const { mutate: createAnnouncement, isPending: isCreating } = useCreateAnnouncement();
    const { mutate: updateAnnouncement, isPending: isUpdating } = useUpdateAnnouncement();

    const isPending = isCreating || isUpdating;

    const [formData, setFormData] = useState<AnnouncementRequest>({
        Title: '',
        Text: '',
        IsPinned: false,
        Priority: 0,
        DisplayOrder: 0,
        StartDateUtc: null,
        EndDateUtc: null,
        IsActive: true
    });

    useEffect(() => {
        if (announcement) {
            setFormData({
                Title: announcement.Title,
                Text: announcement.Text,
                IsPinned: announcement.IsPinned,
                Priority: announcement.Priority,
                DisplayOrder: announcement.DisplayOrder,
                StartDateUtc: announcement.StartDateUtc,
                EndDateUtc: announcement.EndDateUtc,
                IsActive: announcement.IsActive
            });
        } else {
            setFormData({
                Title: '',
                Text: '',
                IsPinned: false,
                Priority: 0,
                DisplayOrder: 0,
                StartDateUtc: null,
                EndDateUtc: null,
                IsActive: true
            });
        }
    }, [announcement]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => {
            let finalValue: string | number | boolean = value;
            if (type === 'checkbox') {
                finalValue = checked;
            } else if (type === 'number') {
                finalValue = Number(value);
            }
            return {
                ...prev,
                [name]: finalValue
            };
        });
    }, []);

    const handleStartDateChange = useCallback((date: Date | null) => {
        setFormData(prev => ({ ...prev, StartDateUtc: date ? date.toISOString() : null }));
    }, []);

    const handleEndDateChange = useCallback((date: Date | null) => {
        setFormData(prev => ({ ...prev, EndDateUtc: date ? date.toISOString() : null }));
    }, []);

    const handleSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.Title.trim() || !formData.Text.trim()) {
            alert('Title and text are required.');
            return;
        }
        if (formData.StartDateUtc && formData.EndDateUtc && new Date(formData.StartDateUtc) > new Date(formData.EndDateUtc)) {
            alert('Start date must be before end date.');
            return;
        }

        if (announcement) {
            updateAnnouncement(
                { id: announcement.Id, data: formData },
                { onSuccess: onClose }
            );
        } else {
            createAnnouncement(
                formData,
                { onSuccess: onClose }
            );
        }
    }, [formData, announcement, updateAnnouncement, createAnnouncement, onClose]);

    const title = announcement ? 'Edit Announcement' : 'New Announcement';

    return (
        <Dialog open={open} onClose={onClose} maxWidth='sm' fullWidth>
            <DialogTitle>
                {title}
            </DialogTitle>
            <form onSubmit={handleSubmit}>
                <DialogContent>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                required
                                margin='dense'
                                name='Title'
                                label='Title'
                                type='text'
                                fullWidth
                                variant='outlined'
                                value={formData.Title}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                required
                                margin='dense'
                                name='Text'
                                label='Message'
                                type='text'
                                fullWidth
                                multiline
                                rows={4}
                                variant='outlined'
                                value={formData.Text}
                                onChange={handleChange}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            <DateTimePicker
                                label='Start Date'
                                value={formData.StartDateUtc ? new Date(formData.StartDateUtc) : null}
                                onChange={handleStartDateChange}
                                slotProps={{ textField: { fullWidth: true, margin: 'dense' } }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <DateTimePicker
                                label='End Date'
                                value={formData.EndDateUtc ? new Date(formData.EndDateUtc) : null}
                                onChange={handleEndDateChange}
                                slotProps={{ textField: { fullWidth: true, margin: 'dense' } }}
                            />
                        </Grid>

                        <Grid size={{ xs: 6, sm: 4 }}>
                            <TextField
                                margin='dense'
                                name='Priority'
                                label='Priority'
                                type='number'
                                fullWidth
                                variant='outlined'
                                value={formData.Priority}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid size={{ xs: 6, sm: 4 }}>
                            <TextField
                                margin='dense'
                                name='DisplayOrder'
                                label='Display Order'
                                type='number'
                                fullWidth
                                variant='outlined'
                                value={formData.DisplayOrder}
                                onChange={handleChange}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 4 }} sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <FormControlLabel
                                control={<Switch checked={formData.IsActive} onChange={handleChange} name='IsActive' />}
                                label='Active'
                            />
                            <FormControlLabel
                                control={<Switch checked={formData.IsPinned} onChange={handleChange} name='IsPinned' />}
                                label='Pinned'
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose} color='inherit'>
                        Cancel
                    </Button>
                    <Button type='submit' variant='contained' color='primary' disabled={isPending}>
                        Save
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

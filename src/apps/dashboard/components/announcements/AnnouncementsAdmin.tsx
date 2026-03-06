import React, { useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import IconButton from '@mui/material/IconButton';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import CircularProgress from '@mui/material/CircularProgress';
import { format } from 'date-fns';
import {
    useAdminAnnouncements,
    useDeleteAnnouncement,
    AnnouncementInfoDto
} from 'apps/dashboard/features/announcements/api/useAnnouncements';
import { AnnouncementModal } from 'apps/dashboard/components/announcements/AnnouncementModal';

const AnnouncementRow = ({ announcement, onEdit, onDelete }: { announcement: AnnouncementInfoDto, onEdit: (a: AnnouncementInfoDto) => void, onDelete: (id: string) => void }) => {
    const handleEdit = useCallback(() => onEdit(announcement), [announcement, onEdit]);
    const handleDelete = useCallback(() => onDelete(announcement.Id), [announcement.Id, onDelete]);

    return (
        <TableRow>
            <TableCell>
                <Typography variant='body2' fontWeight='bold'>
                    {announcement.Title}
                </Typography>
            </TableCell>
            <TableCell>
                {announcement.IsActive ? 'Active' : 'Inactive'}
            </TableCell>
            <TableCell>
                {announcement.IsPinned ? 'Yes' : 'No'}
            </TableCell>
            <TableCell>
                {announcement.Priority}
            </TableCell>
            <TableCell>
                <Typography variant='body2' color='text.secondary'>
                    {announcement.StartDateUtc ? format(new Date(announcement.StartDateUtc), 'PPp') : 'Anytime'} - {announcement.EndDateUtc ? format(new Date(announcement.EndDateUtc), 'PPp') : 'Forever'}
                </Typography>
            </TableCell>
            <TableCell align='right'>
                <IconButton onClick={handleEdit} aria-label='edit'>
                    <EditIcon />
                </IconButton>
                <IconButton onClick={handleDelete} aria-label='delete' color='error'>
                    <DeleteIcon />
                </IconButton>
            </TableCell>
        </TableRow>
    );
};

export const AnnouncementsAdmin = () => {
    const { data: announcements, isPending } = useAdminAnnouncements();
    const { mutate: deleteAnnouncement } = useDeleteAnnouncement();

    const [modalOpen, setModalOpen] = useState(false);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<AnnouncementInfoDto | undefined>(undefined);

    const handleCreate = useCallback(() => {
        setSelectedAnnouncement(undefined);
        setModalOpen(true);
    }, []);

    const handleEdit = useCallback((announcement: AnnouncementInfoDto) => {
        setSelectedAnnouncement(announcement);
        setModalOpen(true);
    }, []);

    const handleDelete = useCallback((id: string) => {
        if (window.confirm('Are you sure you want to delete this announcement?')) {
            deleteAnnouncement(id);
        }
    }, [deleteAnnouncement]);

    const handleCloseModal = useCallback(() => {
        setModalOpen(false);
        setSelectedAnnouncement(undefined);
    }, []);

    if (isPending) {
        return (
            <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant='h5' component='h2'>
                    Announcements
                </Typography>
                <Button
                    variant='contained'
                    color='primary'
                    startIcon={<AddIcon />}
                    onClick={handleCreate}
                >
                    Create Announcement
                </Button>
            </Box>

            <TableContainer component={Paper} sx={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Title</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Pinned</TableCell>
                            <TableCell>Priority</TableCell>
                            <TableCell>Scheduled</TableCell>
                            <TableCell align='right'>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {!announcements?.length && (
                            <TableRow>
                                <TableCell colSpan={6} align='center'>
                                    No announcements found.
                                </TableCell>
                            </TableRow>
                        )}
                        {announcements?.map((announcement) => (
                            <AnnouncementRow
                                key={announcement.Id}
                                announcement={announcement}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                            />
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {modalOpen && (
                <AnnouncementModal
                    open={modalOpen}
                    onClose={handleCloseModal}
                    announcement={selectedAnnouncement}
                />
            )}
        </Box>
    );
};

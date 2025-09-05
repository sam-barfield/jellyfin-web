
import React, { useContext } from 'react';
import Page from 'components/Page';
import globalize from 'lib/globalize';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import PlayArrow from '@mui/icons-material/PlayArrow';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Avatar from '@mui/material/Avatar';
import Stop from '@mui/icons-material/Stop';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import IconButton from '@mui/material/IconButton';
import { ajax } from '../../../../utils/fetch';
import { ApiContext, useApi } from 'hooks/useApi';

export const Component = () => {
    const { api } = useApi();
    const apiContext = useContext(ApiContext);
    const url = api?.getUri('/Library/DubSubScan');

    const [dubSubScanRunning, setDubSubScanRunning] = React.useState(false);
    const [dubSubScanText, setDubSubScanText] = React.useState('Scans all libraries and updates dub/sub availability for Series/Seasons and Episodes.');

    const handleStartDubSubScan = () => {
        if (!dubSubScanRunning) {
            setDubSubScanRunning(true);
            ajax({
                url,
                type: 'POST',
                headers: {
                    Authorization: api?.authorizationHeader
                },
                query: {
                    userId: apiContext.user?.Id
                }
            }).then(async (response) => {
                if (response.ok) {
                    const blob = await response.blob();
                    const text = await blob.text();
                    setDubSubScanText(await text.replace(/"/g, ''));
                }
            }).catch(error => {
                console.log(error);
            }).finally(() => {
                setDubSubScanRunning(false);
            });
        }
    };

    return (
        <Page
            id='scheduledTasksPage'
            title={globalize.translate('TabScheduledTasks')}
            className='mainAnimatedPage type-interior'
        >
            <Box className='content-primary'>
                <Box className='readOnlyContent'>
                    <Typography variant='body1'>Tasks added for functionality of new features I&apos;ve implemented.</Typography>
                    <Stack spacing={3} mt={2}>
                        <Stack spacing={2}>
                            <Typography variant='h2'>Dubs and Subtitles</Typography>
                            <List sx={{ bgcolor: 'background.paper' }}>
                                <ListItem
                                    disablePadding
                                    secondaryAction={
                                        // eslint-disable-next-line react/jsx-no-bind
                                        <IconButton disabled={dubSubScanRunning} onClick={handleStartDubSubScan}>
                                            {dubSubScanRunning ? <Stop /> : <PlayArrow />}
                                        </IconButton>
                                    }
                                >
                                    <ul>
                                        <ListItem>
                                            <ListItemAvatar>
                                                <Avatar sx={{ bgcolor: 'primary.main' }}>
                                                    <AccessTimeIcon sx={{ color: '#fff' }} />
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={<Typography variant='h3'>Dub/Sub Scan</Typography>}
                                                secondary={<Typography sx={{ lineHeight: '1.2rem', color: 'text.secondary' }} variant='body1'>{dubSubScanText}</Typography>}
                                                disableTypography
                                            />
                                        </ListItem>
                                    </ul>
                                </ListItem>
                            </List>
                        </Stack>
                    </Stack>
                </Box>
            </Box>
        </Page>
    );
};

Component.displayName = 'TasksPage';

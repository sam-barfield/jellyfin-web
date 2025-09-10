
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useLocalizationOptions } from 'apps/dashboard/features/settings/api/useLocalizationOptions';
import Loading from 'components/loading/LoadingComponent';
import { QUERY_KEY, useConfiguration } from 'hooks/useConfiguration';
import globalize from 'lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import React from 'react';
import { Form } from 'react-router-dom';
import Button from '@mui/material/Button';
import { getConfigurationApi } from '@jellyfin/sdk/lib/utils/api/configuration-api';
import { queryClient } from 'utils/query/queryClient';
import type { ServerConfiguration } from '@jellyfin/sdk/lib/generated-client/models/server-configuration';

type ServerConfigurationWithDubbing = ServerConfiguration & {
    DubbingLanguageCodes: string[] | undefined;
};

/*
    Gone with manual form handling here because there seems to be some mojo I haven't
    figured out with the router handling submissions.

    Using the standard action method fails and no exception is thrown. Probably being
    caught by an error boundary and not logged.
*/
const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    // Build the payload manually
    const dubbing = formData.getAll('DubbingLanguageCodes')
        .map(v => v.toString().trim())
        .filter(Boolean);

    const api = ServerConnections.getCurrentApi();
    if (!api) throw new Error('No Api instance available');

    const { data: current } = await getConfigurationApi(api).getConfiguration();

    const nextConfig: ServerConfiguration & { DubbingLanguageCodes?: string[] } = {
        ...current,
        DubbingLanguageCodes: dubbing
    };

    try {
        await getConfigurationApi(api).updateConfiguration({ serverConfiguration: nextConfig });

        void queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
        console.error('Failed to save configuration', err);
    }
};

export const DubbingSettings = () => {
    const {
        data: config,
        isPending: isConfigPending
    } = useConfiguration();
    const {
        isPending: isLocalizationOptionsPending
    } = useLocalizationOptions();

    const configWithDubbing = config as ServerConfigurationWithDubbing;

    if (isConfigPending || isLocalizationOptionsPending) {
        return <Loading />;
    }

    return (
        <Box>
            <Form onSubmit={onSubmit}>
                <Stack spacing={3}>
                    <Typography variant='h1'>{globalize.translate('Settings')}</Typography>
                    <TextField
                        name='Dubbing LanguageCodes'
                        label={'Language Codes'}
                        helperText={'A list of language codes used to determine if audio or video streams are dubbed/subbed.'}
                        defaultValue={configWithDubbing.DubbingLanguageCodes}
                    />
                    <Button type='submit' size='large'>
                        {globalize.translate('Save')}
                    </Button>
                </Stack>
            </Form>
        </Box>
    );
};

DubbingSettings.displayName = 'DubbingSettings';

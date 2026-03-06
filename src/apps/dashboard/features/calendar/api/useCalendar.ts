import { useQuery, useMutation } from '@tanstack/react-query';
import { useApi } from 'hooks/useApi';
import { queryClient } from 'utils/query/queryClient';
import type { Api } from '@jellyfin/sdk/lib/api';

export enum ReleaseCalendarType {
    Movie = 0,
    Episode = 1
}

export interface ReleaseCalendarItem {
    Title: string;
    SortTitle: string;
    Overview: string;
    AirDateUtc: string;
    Type: ReleaseCalendarType;
    Year: number;
    SeriesTitle: string | null;
    SeasonNumber: number | null;
    EpisodeNumber: number | null;
    ImageUrl: string;
    Status: string;
    HasFile: boolean;
}

export interface ReleaseCalendarConfiguration {
    RadarrUrl: string;
    RadarrApiKey: string;
    SonarrUrl: string;
    SonarrApiKey: string;
    CacheTimeToLiveMinutes: number;
}

export const CALENDAR_QUERY_KEY = 'ReleaseCalendar';
export const CALENDAR_CONFIG_QUERY_KEY = 'ReleaseCalendarConfig';

const getHeaders = (api: Api) => ({
    headers: {
        Authorization: api.authorizationHeader
    }
});

export const useCalendar = (start: string, end: string, type?: ReleaseCalendarType) => {
    const { api } = useApi();

    return useQuery({
        queryKey: [CALENDAR_QUERY_KEY, start, end, type],
        queryFn: async () => {
            const url = api!.getUri('/ReleaseCalendar');
            const response = await api!.axiosInstance.get<ReleaseCalendarItem[]>(url, {
                ...getHeaders(api!),
                params: { start, end, type }
            });
            return response.data;
        },
        enabled: !!api && !!start && !!end
    });
};

export const useCalendarConfiguration = () => {
    const { api } = useApi();

    return useQuery({
        queryKey: [CALENDAR_CONFIG_QUERY_KEY],
        queryFn: async () => {
            const url = api!.getUri('/ReleaseCalendar/Configuration');
            const response = await api!.axiosInstance.get<ReleaseCalendarConfiguration>(url, getHeaders(api!));
            return response.data;
        },
        enabled: !!api
    });
};

export const useUpdateCalendarConfiguration = () => {
    const { api } = useApi();

    return useMutation({
        mutationFn: async (data: ReleaseCalendarConfiguration) => {
            const url = api!.getUri('/ReleaseCalendar/Configuration');
            await api!.axiosInstance.post(url, data, getHeaders(api!));
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: [CALENDAR_CONFIG_QUERY_KEY] });
            void queryClient.invalidateQueries({ queryKey: [CALENDAR_QUERY_KEY] });
        }
    });
};

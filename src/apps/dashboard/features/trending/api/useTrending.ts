import { useQuery, useMutation } from '@tanstack/react-query';
import { useApi } from 'hooks/useApi';
import { queryClient } from 'utils/query/queryClient';
import type { Api } from '@jellyfin/sdk/lib/api';

export interface TrendingItem {
    Rank: number; // The position in the Trakt trending list
    Title: string; // The title of the movie/show
    Overview: string; // The description/synopsis
    Year: number; // Release year
    TmdbId: string | null; // TMDB ID (if available)
    ImdbId: string | null; // IMDB ID (if available)
    JellyfinItemId: string | null; // The internal Guid format ID of the item in the Jellyfin database
}

export interface TrendingConfiguration {
    TraktClientId: string; // The Trakt API Client ID
    CacheTimeToLiveMinutes: number; // How long to cache the trending lists (default: 30)
}

export const TRENDING_MOVIES_QUERY_KEY = 'TrendingMovies';
export const TRENDING_SHOWS_QUERY_KEY = 'TrendingShows';
export const TRENDING_CONFIG_QUERY_KEY = 'TrendingConfig';

const getHeaders = (api: Api) => ({
    headers: {
        Authorization: api.authorizationHeader
    }
});

export const useTrendingMovies = () => {
    const { api } = useApi();

    return useQuery({
        queryKey: [TRENDING_MOVIES_QUERY_KEY],
        queryFn: async () => {
            const url = api!.getUri('/Trending/Movies');
            const response = await api!.axiosInstance.get<TrendingItem[]>(url, getHeaders(api!));
            return response.data;
        },
        enabled: !!api
    });
};

export const useTrendingShows = () => {
    const { api } = useApi();

    return useQuery({
        queryKey: [TRENDING_SHOWS_QUERY_KEY],
        queryFn: async () => {
            const url = api!.getUri('/Trending/Shows');
            const response = await api!.axiosInstance.get<TrendingItem[]>(url, getHeaders(api!));
            return response.data;
        },
        enabled: !!api
    });
};

export const useTrendingConfiguration = () => {
    const { api } = useApi();

    return useQuery({
        queryKey: [TRENDING_CONFIG_QUERY_KEY],
        queryFn: async () => {
            const url = api!.getUri('/Trending/Configuration');
            const response = await api!.axiosInstance.get<TrendingConfiguration>(url, getHeaders(api!));
            return response.data;
        },
        enabled: !!api
    });
};

export const useUpdateTrendingConfiguration = () => {
    const { api } = useApi();

    return useMutation({
        mutationFn: async (data: TrendingConfiguration) => {
            const url = api!.getUri('/Trending/Configuration');
            await api!.axiosInstance.post(url, data, getHeaders(api!));
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: [TRENDING_CONFIG_QUERY_KEY] });
            void queryClient.invalidateQueries({ queryKey: [TRENDING_MOVIES_QUERY_KEY] });
            void queryClient.invalidateQueries({ queryKey: [TRENDING_SHOWS_QUERY_KEY] });
        }
    });
};

import { useQuery, useMutation } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useApi } from 'hooks/useApi';
import { queryClient } from 'utils/query/queryClient';
import type { Api } from '@jellyfin/sdk/lib/api';
import type { ApiClient } from 'jellyfin-apiclient';

// ─── DTOs — PascalCase to match the Jellyfin .NET backend serialisation ───────

export interface NowPlayingFriendDto {
    ItemId: string;
    Name: string;
    SeriesId?: string;
    SeriesName?: string;
    PositionTicks?: number;
    RunTimeTicks?: number;
}

export interface FriendDto {
    UserId: string;
    Username: string;
    LastOnline?: string;
    IsOnline: boolean;
    NowPlaying?: NowPlayingFriendDto;
    HoursWatchedLastMonth: number;
    HasProfileImage: boolean;
}

export interface FriendRequestDto {
    RequestId: string;
    RequesterId: string;
    RequesterName: string;
    CreatedAt: string;
}

export interface FriendWidgetDto {
    Friends: FriendDto[];
    PendingRequestCount: number;
}

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const FRIENDS_WIDGET_QUERY_KEY = 'FriendsWidget';
export const FRIENDS_LIST_QUERY_KEY = 'FriendsList';
export const FRIENDS_REQUESTS_QUERY_KEY = 'FriendsRequests';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getHeaders = (api: Api) => ({
    headers: {
        Authorization: api.authorizationHeader
    }
});

// ─── Queries ──────────────────────────────────────────────────────────────────

export const useFriendsWidget = () => {
    const { api } = useApi();

    return useQuery({
        queryKey: [FRIENDS_WIDGET_QUERY_KEY],
        queryFn: async () => {
            const url = api!.getUri('/Friends/Widget');
            const response = await api!.axiosInstance.get<FriendWidgetDto>(url, getHeaders(api!));
            return response.data;
        },
        enabled: !!api,
        staleTime: 30_000,
        refetchOnWindowFocus: true
    });
};

/**
 * Extends useFriendsWidget with real-time WebSocket updates via FriendActivity push messages.
 * Subscribes on mount, unsubscribes on unmount, and replaces cache state on each push.
 */
export const useLiveFriendsWidget = () => {
    const { __legacyApiClient__ } = useApi();
    const query = useFriendsWidget();

    useEffect(() => {
        if (!__legacyApiClient__) return;

        let cancelled = false;
        let cleanup: (() => void) | undefined;

        void Promise.all([
            import('utils/events'),
            import('scripts/serverNotifications')
        ]).then(([{ default: Events }, { default: serverNotifications }]) => {
            if (cancelled) return;

            const onFriendActivity = (_evt: unknown, _apiClient: ApiClient, data: FriendWidgetDto) => {
                queryClient.setQueryData([FRIENDS_WIDGET_QUERY_KEY], data);
            };

            __legacyApiClient__.sendMessage('FriendActivityStart', '0,5000');
            Events.on(serverNotifications, 'FriendActivity', onFriendActivity);

            cleanup = () => {
                __legacyApiClient__.sendMessage('FriendActivityStop', '');
                Events.off(serverNotifications, 'FriendActivity', onFriendActivity);
            };
        });

        return () => {
            cancelled = true;
            cleanup?.();
        };
    }, [__legacyApiClient__]);

    return query;
};

/**
 * Extends useFriendsList with real-time WebSocket updates via FriendActivity push messages.
 * Subscribes on mount, unsubscribes on unmount, and replaces cache state on each push.
 */
export const useLiveFriendsList = () => {
    const { __legacyApiClient__ } = useApi();
    const query = useFriendsList();

    useEffect(() => {
        if (!__legacyApiClient__) return;

        let cancelled = false;
        let cleanup: (() => void) | undefined;

        void Promise.all([
            import('utils/events'),
            import('scripts/serverNotifications')
        ]).then(([{ default: Events }, { default: serverNotifications }]) => {
            if (cancelled) return;

            const onFriendActivity = (_evt: unknown, _apiClient: ApiClient, data: FriendWidgetDto) => {
                queryClient.setQueryData([FRIENDS_LIST_QUERY_KEY], data.Friends);
            };

            __legacyApiClient__.sendMessage('FriendActivityStart', '0,5000');
            Events.on(serverNotifications, 'FriendActivity', onFriendActivity);

            cleanup = () => {
                __legacyApiClient__.sendMessage('FriendActivityStop', '');
                Events.off(serverNotifications, 'FriendActivity', onFriendActivity);
            };
        });

        return () => {
            cancelled = true;
            cleanup?.();
        };
    }, [__legacyApiClient__]);

    return query;
};

export const useFriendsList = () => {
    const { api } = useApi();

    return useQuery({
        queryKey: [FRIENDS_LIST_QUERY_KEY],
        queryFn: async () => {
            const url = api!.getUri('/Friends');
            const response = await api!.axiosInstance.get<FriendDto[]>(url, getHeaders(api!));
            return response.data;
        },
        enabled: !!api,
        staleTime: 30_000
    });
};

export const useFriendRequests = () => {
    const { api } = useApi();

    return useQuery({
        queryKey: [FRIENDS_REQUESTS_QUERY_KEY],
        queryFn: async () => {
            const url = api!.getUri('/Friends/Requests');
            const response = await api!.axiosInstance.get<FriendRequestDto[]>(url, getHeaders(api!));
            return response.data;
        },
        enabled: !!api,
        staleTime: 15_000
    });
};

// ─── Mutations ────────────────────────────────────────────────────────────────

export const useSendFriendRequest = () => {
    const { api } = useApi();

    return useMutation({
        mutationFn: async (username: string) => {
            const url = api!.getUri(`/Friends/Requests/${encodeURIComponent(username)}`);
            const response = await api!.axiosInstance.post<FriendRequestDto>(url, {}, getHeaders(api!));
            return response.data;
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: [FRIENDS_WIDGET_QUERY_KEY] });
            void queryClient.invalidateQueries({ queryKey: [FRIENDS_LIST_QUERY_KEY] });
        }
    });
};

export const useAcceptFriendRequest = () => {
    const { api } = useApi();

    return useMutation({
        mutationFn: async (requestId: string) => {
            const url = api!.getUri(`/Friends/Requests/${encodeURIComponent(requestId)}/Accept`);
            await api!.axiosInstance.post(url, {}, getHeaders(api!));
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: [FRIENDS_WIDGET_QUERY_KEY] });
            void queryClient.invalidateQueries({ queryKey: [FRIENDS_LIST_QUERY_KEY] });
            void queryClient.invalidateQueries({ queryKey: [FRIENDS_REQUESTS_QUERY_KEY] });
        }
    });
};

export const useDeclineFriendRequest = () => {
    const { api } = useApi();

    return useMutation({
        mutationFn: async (requestId: string) => {
            const url = api!.getUri(`/Friends/Requests/${encodeURIComponent(requestId)}`);
            await api!.axiosInstance.delete(url, getHeaders(api!));
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: [FRIENDS_WIDGET_QUERY_KEY] });
            void queryClient.invalidateQueries({ queryKey: [FRIENDS_REQUESTS_QUERY_KEY] });
        }
    });
};

export const useRemoveFriend = () => {
    const { api } = useApi();

    return useMutation({
        mutationFn: async (friendId: string) => {
            const url = api!.getUri(`/Friends/${encodeURIComponent(friendId)}`);
            await api!.axiosInstance.delete(url, getHeaders(api!));
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: [FRIENDS_WIDGET_QUERY_KEY] });
            void queryClient.invalidateQueries({ queryKey: [FRIENDS_LIST_QUERY_KEY] });
        }
    });
};

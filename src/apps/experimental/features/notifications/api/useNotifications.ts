import { useQuery, useMutation } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useApi } from 'hooks/useApi';
import { queryClient } from 'utils/query/queryClient';
import type { Api } from '@jellyfin/sdk/lib/api';
import type { ApiClient } from 'jellyfin-apiclient';

// ─── DTOs — PascalCase to match the Jellyfin .NET backend serialisation ───────

export enum NotificationType {
    FriendRequestAccepted = 'FriendRequestAccepted',
    FriendRequestReceived = 'FriendRequestReceived',
    FriendRemoved = 'FriendRemoved'
}

export interface NotificationDto {
    Id: string;
    Type: NotificationType | string;
    IsRead: boolean;
    CreatedAt: string;
    Data: string; // JSON string
}

export interface UnreadNotificationsDto {
    UnreadCount: number;
    HasUnread: boolean;
}

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const NOTIFICATIONS_QUERY_KEY = 'Notifications';
export const NOTIFICATIONS_UNREAD_QUERY_KEY = 'NotificationsUnread';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getHeaders = (api: Api) => ({
    headers: {
        Authorization: api.authorizationHeader
    }
});

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Fetches all notifications for the current user.
 */
export const useNotifications = () => {
    const { api } = useApi();

    return useQuery({
        queryKey: [NOTIFICATIONS_QUERY_KEY],
        queryFn: async () => {
            const url = api!.getUri('/Notifications');
            const response = await api!.axiosInstance.get<NotificationDto[]>(url, getHeaders(api!));
            return response.data;
        },
        enabled: !!api,
        staleTime: 30_000
    });
};

/**
 * Lightweight poll for badge counts.
 */
export const useUnreadNotificationsCount = (refetchInterval?: number) => {
    const { api } = useApi();

    return useQuery({
        queryKey: [NOTIFICATIONS_UNREAD_QUERY_KEY],
        queryFn: async () => {
            const url = api!.getUri('/Notifications/Unread');
            const response = await api!.axiosInstance.get<UnreadNotificationsDto>(url, getHeaders(api!));
            return response.data;
        },
        enabled: !!api,
        staleTime: 30_000,
        refetchInterval: refetchInterval || false
    });
};

/**
 * Extends useNotifications with real-time WebSocket updates via UserNotification push messages.
 * Subscribes on mount, unsubscribes on unmount, and replaces cache state on each push.
 * Also updates the unread count cache based on the pushed data.
 */
export const useLiveNotifications = () => {
    const { __legacyApiClient__ } = useApi();
    const query = useNotifications();

    useEffect(() => {
        if (!__legacyApiClient__) return;

        let cancelled = false;
        let cleanup: (() => void) | undefined;

        const setupLiveUpdates = async () => {
            // Lazy load events and serverNotifications to avoid dependency problems
            const [{ default: Events }, { default: serverNotifications }] = await Promise.all([
                import('utils/events'),
                import('scripts/serverNotifications')
            ]);

            if (cancelled) return;

            const onUserNotification = (_evt: unknown, _apiClient: ApiClient, data: NotificationDto[]) => {
                // The server pushes the full current notification list
                queryClient.setQueryData([NOTIFICATIONS_QUERY_KEY], data);

                // Recalculate unread count for the badge
                const unreadCount = data.filter(n => !n.IsRead).length;
                queryClient.setQueryData([NOTIFICATIONS_UNREAD_QUERY_KEY], {
                    UnreadCount: unreadCount,
                    HasUnread: unreadCount > 0
                } as UnreadNotificationsDto);
            };

            // Subscribe to real-time notification updates
            __legacyApiClient__.sendMessage('UserNotificationStart', '0,0');
            Events.on(serverNotifications, 'UserNotification', onUserNotification);

            cleanup = () => {
                __legacyApiClient__.sendMessage('UserNotificationStop', '');
                Events.off(serverNotifications, 'UserNotification', onUserNotification);
            };
        };

        void setupLiveUpdates();

        return () => {
            cancelled = true;
            if (cleanup) cleanup();
        };
    }, [__legacyApiClient__]);

    return query;
};

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Marks a single notification as read.
 */
export const useMarkNotificationRead = () => {
    const { api } = useApi();

    return useMutation({
        mutationFn: async (id: string) => {
            const url = api!.getUri(`/Notifications/${id}/Read`);
            await api!.axiosInstance.post(url, {}, getHeaders(api!));
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_QUERY_KEY] });
            void queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_UNREAD_QUERY_KEY] });
        }
    });
};

/**
 * Marks all notifications for the current user as read.
 */
export const useMarkAllNotificationsRead = () => {
    const { api } = useApi();

    return useMutation({
        mutationFn: async () => {
            const url = api!.getUri('/Notifications/ReadAll');
            await api!.axiosInstance.post(url, {}, getHeaders(api!));
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_QUERY_KEY] });
            void queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_UNREAD_QUERY_KEY] });
        }
    });
};

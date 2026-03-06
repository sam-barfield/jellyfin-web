import { useQuery, useMutation } from '@tanstack/react-query';
import { useApi } from 'hooks/useApi';
import { queryClient } from 'utils/query/queryClient';
import type { Api } from '@jellyfin/sdk/lib/api';

export interface AnnouncementInfoDto {
    Id: string;
    Title: string;
    Text: string;
    IsPinned: boolean;
    Priority: number;
    DisplayOrder: number;
    DateCreatedUtc: string;
    StartDateUtc: string | null;
    EndDateUtc: string | null;
    IsActive: boolean;
    IsRead: boolean;
}

export interface AnnouncementUnreadStatus {
    UnreadCount: number;
    HasUnread: boolean;
}

export interface AnnouncementRequest {
    Title: string;
    Text: string;
    IsPinned: boolean;
    Priority: number;
    DisplayOrder: number;
    StartDateUtc: string | null;
    EndDateUtc: string | null;
    IsActive: boolean;
}

export const ANNOUNCEMENTS_QUERY_KEY = 'Announcements';
export const ANNOUNCEMENTS_UNREAD_QUERY_KEY = 'AnnouncementsUnread';
export const ANNOUNCEMENTS_ADMIN_QUERY_KEY = 'AnnouncementsAdmin';

const getHeaders = (api: Api) => ({
    headers: {
        Authorization: api.authorizationHeader
    }
});

export const useActiveAnnouncements = () => {
    const { api } = useApi();

    return useQuery({
        queryKey: [ANNOUNCEMENTS_QUERY_KEY],
        queryFn: async () => {
            const url = api!.getUri('/Announcements');
            const response = await api!.axiosInstance.get<AnnouncementInfoDto[]>(url, getHeaders(api!));
            return response.data;
        },
        enabled: !!api
    });
};

export const useUnreadAnnouncements = (refetchInterval?: number) => {
    const { api } = useApi();

    return useQuery({
        queryKey: [ANNOUNCEMENTS_UNREAD_QUERY_KEY],
        queryFn: async () => {
            const url = api!.getUri('/Announcements/Unread');
            const response = await api!.axiosInstance.get<AnnouncementUnreadStatus>(url, getHeaders(api!));
            return response.data;
        },
        enabled: !!api,
        refetchInterval: refetchInterval || false
    });
};

export const useAdminAnnouncements = () => {
    const { api } = useApi();

    return useQuery({
        queryKey: [ANNOUNCEMENTS_ADMIN_QUERY_KEY],
        queryFn: async () => {
            const url = api!.getUri('/Announcements/Admin');
            const response = await api!.axiosInstance.get<AnnouncementInfoDto[]>(url, getHeaders(api!));
            return response.data;
        },
        enabled: !!api
    });
};

export const useMarkAnnouncementRead = () => {
    const { api } = useApi();

    return useMutation({
        mutationFn: async (id: string) => {
            const url = api!.getUri(`/Announcements/${id}/Read`);
            await api!.axiosInstance.post(url, undefined, getHeaders(api!));
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: [ANNOUNCEMENTS_QUERY_KEY] });
            void queryClient.invalidateQueries({ queryKey: [ANNOUNCEMENTS_UNREAD_QUERY_KEY] });
        }
    });
};

export const useMarkAllAnnouncementsRead = () => {
    const { api } = useApi();

    return useMutation({
        mutationFn: async () => {
            const url = api!.getUri('/Announcements/ReadAll');
            await api!.axiosInstance.post(url, undefined, getHeaders(api!));
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: [ANNOUNCEMENTS_QUERY_KEY] });
            void queryClient.invalidateQueries({ queryKey: [ANNOUNCEMENTS_UNREAD_QUERY_KEY] });
        }
    });
};

export const useCreateAnnouncement = () => {
    const { api } = useApi();

    return useMutation({
        mutationFn: async (data: AnnouncementRequest) => {
            const url = api!.getUri('/Announcements');
            const response = await api!.axiosInstance.post<AnnouncementInfoDto>(url, data, getHeaders(api!));
            return response.data;
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: [ANNOUNCEMENTS_ADMIN_QUERY_KEY] });
            void queryClient.invalidateQueries({ queryKey: [ANNOUNCEMENTS_QUERY_KEY] });
            void queryClient.invalidateQueries({ queryKey: [ANNOUNCEMENTS_UNREAD_QUERY_KEY] });
        }
    });
};

export const useUpdateAnnouncement = () => {
    const { api } = useApi();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string, data: AnnouncementRequest }) => {
            const url = api!.getUri(`/Announcements/${id}`);
            const response = await api!.axiosInstance.post<AnnouncementInfoDto>(url, data, getHeaders(api!));
            return response.data;
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: [ANNOUNCEMENTS_ADMIN_QUERY_KEY] });
            void queryClient.invalidateQueries({ queryKey: [ANNOUNCEMENTS_QUERY_KEY] });
            void queryClient.invalidateQueries({ queryKey: [ANNOUNCEMENTS_UNREAD_QUERY_KEY] });
        }
    });
};

export const useDeleteAnnouncement = () => {
    const { api } = useApi();

    return useMutation({
        mutationFn: async (id: string) => {
            const url = api!.getUri(`/Announcements/${id}`);
            await api!.axiosInstance.delete(url, getHeaders(api!));
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: [ANNOUNCEMENTS_ADMIN_QUERY_KEY] });
            void queryClient.invalidateQueries({ queryKey: [ANNOUNCEMENTS_QUERY_KEY] });
            void queryClient.invalidateQueries({ queryKey: [ANNOUNCEMENTS_UNREAD_QUERY_KEY] });
        }
    });
};

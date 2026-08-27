import { useQuery } from '@tanstack/react-query';

import { ServerConnections } from 'lib/jellyfin-apiclient';
import { type ItemDto } from 'types/base/models/item-dto';

export type TrailerPreview =
    /** Plays inline via a plain <video> element */
    | { kind: 'video'; src: string }
    /** Rendered via <YoutubeTrailerPreview> (the official YT.Player API, not a raw iframe) */
    | { kind: 'youtube'; videoId: string };

/** Matches youtube.com/watch?v=, youtu.be/, and youtube(-nocookie).com/embed/ URLs */
const YOUTUBE_ID_REGEX = /(?:youtube(?:-nocookie)?\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/;

function getRemoteYoutubePreview(item: ItemDto): TrailerPreview | null {
    for (const trailer of item.RemoteTrailers ?? []) {
        const match = trailer.Url?.match(YOUTUBE_ID_REGEX);
        if (match) return { kind: 'youtube', videoId: match[1] };
    }
    return null;
}

/**
 * Resolves a Netflix-style hover-preview trailer for an item: prefers a local trailer file
 * (played inline via <video>), falling back to the first parsable YouTube URL in
 * `RemoteTrailers` (embedded via iframe). Returns `null` while nothing is resolvable yet,
 * including while the local-trailer lookup is still in flight (to avoid flashing the YouTube
 * fallback before the local trailer check finishes).
 *
 * `enabled` should stay `false` until the caller actually wants to start playback (e.g. after
 * a hover delay) so hovering many cards briefly doesn't fire a `getLocalTrailers` request each time.
 */
export function useItemTrailer(item: ItemDto, enabled: boolean): TrailerPreview | null {
    const hasLocalTrailer = Boolean(item.LocalTrailerCount) && Boolean(item.Id);

    const { data: localTrailers, isLoading: isLocalTrailerLoading } = useQuery({
        queryKey: ['LocalTrailers', item.Id],
        queryFn: async () => {
            const apiClient = ServerConnections.currentApiClient();
            if (!apiClient || !item.Id) return [];
            return apiClient.getLocalTrailers(apiClient.getCurrentUserId(), item.Id);
        },
        enabled: enabled && hasLocalTrailer,
        staleTime: 5 * 60 * 1000
    });

    if (!enabled) return null;
    if (hasLocalTrailer && isLocalTrailerLoading) return null;

    const localTrailerId = localTrailers?.[0]?.Id;
    const apiClient = ServerConnections.currentApiClient();
    if (localTrailerId && apiClient) {
        return {
            kind: 'video',
            src: apiClient.getUrl(`Videos/${localTrailerId}/stream`, {
                Static: true,
                mediaSourceId: localTrailerId,
                ApiKey: apiClient.accessToken()
            })
        };
    }

    return getRemoteYoutubePreview(item);
}

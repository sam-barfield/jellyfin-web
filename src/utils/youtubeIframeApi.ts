declare global {
    interface Window {
        YT?: {
            Player: new (elementOrId: HTMLElement | string, options: YoutubePlayerOptions) => YoutubePlayerInstance;
            PlayerState: { PLAYING: number; ENDED: number; PAUSED: number };
        };
        onYouTubeIframeAPIReady?: () => void;
    }
}

export interface YoutubePlayerInstance {
    mute: () => void;
    playVideo: () => void;
    destroy: () => void;
}

export interface YoutubePlayerOptions {
    videoId: string;
    playerVars: Record<string, number | string>;
    events: {
        onReady: (event: { target: YoutubePlayerInstance }) => void;
        onError?: (event: { data: number }) => void;
        onStateChange?: (event: { data: number }) => void;
    };
}

let apiLoadPromise: Promise<void> | null = null;

/**
 * Loads the official YouTube IFrame Player API (`https://www.youtube.com/iframe_api`), resolving
 * once `window.YT.Player` is available. Safe to call multiple times/from multiple consumers — the
 * script is only injected once, and chains onto (rather than clobbers) any pre-existing
 * `window.onYouTubeIframeAPIReady`. Shared by `plugins/youtubePlayer/plugin.js` (the full trailer
 * dialog) and the media-row hover popout's trailer preview, so there's one loading implementation
 * rather than two.
 *
 * Building embeds this way (rather than a hand-written `<iframe src>`) matters: the official API
 * embeds an `origin` parameter that YouTube uses to validate the request. A raw iframe instead
 * relies on the browser's `Referer` header, which this app strips app-wide via a `no-referrer`
 * <meta> tag in index.html — that combination is what causes YouTube's "error 153 (Video player
 * configuration error)".
 */
export function loadYoutubeIframeApi(): Promise<void> {
    if (window.YT?.Player) return Promise.resolve();

    if (!apiLoadPromise) {
        apiLoadPromise = new Promise(resolve => {
            const previousCallback = window.onYouTubeIframeAPIReady;
            window.onYouTubeIframeAPIReady = () => {
                previousCallback?.();
                resolve();
            };

            if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
                const tag = document.createElement('script');
                tag.src = 'https://www.youtube.com/iframe_api';
                document.head.appendChild(tag);
            }
        });
    }

    return apiLoadPromise;
}

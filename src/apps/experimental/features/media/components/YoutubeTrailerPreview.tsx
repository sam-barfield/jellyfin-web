import React, { useEffect, useRef } from 'react';
import Box from '@mui/material/Box';

import { loadYoutubeIframeApi, type YoutubePlayerInstance } from 'utils/youtubeIframeApi';

interface YoutubeTrailerPreviewProps {
    videoId: string;
    /** Called once the player actually reaches the PLAYING state */
    onPlaying?: () => void;
}

/**
 * Muted, looping, chrome-free YouTube trailer preview for the hover popout — built on the
 * official IFrame Player API (`YT.Player`) rather than a hand-written `<iframe src>` so it
 * doesn't hit YouTube's error 153 (see `utils/youtubeIframeApi.ts`). `controls: 0` in
 * `playerVars` hides all YouTube UI chrome, but YouTube still briefly shows its title/branding
 * overlay while the video is loading/cued — callers should keep this invisible (it plays fine
 * off-screen/behind other content) until `onPlaying` fires, then reveal it.
 */
export function YoutubeTrailerPreview({ videoId, onPlaying }: Readonly<YoutubeTrailerPreviewProps>) {
    const containerRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<YoutubePlayerInstance | null>(null);

    useEffect(() => {
        let cancelled = false;

        loadYoutubeIframeApi()
            .then(() => {
                if (cancelled || !containerRef.current || !window.YT) return;

                playerRef.current = new window.YT.Player(containerRef.current, {
                    videoId,
                    playerVars: {
                        autoplay: 1,
                        controls: 0,
                        mute: 1,
                        loop: 1,
                        playlist: videoId,
                        modestbranding: 1,
                        rel: 0,
                        playsinline: 1
                    },
                    events: {
                        onReady: event => {
                            event.target.mute();
                            event.target.playVideo();
                        },
                        onStateChange: event => {
                            if (window.YT && event.data === window.YT.PlayerState.PLAYING) {
                                onPlaying?.();
                            }
                        }
                    }
                });
            })
            .catch(() => {
                // Best-effort preview — leave the backdrop image showing on failure
            });

        return () => {
            cancelled = true;
            playerRef.current?.destroy();
            playerRef.current = null;
        };
        // onPlaying intentionally excluded below: it's a fresh closure every render and
        // shouldn't retrigger player creation, only videoId should.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [videoId]);

    return <Box ref={containerRef} sx={{ width: '100%', height: '100%' }} />;
}

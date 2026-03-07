import { useEffect, useState } from 'react';

/**
 * Samples the average color of a backdrop image via an off-screen canvas.
 * Returns an rgb(...) string or null while loading/error.
 */
export function useBackdropColor(imageUrl: string | undefined): string | null {
    const [color, setColor] = useState<string | null>(null);

    useEffect(() => {
        if (!imageUrl) {
            setColor(null);
            return;
        }

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = 40;
                canvas.height = 22;
                const ctx = canvas.getContext('2d');
                if (!ctx) return;
                ctx.drawImage(img, 0, 0, 40, 22);
                const data = ctx.getImageData(0, 0, 40, 22).data;
                let r = 0;
                let g = 0;
                let b = 0;
                let count = 0;
                for (let i = 0; i < data.length; i += 4) {
                    const pr = data[i];
                    const pg = data[i + 1];
                    const pb = data[i + 2];
                    const luminance = 0.299 * pr + 0.587 * pg + 0.114 * pb;
                    if (luminance > 30) {
                        r += pr;
                        g += pg;
                        b += pb;
                        count++;
                    }
                }
                if (count === 0) {
                    setColor(null);
                    return;
                }
                // Mute/darken the sampled color so it's a subtle tint
                const factor = 0.7;
                setColor(`${Math.round(r / count * factor)},${Math.round(g / count * factor)},${Math.round(b / count * factor)}`);
            } catch {
                setColor(null);
            }
        };
        img.onerror = () => setColor(null);
        img.src = imageUrl;
    }, [imageUrl]);

    return color;
}

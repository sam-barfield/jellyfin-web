import { useCallback, useRef, useState } from 'react';

import { type ItemDto } from 'types/base/models/item-dto';

/** Delay before the popout closes when the mouse leaves a card or the popout itself (ms) */
const POPOUT_CLOSE_DELAY = 350;

/**
 * Shared hover/popout orchestration for any grid or row of `MediaCard`s that wants the
 * Netflix-style hover popout (`MediaCardPopout`). Both `MediaRow` and `ItemsView` use this rather
 * than each keeping their own copy of this state, so a fix here (or a future one) reaches both.
 *
 * `MediaCardPopout` deliberately owns no close timer of its own — leaving its own DOM and leaving
 * a card both need to funnel through the exact same timer here, or a stale timer from one path
 * can fire after the other path already retargeted/reopened the popout. Callers MUST wire
 * `handleCardHoverEnd` to *both* each `MediaCard`'s `onHoverEnd` *and* `MediaCardPopout`'s
 * `onMouseLeavePopout` — passing it to only one re-introduces that bug.
 */
export function usePopoutHover() {
    const [popoutItem, setPopoutItem] = useState<ItemDto | null>(null);
    const [popoutRect, setPopoutRect] = useState<DOMRect | null>(null);
    const popoutCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const clearPopoutCloseTimer = useCallback(() => {
        if (popoutCloseTimerRef.current) {
            clearTimeout(popoutCloseTimerRef.current);
            popoutCloseTimerRef.current = null;
        }
    }, []);

    const handleCardHoverStart = useCallback((item: ItemDto, rect: DOMRect) => {
        clearPopoutCloseTimer();
        setPopoutItem(item);
        setPopoutRect(rect);
    }, [clearPopoutCloseTimer]);

    const handleCardHoverEnd = useCallback(() => {
        clearPopoutCloseTimer();
        popoutCloseTimerRef.current = setTimeout(() => {
            setPopoutItem(null);
            setPopoutRect(null);
        }, POPOUT_CLOSE_DELAY);
    }, [clearPopoutCloseTimer]);

    const handlePopoutClose = useCallback(() => {
        clearPopoutCloseTimer();
        setPopoutItem(null);
        setPopoutRect(null);
    }, [clearPopoutCloseTimer]);

    return {
        popoutItem,
        popoutRect,
        /** Pass to each MediaCard's `onHoverStart` */
        handleCardHoverStart,
        /** Pass to each MediaCard's `onHoverEnd` AND MediaCardPopout's `onMouseLeavePopout` */
        handleCardHoverEnd,
        /** Pass to MediaCardPopout's `onMouseEnterPopout` */
        clearPopoutCloseTimer,
        /** Pass to MediaCardPopout's `onClose` (immediate close, e.g. on scroll) */
        handlePopoutClose,
        /** Pass to each MediaCard's `quickReopen` */
        quickReopen: popoutItem !== null
    };
}

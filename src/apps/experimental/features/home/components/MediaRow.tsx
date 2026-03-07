import React, { useRef, useState, useCallback, useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { type ItemDto } from 'types/base/models/item-dto';
import { CardShape } from 'utils/card';
import Card from 'components/cardbuilder/Card/Card';
import ButtonBase from '@mui/material/ButtonBase';
import IconButton from '@mui/material/IconButton';
import ChevronLeft from '@mui/icons-material/ChevronLeft';
import ChevronRight from '@mui/icons-material/ChevronRight';
import FavoriteIcon from '@mui/icons-material/Favorite';
import CheckCircleOutline from '@mui/icons-material/CheckCircleOutline';
import { useToggleFavoriteMutation, useTogglePlayedMutation } from 'hooks/useFetchItems';
import { useQueryClient } from '@tanstack/react-query';
import { appRouter } from 'components/router/appRouter';

interface MediaRowProps {
    title: string;
    items: ItemDto[];
    shape?: 'portrait' | 'backdrop' | 'square';
    onViewAll?: () => void;
    cardOptions?: Record<string, unknown>;
}

/**
 * A single card with hover-reveal favourite + played buttons.
 */
export const MediaCard = ({ item, shape, cardOptions }: { item: ItemDto; shape: string; cardOptions?: Record<string, unknown> }) => {
    const queryClient = useQueryClient();
    const { mutateAsync: toggleFavorite } = useToggleFavoriteMutation();
    const { mutateAsync: togglePlayed } = useTogglePlayedMutation();

    const [optFavorite, setOptFavorite] = useState<boolean | null>(null);
    const [optPlayed, setOptPlayed] = useState<boolean | null>(null);

    const isFavorite = optFavorite ?? (item.UserData?.IsFavorite ?? false);
    const isPlayed = optPlayed ?? (item.UserData?.Played ?? false);

    const handleFavorite = useCallback(async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!item.Id) return;
        const next = !isFavorite;
        setOptFavorite(next);
        try {
            await toggleFavorite({ itemId: item.Id, isFavorite: !next });
            await queryClient.invalidateQueries({ queryKey: ['Items'] });
        } catch { setOptFavorite(null); }
    }, [isFavorite, item.Id, queryClient, toggleFavorite]);

    const handlePlayed = useCallback(async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!item.Id) return;
        const next = !isPlayed;
        setOptPlayed(next);
        try {
            await togglePlayed({ itemId: item.Id, isPlayed: !next });
            await queryClient.invalidateQueries({ queryKey: ['Items'] });
        } catch { setOptPlayed(null); }
    }, [isPlayed, item.Id, queryClient, togglePlayed]);

    const cardOpts = useMemo(() => ({
        ...cardOptions,
        shape: shape === 'backdrop' ? CardShape.Backdrop : CardShape.Portrait,
        showTitle: Boolean(cardOptions?.showTitle ?? true),
        showParentTitle: Boolean(cardOptions?.showParentTitle ?? true),
        showYear: Boolean(cardOptions?.showYear ?? true),
        centerText: Boolean(cardOptions?.centerText ?? true),
        overlayText: Boolean(cardOptions?.overlayText ?? false),
        overlayPlayButton: Boolean(cardOptions?.overlayPlayButton ?? true),
        enableMoreOptions: false,
        enablePlayedButton: false,
        enableRatingButton: false,
        allowBottomPadding: Boolean(cardOptions?.allowBottomPadding ?? true),
        cardLayout: Boolean(cardOptions?.cardLayout ?? true)
    } as Record<string, unknown>), [cardOptions, shape]);

    const aspectRatioMap: Record<string, string> = { backdrop: '16/9', portrait: '2/3', square: '1/1' };
    const dynamicAspectRatio = aspectRatioMap[shape] ?? '16/9';

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            appRouter.showItem(item);
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            const next = e.currentTarget.nextElementSibling as HTMLElement | null;
            next?.focus();
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            const prev = e.currentTarget.previousElementSibling as HTMLElement | null;
            prev?.focus();
        }
    }, [item]);

    return (
        <Box
            className='media-card-root'
            tabIndex={0}
            role='button'
            aria-label={item.Name ?? 'Media item'}
            onKeyDown={handleKeyDown}
            sx={{
                position: 'relative',
                flexShrink: 0,
                width: shape === 'backdrop' ? { xs: 200, md: 280 } : { xs: 120, md: 160 },
                transition: 'transform 0.3s ease',
                cursor: 'pointer',
                '&:hover': { transform: 'scale(1.05)', zIndex: 1 },
                // Show action buttons on hover OR keyboard focus
                '&:hover .card-actions': { opacity: 1, transform: 'translateY(0)' }
            }}
        >
            <Card item={item} cardOptions={cardOpts} />

            <Box
                className='card-actions'
                sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    boxSizing: 'border-box',
                    aspectRatio: dynamicAspectRatio,
                    pointerEvents: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    alignItems: 'flex-end',
                    p: 1,
                    gap: 0.5,
                    opacity: 0,
                    transform: 'translateY(4px)',
                    transition: 'opacity 0.2s ease, transform 0.2s ease',
                    zIndex: 5
                }}
            >
                <IconButton
                    size='small'
                    onClick={handleFavorite}
                    title={isFavorite ? 'Remove from favourites' : 'Add to favourites'}
                    sx={{
                        pointerEvents: 'auto',
                        color: isFavorite ? 'error.main' : 'white',
                        backgroundColor: 'rgba(0,0,0,0.65)',
                        backdropFilter: 'blur(6px)',
                        width: 30,
                        height: 30,
                        '&:hover': {
                            backgroundColor: 'rgba(0,0,0,0.85)',
                            color: 'error.light'
                        }
                    }}
                >
                    <FavoriteIcon sx={{ fontSize: 14 }} />
                </IconButton>
                <IconButton
                    size='small'
                    onClick={handlePlayed}
                    title={isPlayed ? 'Mark as unplayed' : 'Mark as played'}
                    sx={{
                        pointerEvents: 'auto',
                        color: isPlayed ? 'success.main' : 'white',
                        backgroundColor: 'rgba(0,0,0,0.65)',
                        backdropFilter: 'blur(6px)',
                        width: 30,
                        height: 30,
                        '&:hover': {
                            backgroundColor: 'rgba(0,0,0,0.85)',
                            color: 'success.light'
                        }
                    }}
                >
                    <CheckCircleOutline sx={{ fontSize: 14 }} />
                </IconButton>
            </Box>
        </Box>
    );
};

export function MediaRow({ title, items, shape = 'backdrop', onViewAll, cardOptions }: Readonly<MediaRowProps>) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);
    const startX = useRef(0);
    const scrollLeft = useRef(0);

    const [showArrows, setShowArrows] = useState(false);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const updateScrollState = useCallback(() => {
        if (!scrollRef.current) return;
        const { scrollLeft: currentScrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        setCanScrollLeft(currentScrollLeft > 0);
        setCanScrollRight(Math.ceil(currentScrollLeft + clientWidth) < scrollWidth);
    }, []);

    const handleArrowScroll = useCallback((direction: 'left' | 'right') => {
        if (!scrollRef.current) return;
        scrollRef.current.scrollBy({ left: direction === 'left' ? -600 : 600, behavior: 'smooth' });
    }, []);

    const onMouseDown: React.MouseEventHandler<HTMLDivElement> = React.useCallback((e) => {
        if (!scrollRef.current) return;
        isDragging.current = true;
        scrollRef.current.style.cursor = 'grabbing';
        startX.current = e.pageX - scrollRef.current.offsetLeft;
        scrollLeft.current = scrollRef.current.scrollLeft;
    }, []);

    const endDrag: React.MouseEventHandler<HTMLDivElement> = React.useCallback(() => {
        if (!scrollRef.current) return;
        isDragging.current = false;
        scrollRef.current.style.cursor = 'grab';
    }, []);

    const onMouseMove: React.MouseEventHandler<HTMLDivElement> = React.useCallback((e) => {
        if (!isDragging.current || !scrollRef.current) return;
        e.preventDefault();
        const x = e.pageX - scrollRef.current.offsetLeft;
        scrollRef.current.scrollLeft = scrollLeft.current - (x - startX.current) * 2;
    }, []);

    const handleMouseEnter = React.useCallback(() => setShowArrows(true), []);
    const handleMouseLeave = React.useCallback(() => setShowArrows(false), []);
    const handleScrollLeft = React.useCallback(() => handleArrowScroll('left'), [handleArrowScroll]);
    const handleScrollRight = React.useCallback(() => handleArrowScroll('right'), [handleArrowScroll]);

    // D-pad / arrow key handler: when a card inside the row is focused,
    // left/right arrow keys scroll the container to reveal more items
    const handleContainerKeyDown = React.useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'ArrowRight') {
            e.preventDefault();
            handleArrowScroll('right');
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            handleArrowScroll('left');
        }
    }, [handleArrowScroll]);

    if (!items || items.length === 0) return null;

    return (
        <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, px: 1 }}>
                <Typography variant='h6' sx={{ fontWeight: 'bold', fontSize: '1.2rem' }}>
                    {title}
                </Typography>
                {Boolean(onViewAll) && (
                    <ButtonBase
                        onClick={onViewAll}
                        sx={{ color: 'text.secondary', fontSize: '0.8rem', fontWeight: 'bold', '&:hover': { color: 'text.primary' } }}
                    >
                        VIEW ALL
                    </ButtonBase>
                )}
            </Box>

            <Box
                sx={{ position: 'relative' }}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                {/* Left Arrow */}
                {showArrows && canScrollLeft && (
                    <IconButton
                        onClick={handleScrollLeft}
                        sx={{
                            position: 'absolute', left: 0, top: '40%', transform: 'translateY(-50%)',
                            zIndex: 10, backgroundColor: 'rgba(0, 0, 0, 0.7)', color: 'white',
                            '&:hover': { backgroundColor: 'rgba(0, 164, 220, 0.9)' }, width: 48, height: 48
                        }}
                    >
                        <ChevronLeft fontSize='large' />
                    </IconButton>
                )}

                {/* Right Arrow */}
                {showArrows && canScrollRight && (
                    <IconButton
                        onClick={handleScrollRight}
                        sx={{
                            position: 'absolute', right: 0, top: '40%', transform: 'translateY(-50%)',
                            zIndex: 10, backgroundColor: 'rgba(0, 0, 0, 0.7)', color: 'white',
                            '&:hover': { backgroundColor: 'rgba(0, 164, 220, 0.9)' }, width: 48, height: 48
                        }}
                    >
                        <ChevronRight fontSize='large' />
                    </IconButton>
                )}

                <Box
                    ref={scrollRef}
                    onMouseDown={onMouseDown}
                    onMouseLeave={endDrag}
                    onMouseUp={endDrag}
                    onMouseMove={onMouseMove}
                    onScroll={updateScrollState}
                    onKeyDown={handleContainerKeyDown}
                    role='list'
                    aria-label={title}
                    sx={{
                        display: 'flex', gap: 2.5, overflowX: 'auto',
                        pb: 3, pt: 3, pl: 2, pr: 4,
                        cursor: 'grab',
                        scrollbarWidth: 'none',
                        '&::-webkit-scrollbar': { display: 'none' }
                    }}
                >
                    {items.map((item) => (
                        <MediaCard key={item.Id} item={item} shape={shape} cardOptions={cardOptions} />
                    ))}
                </Box>
            </Box>
        </Box>
    );
}

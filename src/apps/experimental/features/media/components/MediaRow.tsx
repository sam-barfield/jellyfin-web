import React, { useRef, useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ButtonBase from '@mui/material/ButtonBase';
import IconButton from '@mui/material/IconButton';
import ChevronLeft from '@mui/icons-material/ChevronLeft';
import ChevronRight from '@mui/icons-material/ChevronRight';

import { type ItemDto } from 'types/base/models/item-dto';
import { MediaCard } from './MediaCard';

interface MediaRowProps {
    title: string;
    items: ItemDto[];
    shape?: 'portrait' | 'backdrop' | 'square';
    onViewAll?: () => void;
    cardOptions?: Record<string, unknown>;
}

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
        <Box sx={{ mb: 1 }}>
            {Boolean(title || onViewAll) && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, px: 1 }}>
                    {Boolean(title) && (
                        <Typography variant='h6' sx={{ fontWeight: 'bold', fontSize: '1.2rem' }}>
                            {title}
                        </Typography>
                    )}
                    {Boolean(onViewAll) && (
                        <ButtonBase
                            onClick={onViewAll}
                            sx={{ color: 'text.secondary', fontSize: '0.8rem', fontWeight: 'bold', '&:hover': { color: 'text.primary' } }}
                        >
                            VIEW ALL
                        </ButtonBase>
                    )}
                </Box>
            )}

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
                        pb: 2, pt: 1, pl: 2, pr: 4,
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

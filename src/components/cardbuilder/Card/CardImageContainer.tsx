import React, { type FC } from 'react';
import Box from '@mui/material/Box';
import classNames from 'classnames';
import useIndicator from 'components/indicators/useIndicator';
import RefreshIndicator from 'elements/emby-itemrefreshindicator/RefreshIndicator';
import Media from '../../common/Media';
import CardInnerFooter from './CardInnerFooter';

import { ItemKind } from 'types/base/models/item-kind';
import type { ItemDto } from 'types/base/models/item-dto';
import type { CardOptions } from 'types/cardOptions';

interface CardImageContainerProps {
    item: ItemDto;
    cardOptions: CardOptions;
    coveredImage: boolean;
    overlayText: boolean | undefined;
    imgUrl: string | undefined;
    blurhash: string | undefined;
    forceName: boolean;
}

const CardImageContainer: FC<CardImageContainerProps> = ({
    item,
    cardOptions,
    coveredImage,
    overlayText,
    imgUrl,
    blurhash,
    forceName
}) => {
    const indicator = useIndicator(item);
    const cardImageClass = classNames(
        'cardImageContainer',
        { coveredImage: coveredImage },
        { 'coveredImage-contain': coveredImage && item.Type === ItemKind.TvChannel }
    );

    // Type-safe mapping for custom anime metadata attached by backend
    const tagItem = item as ItemDto & {
        IsAnime?: boolean;
        DubAvailable?: string;
        SubAvailable?: string;
        DubAvailability?: string;
        SubAvailability?: string;
    };

    return (
        <div className={cardImageClass}>
            {cardOptions.disableIndicators !== true && (
                <Box className='indicators'>
                    {indicator.getMediaSourceIndicator()}

                    <Box className='cardIndicators'>
                        {cardOptions.missingIndicator !== false
                            && indicator.getMissingIndicator()}

                        {indicator.getTimerIndicator()}
                        {indicator.getTypeIndicator()}

                        {cardOptions.showGroupCount ?
                            indicator.getChildCountIndicator() :
                            indicator.getPlayedIndicator()}

                        {(item.Type === ItemKind.CollectionFolder
                            || item.CollectionType) && (
                            <RefreshIndicator item={item} />
                        )}
                    </Box>
                </Box>
            )}

            {Boolean(tagItem.IsAnime && (tagItem.DubAvailable || tagItem.SubAvailable || tagItem.DubAvailability || tagItem.SubAvailability)) && (
                <Box sx={{
                    position: 'absolute',
                    bottom: '8px',
                    left: '8px',
                    display: 'flex',
                    gap: 0.5,
                    zIndex: 2,
                    pointerEvents: 'none'
                }}>
                    {(tagItem.DubAvailable === 'Full' || tagItem.DubAvailability === 'Full') && <Box sx={{ backgroundColor: 'rgba(43, 179, 66, 0.7)', backdropFilter: 'blur(8px)', color: '#fff', fontSize: '0.65rem', fontWeight: 800, px: 1, py: 0.25, borderRadius: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', letterSpacing: '0.05em' }}>DUB</Box>}
                    {(tagItem.DubAvailable === 'Partial' || tagItem.DubAvailability === 'Partial') && <Box sx={{ backgroundColor: 'rgba(201, 43, 64, 0.7)', backdropFilter: 'blur(8px)', color: '#fff', fontSize: '0.65rem', fontWeight: 800, px: 1, py: 0.25, borderRadius: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', letterSpacing: '0.05em' }}>DUB</Box>}
                    {(tagItem.SubAvailable === 'Full' || tagItem.SubAvailability === 'Full') && <Box sx={{ backgroundColor: 'rgba(153, 53, 192, 0.7)', backdropFilter: 'blur(8px)', color: '#fff', fontSize: '0.65rem', fontWeight: 800, px: 1, py: 0.25, borderRadius: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', letterSpacing: '0.05em' }}>SUB</Box>}
                    {(tagItem.SubAvailable === 'Partial' || tagItem.SubAvailability === 'Partial') && <Box sx={{ backgroundColor: 'rgba(201, 43, 64, 0.7)', backdropFilter: 'blur(8px)', color: '#fff', fontSize: '0.65rem', fontWeight: 800, px: 1, py: 0.25, borderRadius: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', letterSpacing: '0.05em' }}>SUB</Box>}
                </Box>
            )}

            <Media item={item} imgUrl={imgUrl} blurhash={blurhash} imageType={cardOptions.imageType} />

            {overlayText && (
                <CardInnerFooter
                    item={item}
                    cardOptions={cardOptions}
                    forceName={forceName}
                    overlayText={overlayText}
                    imgUrl={imgUrl}
                    progressBar={indicator.getProgressBar()}
                />
            )}

            {!overlayText && indicator.getProgressBar()}
        </div>
    );
};

export default CardImageContainer;

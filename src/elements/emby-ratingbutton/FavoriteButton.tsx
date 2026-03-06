import React, { type FC, useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import IconButton from '@mui/material/IconButton';
import FavoriteIcon from '@mui/icons-material/Favorite';

import classNames from 'classnames';
import { useToggleFavoriteMutation } from 'hooks/useFetchItems';
import globalize from 'lib/globalize';

interface FavoriteButtonProps {
    className?: string;
    isFavorite: boolean | undefined;
    itemId: string | null | undefined;
    queryKey?: string[]
}

const FavoriteButton: FC<FavoriteButtonProps> = ({
    className,
    isFavorite = false,
    itemId,
    queryKey
}) => {
    const queryClient = useQueryClient();
    const { mutateAsync: toggleFavoriteMutation } = useToggleFavoriteMutation();
    const [optimisticFavorite, setOptimisticFavorite] = useState<boolean | null>(null);

    const currentFavorite = optimisticFavorite !== null ? optimisticFavorite : isFavorite;

    const onClick = useCallback(async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        try {
            if (!itemId) {
                throw new Error('Item has no Id');
            }

            const newFavoriteState = !currentFavorite;
            setOptimisticFavorite(newFavoriteState);

            await toggleFavoriteMutation({
                itemId,
                isFavorite: !newFavoriteState // send the original state to the backend to toggle it
            },
            { onSuccess: async() => {
                await queryClient.invalidateQueries({
                    queryKey,
                    type: 'all',
                    refetchType: 'active'
                });
            } });
        } catch (err) {
            console.error(err);
            setOptimisticFavorite(null); // revert on error
        }
    }, [currentFavorite, itemId, queryClient, queryKey, toggleFavoriteMutation]);

    return (
        <IconButton
            data-action='none'
            title={currentFavorite ? globalize.translate('Favorite') : globalize.translate('AddToFavorites')}
            className={classNames(className, { 'ratingbutton-withrating': currentFavorite })}
            size='small'
            onClick={onClick}
        >
            <FavoriteIcon className={classNames({ 'ratingbutton-icon-withrating': currentFavorite })} />
        </IconButton>
    );
};

export default FavoriteButton;

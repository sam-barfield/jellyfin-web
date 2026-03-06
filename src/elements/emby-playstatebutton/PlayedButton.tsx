import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { useQueryClient } from '@tanstack/react-query';
import React, { type FC, useCallback, useState } from 'react';
import IconButton from '@mui/material/IconButton';
import CheckIcon from '@mui/icons-material/Check';
import classNames from 'classnames';

import globalize from 'lib/globalize';
import { useTogglePlayedMutation } from 'hooks/useFetchItems';

interface PlayedButtonProps {
    className?: string;
    isPlayed : boolean | undefined;
    itemId: string | null | undefined;
    itemType: string | null | undefined,
    queryKey?: string[]
}

const PlayedButton: FC<PlayedButtonProps> = ({
    className,
    isPlayed = false,
    itemId,
    itemType,
    queryKey
}) => {
    const queryClient = useQueryClient();
    const { mutateAsync: togglePlayedMutation } = useTogglePlayedMutation();
    const [optimisticPlayed, setOptimisticPlayed] = useState<boolean | null>(null);

    const currentPlayed = optimisticPlayed !== null ? optimisticPlayed : isPlayed;

    const getTitle = useCallback(() => {
        let buttonTitle;
        if (itemType !== BaseItemKind.AudioBook) {
            buttonTitle = currentPlayed ? globalize.translate('Watched') : globalize.translate('MarkPlayed');
        } else {
            buttonTitle = currentPlayed ? globalize.translate('Played') : globalize.translate('MarkPlayed');
        }

        return buttonTitle;
    }, [itemType, currentPlayed]);

    const onClick = useCallback(async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        try {
            if (!itemId) {
                throw new Error('Item has no Id');
            }

            const newPlayedState = !currentPlayed;
            setOptimisticPlayed(newPlayedState);

            await togglePlayedMutation({
                itemId,
                isPlayed: !newPlayedState // send original state to toggle
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
            setOptimisticPlayed(null);
        }
    }, [itemId, togglePlayedMutation, currentPlayed, queryClient, queryKey]);

    return (
        <IconButton
            data-action='none'
            title={getTitle()}
            className={classNames(className, { 'playstatebutton-played': currentPlayed })}
            size='small'
            onClick={onClick}
        >
            <CheckIcon className={classNames({ 'playstatebutton-icon-played': currentPlayed })} />
        </IconButton>
    );
};

export default PlayedButton;

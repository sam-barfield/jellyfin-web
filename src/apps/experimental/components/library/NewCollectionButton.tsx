import React, { FC, useCallback } from 'react';
import Add from '@mui/icons-material/Add';
import Button from '@mui/material/Button';

import globalize from 'lib/globalize';

interface NewCollectionButtonProps {
    isTextVisible: boolean
}

const NewCollectionButton: FC<NewCollectionButtonProps> = ({
    isTextVisible
}) => {
    const showCollectionEditor = useCallback(() => {
        import('components/collectionEditor/collectionEditor').then(
            ({ default: CollectionEditor }) => {
                const serverId = window.ApiClient.serverId();
                const collectionEditor = new CollectionEditor();
                collectionEditor.show({
                    items: [],
                    serverId: serverId
                }).catch(() => {
                    // closed collection editor
                });
            }).catch(err => {
            console.error('[NewCollection] failed to load collection editor', err);
        });
    }, []);

    return (
        <Button
            variant='outlined'
            startIcon={isTextVisible ? <Add /> : undefined}
            onClick={showCollectionEditor}
            sx={{
                background: 'rgba(255, 255, 255, 0.03)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: 'rgba(255, 255, 255, 0.6)',
                textTransform: 'none',
                borderRadius: '14px',
                px: isTextVisible ? { xs: 2.5, sm: 3 } : { xs: 1.5, sm: 2 },
                transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                '&:hover': {
                    background: 'rgba(255, 255, 255, 0.08)',
                    color: 'white',
                    borderColor: 'rgba(255, 255, 255, 0.15)',
                    transform: 'translateY(-1px)'
                },
                minWidth: isTextVisible ? undefined : '48px',
                height: isTextVisible ? undefined : '42px'
            }}
        >
            {isTextVisible ? (
                globalize.translate('NewCollection')
            ) : (
                <Add />
            )}
        </Button>
    );
};

export default NewCollectionButton;

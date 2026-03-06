import React, { type FC } from 'react';
import IconButton from '@mui/material/IconButton';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import globalize from 'lib/globalize';

interface MoreVertIconButtonProps {
    className?: string;
    iconClassName?: string;
    onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

const MoreVertIconButton: FC<MoreVertIconButtonProps> = ({ className, iconClassName, onClick }) => {
    return (
        <IconButton
            className={className}
            data-action='menu'
            title={globalize.translate('ButtonMore')}
            onClick={onClick}
        >
            <MoreVertIcon className={iconClassName} />
        </IconButton>
    );
};

export default MoreVertIconButton;

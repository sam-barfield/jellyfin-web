import React, { type FC } from 'react';
import {
    Link,
    URLSearchParamsInit,
    createSearchParams,
    useLocation,
    useSearchParams
} from 'react-router-dom';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import globalize from 'lib/globalize';

const getUrlParams = (searchParams: URLSearchParams) => {
    const parentId =
        searchParams.get('parentId') || searchParams.get('topParentId');
    const collectionType = searchParams.get('collectionType');
    const params: URLSearchParamsInit = {};

    if (parentId) {
        params.parentId = parentId;
    }

    if (collectionType) {
        params.collectionType = collectionType;
    }
    return params;
};

const navIconSx = {
    color: 'rgba(255,255,255,0.75)',
    padding: '8px',
    transition: 'color 0.2s ease, transform 0.2s ease',
    '&:hover': {
        color: '#00a4dc',
        transform: 'scale(1.15)',
        backgroundColor: 'transparent'
    },
    '&:focus-visible': { outline: '2px solid #00a4dc', outlineOffset: '2px', borderRadius: '8px' }
};

const SearchButton: FC = () => {
    const location = useLocation();
    const [searchParams] = useSearchParams();

    const isSearchPath = location.pathname === '/search';
    const search = createSearchParams(getUrlParams(searchParams));
    const createSearchLink =
        {
            pathname: '/search',
            search: search ? `?${search}` : undefined
        };

    return (
        <Tooltip title={globalize.translate('Search')}>
            <IconButton
                aria-label={globalize.translate('Search')}
                color='inherit'
                component={Link}
                disabled={isSearchPath}
                to={createSearchLink}
                disableRipple
                sx={navIconSx}
            >
                <SearchRoundedIcon />
            </IconButton>
        </Tooltip>
    );
};

export default SearchButton;

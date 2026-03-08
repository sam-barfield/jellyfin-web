import React, { FC, useCallback } from 'react';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import Stack from '@mui/material/Stack';
import type { Theme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';

import globalize from 'lib/globalize';
import * as userSettings from 'scripts/settings/userSettings';
import { LibraryViewSettings } from 'types/library';

interface PaginationProps {
    libraryViewSettings: LibraryViewSettings;
    setLibraryViewSettings: React.Dispatch<React.SetStateAction<LibraryViewSettings>>;
    totalRecordCount: number;
    isPlaceholderData: boolean
}

const Pagination: FC<PaginationProps> = ({
    libraryViewSettings,
    setLibraryViewSettings,
    totalRecordCount,
    isPlaceholderData
}) => {
    const isSmallScreen = useMediaQuery((t: Theme) => t.breakpoints.up('sm'));

    const limit = userSettings.libraryPageSize(undefined);
    const startIndex = libraryViewSettings.StartIndex ?? 0;
    const recordsStart = totalRecordCount ? startIndex + 1 : 0;
    const recordsEnd = limit ?
        Math.min(startIndex + limit, totalRecordCount) :
        totalRecordCount;
    const showControls = limit > 0 && limit < totalRecordCount;

    const onNextPageClick = useCallback(() => {
        const newIndex = startIndex + limit;
        setLibraryViewSettings((prevState) => ({
            ...prevState,
            StartIndex: newIndex
        }));
    }, [limit, setLibraryViewSettings, startIndex]);

    const onPreviousPageClick = useCallback(() => {
        const newIndex = Math.max(0, startIndex - limit);
        setLibraryViewSettings((prevState) => ({
            ...prevState,
            StartIndex: newIndex
        }));
    }, [limit, setLibraryViewSettings, startIndex]);

    return (
        <Stack
            direction='row'
            spacing={0.5}
            sx={{
                alignItems: 'center',
                flexGrow: {
                    xs: 1,
                    sm: 0
                },
                marginLeft: {
                    xs: 0,
                    sm: 1
                }
            }}
        >
            {!isSmallScreen && (
                <Button
                    color='inherit'
                    variant='outlined'
                    title={globalize.translate('Previous')}
                    disabled={!showControls || startIndex == 0 || isPlaceholderData}
                    onClick={onPreviousPageClick}
                    sx={{
                        minWidth: 48,
                        background: 'rgba(255, 255, 255, 0.03)',
                        backdropFilter: 'blur(12px)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        color: 'rgba(255, 255, 255, 0.9)',
                        borderRadius: 3,
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                            background: 'rgba(255, 255, 255, 0.08)',
                            transform: 'translateY(-2px) scale(1.02)',
                            borderColor: 'rgba(255, 255, 255, 0.15)'
                        },
                        '&.Mui-disabled': {
                            border: '1px solid rgba(255, 255, 255, 0.03)',
                            color: 'rgba(255, 255, 255, 0.2)'
                        }
                    }}
                >
                    <ArrowBackIcon />
                </Button>
            )}

            <Box
                sx={{
                    display: 'flex',
                    flexGrow: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 2
                }}
            >
                <Typography variant='body2' sx={{ color: 'text.primary', letterSpacing: 0.5 }}>
                    {globalize.translate(
                        'ListPaging',
                        recordsStart,
                        recordsEnd,
                        totalRecordCount
                    )}
                </Typography>
            </Box>

            {isSmallScreen && (
                <ButtonGroup
                    color='inherit'
                    variant='outlined'
                    sx={{
                        '& .MuiButton-root': {
                            background: 'rgba(255, 255, 255, 0.03)',
                            backdropFilter: 'blur(12px)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            color: 'rgba(255, 255, 255, 0.6)',
                            transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                            '&:hover': {
                                background: 'rgba(255, 255, 255, 0.08)',
                                color: 'white',
                                borderColor: 'rgba(255, 255, 255, 0.15)',
                                transform: 'translateY(-2px) scale(1.02)'
                            },
                            '&.Mui-disabled': {
                                borderColor: 'rgba(255, 255, 255, 0.03)',
                                color: 'rgba(255, 255, 255, 0.2)'
                            }
                        },
                        '& .MuiButtonGroup-firstButton': {
                            borderTopLeftRadius: 14,
                            borderBottomLeftRadius: 14
                        },
                        '& .MuiButtonGroup-lastButton': {
                            borderTopRightRadius: 14,
                            borderBottomRightRadius: 14
                        }
                    }}
                >
                    <Button
                        title={globalize.translate('Previous')}
                        disabled={!showControls || startIndex == 0 || isPlaceholderData}
                        onClick={onPreviousPageClick}
                        sx={{
                            ml: 1
                        }}
                    >
                        <ArrowBackIcon />
                    </Button>

                    <Button
                        title={globalize.translate('Next')}
                        disabled={!showControls || startIndex + limit >= totalRecordCount || isPlaceholderData }
                        onClick={onNextPageClick}
                    >
                        <ArrowForwardIcon />
                    </Button>
                </ButtonGroup>
            )}

            {!isSmallScreen && (
                <Button
                    color='inherit'
                    variant='outlined'
                    title={globalize.translate('Next')}
                    disabled={!showControls || startIndex + limit >= totalRecordCount || isPlaceholderData }
                    onClick={onNextPageClick}
                    sx={{
                        minWidth: 48,
                        background: 'rgba(255, 255, 255, 0.03)',
                        backdropFilter: 'blur(12px)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        color: 'rgba(255, 255, 255, 0.9)',
                        borderRadius: 3,
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                            background: 'rgba(255, 255, 255, 0.08)',
                            transform: 'translateY(-2px) scale(1.02)',
                            borderColor: 'rgba(255, 255, 255, 0.15)'
                        },
                        '&.Mui-disabled': {
                            border: '1px solid rgba(255, 255, 255, 0.03)',
                            color: 'rgba(255, 255, 255, 0.2)'
                        }
                    }}
                >
                    <ArrowForwardIcon />
                </Button>
            )}
        </Stack>
    );
};

export default Pagination;

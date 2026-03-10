import React, { useCallback } from 'react';
import Box from '@mui/material/Box';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { LibraryViewSettings } from 'types/library';

interface AlphabetPickerProps {
    libraryViewSettings: LibraryViewSettings;
    setLibraryViewSettings: React.Dispatch<
        React.SetStateAction<LibraryViewSettings>
    >;
}

const AlphabetPicker: React.FC<AlphabetPickerProps> = ({
    libraryViewSettings,
    setLibraryViewSettings
}) => {
    const handleValue = useCallback(
        (
            event: React.MouseEvent<HTMLElement>,
            newValue: string | null | undefined
        ) => {
            setLibraryViewSettings((prevState) => ({
                ...prevState,
                StartIndex: 0,
                Alphabet: newValue
            }));
        },
        [setLibraryViewSettings]
    );

    const letters = ['#', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

    return (
        <Box
            sx={{
                zIndex: 50,
                transition: 'all 0.3s ease',
                // Desktop Style (Floating on right)
                display: { xs: 'none', md: 'flex' },
                flexDirection: 'column',
                position: 'fixed',
                right: 16,
                top: '160px',
                background: 'rgba(20, 20, 25, 0.4)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '24px',
                padding: '4px',
                maxHeight: 'calc(100vh - 200px)',
                overflowY: 'auto',
                '&::-webkit-scrollbar': { display: 'none' },
                msOverflowStyle: 'none',
                scrollbarWidth: 'none',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                '&:hover': {
                    background: 'rgba(20, 20, 25, 0.6)',
                    borderColor: 'rgba(255, 255, 255, 0.15)'
                },
                // Mobile Style (Horizontal scroll)
                '@media (max-width: 899px)': {
                    display: 'flex',
                    flexDirection: 'row',
                    position: 'relative',
                    right: 'auto',
                    top: 'auto',
                    transform: 'none',
                    margin: '8px 8px',
                    borderRadius: '12px',
                    overflowX: 'auto',
                    overflowY: 'hidden',
                    whiteSpace: 'nowrap',
                    maxHeight: 'none',
                    background: 'rgba(255, 255, 255, 0.03)',
                    '&::-webkit-scrollbar': { display: 'none' }
                }
            }}
        >
            <ToggleButtonGroup
                orientation='vertical'
                value={libraryViewSettings.Alphabet}
                exclusive
                onChange={handleValue}
                sx={{
                    gap: 0.5,
                    '@media (max-width: 899px)': {
                        flexDirection: 'row',
                        padding: '4px',
                        '& .MuiToggleButton-root': {
                            flexShrink: 0
                        }
                    },
                    '& .MuiToggleButton-root': {
                        border: 'none',
                        color: 'rgba(255, 255, 255, 0.5)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        minWidth: 32,
                        height: 32,
                        borderRadius: '50% !important',
                        padding: 0,
                        transition: 'all 0.2s',
                        '&:hover': {
                            background: 'rgba(255, 255, 255, 0.1)',
                            color: 'white',
                            transform: 'scale(1.2)'
                        },
                        '&.Mui-selected': {
                            background: 'white !important',
                            color: 'black !important',
                            transform: 'scale(1.1)',
                            boxShadow: '0 4px 12px rgba(255, 255, 255, 0.3)'
                        }
                    }
                }}
            >
                {letters.map((l) => (
                    <ToggleButton
                        key={l}
                        value={l}
                    >
                        {l}
                    </ToggleButton>
                ))}
            </ToggleButtonGroup>
        </Box>
    );
};

export default AlphabetPicker;

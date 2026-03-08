import React, { FC, useCallback } from 'react';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';

import { LibraryViewSettings } from 'types/library';

const subStatusesOptions = [
    { label: 'Full Subtitles', value: 'Full' },
    { label: 'Partial Subtitles', value: 'Partial' },
    { label: 'Missing Subtitles', value: 'Missing' }
];

interface FiltersSubStatusesProps {
    libraryViewSettings: LibraryViewSettings;
    setLibraryViewSettings: React.Dispatch<React.SetStateAction<LibraryViewSettings>>;
}

const FiltersSubStatuses: FC<FiltersSubStatusesProps> = ({
    libraryViewSettings,
    setLibraryViewSettings
}) => {
    const onFiltersSubStatusesChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            event.preventDefault();
            const value = event.target.value;
            const existing = libraryViewSettings?.Filters?.subStatuses ?? [];

            const updated = existing.includes(value) ?
                existing.filter((f) => f !== value) :
                [...existing, value];

            setLibraryViewSettings((prevState: LibraryViewSettings) => ({
                ...prevState,
                StartIndex: 0,
                Filters: {
                    ...prevState.Filters,
                    subStatuses: updated.length ? updated : undefined
                }
            }));
        },
        [setLibraryViewSettings, libraryViewSettings?.Filters?.subStatuses]
    );

    return (
        <FormGroup>
            {subStatusesOptions.map((option) => (
                <FormControlLabel
                    key={option.value}
                    control={
                        <Checkbox
                            checked={
                                !!libraryViewSettings?.Filters?.subStatuses?.includes(option.value)
                            }
                            onChange={onFiltersSubStatusesChange}
                            value={option.value}
                        />
                    }
                    label={option.label}
                />
            ))}
        </FormGroup>
    );
};

export default FiltersSubStatuses;

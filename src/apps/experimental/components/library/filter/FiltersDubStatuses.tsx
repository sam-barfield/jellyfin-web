import React, { FC, useCallback } from 'react';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';

import { LibraryViewSettings } from 'types/library';

const dubStatusesOptions = [
    { label: 'Full Dubbing', value: 'Full' },
    { label: 'Partial Dubbing', value: 'Partial' },
    { label: 'Missing Dubbing', value: 'Missing' }
];

interface FiltersDubStatusesProps {
    libraryViewSettings: LibraryViewSettings;
    setLibraryViewSettings: React.Dispatch<React.SetStateAction<LibraryViewSettings>>;
}

const FiltersDubStatuses: FC<FiltersDubStatusesProps> = ({
    libraryViewSettings,
    setLibraryViewSettings
}) => {
    const onFiltersDubStatusesChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            event.preventDefault();
            const value = event.target.value;
            const existing = libraryViewSettings?.Filters?.dubStatuses ?? [];

            const updated = existing.includes(value) ?
                existing.filter((f) => f !== value) :
                [...existing, value];

            setLibraryViewSettings((prevState: LibraryViewSettings) => ({
                ...prevState,
                StartIndex: 0,
                Filters: {
                    ...prevState.Filters,
                    dubStatuses: updated.length ? updated : undefined
                }
            }));
        },
        [setLibraryViewSettings, libraryViewSettings?.Filters?.dubStatuses]
    );

    return (
        <FormGroup>
            {dubStatusesOptions.map((option) => (
                <FormControlLabel
                    key={option.value}
                    control={
                        <Checkbox
                            checked={
                                !!libraryViewSettings?.Filters?.dubStatuses?.includes(option.value)
                            }
                            onChange={onFiltersDubStatusesChange}
                            value={option.value}
                        />
                    }
                    label={option.label}
                />
            ))}
        </FormGroup>
    );
};

export default FiltersDubStatuses;

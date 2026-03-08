import { ImageType } from '@jellyfin/sdk/lib/generated-client/models/image-type';
import React, { FC, useCallback } from 'react';

import Check from '@mui/icons-material/Check';
import MoreVert from '@mui/icons-material/MoreVert';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import InputLabel from '@mui/material/InputLabel';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import Popover from '@mui/material/Popover';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Typography from '@mui/material/Typography';

import globalize from 'lib/globalize';
import { LibraryViewSettings, ViewMode } from 'types/library';
import { LibraryTab } from 'types/libraryTab';

const IMAGE_TYPE_EXCLUDED_VIEWS = [
    LibraryTab.Episodes,
    LibraryTab.Artists,
    LibraryTab.AlbumArtists,
    LibraryTab.Albums
];

const imageTypesOptions = [
    { label: 'Primary', value: ImageType.Primary },
    { label: 'Banner', value: ImageType.Banner },
    { label: 'Disc', value: ImageType.Disc },
    { label: 'Logo', value: ImageType.Logo },
    { label: 'Thumb', value: ImageType.Thumb }
];

interface ViewSettingsButtonProps {
    viewType: LibraryTab;
    libraryViewSettings: LibraryViewSettings;
    setLibraryViewSettings: React.Dispatch<
        React.SetStateAction<LibraryViewSettings>
    >;
}

const ViewSettingsButton: FC<ViewSettingsButtonProps> = ({
    viewType,
    libraryViewSettings,
    setLibraryViewSettings
}) => {
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const id = open ? 'selectview-popover' : undefined;

    const handleClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    }, []);

    const handleClose = useCallback(() => {
        setAnchorEl(null);
    }, []);

    const handleChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const name = event.target.name;

            setLibraryViewSettings((prevState) => ({
                ...prevState,
                [name]: event.target.checked
            }));
        },
        [setLibraryViewSettings]
    );

    const onGridViewClick = useCallback(() => {
        setLibraryViewSettings(prevState => ({
            ...prevState,
            ViewMode: ViewMode.GridView
        }));
    }, [ setLibraryViewSettings ]);

    const onListViewClick = useCallback(() => {
        setLibraryViewSettings(prevState => ({
            ...prevState,
            ViewMode: ViewMode.ListView
        }));
    }, [ setLibraryViewSettings ]);

    const onSelectChange = useCallback(
        (event: SelectChangeEvent) => {
            setLibraryViewSettings((prevState) => ({
                ...prevState,
                ImageType: event.target.value as ImageType
            }));
        },
        [setLibraryViewSettings]
    );

    const isGridView = libraryViewSettings.ViewMode === ViewMode.GridView;
    const isImageTypeVisible = !IMAGE_TYPE_EXCLUDED_VIEWS.includes(viewType);

    return (
        <>
            <Button
                title={globalize.translate('ViewSettings')}
                aria-describedby={id}
                onClick={handleClick}
                sx={{ borderRadius: '14px' }}
            >
                <MoreVert />
            </Button>
            <Popover
                id={id}
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'center'
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'center'
                }}
                sx={{
                    '& .MuiFormControl-root': { m: 1, width: 220 }
                }}
                slotProps={{
                    paper: {
                        sx: {
                            mt: 1.5,
                            background: 'rgba(20, 20, 25, 0.75)',
                            backdropFilter: 'blur(20px)',
                            WebkitBackdropFilter: 'blur(20px)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '16px',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                            overflow: 'hidden',
                            '& .MuiMenuItem-root': {
                                transition: 'all 0.2s',
                                borderRadius: '8px',
                                m: 0.75,
                                px: 2,
                                py: 1,
                                color: 'rgba(255, 255, 255, 0.8)',
                                '&:hover': {
                                    background: 'rgba(255, 255, 255, 0.08)',
                                    color: 'white'
                                }
                            },
                            '& .MuiFormControlLabel-root': {
                                transition: 'all 0.2s',
                                borderRadius: '8px',
                                m: 0.5,
                                px: 1.5,
                                py: 0.5,
                                color: 'rgba(255, 255, 255, 0.8)',
                                '&:hover': {
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    color: 'white'
                                }
                            }
                        }
                    }
                }}
            >
                <MenuList sx={{ p: 0.25 }}>

                    <MenuItem
                        onClick={onGridViewClick}
                    >
                        {isGridView && (
                            <ListItemIcon><Check /></ListItemIcon>
                        )}
                        <ListItemText inset={!isGridView}>
                            {globalize.translate('GridView')}
                        </ListItemText>
                    </MenuItem>
                    <MenuItem
                        onClick={onListViewClick}
                    >
                        {!isGridView && (
                            <ListItemIcon><Check /></ListItemIcon>
                        )}
                        <ListItemText inset={isGridView}>
                            {globalize.translate('ListView')}
                        </ListItemText>
                    </MenuItem>

                    {isGridView && (
                        <>
                            <Divider />
                            {isImageTypeVisible && (
                                <>
                                    <FormControl>
                                        <InputLabel>
                                            <Typography component='span'>
                                                {globalize.translate('LabelImageType')}
                                            </Typography>
                                        </InputLabel>
                                        <Select
                                            value={libraryViewSettings.ImageType}
                                            label={globalize.translate('LabelImageType')}
                                            onChange={onSelectChange}
                                            MenuProps={{
                                                slotProps: {
                                                    paper: {
                                                        sx: {
                                                            background: 'rgba(20, 20, 25, 0.75)',
                                                            backdropFilter: 'blur(20px)',
                                                            WebkitBackdropFilter: 'blur(20px)',
                                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                                            borderRadius: '8px',
                                                            mt: 0.5,
                                                            '& .MuiMenuItem-root': {
                                                                transition: 'all 0.2s',
                                                                borderRadius: '6px',
                                                                m: 0.5,
                                                                px: 2,
                                                                py: 1,
                                                                color: 'rgba(255, 255, 255, 0.8)',
                                                                '&:hover': {
                                                                    background: 'rgba(255, 255, 255, 0.08)',
                                                                    color: 'white'
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }}
                                        >
                                            {imageTypesOptions.map((imageType) => (
                                                <MenuItem
                                                    key={imageType.value}
                                                    value={imageType.value}
                                                >
                                                    <Typography component='span'>
                                                        {globalize.translate(imageType.label)}
                                                    </Typography>
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                    <Divider />
                                </>
                            )}
                            <FormControl>
                                <FormGroup>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={libraryViewSettings.ShowTitle}
                                                onChange={handleChange}
                                                name='ShowTitle'
                                            />
                                        }
                                        label={globalize.translate('ShowTitle')}
                                    />
                                    {isImageTypeVisible && (
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={libraryViewSettings.ShowYear}
                                                    onChange={handleChange}
                                                    name='ShowYear'
                                                />
                                            }
                                            label={globalize.translate('ShowYear')}
                                        />
                                    )}
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={libraryViewSettings.CardLayout}
                                                onChange={handleChange}
                                                name='CardLayout'
                                            />
                                        }
                                        label={globalize.translate('EnableCardLayout')}
                                    />
                                </FormGroup>
                            </FormControl>
                        </>
                    )}
                </MenuList>
            </Popover>
        </>
    );
};

export default ViewSettingsButton;

import { createContext, useContext } from 'react';

interface NavContextValue {
    isDrawerOpen: boolean;
    isDrawerAvailable: boolean;
    onToggleDrawer: () => void;
}

export const NavContext = createContext<NavContextValue>({
    isDrawerOpen: false,
    isDrawerAvailable: false,
    onToggleDrawer: () => { /* no-op */ }
});

export const useNavContext = () => useContext(NavContext);

import { useEffect } from 'react';

/**
 * Custom hook that listens for the Escape key and executes a callback.
 * 
 * @param onEscape Callback function to execute when Escape is pressed
 * @param active Whether the listener should be active (e.g. only when modal is open)
 */
export const useEscapeKey = (onEscape: () => void, active: boolean = true) => {
    useEffect(() => {
        if (!active) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onEscape();
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        // Cleanup listener on unmount or when active becomes false
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [onEscape, active]);
};

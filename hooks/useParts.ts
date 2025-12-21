import { useState, useCallback } from 'react';
import { ReplacementPart } from '../types';
import { fetchParts, upsertPart, deletePart } from '../services/dataService';

/**
 * Hook for managing replacement parts data and operations.
 */
export const useParts = (user: any) => {
    const [parts, setParts] = useState<ReplacementPart[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    /**
     * Loads replacement parts from the data service.
     */
    const loadParts = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const data = await fetchParts();
            setParts(data || []);
        } catch (error) {
            console.error('Error fetching parts:', error);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    /**
     * Saves a replacement part (creates or updates).
     */
    const savePart = async (part: Partial<ReplacementPart>) => {
        try {
            const saved = await upsertPart(part);
            setParts(prev => {
                const index = prev.findIndex(p => p.id === saved.id);
                if (index >= 0) {
                    const newParts = [...prev];
                    newParts[index] = saved;
                    return newParts;
                }
                return [saved, ...prev];
            });
            return saved;
        } catch (error) {
            console.error('Error saving part:', error);
            throw error;
        }
    };

    /**
     * Deletes a replacement part by ID.
     */
    const removePart = async (id: string) => {
        try {
            await deletePart(id);
            setParts(prev => prev.filter(p => p.id !== id));
        } catch (error) {
            console.error('Error deleting part:', error);
            throw error;
        }
    };

    return {
        parts,
        setParts,
        isLoading,
        loadParts,
        savePart,
        removePart
    };
};

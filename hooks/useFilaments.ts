import { useState, useCallback } from 'react';
import { Filament } from '../types';
import { fetchFilaments, upsertFilament, upsertFilaments, deleteFilament } from '../services/dataService';

/**
 * Hook for managing filament inventory data and operations.
 */
export const useFilaments = (user: any) => {
    const [filaments, setFilaments] = useState<Filament[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    /**
     * Loads filaments from the data service.
     */
    const loadFilaments = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const data = await fetchFilaments();
            setFilaments(data || []);
        } catch (error) {
            console.error('Error fetching filaments:', error);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    /**
     * Saves a filament (creates or updates).
     * Supports multi-spool addition when creating new filaments.
     */
    const saveFilament = async (filament: Partial<Filament>, quantity: number = 1) => {
        try {
            // If it's a new filament and quantity > 1, perform bulk insert
            if (!filament.id && quantity > 1) {
                const filamentsToAdd = Array(quantity).fill(filament);
                const savedItems = await upsertFilaments(filamentsToAdd);
                setFilaments(prev => [...savedItems, ...prev]);
                return savedItems[0]; // Return the first one as reference
            }

            // Normal single item save
            const saved = await upsertFilament(filament);
            setFilaments(prev => {
                const index = prev.findIndex(f => f.id === saved.id);
                if (index >= 0) {
                    const newFilaments = [...prev];
                    newFilaments[index] = saved;
                    return newFilaments;
                }
                return [saved, ...prev];
            });
            return saved;
        } catch (error) {
            console.error('Error saving filament:', error);
            throw error;
        }
    };

    /**
     * Deletes a filament by ID.
     */
    const removeFilament = async (id: string) => {
        try {
            await deleteFilament(id);
            setFilaments(prev => prev.filter(f => f.id !== id));
        } catch (error) {
            console.error('Error deleting filament:', error);
            throw error;
        }
    };

    /**
     * Duplicates an existing filament.
     */
    const duplicateFilament = async (filament: Filament) => {
        const { id, created_at, user_id, ...filamentData } = filament;
        return await saveFilament({
            ...filamentData,
            color: `${filamentData.color} (Cópia)`
        });
    };

    return {
        filaments,
        setFilaments,
        isLoading,
        loadFilaments,
        saveFilament,
        removeFilament,
        duplicateFilament
    };
};

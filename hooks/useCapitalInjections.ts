import { useState, useCallback } from 'react';
import { CapitalInjection } from '../types';
import { fetchCapitalInjections, upsertCapitalInjection, deleteCapitalInjection } from '../services/dataService';
import { User } from '@supabase/supabase-js';

export const useCapitalInjections = (user: User | null) => {
    const [injections, setInjections] = useState<CapitalInjection[]>([]);
    const [loading, setLoading] = useState(true);

    const loadInjections = useCallback(async () => {
        if (!user) return;
        try {
            const data = await fetchCapitalInjections();
            setInjections(data);
        } catch (error) {
            console.error('Error loading capital injections:', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    const saveInjection = async (injection: Partial<CapitalInjection>) => {
        try {
            const saved = await upsertCapitalInjection(injection);
            setInjections(prev => {
                const index = prev.findIndex(i => i.id === saved.id);
                if (index >= 0) {
                    const newInjections = [...prev];
                    newInjections[index] = saved;
                    return newInjections.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                }
                return [saved, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            });
            return saved;
        } catch (error) {
            console.error('Error saving injection:', error);
            throw error;
        }
    };

    const removeInjection = async (id: string) => {
        try {
            await deleteCapitalInjection(id);
            setInjections(prev => prev.filter(i => i.id !== id));
        } catch (error) {
            console.error('Error deleting injection:', error);
            throw error;
        }
    };

    return {
        injections,
        loading,
        loadInjections,
        saveInjection,
        removeInjection
    };
};

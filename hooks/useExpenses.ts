import { useState, useCallback } from 'react';
import { Expense } from '../types';
import { fetchExpenses, upsertExpense, deleteExpense, updateExpenseStatus } from '../services/dataService';

/**
 * Hook for managing business expenses data and operations.
 */
export const useExpenses = (user: any) => {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    /**
     * Loads expenses from the data service.
     */
    const loadExpenses = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const data = await fetchExpenses();

            // Auto-check for overdue expenses
            const today = new Date().toISOString().split('T')[0];
            const updatesToProcess: Expense[] = [];

            const processedData = data?.map(expense => {
                if (expense.status === 'Pendente' && expense.dueDate && expense.dueDate < today) {
                    const updated = { ...expense, status: 'Atrasado' };
                    updatesToProcess.push(updated as Expense);
                    return updated;
                }
                return expense;
            }) || [];

            setExpenses(processedData);

            // Persist status changes in background
            if (updatesToProcess.length > 0) {
                Promise.all(updatesToProcess.map(e => updateExpenseStatus(e.id, 'Atrasado')))
                    .catch(err => console.error('Failed to auto-update overdue expenses:', err));
            }

        } catch (error) {
            console.error('Error fetching expenses:', error);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    /**
     * Saves an expense (creates or updates).
     */
    const saveExpense = async (expense: Partial<Expense>) => {
        try {
            const saved = await upsertExpense(expense);
            setExpenses(prev => {
                const index = prev.findIndex(e => e.id === saved.id);
                if (index >= 0) {
                    const newExpenses = [...prev];
                    newExpenses[index] = saved;
                    return newExpenses;
                }
                return [saved, ...prev];
            });
            return saved;
        } catch (error) {
            console.error('Error saving expense:', error);
            throw error;
        }
    };

    /**
     * Deletes an expense by ID.
     */
    const removeExpense = async (id: string) => {
        try {
            await deleteExpense(id);
            setExpenses(prev => prev.filter(e => e.id !== id));
        } catch (error) {
            console.error('Error deleting expense:', error);
            throw error;
        }
    };

    /**
     * Updates the payment status of an existing expense.
     */
    const changeExpenseStatus = async (id: string, status: 'Pendente' | 'Pago' | 'Atrasado', paidDate?: string) => {
        try {
            const updated = await updateExpenseStatus(id, status, paidDate);
            setExpenses(prev => prev.map(e => e.id === id ? updated : e));
        } catch (error) {
            console.error('Error updating expense status:', error);
            throw error;
        }
    };

    return {
        expenses,
        setExpenses,
        isLoading,
        loadExpenses,
        saveExpense,
        removeExpense,
        changeExpenseStatus
    };
};

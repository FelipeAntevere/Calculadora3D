import { useMemo } from 'react';
import { Expense } from '../types';

export interface ExpenseMetrics {
    total: number;
    totalAmount: number;
    paid: Expense[];
    paidCount: number;
    paidAmount: number;
    pending: Expense[];
    pendingCount: number;
    pendingAmount: number;
    overdue: Expense[];
    overdueCount: number;
    overdueAmount: number;
}

/**
 * Custom hook to calculate expense metrics
 * Memoized to avoid recalculating on every render
 */
export const useExpenseMetrics = (expenses: Expense[]): ExpenseMetrics => {
    return useMemo(() => {
        const paid = expenses.filter(e => e.status === 'Pago');
        const pending = expenses.filter(e => e.status === 'Pendente');
        const overdue = expenses.filter(e => e.status === 'Atrasado');

        return {
            total: expenses.length,
            totalAmount: expenses.reduce((sum, e) => sum + (e.amount || 0), 0),
            paid,
            paidCount: paid.length,
            paidAmount: paid.reduce((sum, e) => sum + (e.amount || 0), 0),
            pending,
            pendingCount: pending.length,
            pendingAmount: pending.reduce((sum, e) => sum + (e.amount || 0), 0),
            overdue,
            overdueCount: overdue.length,
            overdueAmount: overdue.reduce((sum, e) => sum + (e.amount || 0), 0),
        };
    }, [expenses]);
};

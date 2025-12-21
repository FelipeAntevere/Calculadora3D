import React from 'react';
import { DollarSign, Check, Clock, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { ExpenseMetrics } from '../../hooks/useExpenseMetrics';

interface ExpenseSummaryCardsProps {
    metrics: ExpenseMetrics;
}

/**
 * Summary cards showing expense statistics
 * Displays total, paid, pending, and overdue expenses
 */
export const ExpenseSummaryCards: React.FC<ExpenseSummaryCardsProps> = ({ metrics }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total de Contas */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                    <div className="bg-sky-50 p-2.5 rounded-xl">
                        <DollarSign className="w-5 h-5 text-sky-500" />
                    </div>
                </div>
                <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total de Contas</p>
                    <p className="text-2xl font-black text-slate-900">{metrics.total}</p>
                    <p className="text-xs text-slate-500 font-medium">
                        {formatCurrency(metrics.totalAmount)}
                    </p>
                </div>
            </div>

            {/* Contas Pagas */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                    <div className="bg-emerald-50 p-2.5 rounded-xl">
                        <Check className="w-5 h-5 text-emerald-500" />
                    </div>
                </div>
                <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pagas</p>
                    <p className="text-2xl font-black text-emerald-600">{metrics.paidCount}</p>
                    <p className="text-xs text-emerald-600 font-medium">
                        {formatCurrency(metrics.paidAmount)}
                    </p>
                </div>
            </div>

            {/* Contas Pendentes */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                    <div className="bg-amber-50 p-2.5 rounded-xl">
                        <Clock className="w-5 h-5 text-amber-500" />
                    </div>
                </div>
                <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pendentes</p>
                    <p className="text-2xl font-black text-amber-600">{metrics.pendingCount}</p>
                    <p className="text-xs text-amber-600 font-medium">
                        {formatCurrency(metrics.pendingAmount)}
                    </p>
                </div>
            </div>

            {/* Contas Atrasadas */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                    <div className="bg-rose-50 p-2.5 rounded-xl">
                        <AlertCircle className="w-5 h-5 text-rose-500" />
                    </div>
                </div>
                <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Atrasadas</p>
                    <p className="text-2xl font-black text-rose-600">{metrics.overdueCount}</p>
                    <p className="text-xs text-rose-600 font-medium">
                        {formatCurrency(metrics.overdueAmount)}
                    </p>
                </div>
            </div>
        </div>
    );
};

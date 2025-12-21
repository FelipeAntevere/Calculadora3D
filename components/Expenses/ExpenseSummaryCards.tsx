import React from 'react';
import { DollarSign, Check, Clock, AlertCircle, Wallet, Calculator } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { ExpenseMetrics } from '../../hooks/useExpenseMetrics';

interface ExpenseSummaryCardsProps {
    metrics: ExpenseMetrics;
    cashBalance?: number;
}

/**
 * Summary cards showing expense statistics
 * Displays total, paid, pending, and overdue expenses
 */
export const ExpenseSummaryCards: React.FC<ExpenseSummaryCardsProps> = ({ metrics, cashBalance }) => {
    const projectedBalance = (cashBalance || 0) - (metrics.pendingAmount + metrics.overdueAmount);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
            {/* Saldo em Caixa */}
            {cashBalance !== undefined && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Saldo em Caixa</p>
                        <div className="bg-indigo-50 p-2 rounded-xl group-hover:scale-110 transition-transform">
                            <Wallet className="w-5 h-5 text-indigo-500" />
                        </div>
                    </div>
                    <div>
                        <p className={`text-2xl font-bold ${cashBalance < 0 ? 'text-rose-600' : 'text-[#0ea5e9]'}`}>
                            {formatCurrency(cashBalance)}
                        </p>
                        <p className="text-xs text-slate-400 font-medium mt-1">
                            Disponível
                        </p>
                    </div>
                </div>
            )}

            {/* Saldo Previsto */}
            {cashBalance !== undefined && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Saldo Previsto</p>
                        <div className="bg-blue-50 p-2 rounded-xl group-hover:scale-110 transition-transform">
                            <Calculator className="w-5 h-5 text-blue-500" />
                        </div>
                    </div>
                    <div>
                        <p className={`text-2xl font-bold ${projectedBalance >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
                            {formatCurrency(projectedBalance)}
                        </p>
                        <p className="text-xs text-slate-400 font-medium mt-1">
                            Pós Pagamentos
                        </p>
                    </div>
                </div>
            )}

            {/* Total de Contas */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total de Contas</p>
                    <div className="bg-sky-50 p-2 rounded-xl group-hover:scale-110 transition-transform">
                        <DollarSign className="w-5 h-5 text-sky-500" />
                    </div>
                </div>
                <div>
                    <p className="text-2xl font-bold text-slate-900">{formatCurrency(metrics.totalAmount)}</p>
                    <p className="text-xs text-slate-400 font-medium mt-1">
                        {metrics.total} {metrics.total === 1 ? 'conta' : 'contas'} registradas
                    </p>
                </div>
            </div>

            {/* Contas Pagas */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Pagas</p>
                    <div className="bg-emerald-50 p-2 rounded-xl group-hover:scale-110 transition-transform">
                        <Check className="w-5 h-5 text-emerald-500" />
                    </div>
                </div>
                <div>
                    <p className="text-2xl font-bold text-emerald-600">{formatCurrency(metrics.paidAmount)}</p>
                    <p className="text-xs text-slate-400 font-medium mt-1">
                        {metrics.paidCount} {metrics.paidCount === 1 ? 'conta' : 'contas'} pagas
                    </p>
                </div>
            </div>

            {/* Contas Pendentes */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Pendentes</p>
                    <div className="bg-amber-50 p-2 rounded-xl group-hover:scale-110 transition-transform">
                        <Clock className="w-5 h-5 text-amber-500" />
                    </div>
                </div>
                <div>
                    <p className="text-2xl font-bold text-amber-600">{formatCurrency(metrics.pendingAmount)}</p>
                    <p className="text-xs text-slate-400 font-medium mt-1">
                        {metrics.pendingCount} {metrics.pendingCount === 1 ? 'conta' : 'contas'} pendentes
                    </p>
                </div>
            </div>

            {/* Contas Atrasadas */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Atrasadas</p>
                    <div className="bg-rose-50 p-2 rounded-xl group-hover:scale-110 transition-transform">
                        <AlertCircle className="w-5 h-5 text-rose-500" />
                    </div>
                </div>
                <div>
                    <p className="text-2xl font-bold text-rose-600">{formatCurrency(metrics.overdueAmount)}</p>
                    <p className="text-xs text-slate-400 font-medium mt-1">
                        {metrics.overdueCount} {metrics.overdueCount === 1 ? 'conta' : 'contas'} atrasadas
                    </p>
                </div>
            </div>
        </div>
    );
};

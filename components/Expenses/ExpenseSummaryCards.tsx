import React from 'react';
import { DollarSign, Check, Clock, AlertCircle, Wallet, Calculator, TrendingUp, TrendingDown, Package, CreditCard, Wrench } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { ExpenseMetrics } from '../../hooks/useExpenseMetrics';

interface ExpenseSummaryCardsProps {
    metrics: ExpenseMetrics;
    cashFlow: {
        revenue: number;
        paidExpenses: number;
        inventoryCost: number;
        filamentCost: number;
        partsCost: number;
        maintenanceReserve: number;
        balance: number;
    };
}

/**
 * Summary cards showing expense statistics and Cash Flow
 */
export const ExpenseSummaryCards: React.FC<ExpenseSummaryCardsProps> = ({ metrics, cashFlow }) => {
    const projectedBalance = (cashFlow.balance || 0) - (metrics.pendingAmount + metrics.overdueAmount);

    return (
        <div className="space-y-4">
            {/* Main Cash Flow Rows */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* 1. Receita (Entradas) */}
                <div className="bg-white rounded-[20px] border border-slate-100 shadow-sm p-5 relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="absolute top-0 right-0 p-5 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                        <TrendingUp size={64} className="text-emerald-500" />
                    </div>
                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div>
                            <div className="flex items-center gap-2.5 mb-2">
                                <div className="p-1.5 bg-emerald-50 rounded-lg">
                                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                                </div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Entradas (Receita)</span>
                            </div>
                            <p className="text-3xl font-black text-slate-800 tracking-tight">{formatCurrency(cashFlow.revenue)}</p>
                            <p className="text-[10px] font-bold text-emerald-600 mt-1 flex items-center gap-1">
                                <Check size={10} strokeWidth={3} />
                                Vendas confirmadas
                            </p>
                        </div>

                        {/* Maintenance Reserve Box - Moved to Revenue */}
                        <div className="mt-3 bg-sky-50 border border-sky-100 rounded-xl p-2.5 relative group/reserve">
                            <div className="absolute top-1 right-2 text-[8px] font-black text-sky-300 uppercase tracking-widest">Reserva</div>
                            <div className="flex items-center gap-2">
                                <div className="p-1 bg-sky-100 rounded-md">
                                    <Wrench size={12} className="text-sky-500" />
                                </div>
                                <div className="flex flex-col">
                                    <p className="text-[9px] font-bold text-sky-400 leading-tight">Manutenção (Retido)</p>
                                    <p className="text-sm font-black text-sky-600 leading-none">{formatCurrency(cashFlow.maintenanceReserve)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Saídas (Despesas + Estoque) */}
                <div className="bg-white rounded-[20px] border border-slate-100 shadow-sm p-5 relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="absolute top-0 right-0 p-5 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                        <TrendingDown size={64} className="text-rose-500" />
                    </div>
                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div>
                            <div className="flex items-center gap-2.5 mb-2">
                                <div className="p-1.5 bg-rose-50 rounded-lg">
                                    <TrendingDown className="w-4 h-4 text-rose-500" />
                                </div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Saídas Totais</span>
                            </div>
                            <p className="text-3xl font-black text-slate-800 tracking-tight">{formatCurrency(cashFlow.paidExpenses + cashFlow.inventoryCost)}</p>
                        </div>

                        {/* Breakdown - Compacted & Close & Split */}
                        <div className="mt-3 space-y-1 border-t border-slate-50 pt-2.5">
                            <div className="flex items-center gap-2 text-[10px]">
                                <span className="text-slate-500 font-bold flex items-center gap-1 min-w-[70px]"><CreditCard size={10} /> Contas:</span>
                                <span className="font-bold text-rose-600">{formatCurrency(cashFlow.paidExpenses)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px]">
                                <span className="text-slate-500 font-bold flex items-center gap-1 min-w-[70px]"><Package size={10} /> Filamento:</span>
                                <span className="font-bold text-rose-600">{formatCurrency(cashFlow.filamentCost)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px]">
                                <span className="text-slate-500 font-bold flex items-center gap-1 min-w-[70px]"><Package size={10} /> Peças:</span>
                                <span className="font-bold text-rose-600">{formatCurrency(cashFlow.partsCost)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Saldo em Caixa */}
                <div className="bg-gradient-to-br from-[#0ea5e9] to-[#0284c7] rounded-[20px] shadow-lg shadow-sky-200 p-5 relative overflow-hidden text-white group hover:shadow-xl hover:shadow-sky-200/80 transition-all">
                    <div className="absolute top-0 right-0 p-5 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Wallet size={64} className="text-white" />
                    </div>
                    <div className="relative z-10 h-full flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-2.5 mb-2">
                                <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                                    <Wallet className="w-4 h-4 text-white" />
                                </div>
                                <span className="text-[10px] font-bold text-sky-100 uppercase tracking-widest">Saldo Livre</span>
                            </div>
                            <p className="text-3xl font-black text-white tracking-tight">{formatCurrency(cashFlow.balance - cashFlow.maintenanceReserve)}</p>
                            <div className="mt-1 flex flex-col gap-0.5">
                                <p className="text-[10px] font-medium text-sky-100 opacity-90">Descontando reserva</p>
                                <p className="text-[10px] font-medium text-sky-200">
                                    Total Físico: <span className="font-bold text-white">{formatCurrency(cashFlow.balance)}</span>
                                </p>
                            </div>
                        </div>
                        <div className="mt-3 pt-2.5 border-t border-white/20 flex flex-col gap-0.5">
                            <span className="text-[9px] font-bold text-sky-200 uppercase">Saldo Previsto (Pós Contas)</span>
                            <span className="text-base font-bold text-white">{formatCurrency(projectedBalance - cashFlow.maintenanceReserve)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Detailed Expense Status Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Total de Contas */}
                <div className="bg-slate-50/80 rounded-xl border border-slate-100 p-3 flex items-center gap-3">
                    <div className="bg-white p-2 rounded-lg border border-slate-100 shadow-sm text-slate-500">
                        <DollarSign size={16} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total</p>
                        <p className="text-sm font-black text-slate-700">{formatCurrency(metrics.totalAmount)}</p>
                        <p className="text-[9px] text-slate-400 font-bold">{metrics.total} conts.</p>
                    </div>
                </div>

                {/* Pagas */}
                <div className="bg-emerald-50/50 rounded-xl border border-emerald-100/50 p-3 flex items-center gap-3">
                    <div className="bg-white p-2 rounded-lg border border-emerald-100 shadow-sm text-emerald-500">
                        <Check size={16} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Pagas</p>
                        <p className="text-sm font-black text-emerald-600">{formatCurrency(metrics.paidAmount)}</p>
                        <p className="text-[9px] text-emerald-400 font-bold">{metrics.paidCount} pags.</p>
                    </div>
                </div>

                {/* Pendentes */}
                <div className="bg-amber-50/50 rounded-xl border border-amber-100/50 p-3 flex items-center gap-3">
                    <div className="bg-white p-2 rounded-lg border border-amber-100 shadow-sm text-amber-500">
                        <Clock size={16} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Pendentes</p>
                        <p className="text-sm font-black text-amber-600">{formatCurrency(metrics.pendingAmount)}</p>
                        <p className="text-[9px] text-amber-400 font-bold">{metrics.pendingCount} pends.</p>
                    </div>
                </div>

                {/* Atrasadas */}
                <div className="bg-rose-50/50 rounded-xl border border-rose-100/50 p-3 flex items-center gap-3">
                    <div className="bg-white p-2 rounded-lg border border-rose-100 shadow-sm text-rose-500">
                        <AlertCircle size={16} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">Atrasadas</p>
                        <p className="text-sm font-black text-rose-600">{formatCurrency(metrics.overdueAmount)}</p>
                        <p className="text-[9px] text-rose-400 font-bold">{metrics.overdueCount} atras.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

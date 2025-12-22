import React from 'react';
import { DollarSign, Check, Clock, AlertCircle, Wallet, Calculator, TrendingUp, TrendingDown, Package, CreditCard, Wrench } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { ExpenseMetrics } from '../../hooks/useExpenseMetrics';

interface ExpenseSummaryCardsProps {
    metrics: ExpenseMetrics;
    onOpenInjectionModal?: () => void;
    onOpenWithdrawalModal?: () => void;
    cashFlow: {
        revenue: number;
        paidExpenses: number;
        inventoryCost: number;
        filamentCost: number;
        partsCost: number;
        maintenanceReserve: number;
        balance: number;
        estimatedProfit?: number;
    };
}

/**
 * Summary cards showing expense statistics and Cash Flow
 */
export const ExpenseSummaryCards: React.FC<ExpenseSummaryCardsProps> = ({ metrics, onOpenInjectionModal, onOpenWithdrawalModal, cashFlow }) => {
    const projectedBalance = (cashFlow.balance || 0) - (metrics.pendingAmount + metrics.overdueAmount);

    // Dynamic styling
    const balanceColorClass = cashFlow.balance >= 0
        ? "bg-gradient-to-br from-[#0ea5e9] to-[#0284c7]"
        : "bg-gradient-to-br from-[#f43f5e] to-[#be123c]";

    const freeBalanceValue = cashFlow.balance - cashFlow.maintenanceReserve;
    const freeBalanceColorClass = freeBalanceValue >= 0
        ? "bg-gradient-to-br from-[#10b981] to-[#059669]"
        : "bg-gradient-to-br from-[#f43f5e] to-[#be123c]";

    return (
        <div className="space-y-4">
            {/* Main Cash Flow Rows */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                {/* 1. Receita (Entradas) */}
                <div className="lg:col-span-2 bg-white rounded-[20px] border border-slate-100 shadow-sm p-5 relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2.5 mb-2">
                                <div className="p-1.5 bg-emerald-50 rounded-lg">
                                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                                </div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Receita Total</span>
                            </div>

                            <div className="flex items-end justify-between gap-2">
                                <div>
                                    <p className="text-2xl font-black text-slate-800 tracking-tight truncate">{formatCurrency(cashFlow.revenue)}</p>
                                    <p className="text-[10px] font-bold text-emerald-600 mt-1 flex items-center gap-1">
                                        <Check size={10} strokeWidth={3} />
                                        Vendas confirmadas
                                    </p>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Lucro Estimado (New) */}
                <div className="lg:col-span-2 bg-white rounded-[20px] border border-slate-100 shadow-sm p-5 relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-1.5 bg-emerald-50 rounded-lg">
                                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lucro Estimado</span>
                                </div>
                                <div className="p-1 bg-emerald-50 rounded-full">
                                    <TrendingUp size={12} className="text-emerald-500" />
                                </div>
                            </div>

                            <div className="flex items-end justify-between gap-2">
                                <div>
                                    <p className="text-2xl font-black text-emerald-600 tracking-tight truncate">
                                        {formatCurrency(cashFlow.estimatedProfit || 0)}
                                    </p>
                                    <p className="text-[10px] font-bold text-slate-400 mt-1">
                                        Receita menos custos de produção
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Total de Despesas (Saídas) */}
                <div className="lg:col-span-2 bg-gradient-to-br from-[#f43f5e] to-[#be123c] rounded-[20px] shadow-md p-5 relative overflow-hidden text-white group hover:shadow-lg transition-all">
                    <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2.5 mb-2">
                                <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                                    <TrendingDown className="w-4 h-4 text-white" />
                                </div>
                                <span className="text-[10px] font-bold text-rose-100 uppercase tracking-widest">Total de Despesas</span>
                            </div>

                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <p className="text-2xl font-black text-white tracking-tight truncate">{formatCurrency(cashFlow.paidExpenses + cashFlow.inventoryCost)}</p>
                                </div>

                                {/* Breakdown - Compact on Right */}
                                <div className="flex flex-col items-end gap-1">
                                    <div className="flex items-center gap-2 text-[10px]">
                                        <span className="text-rose-100 font-bold">Contas:</span>
                                        <span className="font-bold text-white">{formatCurrency(cashFlow.paidExpenses)}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px]">
                                        <span className="text-rose-100 font-bold">Filamento:</span>
                                        <span className="font-bold text-white">{formatCurrency(cashFlow.filamentCost)}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px]">
                                        <span className="text-rose-100 font-bold">Peças:</span>
                                        <span className="font-bold text-white">{formatCurrency(cashFlow.partsCost)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4. Reserva de Manutenção */}
                <div className="lg:col-span-2 bg-gradient-to-br from-[#f59e0b] to-[#d97706] rounded-[20px] shadow-md p-5 relative overflow-hidden text-white group hover:shadow-lg transition-all">
                    <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2.5 mb-2">
                                <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                                    <Wrench className="w-4 h-4 text-white" />
                                </div>
                                <span className="text-[10px] font-bold text-amber-100 uppercase tracking-widest">Manutenção da Impressora</span>
                            </div>

                            <div className="flex items-end justify-between gap-2">
                                <div>
                                    <p className="text-2xl font-black text-white tracking-tight truncate">{formatCurrency(cashFlow.maintenanceReserve)}</p>
                                    <p className="text-[10px] font-bold text-amber-100 mt-1 flex items-center gap-1">
                                        (Retido)
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 5. Total em Conta - Adjusted Col Span */}
                <div className={`lg:col-span-2 ${balanceColorClass} rounded-[20px] shadow-md p-5 relative overflow-hidden text-white group hover:shadow-lg transition-all`}>
                    <div className="relative z-10 h-full flex flex-col justify-between gap-4">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                                        <Wallet className="w-4 h-4 text-white" />
                                    </div>
                                    <span className="text-[10px] font-bold text-white/90 uppercase tracking-widest">Saldo em Conta</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    {onOpenInjectionModal && (
                                        <button
                                            onClick={onOpenInjectionModal}
                                            className="p-1.5 flex items-center gap-1.5 bg-white/20 hover:bg-white/30 rounded-lg backdrop-blur-sm transition-all text-white text-[10px] font-bold uppercase tracking-wider"
                                            title="Adicionar Aporte"
                                        >
                                            <span>+ Aporte</span>
                                        </button>
                                    )}
                                    {onOpenWithdrawalModal && (
                                        <button
                                            onClick={onOpenWithdrawalModal}
                                            className="p-1.5 flex items-center gap-1.5 bg-white/10 hover:bg-white/20 rounded-lg backdrop-blur-sm transition-all text-white text-[10px] font-bold uppercase tracking-wider"
                                            title="Realizar Retirada"
                                        >
                                            <span>- Retirar</span>
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-end justify-between gap-2">
                                <div>
                                    <p className="text-2xl font-black text-white tracking-tight leading-none truncate">{formatCurrency(cashFlow.balance)}</p>
                                    <p className="text-[10px] font-medium text-white/90 mt-1.5 opacity-90">Bruto (com reservas)</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div >

                {/* 6. Saldo Livre - Adjusted Col Span */}
                <div className={`lg:col-span-2 ${freeBalanceColorClass} rounded-[20px] shadow-md p-5 relative overflow-hidden text-white group hover:shadow-lg transition-all`}>
                    <div className="relative z-10 h-full flex flex-col justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2.5 mb-2">
                                <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                                    <Wallet className="w-4 h-4 text-white" />
                                </div>
                                <span className="text-[10px] font-bold text-white/90 uppercase tracking-widest">Saldo Líquido</span>
                            </div>

                            <div className="flex items-end justify-between gap-2">
                                <div>
                                    <p className="text-2xl font-black text-white tracking-tight leading-none truncate">{formatCurrency(cashFlow.balance - cashFlow.maintenanceReserve)}</p>
                                    <p className="text-[10px] font-medium text-white/90 mt-1.5 opacity-90">Descontando reserva</p>
                                </div>

                                <div className="text-right">
                                    <div className="flex flex-col gap-0.5">
                                        <p className="text-[9px] font-bold text-white/80 uppercase">Previsto</p>
                                        <span className="text-sm font-bold text-white leading-none">{formatCurrency(projectedBalance - cashFlow.maintenanceReserve)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div >
            </div >

            {/* Detailed Expense Status Cards */}
            < div className="grid grid-cols-2 md:grid-cols-4 gap-4" >
                {/* Total de Contas */}
                < div className="bg-slate-50/80 rounded-xl border border-slate-100 p-3 flex items-center gap-3" >
                    <div className="bg-white p-2 rounded-lg border border-slate-100 shadow-sm text-slate-500">
                        <DollarSign size={16} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total</p>
                        <p className="text-sm font-black text-slate-700">{formatCurrency(metrics.totalAmount)}</p>
                        <p className="text-[9px] text-slate-400 font-bold">{metrics.total} conts.</p>
                    </div>
                </div >

                {/* Pagas */}
                < div className="bg-emerald-50/50 rounded-xl border border-emerald-100/50 p-3 flex items-center gap-3" >
                    <div className="bg-white p-2 rounded-lg border border-emerald-100 shadow-sm text-emerald-500">
                        <Check size={16} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Pagas</p>
                        <p className="text-sm font-black text-emerald-600">{formatCurrency(metrics.paidAmount)}</p>
                        <p className="text-[9px] text-emerald-400 font-bold">{metrics.paidCount} pags.</p>
                    </div>
                </div >

                {/* Pendentes */}
                < div className="bg-amber-50/50 rounded-xl border border-amber-100/50 p-3 flex items-center gap-3" >
                    <div className="bg-white p-2 rounded-lg border border-amber-100 shadow-sm text-amber-500">
                        <Clock size={16} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Pendentes</p>
                        <p className="text-sm font-black text-amber-600">{formatCurrency(metrics.pendingAmount)}</p>
                        <p className="text-[9px] text-amber-400 font-bold">{metrics.pendingCount} pends.</p>
                    </div>
                </div >

                {/* Atrasadas */}
                < div className="bg-rose-50/50 rounded-xl border border-rose-100/50 p-3 flex items-center gap-3" >
                    <div className="bg-white p-2 rounded-lg border border-rose-100 shadow-sm text-rose-500">
                        <AlertCircle size={16} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">Atrasadas</p>
                        <p className="text-sm font-black text-rose-600">{formatCurrency(metrics.overdueAmount)}</p>
                        <p className="text-[9px] text-rose-400 font-bold">{metrics.overdueCount} atras.</p>
                    </div>
                </div >
            </div >
        </div >
    );
};

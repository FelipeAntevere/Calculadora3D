import React, { useState } from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar
} from 'recharts';
import { Filter, Edit2, Trash2, Check, ChevronDown, Receipt, Calendar, CreditCard, PieChart, Plus, Minus, MapPin, FileText, Repeat, TrendingUp, ShoppingBag, Clock, Users, Database } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Expense } from '../../types';
import { MONTH_NAMES, BRAZILIAN_STATES } from '../../constants';
import { ExpenseSummaryCards } from './ExpenseSummaryCards';
import { PaymentDateModal } from '../Modals/PaymentDateModal';

interface ExpensesViewProps {
    expenseMetrics: any;
    expenseMonthFilter: number;
    setExpenseMonthFilter: (month: number) => void;
    expenseYearFilter: number;
    setExpenseYearFilter: (year: number) => void;
    filteredExpenses: Expense[];
    onNewExpense: () => void;
    handleEditExpense: (expense: Expense) => void;
    deleteExpenseHandler: (id: string) => void;
    updateExpenseStatusHandler: (id: string, status: 'Pendente' | 'Pago' | 'Atrasado', paidDate?: string) => void;
    onOpenRecurringModal: () => void;
    cashFlow: {
        revenue: number;
        paidExpenses: number;
        inventoryCost: number;
        filamentCost: number;
        partsCost: number;
        maintenanceReserve: number;
        balance: number;

        // New Metrics
        totalOrders?: number;
        averageTicket?: number;
        totalPrintingHours?: number;
        estMaterialCost?: number;
        estimatedProfit?: number;

        stateDistribution?: { state: string; orders: number; revenue: number; percentage: number }[];
        chartData?: { label: string; revenue: number; orders: number }[];
    };
    onOpenInjectionModal: () => void;
    onOpenWithdrawalModal: () => void;
    onOpenReportModal: () => void;
}

/**
 * Expenses Management View Component
 * Handles tracking of payable accounts, expenses categories, and payment statuses.
 */
export const ExpensesView: React.FC<ExpensesViewProps> = ({
    expenseMetrics,
    expenseMonthFilter,
    setExpenseMonthFilter,
    expenseYearFilter,
    setExpenseYearFilter,
    filteredExpenses,
    onNewExpense,
    handleEditExpense,
    deleteExpenseHandler,
    updateExpenseStatusHandler,
    onOpenRecurringModal,
    cashFlow,
    onOpenInjectionModal,
    onOpenWithdrawalModal,
    onOpenReportModal
}) => {
    const [openExpenseStatusDropdownId, setOpenExpenseStatusDropdownId] = useState<string | null>(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [expenseToPay, setExpenseToPay] = useState<Expense | null>(null);
    const currentYear = new Date().getFullYear();

    // Close dropdown when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            if (!target.closest('.expense-dropdown-wrapper')) {
                setOpenExpenseStatusDropdownId(null);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const handleStatusClick = (expense: Expense, status: 'Pendente' | 'Pago' | 'Atrasado') => {
        setOpenExpenseStatusDropdownId(null);
        if (status === 'Pago') {
            setExpenseToPay(expense);
            setIsPaymentModalOpen(true);
        } else {
            updateExpenseStatusHandler(expense.id, status);
        }
    };

    const handlePaymentConfirm = (date: string) => {
        if (expenseToPay) {
            updateExpenseStatusHandler(expenseToPay.id, 'Pago', date);
            setIsPaymentModalOpen(false);
            setExpenseToPay(null);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <h2 className="text-2xl font-bold text-[#0f172a] dark:text-white tracking-tight">Contas a Pagar</h2>
                    <p className="text-slate-500 text-sm font-medium">Gerencie suas despesas e fluxo de caixa.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={onOpenReportModal}
                        className="flex items-center gap-2 px-5 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm active:scale-95"
                    >
                        <FileText size={18} className="text-emerald-500" />
                        Relatório
                    </button>
                    <button
                        onClick={onOpenRecurringModal}
                        className="flex items-center gap-2 px-5 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm active:scale-95"
                    >
                        <Repeat size={18} className="text-sky-500" />
                        Despesas Fixas
                    </button>
                    <button
                        onClick={onNewExpense}
                        className="flex items-center gap-2 px-6 py-3 bg-[#0ea5e9] text-white rounded-2xl font-bold hover:bg-sky-400 transition-all shadow-lg shadow-sky-100 dark:shadow-sky-900/20 active:scale-95"
                    >
                        <Plus size={20} />
                        Nova Conta
                    </button>
                </div>
            </div>

            {/* Filters Relocated to Top */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col md:flex-row items-center gap-4">
                <div className="flex items-center gap-2 text-slate-400 mr-2">
                    <Filter className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-widest">Filtros</span>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <div className="flex flex-col gap-1">
                        <select
                            value={expenseMonthFilter}
                            onChange={(e) => setExpenseMonthFilter(Number(e.target.value))}
                            className="bg-[#f8fafc] dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 outline-none focus:ring-2 focus:ring-sky-500/20 shadow-sm transition-all"
                        >
                            <option value={-1}>Todos</option>
                            {MONTH_NAMES.map((name, i) => <option key={name} value={i}>{name}</option>)}
                        </select>
                    </div>

                    <div className="flex flex-col gap-1">
                        <select
                            value={expenseYearFilter}
                            onChange={(e) => setExpenseYearFilter(Number(e.target.value))}
                            className="bg-[#f8fafc] dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 outline-none focus:ring-2 focus:ring-sky-500/20 shadow-sm transition-all"
                        >
                            {[currentYear - 1, currentYear, currentYear + 1].map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                </div>

                <div className="md:ml-auto">
                    <div className="bg-sky-50 dark:bg-sky-900/20 px-4 py-2 rounded-xl border border-sky-100 dark:border-sky-900/50 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse"></span>
                        <span className="text-xs font-bold text-sky-600">{filteredExpenses.length} contas encontradas</span>
                    </div>
                </div>
            </div>

            <ExpenseSummaryCards
                metrics={expenseMetrics}
                cashFlow={cashFlow}
                onOpenInjectionModal={onOpenInjectionModal}
                onOpenWithdrawalModal={onOpenWithdrawalModal}
            />

            {/* New Production Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Total de Pedidos</h3>
                        <div className="bg-amber-50 dark:bg-amber-900/30 p-2 rounded-xl">
                            <ShoppingBag size={20} className="text-amber-500" />
                        </div>
                    </div>
                    <div>
                        <span className="text-2xl font-black text-sky-600 block mb-1">{cashFlow.totalOrders || 0}</span>
                        <p className="text-slate-400 text-xs font-medium">Pedidos confirmados</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Ticket Médio</h3>
                        <div className="bg-indigo-50 dark:bg-indigo-900/30 p-2 rounded-xl">
                            <Users size={20} className="text-indigo-500" />
                        </div>
                    </div>
                    <div>
                        <span className="text-2xl font-black text-slate-800 dark:text-white block mb-1">{formatCurrency(cashFlow.averageTicket || 0)}</span>
                        <p className="text-slate-400 text-xs font-medium">Valor médio por pedido</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Custo de Filamento</h3>
                        <div className="bg-rose-50 dark:bg-rose-900/30 p-2 rounded-xl">
                            <Database size={20} className="text-rose-500" />
                        </div>
                    </div>
                    <div>
                        <span className="text-2xl font-black text-rose-600 block mb-1">{formatCurrency(cashFlow.estMaterialCost || 0)}</span>
                        <p className="text-slate-400 text-xs font-medium">Gasto estimado com material</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Total de Horas</h3>
                        <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-xl">
                            <Clock size={20} className="text-slate-500" />
                        </div>
                    </div>
                    <div>
                        <span className="text-2xl font-black text-slate-800 dark:text-white block mb-1">{(cashFlow.totalPrintingHours || 0).toFixed(1)}h</span>
                        <p className="text-slate-400 text-xs font-medium">Tempo total de impressão</p>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-[32px] border border-slate-100 dark:border-slate-700 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50">
                <div className="">
                    <table className="w-full text-left border-collapse">
                        {/* Table Header */}
                        <thead>
                            <tr className="border-b border-slate-50 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-900/50">
                                <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome da Conta</th>
                                <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Vencimento</th>
                                <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Pagamento</th>
                                <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor</th>
                                <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {filteredExpenses.length > 0 ? (
                                filteredExpenses.map((expense) => (
                                    <tr key={expense.id} className="hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors group">
                                        <td className="px-6 py-4 text-center">
                                            <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">{expense.description}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-xs font-bold text-slate-500 font-mono">
                                                {formatDate(expense.dueDate)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                                {expense.paidDate ? formatDate(expense.paidDate) : '-'}
                                            </p>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <span className="text-sm font-semibold text-slate-900 dark:text-white">{formatCurrency(expense.amount)}</span>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <div className="relative inline-block expense-dropdown-wrapper">
                                                <button
                                                    onClick={() => setOpenExpenseStatusDropdownId(openExpenseStatusDropdownId === expense.id ? null : expense.id)}
                                                    className={`flex items-center justify-between gap-2 px-4 py-2 rounded-xl text-[11px] font-black transition-all min-w-[130px] hover:shadow-md active:scale-95 ${expense.status === 'Pago'
                                                        ? 'bg-emerald-50 text-emerald-600'
                                                        : expense.status === 'Atrasado'
                                                            ? 'bg-rose-50 text-rose-600'
                                                            : 'bg-amber-50 text-amber-600'
                                                        }`}
                                                >
                                                    {expense.status.toUpperCase()}
                                                    <ChevronDown size={14} className={`transition-transform duration-300 ${openExpenseStatusDropdownId === expense.id ? 'rotate-180' : ''}`} />
                                                </button>
                                                {openExpenseStatusDropdownId === expense.id && (
                                                    <div className="absolute left-0 mt-3 w-48 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[20px] shadow-2xl z-50 py-2 animate-in fade-in zoom-in-95 duration-200 origin-top-left">
                                                        {['Pendente', 'Pago', 'Atrasado'].map((status) => (
                                                            <button
                                                                key={status}
                                                                onClick={(e) => {
                                                                    // e.stopPropagation(); // No longer needed
                                                                    handleStatusClick(expense, status as any);
                                                                }}
                                                                className={`flex items-center justify-between w-full px-5 py-2.5 text-xs font-bold transition-all ${expense.status === status ? 'bg-sky-50 text-sky-600' : 'text-slate-600 hover:bg-slate-50'
                                                                    }`}
                                                            >
                                                                {status}
                                                                {expense.status === status && <Check size={14} />}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <div className="flex justify-center items-center gap-1 transition-opacity">
                                                <button onClick={() => handleEditExpense(expense)} className="p-2.5 text-slate-400 hover:text-sky-500 hover:bg-sky-50 rounded-xl transition-all shadow-sm active:scale-90"><Edit2 size={16} /></button>
                                                <button onClick={() => deleteExpenseHandler(expense.id)} className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all shadow-sm active:scale-90"><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="py-24 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-full text-slate-300 dark:text-slate-600">
                                                <Receipt size={40} />
                                            </div>
                                            <p className="text-slate-400 text-sm font-bold italic uppercase tracking-widest">Nenhuma conta cadastrada</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Charts Section (Added) */}
            {cashFlow.chartData && cashFlow.chartData.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                        <h3 className="text-base font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                            <TrendingUp size={18} className="text-sky-500" />
                            Faturamento {expenseMonthFilter === -1 ? 'Mensal' : 'Diário'}
                        </h3>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={cashFlow.chartData}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(value) => `R$${value}`} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                                        formatter={(value: number) => [formatCurrency(value), 'Receita']}
                                    />
                                    <Area type="monotone" dataKey="revenue" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                        <h3 className="text-base font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                            <ShoppingBag size={18} className="text-amber-500" />
                            Volume de Pedidos
                        </h3>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={cashFlow.chartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                    <Tooltip
                                        cursor={{ fill: '#f8fafc' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                                        formatter={(value: number) => [value, 'Pedidos']}
                                    />
                                    <Bar dataKey="orders" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {/* State Distribution Section (Added) */}
            {cashFlow.stateDistribution && cashFlow.stateDistribution.length > 0 && (
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden mt-6">
                    <h3 className="text-base font-bold text-slate-800 dark:text-white mb-6">Pedidos por Estado</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {cashFlow.stateDistribution.map((state: any) => {
                            const stateName = BRAZILIAN_STATES.find(s => s.sigla === state.state)?.nome || state.state;
                            return (
                                <div key={state.state} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-750/50 border border-slate-100 dark:border-slate-700">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-white dark:bg-slate-800 w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sky-600 shadow-sm border border-slate-100 dark:border-slate-700">
                                            <MapPin size={20} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{stateName}</p>
                                            <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
                                                <span>{state.orders} pedido(s)</span>
                                                <span>•</span>
                                                <span className="text-emerald-600 dark:text-emerald-400">{formatCurrency(state.revenue)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right pl-2">
                                        <p className="text-xs font-bold text-slate-800 dark:text-white">{state.percentage.toFixed(1)}%</p>
                                        <div className="w-16 h-1 w-full bg-slate-200 dark:bg-slate-700 rounded-full mt-1 overflow-hidden">
                                            <div className="bg-sky-500 h-full" style={{ width: `${state.percentage}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <PaymentDateModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                onConfirm={handlePaymentConfirm}
                expenseDescription={expenseToPay?.description}
            />
        </div>
    );
};

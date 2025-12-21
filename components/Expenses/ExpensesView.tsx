import React, { useState } from 'react';
import {
    Plus,
    Filter,
    ChevronDown,
    Check,
    Edit2,
    Trash2,
    Wallet,
    Receipt,
    Repeat
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Expense } from '../../types';
import { MONTH_NAMES } from '../../constants';
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
    companyCashBalance: number;
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
    companyCashBalance
}) => {
    const [openExpenseStatusDropdownId, setOpenExpenseStatusDropdownId] = useState<string | null>(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [expenseToPay, setExpenseToPay] = useState<Expense | null>(null);
    const currentYear = new Date().getFullYear();

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
                    <h2 className="text-2xl font-bold text-[#0f172a] tracking-tight">Contas a Pagar</h2>
                    <p className="text-slate-500 text-sm font-medium">Gerencie suas despesas e fluxo de caixa.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={onOpenRecurringModal}
                        className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                    >
                        <Repeat size={18} className="text-sky-500" />
                        Despesas Fixas
                    </button>
                    <button
                        onClick={onNewExpense}
                        className="flex items-center gap-2 px-6 py-3 bg-[#0ea5e9] text-white rounded-2xl font-bold hover:bg-sky-400 transition-all shadow-lg shadow-sky-100 active:scale-95"
                    >
                        <Plus size={20} />
                        Nova Conta
                    </button>
                </div>
            </div>

            <ExpenseSummaryCards metrics={expenseMetrics} cashBalance={companyCashBalance} />

            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-4">
                <div className="flex items-center gap-2 text-slate-400 mr-2">
                    <Filter className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-widest">Filtros</span>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter ml-1">Mês</label>
                        <select
                            value={expenseMonthFilter}
                            onChange={(e) => setExpenseMonthFilter(Number(e.target.value))}
                            className="bg-[#f8fafc] border border-slate-100 rounded-xl px-4 py-2 text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-sky-500/20 shadow-sm transition-all"
                        >
                            <option value={-1}>Todos</option>
                            {MONTH_NAMES.map((name, i) => <option key={name} value={i}>{name}</option>)}
                        </select>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter ml-1">Ano</label>
                        <select
                            value={expenseYearFilter}
                            onChange={(e) => setExpenseYearFilter(Number(e.target.value))}
                            className="bg-[#f8fafc] border border-slate-100 rounded-xl px-4 py-2 text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-sky-500/20 shadow-sm transition-all"
                        >
                            {[currentYear - 1, currentYear, currentYear + 1].map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                </div>

                <div className="md:ml-auto">
                    <div className="bg-sky-50 px-4 py-2 rounded-xl border border-sky-100 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse"></span>
                        <span className="text-xs font-bold text-sky-600">{filteredExpenses.length} contas encontradas</span>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-50 bg-slate-50/30">
                                <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome da Conta</th>
                                <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Vencimento</th>
                                <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Pagamento</th>
                                <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor</th>
                                <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredExpenses.length > 0 ? (
                                filteredExpenses.map((expense) => (
                                    <tr key={expense.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-6 py-4 text-center">
                                            <span className="font-bold text-slate-700 text-sm">{expense.description}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-xs font-bold text-slate-500 font-mono">
                                                {formatDate(expense.dueDate)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <p className="text-sm font-semibold text-slate-900 truncate">
                                                {expense.paidDate ? formatDate(expense.paidDate) : '-'}
                                            </p>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <span className="text-sm font-semibold text-slate-900">{formatCurrency(expense.amount)}</span>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
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
                                                    <div className="absolute left-0 mt-3 w-48 bg-white border border-slate-100 rounded-[20px] shadow-2xl z-50 py-2 animate-in fade-in zoom-in-95 duration-200 origin-top-left">
                                                        {['Pendente', 'Pago', 'Atrasado'].map((status) => (
                                                            <button
                                                                key={status}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
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
                                            <div className="bg-slate-50 p-4 rounded-full text-slate-300">
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

            <PaymentDateModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                onConfirm={handlePaymentConfirm}
                expenseDescription={expenseToPay?.description}
            />
        </div>
    );
};

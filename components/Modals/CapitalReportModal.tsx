import React, { useMemo, useState } from 'react';
import { X, TrendingUp, TrendingDown, Trash2, FileText, ArrowUpRight, ArrowDownLeft, Printer } from 'lucide-react';
import { CapitalInjection, Order, Expense } from '../../types';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { formatCurrency } from '../../utils/formatters';
import { generateAnnualReportPDF } from '../../utils/pdfGenerator';
import { MONTH_NAMES } from '../../constants';

interface CapitalReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    injections: CapitalInjection[];
    orders: Order[];
    expenses: Expense[];
    onDelete?: (id: string) => Promise<void>;
    totalBalance: number;
}

export const CapitalReportModal: React.FC<CapitalReportModalProps> = ({
    isOpen,
    onClose,
    injections,
    orders,
    expenses,
    onDelete,
    totalBalance
}) => {
    const currentYear = new Date().getFullYear();
    const [selectedYear, setSelectedYear] = useState(currentYear);

    // Close on ESC
    useEscapeKey(onClose, isOpen);

    const [reportData, setReportData] = useState<any>(null);

    const yearlyData = useMemo(() => {
        // Init monthly buckets
        const buckets = Array.from({ length: 12 }, () => ({
            revenue: 0,
            orders: 0,
            expenses: 0,
            injections: 0,
            withdrawals: 0
        }));

        // Process Orders (Revenue)
        orders.forEach(o => {
            if (!['Pedidos', 'Produção', 'Finalizado', 'Entregue'].includes(o.status)) return;
            const d = new Date(o.date);
            if (d.getFullYear() !== selectedYear) return;
            const month = d.getMonth();

            const total = (o.quantity || 1) * (o.unitValue || 0);
            buckets[month].revenue += total;
            buckets[month].orders += 1;
        });

        // Process Expenses (Paid)
        expenses.forEach(e => {
            if (e.status !== 'Pago') return;
            const d = new Date(e.paidDate || e.dueDate);
            if (d.getFullYear() !== selectedYear) return;
            const month = d.getMonth();

            buckets[month].expenses += e.amount;
        });

        // Process Injections
        injections.forEach(i => {
            const d = new Date(i.date);
            if (d.getFullYear() !== selectedYear) return;
            const month = d.getMonth();

            if (i.amount >= 0) {
                buckets[month].injections += i.amount;
            } else {
                buckets[month].withdrawals += Math.abs(i.amount);
            }
        });

        const totals = buckets.reduce((acc, curr) => ({
            revenue: acc.revenue + curr.revenue,
            orders: acc.orders + curr.orders,
            expenses: acc.expenses + curr.expenses,
            injections: acc.injections + curr.injections,
            withdrawals: acc.withdrawals + curr.withdrawals
        }), { revenue: 0, orders: 0, expenses: 0, injections: 0, withdrawals: 0 });

        const finalTotals = {
            ...totals,
            profit: totals.revenue - totals.expenses
        };

        return { buckets, totals: finalTotals };
    }, [orders, expenses, injections, selectedYear]);

    const handleDownloadPDF = async () => {
        await generateAnnualReportPDF({
            year: selectedYear,
            totals: yearlyData.totals,
            buckets: yearlyData.buckets
        });
    };

    if (!isOpen) return null;

    const handleDelete = async (id: string) => {
        if (window.confirm('Tem certeza que deseja excluir este registro?')) {
            if (onDelete) {
                await onDelete(id);
            }
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white dark:bg-slate-800 w-full max-w-4xl rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="bg-slate-800 dark:bg-slate-900 p-8 text-white flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md border border-white/10 shadow-inner">
                            <FileText className="w-8 h-8 text-sky-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-2xl tracking-tight">Balanço Anual</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <p className="text-slate-400 text-sm font-medium">Selecione o ano:</p>
                                <select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                                    className="bg-white/10 border border-white/10 rounded-lg text-white text-xs font-bold px-2 py-1 outline-none focus:ring-1 focus:ring-sky-400 dark:bg-slate-800"
                                >
                                    {[currentYear - 1, currentYear, currentYear + 1].map(y => <option key={y} value={y} className="text-slate-800 dark:text-slate-200">{y}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleDownloadPDF}
                            className="flex items-center gap-2 bg-sky-500 hover:bg-sky-400 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-sky-500/20 active:scale-95"
                        >
                            <Printer size={18} />
                            Baixar PDF
                        </button>
                        <button onClick={onClose} className="hover:bg-white/10 p-2.5 rounded-full transition-colors text-slate-400 hover:text-white">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50 dark:bg-slate-900/50">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Faturamento</h4>
                            <p className="text-2xl font-black text-slate-800 dark:text-white">{formatCurrency(yearlyData.totals.revenue)}</p>
                            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md mt-2 inline-block">
                                {yearlyData.totals.orders} Pedidos
                            </span>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Despesas Pagas</h4>
                            <p className="text-2xl font-black text-rose-600 dark:text-rose-400">{formatCurrency(yearlyData.totals.expenses)}</p>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Lucro Operacional</h4>
                            <p className={`text-2xl font-black ${yearlyData.totals.revenue - yearlyData.totals.expenses >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                {formatCurrency(yearlyData.totals.revenue - yearlyData.totals.expenses)}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1">(Receita - Despesas)</p>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Aportes Líquidos</h4>
                            <p className="text-2xl font-black text-sky-600 dark:text-sky-400">{formatCurrency(yearlyData.totals.injections - yearlyData.totals.withdrawals)}</p>
                            <div className="flex gap-2 text-[10px] mt-1">
                                <span className="text-emerald-600 dark:text-emerald-400">+{formatCurrency(yearlyData.totals.injections)}</span>
                                <span className="text-rose-600 dark:text-rose-400">-{formatCurrency(yearlyData.totals.withdrawals)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Detailed Table */}
                    <div className="bg-white dark:bg-slate-800 rounded-[24px] border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700">
                                <tr>
                                    <th className="px-6 py-4 font-bold text-slate-500 dark:text-slate-400">Mês</th>
                                    <th className="px-6 py-4 font-bold text-slate-500 dark:text-slate-400 text-right">Receita</th>
                                    <th className="px-6 py-4 font-bold text-slate-500 dark:text-slate-400 text-center">Pedidos</th>
                                    <th className="px-6 py-4 font-bold text-slate-500 dark:text-slate-400 text-right">Despesas</th>
                                    <th className="px-6 py-4 font-bold text-slate-500 dark:text-slate-400 text-right">Lucro</th>
                                    <th className="px-6 py-4 font-bold text-slate-500 dark:text-slate-400 text-right">Aportes</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                                {yearlyData.buckets.map((b, i) => (
                                    <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200">{MONTH_NAMES[i]}</td>
                                        <td className="px-6 py-4 text-right font-medium text-slate-600 dark:text-slate-300">{formatCurrency(b.revenue)}</td>
                                        <td className="px-6 py-4 text-center font-medium text-slate-500 dark:text-slate-400">{b.orders}</td>
                                        <td className="px-6 py-4 text-right font-medium text-rose-600 dark:text-rose-400">{formatCurrency(b.expenses)}</td>
                                        <td className={`px-6 py-4 text-right font-bold ${b.revenue - b.expenses >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                            {formatCurrency(b.revenue - b.expenses)}
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-sky-600 dark:text-sky-400">
                                            {formatCurrency(b.injections - b.withdrawals)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-slate-50/80 dark:bg-slate-800/80 font-bold text-slate-800 dark:text-white">
                                <tr>
                                    <td className="px-6 py-4">TOTAL</td>
                                    <td className="px-6 py-4 text-right">{formatCurrency(yearlyData.totals.revenue)}</td>
                                    <td className="px-6 py-4 text-center">{yearlyData.totals.orders}</td>
                                    <td className="px-6 py-4 text-right text-rose-600 dark:text-rose-400">{formatCurrency(yearlyData.totals.expenses)}</td>
                                    <td className="px-6 py-4 text-right text-emerald-600 dark:text-emerald-400">{formatCurrency(yearlyData.totals.revenue - yearlyData.totals.expenses)}</td>
                                    <td className="px-6 py-4 text-right text-sky-600 dark:text-sky-400">{formatCurrency(yearlyData.totals.injections - yearlyData.totals.withdrawals)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>


                    {/* Capital Injections List (Original Functionality - Compact) */}
                    <div className="mt-8">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            Histórico de Capital (Ano Selecionado)
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {injections
                                .filter(i => new Date(i.date).getFullYear() === selectedYear)
                                .map((item) => (
                                    <div key={item.id} className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${item.amount >= 0 ? 'bg-emerald-50 dark:bg-emerald-900/30' : 'bg-rose-50 dark:bg-rose-900/30'}`}>
                                                {item.amount >= 0 ? <ArrowUpRight size={14} className="text-emerald-500 dark:text-emerald-400" /> : <ArrowDownLeft size={14} className="text-rose-500 dark:text-rose-400" />}
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-slate-700 dark:text-slate-300">{item.description}</p>
                                                <p className="text-[10px] text-slate-400">{new Date(item.date).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`font-bold text-sm ${item.amount >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                                {formatCurrency(item.amount)}
                                            </span>
                                            {onDelete && (
                                                <button onClick={() => handleDelete(item.id)} className="text-slate-300 hover:text-rose-500 dark:text-slate-600 dark:hover:text-rose-400">
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            {injections.filter(i => new Date(i.date).getFullYear() === selectedYear).length === 0 && (
                                <p className="text-sm text-slate-400 italic">Nenhum aporte/retirada neste ano.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

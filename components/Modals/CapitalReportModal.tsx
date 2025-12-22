import React, { useMemo, useState } from 'react';
import { X, TrendingUp, TrendingDown, Trash2, FileText, ArrowUpRight, ArrowDownLeft, Printer } from 'lucide-react';
import { CapitalInjection, Order, Expense } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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

    const handleDownloadPDF = () => {
        const doc = new jsPDF();

        // Header
        doc.setFillColor(15, 23, 42); // slate-900
        doc.rect(0, 0, 210, 40, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text('3D Print Flow - Balanço Anual', 14, 25);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Referência: ${selectedYear} | Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 32);

        // Summary Cards Section
        let yPos = 50;
        doc.setTextColor(51, 65, 85); // slate-700
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Resumo Geral', 14, yPos);

        yPos += 10;
        const summaryData = [
            ['Faturamento Total', formatCurrency(yearlyData.totals.revenue)],
            ['Lucro Líquido (Estimado)', formatCurrency(yearlyData.totals.revenue - yearlyData.totals.expenses)],
            ['Total de Pedidos', yearlyData.totals.orders.toString()],
            ['Despesas Pagas', formatCurrency(yearlyData.totals.expenses)],
            ['Aportes de Capital', formatCurrency(yearlyData.totals.injections)],
            ['Retiradas', formatCurrency(yearlyData.totals.withdrawals)]
        ];

        autoTable(doc, {
            startY: yPos,
            head: [['Indicador', 'Valor']],
            body: summaryData,
            theme: 'grid',
            headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold' },
            bodyStyles: { textColor: 50 },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 100 },
                1: { cellWidth: 80, halign: 'right' }
            }
        });

        // Monthly Breakdown
        yPos = (doc as any).lastAutoTable.finalY + 15;
        doc.text('Detalhamento Mensal', 14, yPos);

        yPos += 5;
        const tableData = yearlyData.buckets.map((b, i) => [
            MONTH_NAMES[i],
            formatCurrency(b.revenue),
            b.orders,
            formatCurrency(b.expenses),
            formatCurrency(b.revenue - b.expenses), // Simple profit
            formatCurrency(b.injections - b.withdrawals)
        ]);

        autoTable(doc, {
            startY: yPos,
            head: [['Mês', 'Receita', 'Peds', 'Despesas', 'Lucro Op.', 'Fluxo Cap.']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [14, 165, 233], textColor: 255, fontStyle: 'bold' }, // sky-500
            columnStyles: {
                0: { fontStyle: 'bold' },
                1: { halign: 'right' },
                2: { halign: 'center' },
                3: { halign: 'right' },
                4: { halign: 'right', fontStyle: 'bold' },
                5: { halign: 'right' }
            },
            foot: [[
                'TOTAL',
                formatCurrency(yearlyData.totals.revenue),
                yearlyData.totals.orders,
                formatCurrency(yearlyData.totals.expenses),
                formatCurrency(yearlyData.totals.revenue - yearlyData.totals.expenses),
                formatCurrency(yearlyData.totals.injections - yearlyData.totals.withdrawals)
            ]],
            footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' } // slate-100
        });

        // Footer
        const pageCount = (doc as any).internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text('Gerado pelo sistema 3D Print Flow', 14, 285);
            doc.text(`Página ${i} de ${pageCount}`, 190, 285, { align: 'right' });
        }

        doc.save(`Balanco_Anual_${selectedYear}.pdf`);
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

            <div className="relative bg-white w-full max-w-4xl rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="bg-slate-800 p-8 text-white flex justify-between items-center shrink-0">
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
                                    className="bg-white/10 border border-white/10 rounded-lg text-white text-xs font-bold px-2 py-1 outline-none focus:ring-1 focus:ring-sky-400"
                                >
                                    {[currentYear - 1, currentYear, currentYear + 1].map(y => <option key={y} value={y} className="text-slate-800">{y}</option>)}
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
                <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Faturamento</h4>
                            <p className="text-2xl font-black text-slate-800">{formatCurrency(yearlyData.totals.revenue)}</p>
                            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md mt-2 inline-block">
                                {yearlyData.totals.orders} Pedidos
                            </span>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Despesas Pagas</h4>
                            <p className="text-2xl font-black text-rose-600">{formatCurrency(yearlyData.totals.expenses)}</p>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Lucro Operacional</h4>
                            <p className={`text-2xl font-black ${yearlyData.totals.revenue - yearlyData.totals.expenses >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {formatCurrency(yearlyData.totals.revenue - yearlyData.totals.expenses)}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1">(Receita - Despesas)</p>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Aportes Líquidos</h4>
                            <p className="text-2xl font-black text-sky-600">{formatCurrency(yearlyData.totals.injections - yearlyData.totals.withdrawals)}</p>
                            <div className="flex gap-2 text-[10px] mt-1">
                                <span className="text-emerald-600">+{formatCurrency(yearlyData.totals.injections)}</span>
                                <span className="text-rose-600">-{formatCurrency(yearlyData.totals.withdrawals)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Detailed Table */}
                    <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 font-bold text-slate-500">Mês</th>
                                    <th className="px-6 py-4 font-bold text-slate-500 text-right">Receita</th>
                                    <th className="px-6 py-4 font-bold text-slate-500 text-center">Pedidos</th>
                                    <th className="px-6 py-4 font-bold text-slate-500 text-right">Despesas</th>
                                    <th className="px-6 py-4 font-bold text-slate-500 text-right">Lucro</th>
                                    <th className="px-6 py-4 font-bold text-slate-500 text-right">Aportes</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {yearlyData.buckets.map((b, i) => (
                                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-slate-700">{MONTH_NAMES[i]}</td>
                                        <td className="px-6 py-4 text-right font-medium text-slate-600">{formatCurrency(b.revenue)}</td>
                                        <td className="px-6 py-4 text-center font-medium text-slate-500">{b.orders}</td>
                                        <td className="px-6 py-4 text-right font-medium text-rose-600">{formatCurrency(b.expenses)}</td>
                                        <td className={`px-6 py-4 text-right font-bold ${b.revenue - b.expenses >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {formatCurrency(b.revenue - b.expenses)}
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-sky-600">
                                            {formatCurrency(b.injections - b.withdrawals)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-slate-50/80 font-bold text-slate-800">
                                <tr>
                                    <td className="px-6 py-4">TOTAL</td>
                                    <td className="px-6 py-4 text-right">{formatCurrency(yearlyData.totals.revenue)}</td>
                                    <td className="px-6 py-4 text-center">{yearlyData.totals.orders}</td>
                                    <td className="px-6 py-4 text-right text-rose-600">{formatCurrency(yearlyData.totals.expenses)}</td>
                                    <td className="px-6 py-4 text-right text-emerald-600">{formatCurrency(yearlyData.totals.revenue - yearlyData.totals.expenses)}</td>
                                    <td className="px-6 py-4 text-right text-sky-600">{formatCurrency(yearlyData.totals.injections - yearlyData.totals.withdrawals)}</td>
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
                                    <div key={item.id} className="bg-white p-3 rounded-xl border border-slate-100 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${item.amount >= 0 ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                                                {item.amount >= 0 ? <ArrowUpRight size={14} className="text-emerald-500" /> : <ArrowDownLeft size={14} className="text-rose-500" />}
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-slate-700">{item.description}</p>
                                                <p className="text-[10px] text-slate-400">{new Date(item.date).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`font-bold text-sm ${item.amount >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {formatCurrency(item.amount)}
                                            </span>
                                            {onDelete && (
                                                <button onClick={() => handleDelete(item.id)} className="text-slate-300 hover:text-rose-500">
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

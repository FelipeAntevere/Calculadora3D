import React, { useMemo } from 'react';
import { X, TrendingUp, TrendingDown, Trash2, FileText, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { CapitalInjection } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface CapitalReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    injections: CapitalInjection[];
    onDelete?: (id: string) => Promise<void>;
    totalBalance: number;
}

export const CapitalReportModal: React.FC<CapitalReportModalProps> = ({
    isOpen,
    onClose,
    injections,
    onDelete,
    totalBalance
}) => {
    const metrics = useMemo(() => {
        const totalInjected = injections
            .filter(i => i.amount > 0)
            .reduce((acc, curr) => acc + curr.amount, 0);

        const totalWithdrawn = injections
            .filter(i => i.amount < 0)
            .reduce((acc, curr) => acc + Math.abs(curr.amount), 0);

        return {
            totalInjected,
            totalWithdrawn
        };
    }, [injections]);

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

            <div className="relative bg-white w-full max-w-2xl rounded-[24px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="bg-slate-800 p-6 text-white flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/10 p-2 rounded-xl backdrop-blur-md border border-white/10">
                            <FileText className="w-5 h-5 text-sky-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">Relatório de Capital</h3>
                            <p className="text-slate-400 text-xs opacity-90">Histórico de aportes e retiradas</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="hover:bg-white/10 p-2 rounded-full transition-colors text-slate-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                {/* Summary Cards */}
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 border-b border-slate-100 shrink-0">
                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-1.5 bg-emerald-50 rounded-lg">
                                <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Aportado</span>
                        </div>
                        <p className="text-xl font-black text-slate-800">{formatCurrency(metrics.totalInjected)}</p>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-1.5 bg-rose-50 rounded-lg">
                                <ArrowDownLeft className="w-4 h-4 text-rose-500" />
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Retirado</span>
                        </div>
                        <p className="text-xl font-black text-rose-600">{formatCurrency(metrics.totalWithdrawn)}</p>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-1.5 bg-sky-50 rounded-lg">
                                <TrendingUp className="w-4 h-4 text-sky-500" />
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Saldo em Conta</span>
                        </div>
                        <p className={`text-xl font-black ${totalBalance >= 0 ? 'text-sky-600' : 'text-rose-600'}`}>
                            {formatCurrency(totalBalance)}
                        </p>
                    </div>
                </div>

                {/* List */}
                <div className="overflow-y-auto p-6">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        Histórico de Transações
                        <span className="bg-slate-100 text-slate-500 py-0.5 px-2 rounded-full text-[10px]">{injections.length}</span>
                    </h4>

                    {injections.length === 0 ? (
                        <div className="text-center py-12 text-slate-400 flex flex-col items-center gap-3">
                            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center">
                                <FileText className="w-6 h-6 text-slate-300" />
                            </div>
                            <p className="text-sm font-medium">Nenhuma movimentação registrada.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {injections.map((item) => {
                                const isPositive = item.amount >= 0;
                                return (
                                    <div key={item.id} className="group bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2.5 rounded-xl ${isPositive ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                                                {isPositive ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-700">{item.description}</p>
                                                <p className="text-xs text-slate-400 font-medium bg-slate-50 px-2 py-0.5 rounded-md inline-block mt-1">
                                                    {new Date(item.date).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <span className={`text-sm font-black ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {isPositive ? '+' : ''}{formatCurrency(item.amount)}
                                            </span>
                                            {onDelete && (
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                    title="Excluir"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

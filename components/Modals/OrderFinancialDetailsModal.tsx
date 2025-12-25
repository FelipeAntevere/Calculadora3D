import React from 'react';
import { X, DollarSign, Zap, Briefcase, Box, TrendingUp, Info, BarChart3, Wrench, Clock, Scale, Calendar, User, Package } from 'lucide-react';
import { Order } from '../../types';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';
import { useEscapeKey } from '../../hooks/useEscapeKey';

interface OrderFinancialDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: Order | null;
}

export const OrderFinancialDetailsModal: React.FC<OrderFinancialDetailsModalProps> = ({
    isOpen,
    onClose,
    order
}) => {
    // Close on ESC
    useEscapeKey(onClose, isOpen);

    if (!isOpen || !order) return null;

    const costBreakdown = [
        { label: 'Material', value: order.materialCost, icon: Box, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/10' },
        { label: 'Energia', value: order.energyCost, icon: Zap, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/10' },
        { label: 'Mão de Obra', value: order.laborCost, icon: Briefcase, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/10' },
        { label: 'Manutenção', value: order.maintenanceCost, icon: Wrench, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/10' },
        { label: 'Custos Fixos', value: order.fixedRateCost, icon: Info, color: 'text-sky-500', bg: 'bg-sky-50 dark:bg-sky-900/10' },
        { label: 'Extras/Emb.', value: order.extrasCost, icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/10' },
    ];

    const totalCost = (order.unitCost || 0) * (order.quantity || 1);
    const revenue = (order.unitValue || 0) * (order.quantity || 1);
    const profit = order.profitMarginValue || 0;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-white dark:bg-slate-800 w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300">

                <div className="px-10 pt-10 pb-4 relative flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3.5 bg-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-200 dark:shadow-emerald-900/20">
                            <BarChart3 className="w-6 h-6" />
                        </div>
                        <div className="flex flex-col">
                            <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Análise Financeira</h3>
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">PEDIDO #{order.id.slice(0, 6)}</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-2xl transition-all active:scale-90">
                        <X className="w-6 h-6 text-slate-400" />
                    </button>
                </div>

                <div className="px-10 pb-10 pt-4 space-y-8">

                    {/* Dashboard de Custos Equilibrado */}
                    <div className="grid grid-cols-3 gap-4">
                        {costBreakdown.map((item, idx) => (
                            <div key={idx} className={`p-4 rounded-3xl border border-slate-100 dark:border-slate-700 flex flex-col items-center text-center transition-all hover:scale-[1.02] ${item.bg}`}>
                                <div className={`p-2 rounded-xl ${item.bg} border border-white/50 dark:border-slate-800 mb-2`}>
                                    <item.icon className={`w-5 h-5 ${item.color}`} />
                                </div>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mb-1">{item.label}</span>
                                <span className="text-base font-black text-slate-800 dark:text-white">{formatCurrency(item.value || 0)}</span>
                            </div>
                        ))}
                    </div>

                    {/* Resumo Financeiro Final Equilibrado */}
                    <div className="p-8 bg-slate-900 dark:bg-black rounded-[36px] text-white shadow-xl relative overflow-hidden">
                        <div className="grid grid-cols-2 gap-8 relative z-10">
                            <div className="flex flex-col justify-center">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Venda Total</span>
                                <p className="text-3xl font-black text-emerald-400 mb-4">{formatCurrency(order.total || 0)}</p>
                                <div className="flex gap-4 pt-3 border-t border-white/5">
                                    <div className="flex items-center gap-2 opacity-60">
                                        <Scale size={14} className="text-slate-400" />
                                        <span className="text-[10px] font-bold uppercase">{order.weight}g</span>
                                    </div>
                                    <div className="flex items-center gap-2 opacity-60">
                                        <Clock size={14} className="text-slate-400" />
                                        <span className="text-[10px] font-bold uppercase">{(order.time || 0).toFixed(1)}h</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white/5 rounded-[30px] p-6 border border-white/10 space-y-4">
                                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Lucro Líquido</span>
                                    <span className="text-xl font-black text-emerald-400">{formatCurrency(profit)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Taxas</span>
                                    <span className="text-[13px] font-black text-orange-400">-{formatCurrency(order.platformFeeValue || 0)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="text-center">
                        <p className="text-[9px] text-slate-400 font-medium italic">
                            Snapshot original da calculadora no momento da criação deste pedido.
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-full py-4 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-[20px] font-black text-xs uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-600 transition-all active:scale-95 shadow-sm"
                    >
                        Fechar Detalhamento
                    </button>
                </div>
            </div>
        </div>
    );
};

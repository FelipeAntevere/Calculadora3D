import React, { useState, useEffect } from 'react';
import { X, ChevronDown, Check, DollarSign, Zap, Briefcase, Box, TrendingUp, Info, BarChart3, Wrench } from 'lucide-react';
import { Order, OrderStatus } from '../../types';
import { BRAZILIAN_STATES } from '../../constants';
import { toLocalInputDate, formatCurrency } from '../../utils/formatters';
import { useEscapeKey } from '../../hooks/useEscapeKey';

interface OrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: Partial<Order>;
    setOrder: (order: Partial<Order>) => void;
    editingOrderId: string | null;
    onSave: () => void;
    materialOptions: string[];
    statusOptions: string[];
    isFinancialDetailsOpen: boolean;
    setIsFinancialDetailsOpen: (open: boolean) => void;
}

/**
 * Order Modal Component (V2)
 * Handles the form for creating or editing orders.
 * Version 2 created to resolve potential caching/build issues.
 */
export const OrderModalV2: React.FC<OrderModalProps> = ({
    isOpen,
    onClose,
    order,
    setOrder,
    editingOrderId,
    onSave,
    materialOptions,
    statusOptions,
    isFinancialDetailsOpen,
    setIsFinancialDetailsOpen
}) => {
    const [isOrderMaterialDropdownOpen, setIsOrderMaterialDropdownOpen] = useState(false);
    const [isStateDropdownOpen, setIsStateDropdownOpen] = useState(false);
    const [isOrderStatusDropdownOpen, setIsOrderStatusDropdownOpen] = useState(false);

    const scrollRef = React.useRef<HTMLDivElement>(null);

    // Close on ESC
    useEscapeKey(onClose, isOpen);

    useEffect(() => {
        if (isOpen) {
            setIsOrderMaterialDropdownOpen(false);
            setIsStateDropdownOpen(false);
            setIsOrderStatusDropdownOpen(false);
            // Reset scroll to top when opening
            setTimeout(() => {
                if (scrollRef.current) scrollRef.current.scrollTop = 0;
            }, 100);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                onClick={onClose}
            ></div>
            <div className="relative bg-white dark:bg-slate-800 w-full max-w-xl rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-8 pt-8 pb-2 flex items-center justify-between">
                    <div className="flex flex-col gap-0.5">
                        <h3 className="text-2xl font-black text-slate-800 dark:text-white">
                            {editingOrderId ? 'Editar Pedido (V2)' : 'Novo Pedido (V2)'}
                        </h3>
                        <p className="text-slate-400 text-sm font-medium">Preencha os dados abaixo.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                <div
                    ref={scrollRef}
                    className="p-8 pb-8 max-h-[75vh] overflow-y-auto space-y-6"
                >
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-900 dark:text-slate-300 mb-2">Cliente</label>
                            <input
                                type="text"
                                placeholder="Nome do cliente"
                                value={order.customer || ''}
                                onChange={(e) => setOrder({ ...order, customer: e.target.value })}
                                className="w-full bg-[#f8fafc] dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm outline-none font-medium focus:ring-2 focus:ring-[#0ea5e9]/10 dark:focus:ring-[#0ea5e9]/20 text-slate-900 dark:text-white placeholder:text-slate-400"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-900 dark:text-slate-300 mb-2">Nome da Peça</label>
                            <input
                                type="text"
                                placeholder="Ex: Suporte de Fone"
                                value={order.pieceName || ''}
                                onChange={(e) => setOrder({ ...order, pieceName: e.target.value })}
                                className="w-full bg-[#f8fafc] dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm outline-none font-medium focus:ring-2 focus:ring-[#0ea5e9]/10 dark:focus:ring-[#0ea5e9]/20 text-slate-900 dark:text-white placeholder:text-slate-400"
                            />
                        </div>
                        <div className="relative">
                            <label className="block text-sm font-bold text-slate-900 dark:text-slate-300 mb-2">Material</label>
                            <div className="relative">
                                <button
                                    onClick={() => setIsOrderMaterialDropdownOpen(!isOrderMaterialDropdownOpen)}
                                    className="w-full flex items-center justify-between bg-[#f8fafc] dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm outline-none font-medium text-slate-700 dark:text-slate-200"
                                >
                                    {order.material || 'Selecione...'}
                                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ` + (isOrderMaterialDropdownOpen ? 'rotate-180' : '')} />
                                </button>
                                {isOrderMaterialDropdownOpen && (
                                    <div className="absolute left-0 mt-2 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl z-[60] py-2 animate-in fade-in zoom-in-95 origin-top overflow-hidden">
                                        {materialOptions.map((mat) => (
                                            <button
                                                key={mat}
                                                onClick={() => { setOrder({ ...order, material: mat }); setIsOrderMaterialDropdownOpen(false); }}
                                                className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                            >
                                                <div className="w-4">{order.material === mat && <Check className="w-3.5 h-3.5 text-[#0ea5e9]" />}</div>
                                                <span>{mat}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-900 dark:text-slate-300 mb-2">Cor</label>
                            <input
                                type="text"
                                placeholder="Ex: Preto Matte"
                                value={order.color || ''}
                                onChange={(e) => setOrder({ ...order, color: e.target.value })}
                                className="w-full bg-[#f8fafc] dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm outline-none font-medium focus:ring-2 focus:ring-[#0ea5e9]/10 dark:focus:ring-[#0ea5e9]/20 text-slate-900 dark:text-white placeholder:text-slate-400"
                            />
                        </div>
                        <div className="relative">
                            <label className="block text-sm font-bold text-slate-900 dark:text-slate-300 mb-2">Estado</label>
                            <div className="relative">
                                <button
                                    onClick={() => setIsStateDropdownOpen(!isStateDropdownOpen)}
                                    className="w-full flex items-center justify-between bg-[#f8fafc] dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm outline-none font-medium text-slate-700 dark:text-slate-200"
                                >
                                    {order.state || 'UF'}
                                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ` + (isStateDropdownOpen ? 'rotate-180' : '')} />
                                </button>
                                {isStateDropdownOpen && (
                                    <div className="absolute left-0 mt-2 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl z-[60] py-2 animate-in fade-in zoom-in-95 duration-150 origin-top max-h-48 overflow-y-auto">
                                        {BRAZILIAN_STATES.map((st) => (
                                            <button
                                                key={st.sigla}
                                                onClick={() => { setOrder({ ...order, state: st.sigla }); setIsStateDropdownOpen(false); }}
                                                className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                            >
                                                <div className="w-4">{order.state === st.sigla && <Check className="w-3.5 h-3.5 text-[#0ea5e9]" />}</div>
                                                <span>{st.nome} ({st.sigla})</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-900 dark:text-slate-300 mb-2">Quantidade</label>
                            <input
                                type="number"
                                value={order.quantity || ''}
                                onChange={(e) => {
                                    const val = e.target.value === '' ? 1 : parseInt(e.target.value);
                                    setOrder({ ...order, quantity: isNaN(val) ? 1 : val });
                                }}
                                className="w-full bg-[#f8fafc] dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm outline-none font-medium focus:ring-2 focus:ring-[#0ea5e9]/10 dark:focus:ring-[#0ea5e9]/20 text-slate-900 dark:text-white"
                                placeholder="1"
                            />
                        </div>
                        {editingOrderId && (
                            <div className="col-span-1 relative">
                                <label className="block text-sm font-bold text-slate-900 dark:text-slate-300 mb-2">Status</label>
                                <div className="relative">
                                    <button
                                        onClick={() => setIsOrderStatusDropdownOpen(!isOrderStatusDropdownOpen)}
                                        className="w-full flex items-center justify-between bg-[#f8fafc] dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm outline-none font-medium text-slate-700 dark:text-slate-200"
                                    >
                                        {order.status || 'Selecione...'}
                                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ` + (isOrderStatusDropdownOpen ? 'rotate-180' : '')} />
                                    </button>
                                    {isOrderStatusDropdownOpen && (
                                        <div className="absolute left-0 mt-2 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl z-[60] py-2 animate-in fade-in zoom-in-95 duration-150 origin-top overflow-hidden">
                                            {statusOptions.map((opt) => (
                                                <button
                                                    key={opt}
                                                    onClick={() => { setOrder({ ...order, status: opt as OrderStatus }); setIsOrderStatusDropdownOpen(false); }}
                                                    className={`w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors` + (order.status === opt ? ' bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400' : '')}
                                                >
                                                    <div className="w-4">{order.status === opt && <Check className="w-3.5 h-3.5 text-[#0ea5e9]" />}</div>
                                                    <span>{opt}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <hr className="border-slate-50 dark:border-slate-700" />

                    <div className="space-y-6">
                        <h4 className="text-base font-black text-slate-800 dark:text-white tracking-tight">Detalhes Técnicos e Financeiros</h4>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-900 dark:text-slate-300 mb-2">Peso Aproximado (g)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={order.weight || ''}
                                    onChange={(e) => setOrder({ ...order, weight: parseFloat(e.target.value) || 0 })}
                                    className="w-full bg-[#f8fafc] dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm outline-none font-medium focus:ring-2 focus:ring-[#0ea5e9]/10 dark:focus:ring-[#0ea5e9]/20 text-slate-900 dark:text-white"
                                    placeholder="0"
                                    readOnly={false}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-900 dark:text-slate-300 mb-2">Tempo de Impressão Unitário</label>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 relative">
                                        <input
                                            type="number"
                                            min="0"
                                            value={Math.floor(order.time || 0) || ''}
                                            onChange={(e) => {
                                                const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                                                const h = isNaN(val) ? 0 : val;
                                                const m = Math.round(((order.time || 0) - Math.floor(order.time || 0)) * 60);
                                                setOrder({ ...order, time: h + (m / 60) });
                                            }}
                                            className="w-full bg-[#f8fafc] dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-3 text-sm outline-none font-medium focus:ring-2 focus:ring-[#0ea5e9]/10 dark:focus:ring-[#0ea5e9]/20 text-slate-900 dark:text-white hide-spin-buttons"
                                            placeholder="0"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">h</span>
                                    </div>
                                    <div className="flex-1 relative">
                                        <input
                                            type="number"
                                            min="0"
                                            max="59"
                                            value={Math.round(((order.time || 0) - Math.floor(order.time || 0)) * 60) || ''}
                                            onChange={(e) => {
                                                const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                                                const m = Math.min(59, Math.max(0, isNaN(val) ? 0 : val));
                                                const h = Math.floor(order.time || 0);
                                                setOrder({ ...order, time: h + (m / 60) });
                                            }}
                                            className="w-full bg-[#f8fafc] dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-3 text-sm outline-none font-medium focus:ring-2 focus:ring-[#0ea5e9]/10 dark:focus:ring-[#0ea5e9]/20 text-slate-900 dark:text-white hide-spin-buttons"
                                            placeholder="0"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">min</span>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-900 dark:text-slate-300 mb-2">Custo Unitário (R$)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={order.unitCost || ''}
                                    onChange={(e) => setOrder({ ...order, unitCost: parseFloat(e.target.value) || 0 })}
                                    className="w-full bg-[#f8fafc] dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm outline-none font-medium focus:ring-2 focus:ring-[#0ea5e9]/10 dark:focus:ring-[#0ea5e9]/20 text-slate-900 dark:text-white"
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-900 dark:text-slate-300 mb-2">Venda Unitário (R$)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={order.unitValue || ''}
                                    onChange={(e) => setOrder({ ...order, unitValue: parseFloat(e.target.value) || 0 })}
                                    className="w-full bg-[#f8fafc] dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm outline-none font-medium focus:ring-2 focus:ring-[#0ea5e9]/10 dark:focus:ring-[#0ea5e9]/20 text-slate-900 dark:text-white"
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-900 dark:text-slate-300 mb-2">Frete (R$)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={order.freight || ''}
                                    onChange={(e) => setOrder({ ...order, freight: parseFloat(e.target.value) || 0 })}
                                    className="w-full bg-[#f8fafc] dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm outline-none font-medium focus:ring-2 focus:ring-[#0ea5e9]/10 dark:focus:ring-[#0ea5e9]/20 text-slate-900 dark:text-white"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                    </div>

                    <hr className="border-slate-50 dark:border-slate-700" />

                    {/* Financial Breakdown Section */}
                    {(
                        <div className="bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden transition-all shadow-sm">
                            <button
                                onClick={() => setIsFinancialDetailsOpen(!isFinancialDetailsOpen)}
                                className="w-full flex items-center justify-between p-5 hover:bg-slate-100/50 dark:hover:bg-slate-700/30 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600">
                                        <BarChart3 className="w-4 h-4" />
                                    </div>
                                    <div className="flex flex-col items-start text-left">
                                        <span className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">Análise Financeira e Composição</span>
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Detalhamento dos custos originais da calculadora</span>
                                    </div>
                                </div>
                                <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isFinancialDetailsOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isFinancialDetailsOpen && (
                                <div className="px-5 pb-6 space-y-4 animate-in slide-in-from-top-2 duration-300">
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { label: 'Material', value: order.materialCost, icon: Box, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/10' },
                                            { label: 'Energia', value: order.energyCost, icon: Zap, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/10' },
                                            { label: 'Mão de Obra', value: order.laborCost, icon: Briefcase, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/10' },
                                            { label: 'Manutenção', value: order.maintenanceCost, icon: Wrench, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/10' },
                                            { label: 'Custos Fixos', value: order.fixedRateCost, icon: Info, color: 'text-sky-500', bg: 'bg-sky-50 dark:bg-sky-900/10' },
                                            { label: 'Extras/Emb.', value: order.extrasCost, icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/10' },
                                        ].map((item, idx) => (
                                            <div key={idx} className={`p-3 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center gap-3 ${item.bg}`}>
                                                <item.icon className={`w-4 h-4 ${item.color}`} />
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase">{item.label}</span>
                                                    <span className="text-sm font-black text-slate-700 dark:text-slate-200">{formatCurrency(item.value || 0)}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="pt-2 border-t border-slate-100 dark:border-slate-700 space-y-2">
                                        <div className="flex items-center justify-between px-1 pt-2">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                                <TrendingUp className="w-3 h-3 text-emerald-500" />
                                                Lucro Real Estimado
                                            </span>
                                            <span className="text-sm font-black text-emerald-600">{formatCurrency(order.profitMarginValue || 0)}</span>
                                        </div>
                                        <div className="flex items-center justify-between px-1">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                                <DollarSign className="w-3 h-3 text-orange-500" />
                                                Taxas de Venda
                                            </span>
                                            <span className="text-sm font-black text-orange-600">{formatCurrency(order.platformFeeValue || 0)}</span>
                                        </div>
                                    </div>

                                    {(order.filamentCostPerKg || order.laborHourValue) && (
                                        <div className="p-3 bg-slate-100/50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Configurações Base do Pedido</p>
                                            <div className="flex justify-around items-center">
                                                {order.filamentCostPerKg && (
                                                    <div className="text-center">
                                                        <span className="text-[8px] font-bold text-slate-400 uppercase">Filamento (Kg)</span>
                                                        <p className="text-[11px] font-black text-slate-700 dark:text-slate-200">{formatCurrency(order.filamentCostPerKg)}</p>
                                                    </div>
                                                )}
                                                <div className="w-[1px] h-6 bg-slate-200 dark:bg-slate-700" />
                                                {order.laborHourValue && (
                                                    <div className="text-center">
                                                        <span className="text-[8px] font-bold text-slate-400 uppercase">Mão de Obra (h)</span>
                                                        <p className="text-[11px] font-black text-slate-700 dark:text-slate-200">{formatCurrency(order.laborHourValue)}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-bold text-slate-900 dark:text-slate-300 mb-2">Data do Pedido</label>
                        <input
                            type="datetime-local"
                            value={toLocalInputDate(order.date || '')}
                            onChange={(e) => {
                                const date = new Date(e.target.value);
                                if (!isNaN(date.getTime())) {
                                    setOrder({ ...order, date: date.toISOString() });
                                } else {
                                    setOrder({ ...order, date: e.target.value });
                                }
                            }}
                            className="w-full bg-[#f8fafc] dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm outline-none font-medium text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-[#0ea5e9]/10 dark:focus:ring-[#0ea5e9]/20 dark:[color-scheme:dark]"
                        />
                    </div>
                </div>

                <div className="px-8 pb-8 pt-4 flex items-center justify-end gap-3 border-t border-slate-50 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onSave}
                        className="px-8 py-3 bg-[#0ea5e9] text-white rounded-2xl text-sm font-black shadow-lg shadow-sky-100 dark:shadow-sky-900/20 hover:bg-[#0284c7] transform active:scale-95 transition-all"
                    >
                        {editingOrderId ? 'Salvar Alterações' : 'Salvar Pedido'}
                    </button>
                </div>
            </div>
        </div>
    );
};

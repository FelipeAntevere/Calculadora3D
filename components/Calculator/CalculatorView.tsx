import React, { useState } from 'react';
import {
    Save,
    RefreshCw,
    FileText,
    Clock,
    Zap,
    Percent,
    Briefcase,
    Wrench,
    DollarSign,
    Plus,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { PricingCalculatorInputs, Order } from '../../types';

interface CalculatorViewProps {
    calcInputs: PricingCalculatorInputs;
    setCalcInputs: (inputs: PricingCalculatorInputs) => void;
    calcResults: any;
    handleSaveDefaults: () => void;
    handleResetInputs: () => void;
    handleClearSavedDefaults: () => void;
    handleGenerateSummary: () => void;
    onAddToOrders: (order: Partial<Order>) => void;
    EMPTY_ORDER: Partial<Order>;
}

/**
 * 3D Printing Pricing Calculator View
 * Handles user inputs for material, time, labor, and machine costs.
 */
export const CalculatorView: React.FC<CalculatorViewProps> = ({
    calcInputs,
    setCalcInputs,
    calcResults,
    handleSaveDefaults,
    handleResetInputs,
    handleClearSavedDefaults,
    handleGenerateSummary,
    onAddToOrders,
    EMPTY_ORDER
}) => {
    const [expandedSections, setExpandedSections] = useState({
        piece: true,
        material: true,
        labor: true,
        machine: true
    });

    const toggleSection = (section: keyof typeof expandedSections) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <h2 className="text-3xl font-extrabold text-[#0f172a] tracking-tight">Calculadora</h2>
                    <p className="text-slate-500 text-sm font-medium">Os valores calculados aqui serão os usados no Dashboard ao salvar.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleSaveDefaults}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
                    >
                        <Save className="w-4 h-4" />
                        Salvar Padrão
                    </button>
                    <button
                        onClick={handleResetInputs}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 transition-all"
                        title="Limpa apenas o tempo e peso da peça atual"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Limpar Dados
                    </button>
                    <button
                        onClick={handleClearSavedDefaults}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-rose-500 hover:bg-rose-50 transition-all border-rose-100"
                        title="Reseta todas as configurações para o padrão de fábrica"
                    >
                        <Wrench className="w-4 h-4" />
                        Resetar Tudo
                    </button>
                    <button onClick={handleGenerateSummary} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all">
                        <FileText className="w-4 h-4" />
                        Gerar Resumo
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative">
                <div className="lg:col-span-7 space-y-6">
                    {/* Piece Details */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-all hover:border-sky-100">
                        <button onClick={() => toggleSection('piece')} className="w-full flex items-center justify-between p-6 hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-3"><Clock className="w-5 h-5 text-sky-500" /><span className="font-bold text-slate-800">Detalhes da Peça</span></div>
                            {expandedSections.piece ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                        </button>
                        {expandedSections.piece && (
                            <div className="px-6 pb-8 grid grid-cols-2 gap-6 animate-in slide-in-from-top-2 duration-200">
                                <div><label className="block text-sm font-medium text-slate-500 mb-2 uppercase tracking-wider text-[10px]">Tempo de impressão (horas)</label>
                                    <input type="number" value={calcInputs.printingTime} onChange={(e) => setCalcInputs({ ...calcInputs, printingTime: parseFloat(e.target.value) || 0 })} className={`w-full bg-[#f8fafc] border border-slate-100 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-sky-500/10 ` + (calcInputs.printingTime === 0 ? 'text-rose-600 font-bold' : 'text-slate-700')} />
                                </div>
                                <div><label className="block text-sm font-medium text-slate-500 mb-2 uppercase tracking-wider text-[10px]">Peso da peça (gramas)</label>
                                    <input type="number" value={calcInputs.partWeight} onChange={(e) => setCalcInputs({ ...calcInputs, partWeight: parseFloat(e.target.value) || 0 })} className={`w-full bg-[#f8fafc] border border-slate-100 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-sky-500/10 ` + (calcInputs.partWeight === 0 ? 'text-rose-600 font-bold' : 'text-slate-700')} />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Material and Energy */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-all hover:border-amber-100">
                        <button onClick={() => toggleSection('material')} className="w-full flex items-center justify-between p-6 hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-3"><Zap className="w-5 h-5 text-amber-500" /><span className="font-bold text-slate-800">Material e Energia</span></div>
                            {expandedSections.material ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                        </button>
                        {expandedSections.material && (
                            <div className="px-6 pb-8 space-y-6 animate-in slide-in-from-top-2 duration-200">
                                <div className="grid grid-cols-2 gap-6">
                                    <div><label className="block text-sm font-medium text-slate-500 mb-2 uppercase tracking-wider text-[10px]">Custo do filamento por kg</label>
                                        <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">R$</span><input type="number" value={calcInputs.filamentCostPerKg} onChange={(e) => setCalcInputs({ ...calcInputs, filamentCostPerKg: parseFloat(e.target.value) || 0 })} className={`w-full bg-[#f8fafc] border border-slate-100 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-amber-500/10 ` + (calcInputs.filamentCostPerKg === 0 ? 'text-rose-600 font-bold' : 'text-slate-700')} /></div>
                                    </div>
                                    <div><label className="block text-sm font-medium text-slate-500 mb-2 uppercase tracking-wider text-[10px]">Consumo da impressora (kWh/h)</label><input type="number" step="0.01" value={calcInputs.printerConsumption} onChange={(e) => setCalcInputs({ ...calcInputs, printerConsumption: parseFloat(e.target.value) || 0 })} className={`w-full bg-[#f8fafc] border border-slate-100 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-amber-500/10 ` + (calcInputs.printerConsumption === 0 ? 'text-rose-600 font-bold' : 'text-slate-700')} /></div>
                                    <div><label className="block text-sm font-medium text-slate-500 mb-2 uppercase tracking-wider text-[10px]">Custo do kWh</label><div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">R$</span><input type="number" step="0.01" value={calcInputs.kWhCost} onChange={(e) => setCalcInputs({ ...calcInputs, kWhCost: parseFloat(e.target.value) || 0 })} className={`w-full bg-[#f8fafc] border border-slate-100 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-amber-500/10 ` + (calcInputs.kWhCost === 0 ? 'text-rose-600 font-bold' : 'text-slate-700')} /></div></div>
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-2"><label className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider text-[10px]"><Percent className="w-3 h-3" /> Perda de Filamento</label><span className="text-xs font-black text-sky-500">{calcInputs.filamentLossPercentage}%</span></div>
                                    <input type="range" min="0" max="30" step="1" value={calcInputs.filamentLossPercentage} onChange={(e) => setCalcInputs({ ...calcInputs, filamentLossPercentage: parseInt(e.target.value) })} className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-sky-500" />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Labor and Business */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-all hover:border-indigo-100">
                        <button onClick={() => toggleSection('labor')} className="w-full flex items-center justify-between p-6 hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-3"><Briefcase className="w-5 h-5 text-indigo-500" /><span className="font-bold text-slate-800">Mão de Obra e Negócio</span></div>
                            {expandedSections.labor ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                        </button>
                        {expandedSections.labor && (
                            <div className="px-6 pb-8 space-y-6 animate-in slide-in-from-top-2 duration-200">
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-500 mb-2 uppercase tracking-wider text-[10px]">Valor da sua hora de trabalho</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">R$</span>
                                            <input type="number" value={calcInputs.laborHourValue} onChange={(e) => setCalcInputs({ ...calcInputs, laborHourValue: parseFloat(e.target.value) || 0 })} className={`w-full bg-[#f8fafc] border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/10 ` + (calcInputs.laborHourValue === 0 ? 'text-rose-600 font-bold' : 'text-slate-700')} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-500 mb-2 uppercase tracking-wider text-[10px]">Horas de trabalho manual</label>
                                        <div className="relative">
                                            <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                            <input type="number" step="0.1" value={calcInputs.laborTimeSpent} onChange={(e) => setCalcInputs({ ...calcInputs, laborTimeSpent: parseFloat(e.target.value) || 0 })} className={`w-full bg-[#f8fafc] border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/10 ` + (calcInputs.laborTimeSpent === 0 ? 'text-rose-600 font-bold' : 'text-slate-700')} />
                                        </div>
                                    </div>
                                    <div><label className="block text-sm font-medium text-slate-500 mb-2 uppercase tracking-wider text-[10px]">Custos fixos mensais</label><div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">R$</span><input type="number" value={calcInputs.fixedMonthlyCosts} onChange={(e) => setCalcInputs({ ...calcInputs, fixedMonthlyCosts: parseFloat(e.target.value) || 0 })} className={`w-full bg-[#f8fafc] border border-slate-100 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/10 ` + (calcInputs.fixedMonthlyCosts === 0 ? 'text-rose-600 font-bold' : 'text-slate-700')} /></div></div>
                                    <div><label className="block text-sm font-medium text-slate-500 mb-2 uppercase tracking-wider text-[10px]">Horas produtivas no mês</label><input type="number" value={calcInputs.productiveHoursMonth} onChange={(e) => setCalcInputs({ ...calcInputs, productiveHoursMonth: parseFloat(e.target.value) || 1 })} className={`w-full bg-[#f8fafc] border border-slate-100 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/10 ` + (calcInputs.productiveHoursMonth === 0 ? 'text-rose-600 font-bold' : 'text-slate-700')} /></div>
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-2"><label className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider text-[10px]"><Percent className="w-3 h-3" /> Margem de Lucro</label><span className="text-xs font-black text-sky-500">{calcInputs.profitMargin}%</span></div>
                                    <input type="range" min="0" max="300" step="5" value={calcInputs.profitMargin} onChange={(e) => setCalcInputs({ ...calcInputs, profitMargin: parseInt(e.target.value) })} className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-sky-500" />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Machine Maintenance */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-all hover:border-rose-100">
                        <button onClick={() => toggleSection('machine')} className="w-full flex items-center justify-between p-6 hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-3"><Wrench className="w-5 h-5 text-rose-500" /><span className="font-bold text-slate-800">Manutenção da Impressora</span></div>
                            {expandedSections.machine ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                        </button>
                        {expandedSections.machine && (
                            <div className="px-6 pb-8 space-y-6 animate-in slide-in-from-top-2 duration-200">
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="block text-sm font-medium text-slate-500 mb-2 uppercase tracking-wider text-[10px]">Vida útil da máquina (horas)</label><div className="relative"><Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" /><input type="number" value={calcInputs.printerLifespan} onChange={(e) => setCalcInputs({ ...calcInputs, printerLifespan: parseFloat(e.target.value) || 0 })} className={`w-full bg-[#f8fafc] border border-slate-100 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-rose-500/10 ` + (calcInputs.printerLifespan === 0 ? 'text-rose-600 font-bold' : 'text-slate-700')} /></div></div>
                                    <div><label className="block text-sm font-medium text-slate-500 mb-2 uppercase tracking-wider text-[10px]">Orçamento manutenção (R$)</label><div className="relative"><DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" /><input type="number" step="0.01" value={calcInputs.maintenanceBudget} onChange={(e) => setCalcInputs({ ...calcInputs, maintenanceBudget: parseFloat(e.target.value) || 0 })} className={`w-full bg-[#f8fafc] border border-slate-100 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-rose-500/10 ` + (calcInputs.maintenanceBudget === 0 ? 'text-rose-600 font-bold' : 'text-slate-700')} /></div></div>
                                </div>
                                <div className="p-4 bg-rose-50/30 rounded-xl border border-rose-50"><p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-1">Custo de Manutenção / Hora</p><p className="text-xl font-black text-rose-600">{formatCurrency(calcResults.hourlyMaintenanceRate)}</p></div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Cost Analysis Sidebar */}
                <div className="lg:col-span-5 space-y-6 sticky top-8">
                    <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 p-8 space-y-8">
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">Análise de Custos</h3>
                        <div className="space-y-5">
                            {[
                                { label: 'Custo do filamento', value: calcResults.materialCost, color: 'bg-amber-500' },
                                { label: 'Custo de energia', value: calcResults.energyCost, color: 'bg-yellow-400' },
                                { label: 'Custo de mão de obra', value: calcResults.laborCost, color: 'bg-indigo-500' },
                                { label: 'Custo fixo rateado', value: calcResults.fixedRateCost, color: 'bg-sky-400' },
                                { label: 'Custo de manutenção', value: calcResults.maintenanceCost, color: 'bg-rose-500' }
                            ].map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-10 rounded-full ${item.color} transition-all group-hover:w-3`}></div>
                                        <span className="text-sm font-bold text-slate-500">{item.label}</span>
                                    </div>
                                    <span className="text-lg font-black text-slate-900">{formatCurrency(item.value)}</span>
                                </div>
                            ))}
                        </div>

                        <div className="pt-8 border-t border-slate-50 space-y-6">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Custo de Produção</span>
                                <span className="text-2xl font-black text-slate-900">{formatCurrency(calcResults.subtotal)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Margem ({calcInputs.profitMargin}%)</span>
                                <span className="text-lg font-black text-emerald-500">+ {formatCurrency(calcResults.profit)}</span>
                            </div>

                            <div className="bg-emerald-500 rounded-3xl p-8 flex flex-col items-center justify-center gap-2 transform transition-transform hover:scale-[1.02] shadow-lg shadow-emerald-200">
                                <span className="text-xs font-black text-emerald-100 uppercase tracking-[0.3em]">Preço Final Sugerido</span>
                                <span className="text-5xl font-black text-white">{formatCurrency(calcResults.total)}</span>
                            </div>

                            <button
                                onClick={() => {
                                    onAddToOrders({
                                        ...EMPTY_ORDER,
                                        unitValue: Number(calcResults.total.toFixed(2)),
                                        unitCost: Number(calcResults.subtotal.toFixed(2)),
                                        weight: calcInputs.partWeight,
                                        time: calcInputs.printingTime,
                                        powerConsumption: Number((calcInputs.printingTime * calcInputs.printerConsumption).toFixed(3)),
                                        laborTime: calcInputs.laborTimeSpent
                                    });
                                }}
                                className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-3 shadow-xl shadow-slate-200"
                            >
                                <Plus size={20} />
                                Adicionar aos Pedidos
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

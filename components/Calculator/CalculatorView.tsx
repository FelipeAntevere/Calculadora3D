import React, { useState } from 'react';
import {
    Save,
    RefreshCw,
    Download,
    FileText,
    Clock,
    Zap,
    Percent,
    Briefcase,
    Wrench,
    DollarSign,
    Plus,
    ChevronDown,
    ChevronUp,
    CheckCircle2
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { PricingCalculatorInputs, Order } from '../../types';
import { useToast } from '../../contexts/ToastContext';

interface CalculatorViewProps {
    calcInputs: PricingCalculatorInputs;
    setCalcInputs: (inputs: PricingCalculatorInputs) => void;
    calcResults: any;
    handleSaveDefaults: () => void;
    handleLoadDefaults: () => boolean;
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
    handleLoadDefaults,
    handleResetInputs,
    handleClearSavedDefaults,
    handleGenerateSummary,
    onAddToOrders,
    EMPTY_ORDER
}) => {
    // Local state for immediate input feedback
    const [localInputs, setLocalInputs] = useState<PricingCalculatorInputs>(calcInputs);
    const { showToast } = useToast();

    // Sync local state when props change externally (Load/Reset)
    React.useEffect(() => {
        if (JSON.stringify(calcInputs) !== JSON.stringify(localInputs)) {
            setLocalInputs(calcInputs);
        }
    }, [calcInputs]);

    // Debounce updates to parent state
    React.useEffect(() => {
        const timer = setTimeout(() => {
            if (JSON.stringify(calcInputs) !== JSON.stringify(localInputs)) {
                setCalcInputs(localInputs);
            }
        }, 100);

        return () => clearTimeout(timer);
    }, [localInputs]);


    const [expandedSections, setExpandedSections] = useState({
        piece: true,
        material: true,
        labor: true,
        machine: true
    });

    const onSaveDefaults = () => {
        handleSaveDefaults();
        showToast("Padrão atualizado com sucesso!", "success");
    };

    const onLoadDefaults = () => {
        const success = handleLoadDefaults();
        if (success) {
            showToast("Configurações restauradas com sucesso!", "success");
        } else {
            showToast("Nenhum padrão encontrado!", "info");
        }
    };

    const toggleSection = (section: keyof typeof expandedSections) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <h2 className="text-3xl font-extrabold text-[#0f172a] dark:text-white tracking-tight">Calculadora</h2>
                    <p className="text-slate-500 text-sm font-medium">Os valores calculados aqui serão os usados no Dashboard ao salvar.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={onSaveDefaults}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                    >
                        <Save className="w-4 h-4" />
                        Salvar Padrão
                    </button>
                    <button
                        onClick={onLoadDefaults}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/30 transition-all border-sky-100 dark:border-sky-900/50"
                        title="Carrega as últimas configurações salvas"
                    >
                        <RefreshCw className="w-4 h-4 transform rotate-180" />
                        Carregar Salvo
                    </button>
                    <button
                        onClick={handleResetInputs}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                        title="Limpa apenas o tempo e peso da peça atual"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Limpar Dados
                    </button>

                    <button onClick={handleGenerateSummary} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
                        <FileText className="w-4 h-4" />
                        Gerar Resumo
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative">
                <div className="lg:col-span-7 space-y-6">
                    {/* Piece Details */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden transition-all hover:border-sky-100 dark:hover:border-sky-900">
                        <button onClick={() => toggleSection('piece')} className="w-full flex items-center justify-between p-6 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors">
                            <div className="flex items-center gap-3"><Clock className="w-5 h-5 text-sky-500" /><span className="font-bold text-slate-800 dark:text-slate-200">Detalhes da Peça</span></div>
                            {expandedSections.piece ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                        </button>
                        {expandedSections.piece && (
                            <div className="px-6 pb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-top-2 duration-200">
                                <div>
                                    <label className="block text-sm font-medium text-slate-500 mb-2 uppercase tracking-wider text-[10px]">Tipo de Material</label>
                                    <select
                                        value={localInputs.materialType || 'PLA'}
                                        onChange={(e) => setLocalInputs({ ...localInputs, materialType: e.target.value })}
                                        className="w-full bg-[#f8fafc] dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-sky-500/10 text-slate-700 dark:text-slate-200 cursor-pointer"
                                    >
                                        <option value="PLA">PLA</option>
                                        <option value="PLA Silk">PLA Silk</option>
                                        <option value="ABS">ABS</option>
                                        <option value="PETG">PETG</option>
                                        <option value="TPU">TPU</option>
                                        <option value="ASA">ASA</option>
                                        <option value="Nylon">Nylon</option>
                                        <option value="Resina">Resina</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-500 mb-2 uppercase tracking-wider text-[10px]">Tempo de impressão</label>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 relative">
                                            <input
                                                type="number"
                                                min="0"
                                                value={Math.floor(localInputs.printingTime || 0) || ''}
                                                onChange={(e) => {
                                                    const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                                                    const h = isNaN(val) ? 0 : val;
                                                    const currentM = Math.round(((localInputs.printingTime || 0) - Math.floor(localInputs.printingTime || 0)) * 60);
                                                    setLocalInputs({ ...localInputs, printingTime: h + (currentM / 60) });
                                                }}
                                                className="w-full bg-[#f8fafc] dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-sky-500/10 text-slate-700 dark:text-slate-200 hide-spin-buttons"
                                                placeholder="0"
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">h</span>
                                        </div>
                                        <div className="flex-1 relative">
                                            <input
                                                type="number"
                                                min="0"
                                                max="59"
                                                value={Math.round(((localInputs.printingTime || 0) - Math.floor(localInputs.printingTime || 0)) * 60) || ''}
                                                onChange={(e) => {
                                                    const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                                                    const m = Math.min(59, Math.max(0, isNaN(val) ? 0 : val));
                                                    const h = Math.floor(localInputs.printingTime || 0);
                                                    setLocalInputs({ ...localInputs, printingTime: h + (m / 60) });
                                                }}
                                                className="w-full bg-[#f8fafc] dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-sky-500/10 text-slate-700 dark:text-slate-200 hide-spin-buttons"
                                                placeholder="0"
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">min</span>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-500 mb-2 uppercase tracking-wider text-[10px]">Peso da peça (gramas)</label>
                                    <input
                                        type="number"
                                        value={localInputs.partWeight || ''}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val === '') {
                                                setLocalInputs({ ...localInputs, partWeight: 0 });
                                            } else {
                                                setLocalInputs({ ...localInputs, partWeight: parseFloat(val) });
                                            }
                                        }}
                                        className={`w-full bg-[#f8fafc] dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-sky-500/10 ` + (localInputs.partWeight === 0 ? 'text-slate-400 font-normal' : 'text-slate-700 dark:text-slate-200')}
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Material and Energy */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden transition-all hover:border-amber-100 dark:hover:border-amber-900">
                        <button onClick={() => toggleSection('material')} className="w-full flex items-center justify-between p-6 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors">
                            <div className="flex items-center gap-3"><Zap className="w-5 h-5 text-amber-500" /><span className="font-bold text-slate-800 dark:text-slate-200">Material e Energia</span></div>
                            {expandedSections.material ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                        </button>
                        {expandedSections.material && (
                            <div className="px-6 pb-8 space-y-6 animate-in slide-in-from-top-2 duration-200">
                                <div className="grid grid-cols-2 gap-6">
                                    <div><label className="block text-sm font-medium text-slate-500 mb-2 uppercase tracking-wider text-[10px]">Custo do filamento por kg</label>
                                        <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">R$</span><input type="number" value={localInputs.filamentCostPerKg || ''} onChange={(e) => setLocalInputs({ ...localInputs, filamentCostPerKg: parseFloat(e.target.value) || 0 })} className={`w-full bg-[#f8fafc] dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-amber-500/10 ` + (localInputs.filamentCostPerKg === 0 ? 'text-slate-400 font-normal' : 'text-slate-700 dark:text-slate-200')} placeholder="0.00" /></div>
                                    </div>
                                    <div><label className="block text-sm font-medium text-slate-500 mb-2 uppercase tracking-wider text-[10px]">Consumo da impressora (kWh/h)</label><input type="number" step="0.01" value={localInputs.printerConsumption || ''} onChange={(e) => setLocalInputs({ ...localInputs, printerConsumption: parseFloat(e.target.value) || 0 })} className={`w-full bg-[#f8fafc] dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-amber-500/10 ` + (localInputs.printerConsumption === 0 ? 'text-slate-400 font-normal' : 'text-slate-700 dark:text-slate-200')} placeholder="0.15" /></div>
                                    <div><label className="block text-sm font-medium text-slate-500 mb-2 uppercase tracking-wider text-[10px]">Custo do kWh</label><div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">R$</span><input type="number" step="0.01" value={localInputs.kWhCost || ''} onChange={(e) => setLocalInputs({ ...localInputs, kWhCost: parseFloat(e.target.value) || 0 })} className={`w-full bg-[#f8fafc] dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-amber-500/10 ` + (localInputs.kWhCost === 0 ? 'text-slate-400 font-normal' : 'text-slate-700 dark:text-slate-200')} placeholder="0.70" /></div></div>
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-2"><label className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[10px]"><Percent className="w-3 h-3" /> Perda de Filamento</label><span className="text-xs font-black text-sky-500">{localInputs.filamentLossPercentage}%</span></div>
                                    <input type="range" min="0" max="30" step="1" value={localInputs.filamentLossPercentage} onChange={(e) => setLocalInputs({ ...localInputs, filamentLossPercentage: parseInt(e.target.value) })} className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500" />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Labor and Business */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden transition-all hover:border-indigo-100 dark:hover:border-indigo-900">
                        <button onClick={() => toggleSection('labor')} className="w-full flex items-center justify-between p-6 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors">
                            <div className="flex items-center gap-3"><Briefcase className="w-5 h-5 text-indigo-500" /><span className="font-bold text-slate-800 dark:text-slate-200">Mão de Obra e Negócio</span></div>
                            {expandedSections.labor ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                        </button>
                        {expandedSections.labor && (
                            <div className="px-6 pb-8 space-y-6 animate-in slide-in-from-top-2 duration-200">
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-500 mb-2 uppercase tracking-wider text-[10px]">Valor da sua hora de trabalho</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">R$</span>
                                            <input type="number" value={localInputs.laborHourValue || ''} onChange={(e) => setLocalInputs({ ...localInputs, laborHourValue: parseFloat(e.target.value) || 0 })} className={`w-full bg-[#f8fafc] dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/10 ` + (localInputs.laborHourValue === 0 ? 'text-slate-400 font-normal' : 'text-slate-700 dark:text-slate-200')} placeholder="0.00" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-500 mb-2 uppercase tracking-wider text-[10px]">Horas de trabalho manual</label>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 relative">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={Math.floor(localInputs.laborTimeSpent || 0) || ''}
                                                    onChange={(e) => {
                                                        const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                                                        const h = isNaN(val) ? 0 : val;
                                                        const currentM = Math.round(((localInputs.laborTimeSpent || 0) - Math.floor(localInputs.laborTimeSpent || 0)) * 60);
                                                        setLocalInputs({ ...localInputs, laborTimeSpent: h + (currentM / 60) });
                                                    }}
                                                    className="w-full bg-[#f8fafc] dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/10 text-slate-700 dark:text-slate-200 hide-spin-buttons"
                                                    placeholder="0"
                                                />
                                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">h</span>
                                            </div>
                                            <div className="flex-1 relative">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="59"
                                                    value={Math.round(((localInputs.laborTimeSpent || 0) - Math.floor(localInputs.laborTimeSpent || 0)) * 60) || ''}
                                                    onChange={(e) => {
                                                        const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                                                        const m = Math.min(59, Math.max(0, isNaN(val) ? 0 : val));
                                                        const h = Math.floor(localInputs.laborTimeSpent || 0);
                                                        setLocalInputs({ ...localInputs, laborTimeSpent: h + (m / 60) });
                                                    }}
                                                    className="w-full bg-[#f8fafc] dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/10 text-slate-700 dark:text-slate-200 hide-spin-buttons"
                                                    placeholder="0"
                                                />
                                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">min</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div><label className="block text-sm font-medium text-slate-500 mb-2 uppercase tracking-wider text-[10px]">Custos fixos mensais</label><div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">R$</span><input type="number" value={localInputs.fixedMonthlyCosts || ''} onChange={(e) => setLocalInputs({ ...localInputs, fixedMonthlyCosts: parseFloat(e.target.value) || 0 })} className={`w-full bg-[#f8fafc] dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/10 ` + (localInputs.fixedMonthlyCosts === 0 ? 'text-slate-400 font-normal' : 'text-slate-700 dark:text-slate-200')} placeholder="0.00" /></div></div>
                                    <div><label className="block text-sm font-medium text-slate-500 mb-2 uppercase tracking-wider text-[10px]">Horas produtivas no mês</label><input type="number" value={localInputs.productiveHoursMonth || ''} onChange={(e) => setLocalInputs({ ...localInputs, productiveHoursMonth: parseFloat(e.target.value) || 0 })} className={`w-full bg-[#f8fafc] dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/10 ` + (localInputs.productiveHoursMonth === 0 ? 'text-slate-400 font-normal' : 'text-slate-700 dark:text-slate-200')} placeholder="160" /></div>
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-2"><label className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[10px]"><Percent className="w-3 h-3" /> Margem de Lucro</label><span className="text-xs font-black text-sky-500">{localInputs.profitMargin}%</span></div>
                                    <input type="range" min="0" max="300" step="5" value={localInputs.profitMargin} onChange={(e) => setLocalInputs({ ...localInputs, profitMargin: parseInt(e.target.value) })} className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500" />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Machine Maintenance */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden transition-all hover:border-rose-100 dark:hover:border-rose-900">
                        <button onClick={() => toggleSection('machine')} className="w-full flex items-center justify-between p-6 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors">
                            <div className="flex items-center gap-3"><Wrench className="w-5 h-5 text-rose-500" /><span className="font-bold text-slate-800 dark:text-slate-200">Manutenção da Impressora</span></div>
                            {expandedSections.machine ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                        </button>
                        {expandedSections.machine && (
                            <div className="px-6 pb-8 space-y-6 animate-in slide-in-from-top-2 duration-200">
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="block text-sm font-medium text-slate-500 mb-2 uppercase tracking-wider text-[10px]">Vida útil da máquina (horas)</label><div className="relative"><Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" /><input type="number" value={localInputs.printerLifespan || ''} onChange={(e) => setLocalInputs({ ...localInputs, printerLifespan: parseFloat(e.target.value) || 0 })} className={`w-full bg-[#f8fafc] dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-rose-500/10 ` + (localInputs.printerLifespan === 0 ? 'text-slate-400 font-normal' : 'text-slate-700 dark:text-slate-200')} placeholder="2000" /></div></div>
                                    <div><label className="block text-sm font-medium text-slate-500 mb-2 uppercase tracking-wider text-[10px]">Orçamento manutenção (R$)</label><div className="relative"><DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" /><input type="number" step="0.01" value={localInputs.maintenanceBudget || ''} onChange={(e) => setLocalInputs({ ...localInputs, maintenanceBudget: parseFloat(e.target.value) || 0 })} className={`w-full bg-[#f8fafc] dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-rose-500/10 ` + (localInputs.maintenanceBudget === 0 ? 'text-slate-400 font-normal' : 'text-slate-700 dark:text-slate-200')} placeholder="0.00" /></div></div>
                                </div>
                                <div className="p-4 bg-rose-50/30 rounded-xl border border-rose-50"><p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-1">Custo de Manutenção / Hora</p><p className="text-xl font-black text-rose-600">{formatCurrency(calcResults.hourlyMaintenanceRate)}</p></div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Cost Analysis Sidebar */}
                <div className="lg:col-span-5 space-y-6 sticky top-8">
                    <div className="bg-white dark:bg-slate-800 rounded-[32px] border border-slate-100 dark:border-slate-700 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 p-8 space-y-8">
                        <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Análise de Custos</h3>
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
                                        <span className="text-sm font-bold text-slate-500 dark:text-slate-400">{item.label}</span>
                                    </div>
                                    <span className="text-lg font-black text-slate-900 dark:text-white">{formatCurrency(item.value)}</span>
                                </div>
                            ))}
                        </div>

                        <div className="pt-6 border-t border-slate-100 dark:border-slate-700 space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Custo Prod.</span>
                                <span className="text-lg font-bold text-slate-700 dark:text-slate-300">{formatCurrency(calcResults.subtotal)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Margem ({localInputs.profitMargin}%)</span>
                                <span className="text-lg font-bold text-emerald-600">+ {formatCurrency(calcResults.profit)}</span>
                            </div>

                            <div className="bg-emerald-50/50 rounded-2xl p-6 border border-emerald-100 flex flex-col items-center justify-center gap-1 mt-4 group transition-all hover:border-emerald-200 hover:shadow-sm hover:shadow-emerald-100/50">
                                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em]">Preço Final Sugerido</span>
                                <span className="text-4xl font-black text-emerald-600 tracking-tight">{formatCurrency(calcResults.total)}</span>
                            </div>

                            <button
                                onClick={() => {
                                    onAddToOrders({
                                        ...EMPTY_ORDER,
                                        material: localInputs.materialType || 'PLA',
                                        unitValue: Number(calcResults.total.toFixed(2)),
                                        unitCost: Number(calcResults.subtotal.toFixed(2)),
                                        weight: localInputs.partWeight,
                                        time: localInputs.printingTime,
                                        powerConsumption: Number((localInputs.printingTime * localInputs.printerConsumption).toFixed(3)),
                                        laborTime: localInputs.laborTimeSpent,
                                        materialCost: Number(calcResults.materialCost.toFixed(2))
                                    });
                                }}
                                className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-3 shadow-lg shadow-slate-200 active:scale-[0.98]"
                            >
                                <Plus size={18} />
                                Adicionar aos Pedidos
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

import React from 'react';
import { Columns, Calendar, TrendingUp } from 'lucide-react';
import { MONTH_NAMES } from '../../constants';

interface ComparisonBannerProps {
    isComparing: boolean;
    onToggleCompare: (value: boolean) => void;
    compYear: number;
    compMonth: number;
    onYearChange: (year: number) => void;
    onMonthChange: (month: number) => void;
    availableYears: number[];
    compStartDate?: string;
    setCompStartDate?: (date: string) => void;
    compEndDate?: string;
    setCompEndDate?: (date: string) => void;
    variations?: {
        revenue: number;
        orders: number;
        profit: number;
        ticket: number;
        printingHours: number;
        materialCost: number;
    } | null;
}

/**
 * Banner to control and configure the dashboard comparison feature
 */
export const ComparisonBanner: React.FC<ComparisonBannerProps> = ({
    isComparing,
    onToggleCompare,
    compYear,
    compMonth,
    onYearChange,
    onMonthChange,
    availableYears,
    compStartDate,
    setCompStartDate,
    compEndDate,
    setCompEndDate,
    variations
}) => {

    // Check if dates are selected
    const hasDatesSelected = compStartDate && compEndDate;

    const formatVariation = (value: number) => {
        const sign = value > 0 ? '+' : '';
        return `${sign}${value.toFixed(1)}%`;
    };

    const getVariationColor = (value: number, inverse = false) => {
        if (value === 0) return 'text-slate-500';
        if (inverse) return value > 0 ? 'text-rose-600' : 'text-emerald-600';
        return value > 0 ? 'text-emerald-600' : 'text-rose-600';
    };

    return (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-8 shadow-sm transition-all duration-300">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">

                {/* Left side: Icon + Title */}
                <div className="flex items-start gap-4 flex-1">
                    <div className={`p-3 rounded-full transition-colors ${isComparing ? 'bg-sky-100 text-sky-600' : 'bg-slate-100 text-slate-400'}`}>
                        <Columns size={24} />
                    </div>
                    <div className="flex-1">
                        <h4 className="text-base font-bold text-slate-800">Comparação de Período</h4>
                        <p className="text-sm text-slate-500 mb-3">
                            {!isComparing
                                ? "Ative para comparar seu desempenho com outro intervalo."
                                : "Selecione as datas para visualizar o comparativo."
                            }
                        </p>

                        {/* Comparison Results - Simplified */}
                        {isComparing && hasDatesSelected && variations && (
                            <div className="mt-2 animate-in fade-in slide-in-from-top-2 flex items-center gap-3">
                                <div className={`px-3 py-1.5 rounded-lg border text-sm font-bold flex items-center gap-2 ${variations.profit >= 0
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                    : 'bg-rose-50 text-rose-700 border-rose-100'
                                    }`}>
                                    {variations.profit >= 0 ? (
                                        <TrendingUp size={16} />
                                    ) : (
                                        <TrendingUp size={16} className="rotate-180" />
                                    )}
                                    {variations.profit >= 0 ? 'Desempenho Positivo' : 'Desempenho Negativo'}
                                    <span className="opacity-75">
                                        ({formatVariation(variations.profit)})
                                    </span>
                                </div>
                                <span className="text-xs text-slate-400 font-medium">
                                    em relação ao período atual
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right side: Actions */}
                <div className="flex flex-col items-end gap-3">
                    {!isComparing ? (
                        <button
                            onClick={() => onToggleCompare(true)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-sky-50 text-sky-600 border border-sky-100 rounded-xl text-sm font-bold hover:bg-sky-100 transition-colors"
                        >
                            Ativar Comparação
                        </button>
                    ) : (
                        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 animate-in slide-in-from-right-4">

                            {/* Date Inputs */}
                            <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                                <div className="relative">
                                    <input
                                        type="date"
                                        value={compStartDate || ''}
                                        onChange={(e) => setCompStartDate && setCompStartDate(e.target.value)}
                                        className="bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-sky-500 outline-none"
                                    />
                                    <span className="absolute -top-2 left-2 bg-slate-50 text-[9px] font-bold text-slate-400 px-1">Início</span>
                                </div>
                                <span className="text-slate-300 font-bold">-</span>
                                <div className="relative">
                                    <input
                                        type="date"
                                        value={compEndDate || ''}
                                        onChange={(e) => setCompEndDate && setCompEndDate(e.target.value)}
                                        className="bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-sky-500 outline-none"
                                    />
                                    <span className="absolute -top-2 left-2 bg-slate-50 text-[9px] font-bold text-slate-400 px-1">Fim</span>
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    onToggleCompare(false);
                                    if (setCompStartDate) setCompStartDate('');
                                    if (setCompEndDate) setCompEndDate('');
                                }}
                                className="text-xs font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-50 px-3 py-2 rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

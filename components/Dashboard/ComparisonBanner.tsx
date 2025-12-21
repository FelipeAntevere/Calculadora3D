import React from 'react';
import { Columns, Calendar } from 'lucide-react';
import { MONTH_NAMES } from '../../constants';

interface ComparisonBannerProps {
    isComparing: boolean;
    onToggleCompare: (value: boolean) => void;
    compYear: number;
    compMonth: number;
    onYearChange: (year: number) => void;
    onMonthChange: (month: number) => void;
    availableYears: number[];
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
    availableYears
}) => {
    return (
        <div className="bg-sky-50 border border-sky-100 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
                <div className="bg-sky-500 p-2 rounded-xl text-white shadow-sm">
                    <Columns size={20} />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-slate-800">Comparação de Período</h4>
                    <p className="text-xs text-slate-500 font-medium whitespace-nowrap">Compare seu desempenho com outros meses ou anos.</p>
                </div>
            </div>

            <div className="flex items-center gap-4">
                {!isComparing ? (
                    <button
                        onClick={() => onToggleCompare(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white border border-sky-200 text-sky-600 rounded-xl text-sm font-bold hover:bg-sky-500 hover:text-white transition-all shadow-sm"
                    >
                        Ativar Comparação
                    </button>
                ) : (
                    <div className="flex items-center gap-3 animate-in slide-in-from-right-4">
                        <div className="flex items-center bg-white border border-sky-200 rounded-xl overflow-hidden shadow-sm">
                            <div className="flex items-center px-3 border-r border-sky-50 text-sky-500 bg-sky-50/30">
                                <Calendar size={14} />
                            </div>
                            <select
                                value={compMonth}
                                onChange={(e) => onMonthChange(Number(e.target.value))}
                                className="bg-transparent text-xs font-bold p-2 focus:outline-none cursor-pointer"
                            >
                                {MONTH_NAMES.map((name, index) => (
                                    <option key={name} value={index}>{name}</option>
                                ))}
                            </select>
                            <select
                                value={compYear}
                                onChange={(e) => onYearChange(Number(e.target.value))}
                                className="bg-transparent text-xs font-bold p-2 focus:outline-none cursor-pointer border-l border-sky-50"
                            >
                                {availableYears.map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        </div>
                        <button
                            onClick={() => onToggleCompare(false)}
                            className="text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors px-2"
                        >
                            Cancelar
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

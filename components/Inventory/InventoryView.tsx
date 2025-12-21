import React from 'react';
import {
    Plus,
    Edit2,
    Trash2,
    Database,
    Layers,
    Copy
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Filament } from '../../types';

const COLOR_MAP: Record<string, string> = {
    'Preto': '#0f172a',
    'Branco': '#ffffff',
    'Cinza': '#64748b',
    'Vermelho': '#ef4444',
    'Azul': '#3b82f6',
    'Verde': '#22c55e',
    'Amarelo': '#eab308',
    'Laranja': '#f97316',
    'Roxo': '#a855f7',
    'Rosa': '#ec4899',
    'Marrom': '#78350f',
    'Cobre': '#b45309',
    'Prata': '#94a3b8',
    'Ouro': '#fbbf24',
    'Translúcido': '#e2e8f0',
    'Natural': '#f8fafc'
};

const getDisplayColor = (color: string) => {
    return COLOR_MAP[color] || color;
};

interface InventoryViewProps {
    filaments: Filament[];
    colorFilter: string;
    setColorFilter: (color: string) => void;
    colorOptions: string[];
    totalItems: number;
    totalKg: number;
    onNewFilament: () => void;
    handleEditFilament: (filament: Filament) => void;
    handleDuplicateFilament: (filament: Filament) => void;
    deleteFilamentHandler: (id: string) => void;
    getProgressColor: (percentage: number) => string;
}

/**
 * Filament Inventory View Component
 * Tracks stock levels, materials, and provides management actions.
 */
export const InventoryView: React.FC<InventoryViewProps> = ({
    filaments,
    colorFilter,
    setColorFilter,
    colorOptions,
    totalItems,
    totalKg,
    onNewFilament,
    handleEditFilament,
    handleDuplicateFilament,
    deleteFilamentHandler,
    getProgressColor
}) => {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <h2 className="text-2xl font-bold text-[#0f172a] tracking-tight">Estoque de Filamento</h2>
                    <p className="text-slate-500 text-sm font-medium">Gerencie seu inventário de materiais e acompanhe custos.</p>
                </div>
                <button
                    onClick={onNewFilament}
                    className="flex items-center gap-2 px-6 py-3 bg-[#0ea5e9] text-white rounded-2xl font-bold hover:bg-sky-400 transition-all shadow-lg shadow-sky-100"
                >
                    <Plus size={20} />
                    Novo Carretel
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-sky-100 transition-all">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Total de Itens</p>
                        <h3 className="text-3xl font-bold text-slate-900">{totalItems} <span className="text-sm text-slate-400 font-bold capitalize">Carretéis</span></h3>
                    </div>
                    <div className="w-16 h-16 bg-sky-50 rounded-2xl flex items-center justify-center text-sky-500 group-hover:scale-110 transition-transform">
                        <Database size={28} />
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-emerald-100 transition-all">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Peso Total em Estoque</p>
                        <h3 className="text-3xl font-bold text-slate-900">{totalKg.toFixed(2)} <span className="text-sm text-slate-400 font-bold capitalize">kg</span></h3>
                    </div>
                    <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                        <Layers size={28} />
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-4">
                <div className="flex items-center gap-2 text-slate-400 mr-2">
                    <Database size={18} />
                    <span className="text-xs font-black uppercase tracking-widest">Filtros</span>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">Cor:</p>
                    <div className="flex flex-wrap gap-2">
                        {['Todos', ...colorOptions].map((color) => (
                            <button
                                key={color}
                                onClick={() => setColorFilter(color)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${colorFilter === color
                                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-200'
                                    : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                                    }`}
                            >
                                {color}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-50 bg-slate-50/30">
                                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] text-center">Filamento</th>
                                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] text-center">Cor</th>
                                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] text-center">Estoque</th>
                                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] text-center">Peso Restante</th>
                                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] text-center">Data Compra</th>
                                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] text-center">Custo Total</th>
                                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filaments.length > 0 ? (
                                filaments.map((filament) => {
                                    const percentage = (filament.currentWeight / filament.initialWeight) * 100;
                                    return (
                                        <tr key={filament.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-5 text-center">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-sm font-semibold text-slate-900">{filament.brand}</span>
                                                    <span className="text-[10px] text-sky-500 font-bold uppercase tracking-widest mt-0.5">{filament.material}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-sm font-bold text-slate-600 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <div
                                                        className="w-3 h-3 rounded-full border border-slate-200 shadow-sm transition-colors"
                                                        style={{ backgroundColor: getDisplayColor(filament.color) }}
                                                    ></div>
                                                    {filament.color}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 w-[250px] text-center">
                                                <div className="flex flex-col gap-2">
                                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-700 ease-out ` + getProgressColor(percentage)}
                                                            style={{ width: `${percentage}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-[10px] font-bold text-slate-400 text-right uppercase tracking-widest">{Math.round(percentage)}% disponível</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <p className="text-sm font-semibold text-slate-900">
                                                    {filament.currentWeight.toFixed(2)} <span className="text-[10px] text-slate-400 font-medium">/ {filament.initialWeight.toFixed(1)} kg</span>
                                                </p>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <p className="text-sm font-bold text-slate-600">
                                                    {formatDate(filament.purchaseDate || '')}
                                                </p>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-semibold text-slate-900">{formatCurrency(filament.costPerKg + filament.freight)}</span>
                                                    <span className="text-[10px] text-slate-400 font-medium italic">({formatCurrency(filament.costPerKg)}/kg + {formatCurrency(filament.freight)} Frete)</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <div className="flex justify-center items-center gap-1">
                                                    <button onClick={() => handleEditFilament(filament)} className="p-2.5 text-slate-400 hover:text-sky-500 hover:bg-sky-50 rounded-xl transition-all" title="Editar"><Edit2 size={16} /></button>
                                                    <button onClick={() => handleDuplicateFilament(filament)} className="p-2.5 text-slate-400 hover:text-[#0ea5e9] hover:bg-sky-50 rounded-xl transition-all" title="Duplicar"><Copy size={16} /></button>
                                                    <button onClick={() => deleteFilamentHandler(filament.id)} className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all" title="Excluir"><Trash2 size={16} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={6} className="py-24 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="bg-slate-50 p-4 rounded-full text-slate-300">
                                                <Layers size={40} />
                                            </div>
                                            <p className="text-slate-400 text-sm font-bold italic uppercase tracking-widest">Nenhum filamento em estoque</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

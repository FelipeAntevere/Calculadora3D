import React from 'react';
import {
    Plus,
    Edit2,
    Trash2,
    Wrench,
    Copy,
    Database,
    AlertTriangle,
    CheckCircle
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { ReplacementPart } from '../../types';

interface PartsViewProps {
    replacementParts: ReplacementPart[];
    onNewPart: () => void;
    handleEditPart: (part: ReplacementPart) => void;
    deletePartHandler: (id: string) => void;
    duplicatePartHandler: (part: ReplacementPart) => void;
}

/**
 * Replacement Parts View Component
 * Manages the inventory of printer components and maintenance parts.
 */
export const PartsView: React.FC<PartsViewProps> = ({
    replacementParts,
    onNewPart,
    handleEditPart,
    deletePartHandler,
    duplicatePartHandler
}) => {
    const [categoryFilter, setCategoryFilter] = React.useState('Todos');

    const categoryOptions = [
        'Bico (Nozzle)',
        'Mesa (Bed)',
        'Correia',
        'Ventilador',
        'Sensor',
        'Extrusora',
        'Eletrônica',
        'Outros'
    ];

    const filteredParts = categoryFilter === 'Todos'
        ? replacementParts
        : replacementParts.filter(part => part.category === categoryFilter);

    const totalPartsCount = filteredParts.reduce((acc, part) => acc + part.quantity, 0);
    const lowStockCount = filteredParts.filter(part => part.quantity <= 1).length;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <h2 className="text-2xl font-bold text-[#0f172a] tracking-tight">Peças de Reposição</h2>
                    <p className="text-slate-500 text-sm font-medium">Controle seu estoque de bicos e outros componentes.</p>
                </div>
                <button
                    onClick={onNewPart}
                    className="flex items-center gap-2 px-6 py-3 bg-[#0ea5e9] text-white rounded-2xl font-bold hover:bg-sky-400 transition-all shadow-lg shadow-sky-100"
                >
                    <Plus size={20} />
                    Nova Peça
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-sky-100 transition-all">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Total de Itens</p>
                        <h3 className="text-3xl font-bold text-slate-900">{totalPartsCount} <span className="text-sm text-slate-400 font-bold capitalize">Unidades</span></h3>
                    </div>
                    <div className="w-16 h-16 bg-sky-50 rounded-2xl flex items-center justify-center text-sky-500 group-hover:scale-110 transition-transform">
                        <Wrench size={28} />
                    </div>
                </div>

                <div className={`p-6 rounded-[32px] border shadow-sm flex flex-col justify-between transition-all ${lowStockCount > 0 ? 'bg-white border-rose-100 hover:border-rose-200' : 'bg-white border-emerald-100 hover:border-emerald-200'}`}>
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <p className={`text-[10px] font-bold uppercase tracking-[0.2em] mb-1 ${lowStockCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                {lowStockCount > 0 ? 'Repor Imediatamente' : 'Estoque Saudável'}
                            </p>
                            {lowStockCount > 0 ? (
                                <div className="space-y-1">
                                    {filteredParts.filter(p => p.quantity <= 1).slice(0, 3).map(part => (
                                        <div key={part.id} className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                            {part.name} <span className="text-rose-500 text-xs">({part.quantity} un)</span>
                                        </div>
                                    ))}
                                    {lowStockCount > 3 && (
                                        <p className="text-xs text-rose-500 font-bold pl-3.5">+ outros {lowStockCount - 3} itens</p>
                                    )}
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 mt-2">
                                    <h3 className="text-xl font-bold text-emerald-600">Tudo em dia!</h3>
                                </div>
                            )}
                        </div>
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${lowStockCount > 0 ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'}`}>
                            {lowStockCount > 0 ? <AlertTriangle size={24} /> : <CheckCircle size={24} />}
                        </div>
                    </div>
                    {lowStockCount > 0 && (
                        <div className="mt-2 pt-3 border-t border-rose-50">
                            <p className="text-[10px] text-rose-400 font-semibold text-right">Verificar lista completa</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-4">
                <div className="flex items-center gap-2 text-slate-400 mr-2">
                    <Database size={18} />
                    <span className="text-xs font-black uppercase tracking-widest">Filtros</span>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">Categoria:</p>
                    <div className="flex flex-wrap gap-2">
                        {['Todos', ...categoryOptions].map((category) => (
                            <button
                                key={category}
                                onClick={() => setCategoryFilter(category)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${categoryFilter === category
                                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-200'
                                    : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                                    }`}
                            >
                                {category}
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
                                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] text-center">Componente</th>
                                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] text-center">Categoria</th>
                                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] text-center">Em Estoque</th>
                                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] text-center">Custo Unitário</th>
                                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] text-center">Data Compra</th>
                                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredParts.length > 0 ? (
                                filteredParts.map((part) => (
                                    <tr key={part.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-5 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className="text-sm font-semibold text-slate-900">{part.name}</span>
                                                {part.notes && <span className="text-[10px] text-slate-400 italic font-medium mt-0.5">{part.notes}</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-wider">{part.category}</span>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <span className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${part.quantity <= 1 ? 'bg-rose-50 text-rose-500' : 'bg-slate-100 text-slate-600'
                                                }`}>
                                                {part.quantity} un
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <span className="text-sm font-semibold text-slate-900">{formatCurrency(part.unitCost)}</span>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <span className="text-sm font-semibold text-slate-900">
                                                {part.purchaseDate ? (() => {
                                                    const [year, month, day] = part.purchaseDate.split('-');
                                                    return `${day}/${month}/${year}`;
                                                })() : '-'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <div className="flex justify-center items-center gap-1">
                                                <button onClick={() => duplicatePartHandler(part)} className="p-2.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-xl transition-all shadow-sm active:scale-90"><Copy size={16} /></button>
                                                <button onClick={() => handleEditPart(part)} className="p-2.5 text-slate-400 hover:text-sky-500 hover:bg-sky-50 rounded-xl transition-all shadow-sm active:scale-90"><Edit2 size={16} /></button>
                                                <button onClick={() => deletePartHandler(part.id)} className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all shadow-sm active:scale-90"><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="py-24 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="bg-slate-50 p-4 rounded-full text-slate-300">
                                                <Wrench size={40} />
                                            </div>
                                            <p className="text-slate-400 text-sm font-bold italic uppercase tracking-widest">{categoryFilter === 'Todos' ? 'Nenhuma peça cadastrada' : 'Nenhuma peça nesta categoria'}</p>
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

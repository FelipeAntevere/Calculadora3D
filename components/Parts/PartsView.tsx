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
                    <h2 className="text-2xl font-bold text-[#0f172a] dark:text-white tracking-tight">Peças de Reposição</h2>
                    <p className="text-slate-500 text-sm font-medium">Controle seu estoque de bicos e outros componentes.</p>
                </div>
                <button
                    onClick={onNewPart}
                    className="flex items-center gap-2 px-6 py-3 bg-[#0ea5e9] text-white rounded-2xl font-bold hover:bg-sky-400 transition-all shadow-lg shadow-sky-100 dark:shadow-sky-900/20"
                >
                    <Plus size={20} />
                    Nova Peça
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-800 p-8 rounded-[32px] border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between group hover:border-sky-100 dark:hover:border-sky-900 transition-all">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Total de Itens</p>
                        <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{totalPartsCount} <span className="text-sm text-slate-400 font-bold capitalize">Unidades</span></h3>
                    </div>
                    <div className="w-16 h-16 bg-sky-50 dark:bg-sky-900/30 rounded-2xl flex items-center justify-center text-sky-500 group-hover:scale-110 transition-transform">
                        <Wrench size={28} />
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col md:flex-row items-center gap-4">
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
                                    ? 'bg-slate-900 dark:bg-slate-700 text-white shadow-lg shadow-slate-200 dark:shadow-slate-900/20'
                                    : 'bg-slate-50 dark:bg-slate-750 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                                    }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-[32px] border border-slate-100 dark:border-slate-700 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 overflow-hidden">
                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-50 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-900/50">
                                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] text-center">Componente</th>
                                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] text-center">Categoria</th>
                                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] text-center">Em Estoque</th>
                                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] text-center">Custo Unitário</th>
                                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] text-center">Data Compra</th>
                                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                            {filteredParts.length > 0 ? (
                                filteredParts.map((part) => (
                                    <tr key={part.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-750/50 transition-colors group">
                                        <td className="px-6 py-5 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className="text-sm font-semibold text-slate-900 dark:text-white">{part.name}</span>
                                                {part.notes && <span className="text-[10px] text-slate-400 italic font-medium mt-0.5">{part.notes}</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-750 px-3 py-1 rounded-full uppercase tracking-wider">{part.category}</span>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <span className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${part.quantity <= 1 ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-500' : 'bg-slate-100 dark:bg-slate-750 text-slate-600 dark:text-slate-300'
                                                }`}>
                                                {part.quantity} un
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <span className="text-sm font-semibold text-slate-900 dark:text-white">{formatCurrency(part.unitCost)}</span>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <span className="text-sm font-semibold text-slate-900 dark:text-white">
                                                {part.purchaseDate ? (() => {
                                                    const [year, month, day] = part.purchaseDate.split('-');
                                                    return `${day}/${month}/${year}`;
                                                })() : '-'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <div className="flex justify-center items-center gap-1">
                                                <button onClick={() => duplicatePartHandler(part)} className="p-2.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition-all shadow-sm active:scale-90"><Copy size={16} /></button>
                                                <button onClick={() => handleEditPart(part)} className="p-2.5 text-slate-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-900/30 rounded-xl transition-all shadow-sm active:scale-90"><Edit2 size={16} /></button>
                                                <button onClick={() => deletePartHandler(part.id)} className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl transition-all shadow-sm active:scale-90"><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="py-24 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-full text-slate-300 dark:text-slate-600">
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

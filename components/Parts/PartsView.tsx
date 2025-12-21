import React from 'react';
import {
    Plus,
    Edit2,
    Trash2,
    Wrench
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { ReplacementPart } from '../../types';

interface PartsViewProps {
    replacementParts: ReplacementPart[];
    onNewPart: () => void;
    handleEditPart: (part: ReplacementPart) => void;
    deletePartHandler: (id: string) => void;
}

/**
 * Replacement Parts View Component
 * Manages the inventory of printer components and maintenance parts.
 */
export const PartsView: React.FC<PartsViewProps> = ({
    replacementParts,
    onNewPart,
    handleEditPart,
    deletePartHandler
}) => {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <h2 className="text-3xl font-extrabold text-[#0f172a] tracking-tight">Peças de Reposição</h2>
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

            <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-50 bg-slate-50/30">
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Componente</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Categoria</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Em Estoque</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Custo Unitário</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {replacementParts.length > 0 ? (
                                replacementParts.map((part) => (
                                    <tr key={part.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-slate-900">{part.name}</span>
                                                {part.notes && <span className="text-[10px] text-slate-400 italic font-medium mt-0.5">{part.notes}</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-wider">{part.category}</span>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <span className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all ${part.quantity <= 1 ? 'bg-rose-50 text-rose-500' : 'bg-slate-100 text-slate-600'
                                                }`}>
                                                {part.quantity} un
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="text-sm font-black text-slate-900">{formatCurrency(part.unitCost)}</span>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex justify-end items-center gap-1">
                                                <button onClick={() => handleEditPart(part)} className="p-2.5 text-slate-400 hover:text-sky-500 hover:bg-sky-50 rounded-xl transition-all shadow-sm active:scale-90"><Edit2 size={16} /></button>
                                                <button onClick={() => deletePartHandler(part.id)} className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all shadow-sm active:scale-90"><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="py-24 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="bg-slate-50 p-4 rounded-full text-slate-300">
                                                <Wrench size={40} />
                                            </div>
                                            <p className="text-slate-400 text-sm font-bold italic uppercase tracking-widest">Nenhuma peça cadastrada</p>
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

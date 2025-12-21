import React from 'react';
import { X } from 'lucide-react';
import { ReplacementPart, PartCategory } from '../../types';

interface PartModalProps {
    isOpen: boolean;
    onClose: () => void;
    part: Partial<ReplacementPart>;
    setPart: (part: Partial<ReplacementPart>) => void;
    editingPartId: string | null;
    onSave: () => void;
    categoryOptions: string[];
}

/**
 * Replacement Part Modal Component
 * Handles the form for adding or editing printer components.
 */
export const PartModal: React.FC<PartModalProps> = ({
    isOpen,
    onClose,
    part,
    setPart,
    editingPartId,
    onSave,
    categoryOptions
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                onClick={onClose}
            ></div>
            <div className="relative bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-8 pt-8 pb-4 flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                        <h3 className="text-xl font-black text-slate-800">
                            {editingPartId ? 'Editar Peça' : 'Nova Peça'}
                        </h3>
                        <p className="text-slate-400 text-xs font-medium">Controle seu estoque de componentes.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                <div className="p-8 space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-slate-900 mb-2 uppercase tracking-tight">Nome do Componente</label>
                        <input
                            type="text"
                            placeholder="Ex: Bico 0.4 Hardened Steel"
                            value={part.name || ''}
                            onChange={(e) => setPart({ ...part, name: e.target.value })}
                            className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#0ea5e9]/10 outline-none font-medium text-slate-700 placeholder:text-slate-400"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-900 mb-2 uppercase tracking-tight">Categoria</label>
                            <select
                                value={part.category || 'Outros'}
                                onChange={(e) => setOrder({ ...part, category: e.target.value as PartCategory })}
                                className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#0ea5e9]/10 outline-none font-medium text-slate-600 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m3%205%203%203%203-3%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1rem] bg-[right_1rem_center] bg-no-repeat"
                            >
                                {categoryOptions.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-900 mb-2 uppercase tracking-tight">Quantidade</label>
                            <input
                                type="number"
                                min="0"
                                value={part.quantity || 0}
                                onChange={(e) => setPart({ ...part, quantity: parseInt(e.target.value) || 0 })}
                                className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#0ea5e9]/10 outline-none font-medium text-slate-700"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-900 mb-2 uppercase tracking-tight">Custo Unitário (R$)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={part.unitCost || 0}
                                onChange={(e) => setPart({ ...part, unitCost: parseFloat(e.target.value) || 0 })}
                                className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#0ea5e9]/10 outline-none font-medium text-slate-700"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-900 mb-2 uppercase tracking-tight">Marca (Opcional)</label>
                            <input
                                type="text"
                                placeholder="Ex: Trianglelab"
                                value={part.brand || ''}
                                onChange={(e) => setPart({ ...part, brand: e.target.value })}
                                className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#0ea5e9]/10 outline-none font-medium text-slate-700 placeholder:text-slate-400"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-900 mb-2 uppercase tracking-tight">Observações</label>
                        <textarea
                            rows={2}
                            placeholder="Notas sobre compatibilidade ou link da compra..."
                            value={part.notes || ''}
                            onChange={(e) => setPart({ ...part, notes: e.target.value })}
                            className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#0ea5e9]/10 outline-none font-medium text-slate-700 placeholder:text-slate-400 resize-none"
                        />
                    </div>
                </div>

                <div className="px-8 pb-8 flex items-center justify-end gap-3 bg-slate-50/50 pt-4 border-t border-slate-50">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onSave}
                        className="px-7 py-2.5 bg-[#0ea5e9] text-white rounded-xl text-xs font-black hover:bg-[#0284c7] shadow-lg shadow-sky-100 transition-all active:scale-95"
                    >
                        {editingPartId ? 'Salvar Alterações' : 'Salvar Peça'}
                    </button>
                </div>
            </div>
        </div>
    );
};

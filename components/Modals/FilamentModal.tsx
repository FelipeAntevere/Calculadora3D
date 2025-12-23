import React, { useState } from 'react';
import { X, ChevronDown } from 'lucide-react';
import { Filament } from '../../types';

interface FilamentModalProps {
    isOpen: boolean;
    onClose: () => void;
    filament: Partial<Filament>;
    setFilament: (filament: Partial<Filament>) => void;
    filamentQuantity: number;
    setFilamentQuantity: (qty: number) => void;
    editingFilamentId: string | null;
    onSave: () => void;
    materialOptions: string[];
}

/**
 * Filament Modal Component
 * Handles the form for adding or editing filament spools.
 */
export const FilamentModal: React.FC<FilamentModalProps> = ({
    isOpen,
    onClose,
    filament,
    setFilament,
    filamentQuantity,
    setFilamentQuantity,
    editingFilamentId,
    onSave,
    materialOptions
}) => {
    const [isMaterialDropdownOpen, setIsMaterialDropdownOpen] = useState(false);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                onClick={onClose}
            ></div>
            <div className="relative bg-white dark:bg-slate-800 w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-8 pt-8 pb-4 flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                        <h3 className="text-xl font-black text-slate-800 dark:text-white">
                            {editingFilamentId ? 'Editar Filamento' : 'Novo Filamento'}
                        </h3>
                        <p className="text-slate-400 text-xs font-medium">Adicione carretel ao estoque.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                <div className="p-8 space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-900 dark:text-slate-300 mb-2 uppercase tracking-tight">Marca</label>
                            <input
                                type="text"
                                placeholder="Ex: Voolt3D"
                                value={filament.brand || ''}
                                onChange={(e) => setFilament({ ...filament, brand: e.target.value })}
                                className="w-full bg-[#f8fafc] dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#0ea5e9]/10 dark:focus:ring-[#0ea5e9]/20 outline-none font-medium placeholder:text-slate-400 text-slate-900 dark:text-white"
                            />
                        </div>
                        <div className="relative">
                            <label className="block text-xs font-bold text-slate-900 dark:text-slate-300 mb-2 uppercase tracking-tight">Material</label>
                            <div className="relative">
                                <button
                                    onClick={() => setIsMaterialDropdownOpen(!isMaterialDropdownOpen)}
                                    className={`w-full flex items-center justify-between bg-[#f8fafc] dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none font-medium ${!filament.material ? 'text-slate-400' : 'text-slate-900 dark:text-white'}`}
                                >
                                    {filament.material || 'Selecione...'}
                                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                                </button>
                                {isMaterialDropdownOpen && (
                                    <div className="absolute left-0 mt-2 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl z-[60] py-2 max-h-[200px] overflow-y-auto animate-in fade-in zoom-in-95 origin-top">
                                        {materialOptions.map((mat) => (
                                            <button
                                                key={mat}
                                                onClick={() => { setFilament({ ...filament, material: mat }); setIsMaterialDropdownOpen(false); }}
                                                className="w-full flex items-center px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                            >
                                                <span>{mat}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-900 dark:text-slate-300 mb-2 uppercase tracking-tight">Cor</label>
                        <input
                            type="text"
                            placeholder="Ex: Azul Naval"
                            value={filament.color || ''}
                            onChange={(e) => setFilament({ ...filament, color: e.target.value })}
                            className="w-full bg-[#f8fafc] dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none font-medium placeholder:text-slate-400 focus:ring-2 focus:ring-[#0ea5e9]/10 dark:focus:ring-[#0ea5e9]/20 text-slate-900 dark:text-white"
                        />
                    </div>

                    {!editingFilamentId && (
                        <div>
                            <label className="block text-xs font-bold text-slate-900 dark:text-slate-300 mb-2 uppercase tracking-tight">Quantidade de Carretéis</label>
                            <input
                                type="number"
                                min="1"
                                value={filamentQuantity || ''}
                                onChange={(e) => setFilamentQuantity(parseInt(e.target.value) || 0)}
                                className="w-full bg-[#f8fafc] dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none font-medium focus:ring-2 focus:ring-[#0ea5e9]/10 dark:focus:ring-[#0ea5e9]/20 text-slate-900 dark:text-white"
                                placeholder="1"
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-900 dark:text-slate-300 mb-2 uppercase tracking-tight">Peso Inicial (kg)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={filament.initialWeight || ''}
                                onChange={(e) => setFilament({ ...filament, initialWeight: parseFloat(e.target.value) || 0 })}
                                className="w-full bg-[#f8fafc] dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none font-medium focus:ring-2 focus:ring-[#0ea5e9]/10 dark:focus:ring-[#0ea5e9]/20 text-slate-900 dark:text-white"
                                placeholder="1.00"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-900 dark:text-slate-300 mb-2 uppercase tracking-tight">Peso Atual (kg)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={filament.currentWeight || ''}
                                onChange={(e) => setFilament({ ...filament, currentWeight: parseFloat(e.target.value) || 0 })}
                                className="w-full bg-[#f8fafc] dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none font-medium focus:ring-2 focus:ring-[#0ea5e9]/10 dark:focus:ring-[#0ea5e9]/20 text-slate-900 dark:text-white"
                                placeholder="0.00"
                            />
                            <p className="text-[10px] text-slate-400 font-medium mt-1">Quanto resta no carretel</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-900 dark:text-slate-300 mb-2 uppercase tracking-tight">Custo/kg (R$)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={filament.costPerKg || ''}
                                onChange={(e) => setFilament({ ...filament, costPerKg: parseFloat(e.target.value) || 0 })}
                                className="w-full bg-[#f8fafc] dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none font-medium focus:ring-2 focus:ring-[#0ea5e9]/10 dark:focus:ring-[#0ea5e9]/20 text-slate-900 dark:text-white"
                                placeholder="0.00"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-900 dark:text-slate-300 mb-2 uppercase tracking-tight">Frete (R$)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={filament.freight || ''}
                                onChange={(e) => setFilament({ ...filament, freight: parseFloat(e.target.value) || 0 })}
                                className="w-full bg-[#f8fafc] dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none font-medium focus:ring-2 focus:ring-[#0ea5e9]/10 dark:focus:ring-[#0ea5e9]/20 text-slate-900 dark:text-white"
                                placeholder="0.00"
                            />
                            <p className="text-[10px] text-slate-400 font-medium mt-1">Custo de entrega compartilhado</p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-900 dark:text-slate-300 mb-2 uppercase tracking-tight">Data da Compra</label>
                        <input
                            type="date"
                            value={filament.purchaseDate || new Date().toISOString().split('T')[0]}
                            onChange={(e) => setFilament({ ...filament, purchaseDate: e.target.value })}
                            className="w-full bg-[#f8fafc] dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none font-medium text-slate-600 dark:text-slate-200 focus:ring-2 focus:ring-[#0ea5e9]/10 dark:focus:ring-[#0ea5e9]/20 dark:[color-scheme:dark]"
                        />
                    </div>
                </div>

                <div className="px-8 pb-8 flex items-center justify-end gap-3 bg-slate-50/50 dark:bg-slate-900/50 pt-4 border-t border-slate-50 dark:border-slate-700">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onSave}
                        className="px-7 py-2.5 bg-[#0ea5e9] text-white rounded-xl text-xs font-black hover:bg-[#0284c7] shadow-lg shadow-sky-100 dark:shadow-sky-900/20 transition-all active:scale-95"
                    >
                        Salvar Carretel
                    </button>
                </div>
            </div>
        </div>
    );
};

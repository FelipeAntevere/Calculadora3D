import React, { useState } from 'react';
import { X, Plus, Trash2, Repeat, Edit2, Check } from 'lucide-react';
import { RecurringExpenseTemplate } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface RecurringExpensesModalProps {
    isOpen: boolean;
    onClose: () => void;
    templates: RecurringExpenseTemplate[];
    onAddTemplate: (template: Omit<RecurringExpenseTemplate, 'id'>) => void;
    onRemoveTemplate: (id: string) => void;
    onUpdateTemplate: (template: RecurringExpenseTemplate) => void;
    onGenerate: () => void;
    monthName: string;
    year: number;
}

export const RecurringExpensesModal: React.FC<RecurringExpensesModalProps> = ({
    isOpen,
    onClose,
    templates,
    onAddTemplate,
    onRemoveTemplate,
    onUpdateTemplate,
    onGenerate,
    monthName,
    year
}) => {
    const [newTemplate, setNewTemplate] = useState<Partial<RecurringExpenseTemplate>>({
        description: '',
        category: '',
        defaultDay: undefined,
        defaultAmount: undefined
    });

    const [editingId, setEditingId] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newTemplate.description) {
            if (editingId) {
                // Update existing
                onUpdateTemplate({
                    id: editingId,
                    description: newTemplate.description,
                    category: 'Despesa Fixa', // Keep default category
                    defaultDay: newTemplate.defaultDay || undefined,
                    defaultAmount: newTemplate.defaultAmount || undefined
                });
                setEditingId(null);
            } else {
                // Add new
                onAddTemplate({
                    description: newTemplate.description,
                    category: 'Despesa Fixa', // Default category since field was removed
                    defaultDay: newTemplate.defaultDay || undefined,
                    defaultAmount: newTemplate.defaultAmount || undefined
                });
            }
            // Reset form
            setNewTemplate({ description: '', category: '', defaultDay: undefined, defaultAmount: undefined });
        }
    };

    const handleEdit = (template: RecurringExpenseTemplate) => {
        setNewTemplate({
            description: template.description,
            category: template.category,
            defaultDay: template.defaultDay,
            defaultAmount: template.defaultAmount
        });
        setEditingId(template.id);
    };

    const handleCancelEdit = () => {
        setNewTemplate({ description: '', category: '', defaultDay: undefined, defaultAmount: undefined });
        setEditingId(null);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-white w-full max-w-3xl rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                <div className="px-8 pt-8 pb-4 flex items-center justify-between shrink-0">
                    <div className="flex flex-col gap-1">
                        <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                            <Repeat className="w-5 h-5 text-sky-500" />
                            Despesas Fixas
                        </h3>
                        <p className="text-slate-400 text-xs font-medium">Gerencie contas que se repetem todo mês.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-8 pb-8">
                    {/* Form to Add New */}
                    <form onSubmit={handleSubmit} className={`p-6 rounded-2xl mb-8 border transition-colors ${editingId ? 'bg-amber-50 border-amber-100' : 'bg-slate-50 border-slate-100'}`}>
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                            <div className="md:col-span-7">
                                <label className={`block text-xs font-bold mb-2 uppercase tracking-tight ${editingId ? 'text-amber-700' : 'text-slate-900'}`}>
                                    {editingId ? 'Editando Despesa' : 'Descrição'}
                                </label>
                                <input
                                    type="text"
                                    placeholder="Ex: Aluguel"
                                    value={newTemplate.description}
                                    onChange={e => setNewTemplate({ ...newTemplate, description: e.target.value })}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-sky-500/20 outline-none font-medium text-slate-700"
                                    required
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className={`block text-xs font-bold mb-2 uppercase tracking-tight ${editingId ? 'text-amber-700' : 'text-slate-900'}`}>Dia</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="31"
                                    placeholder="Dia"
                                    value={newTemplate.defaultDay || ''}
                                    onChange={e => setNewTemplate({ ...newTemplate, defaultDay: parseInt(e.target.value) || undefined })}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-sky-500/20 outline-none font-medium text-slate-700"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className={`block text-xs font-bold mb-2 uppercase tracking-tight ${editingId ? 'text-amber-700' : 'text-slate-900'}`}>Valor (R$)</label>
                                <input
                                    type="text"
                                    placeholder="0,00"
                                    value={newTemplate.defaultAmount
                                        ? newTemplate.defaultAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                        : ''}
                                    onChange={e => {
                                        const value = e.target.value;
                                        // Update the model with parsed value
                                        // Remove non-numeric except . and ,
                                        const cleanValue = value.replace(/[^\d.,]/g, '');

                                        // Check if it matches BR format (dots for thousands, comma for decimal)
                                        // We basically remove dots, and replace comma with dot for JS Parsing
                                        const numericString = cleanValue.replace(/\./g, '').replace(',', '.');
                                        const parsed = parseFloat(numericString);

                                        // Manual backspace handling for empty
                                        if (cleanValue === '') {
                                            setNewTemplate({ ...newTemplate, defaultAmount: undefined });
                                            return;
                                        }

                                        setNewTemplate({
                                            ...newTemplate,
                                            defaultAmount: isNaN(parsed) ? undefined : parsed
                                        });
                                    }}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-sky-500/20 outline-none font-medium text-slate-700"
                                />
                            </div>
                            <div className="md:col-span-1 flex gap-2">
                                <button
                                    type="submit"
                                    className={`w-full h-[42px] text-white rounded-xl flex items-center justify-center transition-all shadow-lg active:scale-95 ${editingId
                                            ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-100'
                                            : 'bg-sky-500 hover:bg-sky-600 shadow-sky-100'
                                        }`}
                                    title={editingId ? "Salvar Alterações" : "Adicionar"}
                                >
                                    {editingId ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                                </button>
                                {editingId && (
                                    <button
                                        type="button"
                                        onClick={handleCancelEdit}
                                        className="h-[42px] px-3 bg-slate-200 text-slate-500 rounded-xl flex items-center justify-center hover:bg-slate-300 transition-colors"
                                        title="Cancelar Edição"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </form>

                    {/* List */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-bold text-slate-900 uppercase tracking-tight mb-4">Modelos Salvos</h4>
                        {templates.length === 0 ? (
                            <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                <Repeat className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                <p className="text-slate-500 font-medium">Nenhuma despesa fixa criada</p>
                                <p className="text-slate-400 text-xs mt-1">Adicione despesas que se repetem todo mês.</p>
                            </div>
                        ) : (
                            <div className="grid gap-3">
                                {templates.map(template => (
                                    <div key={template.id} className={`bg-white border rounded-xl p-4 flex items-center justify-between hover:shadow-md transition-all group ${editingId === template.id ? 'border-amber-200 ring-2 ring-amber-100' : 'border-slate-100'}`}>
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-sky-50 flex items-center justify-center text-sky-600 font-bold text-xs shrink-0">
                                                {template.defaultDay ? `${template.defaultDay}` : '?'}
                                            </div>
                                            <div>
                                                <h5 className="font-bold text-slate-800 text-sm">{template.description}</h5>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="text-right mr-4">
                                                <span className="block text-xs font-bold text-slate-400 uppercase">Valor Padrão</span>
                                                <span className="font-bold text-slate-700">
                                                    {template.defaultAmount ? formatCurrency(template.defaultAmount) : <span className="text-slate-300 italic">Variável</span>}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => handleEdit(template)}
                                                className="p-2 text-slate-300 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
                                                title="Editar"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => onRemoveTemplate(template.id)}
                                                className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                                title="Remover"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0 mt-8 rounded-2xl">
                        <p className="text-xs text-slate-500 font-medium max-w-[50%]">
                            As despesas serão criadas como "Pendentes" em <span className="text-slate-900 font-bold">{monthName} de {year}</span>.
                        </p>
                        <button
                            onClick={onGenerate}
                            disabled={templates.length === 0}
                            className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <Repeat size={18} />
                            Lançar no Mês Atual
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

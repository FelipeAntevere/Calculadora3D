import React, { useState, useEffect } from 'react';
import { X, Save, TrendingUp, TrendingDown } from 'lucide-react';
import { CapitalInjection } from '../../types';

interface CapitalInjectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    injection?: Partial<CapitalInjection>;
    onSave: (injection: Partial<CapitalInjection>) => Promise<void>;
    type: 'add' | 'remove';
}

export const CapitalInjectionModal: React.FC<CapitalInjectionModalProps> = ({
    isOpen,
    onClose,
    injection,
    onSave,
    type
}) => {
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState<string>('');
    const [date, setDate] = useState('');
    const [loading, setLoading] = useState(false);

    const isAdd = type === 'add';

    useEffect(() => {
        if (isOpen) {
            setDescription(injection?.description || (isAdd ? 'Aporte de Capital' : 'Retirada de Capital'));
            setAmount(injection?.amount ? Math.abs(injection.amount).toString() : '');
            setDate(injection?.date || new Date().toISOString().split('T')[0]);
        }
    }, [isOpen, injection, isAdd]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const numericAmount = parseFloat(amount);
            const finalAmount = isAdd ? Math.abs(numericAmount) : -Math.abs(numericAmount);

            await onSave({
                ...injection,
                description,
                amount: finalAmount,
                date
            });
            onClose();
        } catch (error) {
            console.error(error);
            alert('Erro ao salvar transação');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white dark:bg-slate-800 w-full max-w-md rounded-[20px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className={`${isAdd ? 'bg-[#0ea5e9]' : 'bg-rose-500'} p-6 text-white flex justify-between items-center transition-colors duration-300`}>
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-lg backdrop-blur-md">
                            {isAdd ? <TrendingUp className="w-5 h-5 text-white" /> : <TrendingDown className="w-5 h-5 text-white" />}
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">{isAdd ? 'Realizar Aporte' : 'Realizar Retirada'}</h3>
                            <p className="text-white/80 text-xs opacity-90">{isAdd ? 'Injetar capital na empresa' : 'Retirar capital da empresa'}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                            Descrição
                        </label>
                        <input
                            type="text"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-sky-500/20 transition-all placeholder:text-slate-400"
                            placeholder={isAdd ? "Ex: Aporte Pessoal" : "Ex: Retirada de Lucro"}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                                Valor (R$)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-sky-500/20 transition-all placeholder:text-slate-400"
                                placeholder="0,00"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                                Data
                            </label>
                            <input
                                type="date"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-sky-500/20 transition-all dark:[color-scheme:dark]"
                                required
                            />
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full ${isAdd ? 'bg-[#0ea5e9] hover:bg-sky-600 shadow-sky-200' : 'bg-rose-500 hover:bg-rose-600 shadow-rose-200'} text-white font-bold py-3.5 rounded-xl shadow-lg active:scale-95 transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed`}
                        >
                            {loading ? (
                                <span className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
                            ) : (
                                <>
                                    <Save size={18} />
                                    <span>{isAdd ? 'Confirmar Aporte' : 'Confirmar Retirada'}</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

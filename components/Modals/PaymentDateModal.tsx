import React, { useState, useEffect } from 'react';
import { X, Calendar, Check } from 'lucide-react';

interface PaymentDateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (date: string) => void;
    expenseDescription?: string;
}

export const PaymentDateModal: React.FC<PaymentDateModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    expenseDescription
}) => {
    const [date, setDate] = useState<string>('');

    useEffect(() => {
        if (isOpen) {
            // Reset date to today when opening
            const today = new Date().toISOString().split('T')[0];
            setDate(today);
        }
    }, [isOpen]);

    const handleSetToday = () => {
        const today = new Date().toISOString().split('T')[0];
        setDate(today);
    };

    const handleConfirm = () => {
        if (date) {
            onConfirm(date);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-800 rounded-[24px] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-emerald-50/50 dark:bg-emerald-900/10">
                    <div className="flex items-center gap-3">
                        <div className="bg-emerald-100 p-2 rounded-xl text-emerald-600">
                            <Check size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Confirmar Pagamento</h3>
                            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Registrar data do pagamento</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-full transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {expenseDescription && (
                        <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Conta</span>
                            <p className="font-bold text-slate-700 dark:text-slate-200">{expenseDescription}</p>
                        </div>
                    )}

                    <div className="space-y-3">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Data do Pagamento</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Calendar size={18} className="text-slate-400" />
                            </div>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="pl-10 w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all dark:[color-scheme:dark]"
                            />
                        </div>
                        <button
                            onClick={handleSetToday}
                            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1.5"
                        >
                            <Calendar size={12} />
                            Definir como Hoje
                        </button>
                    </div>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-900 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-700">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 text-slate-600 dark:text-slate-400 font-bold hover:bg-white dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-slate-200 rounded-xl transition-all text-sm"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!date}
                        className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center gap-2"
                    >
                        <Check size={16} />
                        Confirmar Pagamento
                    </button>
                </div>
            </div>
        </div>
    );
};

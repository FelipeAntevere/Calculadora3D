import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'success') => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4000);
    }, []);

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
                <AnimatePresence>
                    {toasts.map((toast) => (
                        <motion.div
                            key={toast.id}
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                            className="pointer-events-auto"
                        >
                            <div className={`
                flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl backdrop-blur-md border min-w-[320px] max-w-md
                ${toast.type === 'success' ? 'bg-emerald-50/90 border-emerald-100 text-emerald-800' :
                                    toast.type === 'error' ? 'bg-rose-50/90 border-rose-100 text-rose-800' :
                                        'bg-sky-50/90 border-sky-100 text-sky-800'}
              `}>
                                <div className={`p-2 rounded-xl ${toast.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' :
                                        toast.type === 'error' ? 'bg-rose-500/10 text-rose-500' :
                                            'bg-sky-500/10 text-sky-500'
                                    }`}>
                                    {toast.type === 'success' && <CheckCircle size={18} />}
                                    {toast.type === 'error' && <AlertCircle size={18} />}
                                    {toast.type === 'info' && <Info size={18} />}
                                </div>

                                <div className="flex-1">
                                    <p className="text-sm font-bold tracking-tight">{toast.message}</p>
                                </div>

                                <button
                                    onClick={() => removeToast(toast.id)}
                                    className="p-1.5 hover:bg-black/5 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within ToastProvider');
    return context;
};

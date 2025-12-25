import React, { useState, useEffect } from 'react';

interface CurrencyInputProps {
    value: number | undefined;
    onChange: (value: number | undefined) => void;
    placeholder?: string;
    className?: string;
    label?: string;
    required?: boolean;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
    value,
    onChange,
    placeholder = '0,00',
    className = "",
    label,
    required
}) => {
    const formatValue = (val?: number) => {
        if (val === undefined || val === null) return '';
        if (val === 0) return '';
        return val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const [displayValue, setDisplayValue] = useState(formatValue(value));

    // Update display when external value changes (e.g. calculator results)
    useEffect(() => {
        setDisplayValue(formatValue(value));
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value;
        const digits = rawValue.replace(/\D/g, '');

        if (digits === '') {
            setDisplayValue('');
            onChange(undefined);
            return;
        }

        const numericValue = Number(digits) / 100;
        setDisplayValue(numericValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
        onChange(numericValue);
    };

    return (
        <div className="w-full">
            {label && (
                <label className="block text-xs font-bold text-slate-900 dark:text-slate-300 mb-2 uppercase tracking-tight">
                    {label}
                </label>
            )}
            <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">
                    R$
                </span>
                <input
                    type="text"
                    inputMode="numeric"
                    value={displayValue}
                    onChange={handleChange}
                    placeholder={placeholder}
                    className={`w-full bg-[#f8fafc] dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-12 pr-4 py-3 text-sm outline-none font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-[#0ea5e9]/10 dark:focus:ring-[#0ea5e9]/20 transition-all ${className}`}
                    required={required}
                />
            </div>
        </div>
    );
};

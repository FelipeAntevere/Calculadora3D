import { useState, useMemo, useEffect } from 'react';
import { PricingCalculatorInputs } from '../types';

/**
 * Hook for 3D printing price calculations.
 * Encapsulates the logic for computing costs and profit margins.
 */
export const useCalculator = (initialInputs: PricingCalculatorInputs) => {
    const [calcInputs, setCalcInputs] = useState<PricingCalculatorInputs>(() => {
        const currentSession = localStorage.getItem('calc_current_session');
        if (currentSession) {
            try {
                return JSON.parse(currentSession);
            } catch (e) {
                console.error('Failed to parse current session', e);
            }
        }
        const saved = localStorage.getItem('calc_defaults_v2');
        return saved ? JSON.parse(saved) : initialInputs;
    });

    useEffect(() => {
        localStorage.setItem('calc_current_session', JSON.stringify(calcInputs));
    }, [calcInputs]);

    const calcResults = useMemo(() => {
        const materialCost = (calcInputs.filamentCostPerKg / 1000) * calcInputs.partWeight * (1 + calcInputs.filamentLossPercentage / 100);
        const energyCost = calcInputs.printingTime * calcInputs.printerConsumption * calcInputs.kWhCost;
        const laborCost = calcInputs.laborTimeSpent * calcInputs.laborHourValue;
        const maintenanceCost = calcInputs.printingTime * (calcInputs.maintenanceBudget / calcInputs.printerLifespan);
        const fixedRateCost = (calcInputs.fixedMonthlyCosts / calcInputs.productiveHoursMonth) * calcInputs.printingTime;

        // Novos custos fixos/diretos por peça
        const extrasCost = (calcInputs.packagingCost || 0) + (calcInputs.extraItemsCost || 0) + (calcInputs.otherDirectCosts || 0);

        const subtotal = materialCost + energyCost + laborCost + maintenanceCost + fixedRateCost + extrasCost;
        const profit = subtotal * (calcInputs.profitMargin / 100);

        // Cálculo do Preço Final com Taxa de Plataforma Reversa
        // Preço sugerido antes da taxa (Custo + Lucro)
        const priceBeforeFee = subtotal + profit;

        // Se a taxa for 20%, dividimos por 0.8 para que o valor final, 
        // quando descontado 20%, resulte no priceBeforeFee.
        const feeDecimal = (calcInputs.platformFeePercentage || 0) / 100;
        const total = feeDecimal < 1 ? priceBeforeFee / (1 - feeDecimal) : priceBeforeFee;
        const platformFeeValue = total - priceBeforeFee;

        return {
            materialCost,
            energyCost,
            laborCost,
            maintenanceCost,
            fixedRateCost,
            extrasCost,
            subtotal,
            profit,
            total,
            platformFeeValue,
            hourlyMaintenanceRate: calcInputs.maintenanceBudget / calcInputs.printerLifespan
        };
    }, [calcInputs]);

    const saveDefaults = () => {
        localStorage.setItem('calc_defaults_v2', JSON.stringify(calcInputs));
        // Dispatch custom event to notify App.tsx (Dashboard) to update its metrics
        window.dispatchEvent(new CustomEvent('calc_defaults_updated', { detail: calcInputs }));
    };

    const resetInputs = (initialDefaults: PricingCalculatorInputs) => {
        // Only reset piece-specific details, keep business defaults from state/localStorage
        setCalcInputs(prev => ({
            ...prev,
            printingTime: 0,
            partWeight: 0,
            laborTimeSpent: 0
        }));
    };

    const clearSavedDefaults = (initialDefaults: PricingCalculatorInputs) => {
        setCalcInputs(initialDefaults);
        localStorage.removeItem('calc_defaults_v2');
        localStorage.removeItem('calc_current_session');
        window.dispatchEvent(new CustomEvent('calc_defaults_updated', { detail: initialDefaults }));
    };

    const loadDefaults = () => {
        const saved = localStorage.getItem('calc_defaults_v2');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setCalcInputs({ ...initialInputs, ...parsed });
                return true;
            } catch (e) {
                console.error('Failed to parse saved defaults', e);
                return false;
            }
        }
        return false;
    };

    return {
        calcInputs,
        setCalcInputs,
        calcResults,
        saveDefaults,
        loadDefaults,
        resetInputs,
        clearSavedDefaults
    };
};

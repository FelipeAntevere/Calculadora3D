import { useState, useMemo } from 'react';
import { PricingCalculatorInputs } from '../types';

/**
 * Hook for 3D printing price calculations.
 * Encapsulates the logic for computing costs and profit margins.
 */
export const useCalculator = (initialInputs: PricingCalculatorInputs) => {
    const [calcInputs, setCalcInputs] = useState<PricingCalculatorInputs>(() => {
        const saved = localStorage.getItem('calc_defaults');
        return saved ? JSON.parse(saved) : initialInputs;
    });

    const calcResults = useMemo(() => {
        const materialCost = (calcInputs.filamentCostPerKg / 1000) * calcInputs.partWeight * (1 + calcInputs.filamentLossPercentage / 100);
        const energyCost = calcInputs.printingTime * calcInputs.printerConsumption * calcInputs.kWhCost;
        const laborCost = calcInputs.laborTimeSpent * calcInputs.laborHourValue;
        const maintenanceCost = calcInputs.printingTime * (calcInputs.maintenanceBudget / calcInputs.printerLifespan);
        const fixedRateCost = (calcInputs.fixedMonthlyCosts / calcInputs.productiveHoursMonth) * calcInputs.printingTime;

        const subtotal = materialCost + energyCost + laborCost + maintenanceCost + fixedRateCost;
        const profit = subtotal * (calcInputs.profitMargin / 100);
        const total = subtotal + profit;

        return {
            materialCost,
            energyCost,
            laborCost,
            maintenanceCost,
            fixedRateCost,
            subtotal,
            profit,
            total,
            hourlyMaintenanceRate: calcInputs.maintenanceBudget / calcInputs.printerLifespan
        };
    }, [calcInputs]);

    const saveDefaults = () => {
        localStorage.setItem('calc_defaults', JSON.stringify(calcInputs));
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
        localStorage.removeItem('calc_defaults');
        window.dispatchEvent(new CustomEvent('calc_defaults_updated', { detail: initialDefaults }));
    };

    return {
        calcInputs,
        setCalcInputs,
        calcResults,
        saveDefaults,
        resetInputs,
        clearSavedDefaults
    };
};

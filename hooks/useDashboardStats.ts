import { useMemo } from 'react';
import { Order, DashboardMetrics, CostsConfig } from '../types';
import { calculateDashboardMetrics } from '../services/dataService';
import { DEFAULT_COSTS_CONFIG } from '../constants';

export interface ComparisonMetrics {
    current: DashboardMetrics;
    comparison: DashboardMetrics | null;
    variations: {
        revenue: number;
        orders: number;
        profit: number;
        ticket: number;
        printingHours: number;
        materialCost: number;
    } | null;
}

/**
 * Filter orders by a specific period based on scope
 */
const filterOrdersByPeriod = (orders: Order[], year: number, month: number, scope: 'month' | 'year' | 'all') => {
    return orders.filter(o => {
        // Naive parsing to match dataService logic for consistency
        const datePart = (o.date || '').split('T')[0];
        const [yearStr, monthStr] = datePart.split('-');

        const oYear = parseInt(yearStr);
        const oMonth = parseInt(monthStr) - 1; // 0-indexed

        if (scope === 'month') {
            return oYear === year && oMonth === month;
        } else if (scope === 'year') {
            return oYear === year;
        } else {
            // scope === 'all'
            if (month === -1) return true;
            return oMonth === month;
        }
    });
};

/**
 * Custom hook to manage dashboard statistics calculation, 
 * including period comparison support.
 */
export const useDashboardStats = (
    orders: Order[],
    year: number,
    month: number,
    scope: 'month' | 'year' | 'all',
    compYear?: number,
    compMonth?: number,
    config: CostsConfig = DEFAULT_COSTS_CONFIG
): ComparisonMetrics => {
    return useMemo(() => {
        // Current Period
        const filteredCurrent = filterOrdersByPeriod(orders, year, month, scope);
        const currentMetrics = calculateDashboardMetrics(filteredCurrent, year, month, scope, config);

        // If no comparison period is provided, return only current
        if (compYear === undefined || (scope === 'month' && compMonth === undefined)) {
            return {
                current: currentMetrics,
                comparison: null,
                variations: null
            };
        }

        // Comparison Period
        const filteredComp = filterOrdersByPeriod(orders, compYear, compMonth || 0, scope);
        const comparisonMetrics = calculateDashboardMetrics(filteredComp, compYear, compMonth || 0, scope, config);

        const calculateVariation = (current: number, previous: number) => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return ((current - previous) / previous) * 100;
        };

        return {
            current: currentMetrics,
            comparison: comparisonMetrics,
            variations: {
                revenue: calculateVariation(currentMetrics.totalRevenue, comparisonMetrics.totalRevenue),
                orders: calculateVariation(currentMetrics.totalOrders, comparisonMetrics.totalOrders),
                profit: calculateVariation(currentMetrics.totalProfit, comparisonMetrics.totalProfit),
                ticket: calculateVariation(currentMetrics.averageTicket, comparisonMetrics.averageTicket),
                printingHours: calculateVariation(currentMetrics.totalPrintingHours, comparisonMetrics.totalPrintingHours),
                materialCost: calculateVariation(currentMetrics.costBreakdown.material, comparisonMetrics.costBreakdown.material),
            }
        };
    }, [orders, year, month, scope, compYear, compMonth, config]);
};

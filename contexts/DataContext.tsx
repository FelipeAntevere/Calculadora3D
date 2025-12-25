import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { useOrders } from '../hooks/useOrders';
import { useFilaments } from '../hooks/useFilaments';
import { useParts } from '../hooks/useParts';
import { useExpenses } from '../hooks/useExpenses';
import { useCapitalInjections } from '../hooks/useCapitalInjections';
import { useCalculator } from '../hooks/useCalculator';
import { useRecurringExpenses } from '../hooks/useRecurringExpenses';
import { useExpenseMetrics } from '../hooks/useExpenseMetrics';
import { INITIAL_CALC_INPUTS, MONTH_NAMES } from '../constants';

// Re-using types from App.tsx/types.ts
import { Order, Filament, ReplacementPart, Expense, CapitalInjection } from '../types';

interface DataContextType {
    orders: Order[];
    filaments: Filament[];
    parts: ReplacementPart[];
    expenses: Expense[];
    injections: CapitalInjection[];

    // Handlers
    saveOrder: (order: Partial<Order>) => Promise<void>;
    removeOrder: (id: string) => Promise<void>;
    changeOrderStatus: (id: string, status: any) => Promise<void>;
    duplicateOrder: (order: Order) => Promise<void>;

    saveFilament: (filament: Partial<Filament>, quantity: number) => Promise<void>;
    removeFilament: (id: string) => Promise<void>;

    savePart: (part: Partial<ReplacementPart>) => Promise<void>;
    removePart: (id: string) => Promise<void>;

    saveExpense: (expense: Partial<Expense>) => Promise<void>;
    removeExpense: (id: string) => Promise<void>;
    changeExpenseStatus: (id: string, status: any, paidDate?: string) => Promise<void>;

    saveInjection: (injection: Partial<CapitalInjection>) => Promise<void>;
    removeInjection: (id: string) => Promise<void>;

    // Calculator
    calcInputs: any;
    setCalcInputs: (inputs: any) => void;
    calcResults: any;
    saveDefaults: () => Promise<void>;
    loadDefaults: () => Promise<void>;
    resetInputs: () => void;
    clearSavedDefaults: () => Promise<void>;

    isLoading: boolean;
    isInitialLoad: boolean; // NEW: track the very first data fetch
    refreshAll: () => Promise<void>;

    // Filter States
    selectedYear: number;
    setSelectedYear: (year: number) => void;
    selectedMonth: number;
    setSelectedMonth: (month: number) => void;
    statusFilter: string;
    setStatusFilter: (filter: string) => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    selectedDay: string | null;
    setSelectedDay: (day: string | null) => void;
    expenseMonthFilter: number;
    setExpenseMonthFilter: (month: number) => void;
    expenseYearFilter: number;
    setExpenseYearFilter: (year: number) => void;

    // Derived Data
    filteredOrdersList: Order[];
    statusCounts: Record<string, number>;
    filteredExpenses: Expense[];
    expenseMetrics: any;
    cashFlow: any;

    // Actions
    handleGenerateRecurringExpenses: () => Promise<void>;
    templates: any[];
    addTemplate: (template: any) => void;
    removeTemplate: (id: string) => void;
    updateTemplate: (template: any) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    // Hooks initialization
    const {
        orders,
        loadOrders,
        saveOrder,
        removeOrder,
        changeOrderStatus,
        duplicateOrder
    } = useOrders(user);

    const {
        filaments,
        loadFilaments,
        saveFilament,
        removeFilament
    } = useFilaments(user);

    const {
        parts,
        loadParts,
        savePart,
        removePart
    } = useParts(user);

    const {
        expenses,
        loadExpenses,
        saveExpense,
        removeExpense,
        changeExpenseStatus
    } = useExpenses(user);

    const {
        injections,
        loadInjections,
        saveInjection,
        removeInjection
    } = useCapitalInjections(user);

    const {
        calcInputs,
        setCalcInputs,
        calcResults,
        saveDefaults,
        loadDefaults,
        resetInputs,
        clearSavedDefaults
    } = useCalculator(INITIAL_CALC_INPUTS);

    const refreshAll = async () => {
        if (!user || isLoading) return;
        setIsLoading(true);

        // Safety timeout - reduced to 8s to release UI faster
        const timeout = setTimeout(() => {
            console.warn('Refresh data timed out, clearing loading state.');
            setIsLoading(false);
            setIsInitialLoad(false);
        }, 8000);

        try {
            // FIRE ALL BUT DON'T FAIL IF ONE IS SLOW (allSettled)
            await Promise.allSettled([
                loadOrders(),
                loadFilaments(),
                loadParts(),
                loadExpenses(),
                loadInjections(),
                isInitialLoad ? loadDefaults() : Promise.resolve()
            ]);
        } catch (err) {
            console.error('Failed to load data:', err);
        } finally {
            clearTimeout(timeout);
            setIsLoading(false);
            setIsInitialLoad(false);
        }
    };

    // --- Filter States ---
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedDay, setSelectedDay] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState('Todos');
    const [searchQuery, setSearchQuery] = useState('');
    const [expenseMonthFilter, setExpenseMonthFilter] = useState(new Date().getMonth());
    const [expenseYearFilter, setExpenseYearFilter] = useState(new Date().getFullYear());

    // --- Hooks for logic ---
    const { templates, addTemplate, removeTemplate, updateTemplate } = useRecurringExpenses();

    const handleGenerateRecurringExpenses = async () => {
        const month = expenseMonthFilter === -1 ? new Date().getMonth() : expenseMonthFilter;
        const year = expenseYearFilter;

        for (const template of templates) {
            const dueDate = new Date(year, month, template.day).toISOString().split('T')[0];
            await saveExpense({
                description: template.description,
                category: template.category,
                amount: template.amount,
                dueDate,
                status: 'Pendente'
            });
        }
    };

    // --- Derived Data for Orders ---
    const filteredOrdersList = useMemo(() => {
        return orders.filter(o => {
            if (!o.date) return false;
            const datePart = o.date.split('T')[0];
            const dateParts = datePart.split('-');
            const year = parseInt(dateParts[0]);
            const month = parseInt(dateParts[1]) - 1;

            let matchesTime = false;
            if (selectedDay) {
                matchesTime = datePart === selectedDay;
            } else if (selectedMonth === -1) {
                matchesTime = year === selectedYear;
            } else {
                matchesTime = year === selectedYear && month === selectedMonth;
            }
            const matchesStatus = statusFilter === 'Todos' || o.status === statusFilter;
            const matchesSearch = searchQuery === '' ||
                o.customer?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                o.pieceName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                o.material?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                o.color?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                o.state?.toLowerCase().includes(searchQuery.toLowerCase());

            return matchesTime && matchesStatus && matchesSearch;
        }).sort((a, b) => {
            const tA = new Date(a.date || 0).getTime();
            const tB = new Date(b.date || 0).getTime();
            return (isNaN(tA) ? 0 : tA) - (isNaN(tB) ? 0 : tB);
        });
    }, [orders, selectedYear, selectedMonth, selectedDay, statusFilter, searchQuery]);

    const statusCounts = useMemo(() => {
        const relevantOrders = orders.filter(o => {
            if (!o.date) return false;
            const datePart = o.date.split('T')[0];
            const dateParts = datePart.split('-');
            const year = parseInt(dateParts[0]);
            const month = parseInt(dateParts[1]) - 1;

            if (selectedDay) return datePart === selectedDay;
            if (selectedMonth === -1) return year === selectedYear;
            return year === selectedYear && month === selectedMonth;
        });

        const counts: Record<string, number> = { 'Todos': relevantOrders.length };
        ['Pedidos', 'Produção', 'Finalizado', 'Entregue', 'Cancelado'].forEach(status => {
            counts[status] = relevantOrders.filter(o => o.status === status).length;
        });
        return counts;
    }, [orders, selectedYear, selectedMonth, selectedDay]);

    // --- Derived Data for Expenses ---
    const filteredExpenses = useMemo(() => {
        return expenses.filter(expense => {
            const dateStr = expense.paidDate || expense.dueDate;
            if (!dateStr) return false;

            const [yearStr, monthStr] = dateStr.split('T')[0].split('-');
            const year = parseInt(yearStr);
            const month = parseInt(monthStr) - 1;

            if (expenseMonthFilter === -1) return year === expenseYearFilter;
            return year === expenseYearFilter && month === expenseMonthFilter;
        }).sort((a, b) => {
            const dateA = a.paidDate || a.dueDate;
            const dateB = b.paidDate || b.dueDate;
            return new Date(dateA).getTime() - new Date(dateB).getTime();
        });
    }, [expenses, expenseMonthFilter, expenseYearFilter]);

    const expenseMetrics = useExpenseMetrics(filteredExpenses);

    // --- Cash Flow Calculation ---
    const cashFlow = useMemo(() => {
        const matchesFilter = (dateStr?: string) => {
            if (!dateStr) return false;
            try {
                const datePart = dateStr.split('T')[0];
                const parts = datePart.split('-');
                if (parts.length < 2) return false;

                const year = parseInt(parts[0]);
                const month = parseInt(parts[1]) - 1;

                if (expenseMonthFilter === -1) return year === expenseYearFilter;
                return year === expenseYearFilter && month === expenseMonthFilter;
            } catch (e) {
                return false;
            }
        };

        const isAccumulated = (dateStr?: string) => {
            if (!dateStr) return false;
            const [yearStr, monthStr] = dateStr.split('T')[0].split('-');
            const year = parseInt(yearStr);
            const month = parseInt(monthStr) - 1;
            if (expenseMonthFilter === -1) return year <= expenseYearFilter;
            if (year < expenseYearFilter) return true;
            return year === expenseYearFilter && month <= expenseMonthFilter;
        };

        // Global
        const globalRevenue = orders.filter(o => ['Pedidos', 'Produção', 'Finalizado', 'Entregue'].includes(o.status)).reduce((acc, curr) => acc + ((curr.quantity || 1) * (curr.unitValue || 0)), 0);
        const globalPaidExpenses = expenses.filter(e => e.status === 'Pago').reduce((acc, curr) => acc + (curr.amount || 0), 0);
        const globalFilamentCost = filaments.reduce((acc, f) => acc + ((f.costPerKg || 0) * (f.initialWeight || 0)) + (f.freight || 0), 0);
        const globalPartsCost = parts.reduce((acc, p) => acc + ((p.unitCost || 0) * (p.quantity || 0)), 0);
        const globalInjections = injections.reduce((acc, curr) => acc + (curr.amount || 0), 0);
        const globalInventoryCost = globalFilamentCost + globalPartsCost;
        const globalBalance = globalRevenue + globalInjections - globalPaidExpenses - globalInventoryCost;

        // Period
        let periodRevenue = 0;
        let periodTotalOrders = 0;
        let periodTotalPrintingHours = 0;
        let periodEstMaterialCost = 0;
        let periodEstimatedProfit = 0;
        const stateMap: Record<string, { orders: number, revenue: number }> = {};
        const isMonthlyView = expenseMonthFilter !== -1;
        const chartData = isMonthlyView
            ? Array.from({ length: new Date(expenseYearFilter, expenseMonthFilter + 1, 0).getDate() }, (_, i) => ({ label: `${i + 1}`, revenue: 0, orders: 0 }))
            : Array.from({ length: 12 }, (_, i) => ({ label: MONTH_NAMES[i].substring(0, 3), revenue: 0, orders: 0 }));

        orders.forEach(o => {
            if (!['Pedidos', 'Produção', 'Finalizado', 'Entregue'].includes(o.status)) return;
            if (!matchesFilter(o.date)) return;

            const revenue = (o.quantity || 1) * (o.unitValue || 0);
            periodRevenue += revenue;
            periodTotalOrders += 1;
            periodTotalPrintingHours += (o.time || 0) * (o.quantity || 1);

            const pricePerGram = (calcInputs.filamentCostPerKg || 150) / 1000;
            const matCost = (o.materialCost !== undefined && o.materialCost >= 0) ? o.materialCost * (o.quantity || 1) : (o.weight || 0) * pricePerGram * (o.quantity || 1);
            periodEstMaterialCost += matCost;
            periodEstimatedProfit += (revenue - ((o.quantity || 1) * (o.unitCost || 0)));

            const state = o.state || 'N/A';
            if (!stateMap[state]) stateMap[state] = { orders: 0, revenue: 0 };
            stateMap[state].orders += 1;
            stateMap[state].revenue += revenue;

            // Robust index extraction for chartData
            const datePart = o.date.split('T')[0];
            const dateParts = datePart.split('-');
            const day = parseInt(dateParts[2]);
            const month = parseInt(dateParts[1]) - 1;

            const index = isMonthlyView ? day - 1 : month;
            if (chartData[index]) {
                chartData[index].revenue += revenue;
                chartData[index].orders += 1;
            }
        });

        const periodPaidExpenses = expenses.filter(e => e.status === 'Pago' && matchesFilter(e.paidDate || e.dueDate)).reduce((acc, curr) => acc + (curr.amount || 0), 0);

        const periodFilamentCost = filaments.reduce((acc, f) => matchesFilter(f.purchaseDate) ? acc + ((f.costPerKg || 0) * (f.initialWeight || 0)) + (f.freight || 0) : acc, 0);
        const periodPartsCost = parts.reduce((acc, p) => matchesFilter(p.purchaseDate) ? acc + ((p.unitCost || 0) * (p.quantity || 0)) : acc, 0);
        const periodInventoryCost = periodFilamentCost + periodPartsCost;

        // Accumulated
        const accumulatedRevenue = orders.filter(o => ['Pedidos', 'Produção', 'Finalizado', 'Entregue'].includes(o.status) && isAccumulated(o.date)).reduce((acc, curr) => acc + ((curr.quantity || 1) * (curr.unitValue || 0)), 0);
        const accumulatedInjections = injections.reduce((acc, curr) => isAccumulated(curr.date) ? acc + (curr.amount || 0) : acc, 0);
        const accumulatedPaidExpenses = expenses.filter(e => e.status === 'Pago' && isAccumulated(e.paidDate || e.dueDate)).reduce((acc, curr) => acc + (curr.amount || 0), 0);
        const accumulatedInventoryCost = filaments.reduce((acc, f) => isAccumulated(f.purchaseDate) ? acc + (((f.costPerKg || 0) * (f.initialWeight || 0)) + (f.freight || 0)) : acc, 0) +
            parts.reduce((acc, p) => isAccumulated(p.purchaseDate) ? acc + ((p.unitCost || 0) * (p.quantity || 0)) : acc, 0);
        const hourlyRate = calcResults?.hourlyMaintenanceRate || 0;
        const accumulatedMaintenanceReserve = orders.filter(o => ['Pedidos', 'Produção', 'Finalizado', 'Entregue'].includes(o.status) && isAccumulated(o.date))
            .reduce((acc, curr) => acc + (curr.maintenanceCost !== undefined ? curr.maintenanceCost : (curr.time || 0) * (curr.quantity || 1) * hourlyRate), 0);

        return {
            revenue: periodRevenue,
            paidExpenses: periodPaidExpenses,
            inventoryCost: periodInventoryCost,
            filamentCost: periodFilamentCost, // ADDED
            partsCost: periodPartsCost,       // ADDED
            totalOrders: periodTotalOrders,
            averageTicket: periodTotalOrders > 0 ? periodRevenue / periodTotalOrders : 0,
            totalPrintingHours: periodTotalPrintingHours,
            estMaterialCost: periodEstMaterialCost,
            estimatedProfit: periodEstimatedProfit,
            maintenanceReserve: accumulatedMaintenanceReserve,
            balance: accumulatedRevenue + accumulatedInjections - accumulatedPaidExpenses - accumulatedInventoryCost,
            stateDistribution: Object.entries(stateMap).map(([state, data]) => ({ state, orders: data.orders, revenue: data.revenue, percentage: periodRevenue > 0 ? (data.revenue / periodRevenue) * 100 : 0 })).sort((a, b) => b.revenue - a.revenue),
            chartData,
            globalBalance
        };
    }, [orders, expenses, filaments, parts, injections, calcResults?.hourlyMaintenanceRate, expenseMonthFilter, expenseYearFilter, calcInputs]);

    useEffect(() => {
        if (user) {
            refreshAll();
        } else {
            setIsLoading(false);
        }
    }, [user]);

    const value = {
        orders,
        filaments,
        parts,
        expenses,
        injections,
        saveOrder,
        removeOrder,
        changeOrderStatus,
        duplicateOrder,
        saveFilament,
        removeFilament,
        savePart,
        removePart,
        saveExpense,
        removeExpense,
        changeExpenseStatus,
        saveInjection,
        removeInjection,
        calcInputs,
        setCalcInputs,
        calcResults,
        saveDefaults,
        loadDefaults,
        resetInputs,
        clearSavedDefaults,
        isLoading,
        isInitialLoad,
        refreshAll,

        // Filters
        selectedYear, setSelectedYear,
        selectedMonth, setSelectedMonth,
        statusFilter, setStatusFilter,
        searchQuery, setSearchQuery,
        selectedDay, setSelectedDay,
        expenseMonthFilter, setExpenseMonthFilter,
        expenseYearFilter, setExpenseYearFilter,

        // Derived
        filteredOrdersList,
        statusCounts,
        filteredExpenses,
        expenseMetrics,
        cashFlow,

        // Actions
        handleGenerateRecurringExpenses,
        templates,
        addTemplate,
        removeTemplate,
        updateTemplate
    };

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};

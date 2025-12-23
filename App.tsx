import React, { useState, useMemo, useEffect } from 'react';
import {
  LogOut,
  Calculator,
  ShoppingBag,
  Database,
  Wrench,
  DollarSign,
  Printer,
  FileText,
  X,
  Copy,
  Loader2,
  Moon,
  Sun
} from 'lucide-react';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';

// supabase
import { supabase } from './services/supabase';
import { User } from '@supabase/supabase-js';
import Auth from './components/Auth';

// Types and Constants
import { Order, Filament, ReplacementPart, Expense, OrderStatus, FilamentMaterial, PartCategory } from './types';
import { MONTH_NAMES, DEFAULT_COSTS_CONFIG, EMPTY_ORDER, INITIAL_CALC_INPUTS } from './constants';

// Hooks
import { useOrders } from './hooks/useOrders';
import { useFilaments } from './hooks/useFilaments';
import { useParts } from './hooks/useParts';
import { useExpenses } from './hooks/useExpenses';
import { useCalculator } from './hooks/useCalculator';
import { useExpenseMetrics } from './hooks/useExpenseMetrics';

// import { useDashboardStats } from './hooks/useDashboardStats'; // REMOVED
import { useRecurringExpenses } from './hooks/useRecurringExpenses';
import { useCapitalInjections } from './hooks/useCapitalInjections';

// Components
// Lazy Load Main Views
const CalculatorView = React.lazy(() => import('./components/Calculator/CalculatorView').then(module => ({ default: module.CalculatorView })));
const OrdersView = React.lazy(() => import('./components/Orders/OrdersView').then(module => ({ default: module.OrdersView })));
const InventoryView = React.lazy(() => import('./components/Inventory/InventoryView').then(module => ({ default: module.InventoryView })));
const PartsView = React.lazy(() => import('./components/Parts/PartsView').then(module => ({ default: module.PartsView })));
const ExpensesView = React.lazy(() => import('./components/Expenses/ExpensesView').then(module => ({ default: module.ExpensesView })));

// Modals
import { OrderModalV2 as OrderModal } from './components/Modals/OrderModalV2';
import { FilamentModal } from './components/Modals/FilamentModal';
import { PartModal } from './components/Modals/PartModal';
import { ExpenseModal } from './components/Modals/ExpenseModal';
import { RecurringExpensesModal } from './components/Modals/RecurringExpensesModal';
import { CapitalInjectionModal } from './components/Modals/CapitalInjectionModal';
import { CapitalReportModal } from './components/Modals/CapitalReportModal';

// Utils
import { formatCurrency } from './utils/formatters';

/**
 * Main Application Component (Refactored)
 * Orchestrates the different views and manages global application state.
 */
const AppContent: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Tab state
  const [activeTab, setActiveTab] = useState<'calculator' | 'orders' | 'inventory' | 'parts' | 'expenses'>('calculator');

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

  // Shared Filter State (formerly Dash filters)
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  // Comparison state
  const [isComparing, setIsComparing] = useState(false);
  const [compYear, setCompYear] = useState(currentMonth === 0 ? currentYear - 1 : currentYear);
  const [compMonth, setCompMonth] = useState(currentMonth === 0 ? 11 : currentMonth - 1);
  const [compStartDate, setCompStartDate] = useState('');
  const [compEndDate, setCompEndDate] = useState('');

  // Dashboard Metrics Removed

  // Orders filters
  const [statusFilter, setStatusFilter] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDay, setSelectedDay] = useState<string>('');

  // Expenses filters
  const [expenseMonthFilter, setExpenseMonthFilter] = useState(currentMonth);
  const [expenseYearFilter, setExpenseYearFilter] = useState(currentYear);

  // Modals state
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [newOrder, setNewOrder] = useState<Partial<Order>>(EMPTY_ORDER);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);

  const [isFilamentModalOpen, setIsFilamentModalOpen] = useState(false);
  const [newFilament, setNewFilament] = useState<Partial<Filament>>({});
  const [editingFilamentId, setEditingFilamentId] = useState<string | null>(null);
  const [filamentQuantity, setFilamentQuantity] = useState(1);
  const [filamentColorFilter, setFilamentColorFilter] = useState<string>('Todos');

  const [isPartModalOpen, setIsPartModalOpen] = useState(false);
  const [newPart, setNewPart] = useState<Partial<ReplacementPart>>({});
  const [editingPartId, setEditingPartId] = useState<string | null>(null);

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [newExpense, setNewExpense] = useState<Partial<Expense>>({});
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);

  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [summaryText, setSummaryText] = useState('');

  // Recurring Expenses
  const { templates, addTemplate, removeTemplate, updateTemplate } = useRecurringExpenses();
  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
  const [isInjectionModalOpen, setIsInjectionModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [activeInjectionType, setActiveInjectionType] = useState<'add' | 'remove'>('add');

  const handleGenerateRecurringExpenses = async () => {
    const targetYear = expenseYearFilter;
    const targetMonth = expenseMonthFilter === -1 ? new Date().getMonth() : expenseMonthFilter;

    // Create expenses
    const promises = templates.map(template => {
      const day = template.defaultDay || 1;
      // Handle day overflow (e.g. Feb 30)
      const validDate = new Date(targetYear, targetMonth, day);
      // If month rolled over, set to last day of target month
      if (validDate.getMonth() !== targetMonth) {
        validDate.setDate(0);
      }

      const newExp: Partial<Expense> = {
        description: template.description,
        category: template.category,
        amount: template.defaultAmount || 0,
        dueDate: validDate.toISOString().split('T')[0],
        status: 'Pendente'
      };
      return saveExpense(newExp);
    });

    try {
      await Promise.all(promises);
      setIsRecurringModalOpen(false);
      // Ideally show success toast
    } catch (err) {
      console.error('Failed to generate recurring expenses', err);
      alert('Erro ao gerar despesas recorrentes.');
    }
  };

  // Global Loading state
  const [isLoading, setIsLoading] = useState(true);

  // Authentication Effect
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Temporary: Auto-update user profile name
  useEffect(() => {
    if (user && user.email === 'anteverefelipe92@gmail.com' && user.user_metadata?.full_name !== 'Felipe Viotti Antevere') {
      supabase.auth.updateUser({
        data: { full_name: 'Felipe Viotti Antevere' }
      }).then(({ data }) => {
        if (data.user) {
          setUser(data.user); // Force local state update
        }
      });
    }
  }, [user]);

  // Data Loading Effect
  useEffect(() => {
    if (user) {
      loadAllData();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadOrders(),
        loadFilaments(),
        loadParts(),
        loadExpenses(),
        loadInjections()
      ]);
    } catch (err) {
      console.error('Initial load failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  // Enums for UI selects and filters
  const statusOptions: OrderStatus[] = ['Pedidos', 'Produção', 'Finalizado', 'Entregue', 'Cancelado'];
  const materialOptions: FilamentMaterial[] = ['PLA', 'PLA Silk', 'ABS', 'PETG', 'TPU', 'ASA', 'Nylon', 'Resina'];
  const partCategoryOptions: PartCategory[] = ['Bico (Nozzle)', 'Mesa (Bed)', 'Correia', 'Ventilador', 'Sensor', 'Extrusora', 'Eletrônica', 'Outros'];

  // Derived filtered data for Orders
  const filteredOrdersList = useMemo(() => {
    return orders.filter(o => {
      const d = new Date(o.date);
      let matchesTime = false;
      if (selectedDay) {
        matchesTime = d.toISOString().split('T')[0] === selectedDay;
      } else if (selectedMonth === -1) {
        matchesTime = d.getFullYear() === selectedYear;
      } else {
        matchesTime = d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
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
      const valA = isNaN(tA) ? 0 : tA;
      const valB = isNaN(tB) ? 0 : tB;
      return valA - valB;
    });
  }, [orders, selectedYear, selectedMonth, selectedDay, statusFilter, searchQuery]);

  // Derived counts for Order tabs
  const statusCounts = useMemo(() => {
    const relevantOrders = orders.filter(o => {
      const d = new Date(o.date);
      if (selectedDay) return d.toISOString().split('T')[0] === selectedDay;
      if (selectedMonth === -1) return d.getFullYear() === selectedYear;
      return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
    });

    const counts: Record<string, number> = { 'Todos': relevantOrders.length };
    statusOptions.forEach(status => {
      counts[status] = relevantOrders.filter(o => o.status === status).length;
    });
    return counts;
  }, [orders, selectedYear, selectedMonth, selectedDay]);

  // Derived filtered data for Expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
      const dueDate = new Date(expense.dueDate);
      if (expenseMonthFilter === -1) return dueDate.getFullYear() === expenseYearFilter;
      return dueDate.getFullYear() === expenseYearFilter && dueDate.getMonth() === expenseMonthFilter;
    });
  }, [expenses, expenseMonthFilter, expenseYearFilter]).sort((a, b) => {
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  const expenseMetrics = useExpenseMetrics(filteredExpenses);

  // UI Helper functions
  const getStatusStyle = (status: OrderStatus) => {
    switch (status) {
      case 'Pedidos': return 'bg-slate-100 text-slate-600';
      case 'Produção': return 'bg-sky-50 text-sky-600';
      case 'Finalizado': return 'bg-emerald-50 text-emerald-600';
      case 'Entregue': return 'bg-indigo-50 text-indigo-600';
      case 'Cancelado': return 'bg-rose-50 text-rose-600';
      default: return 'bg-slate-50 text-slate-500';
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage > 50) return 'bg-emerald-500';
    if (percentage > 20) return 'bg-amber-500';
    return 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.4)] animate-pulse';
  };

  // Shared Modal Actions
  const openNewOrder = (prefill: Partial<Order> = EMPTY_ORDER) => {
    setNewOrder(prefill);
    setEditingOrderId(null);
    setIsOrderModalOpen(true);
  };

  const onSaveOrder = async () => {
    try {
      const missing = [];
      if (!newOrder.customer) missing.push('Cliente');
      if (!newOrder.pieceName) missing.push('Nome da Peça');
      if (!newOrder.material) missing.push('Material');
      if (!newOrder.status) missing.push('Status');
      if (!newOrder.state) missing.push('Estado');

      if (missing.length > 0) {
        alert(`Preencha os campos obrigatórios: ${missing.join(', ')}`);
        return;
      }
      const total = ((newOrder.quantity || 1) * (newOrder.unitValue || 0)) + (newOrder.freight || 0);

      // Calculate maintenance cost reserve
      // Maintenance = Time * Rate * Quantity (assuming time is per unit)
      // Rate comes from current calculator state (best approximation for new orders)
      const maintenanceCost = (newOrder.time || 0) * (newOrder.quantity || 1) * calcResults.hourlyMaintenanceRate;

      console.log('Saving order with payload:', { ...newOrder, total, maintenanceCost });
      await saveOrder({ ...newOrder, total, maintenanceCost });
      setIsOrderModalOpen(false);
    } catch (error) {
      console.error('CRITICAL SAVE ERROR:', error);
      alert(`Erro ao salvar pedido: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
    }
  };

  const onGenerateSummary = () => {
    const text = "📊 *RESUMO DE PRECIFICAÇÃO - 3D PRINT FLOW*\n" +
      "---------------------------------------\n" +
      "⏱️ *Tempo de Impressão:* " + calcInputs.printingTime + "h\n" +
      "⚖️ *Peso Estimado:* " + calcInputs.partWeight + "g (+ " + calcInputs.filamentLossPercentage + "% perda)\n" +
      "---------------------------------------\n" +
      "💰 *DETALHAMENTO DE CUSTOS:*\n" +
      "• Material: " + formatCurrency(calcResults.materialCost) + "\n" +
      "• Energia: " + formatCurrency(calcResults.energyCost) + "\n" +
      "• Mão de Obra: " + formatCurrency(calcResults.laborCost) + "\n" +
      "• Manutenção: " + formatCurrency(calcResults.maintenanceCost) + "\n" +
      "• Custos Fixos: " + formatCurrency(calcResults.fixedRateCost) + "\n\n" +
      "💵 *CUSTO TOTAL DE PRODUÇÃO:* " + formatCurrency(calcResults.subtotal) + "\n" +
      "📈 *MARGEM APLICADA:* " + calcInputs.profitMargin + "% (" + formatCurrency(calcResults.profit) + ")\n\n" +
      "💎 *VALOR FINAL SUGERIDO:* " + formatCurrency(calcResults.total) + "\n" +
      "---------------------------------------\n" +
      "Gerado em: " + new Date().toLocaleDateString('pt-BR') + " às " + new Date().toLocaleTimeString('pt-BR');
    setSummaryText(text);
    setIsSummaryModalOpen(true);
  };

  // Calculate Detailed Cash Flow
  // Calculate Detailed Cash Flow
  // Calculate Detailed Cash Flow
  const cashFlow = useMemo(() => {
    // Helper to check if a date matches the expense filters
    const matchesFilter = (dateStr?: string) => {
      if (!dateStr) return false;
      const [yearStr, monthStr] = dateStr.split('T')[0].split('-');
      const year = parseInt(yearStr);
      const month = parseInt(monthStr) - 1; // 0-indexed

      if (expenseMonthFilter === -1) {
        return year === expenseYearFilter;
      }
      return year === expenseYearFilter && month === expenseMonthFilter;
    };

    // Helper to check if a date is BEFORE or IN the selected period (for stock/accumulation)
    // If "All Months" (-1) is selected, it matches everything in that year or before
    const isAccumulated = (dateStr?: string) => {
      if (!dateStr) return false;
      const [yearStr, monthStr] = dateStr.split('T')[0].split('-');
      const year = parseInt(yearStr);
      const month = parseInt(monthStr) - 1;

      // Filter is "All Months" (-1) for a specific year
      // Accumulated implies up to the end of that year? Or just everything historically?
      // Usually "Balance" is "Everything up to now" or "Everything up to the end of selected period".
      // Let's assume:
      // If specific Month selected: Include everything <= Month/Year
      // If "All" selected for 2024: Include everything <= Dec 2024

      // However, to keep it simple and useful: 
      // User likely wants "What was my balance at the end of January?".

      if (expenseMonthFilter === -1) {
        // If filtering 2025 ALL, we likely want everything up to end of 2025.
        // Or practically, everything up to today if we are organizing by year? 
        // Let's go strict: Year <= FilterYear
        return year <= expenseYearFilter;
      }

      // If Month/Year is selected (e.g. Feb 2025)
      // Include if Year < 2025 OR (Year == 2025 AND Month <= Feb)
      if (year < expenseYearFilter) return true;
      if (year === expenseYearFilter && month <= expenseMonthFilter) return true;

      return false;
    };


    // --- GLOBAL TOTALS (For Report Modal) ---

    // const globalRevenue = orders ... (We can reuse the accumulated logic or keep this separate for strict "All Time")
    // Let's keep strict "All Time" for the Capital Report as requested before.
    const globalRevenue = orders
      .filter(o => ['Pedidos', 'Produção', 'Finalizado', 'Entregue'].includes(o.status))
      .reduce((acc, curr) => acc + ((curr.quantity || 1) * (curr.unitValue || 0)), 0);

    const globalPaidExpenses = expenses
      .filter(e => e.status === 'Pago')
      .reduce((acc, curr) => acc + curr.amount, 0);

    const globalFilamentCost = filaments.reduce((acc, f) => {
      return acc + ((f.costPerKg * f.initialWeight) + (f.freight || 0));
    }, 0);

    const globalPartsCost = parts.reduce((acc, p) => acc + (p.unitCost * p.quantity), 0);

    const globalInjections = injections.reduce((acc, curr) => acc + curr.amount, 0);

    const globalInventoryCost = globalFilamentCost + globalPartsCost;
    const globalBalance = globalRevenue + globalInjections - globalPaidExpenses - globalInventoryCost;


    // --- PERIOD TOTALS (Flow) ---
    // Strictly what happened IN that month/year (Income Statement view)

    // 1. Period Revenue
    // 1. Period Revenue & State Distribution & Chart Data
    const stateMap: Record<string, { orders: number, revenue: number }> = {};
    let periodRevenue = 0;

    // Chart Data Generation
    const isMonthlyView = expenseMonthFilter !== -1;
    let chartData: { label: string; revenue: number; orders: number }[] = [];

    if (isMonthlyView) {
      // Daily breakdown for the selected month
      const daysInMonth = new Date(expenseYearFilter, expenseMonthFilter + 1, 0).getDate();
      chartData = Array.from({ length: daysInMonth }, (_, i) => ({
        label: `${i + 1}`,
        revenue: 0,
        orders: 0
      }));
    } else {
      // Monthly breakdown for the selected year
      chartData = Array.from({ length: 12 }, (_, i) => ({
        label: MONTH_NAMES[i].substring(0, 3),
        revenue: 0,
        orders: 0
      }));
    }

    // New Metrics Initialization
    let periodTotalOrders = 0;
    let periodTotalPrintingHours = 0;
    let periodEstMaterialCost = 0;
    let periodEstimatedProfit = 0;

    orders.forEach(o => {
      if (!['Pedidos', 'Produção', 'Finalizado', 'Entregue'].includes(o.status)) return;
      if (!matchesFilter(o.date)) return;

      const revenue = (o.quantity || 1) * (o.unitValue || 0);
      periodRevenue += revenue;

      // Accumulate new metrics
      periodTotalOrders += 1;
      periodTotalPrintingHours += (o.time || 0) * (o.quantity || 1);

      // Estimate Material Cost
      if (o.materialCost !== undefined && o.materialCost >= 0) {
        periodEstMaterialCost += o.materialCost * (o.quantity || 1);
      } else {
        // Fallback: weight * pricePerGram
        const pricePerGram = ((calcInputs.filamentCostPerKg || 150) / 1000);
        periodEstMaterialCost += (o.weight || 0) * pricePerGram * (o.quantity || 1);
      }

      // Calculate Estimated Profit (Revenue - Cost)
      // Assuming o.unitCost represents the total production cost per unit
      const totalCost = (o.quantity || 1) * (o.unitCost || 0);
      periodEstimatedProfit += (revenue - totalCost);

      // State Logic
      const state = o.state || 'N/A';
      if (!stateMap[state]) stateMap[state] = { orders: 0, revenue: 0 };
      stateMap[state].orders += 1;
      stateMap[state].revenue += revenue;

      // Chart Logic
      const date = new Date(o.date);
      let index = 0;
      if (isMonthlyView) {
        index = date.getDate() - 1; // 0-indexed day
      } else {
        index = date.getMonth(); // 0-indexed month
      }

      if (chartData[index]) {
        chartData[index].revenue += revenue;
        chartData[index].orders += 1;
        chartData[index].orders += 1;
      }
    });

    const periodAverageTicket = periodTotalOrders > 0 ? periodRevenue / periodTotalOrders : 0;

    const stateDistribution = Object.entries(stateMap)
      .map(([state, data]) => ({
        state,
        orders: data.orders,
        revenue: data.revenue,
        percentage: periodRevenue > 0 ? (data.revenue / periodRevenue) * 100 : 0
      }))
      .sort((a, b) => b.revenue - a.revenue);

    // 2. Period Paid Expenses
    const periodPaidExpenses = expenses
      .filter(e => {
        if (e.status !== 'Pago') return false;
        // Use paidDate preferably, fallback to dueDate
        return matchesFilter(e.paidDate || e.dueDate);
      })
      .reduce((acc, curr) => acc + curr.amount, 0);

    // 3. Period Filament Cost
    const periodFilamentCost = filaments.reduce((acc, f) => {
      if (matchesFilter(f.purchaseDate)) {
        return acc + ((f.costPerKg * f.initialWeight) + (f.freight || 0));
      }
      return acc;
    }, 0);

    // 4. Period Parts Cost
    const periodPartsCost = parts.reduce((acc, p) => {
      if (matchesFilter(p.purchaseDate)) {
        return acc + (p.unitCost * p.quantity);
      }
      return acc;
    }, 0);

    const periodInventoryCost = periodFilamentCost + periodPartsCost;

    // --- ACCUMULATED TOTALS (Stock) ---
    // Everything UP TO the end of that month/year (Balance Sheet view)

    // 1. Accumulated Revenue
    const accumulatedRevenue = orders
      .filter(o => {
        if (!['Pedidos', 'Produção', 'Finalizado', 'Entregue'].includes(o.status)) return false;
        return isAccumulated(o.date);
      })
      .reduce((acc, curr) => acc + ((curr.quantity || 1) * (curr.unitValue || 0)), 0);

    // 2. Accumulated Injections
    const accumulatedInjections = injections.reduce((acc, curr) => {
      if (isAccumulated(curr.date)) return acc + curr.amount;
      return acc;
    }, 0);

    // 3. Accumulated Expenses
    const accumulatedPaidExpenses = expenses
      .filter(e => {
        if (e.status !== 'Pago') return false;
        return isAccumulated(e.paidDate || e.dueDate);
      })
      .reduce((acc, curr) => acc + curr.amount, 0);

    // 4. Accumulated Inventory
    const accumulatedFilamentCost = filaments.reduce((acc, f) => {
      if (isAccumulated(f.purchaseDate)) return acc + ((f.costPerKg * f.initialWeight) + (f.freight || 0));
      return acc;
    }, 0);

    const accumulatedPartsCost = parts.reduce((acc, p) => {
      if (isAccumulated(p.purchaseDate)) return acc + (p.unitCost * p.quantity);
      return acc;
    }, 0);

    const accumulatedInventoryCost = accumulatedFilamentCost + accumulatedPartsCost;

    // Safety fallback for hourly rate
    const hourlyRate = calcResults?.hourlyMaintenanceRate || 0;

    // 5. Accumulated Maintenance Reserve
    const accumulatedMaintenanceReserve = orders
      .filter(o => {
        if (!['Pedidos', 'Produção', 'Finalizado', 'Entregue'].includes(o.status)) return false;
        return isAccumulated(o.date);
      })
      .reduce((acc, curr) => {
        if (curr.maintenanceCost !== undefined) {
          return acc + curr.maintenanceCost;
        }
        return acc + ((curr.time || 0) * (curr.quantity || 1) * hourlyRate);
      }, 0);

    // The Balance is: (Rev + Inj) - (Exp + Inv)
    const accumulatedBalance = accumulatedRevenue + accumulatedInjections - accumulatedPaidExpenses - accumulatedInventoryCost;

    return {
      revenue: periodRevenue, // Period (Flow)
      paidExpenses: periodPaidExpenses, // Period (Flow)
      inventoryCost: periodInventoryCost, // Period (Flow)
      filamentCost: periodFilamentCost, // Period (Flow)
      partsCost: periodPartsCost, // Period (Flow)

      // New Metrics
      totalOrders: periodTotalOrders,
      averageTicket: periodAverageTicket,
      totalPrintingHours: periodTotalPrintingHours,
      estMaterialCost: periodEstMaterialCost,
      estimatedProfit: periodEstimatedProfit,

      maintenanceReserve: accumulatedMaintenanceReserve, // Accumulated (Stock)
      balance: accumulatedBalance, // Accumulated (Stock)

      stateDistribution, // Include State Distribution (Period-based)
      chartData, // Include Chart Data (Period-based)

      globalBalance: globalBalance // Always All-Time
    };
  }, [orders, expenses, filaments, parts, injections, calcResults?.hourlyMaintenanceRate, expenseMonthFilter, expenseYearFilter, calcInputs]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-sky-500 animate-spin" />
        <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-xs">Autenticando...</p>
      </div>
    );
  }

  if (!user) return <Auth />;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-sky-100">
      <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-[95rem] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-[#0ea5e9] p-2.5 rounded-2xl shadow-lg shadow-sky-100 transform -rotate-3 hover:rotate-0 transition-transform">
              <Printer className="text-white w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-black text-[#0f172a] tracking-tighter leading-none">3D Print Flow</h1>
              <span className="text-[9px] font-black text-sky-500 uppercase tracking-[0.4em] mt-1 pr-1">Industrial Edition</span>
            </div>
          </div>

          <nav className="hidden lg:flex bg-slate-100/50 p-1.5 rounded-[22px] border border-slate-100 space-x-1">
            {[
              { id: 'calculator', icon: Calculator, label: 'Calculadora' },
              { id: 'orders', icon: ShoppingBag, label: 'Pedidos' },
              { id: 'inventory', icon: Database, label: 'Estoque' },
              { id: 'parts', icon: Wrench, label: 'Peças' },
              { id: 'expenses', icon: DollarSign, label: 'Financeiro' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id
                  ? 'bg-white dark:bg-slate-800 text-[#0ea5e9] dark:text-[#38bdf8] shadow-md shadow-slate-200/50 dark:shadow-slate-900/50'
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
              >
                <tab.icon size={15} />
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-5">

            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-slate-300 dark:text-slate-500 uppercase tracking-widest mb-0.5">Perfil Ativo</span>
              <span className="text-sm font-bold text-slate-600 dark:text-slate-200 truncate max-w-[160px]" title={user.email}>
                {user.user_metadata?.full_name || user.email}
              </span>
            </div>
            <button
              onClick={handleSignOut}
              className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[95rem] mx-auto px-6 py-10">
        {isLoading ? (
          <div className="h-[65vh] flex flex-col items-center justify-center gap-5 bg-white rounded-[40px] border border-slate-50 shadow-sm">
            <Loader2 className="w-14 h-14 text-sky-500 animate-spin" />
            <div className="text-center">
              <p className="text-slate-900 font-black uppercase tracking-[0.3em] text-sm">Sincronizando Banco de Dados</p>
              <p className="text-slate-400 text-xs font-medium mt-1">Carregando seus registros do Supabase...</p>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-700">
            {/* Dashboard removed */}
            <React.Suspense fallback={
              <div className="flex flex-col items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
                <p className="text-slate-400 text-sm">Carregando...</p>
              </div>
            }>
              {activeTab === 'calculator' && (
                <CalculatorView
                  calcInputs={calcInputs}
                  setCalcInputs={setCalcInputs}
                  calcResults={calcResults}
                  handleSaveDefaults={saveDefaults}
                  handleLoadDefaults={loadDefaults}
                  handleResetInputs={() => resetInputs(INITIAL_CALC_INPUTS)}
                  handleClearSavedDefaults={() => clearSavedDefaults(INITIAL_CALC_INPUTS)}
                  handleGenerateSummary={onGenerateSummary}
                  onAddToOrders={openNewOrder}
                  EMPTY_ORDER={EMPTY_ORDER}
                />
              )}
              {activeTab === 'orders' && (
                <OrdersView
                  orders={orders}
                  statusFilter={statusFilter}
                  setStatusFilter={setStatusFilter}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  selectedYear={selectedYear}
                  setSelectedYear={setSelectedYear}
                  selectedMonth={selectedMonth}
                  setSelectedMonth={setSelectedMonth}
                  selectedDay={selectedDay}
                  setSelectedDay={setSelectedDay}
                  statusCounts={statusCounts}
                  filteredOrdersList={filteredOrdersList}
                  statusOptions={statusOptions}
                  handleEditOrder={(order) => {
                    setNewOrder(order);
                    setEditingOrderId(order.id);
                    setIsOrderModalOpen(true);
                  }}
                  deleteOrderHandler={removeOrder}
                  updateOrderStatusHandler={changeOrderStatus}
                  duplicateOrderHandler={(order) => {
                    const { id, created_at, user_id, ...orderData } = order;
                    setNewOrder({
                      ...orderData,
                      customer: `${orderData.customer} (Cópia)`,
                      date: new Date().toISOString().split('T')[0]
                    } as any);
                    setEditingOrderId(null);
                    setIsOrderModalOpen(true);
                  }}
                  getStatusStyle={getStatusStyle}
                  onNewOrder={() => openNewOrder()}
                />
              )}
              {activeTab === 'inventory' && (() => {
                const filteredFilaments = filamentColorFilter === 'Todos'
                  ? filaments
                  : filaments.filter(f => f.color === filamentColorFilter);

                const totalKg = filteredFilaments.reduce((acc, f) => acc + f.currentWeight, 0);
                const totalItems = filteredFilaments.length;
                const uniqueColors = Array.from(new Set(filaments.map(f => f.color))).sort();

                return (
                  <InventoryView
                    filaments={filteredFilaments}
                    colorFilter={filamentColorFilter}
                    setColorFilter={setFilamentColorFilter}
                    colorOptions={uniqueColors}
                    totalItems={totalItems}
                    totalKg={totalKg}
                    onNewFilament={() => {
                      setNewFilament({ brand: '', material: 'PLA', color: '', initialWeight: 1, currentWeight: 1, costPerKg: 0, freight: 0, purchaseDate: new Date().toISOString().split('T')[0] });
                      setEditingFilamentId(null);
                      setIsFilamentModalOpen(true);
                    }}
                    handleEditFilament={(f) => {
                      setNewFilament(f);
                      setEditingFilamentId(f.id);
                      setIsFilamentModalOpen(true);
                    }}
                    handleDuplicateFilament={(f) => {
                      const { id, created_at, user_id, ...filamentData } = f;
                      setNewFilament({
                        ...filamentData,
                        brand: `${filamentData.brand} (Cópia)`
                      } as any);
                      setEditingFilamentId(null);
                      setIsFilamentModalOpen(true);
                    }}
                    deleteFilamentHandler={removeFilament}
                    getProgressColor={getProgressColor}
                  />
                );
              })()}
              {activeTab === 'parts' && (
                <PartsView
                  replacementParts={parts}
                  onNewPart={() => {
                    setNewPart({ name: '', category: 'Outros', brand: '', quantity: 1, unitCost: 0, purchaseDate: new Date().toISOString().split('T')[0] });
                    setEditingPartId(null);
                    setIsPartModalOpen(true);
                  }}
                  handleEditPart={(p) => {
                    setNewPart(p);
                    setEditingPartId(p.id);
                    setIsPartModalOpen(true);
                  }}
                  duplicatePartHandler={(p) => {
                    const { id, created_at, user_id, ...partData } = p;
                    setNewPart({
                      ...partData,
                      name: `${partData.name} (Cópia)`,
                      purchaseDate: new Date().toISOString().split('T')[0]
                    } as any);
                    setEditingPartId(null);
                    setIsPartModalOpen(true);
                  }}
                  deletePartHandler={removePart}
                />
              )}
              {activeTab === 'expenses' && (
                <ExpensesView
                  expenseMetrics={expenseMetrics}
                  expenseMonthFilter={expenseMonthFilter}
                  setExpenseMonthFilter={setExpenseMonthFilter}
                  expenseYearFilter={expenseYearFilter}
                  setExpenseYearFilter={setExpenseYearFilter}
                  filteredExpenses={filteredExpenses}
                  onNewExpense={() => {
                    setNewExpense({ description: '', category: 'Material', amount: 0, dueDate: new Date().toISOString().split('T')[0], status: 'Pendente' });
                    setEditingExpenseId(null);
                    setIsExpenseModalOpen(true);
                  }}
                  handleEditExpense={(e) => {
                    setNewExpense(e);
                    setEditingExpenseId(e.id);
                    setIsExpenseModalOpen(true);
                  }}
                  deleteExpenseHandler={removeExpense}
                  updateExpenseStatusHandler={changeExpenseStatus}
                  onOpenRecurringModal={() => setIsRecurringModalOpen(true)}
                  cashFlow={cashFlow}
                  onOpenInjectionModal={() => {
                    setActiveInjectionType('add');
                    setIsInjectionModalOpen(true);
                  }}
                  onOpenWithdrawalModal={() => {
                    setActiveInjectionType('remove');
                    setIsInjectionModalOpen(true);
                  }}
                  onOpenReportModal={() => setIsReportModalOpen(true)}
                />
              )}
            </React.Suspense>
          </div>
        )}
      </main>

      <OrderModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        order={newOrder}
        setOrder={setNewOrder}
        editingOrderId={editingOrderId}
        onSave={onSaveOrder}
        materialOptions={materialOptions}
        statusOptions={statusOptions}
      />

      <FilamentModal
        isOpen={isFilamentModalOpen}
        onClose={() => setIsFilamentModalOpen(false)}
        filament={newFilament}
        setFilament={setNewFilament}
        filamentQuantity={filamentQuantity}
        setFilamentQuantity={setFilamentQuantity}
        editingFilamentId={editingFilamentId}
        onSave={async () => {
          await saveFilament(newFilament, filamentQuantity);
          setIsFilamentModalOpen(false);
          setFilamentQuantity(1); // Reset for next time
        }}
        materialOptions={materialOptions}
      />

      <PartModal
        isOpen={isPartModalOpen}
        onClose={() => setIsPartModalOpen(false)}
        part={newPart}
        setPart={setNewPart}
        editingPartId={editingPartId}
        onSave={async () => {
          await savePart(newPart);
          setIsPartModalOpen(false);
        }}
        categoryOptions={partCategoryOptions}
      />

      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        expense={newExpense}
        setExpense={setNewExpense}
        editingExpenseId={editingExpenseId}
        onSave={async (e) => {
          e.preventDefault();
          await saveExpense(newExpense);
          setIsExpenseModalOpen(false);
        }}
      />

      <RecurringExpensesModal
        isOpen={isRecurringModalOpen}
        onClose={() => setIsRecurringModalOpen(false)}
        templates={templates}
        onAddTemplate={addTemplate}
        onRemoveTemplate={removeTemplate}
        onUpdateTemplate={updateTemplate}
        onGenerate={handleGenerateRecurringExpenses}
        monthName={MONTH_NAMES[expenseMonthFilter === -1 ? new Date().getMonth() : expenseMonthFilter]}
        year={expenseYearFilter}
      />


      <CapitalInjectionModal
        isOpen={isInjectionModalOpen}
        onClose={() => setIsInjectionModalOpen(false)}
        type={activeInjectionType}
        onSave={async (injection) => {
          await saveInjection(injection);
          setIsInjectionModalOpen(false);
        }}
      />

      <CapitalReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        injections={injections}
        orders={orders}
        expenses={expenses}
        onDelete={removeInjection}
        totalBalance={cashFlow.globalBalance}
      />

      {
        isSummaryModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsSummaryModalOpen(false)}></div>
            <div className="relative bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="p-10 pb-6 flex items-center justify-between border-b border-slate-50">
                <div className="flex items-center gap-4">
                  <FileText className="w-6 h-6 text-sky-500" />
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight">Cotação Finalizada</h3>
                </div>
                <button onClick={() => setIsSummaryModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-2xl transition-colors">
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>
              <div className="p-10">
                <div className="bg-[#f8fafc] rounded-3xl p-8 font-mono text-sm text-slate-600 whitespace-pre-wrap border border-slate-100 max-h-[400px] overflow-y-auto leading-relaxed">
                  {summaryText}
                </div>
              </div>
              <div className="p-10 pt-0">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(summaryText);
                    alert('Resumo copiado!');
                  }}
                  className="w-full flex items-center justify-center gap-3 py-5 bg-sky-500 text-white rounded-[24px] font-black text-xs uppercase tracking-[0.2em] hover:bg-sky-600 shadow-2xl shadow-sky-200 transition-all active:scale-95"
                >
                  <Copy size={18} />
                  Copiar Orçamento
                </button>
              </div>
            </div>
          </div>
        )
      }

      <footer className="max-w-[95rem] mx-auto px-6 text-center mt-20 pb-16 pt-10 border-t border-slate-100">
        <div className="flex flex-col items-center gap-4">
          <p className="text-slate-300 text-[10px] font-black tracking-[0.4em] uppercase">Built with Precision &bull; 3D Print Flow</p>
          <div className="flex items-center gap-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sistemas Conectados</span>
          </div>
        </div>
      </footer>
    </div >
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

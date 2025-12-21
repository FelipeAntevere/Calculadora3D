import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  TrendingUp, Users, Clock, DollarSign, PieChart as PieIcon,
  Info, RefreshCw, Activity, MapPin,
  Settings, Briefcase, Printer, Calculator, LayoutDashboard,
  Scale, ArrowUpRight, Save, FileText, ChevronUp, ChevronDown, Zap, ShoppingBag, Wrench, Percent,
  Plus, Trash2, Edit2, X, Calendar, Truck, Check, Database, List, BarChart3, Filter, Search, Copy, Share2, LogOut, Loader2
} from 'lucide-react';

import { DashboardMetrics, PricingCalculatorInputs, Order, OrderStatus, Filament, FilamentMaterial, ReplacementPart, PartCategory } from './types';
import {
  fetchOrders, upsertOrder, deleteOrder,
  fetchFilaments, upsertFilament, deleteFilament,
  fetchParts, upsertPart, deletePart,
  fetchExpenses, upsertExpense, deleteExpense,
  calculateDashboardMetrics, formatCurrency
} from './services/dataService';
import { Expense } from './types';
import StatCard from './components/StatCard';
import Auth from './components/Auth';
import { supabase } from './services/supabase';
import { User } from '@supabase/supabase-js';

import { MONTH_NAMES, BRAZILIAN_STATES, DEFAULT_COSTS_CONFIG, generateMockOrders } from './constants';

const EMPTY_ORDER: Partial<Order> = {
  customer: '',
  pieceName: '',
  material: '',
  color: '',
  state: '',
  status: undefined,
  quantity: 1,
  unitValue: 0,
  unitCost: 0,
  time: 0,
  freight: 0,
  powerConsumption: 0,
  laborTime: 0,
  weight: 0,
  shippingDate: '',
  date: new Date().toISOString().split('T')[0]
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

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

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'calculator' | 'orders' | 'inventory' | 'parts'>('dashboard');
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'Todos'>('Todos');
  const [dashboardScope, setDashboardScope] = useState<'month' | 'year' | 'all'>('month');

  const [expandedSections, setExpandedSections] = useState({
    piece: true,
    material: true,
    labor: true,
    machine: true
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [summaryText, setSummaryText] = useState('');
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [openStatusDropdownId, setOpenStatusDropdownId] = useState<string | null>(null);
  const [isOrderMaterialDropdownOpen, setIsOrderMaterialDropdownOpen] = useState(false);
  const [isStateDropdownOpen, setIsStateDropdownOpen] = useState(false);
  const [isOrderStatusDropdownOpen, setIsOrderStatusDropdownOpen] = useState(false);

  const [isFilamentModalOpen, setIsFilamentModalOpen] = useState(false);
  const [editingFilamentId, setEditingFilamentId] = useState<string | null>(null);
  const [isMaterialDropdownOpen, setIsMaterialDropdownOpen] = useState(false);

  const [isPartModalOpen, setIsPartModalOpen] = useState(false);
  const [editingPartId, setEditingPartId] = useState<string | null>(null);
  const [isPartCategoryDropdownOpen, setIsPartCategoryDropdownOpen] = useState(false);

  const [orders, setOrders] = useState<Order[]>([]);
  const [filaments, setFilaments] = useState<Filament[]>([]);
  const [replacementParts, setReplacementParts] = useState<ReplacementPart[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [fetchedOrders, fetchedFilaments, fetchedParts, fetchedExpenses] = await Promise.all([
        fetchOrders(),
        fetchFilaments(),
        fetchParts(),
        fetchExpenses()
      ]);
      setOrders(fetchedOrders);
      setFilaments(fetchedFilaments);
      setReplacementParts(fetchedParts);
      setExpenses(fetchedExpenses);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const INITIAL_CALC_INPUTS = {
    printingTime: 0,
    partWeight: 0,
    filamentCostPerKg: 80,
    filamentLossPercentage: 8,
    printerConsumption: 0.12,
    kWhCost: 0.70,
    laborHourValue: 2,
    laborTimeSpent: 0,
    printerLifespan: 3000,
    maintenanceBudget: 1000,
    maintenancePerHour: 0.33,
    fixedMonthlyCosts: 200,
    productiveHoursMonth: 720,
    profitMargin: 50
  };

  const [calcInputs, setCalcInputs] = useState(() => {
    const saved = localStorage.getItem('calc_defaults');
    return saved ? JSON.parse(saved) : INITIAL_CALC_INPUTS;
  });

  const handleSaveDefaults = () => {
    localStorage.setItem('calc_defaults', JSON.stringify(calcInputs));
    alert('Valores salvos como seus novos padrões!');
  };

  const handleResetDefaults = () => {
    if (confirm('Deseja restaurar os valores originais?')) {
      setCalcInputs(INITIAL_CALC_INPUTS);
      localStorage.removeItem('calc_defaults');
      setNewOrder(EMPTY_ORDER);
    }
  };

  const statusOptions: OrderStatus[] = ['Orçamento', 'Produção', 'Finalizado', 'Entregue', 'Cancelado'];
  const materialOptions: FilamentMaterial[] = ['PLA', 'PLA Silk', 'ABS', 'PETG', 'TPU', 'ASA', 'Nylon', 'Resina'];
  const partCategoryOptions: PartCategory[] = ['Bico (Nozzle)', 'Mesa (Bed)', 'Correia', 'Ventilador', 'Sensor', 'Extrusora', 'Eletrônica', 'Outros'];

  const metrics = useMemo(() => {
    const filteredOrders = orders.filter(o => {
      const d = new Date(o.date);
      if (dashboardScope === 'month') {
        return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
      } else if (dashboardScope === 'year') {
        return d.getFullYear() === selectedYear;
      } else {
        if (selectedMonth === -1) return true;
        return d.getMonth() === selectedMonth;
      }
    });
    return calculateDashboardMetrics(filteredOrders, selectedYear, selectedMonth, dashboardScope);
  }, [orders, selectedYear, selectedMonth, dashboardScope]);

  const statusCounts = useMemo(() => {
    const basePeriodOrders = orders.filter(o => {
      const d = new Date(o.date);
      if (selectedDay) {
        return d.toISOString().split('T')[0] === selectedDay;
      }
      if (dashboardScope === 'month') {
        return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
      } else if (dashboardScope === 'year') {
        return d.getFullYear() === selectedYear;
      } else {
        if (selectedMonth === -1) return true;
        return d.getMonth() === selectedMonth;
      }
    });

    const ordersTabBaseOrders = orders.filter(o => {
      const d = new Date(o.date);
      if (selectedDay) return d.toISOString().split('T')[0] === selectedDay;
      if (selectedMonth === -1) return d.getFullYear() === selectedYear;
      return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
    });

    const isDashboard = activeTab === 'dashboard';
    const activeOrders = isDashboard ? basePeriodOrders : ordersTabBaseOrders;

    const counts: Record<string, number> = {
      'Todos': activeOrders.length,
      'Orçamento': activeOrders.filter(o => o.status === 'Orçamento').length,
      'Produção': activeOrders.filter(o => o.status === 'Produção').length,
      'Finalizado': activeOrders.filter(o => o.status === 'Finalizado').length,
      'Entregue': activeOrders.filter(o => o.status === 'Entregue').length,
      'Cancelado': activeOrders.filter(o => o.status === 'Cancelado').length,
    };
    return counts;
  }, [orders, selectedYear, selectedMonth, selectedDay, activeTab, dashboardScope]);

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
      return matchesTime && matchesStatus;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [orders, selectedYear, selectedMonth, selectedDay, statusFilter]);

  const profitMarginPercent = useMemo(() => {
    if (metrics.totalRevenue === 0) return 0;
    return (metrics.totalProfit / metrics.totalRevenue) * 100;
  }, [metrics.totalProfit, metrics.totalRevenue]);

  const calcResults = useMemo(() => {
    const filamentGrams = calcInputs.partWeight * (1 + calcInputs.filamentLossPercentage / 100);
    const materialCost = (filamentGrams / 1000) * calcInputs.filamentCostPerKg;
    const energyCost = calcInputs.printingTime * calcInputs.printerConsumption * calcInputs.kWhCost;
    const laborCost = calcInputs.laborTimeSpent * calcInputs.laborHourValue;
    const hourlyMaintenanceRate = calcInputs.maintenanceBudget / Math.max(1, calcInputs.printerLifespan);
    const maintenanceCost = hourlyMaintenanceRate * calcInputs.printingTime;
    const fixedRateCost = (calcInputs.fixedMonthlyCosts / Math.max(1, calcInputs.productiveHoursMonth)) * calcInputs.printingTime;
    const subtotal = materialCost + energyCost + laborCost + maintenanceCost + fixedRateCost;
    const profit = subtotal * (calcInputs.profitMargin / 100);
    const total = subtotal + profit;

    return { materialCost, energyCost, laborCost, maintenanceCost, fixedRateCost, subtotal, profit, total, hourlyMaintenanceRate };
  }, [calcInputs]);
  const handleGenerateSummary = () => {
    const text = "📊 *RESUMO DE PRECIFICAÇÁO - 3D PRINT FLOW*\n" +
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
      "💵 *CUSTO TOTAL DE PRODUÇÁO:* " + formatCurrency(calcResults.subtotal) + "\n" +
      "📈 *MARGEM APLICADA:* " + calcInputs.profitMargin + "% (" + formatCurrency(calcResults.profit) + ")\n\n" +
      "💎 *VALOR FINAL SUGERIDO:* " + formatCurrency(calcResults.total) + "\n" +
      "---------------------------------------\n" +
      "Gerado em: " + new Date().toLocaleDateString('pt-BR') + " às " + new Date().toLocaleTimeString('pt-BR');

    setSummaryText(text);
    setIsSummaryModalOpen(true);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(summaryText);
    alert('Resumo copiado com sucesso!');
  };

  const [newOrder, setNewOrder] = useState<Partial<Order>>(EMPTY_ORDER);

  const handleSaveOrder = async () => {
    console.log('Validating order save:', newOrder);
    if (!newOrder.customer || !newOrder.pieceName || !newOrder.material || !newOrder.status || !newOrder.state) {
      alert('Por favor, preencha o Cliente, Nome da Peça e selecione o Material, Estado e Status do pedido.');
      return;
    }

    const qty = newOrder.quantity || 1;
    const uVal = newOrder.unitValue || 0;
    const freight = newOrder.freight || 0;
    const orderTotal = (qty * uVal) + freight;

    try {
      const savedOrder = await upsertOrder({
        ...newOrder,
        total: orderTotal
      });

      if (editingOrderId) {
        setOrders(orders.map(o => o.id === editingOrderId ? savedOrder : o));
      } else {
        setOrders([savedOrder, ...orders]);
      }
      setIsOrderModalOpen(false);
      setEditingOrderId(null);
      setNewOrder(EMPTY_ORDER);
    } catch (error) {
      console.error('Error saving order:', error);
      alert('Erro ao salvar pedido.');
    }
  };

  const handleSaveFilament = async () => {
    if (!newFilament.brand) return alert('Marca é obrigatória');

    try {
      const quantity = editingFilamentId ? 1 : filamentQuantity;
      const promises = [];

      for (let i = 0; i < quantity; i++) {
        const filamentToSave = editingFilamentId ? { ...newFilament, id: editingFilamentId } : { ...newFilament };
        promises.push(upsertFilament(filamentToSave as Filament));
      }

      const savedFilaments = await Promise.all(promises);

      if (editingFilamentId) {
        setFilaments(filaments.map(f => f.id === editingFilamentId ? savedFilaments[0] : f));
      } else {
        setFilaments([...filaments, ...savedFilaments]);
      }

      setIsFilamentModalOpen(false);
      setEditingFilamentId(null);
      setFilamentQuantity(1);
    } catch (error) {
      alert('Erro ao salvar filamento');
    }
  };

  const handleSavePart = async () => {
    try {
      const saved = await upsertPart(newPart);
      if (editingPartId) {
        setReplacementParts(replacementParts.map(p => p.id === editingPartId ? saved : p));
      } else {
        setReplacementParts([saved, ...replacementParts]);
      }
      setIsPartModalOpen(false);
      setEditingPartId(null);
    } catch (error) {
      console.error('Error saving part:', error);
      alert('Erro ao salvar peça.');
    }
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.description || !newExpense.amount) {
      alert('Preencha a descrição e o valor!');
      return;
    }

    try {
      const savedExpense = await upsertExpense(newExpense);

      if (editingExpenseId) {
        setExpenses(expenses.map(e => e.id === savedExpense.id ? savedExpense : e));
      } else {
        setExpenses([savedExpense, ...expenses]);
      }

      setIsExpenseModalOpen(false);
      setNewExpense({ description: '', category: 'Material', amount: 0, dueDate: new Date().toISOString().split('T')[0], status: 'Pendente' });
      setEditingExpenseId(null);
    } catch (error) {
      alert('Erro ao salvar conta');
    }
  };

  const handleEditOrder = (order: Order) => {
    setNewOrder({ ...order });
    setEditingOrderId(order.id);
    setIsOrderModalOpen(true);
  };

  const deleteOrderHandler = async (id: string) => {
    if (confirm('Deseja excluir este pedido?')) {
      try {
        await deleteOrder(id);
        setOrders(orders.filter(o => o.id !== id));
      } catch (error) {
        alert('Erro ao excluir pedido');
      }
    }
  };

  const deleteFilamentHandler = async (id: string) => {
    if (confirm('Deseja excluir este filamento?')) {
      try {
        await deleteFilament(id);
        setFilaments(filaments.filter(f => f.id !== id));
      } catch (error) {
        alert('Erro ao excluir filamento');
      }
    }
  };

  const deleteExpenseHandler = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta conta?')) {
      try {
        await deleteExpense(id);
        setExpenses(expenses.filter(e => e.id !== id));
      } catch (error) {
        alert('Erro ao excluir conta');
      }
    }
  };

  const deletePartHandler = async (id: string) => {
    if (confirm('Deseja excluir esta peça?')) {
      try {
        await deletePart(id);
        setReplacementParts(replacementParts.filter(p => p.id !== id));
      } catch (error) {
        alert('Erro ao excluir peça');
      }
    }
  };

  const updateOrderStatusHandler = async (id: string, status: OrderStatus) => {
    const order = orders.find(o => o.id === id);
    if (!order) return;
    try {
      const saved = await upsertOrder({ ...order, status });
      setOrders(orders.map(o => o.id === id ? saved : o));
      setOpenStatusDropdownId(null);
    } catch (error) {
      alert('Erro ao atualizar status');
    }
  };

  const getStatusStyle = (status: OrderStatus) => {
    switch (status) {
      case 'Orçamento': return 'bg-slate-100 text-slate-600';
      case 'Produção': return 'bg-blue-50 text-blue-600';
      case 'Finalizado':
      case 'Entregue': return 'bg-emerald-50 text-emerald-600';
      case 'Cancelado': return 'bg-rose-50 text-rose-600';
      default: return 'bg-slate-50 text-slate-600';
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage <= 20) return 'bg-rose-500';
    if (percentage >= 60) return 'bg-emerald-500';
    return 'bg-amber-500';
  };

  const [newFilament, setNewFilament] = useState<Partial<Filament>>({ brand: '', material: '', color: '', initialWeight: 1, currentWeight: 1, costPerKg: 0, freight: 0, purchaseDate: new Date().toISOString().split('T')[0] });
  const [filamentQuantity, setFilamentQuantity] = useState(1);
  const [filterColor, setFilterColor] = useState('');
  const [filterMaterial, setFilterMaterial] = useState('');
  const [newPart, setNewPart] = useState<Partial<ReplacementPart>>({ name: '', category: 'Outros', brand: '', quantity: 1, unitCost: 0, purchaseDate: new Date().toISOString().split('T')[0], notes: '' });
  const [newExpense, setNewExpense] = useState<Partial<Expense>>({ description: '', category: 'Material', amount: 0, dueDate: new Date().toISOString().split('T')[0], status: 'Pendente' });
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);

  const handleDuplicateOrder = (order: Order) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...orderData } = order;
    setNewOrder({
      ...orderData,
      date: new Date().toISOString().split('T')[0],
      status: 'Orçamento'
    });
    setEditingOrderId(null);
    setIsOrderModalOpen(true);
  };

  const handleEditFilament = (filament: Filament) => {
    setNewFilament({ ...filament });
    setFilamentQuantity(1);
    setEditingFilamentId(filament.id);
    setIsFilamentModalOpen(true);
  };

  const handleEditPart = (part: ReplacementPart) => {
    setNewPart({ ...part });
    setEditingPartId(part.id);
    setIsPartModalOpen(true);
  };

  const handleEditExpense = (expense: Expense) => {
    setNewExpense({ ...expense });
    setEditingExpenseId(expense.id);
    setIsExpenseModalOpen(true);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="flex flex-col items-center gap-4">
          <div className="bg-[#0ea5e9] p-4 rounded-3xl shadow-2xl shadow-sky-200 animate-bounce">
            <Loader2 className="text-white w-10 h-10 animate-spin" />
          </div>
          <div className="flex flex-col items-center gap-1">
            <p className="text-slate-800 text-lg font-black tracking-tight">3D Print Flow</p>
            <p className="text-slate-400 text-sm font-medium animate-pulse">Sincronizando seus dados...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 pb-12 font-sans" onClick={() => {
      setOpenStatusDropdownId(null);
      setIsMaterialDropdownOpen(false);
      setIsOrderMaterialDropdownOpen(false);
      setIsStateDropdownOpen(false);
      setIsOrderStatusDropdownOpen(false);
      setIsPartCategoryDropdownOpen(false);
    }}>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-[95rem] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="bg-[#0ea5e9] p-1.5 rounded-lg">
              <Printer className="text-white w-5 h-5" />
            </div>
            <h1 className="text-lg font-bold text-slate-800">3D Print Flow</h1>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button onClick={() => setActiveTab('dashboard')} className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'dashboard' ? 'bg-white text-[#0ea5e9] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              <LayoutDashboard className="w-3.5 h-3.5" />
              Dashboard
            </button>
            <button onClick={() => setActiveTab('calculator')} className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'calculator' ? 'bg-white text-[#0ea5e9] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              <Calculator className="w-3.5 h-3.5" />
              Calculadora
            </button>
            <button onClick={() => setActiveTab('orders')} className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'orders' ? 'bg-white text-[#0ea5e9] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              <ShoppingBag className="w-3.5 h-3.5" />
              Pedidos
            </button>
            <button onClick={() => setActiveTab('inventory')} className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'inventory' ? 'bg-white text-[#0ea5e9] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              <Database className="w-3.5 h-3.5" />
              Estoque
            </button>
            <button onClick={() => setActiveTab('parts')} className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'parts' ? 'bg-white text-[#0ea5e9] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              <Wrench className="w-3.5 h-3.5" />
              Peças
            </button>
            <button onClick={() => setActiveTab('expenses')} className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'expenses' ? 'bg-white text-[#0ea5e9] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              <DollarSign className="w-3.5 h-3.5" />
              Contas a Pagar
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Usuário</span>
              <span className="text-xs font-bold text-slate-600 truncate max-w-[120px]">{user?.email}</span>
            </div>
            <button
              onClick={handleSignOut}
              className="p-2.5 bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
              title="Sair"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[95rem] mx-auto px-4 py-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <h2 className="text-3xl font-extrabold text-[#0f172a]">Dashboard</h2>
                <p className="text-slate-500 text-sm font-medium">Visão geral financeira baseada nos pedidos salvos.</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex bg-slate-100 p-1 rounded-xl mr-2">
                  <button
                    onClick={() => setDashboardScope('month')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${dashboardScope === 'month' ? 'bg-white text-[#0ea5e9] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Mensal
                  </button>
                  <button
                    onClick={() => { setDashboardScope('year'); if (selectedMonth === -1) setSelectedMonth(currentMonth); }}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${dashboardScope === 'year' ? 'bg-white text-[#0ea5e9] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Anual
                  </button>
                  <button
                    onClick={() => { setDashboardScope('all'); setSelectedMonth(-1); }}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${dashboardScope === 'all' ? 'bg-white text-[#0ea5e9] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Geral
                  </button>
                </div>
                {(dashboardScope === 'month' || dashboardScope === 'all') && (
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-sky-500/20"
                  >
                    {dashboardScope === 'all' && <option value={-1}>Todos os Meses</option>}
                    {MONTH_NAMES.map((name, i) => <option key={name} value={i}>{name}</option>)}
                  </select>
                )}
                {dashboardScope !== 'all' && (
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-sky-500/20"
                  >
                    {[currentYear - 1, currentYear, currentYear + 1].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <StatCard title="Receita Total" value={formatCurrency(metrics.totalRevenue || 0)} icon={<DollarSign />} iconColor="text-sky-500" description={`vlr produtos (` + (dashboardScope === 'month' ? 'mês' : dashboardScope === 'year' ? 'ano' : 'geral') + `)`} />
              <StatCard title="Lucro Líquido" value={formatCurrency(metrics.totalProfit || 0)} icon={<TrendingUp />} iconColor="text-emerald-500" valueColorClass="text-emerald-600" description={(profitMarginPercent || 0).toFixed(1) + "% de margem real"} />
              <StatCard title="Custo Produção" value={formatCurrency(metrics.totalCost || 0)} icon={<Activity />} iconColor="text-rose-500" valueColorClass="text-rose-600" description="total gasto na produção" />
              <StatCard title="Pedidos" value={metrics.totalOrders || 0} icon={<ShoppingBag />} iconColor="text-sky-500" description={`quantidade ` + (dashboardScope === 'month' ? 'no mês' : dashboardScope === 'year' ? 'no ano' : 'histórica')} />
              <StatCard title="Horas de Impressão" value={(metrics.totalPrintingHours || 0).toFixed(1) + "h"} icon={<Clock />} iconColor="text-orange-500" description="uso total das máquinas" />
              <StatCard title="Ticket Médio" value={formatCurrency(metrics.averageTicket || 0)} icon={<Calculator />} iconColor="text-indigo-500" description="valor médio por pedido" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-6">Faturamento {dashboardScope === 'month' ? 'Diário' : dashboardScope === 'year' ? 'Mensal' : 'Anual'}</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={metrics.dailyHistory}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.1} />
                          <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="day" interval={1} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} padding={{ left: 10, right: 10 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} formatter={(val: number) => [formatCurrency(val), 'Faturamento']} />
                      <Area type="monotone" dataKey="revenue" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-slate-800 leading-tight">Volume de Pedidos</h3>
                  <p className="text-slate-400 text-sm font-medium">
                    Quantidade {dashboardScope === 'month' ? `em ` + MONTH_NAMES[selectedMonth] + ` de ` + selectedYear : dashboardScope === 'year' ? `no ano de ` + selectedYear : selectedMonth === -1 ? 'Histórica Geral' : `em ` + MONTH_NAMES[selectedMonth] + ` (Todos os Anos)`}
                  </p>
                </div>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={metrics.dailyHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="day" interval={1} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} padding={{ left: 10, right: 10 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} domain={[0, 'auto']} />
                      <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} formatter={(val: number) => [val, 'Pedidos']} />
                      <Bar dataKey="orders" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={12} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* State Distribution */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 mb-6">Melhores Estados (Top 10)</h3>
              {metrics.stateDistribution && metrics.stateDistribution.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {metrics.stateDistribution.slice(0, 10).map((item, index) => (
                    <div key={item.state} className="bg-slate-50 rounded-xl p-4 border border-slate-100 relative overflow-hidden">
                      <div className="flex justify-between items-start z-10 relative">
                        <div>
                          <span className="text-2xl font-black text-slate-800 block mb-1">{BRAZILIAN_STATES.find(s => s.sigla === item.state)?.nome || item.state}</span>
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{item.orders} pedidos</span>
                        </div>
                        <div className={`text-xs font-bold px-2 py-1 rounded-lg ${index === 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'}`}>
                          {index + 1}º
                        </div>
                      </div>
                      <div className="mt-4">
                        <span className="text-sm font-bold text-[#0ea5e9] block">{formatCurrency(item.revenue)}</span>
                        <div className="w-full h-1.5 bg-slate-200 rounded-full mt-2 overflow-hidden">
                          <div className="h-full bg-[#0ea5e9]" style={{ width: `${item.percentage}%` }}></div>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 mt-1 block text-right">{item.percentage.toFixed(1)}% do total</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-slate-400">
                  <p className="font-medium">Nenhum dado de distribuição geográfica encontrado.</p>
                  <p className="text-xs mt-2">Verifique se os pedidos possuem Estado (UF) preenchido.</p>
                </div>
              )}
            </div>
          </div>
        )}
        {activeTab === 'calculator' && (
          <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <h2 className="text-3xl font-extrabold text-[#0f172a]">Calculadora</h2>
                <p className="text-slate-500 text-sm font-medium">Os valores calculados aqui serão os usados no Dashboard ao salvar.</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSaveDefaults}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  <Save className="w-4 h-4" />
                  Salvar Padrão
                </button>
                <button
                  onClick={handleResetDefaults}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-rose-500 hover:bg-rose-50 transition-all border-rose-100"
                >
                  <RefreshCw className="w-4 h-4" />
                  Resetar
                </button>
                <button onClick={handleGenerateSummary} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all">
                  <FileText className="w-4 h-4" />
                  Gerar Resumo
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-7 space-y-4">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <button onClick={() => toggleSection('piece')} className="w-full flex items-center justify-between p-6 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3"><Clock className="w-5 h-5 text-sky-500" /><span className="font-bold text-slate-800">Detalhes da Peça</span></div>
                    {expandedSections.piece ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                  </button>
                  {expandedSections.piece && (
                    <div className="px-6 pb-8 grid grid-cols-2 gap-6 animate-in slide-in-from-top-2 duration-200">
                      <div><label className="block text-sm font-medium text-slate-500 mb-2">Tempo de impressão (horas)</label>
                        <input type="number" value={calcInputs.printingTime} onChange={(e) => setCalcInputs({ ...calcInputs, printingTime: parseFloat(e.target.value) || 0 })} className={`w-full bg-[#f8fafc] border border-slate-100 rounded-xl px-4 py-2.5 text-sm font-medium outline-none ` + (calcInputs.printingTime === 0 ? 'text-rose-600 font-bold' : 'text-slate-700')} />
                      </div>
                      <div><label className="block text-sm font-medium text-slate-500 mb-2">Peso da peça (gramas)</label>
                        <input type="number" value={calcInputs.partWeight} onChange={(e) => setCalcInputs({ ...calcInputs, partWeight: parseFloat(e.target.value) || 0 })} className={`w-full bg-[#f8fafc] border border-slate-100 rounded-xl px-4 py-2.5 text-sm font-medium outline-none ` + (calcInputs.partWeight === 0 ? 'text-rose-600 font-bold' : 'text-slate-700')} />
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <button onClick={() => toggleSection('material')} className="w-full flex items-center justify-between p-6 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3"><Zap className="w-5 h-5 text-amber-500" /><span className="font-bold text-slate-800">Material e Energia</span></div>
                    {expandedSections.material ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                  </button>
                  {expandedSections.material && (
                    <div className="px-6 pb-8 space-y-6 animate-in slide-in-from-top-2 duration-200">
                      <div className="grid grid-cols-2 gap-6">
                        <div><label className="block text-sm font-medium text-slate-500 mb-2">Custo do filamento PLA por kg</label>
                          <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">R$</span><input type="number" value={calcInputs.filamentCostPerKg} onChange={(e) => setCalcInputs({ ...calcInputs, filamentCostPerKg: parseFloat(e.target.value) || 0 })} className={`w-full bg-[#f8fafc] border border-slate-100 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium outline-none ` + (calcInputs.filamentCostPerKg === 0 ? 'text-rose-600 font-bold' : 'text-slate-700')} /></div>
                        </div>
                        <div><label className="block text-sm font-medium text-slate-500 mb-2">Consumo da impressora (kWh/h)</label><input type="number" step="0.01" value={calcInputs.printerConsumption} onChange={(e) => setCalcInputs({ ...calcInputs, printerConsumption: parseFloat(e.target.value) || 0 })} className={`w-full bg-[#f8fafc] border border-slate-100 rounded-xl px-4 py-2.5 text-sm font-medium outline-none ` + (calcInputs.printerConsumption === 0 ? 'text-rose-600 font-bold' : 'text-slate-700')} /></div>
                        <div><label className="block text-sm font-medium text-slate-500 mb-2">Custo do kWh</label><div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">R$</span><input type="number" step="0.01" value={calcInputs.kWhCost} onChange={(e) => setCalcInputs({ ...calcInputs, kWhCost: parseFloat(e.target.value) || 0 })} className={`w-full bg-[#f8fafc] border border-slate-100 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium outline-none ` + (calcInputs.kWhCost === 0 ? 'text-rose-600 font-bold' : 'text-slate-700')} /></div></div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2"><label className="flex items-center gap-2 text-xs font-bold text-slate-800"><Percent className="w-3 h-3" /> Perda de Filamento</label><span className="text-xs font-black text-sky-500">{calcInputs.filamentLossPercentage}%</span></div>
                        <input type="range" min="0" max="30" step="1" value={calcInputs.filamentLossPercentage} onChange={(e) => setCalcInputs({ ...calcInputs, filamentLossPercentage: parseInt(e.target.value) })} className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-sky-500" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <button onClick={() => toggleSection('labor')} className="w-full flex items-center justify-between p-6 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3"><Briefcase className="w-5 h-5 text-indigo-500" /><span className="font-bold text-slate-800">Mão de Obra e Negócio</span></div>
                    {expandedSections.labor ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                  </button>
                  {expandedSections.labor && (
                    <div className="px-6 pb-8 space-y-6 animate-in slide-in-from-top-2 duration-200">
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-slate-500 mb-2">Valor da sua hora de trabalho</label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">R$</span>
                            <input type="number" value={calcInputs.laborHourValue} onChange={(e) => setCalcInputs({ ...calcInputs, laborHourValue: parseFloat(e.target.value) || 0 })} className={`w-full bg-[#f8fafc] border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/10 ` + (calcInputs.laborHourValue === 0 ? 'text-rose-600 font-bold' : 'text-slate-700')} />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-500 mb-2">Horas de trabalho manual</label>
                          <div className="relative">
                            <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input type="number" step="0.1" value={calcInputs.laborTimeSpent} onChange={(e) => setCalcInputs({ ...calcInputs, laborTimeSpent: parseFloat(e.target.value) || 0 })} className={`w-full bg-[#f8fafc] border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/10 ` + (calcInputs.laborTimeSpent === 0 ? 'text-rose-600 font-bold' : 'text-slate-700')} />
                          </div>
                        </div>
                        <div><label className="block text-sm font-medium text-slate-500 mb-2">Custos fixos mensais</label><div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">R$</span><input type="number" value={calcInputs.fixedMonthlyCosts} onChange={(e) => setCalcInputs({ ...calcInputs, fixedMonthlyCosts: parseFloat(e.target.value) || 0 })} className={`w-full bg-[#f8fafc] border border-slate-100 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium outline-none ` + (calcInputs.fixedMonthlyCosts === 0 ? 'text-rose-600 font-bold' : 'text-slate-700')} /></div></div>
                        <div><label className="block text-sm font-medium text-slate-500 mb-2">Horas produtivas no mês</label><input type="number" value={calcInputs.productiveHoursMonth} onChange={(e) => setCalcInputs({ ...calcInputs, productiveHoursMonth: parseFloat(e.target.value) || 1 })} className={`w-full bg-[#f8fafc] border border-slate-100 rounded-xl px-4 py-2.5 text-sm font-medium outline-none ` + (calcInputs.productiveHoursMonth === 0 ? 'text-rose-600 font-bold' : 'text-slate-700')} /></div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2"><label className="flex items-center gap-2 text-xs font-bold text-slate-800"><Percent className="w-3 h-3" /> Margem de Lucro</label><span className="text-xs font-black text-sky-500">{calcInputs.profitMargin}%</span></div>
                        <input type="range" min="0" max="300" step="5" value={calcInputs.profitMargin} onChange={(e) => setCalcInputs({ ...calcInputs, profitMargin: parseInt(e.target.value) })} className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-sky-500" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <button onClick={() => toggleSection('machine')} className="w-full flex items-center justify-between p-6 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3"><Wrench className="w-5 h-5 text-rose-500" /><span className="font-bold text-slate-800">Manutenção da Impressora</span></div>
                    {expandedSections.machine ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                  </button>
                  {expandedSections.machine && (
                    <div className="px-6 pb-8 space-y-6 animate-in slide-in-from-top-2 duration-200">
                      <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-slate-500 mb-2">Vida útil da máquina (horas)</label><div className="relative"><Zap className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" /><input type="number" value={calcInputs.printerLifespan} onChange={(e) => setCalcInputs({ ...calcInputs, printerLifespan: parseFloat(e.target.value) || 0 })} className={`w-full bg-[#f8fafc] border border-slate-100 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium outline-none ` + (calcInputs.printerLifespan === 0 ? 'text-rose-600 font-bold' : 'text-slate-700')} /></div></div>
                        <div><label className="block text-sm font-medium text-slate-500 mb-2">Orçamento manutenção (R$)</label><div className="relative"><DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" /><input type="number" step="0.01" value={calcInputs.maintenanceBudget} onChange={(e) => setCalcInputs({ ...calcInputs, maintenanceBudget: parseFloat(e.target.value) || 0 })} className={`w-full bg-[#f8fafc] border border-slate-100 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium outline-none ` + (calcInputs.maintenanceBudget === 0 ? 'text-rose-600 font-bold' : 'text-slate-700')} /></div></div>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-xl"><p className="text-xs font-bold text-slate-500 uppercase tracking-tight mb-1">Custo de Manutenção por Hora</p><p className="text-lg font-black text-rose-600">{formatCurrency(calcResults.hourlyMaintenanceRate)} / hora</p></div>
                    </div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-12 xl:col-span-5 space-y-6">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 space-y-8">
                  <h3 className="text-lg font-bold text-sky-500">Análise de Custos</h3>
                  <div className="space-y-5">
                    <div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full bg-amber-500"></div><span className="text-sm font-medium text-slate-600">Custo do filamento</span></div><span className="text-sm font-bold text-slate-900">{formatCurrency(calcResults.materialCost)}</span></div>
                    <div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full bg-yellow-400"></div><span className="text-sm font-medium text-slate-600">Custo de energia</span></div><span className="text-sm font-bold text-slate-900">{formatCurrency(calcResults.energyCost)}</span></div>
                    <div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full bg-indigo-500"></div><span className="text-sm font-medium text-slate-600">Custo de mão de obra</span></div><span className="text-sm font-bold text-slate-900">{formatCurrency(calcResults.laborCost)}</span></div>
                    <div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full bg-sky-400"></div><span className="text-sm font-medium text-slate-600">Custo fixo rateado</span></div><span className="text-sm font-bold text-slate-900">{formatCurrency(calcResults.fixedRateCost)}</span></div>
                    <div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full bg-slate-500"></div><span className="text-sm font-medium text-slate-600">Custo de manutenção</span></div><span className="text-sm font-bold text-slate-900">{formatCurrency(calcResults.maintenanceCost)}</span></div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border-l-4 border-sky-500 shadow-sm p-8 space-y-6">
                  <div className="flex items-center justify-between"><span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Custo Total da Peça</span><span className="text-xl font-bold text-slate-900">{formatCurrency(calcResults.subtotal)}</span></div>
                  <div className="flex items-center justify-between border-b border-slate-50 pb-6"><span className="text-xs font-medium text-slate-500">Margem de Lucro ({calcInputs.profitMargin}%)</span><span className="text-sm font-bold text-emerald-500">+ {formatCurrency(calcResults.profit)}</span></div>
                  <div className="bg-emerald-50 rounded-2xl p-6 flex items-center justify-between"><span className="text-sm font-bold text-emerald-600 uppercase tracking-tight">Preço Final</span><span className="text-3xl font-black text-emerald-700">{formatCurrency(calcResults.total)}</span></div>
                  <button onClick={() => {
                    setNewOrder({
                      ...EMPTY_ORDER,
                      unitValue: Number(calcResults.total.toFixed(2)),
                      unitCost: Number(calcResults.subtotal.toFixed(2)),
                      weight: calcInputs.partWeight,
                      time: calcInputs.printingTime,
                      powerConsumption: Number((calcInputs.printingTime * calcInputs.printerConsumption).toFixed(3)),
                      laborTime: calcInputs.laborTimeSpent
                    });
                    setActiveTab('orders');
                    setIsOrderModalOpen(true);
                  }} className="w-full py-4 bg-sky-500 text-white rounded-2xl font-bold hover:bg-sky-400 transition-all flex items-center justify-center gap-2 shadow-lg shadow-sky-100"><Plus className="w-5 h-5" />Adicionar aos Pedidos</button>
                </div>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'orders' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <h2 className="text-3xl font-extrabold text-[#0f172a]">Pedidos</h2>
                  <p className="text-slate-500 text-sm font-medium">Gerencie e acompanhe o status de todas as suas vendas.</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-4">
                <div className="flex items-center gap-2 text-slate-400 mr-2">
                  <Filter className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-widest">Filtros</span>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter ml-1">Mês</label>
                    <select
                      value={selectedMonth}
                      onChange={(e) => { setSelectedMonth(Number(e.target.value)); setSelectedDay(''); }}
                      className="bg-[#f8fafc] border border-slate-100 rounded-xl px-4 py-2 text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-sky-500/20"
                    >
                      <option value={-1}>Todos</option>
                      {MONTH_NAMES.map((name, i) => <option key={name} value={i}>{name}</option>)}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter ml-1">Ano</label>
                    <select
                      value={selectedYear}
                      onChange={(e) => { setSelectedYear(Number(e.target.value)); setSelectedDay(''); }}
                      className="bg-[#f8fafc] border border-slate-100 rounded-xl px-4 py-2 text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-sky-500/20"
                    >
                      {[currentYear - 1, currentYear, currentYear + 1].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter ml-1">Dia Específico</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="date"
                        value={selectedDay}
                        onChange={(e) => setSelectedDay(e.target.value)}
                        className="bg-[#f8fafc] border border-slate-100 rounded-xl pl-9 pr-4 py-2 text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-sky-500/20"
                      />
                    </div>
                  </div>

                  {selectedDay && (
                    <button onClick={() => setSelectedDay('')} className="flex items-center gap-1.5 px-3 py-2 text-rose-500 hover:bg-rose-50 rounded-xl text-xs font-bold transition-all self-end mb-0.5">
                      <X className="w-3.5 h-3.5" /> Limpar
                    </button>
                  )}
                </div>
                <div className="md:ml-auto">
                  <div className="bg-sky-50 px-3 py-1.5 rounded-lg border border-sky-100">
                    <span className="text-xs font-bold text-sky-600">{filteredOrdersList.length} pedidos encontrados</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
                {['Todos', ...statusOptions].map((status) => {
                  const isActive = statusFilter === status;
                  const count = statusCounts[status];
                  return (
                    <button key={status} onClick={() => setStatusFilter(status as any)} className={`flex items-center gap-3 px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-200 shadow-sm ` + (isActive ? 'bg-[#0f172a] text-white' : 'bg-white text-slate-500 border border-slate-100 hover:bg-slate-50')}>
                      {status}
                      <span className={`flex items-center justify-center min-w-[24px] h-[24px] px-1.5 rounded-full text-[11px] font-bold ` + (isActive ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-400')}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto min-h-[400px]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-50 bg-slate-50/50">
                      <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Data</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Cliente</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Peça</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">UF</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Material</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">Qtd</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Valor Itens</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Frete</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Total</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredOrdersList.length > 0 ? (
                      filteredOrdersList.map((order) => (
                        <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 text-sm font-bold text-slate-900">{(order.date || '').split('T')[0].split('-').reverse().join('/')}</td>
                          <td className="px-6 py-4 text-sm font-medium text-slate-600">{order.customer}</td>
                          <td className="px-6 py-4 text-sm font-medium text-slate-600">{order.pieceName}</td>
                          <td className="px-6 py-4 text-sm font-medium text-slate-500 text-center">{order.state}</td>
                          <td className="px-6 py-4"><div className="text-xs font-bold text-slate-400">{order.material} - <span className="font-medium">{order.color}</span></div></td>
                          <td className="px-6 py-4 text-sm font-bold text-slate-900 text-center">{order.quantity}</td>
                          <td className="px-6 py-4 text-sm font-medium text-slate-600"><div className="flex flex-col"><span className="text-slate-900 font-bold">{formatCurrency((order.unitValue || 0) * (order.quantity || 0))}</span><span className="text-[10px] text-slate-400">({order.quantity}x {formatCurrency(order.unitValue || 0)})</span></div></td>
                          <td className="px-6 py-4 text-sm font-medium text-slate-600">{formatCurrency(order.freight || 0)}</td>
                          <td className="px-6 py-4"><span className="text-sm font-extrabold text-[#0ea5e9]">{formatCurrency(order.total || 0)}</span></td>
                          <td className="px-6 py-4 relative">
                            <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
                              <button onClick={() => setOpenStatusDropdownId(openStatusDropdownId === order.id ? null : order.id)} className={`flex items-center justify-between gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all min-w-[125px] ${getStatusStyle(order.status)} hover:opacity-90 active:scale-95`}>
                                {order.status}
                                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ` + (openStatusDropdownId === order.id ? 'rotate-180' : '')} />
                              </button>
                              {openStatusDropdownId === order.id && (
                                <div className="absolute left-0 mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 py-2 animate-in fade-in zoom-in-95 duration-150 origin-top-left">
                                  {statusOptions.map((status) => (
                                    <button onClick={() => updateOrderStatusHandler(order.id, status as OrderStatus)} key={status} className={`flex items-center justify-between w-full px-4 py-2 text-sm font-bold transition-all ` + (order.status === status ? 'bg-sky-50 text-sky-600' : 'text-slate-600 hover:bg-slate-50')}>
                                      <div className="flex items-center gap-3">
                                        {order.status === status && <Check className="w-3.5 h-3.5 text-[#0ea5e9]" />}
                                        <span className={order.status === status ? 'text-slate-900 font-bold ml-0' : 'ml-7'}>{status}</span>
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end items-center gap-2">
                              <button onClick={() => handleDuplicateOrder(order)} className="p-2 text-slate-400 hover:text-sky-500 transition-colors" title="Duplicar Pedido"><Copy className="w-4 h-4" /></button>
                              <button onClick={() => handleEditOrder(order)} className="p-2 text-slate-400 hover:text-blue-500 transition-colors"><Edit2 className="w-4 h-4" /></button>
                              <button onClick={() => deleteOrderHandler(order.id)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={11} className="py-24 text-center text-slate-400 italic">Nenhum pedido encontrado.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <h2 className="text-3xl font-extrabold text-[#0f172a]">Estoque de Filamento</h2>
                <p className="text-slate-500 text-sm font-medium">Gerencie seu inventário de materiais e acompanhe custos.</p>
              </div>
              <button onClick={() => { setNewFilament({ brand: '', material: '', color: '', initialWeight: 1, currentWeight: 1, costPerKg: 0, freight: 0, purchaseDate: new Date().toISOString().split('T')[0] }); setFilamentQuantity(1); setEditingFilamentId(null); setIsFilamentModalOpen(true); }} className="flex items-center gap-2 px-6 py-3 bg-[#0ea5e9] text-white rounded-xl font-bold text-sm hover:bg-[#0284c7] shadow-md shadow-sky-100">
                <Plus className="w-4 h-4" /> Novo Carretel
              </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                <div className="w-full md:w-56">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Filtrar por Cor</label>
                  <select value={filterColor} onChange={(e) => setFilterColor(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-[#0ea5e9]/10">
                    <option value="">Todas as Cores</option>
                    {Array.from(new Set(filaments.map(f => f.color).filter(Boolean))).sort().map(color => (
                      <option key={color} value={color}>{color}</option>
                    ))}
                  </select>
                </div>
                <div className="w-full md:w-56">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Filtrar por Material</label>
                  <select value={filterMaterial} onChange={(e) => setFilterMaterial(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-[#0ea5e9]/10">
                    <option value="">Todos os Materiais</option>
                    {Array.from(new Set(filaments.map(f => f.material).filter(Boolean))).sort().map(mat => (
                      <option key={mat} value={mat}>{mat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-6 bg-slate-50 rounded-xl px-6 py-2 border border-slate-100">
                <div className="text-right">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quantidade</span>
                  <span className="text-lg font-black text-slate-800 leading-none">{filaments.filter(f => (!filterColor || f.color === filterColor) && (!filterMaterial || f.material === filterMaterial)).length} <span className="text-xs text-slate-500 font-medium">unid.</span></span>
                </div>
                <div className="h-8 w-px bg-slate-200"></div>
                <div className="text-right">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Peso Total</span>
                  <span className="text-lg font-black text-[#0ea5e9] leading-none">{filaments.filter(f => (!filterColor || f.color === filterColor) && (!filterMaterial || f.material === filterMaterial)).reduce((acc, curr) => acc + curr.currentWeight, 0).toFixed(2)} <span className="text-xs text-slate-500 font-medium">kg</span></span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto min-h-[400px]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-50 bg-slate-50/50">
                      <th className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">Filamento</th>
                      <th className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">Cor</th>
                      <th className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">Estoque</th>
                      <th className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">Peso Restante</th>
                      <th className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">Data</th>
                      <th className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">Custo Total</th>
                      <th className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filaments.filter(f => (!filterColor || f.color === filterColor) && (!filterMaterial || f.material === filterMaterial)).map((filament) => {
                      const percentage = (filament.currentWeight / filament.initialWeight) * 100;
                      return (
                        <tr key={filament.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-2 text-left"><div className="flex flex-col"><span className="text-sm font-bold text-slate-900">{filament.brand}</span><span className="text-xs text-slate-400 font-medium">{filament.material}</span></div></td>
                          <td className="px-4 py-2 text-sm font-medium text-slate-600 text-center">{filament.color}</td>
                          <td className="px-4 py-2"><div className="flex flex-col gap-1.5 mx-auto max-w-[200px]"><div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden"><div className={`h-full rounded-full transition-all duration-500 ` + getProgressColor(percentage)} style={{ width: percentage + "%" }}></div></div><span className="text-[10px] font-bold text-slate-400 text-center">{Math.round(percentage)}%</span></div></td>
                          <td className="px-4 py-2 text-sm font-bold text-slate-900 text-center">{filament.currentWeight.toFixed(2)} / {filament.initialWeight.toFixed(1)} kg</td>
                          <td className="px-4 py-2 text-sm font-medium text-slate-600 text-center">{filament.purchaseDate ? new Date(filament.purchaseDate + 'T12:00:00').toLocaleDateString('pt-BR') : '-'}</td>
                          <td className="px-4 py-2 text-center"><div className="flex flex-col"><span className="text-sm font-bold text-slate-900">{formatCurrency(filament.costPerKg + filament.freight)}</span><span className="text-[10px] text-slate-400">({formatCurrency(filament.costPerKg)}/kg + {formatCurrency(filament.freight)} Frete)</span></div></td>
                          <td className="px-4 py-2 text-right">
                            <div className="flex justify-end items-center gap-2">
                              <button onClick={() => handleEditFilament(filament)} className="p-2 text-slate-400 hover:text-blue-500"><Edit2 className="w-4 h-4" /></button>
                              <button onClick={() => deleteFilamentHandler(filament.id)} className="p-2 text-slate-400 hover:text-rose-500"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filaments.length === 0 && (<tr><td colSpan={6} className="py-24 text-center text-slate-400 italic">Nenhum filamento cadastrado.</td></tr>)}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'parts' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <h2 className="text-3xl font-extrabold text-[#0f172a]">Peças de Reposição</h2>
                <p className="text-slate-500 text-sm font-medium">Controle seu estoque de bicos e outros componentes.</p>
              </div>
              <button onClick={() => { setNewPart({ name: '', category: 'Outros', brand: '', quantity: 1, unitCost: 0, purchaseDate: new Date().toISOString().split('T')[0], notes: '' }); setEditingPartId(null); setIsPartModalOpen(true); }} className="flex items-center gap-2 px-6 py-3 bg-[#0ea5e9] text-white rounded-xl font-bold text-sm hover:bg-[#0284c7] shadow-md shadow-sky-100">
                <Plus className="w-4 h-4" /> Nova Peça
              </button>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto min-h-[400px]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-50 bg-slate-50/50">
                      <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Componente</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Categoria</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">Em Estoque</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Custo Unitário</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {replacementParts.map((part) => (
                      <tr key={part.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4"><div className="flex flex-col"><span className="text-sm font-bold text-slate-900">{part.name}</span>{part.notes && <span className="text-[10px] text-slate-400 italic">{part.notes}</span>}</div></td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-600">{part.category}</td>
                        <td className="px-6 py-4 text-center"><span className={`px-4 py-1 rounded-full text-xs font-bold ` + (part.quantity <= 1 ? 'bg-rose-50 text-rose-500' : 'bg-slate-100 text-slate-600')}>{part.quantity} un</span></td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-900">{formatCurrency(part.unitCost)}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end items-center gap-2">
                            <button onClick={() => handleEditPart(part)} className="p-2 text-slate-400 hover:text-blue-500"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={() => deletePartHandler(part.id)} className="p-2 text-slate-400 hover:text-rose-500"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {replacementParts.length === 0 && (<tr><td colSpan={5} className="py-24 text-center text-slate-400 italic">Nenhuma peça cadastrada.</td></tr>)}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}


        {activeTab === 'expenses' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <h2 className="text-3xl font-extrabold text-[#0f172a]">Contas a Pagar</h2>
                <p className="text-slate-500 text-sm font-medium">Gerencie suas despesas e fluxo de caixa.</p>
              </div>
              <button onClick={() => { setNewExpense({ description: '', category: 'Material', amount: 0, dueDate: new Date().toISOString().split('T')[0], status: 'Pendente' }); setEditingExpenseId(null); setIsExpenseModalOpen(true); }} className="flex items-center gap-2 bg-[#0ea5e9] hover:bg-[#0284c7] text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-sky-100 transition-all transform active:scale-95 text-sm">
                <Plus className="w-5 h-5" />
                Nova Conta
              </button>
            </div>

            <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-50 bg-slate-50/50">
                      <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Descrição</th>
                      <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Categoria</th>
                      <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Vencimento</th>
                      <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Valor</th>
                      <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                      <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {expenses.map((expense) => (
                      <tr key={expense.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4"><span className="text-sm font-bold text-slate-900">{expense.description}</span></td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-600">{expense.category}</td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-600">{new Date(expense.dueDate).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-900">{formatCurrency(expense.amount)}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${expense.status === 'Pago' ? 'bg-emerald-50 text-emerald-600' : expense.status === 'Atrasado' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
                            {expense.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end items-center gap-2">
                            <button onClick={() => handleEditExpense(expense)} className="p-2 text-slate-400 hover:text-blue-500"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={() => deleteExpenseHandler(expense.id)} className="p-2 text-slate-400 hover:text-rose-500"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {expenses.length === 0 && (<tr><td colSpan={6} className="py-24 text-center text-slate-400 italic">Nenhuma conta cadastrada.</td></tr>)}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {isSummaryModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsSummaryModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 pb-4 flex items-center justify-between border-b border-slate-50"><div className="flex items-center gap-3"><FileText className="w-5 h-5 text-sky-500" /><h3 className="text-xl font-black text-slate-800">Resumo do Orçamento</h3></div><button onClick={() => setIsSummaryModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full"><X className="w-5 h-5 text-slate-400" /></button></div>
            <div className="p-8"><div className="bg-slate-50 rounded-2xl p-6 font-mono text-sm text-slate-700 whitespace-pre-wrap border border-slate-100 max-h-[400px] overflow-y-auto">{summaryText}</div></div>
            <div className="p-8 pt-0"><button onClick={copyToClipboard} className="w-full flex items-center justify-center gap-2 py-4 bg-sky-500 text-white rounded-2xl font-bold hover:bg-sky-600 shadow-lg shadow-sky-100"><Copy className="w-5 h-5" /> Copiar</button></div>
          </div>
        </div>
      )}

      {isOrderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => { setIsOrderModalOpen(false); setEditingOrderId(null); setNewOrder(EMPTY_ORDER); }}></div>
          <div className="relative bg-white w-full max-w-xl rounded-[24px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {console.log('Rendering Order Modal', newOrder)}
            <div className="px-8 pt-8 pb-2 flex items-center justify-between"><div className="flex flex-col gap-0.5"><h3 className="text-2xl font-black text-slate-800">{editingOrderId ? 'Editar Pedido' : 'Novo Pedido'}</h3><p className="text-slate-400 text-sm font-medium">Preencha os dados abaixo.</p></div><button onClick={() => { setIsOrderModalOpen(false); setEditingOrderId(null); setNewOrder(EMPTY_ORDER); }} className="p-1.5 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5 text-slate-400" /></button></div>
            <div className="p-8 max-h-[75vh] overflow-y-auto space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div><label className="block text-sm font-bold text-slate-900 mb-2">Cliente</label><input type="text" placeholder="Nome do cliente" value={newOrder.customer || ''} onChange={(e) => setNewOrder({ ...newOrder, customer: e.target.value })} className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none font-medium focus:ring-2 focus:ring-[#0ea5e9]/10" /></div>
                <div><label className="block text-sm font-bold text-slate-900 mb-2">Nome da Peça</label><input type="text" placeholder="Ex: Suporte de Fone" value={newOrder.pieceName || ''} onChange={(e) => setNewOrder({ ...newOrder, pieceName: e.target.value })} className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none font-medium focus:ring-2 focus:ring-[#0ea5e9]/10" /></div>
                <div className="relative"><label className="block text-sm font-bold text-slate-900 mb-2">Material</label><div className="relative" onClick={(e) => e.stopPropagation()}><button onClick={() => setIsOrderMaterialDropdownOpen(!isOrderMaterialDropdownOpen)} className="w-full flex items-center justify-between bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none font-medium text-slate-700">{newOrder.material || 'Selecione...'}<ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ` + (isOrderMaterialDropdownOpen ? 'rotate-180' : '')} /></button>{isOrderMaterialDropdownOpen && (<div className="absolute left-0 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-[60] py-1 animate-in fade-in zoom-in-95 origin-top overflow-hidden">{materialOptions.map((mat) => (<button key={mat} onClick={() => { setNewOrder({ ...newOrder, material: mat }); setIsOrderMaterialDropdownOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"><div className="w-4">{newOrder.material === mat && <Check className="w-3.5 h-3.5 text-[#0ea5e9]" />}</div><span>{mat}</span></button>))}</div>)}</div></div>
                <div><label className="block text-sm font-bold text-slate-900 mb-2">Cor</label><input type="text" placeholder="Ex: Preto Matte" value={newOrder.color || ''} onChange={(e) => setNewOrder({ ...newOrder, color: e.target.value })} className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none font-medium" /></div>
                <div className="relative"><label className="block text-sm font-bold text-slate-900 mb-2">Estado</label><div className="relative" onClick={(e) => e.stopPropagation()}><button onClick={() => setIsStateDropdownOpen(!isStateDropdownOpen)} className="w-full flex items-center justify-between bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none font-medium text-slate-700">{newOrder.state || 'UF'}<ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ` + (isStateDropdownOpen ? 'rotate-180' : '')} /></button>{isStateDropdownOpen && (<div className="absolute left-0 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-[60] py-1 animate-in fade-in zoom-in-95 duration-150 origin-top max-h-48 overflow-y-auto">{BRAZILIAN_STATES.map((st) => (<button key={st.sigla} onClick={() => { setNewOrder({ ...newOrder, state: st.sigla }); setIsStateDropdownOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"><div className="w-4">{newOrder.state === st.sigla && <Check className="w-3.5 h-3.5 text-[#0ea5e9]" />}</div><span>{st.nome} ({st.sigla})</span></button>))}</div>)}</div></div>
                <div><label className="block text-sm font-bold text-slate-900 mb-2">Quantidade</label><input type="number" value={newOrder.quantity || 1} onChange={(e) => setNewOrder({ ...newOrder, quantity: parseInt(e.target.value) || 0 })} className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none font-medium" /></div>
                <div className="col-span-1 relative"><label className="block text-sm font-bold text-slate-900 mb-2">Status</label><div className="relative" onClick={(e) => e.stopPropagation()}><button onClick={() => setIsOrderStatusDropdownOpen(!isOrderStatusDropdownOpen)} className="w-full flex items-center justify-between bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none font-medium text-slate-700">{newOrder.status || 'Selecione...'}<ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ` + (isOrderStatusDropdownOpen ? 'rotate-180' : '')} /></button>{isOrderStatusDropdownOpen && (<div className="absolute left-0 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-[60] py-1 animate-in fade-in zoom-in-95 duration-150 origin-top overflow-hidden">{statusOptions.map((opt) => (<button key={opt} onClick={() => { setNewOrder({ ...newOrder, status: opt }); setIsOrderStatusDropdownOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"><div className="w-4">{newOrder.status === opt && <Check className="w-3.5 h-3.5 text-[#0ea5e9]" />}</div><span>{opt}</span></button>))}</div>)}</div></div>
              </div>
              <hr className="border-slate-100" />
              <div className="space-y-6">
                <h4 className="text-base font-bold text-slate-800">Detalhes Técnicos e Financeiros</h4>
                <div className="grid grid-cols-2 gap-6">
                  <div><label className="block text-sm font-bold text-slate-900 mb-2">Custo Unitário (R$)</label><input type="number" step="0.01" value={newOrder.unitCost || 0} onChange={(e) => setNewOrder({ ...newOrder, unitCost: parseFloat(e.target.value) || 0 })} className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none font-medium" /></div>
                  <div><label className="block text-sm font-bold text-slate-900 mb-2">Venda Unitário (R$)</label><input type="number" step="0.01" value={newOrder.unitValue || 0} onChange={(e) => setNewOrder({ ...newOrder, unitValue: parseFloat(e.target.value) || 0 })} className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none font-medium" /></div>
                  <div><label className="block text-sm font-bold text-slate-900 mb-2">Tempo de Impressão Unitário (h)</label><input type="number" step="0.1" value={newOrder.time || 0} onChange={(e) => setNewOrder({ ...newOrder, time: parseFloat(e.target.value) || 0 })} className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none font-medium" /></div>
                  <div><label className="block text-sm font-bold text-slate-900 mb-2">Frete (R$)</label><input type="number" step="0.01" value={newOrder.freight || 0} onChange={(e) => setNewOrder({ ...newOrder, freight: parseFloat(e.target.value) || 0 })} className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none font-medium" /></div>
                </div>
              </div>
              <hr className="border-slate-100" />
              <div><label className="block text-sm font-bold text-slate-900 mb-2">Data do Pedido</label><input type="date" value={newOrder.date ? newOrder.date.split('T')[0] : ''} onChange={(e) => setNewOrder({ ...newOrder, date: e.target.value })} className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none font-medium text-slate-700" /></div>
            </div>
            <div className="px-8 pb-8 pt-4 flex items-center justify-end gap-3 border-t border-slate-50"><button onClick={() => { setIsOrderModalOpen(false); setEditingOrderId(null); setNewOrder(EMPTY_ORDER); }} className="px-6 py-3 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors">Cancelar</button><button onClick={handleSaveOrder} className="px-8 py-3 bg-[#0ea5e9] text-white rounded-2xl text-sm font-black shadow-lg shadow-sky-50 hover:bg-[#0284c7] transform active:scale-95">{editingOrderId ? 'Salvar Alterações' : 'Salvar Pedido'}</button></div>
          </div>
        </div>
      )}

      {isFilamentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => { setIsFilamentModalOpen(false); setEditingFilamentId(null); }}></div>
          <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-8 pt-8 pb-4 flex items-center justify-between"><div className="flex flex-col gap-1"><h3 className="text-xl font-black text-slate-800">{editingFilamentId ? 'Editar' : 'Novo'} Filamento</h3><p className="text-slate-400 text-xs font-medium">Adicione carretel ao estoque.</p></div><button onClick={() => { setIsFilamentModalOpen(false); setEditingFilamentId(null); }} className="p-1.5 hover:bg-slate-100 rounded-full"><X className="w-5 h-5 text-slate-400" /></button></div>
            <div className="p-8 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold text-slate-900 mb-2 uppercase tracking-tight">Marca</label><input type="text" placeholder="Ex: Voolt3D" value={newFilament.brand || ''} onChange={(e) => setNewFilament({ ...newFilament, brand: e.target.value })} className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#0ea5e9]/10 outline-none font-medium placeholder:text-slate-400" /></div>
                <div className="relative"><label className="block text-xs font-bold text-slate-900 mb-2 uppercase tracking-tight">Material</label><div className="relative" onClick={(e) => e.stopPropagation()}><button onClick={() => setIsMaterialDropdownOpen(!isMaterialDropdownOpen)} className={`w-full flex items-center justify-between bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none font-medium ${!newFilament.material ? 'text-slate-400' : 'text-slate-900'}`}>{newFilament.material || 'Selecione...'}<ChevronDown className="w-3.5 h-3.5 text-slate-400" /></button>{isMaterialDropdownOpen && (<div className="absolute left-0 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-[60] py-2 max-h-[200px] overflow-y-auto">{materialOptions.map((mat) => (<button key={mat} onClick={() => { setNewFilament({ ...newFilament, material: mat }); setIsMaterialDropdownOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"><span>{mat}</span></button>))}</div>)}</div></div>
              </div>
              <div><label className="block text-xs font-bold text-slate-900 mb-2 uppercase tracking-tight">Cor</label><input type="text" placeholder="Ex: Azul Naval" value={newFilament.color || ''} onChange={(e) => setNewFilament({ ...newFilament, color: e.target.value })} className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none font-medium placeholder:text-slate-400" /></div>
              {!editingFilamentId && (
                <div><label className="block text-xs font-bold text-slate-900 mb-2 uppercase tracking-tight">Quantidade</label><input type="number" min="1" value={filamentQuantity} onChange={(e) => setFilamentQuantity(Math.max(1, parseInt(e.target.value) || 1))} className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none font-medium" /></div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold text-slate-900 mb-2 uppercase tracking-tight">Peso Inicial (kg)</label><input type="number" step="0.01" value={newFilament.initialWeight || 1} onChange={(e) => setNewFilament({ ...newFilament, initialWeight: parseFloat(e.target.value) || 0 })} className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none font-medium" /></div>
                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-2 uppercase tracking-tight">Peso Atual (kg)</label>
                  <input type="number" step="0.01" value={newFilament.currentWeight || 0} onChange={(e) => setNewFilament({ ...newFilament, currentWeight: parseFloat(e.target.value) || 0 })} className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none font-medium" />
                  <p className="text-[10px] text-slate-400 font-medium mt-1">Quanto resta no carretel</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold text-slate-900 mb-2 uppercase tracking-tight">Custo/kg (R$)</label><input type="number" step="0.01" value={newFilament.costPerKg || 0} onChange={(e) => setNewFilament({ ...newFilament, costPerKg: parseFloat(e.target.value) || 0 })} className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none font-medium" /></div>
                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-2 uppercase tracking-tight">Frete (R$)</label>
                  <input type="number" step="0.01" value={newFilament.freight || 0} onChange={(e) => setNewFilament({ ...newFilament, freight: parseFloat(e.target.value) || 0 })} className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none font-medium" />
                  <p className="text-[10px] text-slate-400 font-medium mt-1">Custo de entrega</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold text-slate-900 mb-2 uppercase tracking-tight">Data da Compra</label><input type="date" value={newFilament.purchaseDate || new Date().toISOString().split('T')[0]} onChange={(e) => setNewFilament({ ...newFilament, purchaseDate: e.target.value })} className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none font-medium text-slate-600" /></div>
              </div>
            </div>
            <div className="px-8 pb-8 flex items-center justify-end gap-3"><button onClick={() => { setIsFilamentModalOpen(false); setEditingFilamentId(null); }} className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50">Cancelar</button><button onClick={handleSaveFilament} className="px-7 py-2.5 bg-[#0ea5e9] text-white rounded-xl text-xs font-bold hover:bg-[#0284c7] shadow-lg shadow-sky-50">Salvar</button></div>
          </div>
        </div>
      )}

      {isPartModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => { setIsPartModalOpen(false); setEditingPartId(null); }}></div>
          <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-8 pt-8 pb-4 flex items-center justify-between"><div className="flex flex-col gap-1"><h3 className="text-xl font-black text-slate-800">{editingPartId ? 'Editar' : 'Nova'} Peça</h3></div><button onClick={() => { setIsPartModalOpen(false); setEditingPartId(null); }} className="p-1.5 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5 text-slate-400" /></button></div>
            <div className="p-8 space-y-5">
              <div><label className="block text-xs font-bold text-slate-900 mb-2 uppercase tracking-tight">Nome</label><input type="text" value={newPart.name || ''} onChange={(e) => setNewPart({ ...newPart, name: e.target.value })} className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none font-medium" /></div>
              <div className="grid grid-cols-2 gap-4"><div><label className="block text-xs font-bold text-slate-900 mb-2 uppercase tracking-tight">Qtd</label><input type="number" value={newPart.quantity || 1} onChange={(e) => setNewPart({ ...newPart, quantity: parseInt(e.target.value) || 0 })} className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none font-medium" /></div><div><label className="block text-xs font-bold text-slate-900 mb-2 uppercase tracking-tight">Custo</label><input type="number" step="0.01" value={newPart.unitCost || 0} onChange={(e) => setNewPart({ ...newPart, unitCost: parseFloat(e.target.value) || 0 })} className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none font-medium" /></div></div>
            </div>
            <div className="px-8 pb-8 flex items-center justify-end gap-3"><button onClick={() => { setIsPartModalOpen(false); setEditingPartId(null); }} className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50">Cancelar</button><button onClick={handleSavePart} className="px-7 py-2.5 bg-[#0ea5e9] text-white rounded-xl text-xs font-bold hover:bg-[#0284c7] shadow-lg shadow-sky-50">Salvar</button></div>
          </div>
        </div>
      )}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => { setIsExpenseModalOpen(false); setEditingExpenseId(null); }}></div>
          <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-8 pt-8 pb-4 flex items-center justify-between"><div className="flex flex-col gap-1"><h3 className="text-xl font-black text-slate-800">{editingExpenseId ? 'Editar' : 'Nova'} Conta</h3></div><button onClick={() => { setIsExpenseModalOpen(false); setEditingExpenseId(null); }} className="p-1.5 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5 text-slate-400" /></button></div>
            <div className="p-8 space-y-5">
              <div><label className="block text-xs font-bold text-slate-900 mb-2 uppercase tracking-tight">Descrição</label><input type="text" value={newExpense.description || ''} onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })} className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none font-medium" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold text-slate-900 mb-2 uppercase tracking-tight">Categoria</label><input type="text" value={newExpense.category || ''} onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })} className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none font-medium" /></div>
                <div><label className="block text-xs font-bold text-slate-900 mb-2 uppercase tracking-tight">Valor</label><input type="number" step="0.01" value={newExpense.amount || 0} onChange={(e) => setNewExpense({ ...newExpense, amount: parseFloat(e.target.value) || 0 })} className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none font-medium" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold text-slate-900 mb-2 uppercase tracking-tight">Vencimento</label><input type="date" value={newExpense.dueDate || ''} onChange={(e) => setNewExpense({ ...newExpense, dueDate: e.target.value })} className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none font-medium text-slate-600" /></div>
                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-2 uppercase tracking-tight">Status</label>
                  <select value={newExpense.status || 'Pendente'} onChange={(e) => setNewExpense({ ...newExpense, status: e.target.value as any })} className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none font-medium text-slate-600">
                    <option value="Pendente">Pendente</option>
                    <option value="Pago">Pago</option>
                    <option value="Atrasado">Atrasado</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="px-8 pb-8 flex items-center justify-end gap-3"><button onClick={() => { setIsExpenseModalOpen(false); setEditingExpenseId(null); }} className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50">Cancelar</button><button onClick={handleSaveExpense} className="px-7 py-2.5 bg-[#0ea5e9] text-white rounded-xl text-xs font-bold hover:bg-[#0284c7] shadow-lg shadow-sky-50">Salvar</button></div>
          </div>
        </div>
      )}


      <footer className="max-w-[95rem] mx-auto px-4 text-center mt-12 pb-12 pt-8 border-t border-slate-100">
        <p className="text-slate-400 text-xs font-bold tracking-widest uppercase">3D Print Flow &bull; Gestão Profissional</p>
      </footer>
    </div>
  );
};

export default App;

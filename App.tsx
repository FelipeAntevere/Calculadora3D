import React, { useState, useMemo, useEffect } from 'react';
import {
  LogOut,
  LayoutDashboard,
  Calculator,
  ShoppingBag,
  Database,
  Wrench,
  DollarSign,
  Printer,
  FileText,
  X,
  Copy,
  Loader2
} from 'lucide-react';

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
import { useDashboardStats } from './hooks/useDashboardStats';

// Components
import { DashboardView } from './components/Dashboard/DashboardView';
import { CalculatorView } from './components/Calculator/CalculatorView';
import { OrdersView } from './components/Orders/OrdersView';
import { InventoryView } from './components/Inventory/InventoryView';
import { PartsView } from './components/Parts/PartsView';
import { ExpensesView } from './components/Expenses/ExpensesView';

// Modals
import { OrderModal } from './components/Modals/OrderModal';
import { FilamentModal } from './components/Modals/FilamentModal';
import { PartModal } from './components/Modals/PartModal';
import { ExpenseModal } from './components/Modals/ExpenseModal';

// Utils
import { formatCurrency } from './utils/formatters';

/**
 * Main Application Component (Refactored)
 * Orchestrates the different views and manages global application state.
 */
const App: React.FC = () => {
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Tab state
  const [activeTab, setActiveTab] = useState<'dashboard' | 'calculator' | 'orders' | 'inventory' | 'parts' | 'expenses'>('dashboard');

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
    calcInputs,
    setCalcInputs,
    calcResults,
    saveDefaults,
    resetInputs,
    clearSavedDefaults
  } = useCalculator(INITIAL_CALC_INPUTS);

  // Dash filters
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [dashboardScope, setDashboardScope] = useState<'month' | 'year' | 'all'>('month');

  // Comparison state
  const [isComparing, setIsComparing] = useState(false);
  const [compYear, setCompYear] = useState(currentMonth === 0 ? currentYear - 1 : currentYear);
  const [compMonth, setCompMonth] = useState(currentMonth === 0 ? 11 : currentMonth - 1);

  // Derive proper CostsConfig from calculator inputs
  const costsConfig = {
    materialPricePerGram: calcInputs.filamentCostPerKg / 1000,
    energyPricePerKWh: calcInputs.kWhCost,
    laborPricePerHour: calcInputs.laborHourValue,
    depreciationPricePerHour: calcInputs.maintenancePerHour
  };

  // Dashboard Metrics Hook
  const dashMetrics = useDashboardStats(
    orders,
    selectedYear,
    selectedMonth,
    dashboardScope,
    isComparing ? compYear : undefined,
    isComparing ? compMonth : undefined,
    costsConfig
  );

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
        loadExpenses()
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
  const statusOptions: OrderStatus[] = ['Orçamento', 'Produção', 'Finalizado', 'Entregue', 'Cancelado'];
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
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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
  }, [expenses, expenseMonthFilter, expenseYearFilter]);

  const expenseMetrics = useExpenseMetrics(filteredExpenses);

  // UI Helper functions
  const getStatusStyle = (status: OrderStatus) => {
    switch (status) {
      case 'Orçamento': return 'bg-slate-100 text-slate-600';
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
    if (!newOrder.customer || !newOrder.pieceName || !newOrder.material || !newOrder.status || !newOrder.state) {
      alert('Preencha os dados obrigatórios.'); return;
    }
    const total = ((newOrder.quantity || 1) * (newOrder.unitValue || 0)) + (newOrder.freight || 0);
    await saveOrder({ ...newOrder, total });
    setIsOrderModalOpen(false);
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
              { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
              { id: 'calculator', icon: Calculator, label: 'Calculadora' },
              { id: 'orders', icon: ShoppingBag, label: 'Pedidos' },
              { id: 'inventory', icon: Database, label: 'Estoque' },
              { id: 'parts', icon: Wrench, label: 'Peças' },
              { id: 'expenses', icon: DollarSign, label: 'Contas a Pagar' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id
                  ? 'bg-white text-[#0ea5e9] shadow-md shadow-slate-200/50'
                  : 'text-slate-400 hover:text-slate-700'
                  }`}
              >
                <tab.icon size={15} />
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-5">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-[10px] font-black text-slate-300 uppercase underline decoration-sky-500/30 underline-offset-4 tracking-widest leading-none mb-1.5">Perfil Ativo</span>
              <span className="text-xs font-bold text-slate-500 max-w-[150px] truncate">{user.email}</span>
            </div>
            <button
              onClick={handleSignOut}
              className="p-3 bg-white border border-slate-100 text-slate-400 hover:text-rose-500 hover:border-rose-100 hover:bg-rose-50 rounded-2xl transition-all shadow-sm active:scale-95"
            >
              <LogOut size={18} />
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
            {activeTab === 'dashboard' && (
              <DashboardView
                metrics={dashMetrics}
                selectedYear={selectedYear}
                setSelectedYear={setSelectedYear}
                selectedMonth={selectedMonth}
                setSelectedMonth={setSelectedMonth}
                dashboardScope={dashboardScope}
                setDashboardScope={setDashboardScope}
                isComparing={isComparing}
                setIsComparing={setIsComparing}
                compYear={compYear}
                setCompYear={setCompYear}
                compMonth={compMonth}
                setCompMonth={setCompMonth}
              />
            )}
            {activeTab === 'calculator' && (
              <CalculatorView
                calcInputs={calcInputs}
                setCalcInputs={setCalcInputs}
                calcResults={calcResults}
                handleSaveDefaults={saveDefaults}
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
              />
            )}
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

      {isSummaryModalOpen && (
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
      )}

      <footer className="max-w-[95rem] mx-auto px-6 text-center mt-20 pb-16 pt-10 border-t border-slate-100">
        <div className="flex flex-col items-center gap-4">
          <p className="text-slate-300 text-[10px] font-black tracking-[0.4em] uppercase">Built with Precision &bull; 3D Print Flow</p>
          <div className="flex items-center gap-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sistemas Conectados</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;

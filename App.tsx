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
  RefreshCcw,
  Cloud,
  CloudOff,
  Moon,
  Sun
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';

// supabase
import { supabase } from './services/supabase';
import { User } from '@supabase/supabase-js';
import Auth from './components/Auth';

// Types and Constants
import { Order, Filament, ReplacementPart, Expense, OrderStatus, FilamentMaterial, PartCategory } from './types';
import { MONTH_NAMES, DEFAULT_COSTS_CONFIG, EMPTY_ORDER, INITIAL_CALC_INPUTS } from './constants';

import { useAuth } from './contexts/AuthContext';
import { useData } from './contexts/DataContext';
import { useToast } from './contexts/ToastContext';
// Components
// Lazy Load Main Views
import { lazyWithRetry } from './components/Common/ErrorBoundary';
const CalculatorView = lazyWithRetry(() => import('./components/Calculator/CalculatorView').then(module => ({ default: module.CalculatorView })));
const OrdersView = lazyWithRetry(() => import('./components/Orders/OrdersView').then(module => ({ default: module.OrdersView })));
const InventoryView = lazyWithRetry(() => import('./components/Inventory/InventoryView').then(module => ({ default: module.InventoryView })));
const PartsView = lazyWithRetry(() => import('./components/Parts/PartsView').then(module => ({ default: module.PartsView })));
const ExpensesView = lazyWithRetry(() => import('./components/Expenses/ExpensesView').then(module => ({ default: module.ExpensesView })));

// Modals
import { OrderModalV2 as OrderModal } from './components/Modals/OrderModalV2';
import { FilamentModal } from './components/Modals/FilamentModal';
import { PartModal } from './components/Modals/PartModal';
import { ExpenseModal } from './components/Modals/ExpenseModal';
import { RecurringExpensesModal } from './components/Modals/RecurringExpensesModal';
import { CapitalInjectionModal } from './components/Modals/CapitalInjectionModal';
import { CapitalReportModal } from './components/Modals/CapitalReportModal';
import { TableSkeleton, CardSkeleton, Skeleton } from './components/Common/Skeleton';

// Utils
import { formatCurrency, formatDuration } from './utils/formatters';
import { generateProfessionalQuote } from './utils/pdfGenerator';

/**
 * Main Application Component (Refactored)
 * Orchestrates the different views and manages global application state.
 */
const AppContent: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  // Tab state
  const [activeTab, setActiveTab] = useState<'calculator' | 'orders' | 'inventory' | 'parts' | 'expenses'>('calculator');

  // Modal States
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isFilamentModalOpen, setIsFilamentModalOpen] = useState(false);
  const [isPartModalOpen, setIsPartModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
  const [isInjectionModalOpen, setIsInjectionModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);

  // Modal Data
  const [newOrder, setNewOrder] = useState<Partial<Order>>(EMPTY_ORDER);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [newFilament, setNewFilament] = useState<Partial<Filament>>({});
  const [filamentQuantity, setFilamentQuantity] = useState(1);
  const [editingFilamentId, setEditingFilamentId] = useState<string | null>(null);
  const [newPart, setNewPart] = useState<Partial<ReplacementPart>>({});
  const [editingPartId, setEditingPartId] = useState<string | null>(null);
  const [newExpense, setNewExpense] = useState<Partial<Expense>>({});
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [activeInjectionType, setActiveInjectionType] = useState<'add' | 'remove'>('add');
  const [summaryText, setSummaryText] = useState('');

  // UI Local States
  const [filamentColorFilter, setFilamentColorFilter] = useState('Todos');
  const {
    user,
    userRole,
    isLoading: authLoading,
    signOut
  } = useAuth();

  const {
    orders,
    expenses,
    filaments,
    parts,
    injections,
    saveOrder,
    removeOrder,
    changeOrderStatus,
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
    isLoading: dataLoading,
    isInitialLoad,
    refreshAll,
    selectedYear,
    setSelectedYear,
    selectedMonth,
    setSelectedMonth,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    selectedDay,
    setSelectedDay,
    expenseMonthFilter,
    setExpenseMonthFilter,
    expenseYearFilter,
    setExpenseYearFilter,
    cashFlow,
    filteredOrdersList,
    statusCounts,
    filteredExpenses,
    expenseMetrics,
    handleGenerateRecurringExpenses,
    templates,
    addTemplate,
    updateTemplate,
    removeTemplate
  } = useData();

  const { showToast } = useToast();

  // Tab state

  const handleSignOut = async () => {
    await signOut();
  };

  // Enums for UI selects and filters
  const statusOptions: OrderStatus[] = ['Pedidos', 'Produção', 'Finalizado', 'Entregue', 'Cancelado'];
  const materialOptions: FilamentMaterial[] = ['PLA', 'PLA Silk', 'ABS', 'PETG', 'TPU', 'ASA', 'Nylon', 'Resina'];
  const partCategoryOptions: PartCategory[] = ['Bico (Nozzle)', 'Mesa (Bed)', 'Correia', 'Ventilador', 'Sensor', 'Extrusora', 'Eletrônica', 'Outros'];

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
    console.log('[onSaveOrder] Clicked. Current order state:', newOrder);
    try {
      const missing = [];
      if (!newOrder.customer) missing.push('Cliente');
      if (!newOrder.pieceName) missing.push('Nome da Peça');
      if (!newOrder.material) missing.push('Material');
      if (!newOrder.status) missing.push('Status');
      if (!newOrder.state) missing.push('Estado');

      if (missing.length > 0) {
        console.warn('[onSaveOrder] Validation failed. Missing:', missing);
        showToast(`⚠️ Campos obrigatórios: ${missing.join(', ')}`, 'error');
        // If they are missing fields likely at the top, and they are at the bottom, 
        // the modal won't scroll automatically without extra work, but we added a reset above.
        return;
      }

      console.log('[onSaveOrder] Validation passed. Calculating totals...');
      const total = ((newOrder.quantity || 1) * (newOrder.unitValue || 0)) + (newOrder.freight || 0);

      // Guard for calcResults
      const maintenanceRate = calcResults?.hourlyMaintenanceRate || 0.2; // fallback to 0.2 if missing
      const maintenanceCost = (newOrder.time || 0) * (newOrder.quantity || 1) * maintenanceRate;

      const payload = { ...newOrder, total, maintenanceCost };
      console.log('[onSaveOrder] Saving payload:', payload);

      await saveOrder(payload);

      console.log('[onSaveOrder] Save successful!');
      showToast('Pedido salvo com sucesso!', 'success');
      setIsOrderModalOpen(false);
    } catch (error) {
      console.error('[onSaveOrder] CRITICAL SAVE ERROR:', error);
      showToast(`❌ Erro ao salvar: ${error instanceof Error ? error.message : JSON.stringify(error)}`, 'error');
    }
  };

  const onGenerateSummary = () => {
    const text = "📊 *RESUMO DE PRECIFICAÇÃO - 3D PRINT FLOW*\n" +
      "---------------------------------------\n" +
      "⏱️ *Tempo de Impressão:* " + formatDuration(calcInputs.printingTime) + "\n" +
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

  // UI Local States
  const [showSlowLoadingMessage, setShowSlowLoadingMessage] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (authLoading) {
      timer = setTimeout(() => {
        setShowSlowLoadingMessage(true);
      }, 4000);
    } else {
      setShowSlowLoadingMessage(false);
    }
    return () => clearTimeout(timer);
  }, [authLoading]);

  // UI Helper functions
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center gap-6 p-6">
        <div className="relative">
          <Loader2 className="w-12 h-12 text-sky-500 animate-spin" />
          <div className="absolute inset-0 blur-xl bg-sky-200/50 -z-10 animate-pulse"></div>
        </div>

        <div className="flex flex-col items-center gap-2 text-center max-w-xs transition-all animate-in fade-in duration-1000">
          <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">
            {showSlowLoadingMessage ? 'Estabelecendo conexão estável...' : 'Autenticando...'}
          </p>

          {showSlowLoadingMessage && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <p className="text-slate-400 text-xs leading-relaxed">
                A resposta do servidor está demorando um pouco mais que o esperado.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-white border border-slate-200 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-colors shadow-sm"
              >
                Tentar Recarregar
              </button>
            </motion.div>
          )}
        </div>
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
            ].filter(tab => tab.id !== 'expenses' || userRole === 'admin')
              .map(tab => (
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
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
              {dataLoading ? (
                <RefreshCcw className="w-3.5 h-3.5 text-sky-500 animate-spin" />
              ) : (
                <Cloud className="w-3.5 h-3.5 text-emerald-500" />
              )}
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                {dataLoading ? 'Sincronizando' : 'Conectado'}
              </span>
            </div>

            <button
              onClick={() => refreshAll()}
              disabled={dataLoading}
              className={`p-2 rounded-xl transition-all ${dataLoading ? 'text-slate-300' : 'text-slate-400 hover:text-sky-500 hover:bg-sky-50'}`}
              title="Sincronizar dados agora"
            >
              <RefreshCcw className={`w-5 h-5 ${dataLoading ? 'animate-spin' : ''}`} />
            </button>

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
      </header >

      <main className="max-w-[95rem] mx-auto px-6 py-10">
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-700">
          {isInitialLoad && (
            <div className="mb-8 p-4 bg-sky-50 border border-sky-100 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-sky-500 animate-spin" />
                <p className="text-sm font-bold text-sky-700">Carregando dados iniciais...</p>
              </div>
              <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest px-3">Aguarde um momento</p>
            </div>
          )}


          {/* Dashboard removed */}
          <div className="relative">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.1, ease: 'easeOut' }}
            >
              <React.Suspense fallback={
                <div className="flex flex-col items-center justify-center p-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
                  <p className="text-slate-400 text-sm">Carregando...</p>
                </div>
              }>
                <div className={activeTab === 'calculator' ? '' : 'hidden'}>
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
                </div>
                <div className={activeTab === 'orders' ? '' : 'hidden'}>
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
                    isAdmin={userRole === 'admin'}
                  />
                </div>
                <div className={activeTab === 'inventory' ? '' : 'hidden'}>
                  {(() => {
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
                </div>
                <div className={activeTab === 'parts' ? '' : 'hidden'}>
                  <PartsView
                    replacementParts={parts}
                    onNewPart={() => {
                      setNewPart({ name: '', category: 'Outros', brand: '', quantity: 1, unitCost: 0, freight: 0, purchaseDate: new Date().toISOString().split('T')[0] });
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
                </div>
                <div className={activeTab === 'expenses' ? '' : 'hidden'}>
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
                </div>
              </React.Suspense>
            </motion.div>
          </div>
        </div>
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
                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(summaryText);
                      showToast('Resumo copiado para a área de transferência!', 'info');
                    }}
                    className="flex-1 flex items-center justify-center gap-3 py-5 bg-slate-100 text-slate-700 rounded-[24px] font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-200 transition-all active:scale-95"
                  >
                    <Copy size={18} />
                    Copiar
                  </button>
                  <button
                    onClick={async () => {
                      await generateProfessionalQuote({
                        pieceName: 'Peça de Teste', // Fallback
                        material: calcInputs.materialType || 'PLA',
                        weight: calcInputs.partWeight,
                        time: calcInputs.printingTime,
                        quantity: 1,
                        unitValue: Number(calcResults.total.toFixed(2)),
                        total: Number(calcResults.total.toFixed(2)),
                        details: {
                          materialCost: calcResults.materialCost,
                          energyCost: calcResults.energyCost,
                          laborCost: calcResults.laborCost,
                          maintenanceCost: calcResults.maintenanceCost,
                          fixedRateCost: calcResults.fixedRateCost,
                          profit: calcResults.profit
                        }
                      });
                      showToast('Iniciando download do PDF...', 'success');
                    }}
                    className="flex-1 flex items-center justify-center gap-3 py-5 bg-sky-500 text-white rounded-[24px] font-black text-xs uppercase tracking-[0.2em] hover:bg-sky-600 shadow-2xl shadow-sky-200 transition-all active:scale-95"
                  >
                    <FileText size={18} />
                    Baixar PDF
                  </button>
                </div>
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

import React, { useState } from 'react';
import {
    Check, Search, Filter, Calendar, ChevronDown, ChevronUp, Edit2, Trash2, Copy, Clock, MapPin, Printer, ClipboardList, BarChart3, LayoutGrid, List, ShoppingBag, X
} from 'lucide-react';
import { DropResult } from '@hello-pangea/dnd';
import { KanbanBoard } from './Kanban/KanbanBoard';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Order, OrderStatus } from '../../types';
import { MONTH_NAMES } from '../../constants';

interface OrdersViewProps {
    orders: Order[];
    statusFilter: string;
    setStatusFilter: (status: string) => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    selectedYear: number;
    setSelectedYear: (year: number) => void;
    selectedMonth: number;
    setSelectedMonth: (month: number) => void;
    selectedDay: string;
    setSelectedDay: (day: string) => void;
    statusCounts: Record<string, number>;
    filteredOrdersList: Order[];
    statusOptions: string[];
    handleEditOrder: (order: Order) => void;
    deleteOrderHandler: (id: string) => void;
    updateOrderStatusHandler: (id: string, status: OrderStatus) => void;
    duplicateOrderHandler: (order: Order) => void;
    handleViewFinancials: (order: Order) => void;
    getStatusStyle: (status: OrderStatus) => string;
    onNewOrder: () => void;
    setIsFinancialDetailsOpen: (open: boolean) => void;
    isAdmin?: boolean;
}

/**
 * Orders View Component
 * Manages the list of orders with support for search, filters, and status updates.
 */
export const OrdersView: React.FC<OrdersViewProps> = ({
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    selectedYear,
    setSelectedYear,
    selectedMonth,
    setSelectedMonth,
    selectedDay,
    setSelectedDay,
    statusCounts,
    filteredOrdersList,
    statusOptions,
    handleEditOrder,
    handleViewFinancials,
    deleteOrderHandler,
    updateOrderStatusHandler,
    duplicateOrderHandler,
    getStatusStyle,
    onNewOrder,
    setIsFinancialDetailsOpen,
    isAdmin = false
}) => {
    const [openStatusDropdownId, setOpenStatusDropdownId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban');
    const currentYear = new Date().getFullYear();

    // Close dropdown when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            if (!target.closest('.order-dropdown-wrapper')) {
                setOpenStatusDropdownId(null);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const handleDragEnd = (result: DropResult) => {
        if (!result.destination) return;

        const { source, destination, draggableId } = result;

        if (source.droppableId !== destination.droppableId) {
            updateOrderStatusHandler(draggableId, destination.droppableId as OrderStatus);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col gap-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-2xl font-bold text-[#0f172a] dark:text-white tracking-tight">Pedidos</h2>
                        <p className="text-slate-500 text-sm font-medium">Gerencie e acompanhe o status de todas as suas vendas.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center shadow-sm">
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                title="Visualização em Lista"
                            >
                                <List size={20} />
                            </button>
                            <button
                                onClick={() => setViewMode('kanban')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'kanban' ? 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                title="Visualização Kanban"
                            >
                                <LayoutGrid size={20} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-sky-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Buscar por cliente, peça, material ou estado..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[20px] pl-12 pr-6 py-4 text-sm font-medium outline-none focus:ring-4 focus:ring-sky-500/5 dark:focus:ring-sky-500/10 focus:border-sky-500 transition-all shadow-sm dark:text-slate-200 dark:placeholder-slate-500"
                    />
                </div>

                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col md:flex-row items-center gap-4">
                    <div className="flex items-center gap-2 text-slate-400 mr-2">
                        <Filter className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-widest">Filtros</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter ml-1">Mês</label>
                            <select
                                value={selectedMonth}
                                onChange={(e) => { setSelectedMonth(Number(e.target.value)); setSelectedDay(''); }}
                                className="bg-[#f8fafc] dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 outline-none focus:ring-2 focus:ring-sky-500/20 shadow-sm transition-all"
                            >
                                <option value={-1}>Todos</option>
                                {MONTH_NAMES.map((name, i) => <option key={name} value={i}>{name}</option>)}
                            </select>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter ml-1">Ano</label>
                            <select
                                value={selectedYear}
                                onChange={(e) => { setSelectedYear(Number(e.target.value)); setSelectedDay(''); }}
                                className="bg-[#f8fafc] dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 outline-none focus:ring-2 focus:ring-sky-500/20 shadow-sm transition-all"
                            >
                                {[currentYear - 1, currentYear, currentYear + 1].map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter ml-1">Dia Específico</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                <input
                                    type="date"
                                    value={selectedDay}
                                    onChange={(e) => setSelectedDay(e.target.value)}
                                    className="bg-[#f8fafc] dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 outline-none focus:ring-2 focus:ring-sky-500/20 shadow-sm transition-all dark:[color-scheme:dark]"
                                />
                            </div>
                        </div>

                        {selectedDay && (
                            <button
                                onClick={() => setSelectedDay('')}
                                className="flex items-center gap-1.5 px-3 py-2 text-rose-500 hover:bg-rose-50 rounded-xl text-xs font-bold transition-all self-end mb-0.5"
                            >
                                <X className="w-3.5 h-3.5" /> Limpar
                            </button>
                        )}
                    </div>
                    <div className="md:ml-auto">
                        <div className="bg-sky-50 dark:bg-sky-900/20 px-4 py-2 rounded-xl border border-sky-100 dark:border-sky-900/50 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse"></span>
                            <span className="text-xs font-bold text-sky-600">{filteredOrdersList.length} pedidos encontrados</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 overflow-x-auto pb-4 no-scrollbar">
                    {['Todos', ...statusOptions].map((status) => {
                        const isActive = statusFilter === status;
                        const count = statusCounts[status];
                        return (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`flex items-center gap-3 px-6 py-3 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-300 transform shadow-sm ${isActive
                                    ? 'bg-[#0f172a] dark:bg-sky-600 text-white shadow-lg shadow-slate-200 dark:shadow-sky-900/20 scale-105'
                                    : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 hover:border-slate-200'
                                    }`}
                            >
                                {status}
                                <span className={`flex items-center justify-center min-w-[24px] h-[24px] px-2 rounded-full text-[11px] font-bold ${isActive ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-400'
                                    }`}>
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {viewMode === 'list' ? (
                <div className="bg-white dark:bg-slate-800 rounded-[32px] border border-slate-100 dark:border-slate-700 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 overflow-hidden">
                    <div className="overflow-x-auto min-h-[400px]">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-50 dark:border-slate-700 bg-slate-50/10 dark:bg-slate-900/50">
                                    <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] text-center">Data</th>
                                    <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] text-center">Cliente</th>
                                    <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] text-center">Peça</th>
                                    <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] text-center">UF</th>
                                    <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] text-center">Material</th>
                                    <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] text-center">Qtd</th>
                                    <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] text-center">Peso</th>
                                    <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] text-center">Total</th>
                                    <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] text-center">Status</th>
                                    <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-750">
                                {filteredOrdersList.length > 0 ? (
                                    filteredOrdersList.map((order) => (
                                        <tr key={order.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-750/50 transition-colors group">
                                            <td className="px-6 py-5 text-center">
                                                <p className="text-sm font-semibold text-slate-900 dark:text-white">{formatDate(order.date)}</p>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{order.customer}</p>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 truncate max-w-[150px] mx-auto">{order.pieceName}</p>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <span className="bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 text-[10px] font-bold px-2 py-1 rounded-md">{order.state}</span>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{order.material}</span>
                                                    <span className="text-[10px] text-slate-400 font-medium">{order.color}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-center font-bold text-slate-900 dark:text-white">{order.quantity}</td>
                                            <td className="px-6 py-5 text-center font-bold text-slate-900 dark:text-white">{order.weight}g</td>
                                            <td className="px-6 py-5 text-center">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-sm font-bold text-sky-600 dark:text-sky-400">{formatCurrency(order.total)}</span>
                                                    <span className="text-[10px] text-slate-400 font-medium italic">
                                                        ({formatCurrency((order.quantity || 1) * (order.unitValue || 0))} un + {formatCurrency(order.freight || 0)} Frete)
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <div className="relative inline-block text-left order-dropdown-wrapper">
                                                    <button
                                                        onClick={() => setOpenStatusDropdownId(openStatusDropdownId === order.id ? null : order.id)}
                                                        className={`flex items-center justify-between gap-2 px-4 py-2 rounded-xl text-[11px] font-bold transition-all min-w-[130px] ${getStatusStyle(order.status)} hover:shadow-md active:scale-95`}
                                                    >
                                                        {order.status.toUpperCase()}
                                                        <ChevronDown size={14} className={`transition-transform duration-300 ${openStatusDropdownId === order.id ? 'rotate-180' : ''}`} />
                                                    </button>
                                                    {openStatusDropdownId === order.id && (
                                                        <div className="absolute left-0 mt-3 w-48 bg-white border border-slate-100 rounded-[20px] shadow-2xl z-50 py-2 animate-in fade-in zoom-in-95 duration-200 origin-top-left">
                                                            {statusOptions.map((status) => (
                                                                <button
                                                                    key={status}
                                                                    onClick={() => {
                                                                        updateOrderStatusHandler(order.id, status as OrderStatus);
                                                                        setOpenStatusDropdownId(null);
                                                                    }}
                                                                    className={`flex items-center justify-between w-full px-5 py-2.5 text-xs font-bold transition-all ${order.status === status ? 'bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-750'
                                                                        }`}
                                                                >
                                                                    {status}
                                                                    {order.status === status && <Check size={14} />}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <div className="flex justify-center items-center gap-1">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleViewFinancials(order);
                                                        }}
                                                        className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all"
                                                        title="Ver Detalhamento Financeiro"
                                                    >
                                                        <BarChart3 size={18} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); duplicateOrderHandler(order); }}
                                                        className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-xl transition-all"
                                                        title="Duplicar Pedido"
                                                    >
                                                        <Copy size={18} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleEditOrder(order); }}
                                                        className="p-2 text-slate-400 hover:text-sky-500 hover:bg-sky-50 rounded-xl transition-all"
                                                        title="Editar Pedido"
                                                    >
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); deleteOrderHandler(order.id); }}
                                                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                                        title="Excluir Pedido"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={9} className="py-24 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-full text-slate-300 dark:text-slate-600">
                                                    <ShoppingBag size={40} />
                                                </div>
                                                <p className="text-slate-400 text-sm font-bold italic uppercase tracking-widest">Nenhum pedido encontrado</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <KanbanBoard
                    orders={statusFilter === 'Todos'
                        ? filteredOrdersList.filter(o => o.status !== 'Entregue' && o.status !== 'Cancelado')
                        : filteredOrdersList
                    }
                    statusOptions={statusOptions}
                    onDragEnd={handleDragEnd}
                    onCardClick={handleEditOrder}
                    onViewFinancials={handleViewFinancials}
                    getStatusStyle={getStatusStyle}
                    onDelete={deleteOrderHandler}
                />
            )}
        </div>
    );
};

import React from 'react';
import {
    DollarSign,
    ShoppingBag,
    TrendingUp,
    Users,
    Database,
    Clock,
    MapPin
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar
} from 'recharts';
import StatCard from '../StatCard';
import { formatCurrency } from '../../utils/formatters';
import { ComparisonMetrics } from '../../hooks/useDashboardStats';
import { MONTH_NAMES, BRAZILIAN_STATES } from '../../constants';
import { ComparisonBanner } from './ComparisonBanner';

interface DashboardViewProps {
    metrics: ComparisonMetrics;
    dashboardScope: 'month' | 'year' | 'all';
    setDashboardScope: (scope: 'month' | 'year' | 'all') => void;
    selectedYear: number;
    setSelectedYear: (year: number) => void;
    selectedMonth: number;
    setSelectedMonth: (month: number) => void;
    isComparing: boolean;
    setIsComparing: (value: boolean) => void;
    compYear: number;
    setCompYear: (year: number) => void;
    compMonth: number;
    setCompMonth: (month: number) => void;
    compStartDate?: string;
    setCompStartDate?: (date: string) => void;
    compEndDate?: string;
    setCompEndDate?: (date: string) => void;
    orders?: any[]; // Making optional for now to avoid breaking while updating App
}

/**
 * Dashboard view component
 * Handles displaying metrics, charts, and period comparison
 */
export const DashboardView: React.FC<DashboardViewProps> = ({
    metrics,
    dashboardScope,
    setDashboardScope,
    selectedYear,
    setSelectedYear,
    selectedMonth,
    setSelectedMonth,
    isComparing,
    setIsComparing,
    compYear,
    setCompYear,
    compMonth,
    setCompMonth,
    compStartDate,
    setCompStartDate,
    compEndDate,
    setCompEndDate,
    orders = []
}) => {
    const current = metrics.current;
    const variations = metrics.variations;

    // Available years for selection - in a real app these would come from the data
    const years = [2024, 2025];

    const comparisonLabel = isComparing
        ? dashboardScope === 'month'
            ? `${MONTH_NAMES[compMonth]} ${compYear}`
            : `${compYear}`
        : undefined;

    const getDateRangeLabel = () => {
        if (dashboardScope === 'all' && orders && orders.length > 0) {
            const dates = orders.map(o => new Date(o.date).getTime());
            const minDate = new Date(Math.min(...dates));
            const maxDate = new Date(Math.max(...dates));

            return (
                <span className="block text-xs text-sky-500 font-bold mt-1 bg-sky-50 inline-block px-2 py-0.5 rounded-md border border-sky-100">
                    De {minDate.toLocaleDateString('pt-BR')} até {maxDate.toLocaleDateString('pt-BR')}
                </span>
            );
        }
        return null;
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500" >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Dashboard</h2>
                    <p className="text-slate-500 text-sm font-medium">Visão geral financeira baseada nos pedidos salvos.</p>
                    {getDateRangeLabel()}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Scope Selectors */}
                    <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                        {[
                            { id: 'month', label: 'Mensal' },
                            { id: 'year', label: 'Anual' },
                            { id: 'all', label: 'Geral' }
                        ].map((s) => (
                            <button
                                key={s.id}
                                onClick={() => setDashboardScope(s.id as any)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${dashboardScope === s.id
                                    ? 'bg-sky-500 text-white shadow-md shadow-sky-100'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                {s.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2">
                        {dashboardScope !== 'all' && (
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(Number(e.target.value))}
                                className="bg-white border border-slate-200 rounded-xl text-slate-600 text-xs font-bold p-2.5 focus:ring-2 focus:ring-sky-500 shadow-sm outline-none"
                            >
                                {years.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        )}

                        {(dashboardScope === 'month' || dashboardScope === 'all') && (
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                className="bg-white border border-slate-200 rounded-xl text-slate-600 text-xs font-bold p-2.5 focus:ring-2 focus:ring-sky-500 shadow-sm outline-none"
                            >
                                {dashboardScope === 'all' && <option value="-1">Todos os Meses</option>}
                                {MONTH_NAMES.map((name, index) => (
                                    <option key={name} value={index}>{name}</option>
                                ))}
                            </select>
                        )}
                    </div>
                </div>
            </div>

            {/* Comparison Banner */}
            <ComparisonBanner
                isComparing={isComparing}
                onToggleCompare={setIsComparing}
                compYear={compYear}
                compMonth={compMonth}
                onYearChange={setCompYear}
                onMonthChange={setCompMonth}
                availableYears={years}
                compStartDate={compStartDate}
                setCompStartDate={setCompStartDate}
                compEndDate={compEndDate}
                setCompEndDate={setCompEndDate}
                variations={variations}
            />

            {/* Stats Grid */}
            < div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" >
                <StatCard
                    title="Receita Total"
                    value={formatCurrency(current.totalRevenue)}
                    icon={<DollarSign />}
                    iconColor="text-sky-500"
                    description="Faturamento bruto no período"
                    variation={variations ? { value: variations.revenue, isPositive: variations.revenue >= 0 } : undefined}
                    comparisonLabel={comparisonLabel}
                />
                <StatCard
                    title="Lucro Estimado"
                    value={formatCurrency(current.totalProfit)}
                    icon={<TrendingUp />}
                    iconColor="text-emerald-500"
                    valueColorClass="text-emerald-600"
                    description="Receita menos custos de produção"
                    variation={variations ? { value: variations.profit, isPositive: variations.profit >= 0 } : undefined}
                    comparisonLabel={comparisonLabel}
                />
                <StatCard
                    title="Total de Pedidos"
                    value={current.totalOrders}
                    icon={<ShoppingBag />}
                    iconColor="text-amber-500"
                    valueColorClass="text-sky-600"
                    description="Pedidos confirmados"
                    variation={variations ? { value: variations.orders, isPositive: variations.orders >= 0 } : undefined}
                    comparisonLabel={comparisonLabel}
                />
                <StatCard
                    title="Ticket Médio"
                    value={formatCurrency(current.averageTicket)}
                    icon={<Users />}
                    iconColor="text-indigo-500"
                    description="Valor médio por pedido"
                    variation={variations ? { value: variations.ticket, isPositive: variations.ticket >= 0 } : undefined}
                    comparisonLabel={comparisonLabel}
                />
                <StatCard
                    title="Custo de Filamento"
                    value={formatCurrency(current.costBreakdown.material)}
                    icon={<Database />}
                    iconColor="text-rose-500"
                    valueColorClass="text-rose-600"
                    description="Gasto estimado com material"
                    variation={variations ? { value: variations.materialCost, isPositive: variations.materialCost <= 0 } : undefined}
                    comparisonLabel={comparisonLabel}
                />
                <StatCard
                    title="Total de Horas"
                    value={`${current.totalPrintingHours.toFixed(1)}h`}
                    icon={<Clock />}
                    iconColor="text-slate-500"
                    description="Tempo total de impressão"
                    variation={variations ? { value: variations.printingHours, isPositive: variations.printingHours >= 0 } : undefined}
                    comparisonLabel={comparisonLabel}
                />
            </div >

            {/* Charts Section */}
            < div className="grid grid-cols-1 lg:grid-cols-2 gap-6" >
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <TrendingUp size={18} className="text-sky-500" />
                        Faturamento {dashboardScope === 'month' ? 'Diário' : dashboardScope === 'year' ? 'Mensal' : 'Anual'}
                    </h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={current.dailyHistory}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(value) => `R$${value}`} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                                    formatter={(value: number) => [formatCurrency(value), 'Receita']}
                                />
                                <Area type="monotone" dataKey="revenue" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <ShoppingBag size={18} className="text-amber-500" />
                        Volume de Pedidos
                    </h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={current.dailyHistory}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                                    formatter={(value: number) => [value, 'Pedidos']}
                                />
                                <Bar dataKey="orders" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div >

            {/* State Distribution */}
            {
                current.stateDistribution.length > 0 && (
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <h3 className="text-base font-bold text-slate-800 mb-6">Pedidos por Estado</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {current.stateDistribution.map((state) => {
                                const stateName = BRAZILIAN_STATES.find(s => s.sigla === state.state)?.nome || state.state;
                                return (
                                    <div key={state.state} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-white w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sky-600 shadow-sm border border-slate-100">
                                                <MapPin size={20} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-800">{stateName}</p>
                                                <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                                                    <span>{state.orders} pedido(s)</span>
                                                    <span>•</span>
                                                    <span className="text-emerald-600">{formatCurrency(state.revenue)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right pl-2">
                                            <p className="text-xs font-bold text-slate-800">{state.percentage.toFixed(1)}%</p>
                                            <div className="w-16 h-1 w-full bg-slate-200 rounded-full mt-1 overflow-hidden">
                                                <div className="bg-sky-500 h-full" style={{ width: `${state.percentage}%` }}></div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )
            }
        </div >
    );
};

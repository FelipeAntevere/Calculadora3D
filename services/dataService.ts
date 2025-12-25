import { Order, OrderStatus, CostsConfig, DashboardMetrics, CostBreakdown, DailyData, StateDistribution, Filament, ReplacementPart, Expense, CapitalInjection } from '../types';
import { DEFAULT_COSTS_CONFIG } from '../constants';
import { supabase } from './supabase';

/**
 * Helper to retry asynchronous operations that might fail due to network instability.
 * Includes a timeout mechanism to prevent hanging indefinitely.
 */
async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  const timeoutPromise = new Promise<T>((_, reject) =>
    setTimeout(() => reject(new Error('TIMEOUT_EXCEEDED')), 6000) // 6s timeout per attempt
  );

  try {
    return await Promise.race([fn(), timeoutPromise]);
  } catch (error: any) {
    if (retries <= 1) {
      console.error('withRetry: Todas as tentativas falharam.');
      throw error;
    }

    const isTimeout = error.message === 'TIMEOUT_EXCEEDED';
    console.warn(`Operação falhou (${isTimeout ? 'Timeout' : 'Erro'}), tentando novamente... (${retries - 1} restantes)`);

    await new Promise(resolve => setTimeout(resolve, delay));
    return withRetry(fn, retries - 1, delay * 1.5);
  }
}

/**
 * Parses a "YYYY-MM-DD" string (or ISO string) as midnight in the local timezone.
 * This prevents the common "one day off" bug caused by Date treating "YYYY-MM-DD" as UTC.
 */
export const parseLocalDate = (dateStr: string | undefined): Date => {
  if (!dateStr) return new Date();
  // If it's just YYYY-MM-DD
  if (dateStr.length === 10 && dateStr.includes('-')) {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  return new Date(dateStr);
};

export const calculateDashboardMetrics = (
  orders: Order[],
  year: number,
  month: number,
  scope: 'month' | 'year' | 'all' = 'month',
  config: CostsConfig = DEFAULT_COSTS_CONFIG
): DashboardMetrics => {
  let totalRevenue = 0;
  let totalCost = 0;
  let totalPrintingHours = 0;

  let estMaterial = 0;
  let estEnergy = 0;
  let estLabor = 0;
  let estDepreciation = 0;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dailyMap: Record<number, { revenue: number, orders: number }> = {};
  const monthlyMap: Record<number, { revenue: number, orders: number }> = {};
  const yearlyMap: Record<number, { revenue: number, orders: number }> = {};
  const stateMap: Record<string, { orders: number, revenue: number }> = {};

  if (scope === 'month') {
    for (let d = 1; d <= daysInMonth; d++) {
      dailyMap[d] = { revenue: 0, orders: 0 };
    }
  } else if (scope === 'year') {
    for (let m = 0; m < 12; m++) {
      monthlyMap[m] = { revenue: 0, orders: 0 };
    }
  }

  const activeOrders = orders.filter(o => o.status !== 'Cancelado');

  activeOrders.forEach(order => {
    // Naive string parsing to avoid UTC issues
    // Assumes order.date is "YYYY-MM-DD" or "YYYY-MM-DDTHH:mm:ss"
    const datePart = (order.date || '').split('T')[0];
    const [yearStr, monthStr, dayStr] = datePart.split('-');

    // Default to current date if parsing fails
    const oYear = parseInt(yearStr) || new Date().getFullYear();
    const oMonth = (parseInt(monthStr) || 1) - 1; // 0-indexed for consistency if needed, though we use the number directly mostly
    const day = parseInt(dayStr) || 1;

    // Create a local date object JUST for getting .getDay() or other specific methods if needed, 
    // but for buckets we use the parsed values.
    const orderDate = new Date(oYear, oMonth, day);
    const qty = Math.max(1, order.quantity || 0);

    const orderProductRevenue = qty * (order.unitValue || 0);
    const orderProductCost = qty * (order.unitCost || 0);
    const totalOrderPrintingTime = qty * (order.time || 0);

    totalRevenue += orderProductRevenue;
    totalCost += orderProductCost;
    totalPrintingHours += totalOrderPrintingTime;

    // Acúmulo por Estado
    const state = order.state || 'N/A';
    if (!stateMap[state]) stateMap[state] = { orders: 0, revenue: 0 };
    stateMap[state].orders += 1;
    stateMap[state].revenue += orderProductRevenue;

    const tMat = (order.weight || 0) * config.materialPricePerGram;
    const tEne = (order.powerConsumption || 0) * config.energyPricePerKWh || ((order.time || 0) * 0.12 * 0.85);
    const tLab = (order.laborTime || 0) * config.laborPricePerHour;
    const tDep = (order.time || 0) * config.depreciationPricePerHour;
    const tTotal = tMat + tEne + tLab + tDep;

    // Logic to properly distribute costs even if total breakdown is imperfect
    if (order.materialCost !== undefined && order.materialCost >= 0) {
      // Exact material cost is known
      estMaterial += order.materialCost * qty;

      const remainingUnitCost = Math.max(0, order.unitCost - order.materialCost);
      const remainingOrderCost = remainingUnitCost * qty;

      const tRest = tEne + tLab + tDep;
      if (tRest > 0 && remainingOrderCost > 0) {
        estEnergy += (tEne / tRest) * remainingOrderCost;
        estLabor += (tLab / tRest) * remainingOrderCost;
        estDepreciation += (tDep / tRest) * remainingOrderCost;
      }
    } else if (tTotal > 0 && orderProductCost > 0) {
      // Fallback to theoretical ratios
      estMaterial += (tMat / tTotal) * orderProductCost;
      estEnergy += (tEne / tTotal) * orderProductCost;
      estLabor += (tLab / tTotal) * orderProductCost;
      estDepreciation += (tDep / tTotal) * orderProductCost;
    }

    if (scope === 'month') {
      if (dailyMap[day]) {
        dailyMap[day].revenue += orderProductRevenue;
        dailyMap[day].orders += 1;
      }
    } else if (scope === 'year') {
      const oMonth = orderDate.getMonth();
      if (monthlyMap[oMonth]) {
        monthlyMap[oMonth].revenue += orderProductRevenue;
        monthlyMap[oMonth].orders += 1;
      }
    } else {
      if (!yearlyMap[oYear]) yearlyMap[oYear] = { revenue: 0, orders: 0 };
      yearlyMap[oYear].revenue += orderProductRevenue;
      yearlyMap[oYear].orders += 1;
    }
  });

  const stateDistribution: StateDistribution[] = Object.entries(stateMap)
    .map(([state, data]) => ({
      state,
      orders: data.orders,
      revenue: data.revenue,
      percentage: totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0
    }))
    .sort((a, b) => b.revenue - a.revenue);

  let dailyHistory: DailyData[] = [];
  if (scope === 'month') {
    dailyHistory = Object.entries(dailyMap).map(([day, data]) => ({
      day: day.padStart(2, '0'),
      revenue: Number(data.revenue.toFixed(2)),
      orders: data.orders
    }));
  } else if (scope === 'year') {
    dailyHistory = Object.entries(monthlyMap).map(([mIndex, data]) => {
      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      return {
        day: monthNames[Number(mIndex)],
        revenue: Number(data.revenue.toFixed(2)),
        orders: data.orders
      };
    });
  } else {
    dailyHistory = Object.entries(yearlyMap)
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([yr, data]) => ({
        day: yr,
        revenue: Number(data.revenue.toFixed(2)),
        orders: data.orders
      }));
  }

  // Fix: Declare and calculate totalProfit from totalRevenue and totalCost
  const totalProfit = totalRevenue - totalCost;

  return {
    totalRevenue,
    totalCost,
    totalProfit,
    totalOrders: activeOrders.length,
    totalPrintingHours,
    averageTicket: activeOrders.length > 0 ? totalRevenue / activeOrders.length : 0,
    costBreakdown: { material: estMaterial, energy: estEnergy, labor: estLabor, depreciation: estDepreciation, total: totalCost },
    dailyHistory,
    stateDistribution
  };
};

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

// --- DATA PERSISTENCE ---

export const fetchOrders = async (): Promise<Order[]> => {
  return withRetry(async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('date', { ascending: true });

    if (error) throw error;
    return data || [];
  }).then(data => (data || []).map(o => {
    // Data normalization for corrupted encodings in existing records
    let cleanStatus = o.status;
    if (typeof cleanStatus === 'string') {
      if (cleanStatus.includes('Produ') && cleanStatus.includes('Ã')) cleanStatus = 'Produção';
      else if ((cleanStatus.includes('Or') && cleanStatus.includes('Ã')) || cleanStatus === 'Orçamento' || cleanStatus === 'Pedido') cleanStatus = 'Pedidos';
    }

    return {
      ...o,
      status: cleanStatus as OrderStatus,
      pieceName: o.piece_name,
      unitValue: o.unit_value,
      unitCost: o.unit_cost,
      powerConsumption: o.power_consumption,
      laborTime: o.labor_time,
      shippingDate: o.shipping_date,
      materialCost: Number(o.material_cost || 0),
      productionDate: o.production_date,
      completionDate: o.completion_date,
      deliveryDate: o.delivery_date,
      maintenanceCost: Number(o.maintenance_cost || 0),
      energyCost: Number(o.energy_cost || 0),
      laborCost: Number(o.labor_cost || 0),
      fixedRateCost: Number(o.fixed_rate_cost || 0),
      extrasCost: Number(o.extras_cost || 0),
      platformFeeValue: Number(o.platform_fee_value || 0),
      profitMarginValue: Number(o.profit_margin_value || 0),
      filamentCostPerKg: Number(o.filament_cost_per_kg || 0),
      laborHourValue: Number(o.labor_hour_value || 0)
    };
  }) as Order[]);
};

export const upsertOrder = async (order: Partial<Order>) => {
  const orderData = {
    ...order,
    // user_id: user.id, // Shared workspace: removed user_id assignment
    piece_name: order.pieceName,
    unit_value: order.unitValue,
    unit_cost: order.unitCost,
    power_consumption: order.powerConsumption,
    labor_time: order.laborTime,
    shipping_date: order.shippingDate || null,
    date: order.date || null,
    material_cost: order.materialCost,
    maintenance_cost: order.maintenanceCost, // NEW MAPPING
    production_date: order.productionDate || null,
    completion_date: order.completionDate || null,
    delivery_date: order.deliveryDate || null,
    energy_cost: order.energyCost,
    labor_cost: order.laborCost,
    fixed_rate_cost: order.fixedRateCost,
    extras_cost: order.extrasCost,
    platform_fee_value: order.platformFeeValue,
    profit_margin_value: order.profitMarginValue,
    filament_cost_per_kg: order.filamentCostPerKg,
    labor_hour_value: order.laborHourValue
  };

  // Remove camelCase fields that are now in snake_case
  delete (orderData as any).pieceName;
  delete (orderData as any).unitValue;
  delete (orderData as any).unitCost;
  delete (orderData as any).powerConsumption;
  delete (orderData as any).laborTime;
  delete (orderData as any).shippingDate;
  delete (orderData as any).materialCost;
  delete (orderData as any).maintenanceCost; // NEW DELETION
  delete (orderData as any).productionDate;
  delete (orderData as any).completionDate;
  delete (orderData as any).deliveryDate;
  delete (orderData as any).energyCost;
  delete (orderData as any).laborCost;
  delete (orderData as any).fixedRateCost;
  delete (orderData as any).extrasCost;
  delete (orderData as any).platformFeeValue;
  delete (orderData as any).profitMarginValue;
  delete (orderData as any).filamentCostPerKg;
  delete (orderData as any).laborHourValue;

  const { data, error } = await supabase
    .from('orders')
    .upsert(orderData)
    .select()
    .single();

  if (error) throw error;

  // Map back to camelCase for UI consistency
  return {
    ...data,
    status: data.status as OrderStatus,
    pieceName: data.piece_name,
    unitValue: data.unit_value,
    unitCost: data.unit_cost,
    powerConsumption: data.power_consumption,
    laborTime: data.labor_time,
    shippingDate: data.shipping_date,
    materialCost: Number(data.material_cost || 0),
    productionDate: data.production_date,
    completionDate: data.completion_date,
    deliveryDate: data.delivery_date,
    maintenanceCost: Number(data.maintenance_cost || 0),
    energyCost: Number(data.energy_cost || 0),
    laborCost: Number(data.labor_cost || 0),
    fixedRateCost: Number(data.fixed_rate_cost || 0),
    extrasCost: Number(data.extras_cost || 0),
    platformFeeValue: Number(data.platform_fee_value || 0),
    profitMarginValue: Number(data.profit_margin_value || 0),
    filamentCostPerKg: Number(data.filament_cost_per_kg || 0),
    laborHourValue: Number(data.labor_hour_value || 0)
  } as Order;
};

export const deleteOrder = async (id: string) => {
  console.log('Attempting to delete order:', id);
  const { error } = await supabase
    .from('orders')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting order:', error);
    throw error;
  }
};

export const updateOrderStatus = async (id: string, status: OrderStatus) => {
  const updates: any = { status };
  const now = new Date().toISOString();

  if (status === 'Produção') updates.production_date = now;
  if (status === 'Finalizado') updates.completion_date = now;
  if (status === 'Entregue') updates.delivery_date = now;

  const { data, error } = await supabase
    .from('orders')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  return {
    ...data,
    status: data.status as OrderStatus,
    pieceName: data.piece_name,
    unitValue: data.unit_value,
    unitCost: data.unit_cost,
    powerConsumption: data.power_consumption,
    laborTime: data.labor_time,
    shippingDate: data.shipping_date,
    materialCost: data.material_cost,
    productionDate: data.production_date,
    completionDate: data.completion_date,
    deliveryDate: data.delivery_date
  } as Order;
};

export const fetchFilaments = async (): Promise<Filament[]> => {
  return withRetry(async () => {
    const { data, error } = await supabase
      .from('filaments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }).then(data => (data || []).map(f => ({
    ...f,
    initialWeight: f.initial_weight,
    currentWeight: f.current_weight,
    costPerKg: f.cost_per_kg,
    purchaseDate: f.purchase_date
  })) as Filament[]);
};

export const upsertFilament = async (filament: Partial<Filament>) => {
  const filamentData = {
    ...filament,
    // user_id: user.id,
    initial_weight: filament.initialWeight,
    current_weight: filament.currentWeight,
    cost_per_kg: filament.costPerKg,
    purchase_date: filament.purchaseDate
  };

  delete (filamentData as any).initialWeight;
  delete (filamentData as any).currentWeight;
  delete (filamentData as any).costPerKg;
  delete (filamentData as any).purchaseDate;

  const { data, error } = await supabase
    .from('filaments')
    .upsert(filamentData)
    .select()
    .single();

  if (error) throw error;

  return {
    ...data,
    initialWeight: data.initial_weight,
    currentWeight: data.current_weight,
    costPerKg: data.cost_per_kg,
    purchaseDate: data.purchase_date
  } as Filament;
};

export const upsertFilaments = async (filaments: Partial<Filament>[]) => {
  const filamentsData = filaments.map(f => {
    const data = {
      ...f,
      // user_id: user.id,
      initial_weight: f.initialWeight,
      current_weight: f.currentWeight,
      cost_per_kg: f.costPerKg,
      purchase_date: f.purchaseDate
    };
    delete (data as any).initialWeight;
    delete (data as any).currentWeight;
    delete (data as any).costPerKg;
    delete (data as any).purchaseDate;
    return data;
  });

  const { data, error } = await supabase
    .from('filaments')
    .upsert(filamentsData)
    .select();

  if (error) throw error;

  return (data || []).map(f => ({
    ...f,
    initialWeight: f.initial_weight,
    currentWeight: f.current_weight,
    costPerKg: f.cost_per_kg,
    purchaseDate: f.purchase_date
  })) as Filament[];
};

export const deleteFilament = async (id: string) => {
  console.log('Attempting to delete filament:', id);
  const { error } = await supabase
    .from('filaments')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting filament:', error);
    throw error;
  }
};

export const fetchParts = async (): Promise<ReplacementPart[]> => {
  return withRetry(async () => {
    const { data, error } = await supabase
      .from('replacement_parts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }).then(data => (data || []).map(p => ({
    ...p,
    unitCost: p.unit_cost,
    freight: p.freight,
    purchaseDate: p.purchase_date
  })) as ReplacementPart[]);
};

export const upsertPart = async (part: Partial<ReplacementPart>) => {
  const partData = {
    ...part,
    // user_id: user.id,
    unit_cost: part.unitCost,
    freight: part.freight || 0,
    purchase_date: part.purchaseDate || null
  };

  delete (partData as any).unitCost;
  delete (partData as any).purchaseDate;

  const { data, error } = await supabase
    .from('replacement_parts')
    .upsert(partData)
    .select()
    .single();

  if (error) throw error;

  return {
    ...data,
    unitCost: data.unit_cost,
    freight: data.freight,
    purchaseDate: data.purchase_date
  } as ReplacementPart;
};

export const deletePart = async (id: string) => {
  console.log('Attempting to delete part:', id);
  const { error } = await supabase
    .from('replacement_parts')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting part:', error);
    throw error;
  }
};


export const fetchExpenses = async (): Promise<Expense[]> => {
  return withRetry(async () => {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('due_date', { ascending: true });

    if (error) throw error;
    return data || [];
  }).then(data => (data || []).map(e => ({
    ...e,
    dueDate: e.due_date,
    paidDate: e.paid_date
  })) as Expense[]);
};

export const upsertExpense = async (expense: Partial<Expense>) => {
  const expenseData = {
    ...expense,
    // user_id: user.id,
    due_date: expense.dueDate,
    paid_date: expense.paidDate || null
  };

  delete (expenseData as any).dueDate;
  delete (expenseData as any).paidDate;

  const { data, error } = await supabase
    .from('expenses')
    .upsert(expenseData)
    .select()
    .single();

  if (error) throw error;

  return {
    ...data,
    dueDate: data.due_date,
    paidDate: data.paid_date
  } as Expense;
};

export const deleteExpense = async (id: string) => {
  console.log('Attempting to delete expense:', id);
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting expense:', error);
    throw error;
  }
};

export const updateExpenseStatus = async (id: string, status: string, paidDate?: string) => {
  const updateData: any = { status };

  if (status === 'Pago' && paidDate) {
    updateData.paid_date = paidDate;
  } else if (status !== 'Pago') {
    // If returning to pending/late, maybe clear the paid date?
    // Let's decide to clear it if status is not Paid
    updateData.paid_date = null;
  }

  const { data, error } = await supabase
    .from('expenses')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return {
    ...data,
    dueDate: data.due_date,
    paidDate: data.paid_date
  } as Expense;
};

export const fetchCapitalInjections = async (): Promise<CapitalInjection[]> => {
  return withRetry(async () => {
    const { data, error } = await supabase
      .from('capital_injections')
      .select('*')
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  }).then(data => (data || []) as CapitalInjection[]);
};

export const upsertCapitalInjection = async (injection: Partial<CapitalInjection>) => {
  const injectionData = {
    ...injection,
    // user_id: user.id, // handled by default constraint in DB or can be explicit
  };

  const { data, error } = await supabase
    .from('capital_injections')
    .upsert(injectionData)
    .select()
    .single();

  if (error) throw error;

  return data as CapitalInjection;
};

export const deleteCapitalInjection = async (id: string) => {
  console.log('Attempting to delete capital injection:', id);
  const { error } = await supabase
    .from('capital_injections')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting capital injection:', error);
    throw error;
  }
};

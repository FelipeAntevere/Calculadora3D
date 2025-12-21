
export type OrderStatus = 'Orçamento' | 'Produção' | 'Finalizado' | 'Entregue' | 'Cancelado';

export type FilamentMaterial = 'PLA' | 'PLA Silk' | 'ABS' | 'PETG' | 'TPU' | 'ASA' | 'Nylon' | 'Resina';

export type PartCategory = 'Bico (Nozzle)' | 'Mesa (Bed)' | 'Correia' | 'Ventilador' | 'Sensor' | 'Extrusora' | 'Eletrônica' | 'Outros';

export interface Filament {
  id: string;
  brand: string;
  material: FilamentMaterial;
  color: string;
  initialWeight: number; // em kg
  currentWeight: number; // em kg
  costPerKg: number;
  freight: number;
  purchaseDate?: string; // YYYY-MM-DD
}

export interface ReplacementPart {
  id: string;
  name: string;
  category: PartCategory;
  brand: string;
  quantity: number;
  unitCost: number;
  purchaseDate: string;
  notes?: string;
}

export interface Order {
  id: string;
  date: string;
  customer: string;
  pieceName: string;
  state: string;
  material: string;
  color: string;
  quantity: number;
  unitValue: number;
  unitCost: number;
  freight: number;
  total: number;
  status: OrderStatus;
  weight: number;
  time: number;
  powerConsumption: number;
  laborTime: number;
  shippingDate?: string;
}

export interface CostsConfig {
  materialPricePerGram: number;
  energyPricePerKWh: number;
  laborPricePerHour: number;
  depreciationPricePerHour: number;
}

export interface CostBreakdown {
  material: number;
  energy: number;
  labor: number;
  depreciation: number;
  total: number;
}

export interface DailyData {
  day: string;
  revenue: number;
  orders: number;
}

export interface StateDistribution {
  state: string;
  orders: number;
  revenue: number;
  percentage: number;
}

export interface DashboardMetrics {
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  totalOrders: number;
  totalPrintingHours: number;
  averageTicket: number;
  costBreakdown: CostBreakdown;
  dailyHistory: DailyData[];
  stateDistribution: StateDistribution[];
}

export interface PricingCalculatorInputs {
  printingTime: number;
  partWeight: number;
  filamentCostPerKg: number;
  filamentLossPercentage: number;
  printerConsumption: number;
  kWhCost: number;
  laborHourValue: number;
  laborTimeSpent: number;
  printerLifespan: number;
  maintenanceBudget: number;
  maintenancePerHour: number;
  fixedMonthlyCosts: number;
  productiveHoursMonth: number;
  profitMargin: number;
}

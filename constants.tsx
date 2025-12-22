
import { Order, CostsConfig, PricingCalculatorInputs } from './types';

export const DEFAULT_COSTS_CONFIG: CostsConfig = {
  materialPricePerGram: 0.15, // R$ 0,15 por grama (ex: R$ 150/kg)
  energyPricePerKWh: 0.85,    // R$ 0,85 por kWh
  laborPricePerHour: 35.00,   // R$ 35,00 por hora técnica
  depreciationPricePerHour: 2.50 // R$ 2,50 por hora de uso da máquina
};

export const INITIAL_CALC_INPUTS: PricingCalculatorInputs = {
  printingTime: 0,
  partWeight: 0,
  filamentCostPerKg: 100,
  filamentLossPercentage: 10,
  printerConsumption: 0.15,
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

export const EMPTY_ORDER: Partial<Order> = {
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
  date: (() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  })()
};

export const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const BRAZILIAN_STATES = [
  { sigla: 'AC', nome: 'Acre' },
  { sigla: 'AL', nome: 'Alagoas' },
  { sigla: 'AP', nome: 'Amapá' },
  { sigla: 'AM', nome: 'Amazonas' },
  { sigla: 'BA', nome: 'Bahia' },
  { sigla: 'CE', nome: 'Ceará' },
  { sigla: 'DF', nome: 'Distrito Federal' },
  { sigla: 'ES', nome: 'Espírito Santo' },
  { sigla: 'GO', nome: 'Goiás' },
  { sigla: 'MA', nome: 'Maranhão' },
  { sigla: 'MT', nome: 'Mato Grosso' },
  { sigla: 'MS', nome: 'Mato Grosso do Sul' },
  { sigla: 'MG', nome: 'Minas Gerais' },
  { sigla: 'PA', nome: 'Pará' },
  { sigla: 'PB', nome: 'Paraíba' },
  { sigla: 'PR', nome: 'Paraná' },
  { sigla: 'PE', nome: 'Pernambuco' },
  { sigla: 'PI', nome: 'Piauí' },
  { sigla: 'RJ', nome: 'Rio de Janeiro' },
  { sigla: 'RN', nome: 'Rio Grande do Norte' },
  { sigla: 'RS', nome: 'Rio Grande do Sul' },
  { sigla: 'RO', nome: 'Rondônia' },
  { sigla: 'RR', nome: 'Roraima' },
  { sigla: 'SC', nome: 'Santa Catarina' },
  { sigla: 'SP', nome: 'São Paulo' },
  { sigla: 'SE', nome: 'Sergipe' },
  { sigla: 'TO', nome: 'Tocantins' }
];

export const generateMockOrders = (): Order[] => {
  const years = [2024, 2025];
  const allOrders: Order[] = [];

  years.forEach(year => {
    // Generate data for a few months in each year
    [0, 5, 11].forEach(month => {
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const numOrders = Math.floor(Math.random() * 5) + 3;

      for (let i = 0; i < numOrders; i++) {
        const day = Math.floor(Math.random() * daysInMonth) + 1;
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T10:00:00Z`;

        const printingTime = Math.random() * 8 + 2;
        const materialWeight = printingTime * 15;
        const powerConsumption = printingTime * 0.12;
        const laborTime = 0.5;

        const unitCost =
          (materialWeight * DEFAULT_COSTS_CONFIG.materialPricePerGram) +
          (powerConsumption * DEFAULT_COSTS_CONFIG.energyPricePerKWh) +
          (laborTime * DEFAULT_COSTS_CONFIG.laborPricePerHour) +
          (printingTime * DEFAULT_COSTS_CONFIG.depreciationPricePerHour);

        const unitValue = unitCost * 2;
        const quantity = Math.floor(Math.random() * 3) + 1;
        const freight = Math.random() * 20 + 10;
        const total = (quantity * unitValue) + freight;

        const randomState = BRAZILIAN_STATES[Math.floor(Math.random() * BRAZILIAN_STATES.length)];

        allOrders.push({
          id: `ORD-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
          customer: `Cliente ${year}-${month}-${i}`,
          pieceName: `Peça ${year}`,
          state: randomState.sigla,
          material: 'PLA',
          color: 'Preto',
          quantity,
          date: dateStr,
          time: printingTime,
          weight: materialWeight,
          powerConsumption,
          laborTime,
          unitValue,
          unitCost,
          freight,
          total,
          status: 'Finalizado'
        });
      }
    });
  });

  return allOrders.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

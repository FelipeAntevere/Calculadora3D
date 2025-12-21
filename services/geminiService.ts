
import { GoogleGenAI } from "@google/genai";
import { DashboardMetrics } from "../types";
import { formatCurrency } from "./dataService";

export const getAIInsights = async (metrics: DashboardMetrics, month: string, year: number): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    Como um consultor especialista em negócios de Impressão 3D, analise os seguintes resultados de ${month}/${year}:
    
    - Faturamento Total: ${formatCurrency(metrics.totalRevenue)}
    - Lucro Líquido: ${formatCurrency(metrics.totalProfit)}
    - Custo Total: ${formatCurrency(metrics.totalCost)}
    - Total de Pedidos: ${metrics.totalOrders}
    - Horas de Impressão: ${metrics.totalPrintingHours.toFixed(1)}h
    - Ticket Médio: ${formatCurrency(metrics.averageTicket)}
    
    Distribuição de Custos:
    - Material: ${formatCurrency(metrics.costBreakdown.material)}
    - Energia: ${formatCurrency(metrics.costBreakdown.energy)}
    - Mão de Obra: ${formatCurrency(metrics.costBreakdown.labor)}
    - Depreciação: ${formatCurrency(metrics.costBreakdown.depreciation)}
    
    Forneça 3 parágrafos curtos:
    1. Uma análise rápida da saúde financeira (margem e rentabilidade).
    2. Uma observação sobre a eficiência operacional (relação horas vs custo).
    3. Uma sugestão estratégica acionável para o próximo mês para aumentar o lucro ou reduzir custos específicos.
    
    Responda em tom profissional, direto e motivador em Português do Brasil.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Não foi possível gerar insights no momento.";
  } catch (error) {
    console.error("Erro ao chamar Gemini API:", error);
    return "Erro ao processar insights inteligentes. Verifique sua conexão ou tente novamente mais tarde.";
  }
};

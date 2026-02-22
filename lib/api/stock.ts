import { ChartDayItem, ChartDayResponse, InvestorDailyTradeParams, InvestorDailyTradeStock, Stock, StockListResponse } from '@/types/stock';
import { mockStocks } from '../mockData';
import { fetchApi, USE_MOCK } from './client';

export async function getStockList(): Promise<Stock[]> {
  // 더미 데이터 모드
  if (USE_MOCK) {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockStocks), 500); // 네트워크 지연 시뮬레이션
    });
  }

  try {
    const data = await fetchApi<StockListResponse>('/api/v1/stock/list');
    return data.success && data.data ? data.data : [];
  } catch (error) {
    console.error('Failed to fetch stock list:', error);
    throw error;
  }
}

export function searchStocks(query: string, stocks: Stock[]): Stock[] {
  if (!query.trim()) {
    return stocks;
  }

  const lowerQuery = query.toLowerCase();
  return stocks.filter(
    (stock) =>
      stock.stock_code.toLowerCase().includes(lowerQuery) ||
      stock.stock_name.toLowerCase().includes(lowerQuery)
  );
}

export async function getChartDay(code: string, startDt: string, endDt: string): Promise<ChartDayItem[]> {
  const params = new URLSearchParams({ start_dt: startDt, end_dt: endDt });
  const response = await fetchApi<ChartDayResponse>(`/api/v1/chart/${code}/day?${params.toString()}`);
  return response.items ?? [];
}

export async function getInvestorDailyTrade(params: InvestorDailyTradeParams): Promise<InvestorDailyTradeStock[]> {
  try {
    const queryParams = new URLSearchParams({
      strt_dt: params.strt_dt,
      end_dt: params.end_dt,
      trde_tp: params.trde_tp,
      mrkt_tp: params.mrkt_tp,
      invsr_tp: params.invsr_tp,
      stex_tp: params.stex_tp,
    });

    const response = await fetchApi<{ success: boolean; message: string; data: InvestorDailyTradeStock[] }>(
      `/api/v1/stock/investor-daily-trade?${queryParams.toString()}`
    );

    return response.data ?? [];
  } catch (error) {
    console.error('Failed to fetch investor daily trade:', error);
    throw error;
  }
}

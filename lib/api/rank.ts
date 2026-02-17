import { TradingRankingResponse } from '@/types/stock';
import { fetchApi } from './client';

export async function getTradingRanking(tradeDate: string): Promise<TradingRankingResponse> {
  try {
    return await fetchApi<TradingRankingResponse>(`/api/v1/trading/ranking/${tradeDate}`);
  } catch (error) {
    console.error('Failed to fetch trading ranking:', error);
    throw error;
  }
}

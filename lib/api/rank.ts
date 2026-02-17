import { TradeRankParams, TradeRankResponse } from '@/types/stock';
import { fetchApi } from './client';

export async function getTradeRank(params: TradeRankParams): Promise<TradeRankResponse> {
  try {
    const queryParams = new URLSearchParams({
      mrkt_tp: params.mrkt_tp,
      mang_stk_incls: params.mang_stk_incls,
      stex_tp: params.stex_tp,
    });

    if (params.cont_yn) queryParams.append('cont_yn', params.cont_yn);
    if (params.next_key) queryParams.append('next_key', params.next_key);

    return await fetchApi<TradeRankResponse>(`/api/v1/rank/trade-price?${queryParams.toString()}`);
  } catch (error) {
    console.error('Failed to fetch trade rank:', error);
    throw error;
  }
}

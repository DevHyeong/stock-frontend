import {
  InvestorDailyTradeParams,
  InvestorDailyTradeStock,
  Sector,
  SectorCreate,
  SectorCreateResponse,
  SectorDetailResponse,
  SectorListResponse,
  Stock,
  StockListResponse,
  TradeRankParams,
  TradeRankResponse
} from '@/types/stock';
import {mockSectors, mockStocks} from './mockData';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';

export async function getStockList(): Promise<Stock[]> {
  // 더미 데이터 모드
  if (USE_MOCK) {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockStocks), 500); // 네트워크 지연 시뮬레이션
    });
  }

  try {
    const response = await fetch(`${API_URL}/api/v1/stock/list`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data: StockListResponse = await response.json();

    if (data.success && data.data) {
      return data.data;
    }

    return [];
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

export async function getSectorList(params?: {
  market?: string;
  category?: string;
  skip?: number;
  limit?: number;
}): Promise<Sector[]> {
  // 더미 데이터 모드
  if (USE_MOCK) {
    return new Promise((resolve) => {
      setTimeout(() => {
        let filtered = [...mockSectors];

        // 필터링
        if (params?.market) {
          filtered = filtered.filter(s => s.market === params.market);
        }
        if (params?.category) {
          filtered = filtered.filter(s => s.category === params.category);
        }

        // 페이지네이션
        const skip = params?.skip || 0;
        const limit = params?.limit || filtered.length;
        filtered = filtered.slice(skip, skip + limit);

        resolve(filtered);
      }, 500);
    });
  }

  try {
    const queryParams = new URLSearchParams();
    if (params?.market) queryParams.append('market', params.market);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.skip !== undefined) queryParams.append('skip', params.skip.toString());
    if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString());

    const url = `${API_URL}/api/v1/sector/list${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data: SectorListResponse = await response.json();

    if (data.success && data.data) {
      return data.data;
    }

    return [];
  } catch (error) {
    console.error('Failed to fetch sector list:', error);
    throw error;
  }
}

export async function getSectorDetail(sectorCode: string): Promise<Sector | null> {
  // 더미 데이터 모드
  if (USE_MOCK) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const sector = mockSectors.find(s => s.code === sectorCode);
        resolve(sector || null);
      }, 300);
    });
  }

  try {
    const response = await fetch(`${API_URL}/api/v1/sector/${sectorCode}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data: SectorDetailResponse = await response.json();

    if (data.success && data.data) {
      return data.data;
    }

    return null;
  } catch (error) {
    console.error('Failed to fetch sector detail:', error);
    throw error;
  }
}

export async function createSector(sectorData: SectorCreate): Promise<Sector> {
  // 더미 데이터 모드
  if (USE_MOCK) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // 코드 중복 체크
        if (mockSectors.some(s => s.code === sectorData.code)) {
          reject(new Error('이미 존재하는 섹터 코드입니다.'));
          return;
        }

        const newSector: Sector = {
          id: mockSectors.length + 1,
          code: sectorData.code,
          name: sectorData.name,
          market: sectorData.market,
          category: sectorData.category,
          level: sectorData.level || 1,
          parent_id: sectorData.parent_id,
          stock_count: 0,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        mockSectors.push(newSector);
        resolve(newSector);
      }, 500);
    });
  }

  try {
    const response = await fetch(`${API_URL}/api/v1/sector/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sectorData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error || errorData?.message || `API Error: ${response.status}`);
    }

    const data: SectorCreateResponse = await response.json();

    if (data.success && data.data) {
      return data.data;
    }

    throw new Error(data.error || '섹터 생성에 실패했습니다.');
  } catch (error) {
    console.error('Failed to create sector:', error);
    throw error;
  }
}

export async function getTradeRank(params: TradeRankParams): Promise<TradeRankResponse> {
  try {
    const queryParams = new URLSearchParams({
      mrkt_tp: params.mrkt_tp,
      mang_stk_incls: params.mang_stk_incls,
      stex_tp: params.stex_tp,
    });

    if (params.cont_yn) queryParams.append('cont_yn', params.cont_yn);
    if (params.next_key) queryParams.append('next_key', params.next_key);

    const response = await fetch(`${API_URL}/api/v1/rank/trade-price?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data: TradeRankResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch trade rank:', error);
    throw error;
  }
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

    const response = await fetch(`${API_URL}/api/v1/stock/investor-daily-trade?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();

    // API 응답 구조에 따라 조정 필요
    if (Array.isArray(data)) {
      return data;
    } else if (data.data && Array.isArray(data.data)) {
      return data.data;
    }

    return [];
  } catch (error) {
    console.error('Failed to fetch investor daily trade:', error);
    throw error;
  }
}

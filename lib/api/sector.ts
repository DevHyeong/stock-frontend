import { Sector, SectorCreate, SectorCreateResponse, SectorDetailResponse, SectorListResponse } from '@/types/stock';
import { mockSectors } from '../mockData';
import { fetchApi, USE_MOCK } from './client';

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

    const query = queryParams.toString();
    const data = await fetchApi<SectorListResponse>(`/api/v1/sector/list${query ? `?${query}` : ''}`);
    return data.success && data.data ? data.data : [];
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
    const data = await fetchApi<SectorDetailResponse>(`/api/v1/sector/${sectorCode}`);
    return data.success && data.data ? data.data : null;
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
    const data = await fetchApi<SectorCreateResponse>('/api/v1/sector/create', {
      method: 'POST',
      body: JSON.stringify(sectorData),
    });

    if (data.success && data.data) {
      return data.data;
    }

    throw new Error(data.error || '섹터 생성에 실패했습니다.');
  } catch (error) {
    console.error('Failed to create sector:', error);
    throw error;
  }
}

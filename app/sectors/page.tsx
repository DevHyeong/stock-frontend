'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSectorList, getSectorDetail } from '@/lib/api';
import { Sector } from '@/types/stock';
import BottomNav from '@/components/BottomNav';

export default function SectorsPage() {
  const router = useRouter();
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [selectedSector, setSelectedSector] = useState<Sector | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    async function fetchSectors() {
      try {
        setLoading(true);
        const data = await getSectorList({ limit: 1000 });
        setSectors(data);
        setError(null);
      } catch (err) {
        setError('섹터 데이터를 불러오는데 실패했습니다.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchSectors();
  }, []);

  const handleSectorClick = async (sector: Sector) => {
    try {
      setDetailLoading(true);
      const detail = await getSectorDetail(sector.code);
      if (detail) {
        setSelectedSector(detail);
      }
    } catch (err) {
      console.error('Failed to fetch sector detail:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeModal = () => {
    setSelectedSector(null);
  };

  const getCategoryColor = (category?: string) => {
    const colors: Record<string, string> = {
      '제조': 'from-blue-500 to-blue-600',
      '금융': 'from-green-500 to-green-600',
      'IT': 'from-purple-500 to-purple-600',
      '서비스': 'from-yellow-500 to-yellow-600',
      '에너지': 'from-red-500 to-red-600',
      '소재': 'from-indigo-500 to-indigo-600',
      '헬스케어': 'from-pink-500 to-pink-600',
      '통신': 'from-teal-500 to-teal-600',
    };
    return colors[category || ''] || 'from-gray-500 to-gray-600';
  };

  const getMarketBadge = (market?: string) => {
    const badges: Record<string, { color: string; label: string }> = {
      'KOSPI': { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300', label: 'KOSPI' },
      'KOSDAQ': { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300', label: 'KOSDAQ' },
      'KRX': { color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300', label: 'KRX' },
    };
    return badges[market || ''] || { color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300', label: market || 'N/A' };
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* 상단 헤더 */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 py-4">
          <div className="flex items-start justify-between mb-1">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                섹터 히트맵
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                업종별 종목 현황
              </p>
            </div>
            <button
              onClick={() => router.push('/sectors/create')}
              className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white active:scale-95 transition-transform shadow-lg"
              title="섹터 등록"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">데이터 불러오는 중...</p>
        </div>
      )}

      {error && (
        <div className="px-4 pt-4">
          <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-4">
            <div className="flex items-start">
              <svg className="h-6 w-6 text-red-600 dark:text-red-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* 통계 카드 */}
          <div className="px-4 py-4">
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-lg">
                <p className="text-xs opacity-90 mb-1">전체 섹터</p>
                <p className="text-2xl font-bold">{sectors.length}</p>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white shadow-lg">
                <p className="text-xs opacity-90 mb-1">총 종목</p>
                <p className="text-2xl font-bold">
                  {sectors.reduce((sum, s) => sum + (s.stock_count || 0), 0)}
                </p>
              </div>
            </div>

            {/* 섹터 그리드 */}
            <div className="grid grid-cols-2 gap-3">
              {sectors.map((sector) => {
                const badge = getMarketBadge(sector.market);
                const colorClass = getCategoryColor(sector.category);

                return (
                  <button
                    key={sector.id}
                    onClick={() => handleSectorClick(sector)}
                    className="relative overflow-hidden rounded-xl shadow-md active:scale-95 transition-transform"
                  >
                    <div className={`bg-gradient-to-br ${colorClass} p-4 min-h-[140px] flex flex-col justify-between`}>
                      <div>
                        <div className="flex items-start justify-between mb-2">
                          <span className={`text-xs px-2 py-1 rounded-lg ${badge.color} font-semibold`}>
                            {badge.label}
                          </span>
                        </div>
                        <h3 className="font-bold text-sm text-white mb-1 line-clamp-2 text-left">
                          {sector.name}
                        </h3>
                        <p className="text-xs text-white/70 text-left mb-2">
                          {sector.code}
                        </p>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-white">
                          {sector.stock_count || 0}
                        </span>
                        <span className="text-xs text-white/90">종목</span>
                      </div>
                    </div>
                    {sector.category && (
                      <div className="absolute top-2 right-2 bg-black/20 backdrop-blur-sm px-2 py-1 rounded-md">
                        <span className="text-xs text-white font-medium">
                          {sector.category}
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* 전체 화면 모달 */}
      {selectedSector && (
        <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 overflow-y-auto">
          {/* 헤더 */}
          <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between px-4 py-4">
              <button
                onClick={closeModal}
                className="p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-95 transition-transform"
              >
                <svg className="h-6 w-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white truncate flex-1 mx-3">
                {selectedSector.name}
              </h2>
              <div className="w-10" />
            </div>

            {/* 배지들 */}
            <div className="px-4 pb-4 flex gap-2 overflow-x-auto">
              <span className={`text-xs px-3 py-1.5 rounded-full ${getMarketBadge(selectedSector.market).color} font-semibold whitespace-nowrap`}>
                {getMarketBadge(selectedSector.market).label}
              </span>
              <span className="text-xs px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 font-semibold whitespace-nowrap">
                {selectedSector.code}
              </span>
              {selectedSector.category && (
                <span className="text-xs px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 font-semibold whitespace-nowrap">
                  {selectedSector.category}
                </span>
              )}
            </div>
          </div>

          {/* 컨텐츠 */}
          <div className="px-4 py-4">
            {detailLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">상세 정보 불러오는 중...</p>
              </div>
            ) : (
              <>
                {/* 통계 */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-lg">
                    <p className="text-xs opacity-90 mb-1">종목 수</p>
                    <p className="text-2xl font-bold">{selectedSector.stock_count || 0}</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white shadow-lg">
                    <p className="text-xs opacity-90 mb-1">분류 레벨</p>
                    <p className="text-2xl font-bold">{selectedSector.level || 1}</p>
                  </div>
                </div>

                {/* 종목 리스트 */}
                {selectedSector.stocks && selectedSector.stocks.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                      속한 종목 ({selectedSector.stocks.length}개)
                    </h3>
                    <div className="space-y-2">
                      {selectedSector.stocks.map((stock) => (
                        <div
                          key={stock.stock_code}
                          className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 active:scale-[0.98] transition-transform"
                        >
                          <div className="flex items-start justify-between mb-1">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-base text-gray-900 dark:text-white truncate">
                                {stock.stock_name}
                              </h4>
                              <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                                {stock.stock_code}
                              </p>
                            </div>
                            {stock.market && (
                              <span className={`ml-2 px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${
                                stock.market === 'KOSPI'
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                                  : stock.market === 'KOSDAQ'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                              }`}>
                                {stock.market}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

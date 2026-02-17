'use client';

import { useState, useEffect } from 'react';
import { getTradeRank } from '@/lib/api';
import { TradeRankItem, MarketType, MangStkIncls, StexType } from '@/types/stock';
import BottomNav from '@/components/BottomNav';

export default function RanksPage() {
  const [ranks, setRanks] = useState<TradeRankItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  // 필터 상태
  const [marketType, setMarketType] = useState<MarketType>('000');
  const [managementInclude, setManagementInclude] = useState<MangStkIncls>('0');
  const [exchangeType, setExchangeType] = useState<StexType>('1');

  // 페이지네이션
  const [contYn, setContYn] = useState<string | null>(null);
  const [nextKey, setNextKey] = useState<string | null>(null);

  const fetchRanks = async (isLoadMore: boolean = false) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setRanks([]);
      }

      const data = await getTradeRank({
        mrkt_tp: marketType,
        mang_stk_incls: managementInclude,
        stex_tp: exchangeType,
        cont_yn: isLoadMore ? contYn || undefined : undefined,
        next_key: isLoadMore ? nextKey || undefined : undefined,
      });

      if (isLoadMore) {
        setRanks(prev => [...prev, ...data.trde_prica_upper]);
      } else {
        setRanks(data.trde_prica_upper);
      }

      setContYn(data.cont_yn);
      setNextKey(data.next_key);
      setError(null);
    } catch (err) {
      setError('거래대금 순위 데이터를 불러오는데 실패했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchRanks();
  }, [marketType, managementInclude, exchangeType]);

  const handleLoadMore = () => {
    if (contYn === 'Y' && nextKey && !loadingMore) {
      fetchRanks(true);
    }
  };

  const formatNumber = (value: string) => {
    const num = parseInt(value);
    if (isNaN(num)) return value;
    return num.toLocaleString();
  };

  const formatPrice = (value: string) => {
    const num = parseInt(value);
    if (isNaN(num)) return value;

    if (num >= 100000000) {
      const eok = Math.floor(num / 100000000);
      const man = Math.floor((num % 100000000) / 10000);
      if (man > 0) {
        return `${eok.toLocaleString()}억 ${man.toLocaleString()}만`;
      }
      return `${eok.toLocaleString()}억`;
    } else if (num >= 10000) {
      return `${Math.floor(num / 10000).toLocaleString()}만`;
    }
    return num.toLocaleString();
  };

  const formatPriceWithUnit = (value: string) => {
    const num = parseInt(value);
    if (isNaN(num)) return { display: value, detail: value };

    const formatted = formatPrice(value);
    const detail = `${num.toLocaleString()}원`;

    return { display: formatted, detail };
  };

  const getRankChange = (nowRank: string, predRank: string) => {
    const now = parseInt(nowRank);
    const pred = parseInt(predRank);

    if (isNaN(now) || isNaN(pred)) return { icon: '─', color: 'text-gray-400' };

    const diff = pred - now;

    if (diff > 0) {
      return { icon: '▲', color: 'text-red-500', change: diff };
    } else if (diff < 0) {
      return { icon: '▼', color: 'text-blue-500', change: Math.abs(diff) };
    }
    return { icon: '─', color: 'text-gray-400' };
  };

  const getPriceColor = (sign: string) => {
    if (sign === '1' || sign === '2') return 'text-red-500'; // 상승
    if (sign === '4' || sign === '5') return 'text-blue-500'; // 하락
    return 'text-gray-900 dark:text-white'; // 보합
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* 상단 헤더 */}
      <div className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            거래대금 상위
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            실시간 거래대금 순위
          </p>
        </div>

        {/* 필터 */}
        <div className="px-4 pb-4 space-y-3">
          {/* 시장구분 */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              시장구분
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setMarketType('000')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  marketType === '000'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                전체
              </button>
              <button
                onClick={() => setMarketType('001')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  marketType === '001'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                코스피
              </button>
              <button
                onClick={() => setMarketType('101')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  marketType === '101'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                코스닥
              </button>
            </div>
          </div>

          {/* 관리종목 포함 & 거래소 구분 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                관리종목
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setManagementInclude('0')}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    managementInclude === '0'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  제외
                </button>
                <button
                  onClick={() => setManagementInclude('1')}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    managementInclude === '1'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  포함
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                거래소
              </label>
              <select
                value={exchangeType}
                onChange={(e) => setExchangeType(e.target.value as StexType)}
                className="w-full py-2.5 px-3 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white text-sm font-semibold border-0 focus:ring-2 focus:ring-blue-500"
              >
                <option value="1">KRX</option>
                <option value="2">NXT</option>
                <option value="3">통합</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 컨텐츠 영역 */}
      <div className="px-4 py-4">
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">데이터 불러오는 중...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-4 mb-4">
            <div className="flex items-start">
              <svg className="h-6 w-6 text-red-600 dark:text-red-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          </div>
        )}

        {!loading && !error && (
          <>
            {ranks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <svg className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p className="text-gray-500 dark:text-gray-400 text-center">
                  표시할 데이터가 없습니다.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {ranks.map((item, index) => {
                  const rankChange = getRankChange(item.now_rank, item.pred_rank);
                  const priceColor = getPriceColor(item.pred_pre_sig);
                  const tradePriceInfo = formatPriceWithUnit(item.trde_prica);

                  return (
                    <div
                      key={`${item.stk_cd}-${index}`}
                      className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex items-start gap-3">
                        {/* 순위 */}
                        <div className="flex flex-col items-center min-w-[60px]">
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {item.now_rank}
                          </div>
                          <div className={`text-xs font-semibold ${rankChange.color} flex items-center gap-0.5`}>
                            <span>{rankChange.icon}</span>
                            {rankChange.change && <span>{rankChange.change}</span>}
                          </div>
                        </div>

                        {/* 종목 정보 */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-bold text-gray-900 dark:text-white truncate mb-0.5">
                            {item.stk_nm}
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mb-2">
                            {item.stk_cd}
                          </p>

                          {/* 가격 & 등락률 */}
                          <div className="flex items-baseline gap-2 mb-2">
                            <span className={`text-lg font-bold ${priceColor}`}>
                              {formatNumber(item.cur_prc)}
                            </span>
                            <span className={`text-sm font-semibold ${priceColor}`}>
                              {item.pred_pre_sig === '2' || item.pred_pre_sig === '5' ? '-' : ''}
                              {formatNumber(item.pred_pre)}
                            </span>
                            <span className={`text-sm font-semibold ${priceColor}`}>
                              ({item.flu_rt}%)
                            </span>
                          </div>

                          {/* 거래 정보 */}
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg px-2 py-1.5">
                              <div className="text-gray-500 dark:text-gray-400 text-[10px] mb-0.5">거래대금</div>
                              <div className="font-bold text-gray-900 dark:text-white mb-0.5">
                                {tradePriceInfo.display}
                              </div>
                              <div className="text-[10px] text-gray-500 dark:text-gray-400">
                                {tradePriceInfo.detail}
                              </div>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg px-2 py-1.5">
                              <div className="text-gray-500 dark:text-gray-400 text-[10px] mb-0.5">거래량</div>
                              <div className="font-bold text-gray-900 dark:text-white">
                                {formatNumber(item.now_trde_qty)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* 더보기 버튼 */}
                {contYn === 'Y' && nextKey && (
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="w-full py-4 rounded-xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-[0.98] transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {loadingMore ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mr-2"></div>
                        불러오는 중...
                      </>
                    ) : (
                      '더보기'
                    )}
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

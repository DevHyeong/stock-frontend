'use client';

import { useState, useEffect } from 'react';
import { getInvestorDailyTrade } from '@/lib/api';
import { InvestorDailyTradeStock } from '@/types/stock';
import BottomNav from '@/components/BottomNav';

export default function InvestorsPage() {
  const [stocks, setStocks] = useState<InvestorDailyTradeStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 필터 상태
  const [investorType, setInvestorType] = useState<string>('9000'); // 9000: 외국인, 1000: 기관
  const [tradeType, setTradeType] = useState<'1' | '2'>('2'); // 1: 순매도, 2: 순매수
  const [marketType, setMarketType] = useState<'001' | '101'>('001'); // 001: 코스피, 101: 코스닥
  const [exchangeType, setExchangeType] = useState<'1' | '2' | '3'>('1');

  // 날짜 (오늘 기준으로 설정)
  const getToday = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  };

  const [endDate] = useState(getToday());
  const [startDate] = useState(getToday());

  const fetchInvestorData = async () => {
    try {
      setLoading(true);
      const data = await getInvestorDailyTrade({
        strt_dt: startDate,
        end_dt: endDate,
        trde_tp: tradeType,
        mrkt_tp: marketType,
        invsr_tp: investorType,
        stex_tp: exchangeType,
      });

      setStocks(data);
      setError(null);
    } catch (err) {
      setError('투자자별 매매 데이터를 불러오는데 실패했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvestorData();
  }, [investorType, tradeType, marketType, exchangeType]);

  const formatNumber = (value: string) => {
    const num = parseInt(value);
    if (isNaN(num)) return value;
    return num.toLocaleString();
  };

  const formatAmount = (value: string) => {
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

  const getPriceColor = (sign: string) => {
    if (sign === '1' || sign === '2') return 'text-red-500'; // 상승
    if (sign === '4' || sign === '5') return 'text-blue-500'; // 하락
    return 'text-gray-900 dark:text-white'; // 보합
  };

  const getInvestorTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      '1000': '기관',
      '9000': '외국인',
      '8000': '개인',
    };
    return types[type] || type;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* 상단 헤더 */}
      <div className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            투자자별 순매수
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            외국인 · 기관 매매 동향
          </p>
        </div>

        {/* 필터 */}
        <div className="px-4 pb-4 space-y-3">
          {/* 투자자 구분 */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              투자자 구분
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setInvestorType('9000')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  investorType === '9000'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                외국인
              </button>
              <button
                onClick={() => setInvestorType('1000')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  investorType === '1000'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                기관
              </button>
              <button
                onClick={() => setInvestorType('8000')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  investorType === '8000'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                개인
              </button>
            </div>
          </div>

          {/* 매매구분 & 시장구분 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                매매구분
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setTradeType('2')}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    tradeType === '2'
                      ? 'bg-red-600 text-white shadow-md'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  순매수
                </button>
                <button
                  onClick={() => setTradeType('1')}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    tradeType === '1'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  순매도
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                시장구분
              </label>
              <div className="flex gap-2">
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
            {stocks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <svg className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-500 dark:text-gray-400 text-center">
                  표시할 데이터가 없습니다.
                </p>
              </div>
            ) : (
              <>
                {/* 상단 통계 */}
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-lg mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm opacity-90">{getInvestorTypeLabel(investorType)} {tradeType === '2' ? '순매수' : '순매도'} 상위</span>
                    <span className="text-sm opacity-90">{marketType === '001' ? 'KOSPI' : 'KOSDAQ'}</span>
                  </div>
                  <div className="text-2xl font-bold">{stocks.length}개 종목</div>
                </div>

                {/* 종목 리스트 */}
                <div className="space-y-2">
                  {stocks.map((item, index) => {
                    const priceColor = getPriceColor(item.pre_sig);
                    const isPositive = tradeType === '2'; // 순매수면 긍정적

                    return (
                      <div
                        key={`${item.stk_cd}-${index}`}
                        className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex items-start gap-3">
                          {/* 순위 */}
                          <div className="flex items-center justify-center min-w-[50px] h-[50px] rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                            <span className="text-xl font-bold">{index + 1}</span>
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
                            <div className="flex items-baseline gap-2 mb-3">
                              <span className={`text-lg font-bold ${priceColor}`}>
                                {formatNumber(item.cur_prc)}
                              </span>
                              <span className={`text-sm font-semibold ${priceColor}`}>
                                {item.pre_sig === '2' || item.pre_sig === '5' ? '-' : ''}
                                {formatNumber(item.pred_pre)}
                              </span>
                              <span className={`text-sm font-semibold ${priceColor}`}>
                                ({item.pre_rt}%)
                              </span>
                            </div>

                            {/* 순매수 정보 */}
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className={`rounded-lg px-3 py-2 ${
                                isPositive
                                  ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                                  : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                              }`}>
                                <div className="text-gray-500 dark:text-gray-400 text-[10px] mb-0.5">
                                  순매수 금액
                                </div>
                                <div className={`font-bold text-sm ${isPositive ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}>
                                  {formatAmount(item.netslmt_amt)}
                                </div>
                                <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                                  {formatNumber(item.netslmt_amt)}원
                                </div>
                              </div>

                              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2">
                                <div className="text-gray-500 dark:text-gray-400 text-[10px] mb-0.5">
                                  순매수 수량
                                </div>
                                <div className="font-bold text-gray-900 dark:text-white text-sm">
                                  {formatNumber(item.netslmt_qty)}
                                </div>
                                <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                                  평균가: {formatNumber(item.prsm_avg_pric)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

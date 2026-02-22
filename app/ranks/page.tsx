'use client';

import { useState, useEffect } from 'react';
import { getTradingRanking, getInvestorDailyTrade } from '@/lib/api';
import { InvestorDailyTradeStock, TradingRankingItem } from '@/types/stock';

type TabType = 'trade' | 'investor';

const INVESTOR_TYPES = [
  {
    key: '9000',
    label: '외국인',
    gradient: 'from-violet-500 to-violet-600',
    buyBg: 'bg-violet-50 dark:bg-violet-900/20',
    buyBorder: 'border-violet-200 dark:border-violet-800',
    buyText: 'text-violet-700 dark:text-violet-300',
    headerText: 'text-violet-600 dark:text-violet-400',
  },
  {
    key: '1000',
    label: '기관',
    gradient: 'from-emerald-500 to-emerald-600',
    buyBg: 'bg-emerald-50 dark:bg-emerald-900/20',
    buyBorder: 'border-emerald-200 dark:border-emerald-800',
    buyText: 'text-emerald-700 dark:text-emerald-300',
    headerText: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    key: '8000',
    label: '개인',
    gradient: 'from-orange-500 to-orange-600',
    buyBg: 'bg-orange-50 dark:bg-orange-900/20',
    buyBorder: 'border-orange-200 dark:border-orange-800',
    buyText: 'text-orange-700 dark:text-orange-300',
    headerText: 'text-orange-600 dark:text-orange-400',
  },
] as const;

export default function RanksPage() {
  const [activeTab, setActiveTab] = useState<TabType>('trade');

  // ── 거래대금 상태 ──────────────────────────────────
  const [ranks, setRanks] = useState<TradingRankingItem[]>([]);
  const [tradeLoading, setTradeLoading] = useState(true);
  const [tradeError, setTradeError] = useState<string | null>(null);
  const [tradeDate, setTradeDate] = useState<string>('');

  // ── 투자자별 상태 ──────────────────────────────────
  // key: `${investorType}-${tradeType}` (e.g. '9000-2', '9000-1')
  const [investorData, setInvestorData] = useState<Record<string, InvestorDailyTradeStock[]>>({});
  const [investorLoading, setInvestorLoading] = useState(false);
  const [investorError, setInvestorError] = useState<string | null>(null);
  const [investorMarketType, setInvestorMarketType] = useState<'001' | '101'>('001');
  const [investorDate, setInvestorDate] = useState<string>('');

  const getToday = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const today = getToday();

  // ── 거래대금 fetch ─────────────────────────────────
  const fetchRanks = async () => {
    try {
      setTradeLoading(true);
      setRanks([]);
      const data = await getTradingRanking(tradeDate || today);
      setRanks(data.data.rankings);
      setTradeError(null);
    } catch (err) {
      setTradeError('거래대금 순위 데이터를 불러오는데 실패했습니다.');
      console.error(err);
    } finally {
      setTradeLoading(false);
    }
  };

  // ── 투자자별 fetch (6개 조합 병렬) ────────────────
  const fetchAllInvestorData = async () => {
    try {
      setInvestorLoading(true);
      setInvestorError(null);
      const apiDate = (investorDate || today).replace(/-/g, '');

      const combinations = INVESTOR_TYPES.flatMap(({ key }) =>
        (['2', '1'] as const).map((tradeType) => ({ investorType: key, tradeType }))
      );

      const results = await Promise.allSettled(
        combinations.map(({ investorType, tradeType }) =>
          getInvestorDailyTrade({
            strt_dt: apiDate,
            end_dt: apiDate,
            trde_tp: tradeType,
            mrkt_tp: investorMarketType,
            invsr_tp: investorType,
            stex_tp: '3',
          }).then((data) => ({ key: `${investorType}-${tradeType}`, data }))
        )
      );

      const newData: Record<string, InvestorDailyTradeStock[]> = {};
      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          newData[result.value.key] = result.value.data;
        }
      });
      setInvestorData(newData);
    } catch (err) {
      setInvestorError('투자자별 매매 데이터를 불러오는데 실패했습니다.');
      console.error(err);
    } finally {
      setInvestorLoading(false);
    }
  };

  useEffect(() => {
    fetchRanks();
  }, [tradeDate]);

  useEffect(() => {
    if (activeTab === 'investor') {
      fetchAllInvestorData();
    }
  }, [activeTab, investorMarketType, investorDate]);

  // ── 포맷 유틸 ─────────────────────────────────────
  const formatNumber = (value: string) => {
    const num = parseInt(value);
    return isNaN(num) ? value : num.toLocaleString();
  };

  const formatAmount = (value: string) => {
    const num = parseInt(value);
    if (isNaN(num)) return value;
    if (num >= 100000000) {
      const eok = Math.floor(num / 100000000);
      const man = Math.floor((num % 100000000) / 10000);
      return man > 0 ? `${eok.toLocaleString()}억 ${man.toLocaleString()}만` : `${eok.toLocaleString()}억`;
    }
    if (num >= 10000) return `${Math.floor(num / 10000).toLocaleString()}만`;
    return num.toLocaleString();
  };

  // netslmt_amt 단위: 만원
  const formatNetAmt = (value: string) => {
    const num = parseInt(value);
    if (isNaN(num)) return '-';
    const abs = Math.abs(num);
    if (abs >= 10000) return `${Math.floor(abs / 10000).toLocaleString()}억`;
    return `${abs.toLocaleString()}만`;
  };

  const getPriceColor = (changeRate: string) => {
    const rate = parseFloat(changeRate);
    if (rate > 0) return 'text-red-500';
    if (rate < 0) return 'text-blue-500';
    return 'text-gray-900 dark:text-white';
  };

  const getRankChange = (currentRank: number, previousRank: number) => {
    const diff = previousRank - currentRank;
    if (diff > 0) return { icon: '▲', color: 'text-red-500', change: diff };
    if (diff < 0) return { icon: '▼', color: 'text-blue-500', change: Math.abs(diff) };
    return { icon: '─', color: 'text-gray-400', change: undefined };
  };

  // ── 공통 UI ───────────────────────────────────────
  const FilterBtn = ({
    active, onClick, children, activeClass = 'bg-blue-600 text-white shadow-md',
  }: {
    active: boolean; onClick: () => void; children: React.ReactNode; activeClass?: string;
  }) => (
    <button
      onClick={onClick}
      className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
        active ? activeClass : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
      }`}
    >
      {children}
    </button>
  );

  const LoadingSpinner = () => (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4" />
      <p className="text-gray-600 dark:text-gray-400">데이터 불러오는 중...</p>
    </div>
  );

  const ErrorBox = ({ message }: { message: string }) => (
    <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-4 mb-4">
      <div className="flex items-start">
        <svg className="h-6 w-6 text-red-600 dark:text-red-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-red-600 dark:text-red-400 text-sm">{message}</p>
      </div>
    </div>
  );

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-20">
      <svg className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <p className="text-gray-500 dark:text-gray-400 text-center">표시할 데이터가 없습니다.</p>
    </div>
  );

  // ── 투자자별 compact 행 ────────────────────────────
  const InvestorRow = ({
    item,
    rank,
    isBuy,
    amtColor,
  }: {
    item: InvestorDailyTradeStock;
    rank: number;
    isBuy: boolean;
    amtColor: string;
  }) => (
    <div className="flex items-center gap-2 py-2 border-b border-gray-100 dark:border-gray-700/50 last:border-0">
      <span className="text-xs font-bold text-gray-400 w-5 shrink-0 text-center">{rank}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate leading-tight mb-0.5">{item.stk_nm}</p>
        <p className={`text-xs font-bold ${amtColor} leading-tight`}>
          {formatNetAmt(item.netslmt_amt)}
          <span className="text-[11px] font-normal text-gray-400 ml-0.5">만</span>
        </p>
      </div>
      <span className={`text-xs font-semibold shrink-0 ${getPriceColor(item.pre_rt)}`}>
        {item.pre_rt}%
      </span>
    </div>
  );

  const hasAnyData = Object.keys(investorData).length > 0;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 pb-16 lg:pb-0 lg:pl-64">

      {/* ── 헤더 + 탭 + 필터 ── */}
      <div className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 pt-4 pb-0">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">순위</h1>

          {/* 탭 */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            {(['trade', 'investor'] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2.5 text-sm font-semibold transition-all border-b-2 -mb-px ${
                  activeTab === tab
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400'
                }`}
              >
                {tab === 'trade' ? '거래대금 순위' : '투자자별 순위'}
              </button>
            ))}
          </div>
        </div>

        {/* 거래대금 필터 */}
        {activeTab === 'trade' && (
          <div className="max-w-7xl mx-auto px-4 lg:px-8 py-3">
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">날짜</label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={tradeDate || today}
                max={today}
                onChange={(e) => setTradeDate(e.target.value)}
                className="flex-1 py-2.5 px-3 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white text-sm font-semibold border-0 focus:ring-2 focus:ring-blue-500"
              />
              {tradeDate && tradeDate !== today && (
                <button
                  onClick={() => setTradeDate('')}
                  className="py-2.5 px-3 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-semibold"
                >
                  오늘
                </button>
              )}
            </div>
          </div>
        )}

        {/* 투자자별 필터 */}
        {activeTab === 'investor' && (
          <div className="max-w-7xl mx-auto px-4 lg:px-8 py-3 space-y-2.5">
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">날짜</label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={investorDate || today}
                    max={today}
                    onChange={(e) => setInvestorDate(e.target.value)}
                    className="flex-1 py-2 px-3 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white text-sm font-semibold border-0 focus:ring-2 focus:ring-blue-500"
                  />
                  {investorDate && investorDate !== today && (
                    <button
                      onClick={() => setInvestorDate('')}
                      className="py-2 px-3 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-semibold"
                    >
                      오늘
                    </button>
                  )}
                </div>
              </div>
              <div className="w-36">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">시장</label>
                <div className="flex gap-1.5">
                  <FilterBtn active={investorMarketType === '001'} onClick={() => setInvestorMarketType('001')}>코스피</FilterBtn>
                  <FilterBtn active={investorMarketType === '101'} onClick={() => setInvestorMarketType('101')}>코스닥</FilterBtn>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── 컨텐츠 ── */}
      <div className="flex-1 overflow-y-auto max-w-7xl mx-auto w-full px-4 lg:px-8 py-4">

        {/* 거래대금 탭 */}
        {activeTab === 'trade' && (
          <>
            {tradeLoading && <LoadingSpinner />}
            {tradeError && <ErrorBox message={tradeError} />}
            {!tradeLoading && !tradeError && (
              ranks.length === 0 ? <EmptyState /> : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                  {ranks.map((item, index) => {
                    const rankChange = getRankChange(item.current_rank, item.previous_rank);
                    const priceColor = getPriceColor(item.change_rate);

                    return (
                      <div
                        key={`${item.stock_code}-${index}`}
                        className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex flex-col items-center min-w-[60px]">
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">{item.current_rank}</div>
                            <div className={`text-xs font-semibold ${rankChange.color} flex items-center gap-0.5`}>
                              <span>{rankChange.icon}</span>
                              {rankChange.change !== undefined && <span>{rankChange.change}</span>}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base font-bold text-gray-900 dark:text-white truncate mb-0.5">{item.stock_name}</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mb-2">{item.stock_code}</p>
                            <div className="flex items-baseline gap-2 mb-2">
                              <span className={`text-lg font-bold ${priceColor}`}>{formatNumber(item.current_price)}</span>
                              <span className={`text-sm font-semibold ${priceColor}`}>{formatNumber(item.change_amount)}</span>
                              <span className={`text-sm font-semibold ${priceColor}`}>({item.change_rate}%)</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg px-2 py-1.5">
                                <div className="text-gray-500 dark:text-gray-400 text-[10px] mb-0.5">거래대금</div>
                                <div className="font-bold text-gray-900 dark:text-white mb-0.5">{formatAmount(String(item.trading_amount * 1000000))}</div>
                                <div className="text-[10px] text-gray-500 dark:text-gray-400">{item.trading_amount.toLocaleString()}백만원</div>
                              </div>
                              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg px-2 py-1.5">
                                <div className="text-gray-500 dark:text-gray-400 text-[10px] mb-0.5">거래량</div>
                                <div className="font-bold text-gray-900 dark:text-white">{item.trading_volume.toLocaleString()}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </>
        )}

        {/* 투자자별 탭 */}
        {activeTab === 'investor' && (
          <>
            {investorLoading && <LoadingSpinner />}
            {investorError && <ErrorBox message={investorError} />}
            {!investorLoading && !investorError && (
              !hasAnyData ? <EmptyState /> : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {INVESTOR_TYPES.map((type) => {
                    const buyList = (investorData[`${type.key}-2`] ?? []).slice(0, 5);
                    const sellList = (investorData[`${type.key}-1`] ?? []).slice(0, 5);

                    return (
                      <div
                        key={type.key}
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden xl:col-span-1"
                      >
                        {/* 섹션 헤더 */}
                        <div className={`bg-gradient-to-r ${type.gradient} px-4 py-3 flex items-center gap-2`}>
                          <span className="text-white font-bold text-lg">{type.label}</span>
                          <span className="text-white/70 text-sm ml-auto">
                            {investorMarketType === '001' ? 'KOSPI' : 'KOSDAQ'} · TOP 5
                          </span>
                        </div>

                        {/* 순매수 / 순매도 2컬럼 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100 dark:divide-gray-700">
                          {/* 순매수 */}
                          <div className="p-4">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-2 h-2 rounded-full bg-red-500" />
                              <span className="text-sm font-bold text-red-500">순매수</span>
                            </div>
                            {buyList.length === 0 ? (
                              <p className="text-[11px] text-gray-400 py-2 text-center">데이터 없음</p>
                            ) : (
                              buyList.map((item, i) => (
                                <InvestorRow
                                  key={`${item.stk_cd}-buy-${i}`}
                                  item={item}
                                  rank={i + 1}
                                  isBuy={true}
                                  amtColor="text-red-500"
                                />
                              ))
                            )}
                          </div>

                          {/* 순매도 */}
                          <div className="p-4">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-2 h-2 rounded-full bg-blue-500" />
                              <span className="text-sm font-bold text-blue-500">순매도</span>
                            </div>
                            {sellList.length === 0 ? (
                              <p className="text-[11px] text-gray-400 py-2 text-center">데이터 없음</p>
                            ) : (
                              sellList.map((item, i) => (
                                <InvestorRow
                                  key={`${item.stk_cd}-sell-${i}`}
                                  item={item}
                                  rank={i + 1}
                                  isBuy={false}
                                  amtColor="text-blue-500"
                                />
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </>
        )}
      </div>

    </div>
  );
}

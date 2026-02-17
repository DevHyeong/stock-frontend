'use client';

import { useState, useEffect } from 'react';
import { getTradingRanking, getInvestorDailyTrade } from '@/lib/api';
import BottomNav from '@/components/BottomNav';
import {InvestorDailyTradeStock, TradingRankingItem} from "@/types/stock";

type TabType = 'trade' | 'investor';

export default function RanksPage() {
  const [activeTab, setActiveTab] = useState<TabType>('trade');

  // ── 거래대금 상태 ──────────────────────────────────
  const [ranks, setRanks] = useState<TradingRankingItem[]>([]);
  const [tradeLoading, setTradeLoading] = useState(true);
  const [tradeError, setTradeError] = useState<string | null>(null);
  const [tradeDate, setTradeDate] = useState<string>(''); // YYYY-MM-DD, empty = today

  // ── 투자자별 상태 ──────────────────────────────────
  const [stocks, setStocks] = useState<InvestorDailyTradeStock[]>([]);
  const [investorLoading, setInvestorLoading] = useState(false);
  const [investorError, setInvestorError] = useState<string | null>(null);
  const [investorType, setInvestorType] = useState<string>('9000');
  const [tradeType, setTradeType] = useState<'1' | '2'>('2');
  const [investorMarketType, setInvestorMarketType] = useState<'001' | '101'>('001');
  const [investorExchangeType, setInvestorExchangeType] = useState<'1' | '2' | '3'>('1');

  const getToday = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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

  // ── 투자자별 fetch ─────────────────────────────────
  const fetchInvestorData = async () => {
    try {
      setInvestorLoading(true);
      const data = await getInvestorDailyTrade({
        strt_dt: today,
        end_dt: today,
        trde_tp: tradeType,
        mrkt_tp: investorMarketType,
        invsr_tp: investorType,
        stex_tp: investorExchangeType,
      });
      setStocks(data);
      setInvestorError(null);
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
      fetchInvestorData();
    }
  }, [activeTab, investorType, tradeType, investorMarketType, investorExchangeType]);

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

  const getInvestorTypeLabel = (type: string) => {
    const map: Record<string, string> = { '1000': '기관', '9000': '외국인', '8000': '개인' };
    return map[type] || type;
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">

      {/* ── 헤더 + 탭 + 필터 ── */}
      <div className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="px-4 pt-4 pb-0">
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
          <div className="px-4 py-3">
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
          <div className="px-4 py-3 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">투자자 구분</label>
              <div className="flex gap-2">
                <FilterBtn active={investorType === '9000'} onClick={() => setInvestorType('9000')}>외국인</FilterBtn>
                <FilterBtn active={investorType === '1000'} onClick={() => setInvestorType('1000')}>기관</FilterBtn>
                <FilterBtn active={investorType === '8000'} onClick={() => setInvestorType('8000')}>개인</FilterBtn>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">매매구분</label>
                <div className="flex gap-2">
                  <FilterBtn
                    active={tradeType === '2'}
                    onClick={() => setTradeType('2')}
                    activeClass="bg-red-600 text-white shadow-md"
                  >
                    순매수
                  </FilterBtn>
                  <FilterBtn active={tradeType === '1'} onClick={() => setTradeType('1')}>순매도</FilterBtn>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">시장구분</label>
                <div className="flex gap-2">
                  <FilterBtn active={investorMarketType === '001'} onClick={() => setInvestorMarketType('001')}>코스피</FilterBtn>
                  <FilterBtn active={investorMarketType === '101'} onClick={() => setInvestorMarketType('101')}>코스닥</FilterBtn>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── 컨텐츠 ── */}
      <div className="px-4 py-4">

        {/* 거래대금 탭 */}
        {activeTab === 'trade' && (
          <>
            {tradeLoading && <LoadingSpinner />}
            {tradeError && <ErrorBox message={tradeError} />}
            {!tradeLoading && !tradeError && (
              ranks.length === 0 ? <EmptyState /> : (
                <div className="space-y-2">
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
              stocks.length === 0 ? <EmptyState /> : (
                <>
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-lg mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm opacity-90">
                        {getInvestorTypeLabel(investorType)} {tradeType === '2' ? '순매수' : '순매도'} 상위
                      </span>
                      <span className="text-sm opacity-90">{investorMarketType === '001' ? 'KOSPI' : 'KOSDAQ'}</span>
                    </div>
                    <div className="text-2xl font-bold">{stocks.length}개 종목</div>
                  </div>

                  <div className="space-y-2">
                    {stocks.map((item, index) => {
                      const priceColor = getPriceColor(item.pre_sig);
                      const isPositive = tradeType === '2';

                      return (
                        <div
                          key={`${item.stk_cd}-${index}`}
                          className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex items-center justify-center min-w-[50px] h-[50px] rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                              <span className="text-xl font-bold">{index + 1}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-base font-bold text-gray-900 dark:text-white truncate mb-0.5">{item.stk_nm}</h3>
                              <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mb-2">{item.stk_cd}</p>
                              <div className="flex items-baseline gap-2 mb-3">
                                <span className={`text-lg font-bold ${priceColor}`}>{formatNumber(item.cur_prc)}</span>
                                <span className={`text-sm font-semibold ${priceColor}`}>
                                  {item.pre_sig === '2' || item.pre_sig === '5' ? '-' : ''}{formatNumber(item.pred_pre)}
                                </span>
                                <span className={`text-sm font-semibold ${priceColor}`}>({item.pre_rt}%)</span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className={`rounded-lg px-3 py-2 ${
                                  isPositive
                                    ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                                    : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                                }`}>
                                  <div className="text-gray-500 dark:text-gray-400 text-[10px] mb-0.5">순매수 금액</div>
                                  <div className={`font-bold text-sm ${isPositive ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}>
                                    {formatAmount(item.netslmt_amt)}
                                  </div>
                                  <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                                    {formatNumber(item.netslmt_amt)}원
                                  </div>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2">
                                  <div className="text-gray-500 dark:text-gray-400 text-[10px] mb-0.5">순매수 수량</div>
                                  <div className="font-bold text-gray-900 dark:text-white text-sm">{formatNumber(item.netslmt_qty)}</div>
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
              )
            )}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

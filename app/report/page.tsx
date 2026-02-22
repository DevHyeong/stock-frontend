'use client';

import { useState, useEffect } from 'react';
import { getTradingRanking, getInvestorDailyTrade } from '@/lib/api';
import BottomNav from '@/components/BottomNav';
import { TradingRankingItem, InvestorDailyTradeStock } from '@/types/stock';

type MarketType = 'all' | 'kospi' | 'kosdaq';

// ── 날짜 유틸 ────────────────────────────────────────
function toApiDate(d: Date): string {
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
}

function toInputDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** startDate~endDate 사이 평일 목록 (최대 MAX_DAYS개) */
const MAX_TRADE_DAYS = 20;

function getBusinessDaysBetween(startStr: string, endStr: string): string[] {
  const days: string[] = [];
  const end = new Date(endStr);
  const start = new Date(startStr);
  const cur = new Date(end);
  while (cur >= start && days.length < MAX_TRADE_DAYS) {
    const dow = cur.getDay();
    if (dow !== 0 && dow !== 6) {
      days.push(toApiDate(cur));
    }
    cur.setDate(cur.getDate() - 1);
  }
  return days;
}

// ── 거래대금 집계 ────────────────────────────────────
type AggregatedTradeStock = {
  stock_code: string;
  stock_name: string;
  total_amount: number;
  days_count: number;
  latest_price: string;
  latest_change_rate: string;
};

function aggregateRankings(allDayRankings: TradingRankingItem[][]): AggregatedTradeStock[] {
  const map = new Map<string, { name: string; total: number; count: number; price: string; rate: string }>();
  for (const dayList of allDayRankings) {
    for (const item of dayList) {
      const existing = map.get(item.stock_code);
      if (existing) {
        existing.total += item.trading_amount;
        existing.count += 1;
        existing.price = item.current_price;
        existing.rate = item.change_rate;
      } else {
        map.set(item.stock_code, {
          name: item.stock_name,
          total: item.trading_amount,
          count: 1,
          price: item.current_price,
          rate: item.change_rate,
        });
      }
    }
  }
  return Array.from(map.entries())
    .map(([code, v]) => ({
      stock_code: code,
      stock_name: v.name,
      total_amount: v.total,
      days_count: v.count,
      latest_price: v.price,
      latest_change_rate: v.rate,
    }))
    .sort((a, b) => b.total_amount - a.total_amount)
    .slice(0, 10);
}

// ── 투자자 데이터 병합 ────────────────────────────────
function mergeInvestorData(lists: InvestorDailyTradeStock[][]): InvestorDailyTradeStock[] {
  const map = new Map<string, InvestorDailyTradeStock>();
  for (const list of lists) {
    for (const item of list) {
      const existing = map.get(item.stk_cd);
      if (existing) {
        existing.netslmt_amt = String(parseInt(existing.netslmt_amt) + parseInt(item.netslmt_amt));
        existing.netslmt_qty = String(parseInt(existing.netslmt_qty) + parseInt(item.netslmt_qty));
      } else {
        map.set(item.stk_cd, { ...item });
      }
    }
  }
  return Array.from(map.values())
    .sort((a, b) => parseInt(b.netslmt_amt) - parseInt(a.netslmt_amt))
    .slice(0, 10);
}

// ── 포맷 유틸 ────────────────────────────────────────
const formatAmount = (manwon: number): string => {
  if (manwon >= 10000) return `${Math.floor(manwon / 10000).toLocaleString()}억`;
  return `${manwon.toLocaleString()}만`;
};

const formatTradingAmount = (million: number): string => {
  const manwon = million * 100;
  if (manwon >= 10000) return `${Math.floor(manwon / 10000).toLocaleString()}억`;
  return `${manwon.toLocaleString()}만`;
};

const getRateColor = (rate: string) => {
  const n = parseFloat(rate);
  if (n > 0) return 'text-red-500';
  if (n < 0) return 'text-blue-500';
  return 'text-gray-500';
};

// ── 컴포넌트 ─────────────────────────────────────────
export default function ReportPage() {
  const today = new Date();
  const defaultEnd = toInputDate(today);
  const defaultStart = (() => {
    const d = new Date(today);
    d.setDate(d.getDate() - 7);
    return toInputDate(d);
  })();

  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [marketType, setMarketType] = useState<MarketType>('all');

  const [tradeStocks, setTradeStocks] = useState<AggregatedTradeStock[]>([]);
  const [foreignBuy, setForeignBuy] = useState<InvestorDailyTradeStock[]>([]);
  const [institutionBuy, setInstitutionBuy] = useState<InvestorDailyTradeStock[]>([]);

  const [loading, setLoading] = useState(false);
  const [tradeError, setTradeError] = useState(false);
  const [foreignError, setForeignError] = useState(false);
  const [institutionError, setInstitutionError] = useState(false);

  const [fetchedDays, setFetchedDays] = useState(0);

  const fetchReport = async (start: string, end: string, market: MarketType) => {
    if (start > end) return;

    setLoading(true);
    setTradeError(false);
    setForeignError(false);
    setInstitutionError(false);
    setTradeStocks([]);
    setForeignBuy([]);
    setInstitutionBuy([]);

    const businessDays = getBusinessDaysBetween(start, end);
    const strt_dt = start.replace(/-/g, '');
    const end_dt = end.replace(/-/g, '');

    const mrktList: Array<'001' | '101'> =
      market === 'kospi' ? ['001'] : market === 'kosdaq' ? ['101'] : ['001', '101'];

    const [tradingResult, foreignResult, institutionResult] = await Promise.allSettled([
      // 거래대금: 거래일별 병렬 fetch 후 집계 (API 시장 구분 미지원 — 통합)
      Promise.allSettled(businessDays.map((d) => getTradingRanking(d))).then((results) =>
        results
          .filter((r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof getTradingRanking>>> =>
            r.status === 'fulfilled'
          )
          .map((r) => r.value.data.rankings)
      ),
      // 외국인 순매수
      Promise.allSettled(
        mrktList.map((mrkt_tp) =>
          getInvestorDailyTrade({ strt_dt, end_dt, trde_tp: '2', mrkt_tp, invsr_tp: '9000', stex_tp: '3' })
        )
      ).then((results) =>
        mergeInvestorData(
          results
            .filter((r): r is PromiseFulfilledResult<InvestorDailyTradeStock[]> => r.status === 'fulfilled')
            .map((r) => r.value)
        )
      ),
      // 기관 순매수
      Promise.allSettled(
        mrktList.map((mrkt_tp) =>
          getInvestorDailyTrade({ strt_dt, end_dt, trde_tp: '2', mrkt_tp, invsr_tp: '1000', stex_tp: '3' })
        )
      ).then((results) =>
        mergeInvestorData(
          results
            .filter((r): r is PromiseFulfilledResult<InvestorDailyTradeStock[]> => r.status === 'fulfilled')
            .map((r) => r.value)
        )
      ),
    ]);

    if (tradingResult.status === 'fulfilled') {
      setFetchedDays(tradingResult.value.length);
      setTradeStocks(aggregateRankings(tradingResult.value));
    } else {
      setTradeError(true);
    }
    if (foreignResult.status === 'fulfilled') {
      setForeignBuy(foreignResult.value);
    } else {
      setForeignError(true);
    }
    if (institutionResult.status === 'fulfilled') {
      setInstitutionBuy(institutionResult.value);
    } else {
      setInstitutionError(true);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchReport(startDate, endDate, marketType);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, marketType]);

  // ── 공통 UI ──────────────────────────────────────
  const SectionHeader = ({ title, subtitle, gradient }: { title: string; subtitle: string; gradient: string }) => (
    <div className={`bg-gradient-to-r ${gradient} rounded-t-xl px-4 py-3 flex items-center justify-between`}>
      <span className="text-white font-bold text-base">{title}</span>
      <span className="text-white/70 text-xs">{subtitle}</span>
    </div>
  );

  const ErrorRow = ({ message }: { message: string }) => (
    <div className="px-4 py-6 flex items-center justify-center gap-2 text-red-500 text-sm">
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {message}
    </div>
  );

  const EmptyRow = () => (
    <div className="px-4 py-6 text-center text-sm text-gray-400 dark:text-gray-500">데이터가 없습니다.</div>
  );

  const TradeRow = ({ item, rank }: { item: AggregatedTradeStock; rank: number }) => (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-700/50 last:border-0">
      <span className="text-sm font-bold text-gray-400 w-5 text-center shrink-0">{rank}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{item.stock_name}</p>
          <span className="text-[10px] text-gray-400 font-mono shrink-0">{item.stock_code}</span>
        </div>
        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
          {fetchedDays}거래일 누적 · {item.days_count}일 상위권
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-bold text-gray-900 dark:text-white">{formatTradingAmount(item.total_amount)}</p>
        <p className={`text-xs font-semibold ${getRateColor(item.latest_change_rate)}`}>
          {parseFloat(item.latest_change_rate) > 0 ? '+' : ''}{item.latest_change_rate}%
        </p>
      </div>
    </div>
  );

  const InvestorRow = ({ item, rank, amtColor }: { item: InvestorDailyTradeStock; rank: number; amtColor: string }) => (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-700/50 last:border-0">
      <span className="text-sm font-bold text-gray-400 w-5 text-center shrink-0">{rank}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{item.stk_nm}</p>
          <span className="text-[10px] text-gray-400 font-mono shrink-0">{item.stk_cd}</span>
        </div>
        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
          수량 {parseInt(item.netslmt_qty).toLocaleString()}주
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className={`text-sm font-bold ${amtColor}`}>
          +{formatAmount(parseInt(item.netslmt_amt))}
        </p>
        <p className={`text-xs font-semibold ${getRateColor(item.pre_rt)}`}>
          {parseFloat(item.pre_rt) > 0 ? '+' : ''}{item.pre_rt}%
        </p>
      </div>
    </div>
  );

  const SkeletonRows = ({ count = 5 }: { count?: number }) => (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-700/50 last:border-0 animate-pulse">
          <div className="w-5 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
            <div className="h-2.5 bg-gray-100 dark:bg-gray-700/50 rounded w-1/3" />
          </div>
          <div className="space-y-1.5 text-right">
            <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded w-16" />
            <div className="h-2.5 bg-gray-100 dark:bg-gray-700/50 rounded w-10 ml-auto" />
          </div>
        </div>
      ))}
    </>
  );

  const isInvalidRange = startDate > endDate;
  const marketLabel = marketType === 'all' ? 'KOSPI+KOSDAQ' : marketType === 'kospi' ? 'KOSPI' : 'KOSDAQ';
  const rangeLabel = `${startDate} ~ ${endDate}`;

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden">

      {/* ── 헤더 ── */}
      <div className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="px-4 pt-4 pb-3 space-y-2.5">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">리포트</h1>

          {/* 날짜 범위 + 시장 */}
          <div className="flex gap-2 items-center">
            {/* 시작일 */}
            <input
              type="date"
              value={startDate}
              max={endDate}
              onChange={(e) => e.target.value && setStartDate(e.target.value)}
              disabled={loading}
              className="flex-1 py-2 px-2.5 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
            <span className="text-gray-400 text-sm shrink-0">~</span>
            {/* 종료일 */}
            <input
              type="date"
              value={endDate}
              min={startDate}
              max={toInputDate(today)}
              onChange={(e) => e.target.value && setEndDate(e.target.value)}
              disabled={loading}
              className="flex-1 py-2 px-2.5 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />

            {/* 코스피/코스닥 */}
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg shrink-0">
              {([['all', '전체'], ['kospi', 'KS'], ['kosdaq', 'KQ']] as [MarketType, string][]).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setMarketType(key)}
                  disabled={loading}
                  className={`px-2 py-1 rounded-md text-xs font-semibold transition-all ${
                    marketType === key
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* 범위 오류 */}
          {isInvalidRange && (
            <p className="text-xs text-red-500">시작일이 종료일보다 늦을 수 없습니다.</p>
          )}
        </div>
      </div>

      {/* ── 컨텐츠 ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

        {/* ── 거래대금 상위 ── */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <SectionHeader
            title="거래대금 상위"
            subtitle={loading ? '로딩 중...' : `${rangeLabel} · ${fetchedDays}거래일 합산 TOP 10`}
            gradient="from-blue-500 to-blue-600"
          />
          {loading ? <SkeletonRows count={5} />
            : tradeError ? <ErrorRow message="거래대금 데이터를 불러오는데 실패했습니다." />
            : tradeStocks.length === 0 ? <EmptyRow />
            : tradeStocks.map((item, i) => <TradeRow key={item.stock_code} item={item} rank={i + 1} />)}
        </div>

        {/* ── 외국인 순매수 상위 ── */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <SectionHeader
            title="외국인 순매수 상위"
            subtitle={loading ? '로딩 중...' : `${rangeLabel} · ${marketLabel} TOP 10`}
            gradient="from-violet-500 to-violet-600"
          />
          {loading ? <SkeletonRows count={5} />
            : foreignError ? <ErrorRow message="외국인 순매수 데이터를 불러오는데 실패했습니다." />
            : foreignBuy.length === 0 ? <EmptyRow />
            : foreignBuy.map((item, i) => (
              <InvestorRow key={`${item.stk_cd}-f`} item={item} rank={i + 1} amtColor="text-violet-600 dark:text-violet-400" />
            ))}
        </div>

        {/* ── 기관 순매수 상위 ── */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <SectionHeader
            title="기관 순매수 상위"
            subtitle={loading ? '로딩 중...' : `${rangeLabel} · ${marketLabel} TOP 10`}
            gradient="from-emerald-500 to-emerald-600"
          />
          {loading ? <SkeletonRows count={5} />
            : institutionError ? <ErrorRow message="기관 순매수 데이터를 불러오는데 실패했습니다." />
            : institutionBuy.length === 0 ? <EmptyRow />
            : institutionBuy.map((item, i) => (
              <InvestorRow key={`${item.stk_cd}-i`} item={item} rank={i + 1} amtColor="text-emerald-600 dark:text-emerald-400" />
            ))}
        </div>

      </div>

      <div className="h-16 shrink-0" />
      <BottomNav />
    </div>
  );
}

'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { getMockStockDetail, getMockNews } from '@/lib/mockData';
import { getChartDay } from '@/lib/api/stock';
import { StockDetail, PricePoint, NewsArticle, ChartDayItem } from '@/types/stock';

type Period = '1W' | '1M' | '3M' | '6M' | '1Y';

const PERIODS: Period[] = ['1W', '1M', '3M', '6M', '1Y'];

function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

function getPeriodDates(period: Period): { startDt: string; endDt: string } {
  const end = new Date();
  const start = new Date(end);
  switch (period) {
    case '1W': start.setDate(end.getDate() - 7); break;
    case '1M': start.setMonth(end.getMonth() - 1); break;
    case '3M': start.setMonth(end.getMonth() - 3); break;
    case '6M': start.setMonth(end.getMonth() - 6); break;
    case '1Y': start.setFullYear(end.getFullYear() - 1); break;
  }
  return { startDt: toDateString(start), endDt: toDateString(end) };
}

function formatChartDate(dt: string, period: Period): string {
  // dt is YYYYMMDD
  const m = parseInt(dt.slice(4, 6), 10);
  const d = parseInt(dt.slice(6, 8), 10);
  const yy = dt.slice(2, 4);
  if (period === '1Y') return `${yy}/${String(m).padStart(2, '0')}`;
  return `${m}/${d}`;
}

function mapChartItems(items: ChartDayItem[], period: Period): PricePoint[] {
  return items.map(item => ({
    date: formatChartDate(item.dt, period),
    open: parseInt(item.open_pric, 10),
    high: parseInt(item.high_pric, 10),
    low: parseInt(item.low_pric, 10),
    price: parseInt(item.cur_prc, 10),
    volume: parseInt(item.trde_qty, 10),
  }));
}

function formatNumber(n: number): string {
  return n.toLocaleString('ko-KR');
}

function formatAmount(n: number): string {
  if (n >= 1_000_000_000_000) return `${(n / 1_000_000_000_000).toFixed(1)}조`;
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(0)}억`;
  if (n >= 10_000) return `${(n / 10_000).toFixed(0)}만`;
  return formatNumber(n);
}

function formatPublishedAt(iso: string): string {
  const date = new Date(iso);
  const now = new Date(2026, 1, 18);
  const diffMs = now.getTime() - date.getTime();
  const diffH = Math.floor(diffMs / 3_600_000);
  const diffD = Math.floor(diffMs / 86_400_000);
  if (diffH < 1) return '방금 전';
  if (diffH < 24) return `${diffH}시간 전`;
  return `${diffD}일 전`;
}

// SVG candlestick chart
function CandlestickChart({ data }: { data: PricePoint[] }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (data.length < 2) return null;

  const W = 800;
  const H = 300;
  const pad = { top: 20, right: 16, bottom: 32, left: 60 };
  const cW = W - pad.left - pad.right;
  const cH = H - pad.top - pad.bottom;

  const allHighs = data.map(d => d.high);
  const allLows = data.map(d => d.low);
  const minP = Math.min(...allLows);
  const maxP = Math.max(...allHighs);
  const range = maxP - minP || 1;

  const barW = cW / data.length;
  const candleW = Math.max(1, barW * 0.6);
  const centerX = (i: number) => pad.left + (i + 0.5) * barW;
  const yOf = (p: number) => pad.top + cH - ((p - minP) / range) * cH;

  const yTicks = [minP, minP + range / 2, maxP];
  const xLabelIndices = [
    0,
    Math.floor(data.length * 0.33),
    Math.floor(data.length * 0.66),
    data.length - 1,
  ];

  const hovered = hoverIndex !== null ? data[hoverIndex] : null;

  return (
    <div className="relative select-none">
      {hovered && (
        <div className="absolute top-0 left-0 right-0 flex justify-center pointer-events-none z-10">
          <div className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs px-2.5 py-1.5 rounded-md font-mono flex gap-2">
            <span>{hovered.date}</span>
            <span>시{formatNumber(hovered.open)}</span>
            <span>고{formatNumber(hovered.high)}</span>
            <span>저{formatNumber(hovered.low)}</span>
            <span>종{formatNumber(hovered.price)}</span>
          </div>
        </div>
      )}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        onMouseLeave={() => setHoverIndex(null)}
        onTouchEnd={() => setHoverIndex(null)}
      >
        {/* Grid lines */}
        {yTicks.map((p, i) => (
          <line key={i} x1={pad.left} y1={yOf(p)} x2={pad.left + cW} y2={yOf(p)}
            stroke="#e5e7eb" strokeWidth="0.5" strokeDasharray="3 3" />
        ))}

        {/* Candles */}
        {data.map((d, i) => {
          const isUp = d.price >= d.open;
          const color = isUp ? '#ef4444' : '#3b82f6';
          const cx = centerX(i);
          const bodyTop = yOf(Math.max(d.open, d.price));
          const bodyBot = yOf(Math.min(d.open, d.price));
          const bodyH = Math.max(1, bodyBot - bodyTop);
          return (
            <g key={i}>
              {/* Wick */}
              <line x1={cx} y1={yOf(d.high)} x2={cx} y2={yOf(d.low)}
                stroke={color} strokeWidth={Math.max(0.8, candleW * 0.15)} />
              {/* Body */}
              <rect
                x={cx - candleW / 2}
                y={bodyTop}
                width={candleW}
                height={bodyH}
                fill={isUp ? color : 'none'}
                stroke={color}
                strokeWidth={isUp ? 0 : Math.max(0.8, candleW * 0.12)}
              />
            </g>
          );
        })}

        {/* Y-axis labels */}
        {yTicks.map((p, i) => (
          <text key={i} x={pad.left - 4} y={yOf(p) + 4}
            textAnchor="end" fontSize="9" fill="#9ca3af">
            {formatNumber(p)}
          </text>
        ))}

        {/* X-axis labels */}
        {xLabelIndices.map(idx => (
          <text key={idx}
            x={centerX(idx)}
            y={H - 4}
            textAnchor={idx === 0 ? 'start' : idx === data.length - 1 ? 'end' : 'middle'}
            fontSize="9" fill="#9ca3af">
            {data[idx].date}
          </text>
        ))}

        {/* Hover overlay */}
        {data.map((d, i) => (
          <rect
            key={i}
            x={pad.left + i * barW}
            y={pad.top}
            width={barW}
            height={cH}
            fill="transparent"
            onMouseEnter={() => setHoverIndex(i)}
            onTouchStart={() => setHoverIndex(i)}
          />
        ))}

        {/* Hover crosshair */}
        {hoverIndex !== null && (
          <line
            x1={centerX(hoverIndex)} y1={pad.top}
            x2={centerX(hoverIndex)} y2={pad.top + cH}
            stroke="#9ca3af" strokeWidth="0.8" strokeDasharray="3 2" />
        )}
      </svg>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-gray-100 dark:border-gray-700 last:border-0">
      <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-sm font-medium text-gray-900 dark:text-white">{value}</span>
    </div>
  );
}

export default function StockDetailPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const router = useRouter();

  const [detail, setDetail] = useState<StockDetail | null>(null);
  const [priceData, setPriceData] = useState<PricePoint[]>([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [period, setPeriod] = useState<Period>('3M');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setDetail(getMockStockDetail(code));
      setNews(getMockNews(code));
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [code]);

  useEffect(() => {
    const { startDt, endDt } = getPeriodDates(period);
    setChartLoading(true);
    getChartDay(code, startDt, endDt)
      .then(items => setPriceData(mapChartItems(items, period)))
      .catch(() => setPriceData([]))
      .finally(() => setChartLoading(false));
  }, [code, period]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
          <p className="text-sm text-gray-500 dark:text-gray-400">불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-500">종목 정보를 찾을 수 없습니다.</p>
      </div>
    );
  }

  const isPositive = detail.change_amount >= 0;
  const priceColor = isPositive ? 'text-red-500' : 'text-blue-500';
  const changeBg = isPositive ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-8 lg:pl-64">

      {/* Header */}
      <div className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto flex items-center gap-3 px-4 lg:px-8 py-3">
          <button
            onClick={() => router.back()}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-95 transition-all"
          >
            <svg className="h-5 w-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-gray-900 dark:text-white truncate">
              {detail.stock_name}
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">{detail.stock_code}</span>
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                detail.market === 'KOSPI'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
              }`}>
                {detail.market}
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500">{detail.sector}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Price section */}
      <div className="bg-white dark:bg-gray-800 max-w-7xl mx-auto px-4 lg:px-8 pt-5 pb-4">
        <p className={`text-3xl font-bold ${priceColor}`}>
          {formatNumber(detail.current_price)}
          <span className="text-lg ml-1">원</span>
        </p>
        <div className="flex items-center gap-2 mt-2">
          <span className={`inline-flex items-center gap-1 text-sm font-semibold px-2 py-0.5 rounded-md ${changeBg}`}>
            {isPositive ? '▲' : '▼'}
            {formatNumber(Math.abs(detail.change_amount))}
          </span>
          <span className={`text-sm font-semibold ${priceColor}`}>
            {isPositive ? '+' : ''}{detail.change_rate.toFixed(2)}%
          </span>
          <span className="text-xs text-gray-400 dark:text-gray-500">전일 대비</span>
        </div>
      </div>

      {/* Chart section */}
      <div className="bg-white dark:bg-gray-800 max-w-7xl mx-auto mt-2 px-4 lg:px-8 pt-4 pb-5">

        {/* Period selector */}
        <div className="flex gap-1 mb-4">
          {PERIODS.map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95 ${
                period === p
                  ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {chartLoading ? (
          <div className="flex items-center justify-center h-[200px]">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
          </div>
        ) : (
          <CandlestickChart data={priceData} />
        )}
      </div>

      {/* Today's stats */}
      <div className="bg-white dark:bg-gray-800 max-w-7xl mx-auto mt-2 px-4 lg:px-8 py-1">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-0">
          <InfoRow label="시가" value={`${formatNumber(detail.open_price)}원`} />
          <InfoRow label="거래량" value={formatAmount(detail.volume)} />
          <InfoRow label="고가" value={`${formatNumber(detail.high_price)}원`} />
          <InfoRow label="거래대금" value={formatAmount(detail.trading_amount)} />
          <InfoRow label="저가" value={`${formatNumber(detail.low_price)}원`} />
          <InfoRow label="시가총액" value={formatAmount(detail.market_cap)} />
          <InfoRow label="52주 최고" value={`${formatNumber(detail.week52_high)}원`} />
          <InfoRow label="PER" value={`${detail.per}배`} />
          <InfoRow label="52주 최저" value={`${formatNumber(detail.week52_low)}원`} />
          <InfoRow label="PBR" value={`${detail.pbr}배`} />
        </div>
      </div>

      {/* News section */}
      <div className="max-w-7xl mx-auto mt-2">
        <div className="bg-white dark:bg-gray-800 px-4 lg:px-8 py-3 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">관련 뉴스</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-gray-100 dark:divide-gray-700">
          {news.map(article => (
            <div
              key={article.id}
              className="bg-white dark:bg-gray-800 px-4 lg:px-8 py-4 active:bg-gray-50 dark:active:bg-gray-700 transition-colors"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                  {article.source}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {formatPublishedAt(article.published_at)}
                </span>
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white leading-snug mb-1.5">
                {article.title}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2">
                {article.summary}
              </p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

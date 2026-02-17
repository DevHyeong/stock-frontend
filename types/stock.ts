export interface Stock {
  stock_code: string;
  stock_name: string;
  market?: string;
  sector?: string;
  current_price?: number;
}

export interface StockListResponse {
  success: boolean;
  message: string;
  data: Stock[] | null;
  error?: string | null;
}

export interface APIError {
  success: false;
  message: string;
  error: string;
}

export interface Sector {
  id: number;
  code: string;
  name: string;
  market?: string;
  category?: string;
  level?: number;
  parent_id?: number | null;
  stock_count?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  stocks?: Stock[];
}

export interface SectorListResponse {
  success: boolean;
  message: string;
  data: Sector[] | null;
  error?: string | null;
}

export interface SectorDetailResponse {
  success: boolean;
  message: string;
  data: Sector | null;
  error?: string | null;
}

export interface SectorCreate {
  code: string;
  name: string;
  market?: string;
  category?: string;
  level?: number;
  parent_id?: number | null;
}

export interface SectorCreateResponse {
  success: boolean;
  message: string;
  data: Sector | null;
  error?: string | null;
}

// 거래대금 순위
export interface TradingRankingItem {
  id: number;
  stock_code: string;
  stock_name: string;
  trade_date: string;
  current_price: string;
  change_amount: string;
  change_rate: string;
  trading_amount: number;
  trading_volume: number;
  previous_trading_volume: number;
  sell_bid: string;
  buy_bid: string;
  current_rank: number;
  previous_rank: number;
}

export interface TradingRankingResponse {
  success: boolean;
  message: string;
  data: {
    trade_date: string;
    rankings: TradingRankingItem[];
    total_count: number;
  };
  error: string | null;
}

// 투자자별 순매수 순위
export interface InvestorDailyTradeStock {
  stk_cd: string;           // 종목코드
  stk_nm: string;           // 종목명
  netslmt_qty: string;      // 순매수량
  netslmt_amt: string;      // 순매수금액
  prsm_avg_pric: string;    // 취득평균가
  cur_prc: string;          // 현재가
  pre_sig: string;          // 전일대비부호
  pred_pre: string;         // 전일대비
  avg_pric_pre: string;     // 평균가대비
  pre_rt: string;           // 등락률
  dt_trde_qty: string;      // 당일거래량
}

export interface InvestorDailyTradeParams {
  strt_dt: string;          // 시작일자 (YYYYMMDD)
  end_dt: string;           // 종료일자 (YYYYMMDD)
  trde_tp: '1' | '2';       // 매매구분 (1: 순매도, 2: 순매수)
  mrkt_tp: '001' | '101';   // 시장구분 (001: 코스피, 101: 코스닥)
  invsr_tp: string;         // 투자자구분 (8000: 개인, 9000: 외국인, 1000: 기관, ...)
  stex_tp: '1' | '2' | '3'; // 거래소구분 (1: KRX, 2: NXT, 3: 통합)
}

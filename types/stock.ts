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

// 거래대금 상위 종목
export interface TradeRankItem {
  stk_cd: string;           // 종목코드
  now_rank: string;         // 현재순위
  pred_rank: string;        // 이전순위
  stk_nm: string;           // 종목명
  cur_prc: string;          // 현재가
  pred_pre_sig: string;     // 전일대비부호
  pred_pre: string;         // 전일대비
  flu_rt: string;           // 등락률
  sel_bid: string;          // 매도호가
  buy_bid: string;          // 매수호가
  now_trde_qty: string;     // 현재거래량
  pred_trde_qty: string;    // 이전거래량
  trde_prica: string;       // 거래대금
}

export interface TradeRankResponse {
  cont_yn: string | null;
  next_key: string | null;
  trde_prica_upper: TradeRankItem[];
}

export type MarketType = '000' | '001' | '101'; // 000: 전체, 001: 코스피, 101: 코스닥
export type MangStkIncls = '0' | '1'; // 0: 불포함, 1: 포함
export type StexType = '1' | '2' | '3'; // 1: KRX, 2: NXT, 3: 통합

export interface TradeRankParams {
  mrkt_tp: MarketType;
  mang_stk_incls: MangStkIncls;
  stex_tp: StexType;
  cont_yn?: string;
  next_key?: string;
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

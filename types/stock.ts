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

// 종목 상세
export interface StockDetail {
  stock_code: string;
  stock_name: string;
  market: string;
  sector: string;
  current_price: number;
  change_amount: number;
  change_rate: number;
  open_price: number;
  high_price: number;
  low_price: number;
  volume: number;
  trading_amount: number;
  market_cap: number;
  per: number;
  pbr: number;
  week52_high: number;
  week52_low: number;
  eps?: number;             // EPS (주당순이익)
  roe?: number;             // ROE (자기자본이익률)
  bps?: number;             // BPS (주당순자산가치)
  upper_limit?: number;     // 상한가
  lower_limit?: number;     // 하한가
}

// 종목 기본 정보 API 응답
export interface StockBasicInfo {
  stk_cd: string;           // 종목코드
  stk_nm: string;           // 종목명
  setl_mm?: string;         // 결산월
  fav?: string;             // 액면가
  fav_unit?: string;        // 액면가 단위
  cap?: string;             // 자본금 (억원)
  flo_stk?: string;         // 유통주식수 (천주)
  dstr_stk?: string;        // 시가총액 (억원)
  dstr_rt?: string;         // 유통비율
  crd_rt?: string;          // 신용비율
  mac?: string;             // 시가총액 (백만원)
  mac_wght?: string;        // 시가총액 비중
  for_exh_rt?: string;      // 외국인 소진율
  repl_pric?: string;       // 대용가
  cur_prc: string;          // 현재가
  pre_sig: string;          // 전일대비부호 (2:상승, 4:보합, 5:하락)
  pred_pre: string;         // 전일대비
  flu_rt: string;           // 등락률
  trde_qty: string;         // 거래량
  trde_pre?: string;        // 거래증감
  open_pric: string;        // 시가
  high_pric: string;        // 고가
  low_pric: string;         // 저가
  upl_pric?: string;        // 상한가
  lst_pric?: string;        // 하한가
  base_pric?: string;       // 기준가
  exp_cntr_pric?: string;   // 예상 체결가
  exp_cntr_qty?: string;    // 예상 체결량
  oyr_hgst?: string;        // 연중 최고가
  oyr_lwst?: string;        // 연중 최저가
  "250hgst"?: string;       // 250일 최고가 (52주)
  "250hgst_pric_dt"?: string; // 250일 최고가 날짜
  "250hgst_pric_pre_rt"?: string; // 250일 최고가 대비율
  "250lwst"?: string;       // 250일 최저가 (52주)
  "250lwst_pric_dt"?: string; // 250일 최저가 날짜
  "250lwst_pric_pre_rt"?: string; // 250일 최저가 대비율
  per?: string;             // PER
  eps?: string;             // EPS (주당순이익)
  roe?: string;             // ROE (자기자본이익률)
  pbr?: string;             // PBR
  ev?: string;              // EV
  bps?: string;             // BPS (주당순자산가치)
  sale_amt?: string;        // 매출액 (억원)
  bus_pro?: string;         // 영업이익 (억원)
  cup_nga?: string;         // 당기순이익 (억원)
}

export interface StockBasicInfoResponse {
  success: boolean;
  message: string;
  data: StockBasicInfo | null;
  error?: string | null;
}

export interface PricePoint {
  date: string;
  open: number;
  high: number;
  low: number;
  price: number; // close
  volume: number;
}

export interface NewsArticle {
  id: number;
  title: string;
  source: string;
  published_at: string;
  summary: string;
}

// 차트 (일봉)
export interface ChartDayItem {
  dt: string;           // 날짜 YYYYMMDD
  cur_prc: string;      // 현재가 (종가)
  open_pric: string;    // 시가
  high_pric: string;    // 고가
  low_pric: string;     // 저가
  trde_qty: string;     // 거래량
  trde_prica: string;   // 거래대금 (백만원)
  pred_pre: string;     // 전일대비
  pred_pre_sig: string; // 전일대비부호 (2:상승, 5:하락)
  trde_tern_rt: string; // 거래회전율
}

export interface ChartDayResponse {
  cont_yn: string | null;
  next_key: string | null;
  items: ChartDayItem[];
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

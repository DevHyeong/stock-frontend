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

import { Stock, StockListResponse } from '@/types/stock';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function getStockList(): Promise<Stock[]> {
  try {
    const response = await fetch(`${API_URL}/api/v1/stock/list`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data: StockListResponse = await response.json();

    if (data.success && data.data) {
      return data.data;
    }

    return [];
  } catch (error) {
    console.error('Failed to fetch stock list:', error);
    throw error;
  }
}

export async function searchStocks(query: string, stocks: Stock[]): Promise<Stock[]> {
  if (!query.trim()) {
    return stocks;
  }

  const lowerQuery = query.toLowerCase();
  return stocks.filter(
    (stock) =>
      stock.stock_code.toLowerCase().includes(lowerQuery) ||
      stock.stock_name.toLowerCase().includes(lowerQuery)
  );
}

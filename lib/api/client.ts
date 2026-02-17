export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
export const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';

export async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error || errorData?.message || `API Error: ${response.status}`);
  }

  return response.json();
}

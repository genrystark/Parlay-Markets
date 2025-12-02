// API Client for Parlay Market Backend
// Generic client for making API requests to backend functions

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_SUPABASE_URL;
const API_KEY = import.meta.env.VITE_API_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export interface ApiClientOptions {
  body?: any;
  method?: string;
  headers?: Record<string, string>;
}

/**
 * Invoke backend function
 */
export async function invokeFunction(functionName: string, options: ApiClientOptions = {}) {
  const url = `${API_BASE_URL}/functions/v1/${functionName}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (API_KEY) {
    headers['Authorization'] = `Bearer ${API_KEY}`;
  }

  const response = await fetch(url, {
    method: options.method || 'POST',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  return response.json();
}


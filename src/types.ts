export interface SearchFilters {
  speaker?: string;
  published_after?: string;
  min_duration?: number;
  max_duration?: number;
  source?: string;
}

export interface SearchRequest {
  query: string;
  max_results?: number;
  ranking_mode?: "embedding" | "rerank";
  include_answer?: boolean;
  filters?: SearchFilters;
}

export interface SearchResult {
  id: string;
  score: number;
  rerank_score?: number | null;
  url: string;
  title: string;
  snippet: string;
  transcript?: string | null;
  thumbnail_url?: string | null;
  keyframe_url?: string | null;
  duration: number;
  source: string;
  speaker?: string | null;
  timestamp_start?: number | null;
  timestamp_end?: number | null;
}

export interface SearchResponse {
  results: SearchResult[];
  answer?: string | null;
  credits_used: number;
  credits_remaining: number;
  request_id: string;
}

export interface CreditBreakdown {
  included_remaining: number;
  bonus_remaining: number;
  paid_remaining: number;
}

export interface ExpiringCredit {
  grant_type: string;
  credits: number;
  expires_at: string;
}

export interface UsageResponse {
  tier: string;
  plan_code: string;
  period_start: string;
  period_end: string;
  credits_limit: number;
  credits_used: number;
  credits_remaining: number;
  wallet_balance: number;
  credit_breakdown: CreditBreakdown;
  expiring_credits: ExpiringCredit[];
  rate_limit_per_sec: number;
  api_keys_active: number;
  billing_hold: boolean;
  daily_free_remaining: number;
  daily_free_limit: number;
}

export interface CerulClient {
  search(request: SearchRequest): Promise<SearchResponse>;
  usage(): Promise<UsageResponse>;
}

export interface CerulOptions {
  apiKey?: string;
  baseUrl?: string;
  timeout?: number;
  retry?: boolean;
  fetch?: typeof fetch;
}

import type { DealResult, Decisions, Rank, ScenarioId } from '../../shared/engine';
import { accessToken, forgetSession } from './auth';
import { lang, t } from './i18n';

/** API のエラー。401 はログインが必要（またはセッション切れ） */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

// CloudFront OAC が Authorization ヘッダーを使うため、独自ヘッダーでトークンを送る
async function authHeaders(): Promise<Record<string, string>> {
  const token = await accessToken();
  if (!token) throw new ApiError(t().apiCodes.login_required, 401);
  return { 'x-auth-token': token };
}

export interface DealSummary {
  id: string;
  playerName: string;
  createdAt: string;
  scenario: ScenarioId;
  total: number;
  rank: Rank;
  won: boolean;
  arr: number;
}

export interface DealRecord extends DealSummary {
  seed: number;
  decisions: Decisions;
  result: DealResult;
}

async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, init);
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    // JSON 以外（ローカル開発で API がない場合など）
  }
  if (!res.ok || data === null) {
    const body = data as { message?: string; code?: string } | null;
    if (res.status === 401) forgetSession();
    // サーバーの文言は日本語のため、コードがあれば選んだ言語の文言に置き換える
    const msg = (body?.code && t().apiCodes[body.code]) || (lang() === 'ja' ? body?.message : undefined);
    throw new ApiError(msg ?? t().apiUnreachable(res.status), res.status);
  }
  return data as T;
}

export function listDeals(limit = 20) {
  return request<{ items: DealSummary[] }>(`/api/deals?limit=${limit}`);
}

export async function listMine() {
  return request<{ items: DealSummary[] }>('/api/me/deals', { headers: await authHeaders() });
}

export function leaderboard() {
  return request<{ items: DealSummary[] }>('/api/leaderboard');
}

export function getDeal(id: string) {
  return request<DealRecord>(`/api/deals/${encodeURIComponent(id)}`);
}

export async function saveDeal(payload: { playerName: string; seed: number; decisions: Decisions }) {
  const body = JSON.stringify(payload);
  // CloudFront OAC 経由で Lambda Function URL に POST する場合、本文の SHA-256 が必要
  const hash = await sha256Hex(body);
  return request<DealRecord>('/api/deals', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-amz-content-sha256': hash, ...(await authHeaders()) },
    body,
  });
}

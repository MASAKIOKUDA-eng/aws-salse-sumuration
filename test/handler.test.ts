import { beforeEach, describe, expect, it, vi } from 'vitest';

const send = vi.fn();
const verify = vi.fn();
process.env.USER_POOL_ID = 'ap-northeast-1_test';
vi.mock('aws-jwt-verify', () => ({ CognitoJwtVerifier: { create: () => ({ verify }) } }));
vi.mock('@aws-sdk/lib-dynamodb', async (orig) => {
  const actual = await orig<typeof import('@aws-sdk/lib-dynamodb')>();
  return { ...actual, DynamoDBDocumentClient: { from: () => ({ send }) } };
});

const { handler, cleanText, newId } = await import('../api/handler');
const { conditionsFromSeed, simulate } = await import('../shared/engine');
import type { LambdaFunctionURLEvent } from 'aws-lambda';

const decisions = {
  research: ['ir', 'case'],
  team: ['sa', 'partner'],
  questions: ['goal', 'pain', 'decision'],
  problem: 'a',
  services: ['ecs', 'aurora', 'cloudfront'],
  approach: 'phased',
  pricing: 'funding',
  responses: ['a', 'a'],
  close: 'map',
};

function event(
  method: string,
  rawPath: string,
  body?: unknown,
  query?: Record<string, string>,
  headers: Record<string, string> = {},
): LambdaFunctionURLEvent {
  return {
    rawPath,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    isBase64Encoded: false,
    queryStringParameters: query,
    requestContext: { http: { method } },
  } as unknown as LambdaFunctionURLEvent;
}

const AUTH = { 'x-auth-token': 'valid-token' };

beforeEach(() => {
  send.mockReset();
  verify.mockReset();
  verify.mockImplementation(async (t: string) => {
    if (t === 'valid-token') return { sub: 'user-123' };
    throw new Error('invalid token');
  });
});

describe('POST /api/deals', () => {
  it('サーバーで再計算した結果を保存する（クライアントの点数は無視）', async () => {
    send.mockResolvedValue({});
    const res = await handler(
      event('POST', '/api/deals', { playerName: ' 営業太郎 ', seed: 99, decisions, result: { total: 100 }, total: 100 }, undefined, AUTH),
    );
    expect(res.statusCode).toBe(201);
    const [main, mine] = send.mock.calls[0][0].input.TransactItems.map((t: { Put: { Item: Record<string, unknown> } }) => t.Put.Item);
    const expected = simulate(conditionsFromSeed(99), decisions as never);
    expect(main.playerName).toBe('営業太郎');
    expect(main.total).toBe(expected.total);
    expect(main.scenario).toBe(conditionsFromSeed(99).scenario);
    expect(main.expiresAt).toBeGreaterThan(Date.now() / 1000);
    expect(main.userSub).toBe('user-123');
    expect(mine.pk).toBe('USER#user-123');
    expect(mine.sk).toBe(main.sk);
    expect(mine.decisions).toBeUndefined();
    const body = JSON.parse(res.body);
    expect(body.id).toBe(main.sk);
    expect(body.userSub).toBeUndefined();
  });

  it('ログインしていない・トークンが不正なら 401 で保存しない', async () => {
    const payload = { playerName: 'a', seed: 1, decisions };
    const res = await handler(event('POST', '/api/deals', payload));
    expect(res.statusCode).toBe(401);
    // 画面が選んだ言語の文言に置き換えられるよう、エラーにはコードを付ける
    expect(JSON.parse(res.body).code).toBe('login_required');
    expect((await handler(event('POST', '/api/deals', payload, undefined, { 'x-auth-token': 'forged' }))).statusCode).toBe(401);
    expect(send).not.toHaveBeenCalled();
  });

  it('不正な入力は 400', async () => {
    const post = (b: unknown) => handler(event('POST', '/api/deals', b, undefined, AUTH));
    expect((await post({ playerName: '', seed: 1, decisions })).statusCode).toBe(400);
    expect((await post({ playerName: 'a'.repeat(21), seed: 1, decisions })).statusCode).toBe(400);
    expect((await post({ playerName: 'a', seed: 1.5, decisions })).statusCode).toBe(400);
    expect((await post({ playerName: 'a', seed: 1, decisions: { ...decisions, services: [] } })).statusCode).toBe(400);
    expect((await post({ playerName: 'a', seed: 1, decisions: { ...decisions, questions: ['pain', 'pain', 'goal'] } })).statusCode).toBe(400);
    expect((await post({ playerName: 'a', seed: 1, decisions: { ...decisions, close: 'bribe' } })).statusCode).toBe(400);
    expect(send).not.toHaveBeenCalled();
  });
});

describe('GET', () => {
  it('一覧は上限 50 件・利用者 ID を返さない', async () => {
    send.mockResolvedValue({ Items: [{ pk: 'DEAL', sk: 'x', playerName: 'a', userSub: 'secret' }] });
    const res = await handler(event('GET', '/api/deals', undefined, { limit: '999' }));
    expect(res.statusCode).toBe(200);
    expect(send.mock.calls[0][0].input.Limit).toBe(50);
    expect(res.body).not.toContain('secret');
  });

  it('自分の記録はログインが必要で、キャッシュさせない', async () => {
    expect((await handler(event('GET', '/api/me/deals'))).statusCode).toBe(401);
    send.mockResolvedValue({ Items: [] });
    const res = await handler(event('GET', '/api/me/deals', undefined, undefined, AUTH));
    expect(res.statusCode).toBe(200);
    expect(send.mock.calls[0][0].input.ExpressionAttributeValues[':pk']).toBe('USER#user-123');
    expect(res.headers['cache-control']).toBe('no-store');
  });

  it('成績表は点数の高い順に 10 件', async () => {
    const items = Array.from({ length: 15 }, (_, i) => ({ pk: 'DEAL', sk: `s${i}`, total: i, arr: 0 }));
    send.mockResolvedValue({ Items: items });
    const body = JSON.parse((await handler(event('GET', '/api/leaderboard'))).body);
    expect(body.items).toHaveLength(10);
    expect(body.items[0].total).toBe(14);
  });

  it('不正な ID・存在しない記録は 404', async () => {
    expect((await handler(event('GET', '/api/deals/..%2Fetc'))).statusCode).toBe(404);
    send.mockResolvedValue({});
    expect((await handler(event('GET', `/api/deals/${newId()}`))).statusCode).toBe(404);
  });
});

describe('cleanText', () => {
  it('制御文字を除き、長さを検証する', () => {
    expect(cleanText(' a\u0000b ', 5)).toBe('ab');
    expect(cleanText('', 5)).toBeNull();
    expect(cleanText(1, 5)).toBeNull();
  });
});

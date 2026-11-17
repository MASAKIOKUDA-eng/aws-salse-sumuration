import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, QueryCommand, TransactWriteCommand } from '@aws-sdk/lib-dynamodb';
import type { LambdaFunctionURLEvent } from 'aws-lambda';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { conditionsFromSeed, simulate, validateDecisions, validateSeed } from '../shared/engine';

const TABLE_NAME = process.env.TABLE_NAME ?? '';
const USER_POOL_ID = process.env.USER_POOL_ID ?? '';
const PK = 'DEAL';
const userPk = (sub: string) => `USER#${sub}`;
/**
 * 認証トークンのヘッダー。CloudFront OAC が Authorization ヘッダーを署名に使うため、
 * 独自ヘッダーでアクセストークンを受け取る。
 */
export const AUTH_HEADER = 'x-auth-token';
/** イベント用途のため、記録は 90 日で自動削除する */
const TTL_SECONDS = 90 * 24 * 60 * 60;
const SUMMARY_FIELDS = ['sk', 'playerName', 'createdAt', 'scenario', 'total', 'rank', 'won', 'arr'];

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: { removeUndefinedValues: true },
});

// ユーザープールが発行したアクセストークンだけを受け付ける。
// アプリクライアントはこのプールに 1 つだけ（クライアント ID を渡すとリソースが循環参照になるため null）
const verifier = USER_POOL_ID
  ? CognitoJwtVerifier.create({ userPoolId: USER_POOL_ID, tokenUse: 'access', clientId: null })
  : null;

/** 有効なアクセストークンならユーザー ID（sub）を返す */
export async function authenticate(event: LambdaFunctionURLEvent): Promise<string | null> {
  const token = event.headers?.[AUTH_HEADER];
  if (!verifier || !token || token.length > 4096) return null;
  try {
    const payload = await verifier.verify(token);
    return payload.sub;
  } catch {
    return null;
  }
}

type Result = { statusCode: number; headers: Record<string, string>; body: string };

const json = (statusCode: number, body: unknown, cacheSeconds = 0): Result => ({
  statusCode,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': cacheSeconds > 0 ? `public, max-age=${cacheSeconds}` : 'no-store',
  },
  body: JSON.stringify(body),
});

/** 時刻順に並ぶ ID（先頭 9 文字は 0 埋めした base36 のミリ秒） */
export function newId(now = Date.now()): string {
  const time = now.toString(36).padStart(9, '0');
  const rand = Math.random().toString(36).slice(2, 8).padEnd(6, '0');
  return `${time}-${rand}`;
}

const ID_PATTERN = /^[0-9a-z]{9}-[0-9a-z]{6}$/;

/** 制御文字を除き、前後の空白を落として長さを検証する */
export function cleanText(v: unknown, max: number): string | null {
  if (typeof v !== 'string') return null;
  // eslint-disable-next-line no-control-regex
  const s = v.replace(/[\u0000-\u001f\u007f]/g, '').trim();
  if (s.length === 0 || [...s].length > max) return null;
  return s;
}

function parseBody(event: LambdaFunctionURLEvent): unknown {
  if (!event.body) return null;
  const raw = event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf8') : event.body;
  if (raw.length > 4096) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function createDeal(event: LambdaFunctionURLEvent): Promise<Result> {
  const sub = await authenticate(event);
  if (!sub) return json(401, { message: '記録するにはログインが必要です' });

  const body = parseBody(event) as Record<string, unknown> | null;
  if (!body || typeof body !== 'object') return json(400, { message: 'リクエストの形式が正しくありません' });

  const playerName = cleanText(body.playerName, 20);
  if (!playerName) return json(400, { message: '担当者名は 1〜20 文字で入力してください' });
  if (!validateSeed(body.seed)) return json(400, { message: 'seed が不正です' });
  const decisions = validateDecisions(body.decisions);
  if (!decisions.ok) return json(400, { message: decisions.error });

  // クライアントの計算結果は信用せず、サーバーで再計算する
  const conditions = conditionsFromSeed(body.seed);
  const result = simulate(conditions, decisions.value);

  const now = Date.now();
  const item = {
    pk: PK,
    sk: newId(now),
    playerName,
    createdAt: new Date(now).toISOString(),
    seed: body.seed,
    scenario: conditions.scenario,
    decisions: decisions.value,
    result,
    total: result.total,
    rank: result.rank,
    won: result.won,
    arr: result.arr,
    userSub: sub,
    expiresAt: Math.floor(now / 1000) + TTL_SECONDS,
  };
  // 「自分の記録」用に、ユーザー単位のパーティションにも要約を書く（GSI を使わずコストを抑える）
  const userItem = {
    pk: userPk(sub),
    ...Object.fromEntries(SUMMARY_FIELDS.map((f) => [f, item[f as keyof typeof item]])),
    expiresAt: item.expiresAt,
  };
  await ddb.send(
    new TransactWriteCommand({
      TransactItems: [
        { Put: { TableName: TABLE_NAME, Item: item, ConditionExpression: 'attribute_not_exists(sk)' } },
        { Put: { TableName: TABLE_NAME, Item: userItem, ConditionExpression: 'attribute_not_exists(sk)' } },
      ],
    }),
  );
  return json(201, toPublic(item));
}

function toPublic(item: Record<string, unknown>): Record<string, unknown> {
  // ユーザー ID は公開しない
  const { pk: _pk, sk, expiresAt: _exp, userSub: _sub, ...rest } = item;
  return { id: sk, ...rest };
}

async function listRecent(limit: number, pk = PK) {
  const out = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'pk = :pk',
      ExpressionAttributeValues: { ':pk': pk },
      ProjectionExpression: SUMMARY_FIELDS.map((_, i) => `#f${i}`).join(','),
      ExpressionAttributeNames: Object.fromEntries(SUMMARY_FIELDS.map((f, i) => [`#f${i}`, f])),
      ScanIndexForward: false,
      Limit: limit,
    }),
  );
  return (out.Items ?? []).map(toPublic);
}

async function getDeal(id: string): Promise<Result> {
  if (!ID_PATTERN.test(id)) return json(404, { message: '記録が見つかりません' });
  const out = await ddb.send(new GetCommand({ TableName: TABLE_NAME, Key: { pk: PK, sk: id } }));
  if (!out.Item) return json(404, { message: '記録が見つかりません' });
  return json(200, toPublic(out.Item), 60);
}

export async function handler(event: LambdaFunctionURLEvent): Promise<Result> {
  const method = event.requestContext.http.method;
  const path = event.rawPath.replace(/\/+$/, '');

  try {
    if (path === '/api/deals' && method === 'GET') {
      const requested = Number(event.queryStringParameters?.limit ?? 20);
      const limit = Number.isFinite(requested) ? Math.min(50, Math.max(1, Math.floor(requested))) : 20;
      return json(200, { items: await listRecent(limit) }, 10);
    }
    if (path === '/api/deals' && method === 'POST') {
      return await createDeal(event);
    }
    const match = path.match(/^\/api\/deals\/([^/]+)$/);
    if (match && method === 'GET') {
      return await getDeal(decodeURIComponent(match[1]));
    }
    if (path === '/api/me/deals' && method === 'GET') {
      const sub = await authenticate(event);
      if (!sub) return json(401, { message: 'ログインが必要です' });
      // 利用者ごとの内容のため、キャッシュさせない（no-store）
      return json(200, { items: await listRecent(50, userPk(sub)) });
    }
    if (path === '/api/leaderboard' && method === 'GET') {
      // 直近 300 件を、スコア → 年間利用見込みの順に並べる
      const items = await listRecent(300);
      items.sort((a, b) => Number(b.total) - Number(a.total) || Number(b.arr) - Number(a.arr));
      return json(200, { items: items.slice(0, 10) }, 30);
    }
    return json(404, { message: 'Not Found' });
  } catch (err) {
    console.error(err);
    return json(500, { message: 'サーバーでエラーが発生しました' });
  }
}

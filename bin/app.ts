#!/usr/bin/env node
import { App } from 'aws-cdk-lib';
import { DealRoomStack } from '../lib/deal-room-stack';

const app = new App();
const ctx = (key: string) => app.node.tryGetContext(key);
const flag = (key: string, fallback: boolean) => {
  const v = ctx(key);
  return v === undefined ? fallback : v === true || v === 'true';
};

const account = process.env.CDK_DEFAULT_ACCOUNT;
const region = process.env.CDK_DEFAULT_REGION ?? 'ap-northeast-1';
const stackName: string = ctx('stackName') ?? 'DealRoom';

// WAF は使わない（イベント期間だけの公開で、Web ACL の月額固定費に見合わないため）。
// 代わりに OAC・入力検証・サーバー側の再計算・API 応答のキャッシュで守る（aidlc-docs の ADR-4）
new DealRoomStack(app, stackName, {
  env: { account, region },
  destroyData: flag('destroyData', false),
  devOrigins: flag('allowLocalhost', false) ? ['http://localhost:8000'] : [],
});

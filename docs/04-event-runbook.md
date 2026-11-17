# 04. デプロイとイベント当日の手順

## 事前準備（11/18 ごろまで）

```bash
npm ci
npm test
npm run balance            # 採点バランスの確認（任意）

export AWS_PROFILE=<profile> AWS_REGION=ap-northeast-1
aws sts get-caller-identity   # デプロイ先アカウントを確認

npx cdkd bootstrap         # 初回のみ（cdkd の状態保存用 S3 バケット）
npm run diff               # 変更内容の確認
npm run deploy             # フロントをビルドして cdkd でデプロイ（deploy-logs/ にログ）
```

- 出力の `SiteUrl` を開く（CloudFront の配信開始まで数分かかることがある）
- 「ログイン / 新規登録」→ メールの確認コード → ログイン → 1 件記録 → 成績表に出ることを確認
- 確認コードのメールは Cognito 標準の送信機能（1 日 50 通まで）。参加者が多い場合は Amazon SES の設定を検討する

## cdkd 検証シート（スライド 7 用）

| 操作 | コマンド | 所要時間 | 結果・気づき |
| --- | --- | --- | --- |
| 合成 | `npm run synth` | | 28 リソース（2026-11-14 時点、ローカルで確認済み） |
| 初回デプロイ | `npm run deploy` | | |
| 更新（フロントだけ変更） | `npm run deploy` | | |
| 更新（Lambda だけ変更） | `npm run deploy` | | |
| 安定化待ちなしの更新 | `npm run deploy:fast` | | |
| 差分 | `npm run diff` | | |
| 削除 | `npm run destroy` | | |
| 参考：CloudFormation | `npx cdk deploy`（要 `cdk bootstrap`） | | 比較する場合のみ |

所要時間は `deploy-logs/HISTORY.md` に自動で記録されます（ログ内のアカウント ID は `<ACCOUNT_ID>` に伏せ字）。

## イベント当日（11/20）

- [ ] 開始前に `SiteUrl` が開けること、成績表が読み込めることを確認
- [ ] スライドの最後に QR コード（`SiteUrl`）を表示
- [ ] 「ランダムな案件で始める」で 10 分ほど。記録したい人だけログイン
- [ ] クロージングで成績表の上位を紹介（任意）

## イベント後

```bash
# 記録とユーザーもまとめて削除する場合（任意）
npx cdkd deploy --all -c destroyData=true
npm run destroy
```

既定では、記録（DynamoDB テーブル）とユーザー（Cognito ユーザープール）は誤削除を防ぐために残ります。
残った場合は、AWS マネジメントコンソールから削除してください。

## ローカルでの確認

```bash
npm run dev    # http://localhost:8000
```

ローカルでは商談の体験・結果表示まで確認できます（記録・成績表は API がないため使えません）。
デプロイ済みの環境でログインまで試す場合は、`-c allowLocalhost=true` でデプロイし、デプロイ済みの `config.json` を `web/public/` に置いてから `npm run dev` を実行します。

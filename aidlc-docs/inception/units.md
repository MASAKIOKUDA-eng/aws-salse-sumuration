# Units Generation

| Unit | 内容 | 主なファイル |
| --- | --- | --- |
| U1 商談エンジン | シナリオ定義・条件生成・入力検証・採点・模範解答の探索 | `shared/scenarios.ts`, `shared/engine.ts` |
| U2 API | Function URL ハンドラー、入力検証、トークン検証、DynamoDB 読み書き | `api/handler.ts` |
| U3 フロントエンド | 画面（案件一覧・商談・結果・営業の基本・成績表・記録）、ログイン、API 呼び出し | `web/` |
| U4 インフラ | CDK スタック（S3, CloudFront, Lambda, DynamoDB, Cognito）。WAF なし | `bin/app.ts`, `lib/deal-room-stack.ts` |
| U5 資料 | 登壇資料のための概要・ソリューション説明・強み・当日手順・英語台本 | `docs/` |

依存関係：U1 ← U2, U3 ／ U4 は U2, U3 の成果物をデプロイする ／ U5 は U1〜U4 を説明する。

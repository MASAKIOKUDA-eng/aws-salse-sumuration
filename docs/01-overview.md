# 01. 登壇資料のための概要

## イベント

| 項目 | 内容 |
| --- | --- |
| イベント | 彩の国さいたま支部 × JAWS-UG Sales 支部 English LT Night |
| 日時 | 2026-11-20（金）19:00〜20:45（オンライン） |
| 形式 | 英語 LT（5 分）。日本語まじり・スライドのみ英語も可 |
| ページ | https://jawsug-sales.connpass.com/event/409542/ |
| ハッシュタグ | #jawsug_sainokuni #jawsug_sales |

## 登壇タイトル

**Developing a sales simulation application as a way to also verify cdkd's functionality**

（日本語の副題案：営業シミュレーターを作りながら、cdkd の実力を確かめる）

## 一言でいうと

> AWS ソリューション営業を「判断の連続」として体験できる Web アプリ **Deal Room** を、
> AI-DLC で設計し、cdkd（CloudFormation を使わない CDK デプロイツール）でデプロイした。
> アプリづくりそのものを、cdkd が実際のサーバーレス構成をどこまで扱えるかの検証にした。

## 聞き手（Sales 支部・彩の国支部の参加者）に持ち帰ってほしいこと

1. **営業の人へ**：AWS 営業の基本（聞く → 課題を言葉にする → 身の丈の提案 → 根拠で反論に答える → 次の一歩を一緒に決める）は、ゲームにすると 10 分で体験できる
2. **エンジニアの人へ**：cdkd を使うと、Cognito・CloudFront・Lambda・DynamoDB を含む構成を、CloudFormation スタックなしで短時間にデプロイ・削除できる。イベント用の「使い捨て環境」と相性が良い
3. **両方へ**：AI-DLC で要件 → 設計 → 実装 → テストの記録を残しながら、短期間で形にできた

## 5 分 LT の構成案（スライド 8〜9 枚）

| # | 時間 | スライド | 話すこと |
| --- | --- | --- | --- |
| 1 | 0:00 | タイトル | 自己紹介・タイトル |
| 2 | 0:20 | Why | 営業の「判断」は座学では身につかない／cdkd を実案件に近い構成で試したかった |
| 3 | 0:50 | What：Deal Room | 架空の顧客 4 社 × 条件。調査 → ヒアリング → 提案 → 見積 → 反論 → クロージングの 10 判断 |
| 4 | 1:30 | デモ（画面キャプチャ 2〜3 枚） | 案件シート（未確認の項目が聞くと埋まる）→ 提案構成と予算メーター → 案件クローズ報告書 |
| 5 | 2:30 | How we score | 顧客理解 25%・提案の適合 30%・経済性 20%・信頼構築 25%。ランダムに選ぶと受注率は約 8% |
| 6 | 3:00 | Architecture | CloudFront + S3 + Lambda Function URL（OAC）+ DynamoDB + Cognito。WAF なし（理由つき） |
| 7 | 3:40 | cdkd で検証したこと | 28 リソース・カスタムリソース・アセットを cdkd で synth / deploy / diff / destroy。所要時間 |
| 8 | 4:20 | AI-DLC | 要件・ADR・テスト結果を `aidlc-docs/` に残した |
| 9 | 4:40 | Try it / Thanks | QR コードで URL を共有 → イベント中に遊んでもらう → 成績表 |

英語の台本は [05-lt-script-en.md](05-lt-script-en.md) を参照してください。

## スライドに載せる数字（確定値・未確定値）

| 数字 | 値 | 出典 |
| --- | --- | --- |
| リソース数 | 28（`cdkd synth` の結果） | [aidlc-docs/construction/build-and-test.md](../aidlc-docs/construction/build-and-test.md) |
| テスト | 22 件すべて成功 | 同上 |
| 最適な判断の得点 | 全 216 条件で 96〜100 点 | `npm run balance` |
| ランダムな判断 | 中央値 54〜56 点、受注率 6〜10% | `npm run balance` |
| 月額（WAF なし） | 小規模利用ではほぼ 0 USD（無料利用枠内） | [02-solution.md](02-solution.md) |
| 初回デプロイ時間 | **（デプロイ後に記入）** | `deploy-logs/HISTORY.md` |
| 更新デプロイ時間 | **（デプロイ後に記入）** | 同上 |
| 削除時間 | **（デプロイ後に記入）** | `npm run destroy` の出力 |

## 当日までの ToDo

- [ ] AWS アカウントでデプロイし、上の表の時間を埋める（手順：[04-event-runbook.md](04-event-runbook.md)）
- [ ] 画面キャプチャ（ホーム／案件シート／提案構成／案件クローズ報告書／成績表）を撮る
- [ ] 公開 URL の QR コードを作る
- [ ] イベント後に `npm run destroy` で削除する

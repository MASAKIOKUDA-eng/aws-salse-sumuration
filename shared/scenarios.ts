/**
 * 商談シナリオの定義（文章と採点用の重み）。
 * ブラウザと Lambda の両方で読み込むため、DOM や Node 固有の API は使わない。
 *
 * 登場する企業・人物はすべて架空です。AWS のサービス名は学習のために使っていますが、
 * 評価の重みは「考え方」を学ぶための簡略モデルであり、AWS の公式見解ではありません。
 */

export const SCENARIO_IDS = ['retail', 'manufacturing', 'saas', 'finance'] as const;
export type ScenarioId = (typeof SCENARIO_IDS)[number];

export const STANCES = ['cto', 'cfo', 'ceo'] as const;
export type Stance = (typeof STANCES)[number];

export const BUDGETS = ['tight', 'normal', 'ample'] as const;
export type Budget = (typeof BUDGETS)[number];

export const COMPETITORS = ['none', 'onprem', 'othercloud'] as const;
export type Competitor = (typeof COMPETITORS)[number];

export const URGENCIES = ['low', 'high'] as const;
export type Urgency = (typeof URGENCIES)[number];

export const RESEARCH_IDS = ['ir', 'hiring', 'vendor', 'case'] as const;
export type ResearchId = (typeof RESEARCH_IDS)[number];

export const TEAM_IDS = ['sa', 'partner', 'specialist', 'proserve'] as const;
export type TeamId = (typeof TEAM_IDS)[number];

export const QUESTION_IDS = ['goal', 'pain', 'budget', 'decision', 'timeline', 'constraint'] as const;
export type QuestionId = (typeof QUESTION_IDS)[number];

export const PROBLEM_IDS = ['a', 'b', 'c', 'd'] as const;
export type ProblemId = (typeof PROBLEM_IDS)[number];

export const APPROACH_IDS = ['poc', 'phased', 'bigbang', 'workshop'] as const;
export type ApproachId = (typeof APPROACH_IDS)[number];

export const PRICING_IDS = ['ondemand', 'savings', 'funding', 'discount'] as const;
export type PricingId = (typeof PRICING_IDS)[number];

export const CLOSE_IDS = ['wait', 'exec', 'map', 'pressure'] as const;
export type CloseId = (typeof CLOSE_IDS)[number];

export const OBJECTION_IDS = ['security', 'price', 'onprem', 'skills', 'lockin', 'outage'] as const;
export type ObjectionId = (typeof OBJECTION_IDS)[number];

export const RESPONSE_IDS = ['a', 'b', 'c', 'd'] as const;
export type ResponseId = (typeof RESPONSE_IDS)[number];

// ---------- サービスカタログ ----------

export const SERVICE_IDS = [
  'ec2',
  'ecs',
  'lambda',
  'aurora',
  'dynamodb',
  's3',
  'cloudfront',
  'iot',
  'athena',
  'quicksight',
  'bedrock',
  'sagemaker',
  'dms',
  'backup',
  'controltower',
  'guardduty',
  'connect',
  'workspaces',
] as const;
export type ServiceId = (typeof SERVICE_IDS)[number];

export interface ServiceInfo {
  name: string;
  category: string;
  /** 月額の重さ（1〜4）。予算との比較に使う簡略値 */
  cost: number;
  summary: string;
}

export const SERVICES: Record<ServiceId, ServiceInfo> = {
  ec2: { name: 'Amazon EC2 + Auto Scaling', category: 'コンピューティング', cost: 3, summary: '仮想サーバー。台数を負荷に合わせて自動で増減できる' },
  ecs: { name: 'Amazon ECS on AWS Fargate', category: 'コンピューティング', cost: 3, summary: 'サーバー管理なしでコンテナを動かす' },
  lambda: { name: 'AWS Lambda', category: 'コンピューティング', cost: 1, summary: 'イベントで動くサーバーレス関数。使った分だけ課金' },
  aurora: { name: 'Amazon Aurora', category: 'データベース', cost: 4, summary: 'MySQL / PostgreSQL 互換のマネージド RDB' },
  dynamodb: { name: 'Amazon DynamoDB', category: 'データベース', cost: 2, summary: 'キーバリュー型のサーバーレス DB' },
  s3: { name: 'Amazon S3', category: 'ストレージ', cost: 1, summary: '容量無制限のオブジェクトストレージ。データレイクの土台' },
  cloudfront: { name: 'Amazon CloudFront', category: 'ネットワーク', cost: 2, summary: 'CDN。アクセス集中を世界中のエッジで受け止める' },
  iot: { name: 'AWS IoT Core / IoT SiteWise', category: 'IoT', cost: 3, summary: '設備・センサーのデータを安全に収集する' },
  athena: { name: 'Amazon Athena + AWS Glue', category: '分析', cost: 2, summary: 'S3 上のデータを SQL で直接分析する' },
  quicksight: { name: 'Amazon Quick Sight', category: '分析', cost: 2, summary: 'BI ダッシュボード' },
  bedrock: { name: 'Amazon Bedrock', category: '生成 AI', cost: 3, summary: '複数の基盤モデルを API で使える生成 AI 基盤' },
  sagemaker: { name: 'Amazon SageMaker AI', category: '機械学習', cost: 4, summary: '機械学習モデルの構築・学習・運用' },
  dms: { name: 'AWS DMS / Application Migration Service', category: '移行', cost: 2, summary: 'DB やサーバーを最小の停止時間で移行する' },
  backup: { name: 'AWS Backup', category: '運用', cost: 1, summary: 'バックアップを一元管理。別リージョンへの複製も可能' },
  controltower: { name: 'AWS Control Tower / Organizations', category: 'ガバナンス', cost: 1, summary: '複数アカウントの統制とガードレール' },
  guardduty: { name: 'Amazon GuardDuty', category: 'セキュリティ', cost: 1, summary: '脅威の検知。有効化するだけで使える' },
  connect: { name: 'Amazon Connect', category: 'コンタクトセンター', cost: 3, summary: 'クラウド型コンタクトセンター' },
  workspaces: { name: 'Amazon WorkSpaces', category: 'エンドユーザー', cost: 3, summary: '仮想デスクトップ' },
};

// ---------- 選択肢の共通ラベル ----------

export const RESEARCH_LABEL: Record<ResearchId, { name: string; note: string }> = {
  ir: { name: '決算資料・中期経営計画', note: '経営が何に投資しようとしているか' },
  hiring: { name: '採用ページ・技術ブログ', note: '使っている技術と、足りない人材' },
  vendor: { name: '既存ベンダー・契約状況', note: '今のシステムを誰が、いつまで支えるか' },
  case: { name: '同業他社の導入事例', note: '業界でよくある課題と成功パターン' },
};

export const TEAM_LABEL: Record<TeamId, { name: string; note: string }> = {
  sa: { name: 'ソリューションアーキテクト（SA）', note: '技術的な実現性を示し、構成を一緒に描く' },
  partner: { name: 'AWS パートナー（SI 企業）', note: '構築・運用を担い、顧客の手を動かす' },
  specialist: { name: 'スペシャリスト SA（IoT・AI・データ）', note: '特定分野の深い知見と事例' },
  proserve: { name: 'プロフェッショナルサービス', note: '大規模移行やガバナンス設計を直接支援' },
};

export const QUESTION_LABEL: Record<QuestionId, { name: string; frame: string }> = {
  goal: { name: '3 年後に、事業として何を実現したいですか', frame: 'ビジネスゴール' },
  pain: { name: 'いま一番困っていることは何ですか', frame: '課題（Pain）' },
  budget: { name: 'ご予算の考え方を教えてください', frame: '予算（Budget）' },
  decision: { name: 'どなたが、どう決めるのですか', frame: '意思決定（Authority / Decision Process）' },
  timeline: { name: 'いつまでに必要ですか', frame: '時期（Timeline）' },
  constraint: { name: '技術・規制の制約はありますか', frame: '制約（Constraints）' },
};

export const APPROACH_LABEL: Record<ApproachId, { name: string; note: string }> = {
  poc: { name: 'PoC（概念実証）から始める', note: '小さく試して効果を数字で確かめる' },
  phased: { name: '段階的な移行計画（移行支援プログラムを活用）', note: '評価 → 移行準備 → 移行の順に進める' },
  bigbang: { name: '全システムを一斉に移行する', note: '一度で切り替えて早く効果を出す' },
  workshop: { name: '体験型ワークショップで要件を固める', note: '顧客と一緒に短期間でプロトタイプを作る' },
};

export const PRICING_LABEL: Record<PricingId, { name: string; note: string }> = {
  ondemand: { name: 'オンデマンド料金で試算する', note: '使った分だけ。初期の約束なし' },
  savings: { name: 'Savings Plans / リザーブドで試算する', note: '1〜3 年の利用を約束して単価を下げる' },
  funding: { name: '移行支援・クレジット等の支援策を組み込む', note: '移行支援プログラムやスタートアップ支援を活用' },
  discount: { name: '大幅な値引きを社内に申請する', note: '他社との価格競争に備える' },
};

export const CLOSE_LABEL: Record<CloseId, { name: string; note: string }> = {
  wait: { name: '提案書を送って返事を待つ', note: '顧客の検討ペースを尊重する' },
  exec: { name: '意思決定者とのエグゼクティブ会議を設定する', note: '経営層に投資対効果を直接説明する' },
  map: { name: '顧客と「共同実行計画」を合意する', note: '成功条件・担当・期日を双方で書き出す' },
  pressure: { name: '今月中の契約を条件に値引きを迫る', note: '期限を切って即決を促す' },
};

export const STANCE_LABEL: Record<Stance, string> = {
  cto: '技術重視の情報システム責任者',
  cfo: '費用対効果に厳しい財務責任者',
  ceo: 'スピード重視の経営トップ',
};

export const BUDGET_LABEL: Record<Budget, string> = { tight: '厳しい', normal: '標準', ample: '余裕あり' };
export const COMPETITOR_LABEL: Record<Competitor, string> = {
  none: '競合なし',
  onprem: '既存 SIer がオンプレ更改を提案中',
  othercloud: '他社クラウドも比較検討中',
};
export const URGENCY_LABEL: Record<Urgency, string> = { low: '通常', high: '急ぎ' };

// ---------- 反論 ----------

export interface ObjectionInfo {
  title: string;
  line: string;
  responses: Record<ResponseId, { text: string; score: number; review: string }>;
}

export const OBJECTIONS: Record<ObjectionId, ObjectionInfo> = {
  security: {
    title: 'セキュリティへの不安',
    line: 'クラウドに大事なデータを置いて、本当に大丈夫なんですか？',
    responses: {
      a: { text: '責任共有モデルを説明し、第三者認証のレポート（AWS Artifact）と業界ガイドラインへの対応資料を示す', score: 100, review: '「誰が何を守るか」を整理し、第三者の証跡で答えたため、安心材料になりました。' },
      b: { text: '「世界最大のクラウドなので安全です」と言い切る', score: 15, review: '根拠のない断言は、慎重な相手ほど不信感につながります。' },
      c: { text: '顧客のセキュリティ担当者と SA を交えた勉強会を提案する', score: 75, review: '対話の場は作れましたが、その場で示せる根拠も用意しておくとさらに良くなります。' },
      d: { text: '値引きの話をして話題を変える', score: 0, review: '不安に答えず話題をそらしたため、信頼を失いました。' },
    },
  },
  price: {
    title: '他社クラウドとの価格比較',
    line: '他社クラウドの見積もりの方が 2 割安いんですよね。',
    responses: {
      a: { text: '単価ではなく、運用・移行・人件費を含めた総保有コスト（TCO）で比較し、現状の評価から始めることを提案する', score: 100, review: '比較の土俵を「総コストと価値」に移せたため、価格だけの勝負を避けられました。' },
      b: { text: 'その場で同じだけ値引きすると約束する', score: 25, review: '根拠のない値引きの約束は、社内承認も取れず、信頼と利益の両方を失います。' },
      c: { text: '他社クラウドの弱点を並べる', score: 5, review: '競合の批判は、顧客の選択を否定することになり逆効果です。' },
      d: { text: 'サイジングの最適化と長期利用割引を組み合わせた再試算を出す', score: 80, review: '具体的な数字で応えたのは良い対応です。TCO の視点も加えると万全でした。' },
    },
  },
  onprem: {
    title: 'オンプレ更改との比較',
    line: '今の SIer さんに頼めば、サーバーを入れ替えるだけで済むんですが。',
    responses: {
      a: { text: '5 年間の TCO（ハード更改・保守・人件費・機会損失）で比較した資料を出す', score: 100, review: '更改のたびに発生する費用と、止まったときの損失まで比べたことで、判断材料が揃いました。' },
      b: { text: '「クラウドの方が必ず安い」と言い切る', score: 10, review: 'ワークロードによってはオンプレの方が安いこともあります。断言は見抜かれます。' },
      c: { text: '既存の SIer に AWS パートナーとして加わってもらう体制を提案する', score: 85, review: '既存の関係を壊さずに済む提案は、顧客にとって安心です。' },
      d: { text: 'SIer を外して直接契約することを勧める', score: 5, review: '長年の取引先を否定されると、顧客は防御的になります。' },
    },
  },
  skills: {
    title: '人材・スキルの不足',
    line: 'うちにはクラウドが分かる人がいないんですよ。',
    responses: {
      a: { text: 'トレーニング（AWS Skill Builder など）とパートナーの伴走支援を組み合わせた育成計画を示す', score: 100, review: '「いない」を「育てる」に変える計画を示せたため、前に進める理由ができました。' },
      b: { text: '「マネージドサービスなので人は要りません」と答える', score: 20, review: '運用の手間は減っても、設計や判断をする人は必要です。過大な約束になりました。' },
      c: { text: 'すべてを外部に任せる体制を提案する', score: 50, review: '当面は回りますが、社内に知見が残らず、顧客の将来の不安は解消されません。' },
      d: { text: '人材の話は契約後に考えましょうと答える', score: 0, review: '不安を先送りしたため、検討そのものが止まってしまいました。' },
    },
  },
  lockin: {
    title: 'ベンダーロックインへの懸念',
    line: '一度 AWS にしたら、もう抜けられなくなりませんか？',
    responses: {
      a: { text: 'コンテナやオープンソース互換の DB など、移植しやすい技術を選べることを説明する', score: 85, review: '技術的な選択肢を示せました。移行コストとの比較もあればさらに説得力が増します。' },
      b: { text: '「ロックインは気にしなくて大丈夫です」と答える', score: 10, review: '懸念を軽く扱うと、顧客は「都合の悪い話を隠している」と感じます。' },
      c: { text: 'すべてをマルチクラウドで作ることを提案する', score: 30, review: '複雑さと費用が増え、顧客の本来の目的から遠ざかります。' },
      d: { text: 'マネージドサービスで得られる開発速度と、将来の移行コストを比べて判断材料を出す', score: 100, review: 'ロックインを「避けるもの」ではなく「価値とのトレードオフ」として整理できました。' },
    },
  },
  outage: {
    title: '障害時の不安',
    line: 'もしクラウドが止まったら、うちの店も止まりますよね？',
    responses: {
      a: { text: '複数のアベイラビリティーゾーンにまたがる設計と、サポートプランの体制を説明する', score: 100, review: '「止まらない作り」と「止まったときの体制」を分けて説明でき、安心感を与えました。' },
      b: { text: '「AWS は止まりません」と言い切る', score: 5, review: 'どんなシステムにも障害はあります。設計で備えることを説明すべきでした。' },
      c: { text: '過去の障害時の対応事例を紹介し、設計レビューを提案する', score: 80, review: '具体的な事例は効果的です。設計上の備えも合わせて示すとより良くなります。' },
      d: { text: '障害の話題は避ける', score: 0, review: '顧客の一番の不安に答えませんでした。' },
    },
  },
};

// ---------- シナリオ ----------

export interface ScenarioInfo {
  company: string;
  industry: string;
  employees: string;
  summary: string;
  /** 決裁者（立場ごと） */
  contacts: Record<Stance, { name: string; title: string }>;
  research: Record<ResearchId, string>;
  answers: Record<QuestionId, string>;
  problems: Record<ProblemId, { text: string; score: number }>;
  /** サービスの適合。core は「どれか 1 つ」でよいグループの並び */
  core: ServiceId[][];
  good: ServiceId[];
  coreLabels: string[];
  /** 年間の利用見込み（万円） */
  baseArr: number;
  weights: {
    research: Record<ResearchId, number>;
    team: Record<TeamId, number>;
    approach: Record<ApproachId, number>;
    pricing: Record<PricingId, number>;
  };
  /** シナリオ固有の反論（競合の反論と合わせて 2 つ出題する） */
  objections: ObjectionId[];
}

export const SCENARIOS: Record<ScenarioId, ScenarioInfo> = {
  retail: {
    company: 'まるやまストア株式会社',
    industry: '小売（地域スーパー 42 店舗 + ネットスーパー）',
    employees: '従業員 1,800 名',
    summary: 'ネットスーパーの売上が伸びる一方、自社データセンターのサーバーは 5 年目。年末商戦に向けて「何とかしたい」と問い合わせがあった。',
    contacts: {
      cto: { name: '丸山 浩二', title: '情報システム部 部長' },
      cfo: { name: '河合 典子', title: '取締役 経営企画部長' },
      ceo: { name: '丸山 誠一', title: '代表取締役社長' },
    },
    research: {
      ir: '中期経営計画で「ネットスーパー売上を 3 年で 2 倍」を掲げている。',
      hiring: 'EC エンジニアを 1 名募集中。社内の開発者は 3 名と少ない。',
      vendor: '既存 SI 企業との保守契約が来年 3 月で満了。ハードウェアの保守期限も同時期。',
      case: '同業では、セール時の負荷対策を機にクラウドへ段階移行した例が多い。',
    },
    answers: {
      goal: '「ネットの売上を倍にしたい。店舗と同じくらい頼れる売り場にしたい」',
      pain: '「昨年の年末セールでサイトが 3 時間止まった。あの日だけで数千万円の機会損失だった」',
      budget: '「サーバー更改に積んでいた予算の範囲で何とかしたい」',
      decision: '「最終的には社長が決めるが、経営会議で費用対効果を説明する必要がある」',
      timeline: '「次の年末商戦までに、少なくとも EC は安定させたい」',
      constraint: '「基幹の POS はすぐには触れない。まずは EC 周りから」',
    },
    problems: {
      a: { text: 'サーバーが古く、保守期限が近いこと', score: 50 },
      b: { text: 'セール時のアクセス集中で EC が止まり、売上の機会を失っていること', score: 100 },
      c: { text: '社内の開発者が少ないこと', score: 25 },
      d: { text: 'まだクラウドを使っていないこと', score: 0 },
    },
    core: [['ec2', 'ecs'], ['aurora', 'dynamodb'], ['cloudfront']],
    good: ['dms', 'backup', 's3'],
    coreLabels: ['負荷に合わせて伸び縮みするアプリ基盤', 'マネージドなデータベース', 'アクセス集中を受け止める CDN'],
    baseArr: 1800,
    weights: {
      research: { ir: 100, hiring: 40, vendor: 90, case: 60 },
      team: { sa: 50, partner: 55, specialist: 10, proserve: 25 },
      approach: { poc: 55, phased: 100, bigbang: 30, workshop: 65 },
      pricing: { ondemand: 45, savings: 80, funding: 100, discount: 40 },
    },
    objections: ['outage', 'skills'],
  },
  manufacturing: {
    company: '東和精機株式会社',
    industry: '製造業（工作機械部品・国内 3 工場）',
    employees: '従業員 950 名',
    summary: '設備の突発停止が増え、保全担当の経験に頼った運用が限界に近い。展示会で IoT の話を聞いた生産技術部から相談が来た。',
    contacts: {
      cto: { name: '東 和也', title: '生産技術部 部長' },
      cfo: { name: '岡本 里美', title: '管理本部長 兼 CFO' },
      ceo: { name: '東 正之', title: '代表取締役社長' },
    },
    research: {
      ir: '設備投資を抑えつつ、稼働率を上げることを経営課題に挙げている。',
      hiring: 'データ分析の経験者を募集しているが、半年以上埋まっていない。',
      vendor: '工場の制御系（OT）は設備メーカーが保守。社内ネットワークとは分離している。',
      case: '同業では、まず 1 ラインのセンサーデータを集めて「停止の予兆」を見える化した例がある。',
    },
    answers: {
      goal: '「止まらない工場にして、納期遅れをなくしたい」',
      pain: '「主軸のベアリングが突然壊れて、ラインが 2 日止まった。原因が分かっていない」',
      budget: '「まずは小さく試して、効果が出たら本予算を取りたい」',
      decision: '「工場長と私で決めて、金額が大きければ取締役会にかける」',
      timeline: '「来期の予算申請（2 月）までに効果を示したい」',
      constraint: '「工場の制御ネットワークを外につなぐのは、設備メーカーとの調整が必要」',
    },
    problems: {
      a: { text: '紙の点検記録が多く、事務作業が多いこと', score: 25 },
      b: { text: 'データ分析の人材がいないこと', score: 40 },
      c: { text: '設備の状態データが集まっておらず、停止の予兆をつかめないこと', score: 100 },
      d: { text: '工場が 3 か所に分かれていること', score: 0 },
    },
    core: [['iot'], ['s3'], ['athena', 'quicksight']],
    good: ['quicksight', 'sagemaker', 'guardduty'],
    coreLabels: ['設備データの収集', 'データを貯める土台', '見える化と分析'],
    baseArr: 1200,
    weights: {
      research: { ir: 55, hiring: 45, vendor: 90, case: 100 },
      team: { sa: 40, partner: 45, specialist: 60, proserve: 20 },
      approach: { poc: 100, phased: 55, bigbang: 5, workshop: 85 },
      pricing: { ondemand: 85, savings: 35, funding: 80, discount: 30 },
    },
    objections: ['skills', 'security'],
  },
  saas: {
    company: '株式会社ルクシード',
    industry: 'SaaS スタートアップ（人事評価クラウド）',
    employees: '従業員 60 名・シリーズ A',
    summary: '顧客数は順調に増えているが、インフラ費が売上より速く伸びている。投資家からは「生成 AI 機能」で差別化するよう求められている。',
    contacts: {
      cto: { name: '久保 陸', title: 'CTO' },
      cfo: { name: '林 沙織', title: 'CFO' },
      ceo: { name: '小田 光', title: '代表取締役 CEO' },
    },
    research: {
      ir: 'シリーズ A で資金調達。次の調達までに ARR を 3 倍にする計画と報じられている。',
      hiring: '技術ブログによると、仮想サーバーに手作業でデプロイしており、生成 AI の検証を始めたばかり。',
      vendor: '一部のサービスで他社クラウドも併用している。',
      case: '同規模の SaaS では、サーバーレス化で運用負荷と費用を同時に下げ、生成 AI 機能を短期間で出した例がある。',
    },
    answers: {
      goal: '「評価コメントを AI で下書きする機能を、半年以内に出したい」',
      pain: '「開発者 8 人のうち 2 人がインフラの面倒を見ていて、新機能が遅れている」',
      budget: '「調達した資金はなるべくプロダクト開発に使いたい」',
      decision: '「技術は CTO、お金は CFO。最後は CEO が 30 分で決める」',
      timeline: '「次の資金調達のピッチ（4 か月後）でデモしたい」',
      constraint: '「顧客の人事データを AI の学習に使われるのは絶対に困る」',
    },
    problems: {
      a: { text: 'インフラ運用に開発者を取られ、生成 AI などの新機能を出せていないこと', score: 100 },
      b: { text: 'クラウドの請求額が高いこと', score: 45 },
      c: { text: '他社クラウドと併用していること', score: 10 },
      d: { text: '社員数が少ないこと', score: 0 },
    },
    core: [['bedrock'], ['lambda', 'ecs'], ['dynamodb', 'aurora']],
    good: ['s3', 'cloudfront', 'guardduty'],
    coreLabels: ['生成 AI 基盤', '運用の要らないアプリ基盤', 'マネージドなデータベース'],
    baseArr: 2400,
    weights: {
      research: { ir: 45, hiring: 100, vendor: 35, case: 90 },
      team: { sa: 50, partner: 10, specialist: 60, proserve: 15 },
      approach: { poc: 85, phased: 50, bigbang: 35, workshop: 100 },
      pricing: { ondemand: 55, savings: 65, funding: 100, discount: 30 },
    },
    objections: ['lockin', 'security'],
  },
  finance: {
    company: 'さくら台信用金庫',
    industry: '金融（地域の信用金庫・28 店舗）',
    employees: '職員 720 名',
    summary: '大規模災害への備えが監督当局から求められている。勘定系は共同センターだが、営業店支援や融資の周辺システムは自前で、バックアップは本部の地下にある。',
    contacts: {
      cto: { name: '桜井 信也', title: 'システム部 部長' },
      cfo: { name: '大西 美和', title: '常務理事（総合企画担当）' },
      ceo: { name: '佐倉 忠司', title: '理事長' },
    },
    research: {
      ir: 'ディスクロージャー誌で「業務継続体制の強化」と「DX 人材の育成」を重点施策に挙げている。',
      hiring: 'システム部は 12 名。採用情報に技術的な記載はほとんどない。',
      vendor: '周辺システムの保守ベンダーが 6 社に分かれ、構成を把握しきれていない。',
      case: '他の金融機関では、金融業界の安全対策基準への対応を整理したうえで、災害対策から段階的にクラウドを使い始めた例がある。',
    },
    answers: {
      goal: '「災害があっても地域のお客さまへの営業を止めない金庫にしたい」',
      pain: '「バックアップが本部と同じ建物にある。本部が被災したら復旧できない」',
      budget: '「単年度の予算主義なので、毎年の費用が読めることが大事」',
      decision: '「システム部で起案し、常務会と理事会で承認する。監督当局への説明も必要」',
      timeline: '「来年度の検査までに方針を固めたい」',
      constraint: '「金融業界の安全対策基準に沿っていることを説明できないと進められない」',
    },
    problems: {
      a: { text: '職員の IT スキルが不足していること', score: 20 },
      b: { text: '保守ベンダーが多すぎること', score: 45 },
      c: { text: '店舗の端末が古いこと', score: 0 },
      d: { text: '本部が被災するとデータを復旧できず、業務を継続できないこと', score: 100 },
    },
    core: [['backup'], ['controltower'], ['guardduty']],
    good: ['s3', 'ec2', 'dms'],
    coreLabels: ['遠隔地へのバックアップ', '統制の効いたアカウント設計', '脅威の検知'],
    baseArr: 3000,
    weights: {
      research: { ir: 100, hiring: 20, vendor: 65, case: 95 },
      team: { sa: 45, partner: 30, specialist: 10, proserve: 60 },
      approach: { poc: 65, phased: 100, bigbang: 5, workshop: 70 },
      pricing: { ondemand: 35, savings: 100, funding: 75, discount: 45 },
    },
    objections: ['security', 'skills'],
  },
};

import type { Lang } from '../../shared/engine';

/** 「営業の基本」ページ。シミュレーターの各判断の背景にある考え方をまとめる */
export function learnPage(lang: Lang = 'ja'): string {
  return lang === 'en' ? LEARN_EN : LEARN_JA;
}

const LEARN_JA = learnJa();

function learnJa(): string {
  return `<article class="prose">
  <div class="label">Field Guide</div>
  <h1>AWS ソリューション営業の基本</h1>
  <p>このシミュレーターの判断は、クラウドのソリューション営業でよく使われる考え方をもとにしています。
    ここでは、その考え方を短くまとめます。内容は学習用に簡略化したもので、AWS の公式な営業手法の説明ではありません。</p>

  <h2>1. 誰が何をするか</h2>
  <dl>
    <dt>アカウントマネージャー</dt><dd>顧客との関係と商談全体の責任者。顧客の事業を理解し、社内外のメンバーを集めて提案をまとめる。このゲームでのあなたの役割です。</dd>
    <dt>ソリューションアーキテクト</dt><dd>技術面のパートナー。顧客の要件から構成を描き、実現できることを示す。</dd>
    <dt>スペシャリスト</dt><dd>IoT・生成 AI・データ分析などの特定分野に深い知見を持ち、専門的な事例や検証を支える。</dd>
    <dt>AWS パートナー</dt><dd>構築・運用・移行を担う SI 企業など。顧客の手を動かし、長く伴走する存在。</dd>
    <dt>プロフェッショナルサービス</dt><dd>大規模な移行やガバナンス設計などを、顧客と直接取り組む支援チーム。</dd>
  </dl>

  <h2>2. 聞く：ヒアリングの型</h2>
  <p>基本の型は <strong>BANT</strong>（Budget 予算・Authority 決裁者・Need ニーズ・Timeline 時期）です。
    大きな商談では、評価の指標・決裁の基準とプロセス・課題・社内の推進者・競合まで確かめる <strong>MEDDICC</strong> もよく使われます。</p>
  <p>大切なのは、すべてを聞くことではなく、<strong>この顧客の判断を左右する情報</strong>から聞くことです。費用に厳しい決裁者なら決め方を、急ぎの案件なら期限を先に確かめます。</p>

  <h2>3. 課題を言葉にする</h2>
  <p>「サーバーが古い」「人が足りない」は症状です。提案の起点になるのは、それによって<strong>事業に何が起きているか</strong>（売上の機会損失、稼働率の低下、事業継続のリスク）です。
    決裁者は技術ではなく事業の言葉で判断します。</p>

  <h2>4. 提案する：身の丈に合った構成と進め方</h2>
  <p>まず課題を解くのに欠かせない部品を揃え、次に運用や移行を楽にする部品を足します。関係の薄いサービスを並べると、提案の焦点がぼやけ、費用も膨らみます。</p>
  <dl>
    <dt>AWS Well-Architected</dt><dd>運用・セキュリティ・信頼性・パフォーマンス・コスト・持続可能性の 6 つの柱で構成を見直すためのフレームワーク。</dd>
    <dt>PoC・ワークショップ</dt><dd>新しい取り組みは、小さく試して効果を数字で示すと承認されやすくなる。</dd>
    <dt>段階的な移行</dt><dd>既存システムの移行は、評価 → 移行準備 → 移行の順に計画を立てる。AWS には移行を支援するプログラム（Migration Acceleration Program など）がある。</dd>
  </dl>

  <h2>5. 費用：値引きの前にできること</h2>
  <dl>
    <dt>オンデマンド</dt><dd>使った分だけの料金。使い方が固まっていない段階に向く。</dd>
    <dt>Savings Plans・リザーブド</dt><dd>1 年または 3 年の利用を約束して単価を下げる。利用量が読める安定したワークロードに向く。</dd>
    <dt>支援策</dt><dd>移行の支援プログラムや、スタートアップ向けのクレジット（AWS Activate）など。対象や条件は時期によって変わるため、必ず最新の情報を確認する。</dd>
    <dt>TCO（総保有コスト）</dt><dd>単価ではなく、運用・保守・人件費・ハードウェア更改・停止時の損失まで含めて比べる考え方。</dd>
  </dl>

  <h2>6. 反論に答える</h2>
  <p>反論は関心があるサインです。否定や断言で押し切らず、懸念を受け止めて、<strong>根拠のある情報</strong>と<strong>次の一歩</strong>で応えます。</p>
  <dl>
    <dt>セキュリティ</dt><dd><strong>責任共有モデル</strong>（クラウド「の」セキュリティは AWS、クラウド「における」セキュリティは利用者）を整理し、第三者認証のレポート（AWS Artifact で入手できる）や業界ガイドラインへの対応資料を示す。</dd>
    <dt>人材不足</dt><dd>トレーニング（AWS Skill Builder など）とパートナーの伴走を組み合わせ、「いない」を「育てる」計画に変える。</dd>
    <dt>価格比較</dt><dd>単価ではなく TCO と価値の比較に土俵を移す。競合の批判はしない。</dd>
    <dt>ロックイン</dt><dd>移植しやすい技術の選択肢を示しつつ、マネージドサービスで得られる開発速度と将来の移行コストを比べて判断材料を出す。</dd>
  </dl>

  <h2>7. クロージング</h2>
  <p>受注は顧客が決めるものです。誰が・いつまでに・何を確かめれば決められるかを、顧客と一緒に書き出す<strong>共同実行計画（Mutual Action Plan）</strong>は、商談の主導権を保ちながら顧客の意思決定を助けます。
    経営トップが決める会社なら、エグゼクティブ同士の対話の場を作るのが近道です。</p>

  <p class="muted small" style="margin-top:2em">サービス名・プログラム名は 2026 年 11 月時点の公開情報をもとにしています。最新の内容は AWS の公式サイトで確認してください。</p>
  <p><a class="btn" href="#/">案件を選ぶ</a></p>
  </article>`;
}

const LEARN_EN = `<article class="prose">
  <div class="label">Field Guide</div>
  <h1>AWS Solution Sales Basics</h1>
  <p>The decisions in this simulator are based on ideas commonly used in cloud solution sales.
    This page summarizes them briefly. It is simplified for learning and is not a description of AWS’s official sales methodology.</p>

  <h2>1. Who does what</h2>
  <dl>
    <dt>Account Manager</dt><dd>Owns the customer relationship and the whole deal. Understands the customer’s business and brings people together inside and outside AWS to shape the proposal. This is your role in the game.</dd>
    <dt>Solutions Architect</dt><dd>The technical partner. Turns the customer’s requirements into an architecture and shows what is possible.</dd>
    <dt>Specialist</dt><dd>Brings deep knowledge of a specific field such as IoT, generative AI or analytics, and backs it with references and proofs of concept.</dd>
    <dt>AWS Partner</dt><dd>Systems integrators and others who build, run and migrate systems. They work hands-on for the customer and stay with them for the long run.</dd>
    <dt>Professional Services</dt><dd>A team that works directly with the customer on large migrations, governance design and similar efforts.</dd>
  </dl>

  <h2>2. Listen: a framework for discovery</h2>
  <p>The basic framework is <strong>BANT</strong> (Budget, Authority, Need, Timeline).
    For larger deals, <strong>MEDDICC</strong> is also common: it covers metrics, the decision criteria and process, the pain, an internal champion and the competition.</p>
  <p>What matters is not asking everything, but asking first about <strong>what will drive this customer’s decision</strong>. With a cost-conscious decision maker, ask how they decide; on an urgent deal, confirm the deadline first.</p>

  <h2>3. Put the problem into words</h2>
  <p>“The servers are old” and “we don’t have enough people” are symptoms. A proposal starts from <strong>what that does to the business</strong>: lost sales, lower utilization, risk to business continuity.
    Decision makers judge in business terms, not technical ones.</p>

  <h2>4. Propose: a right-sized solution and approach</h2>
  <p>First assemble the pieces the problem cannot be solved without, then add pieces that make operations and migration easier. Listing unrelated services blurs the focus of the proposal and inflates the cost.</p>
  <dl>
    <dt>AWS Well-Architected</dt><dd>A framework for reviewing an architecture against six pillars: operational excellence, security, reliability, performance efficiency, cost optimization and sustainability.</dd>
    <dt>PoCs and workshops</dt><dd>New initiatives get approved more easily when you try them small and show the value in numbers.</dd>
    <dt>Phased migration</dt><dd>Plan migrations of existing systems in the order assess → mobilize → migrate. AWS has programs that support migrations (such as the Migration Acceleration Program).</dd>
  </dl>

  <h2>5. Pricing: what to do before discounting</h2>
  <dl>
    <dt>On-Demand</dt><dd>Pay only for what you use. Suits the stage when usage is not yet clear.</dd>
    <dt>Savings Plans and Reserved</dt><dd>Commit to one or three years of usage for a lower rate. Suits stable workloads with predictable usage.</dd>
    <dt>Programs</dt><dd>Migration support programs and startup credits (AWS Activate), among others. Eligibility and terms change over time, so always check the latest information.</dd>
    <dt>TCO (total cost of ownership)</dt><dd>Compare not unit prices but everything: operations, maintenance, staff, hardware refreshes and the cost of downtime.</dd>
  </dl>

  <h2>6. Answer objections</h2>
  <p>An objection is a sign of interest. Don’t deny it or overpower it; acknowledge the concern and answer with <strong>evidence</strong> and a <strong>next step</strong>.</p>
  <dl>
    <dt>Security</dt><dd>Explain the <strong>shared responsibility model</strong> (AWS is responsible for security <em>of</em> the cloud; the customer for security <em>in</em> the cloud), and show third-party audit reports (available in AWS Artifact) and material on meeting industry guidelines.</dd>
    <dt>Lack of skills</dt><dd>Combine training (such as AWS Skill Builder) with partner support, turning “we don’t have anyone” into a plan to grow people.</dd>
    <dt>Price comparisons</dt><dd>Move the comparison from unit prices to TCO and value. Don’t criticize competitors.</dd>
    <dt>Lock-in</dt><dd>Show portable technology options, and compare the development speed gained from managed services with the future cost of moving, so the customer can decide.</dd>
  </dl>

  <h2>7. Closing</h2>
  <p>The customer is the one who decides to buy. A <strong>mutual action plan</strong> — writing down together who needs to confirm what, and by when — helps the customer decide while keeping you in control of the deal.
    If the chief executive makes the call, creating a conversation between executives is the shortest path.</p>

  <p class="muted small" style="margin-top:2em">Service and program names are based on public information as of November 2026. Check the official AWS website for the latest details.</p>
  <p><a class="btn" href="#/">Choose a lead</a></p>
  </article>`;

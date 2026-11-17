/**
 * 商談シミュレーションエンジン。ブラウザと Lambda でまったく同じコードを使う。
 * サーバーは保存時にこのエンジンで結果を計算し直すため、ブラウザから送られた点数は信用しない。
 */
import {
  APPROACH_IDS,
  type ApproachId,
  BUDGETS,
  type Budget,
  CLOSE_IDS,
  COMPETITORS,
  type CloseId,
  type Competitor,
  OBJECTIONS,
  type ObjectionId,
  PRICING_IDS,
  PROBLEM_IDS,
  type PricingId,
  type ProblemId,
  QUESTION_IDS,
  type QuestionId,
  RESEARCH_IDS,
  RESPONSE_IDS,
  type ResearchId,
  type ResponseId,
  SCENARIOS,
  SCENARIO_IDS,
  SERVICES,
  SERVICE_IDS,
  STANCES,
  type ScenarioId,
  type ServiceId,
  type Stance,
  TEAM_IDS,
  type TeamId,
  URGENCIES,
  type Urgency,
} from './scenarios';
import { type Lang, content } from './content';

export * from './scenarios';
export * from './content';

// ---------- 条件 ----------

export interface Conditions {
  scenario: ScenarioId;
  stance: Stance;
  budget: Budget;
  competitor: Competitor;
  urgency: Urgency;
}

export interface Decisions {
  research: ResearchId[]; // 2 つ
  team: TeamId[]; // 2 つ
  questions: QuestionId[]; // 3 つ
  problem: ProblemId;
  services: ServiceId[]; // 1〜5 つ
  approach: ApproachId;
  pricing: PricingId;
  responses: ResponseId[]; // 反論 2 つへの対応
  close: CloseId;
}

export const PICK = { research: 2, team: 2, questions: 3, servicesMax: 5, responses: 2 } as const;

export const SEED_MAX = 2_147_483_646;

/** 乱数（mulberry32）。シードが同じなら同じ並びになる */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = <T>(r: () => number, list: readonly T[]): T => list[Math.floor(r() * list.length)];

export function randomSeed(): number {
  return 1 + Math.floor(Math.random() * SEED_MAX);
}

export function validateSeed(v: unknown): v is number {
  return typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= SEED_MAX;
}

export function conditionsFromSeed(seed: number): Conditions {
  const r = rng(seed);
  return {
    scenario: pick(r, SCENARIO_IDS),
    stance: pick(r, STANCES),
    budget: pick(r, BUDGETS),
    competitor: pick(r, COMPETITORS),
    urgency: pick(r, URGENCIES),
  };
}

/** 決まったシナリオで始めたいとき（イベントの出題など）に、条件に合うシードを探す */
export function seedForScenario(scenario: ScenarioId, from = randomSeed()): number {
  let s = from;
  for (let i = 0; i < 10_000; i++) {
    if (conditionsFromSeed(s).scenario === scenario) return s;
    s = (s % SEED_MAX) + 1;
  }
  return from;
}

/** 出題される反論 2 つ。競合があれば競合由来の反論が先に来る */
export function objectionsFor(c: Conditions): [ObjectionId, ObjectionId] {
  const list: ObjectionId[] = [];
  if (c.competitor === 'onprem') list.push('onprem');
  if (c.competitor === 'othercloud') list.push('price');
  for (const o of SCENARIOS[c.scenario].objections) if (!list.includes(o)) list.push(o);
  return [list[0], list[1]];
}

/** 予算の上限（サービスの重さの合計） */
export function budgetCap(b: Budget): number {
  return b === 'tight' ? 8 : b === 'normal' ? 11 : 14;
}

export function costOf(services: readonly ServiceId[]): number {
  return services.reduce((sum, s) => sum + SERVICES[s].cost, 0);
}

// ---------- 入力検証 ----------

type Validation<T> = { ok: true; value: T } | { ok: false; error: string };

function pickMany<T extends string>(v: unknown, allowed: readonly T[], min: number, max: number): T[] | null {
  if (!Array.isArray(v) || v.length < min || v.length > max) return null;
  if (!v.every((x) => typeof x === 'string' && (allowed as readonly string[]).includes(x))) return null;
  if (new Set(v).size !== v.length) return null;
  return [...v] as T[];
}

function pickOne<T extends string>(v: unknown, allowed: readonly T[]): T | null {
  return typeof v === 'string' && (allowed as readonly string[]).includes(v) ? (v as T) : null;
}

export function validateDecisions(v: unknown): Validation<Decisions> {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return { ok: false, error: '判断の内容が不正です' };
  const o = v as Record<string, unknown>;
  const research = pickMany(o.research, RESEARCH_IDS, PICK.research, PICK.research);
  if (!research) return { ok: false, error: '事前調査は 2 つ選んでください' };
  const team = pickMany(o.team, TEAM_IDS, PICK.team, PICK.team);
  if (!team) return { ok: false, error: '同行メンバーは 2 人選んでください' };
  const questions = pickMany(o.questions, QUESTION_IDS, PICK.questions, PICK.questions);
  if (!questions) return { ok: false, error: '質問は 3 つ選んでください' };
  const problem = pickOne(o.problem, PROBLEM_IDS);
  if (!problem) return { ok: false, error: '課題を 1 つ選んでください' };
  const services = pickMany(o.services, SERVICE_IDS, 1, PICK.servicesMax);
  if (!services) return { ok: false, error: 'サービスは 1〜5 つ選んでください' };
  const approach = pickOne(o.approach, APPROACH_IDS);
  if (!approach) return { ok: false, error: '進め方を選んでください' };
  const pricing = pickOne(o.pricing, PRICING_IDS);
  if (!pricing) return { ok: false, error: '費用の出し方を選んでください' };
  const responses =
    Array.isArray(o.responses) && o.responses.length === PICK.responses
      ? o.responses.map((x) => pickOne(x, RESPONSE_IDS))
      : null;
  if (!responses || responses.some((x) => x === null)) return { ok: false, error: '反論への対応を選んでください' };
  const close = pickOne(o.close, CLOSE_IDS);
  if (!close) return { ok: false, error: 'クロージングを選んでください' };
  return {
    ok: true,
    value: { research, team, questions, problem, services, approach, pricing, responses: responses as ResponseId[], close },
  };
}

// ---------- 採点 ----------

export type Rank = 'S' | 'A' | 'B' | 'C' | 'D';

export interface Review {
  area: string;
  tone: 'good' | 'warn' | 'bad';
  text: string;
}

export interface DealResult {
  scores: { discovery: number; fit: number; commercial: number; trust: number };
  total: number;
  /** 受注確度（%） */
  winProbability: number;
  won: boolean;
  /** 年間の利用見込み（万円）。失注時は 0 */
  arr: number;
  cost: number;
  cap: number;
  rank: Rank;
  title: string;
  reviews: Review[];
}

const clamp = (n: number, lo = 0, hi = 100) => Math.min(hi, Math.max(lo, n));
const round = (n: number) => Math.round(n);

/** 選んだ組み合わせの重みの合計を、最良の組み合わせを 100 として換算する */
function bestOf<T extends string>(weights: Record<T, number>, chosen: readonly T[], k: number): number {
  const best = (Object.values(weights) as number[]).sort((a, b) => b - a).slice(0, k).reduce((a, b) => a + b, 0);
  const got = chosen.reduce((sum, id) => sum + weights[id], 0);
  return clamp((got / best) * 100);
}

export function questionWeights(c: Conditions): Record<QuestionId, number> {
  const w: Record<QuestionId, number> = { goal: 80, pain: 95, budget: 35, decision: 45, timeline: 35, constraint: 35 };
  if (c.budget === 'tight') w.budget = 85;
  if (c.stance === 'cfo' || c.competitor !== 'none') w.decision = 85;
  if (c.urgency === 'high') w.timeline = 80;
  if (c.scenario === 'finance' || c.scenario === 'manufacturing' || c.scenario === 'saas') w.constraint = 75;
  return w;
}

export function approachScore(c: Conditions, a: ApproachId): number {
  let s = SCENARIOS[c.scenario].weights.approach[a];
  if (a === 'bigbang' && c.urgency === 'high' && c.stance === 'ceo') s += 15;
  if (a === 'workshop' && c.urgency === 'high') s += 5;
  return clamp(s);
}

export function pricingScore(c: Conditions, d: Pick<Decisions, 'pricing' | 'approach'>): number {
  let s = SCENARIOS[c.scenario].weights.pricing[d.pricing];
  if (c.stance === 'cfo' && (d.pricing === 'savings' || d.pricing === 'funding')) s += 10;
  if (c.competitor === 'othercloud' && d.pricing === 'discount') s += 25;
  if (c.budget === 'tight' && d.pricing === 'ondemand') s -= 10;
  // 効果を確かめる前に長期利用を約束させるのは早すぎる
  if ((d.approach === 'poc' || d.approach === 'workshop') && d.pricing === 'savings') s -= 25;
  return clamp(s);
}

export function closeScore(c: Conditions, d: Pick<Decisions, 'close' | 'approach'>): number {
  const base: Record<CloseId, number> = { wait: 10, exec: 75, map: 90, pressure: 15 };
  let s = base[d.close];
  if (d.close === 'exec' && c.stance === 'ceo') s = 100;
  if (d.close === 'exec' && c.stance === 'cfo') s = 85;
  if (d.close === 'map' && (d.approach === 'poc' || d.approach === 'workshop' || d.approach === 'phased')) s += 10;
  if (d.close === 'pressure' && c.urgency === 'high' && c.budget === 'ample') s = 55;
  if (d.close === 'wait' && c.competitor === 'othercloud') s = 5;
  return clamp(s);
}

export interface ServiceFit {
  score: number;
  coreHit: number;
  missing: string[];
  extra: ServiceId[];
}

export function serviceFit(c: Conditions, services: readonly ServiceId[], lang: Lang = 'ja'): ServiceFit {
  const sc = SCENARIOS[c.scenario];
  const labels = content(lang).SCENARIOS[c.scenario].coreLabels;
  const used = new Set<ServiceId>();
  const missing: string[] = [];
  let coreHit = 0;
  sc.core.forEach((group, i) => {
    const hit = group.find((s) => services.includes(s) && !used.has(s));
    if (hit) {
      used.add(hit);
      coreHit++;
    } else missing.push(labels[i]);
  });
  const good = services.filter((s) => !used.has(s) && sc.good.includes(s));
  good.forEach((s) => used.add(s));
  // core の別の選択肢（例：EC2 と ECS の両方）は重複として軽い減点
  const duplicate = services.filter((s) => !used.has(s) && sc.core.some((g) => g.includes(s)));
  const extra = services.filter((s) => !used.has(s) && !duplicate.includes(s));
  const score = (coreHit / sc.core.length) * 70 + (Math.min(good.length, 2) / 2) * 30 - extra.length * 15 - duplicate.length * 6;
  return { score: clamp(round(score)), coreHit, missing, extra };
}

const RANKS: { min: number; rank: Rank; title: Record<Lang, string> }[] = [
  { min: 90, rank: 'S', title: { ja: 'ストラテジック・アカウントマネージャー', en: 'Strategic Account Manager' } },
  { min: 78, rank: 'A', title: { ja: 'シニア・アカウントマネージャー', en: 'Senior Account Manager' } },
  { min: 65, rank: 'B', title: { ja: 'アカウントマネージャー', en: 'Account Manager' } },
  { min: 50, rank: 'C', title: { ja: 'アソシエイト', en: 'Associate' } },
  { min: 0, rank: 'D', title: { ja: '要コーチング', en: 'Needs coaching' } },
];

export function rankOf(total: number, lang: Lang = 'ja'): { min: number; rank: Rank; title: string } {
  const r = RANKS.find((x) => total >= x.min)!;
  return { min: r.min, rank: r.rank, title: r.title[lang] };
}

// ---------- フィードバックの文言 ----------

const MSG = {
  ja: {
    area: {
      research: '事前調査',
      questions: 'ヒアリング',
      problem: '課題の特定',
      services: '提案構成',
      approach: '進め方',
      team: '同行メンバー',
      cost: '費用',
      pricing: '費用の出し方',
      close: 'クロージング',
    },
    objectionArea: (title: string) => `反論：${title}`,
    researchGood: '商談の前に、顧客が何に投資しようとしているかをつかめていました。',
    researchWarn: '調べた情報が商談の核心に届いていませんでした。経営計画や既存の契約状況は、提案のタイミングを左右します。',
    noPain: '「いま一番困っていること」を聞かずに提案に進みました。課題が分からないままでは、提案は機能の紹介に終わります。',
    questionsGood: 'この顧客にとって重要な質問を選べていました。',
    questionsWarn: '質問の優先順位を見直しましょう。',
    hint: {
      budget: '予算が厳しい顧客には、予算の考え方を早めに確認しましょう。',
      decision: '比較検討や費用に厳しい決裁者がいるときは、誰がどう決めるかの確認が欠かせません。',
      timeline: '急ぎの案件では、期限を確かめないと進め方を誤ります。',
      constraint: '規制や技術の制約は、提案の前提を変えます。',
      goal: 'ビジネスゴールが分からないと、投資対効果を語れません。',
    } as Partial<Record<QuestionId, string>>,
    problemGood: '表面の症状ではなく、事業への影響まで含めて課題を言語化できました。',
    problemWarn: (p: string) => `「${p}」は症状の 1 つです。顧客が本当に困っているのは、それによって事業に何が起きているかです。`,
    problemBad: '顧客の言葉から離れた課題設定になりました。ヒアリングで聞いた「困りごと」に立ち返りましょう。',
    servicesGood: '課題に必要な要素を過不足なく組み合わせた構成でした。',
    servicesMissing: (missing: string[]) => `「${missing.join('」「')}」が欠けていました。課題を解くのに必要な部品から考えましょう。`,
    servicesExtra: (names: string[]) => `${names.join('、')} はこの課題には関係が薄く、提案の焦点がぼやけました。`,
    approachGood: '顧客の状況に合った進め方でした。',
    approachBigbang: '一斉移行はリスクが大きく、決裁者は承認しにくくなります。',
    approachWarn: 'もっと顧客が「始めやすい」進め方がありました。効果を確かめる段階を設けると、承認のハードルが下がります。',
    teamGood: 'この案件に必要な専門性を持つメンバーを連れて行けました。',
    teamWarn:
      '同行メンバーの専門性が課題とずれていました。IoT・AI のような専門領域ではスペシャリストを、大規模な移行や統制ではプロフェッショナルサービスを頼りましょう。',
    overBudget: (cost: number, cap: number) => `構成の費用が顧客の予算感（${cap}）を超えました（${cost}）。必要な機能に絞るか、段階的に導入しましょう。`,
    pricingGood: '顧客の財務の事情に合った費用の出し方でした。',
    pricingEarlyCommit: '効果を確かめる前に長期の利用を約束させるのは早すぎます。まずはオンデマンドや支援策で始めましょう。',
    pricingDiscount: '値引きは最後の手段です。支援策や料金プランで、値引きに頼らず価値を示しましょう。',
    pricingWarn: '使える支援策や料金プランを活かしきれていませんでした。',
    closeGood: '次の一歩を顧客と一緒に決められました。',
    closePressure: '期限で迫る値引きは、顧客に「売り込まれた」という印象を残します。',
    closeWait: '返事を待つだけでは、商談の主導権を失います。',
    closeWarn: '次の一歩は作れましたが、顧客と成功条件を共有できるとさらに確度が上がります。',
  },
  en: {
    area: {
      research: 'Research',
      questions: 'Discovery',
      problem: 'Problem',
      services: 'Solution',
      approach: 'Approach',
      team: 'Account team',
      cost: 'Cost',
      pricing: 'Pricing',
      close: 'Closing',
    },
    objectionArea: (title: string) => `Objection: ${title}`,
    researchGood: 'Before the meeting, you understood what the customer intends to invest in.',
    researchWarn:
      'Your research missed the heart of the deal. Business plans and current contracts decide when a proposal can land.',
    noPain:
      'You moved on to a proposal without asking about their biggest problem. Without knowing the problem, a proposal is just a feature tour.',
    questionsGood: 'You chose the questions that mattered most for this customer.',
    questionsWarn: 'Rethink which questions to ask first.',
    hint: {
      budget: 'With a customer on a tight budget, ask early how they think about budget.',
      decision: 'When there is a competing option or a cost-conscious decision maker, you must confirm who decides and how.',
      timeline: 'On an urgent deal, you will pick the wrong approach unless you confirm the deadline.',
      constraint: 'Regulatory and technical constraints change the premises of the proposal.',
      goal: 'Without knowing the business goal, you cannot talk about return on investment.',
    } as Partial<Record<QuestionId, string>>,
    problemGood: 'You put the problem into words, including its impact on the business, not just the surface symptom.',
    problemWarn: (p: string) => `“${p}” is one of the symptoms. What really hurts the customer is what it does to their business.`,
    problemBad: 'Your problem statement drifted away from the customer’s own words. Go back to the pain you heard in discovery.',
    servicesGood: 'Your solution had exactly the pieces the problem needed, nothing missing and nothing extra.',
    servicesMissing: (missing: string[]) =>
      `Missing: ${missing.map((x) => `“${x}”`).join(', ')}. Start from the pieces needed to solve the problem.`,
    servicesExtra: (names: string[]) => `${names.join(', ')} ${names.length > 1 ? 'have' : 'has'} little to do with this problem and blurred the focus of the proposal.`,
    approachGood: 'Your approach fit the customer’s situation.',
    approachBigbang: 'Migrating everything at once is risky, and decision makers find it hard to approve.',
    approachWarn: 'There was an easier way for the customer to get started. A stage that proves the value lowers the bar for approval.',
    teamGood: 'You brought people with the expertise this deal needed.',
    teamWarn:
      'Your team’s expertise didn’t match the problem. Bring specialists for fields like IoT and AI, and Professional Services for large migrations and governance.',
    overBudget: (cost: number, cap: number) =>
      `The solution cost (${cost}) exceeded the customer’s budget (${cap}). Focus on what is needed, or roll it out in stages.`,
    pricingGood: 'Your pricing fit the customer’s financial situation.',
    pricingEarlyCommit: 'Asking for a long-term commitment before proving the value is too early. Start with On-Demand or funding programs.',
    pricingDiscount: 'Discounts are the last resort. Show value with funding programs and pricing models instead.',
    pricingWarn: 'You didn’t make full use of the funding programs and pricing models available.',
    closeGood: 'You agreed on the next step together with the customer.',
    closePressure: 'A discount with a deadline leaves the customer feeling they were sold to.',
    closeWait: 'Just waiting for an answer means losing control of the deal.',
    closeWarn: 'You set up a next step, but sharing success criteria with the customer would raise your odds further.',
  },
} satisfies Record<Lang, unknown>;

const WIN_THRESHOLD: Record<Competitor, number> = { none: 64, onprem: 68, othercloud: 72 };

export function simulate(c: Conditions, d: Decisions, lang: Lang = 'ja'): DealResult {
  const sc = SCENARIOS[c.scenario];
  const t = content(lang);
  const m = MSG[lang];
  const reviews: Review[] = [];
  const say = (area: string, tone: Review['tone'], text: string) => reviews.push({ area, tone, text });

  // 1. 顧客理解（事前調査・質問・課題の特定）
  const research = bestOf(sc.weights.research, d.research, PICK.research);
  const qw = questionWeights(c);
  const questions = bestOf(qw, d.questions, PICK.questions);
  const problem = sc.problems[d.problem].score;
  const discovery = round(research * 0.25 + questions * 0.4 + problem * 0.35);

  if (research >= 90) say(m.area.research, 'good', m.researchGood);
  else say(m.area.research, 'warn', m.researchWarn);
  if (!d.questions.includes('pain')) say(m.area.questions, 'bad', m.noPain);
  else if (questions >= 90) say(m.area.questions, 'good', m.questionsGood);
  else {
    const missed = (Object.entries(qw) as [QuestionId, number][])
      .filter(([q, w]) => w >= 75 && !d.questions.includes(q))
      .map(([q]) => q);
    say(m.area.questions, 'warn', missed.map((q) => m.hint[q]).filter(Boolean)[0] ?? m.questionsWarn);
  }
  if (problem === 100) say(m.area.problem, 'good', m.problemGood);
  else if (problem >= 40) say(m.area.problem, 'warn', m.problemWarn(t.SCENARIOS[c.scenario].problems[d.problem].text));
  else say(m.area.problem, 'bad', m.problemBad);

  // 2. 提案の適合（サービス・進め方・体制）
  const fitInfo = serviceFit(c, d.services, lang);
  const approach = approachScore(c, d.approach);
  const team = bestOf(sc.weights.team, d.team, PICK.team);
  const fit = round(fitInfo.score * 0.55 + approach * 0.25 + team * 0.2);

  if (fitInfo.missing.length === 0 && fitInfo.extra.length === 0) say(m.area.services, 'good', m.servicesGood);
  if (fitInfo.missing.length > 0) say(m.area.services, 'bad', m.servicesMissing(fitInfo.missing));
  if (fitInfo.extra.length > 0)
    say(m.area.services, 'warn', m.servicesExtra(fitInfo.extra.map((s) => t.SERVICES[s].name)));
  if (approach >= 90) say(m.area.approach, 'good', m.approachGood);
  else if (d.approach === 'bigbang') say(m.area.approach, 'bad', m.approachBigbang);
  else say(m.area.approach, 'warn', m.approachWarn);
  if (team >= 90) say(m.area.team, 'good', m.teamGood);
  else say(m.area.team, 'warn', m.teamWarn);

  // 3. 経済性（費用の出し方・予算との整合）
  const cost = costOf(d.services);
  const cap = budgetCap(c.budget);
  const budgetFit = clamp(100 - Math.max(0, cost - cap) * 18);
  const pricing = pricingScore(c, d);
  const commercial = round(pricing * 0.55 + budgetFit * 0.45);

  if (cost > cap) say(m.area.cost, 'bad', m.overBudget(cost, cap));
  if (pricing >= 90) say(m.area.pricing, 'good', m.pricingGood);
  else if ((d.approach === 'poc' || d.approach === 'workshop') && d.pricing === 'savings')
    say(m.area.pricing, 'bad', m.pricingEarlyCommit);
  else if (d.pricing === 'discount') say(m.area.pricing, 'warn', m.pricingDiscount);
  else say(m.area.pricing, 'warn', m.pricingWarn);

  // 4. 信頼構築（反論への対応・クロージング）
  const objs = objectionsFor(c);
  const objScores = objs.map((o, i) => OBJECTIONS[o].responses[d.responses[i]].score);
  objs.forEach((o, i) => {
    const r = t.OBJECTIONS[o].responses[d.responses[i]];
    say(m.objectionArea(t.OBJECTIONS[o].title), r.score >= 85 ? 'good' : r.score >= 50 ? 'warn' : 'bad', r.review);
  });
  const close = closeScore(c, d);
  const saBonus = c.stance === 'cto' && d.team.includes('sa') ? 5 : 0;
  const trust = clamp(round(((objScores[0] + objScores[1]) / 2) * 0.6 + close * 0.4 + saBonus));

  if (close >= 90) say(m.area.close, 'good', m.closeGood);
  else if (d.close === 'pressure') say(m.area.close, 'bad', m.closePressure);
  else if (d.close === 'wait') say(m.area.close, 'bad', m.closeWait);
  else say(m.area.close, 'warn', m.closeWarn);

  const total = round(discovery * 0.25 + fit * 0.3 + commercial * 0.2 + trust * 0.25);
  const th = WIN_THRESHOLD[c.competitor];
  const winProbability = round(100 / (1 + Math.exp(-(total - th) / 6)));
  const won = winProbability >= 50;
  const priceFactor = d.pricing === 'discount' ? 0.8 : d.pricing === 'savings' ? 0.9 : 1;
  const arr = won ? round((sc.baseArr * (0.5 + fitInfo.score / 200) * priceFactor) / 10) * 10 : 0;
  const r = rankOf(total, lang);

  return {
    scores: { discovery, fit, commercial, trust },
    total,
    winProbability,
    won,
    arr,
    cost,
    cap,
    rank: r.rank,
    title: r.title,
    reviews,
  };
}

/** 最高得点の判断（テスト・バランス確認・「模範解答」の表示に使う） */
export function bestDecisions(c: Conditions): { decisions: Decisions; result: DealResult } {
  const sc = SCENARIOS[c.scenario];
  const top = <T extends string>(w: Record<T, number>, k: number) =>
    (Object.entries(w) as [T, number][]).sort((a, b) => b[1] - a[1]).slice(0, k).map(([id]) => id);
  const objs = objectionsFor(c);
  const responses = objs.map(
    (o) => (Object.entries(OBJECTIONS[o].responses) as [ResponseId, { score: number }][]).sort((a, b) => b[1].score - a[1].score)[0][0],
  );
  const problem = (Object.entries(sc.problems) as [ProblemId, { score: number }][]).find(([, p]) => p.score === 100)![0];

  // サービスは core の組み合わせ + good を、予算内で最も点が高くなるように探す
  const coreCombos: ServiceId[][] = sc.core.reduce<ServiceId[][]>((acc, g) => acc.flatMap((a) => g.map((s) => [...a, s])), [[]]);
  let best: { decisions: Decisions; result: DealResult } | null = null;
  for (const core of coreCombos) {
    const goods = sc.good.filter((s) => !core.includes(s));
    const goodSets: ServiceId[][] = [[]];
    for (const g of goods) for (const set of [...goodSets]) if (set.length < 2) goodSets.push([...set, g]);
    for (const goodSet of goodSets) {
      for (const approach of APPROACH_IDS) {
        for (const pricing of PRICING_IDS) {
          for (const close of CLOSE_IDS) {
            const decisions: Decisions = {
              research: top(sc.weights.research, PICK.research),
              team: top(sc.weights.team, PICK.team),
              questions: top(questionWeights(c), PICK.questions),
              problem,
              services: [...core, ...goodSet],
              approach,
              pricing,
              responses,
              close,
            };
            const result = simulate(c, decisions);
            if (!best || result.total > best.result.total) best = { decisions, result };
          }
        }
      }
    }
  }
  return best!;
}

import {
  APPROACH_IDS,
  APPROACH_LABEL,
  BUDGET_LABEL,
  CLOSE_IDS,
  CLOSE_LABEL,
  COMPETITOR_LABEL,
  type Conditions,
  type DealResult,
  type Decisions,
  OBJECTIONS,
  PICK,
  PRICING_IDS,
  PRICING_LABEL,
  PROBLEM_IDS,
  QUESTION_IDS,
  QUESTION_LABEL,
  RESEARCH_IDS,
  RESEARCH_LABEL,
  RESPONSE_IDS,
  type ResponseId,
  SCENARIOS,
  SCENARIO_IDS,
  SERVICES,
  SERVICE_IDS,
  STANCE_LABEL,
  type ScenarioId,
  type ServiceId,
  TEAM_IDS,
  TEAM_LABEL,
  URGENCY_LABEL,
  bestDecisions,
  budgetCap,
  conditionsFromSeed,
  costOf,
  objectionsFor,
  randomSeed,
  seedForScenario,
  simulate,
  validateDecisions,
  validateSeed,
} from '../../shared/engine';
import { ApiError, type DealSummary, getDeal, leaderboard, listDeals, listMine, saveDeal } from './api';
import { authEnabled, currentEmail, initAuth, isLoggedIn, login, logout } from './auth';
import { learnPage } from './learn';
// favicon・ヘッダーのマーク。import するとハッシュ付きの名前で出力され、index.html に書き込まれる
import markUrl from './images/mark.svg';

// ---------- 小道具 ----------

const app = document.getElementById('app')!;
document.querySelector<HTMLImageElement>('.brand img')?.setAttribute('src', markUrl);

const esc = (s: unknown) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const yen = (man: number) => `${man.toLocaleString('ja-JP')}<small> 万円/年</small>`;

const store = {
  get(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string | null) {
    try {
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
    } catch {
      // プライベートブラウズ等では保存しない
    }
  },
};

// ---------- 商談の状態 ----------

type Draft = Partial<Omit<Decisions, 'responses'>> & { responses?: (ResponseId | null)[] };

interface Session {
  seed: number;
  step: number;
  d: Draft;
  savedId?: string;
}

const STEPS = [
  'brief',
  'research',
  'team',
  'questions',
  'problem',
  'services',
  'approach',
  'pricing',
  'objection0',
  'objection1',
  'close',
  'result',
] as const;
type StepId = (typeof STEPS)[number];

const PHASES: { name: string; steps: StepId[] }[] = [
  { name: '準備', steps: ['brief', 'research', 'team'] },
  { name: 'ヒアリング', steps: ['questions', 'problem'] },
  { name: '提案', steps: ['services', 'approach'] },
  { name: '見積', steps: ['pricing'] },
  { name: '交渉', steps: ['objection0', 'objection1'] },
  { name: 'クロージング', steps: ['close'] },
  { name: '結果', steps: ['result'] },
];

const SESSION_KEY = 'dealroom.session';
const NAME_KEY = 'dealroom.playerName';

function loadSession(): Session | null {
  try {
    const s = JSON.parse(store.get(SESSION_KEY) ?? 'null') as Session | null;
    if (s && validateSeed(s.seed) && Number.isInteger(s.step) && s.step >= 0 && s.step < STEPS.length && s.d) return s;
  } catch {
    // 壊れた保存データは捨てる
  }
  return null;
}

let session: Session | null = loadSession();

function saveSession() {
  store.set(SESSION_KEY, session ? JSON.stringify(session) : null);
}

function startSession(seed: number) {
  session = { seed, step: 0, d: { responses: [null, null] } };
  saveSession();
  if (location.hash === '#/play') route();
  else location.hash = '#/play';
}

/** 何を確認済みか（ヒアリングや調査で分かった条件） */
function known(c: Conditions, s: Session) {
  const past = (id: StepId) => s.step > STEPS.indexOf(id);
  const asked = (q: string) => past('questions') && (s.d.questions ?? []).includes(q as never);
  const researched = (r: string) => past('research') && (s.d.research ?? []).includes(r as never);
  const done = s.step === STEPS.indexOf('result');
  return {
    budget: done || asked('budget'),
    competitor: done || asked('decision') || researched('vendor'),
    urgency: done || asked('timeline'),
    c,
  };
}

const BUDGET_LINE = {
  tight: '正直なところ、予算はかなり厳しいです。',
  normal: '相場の範囲であれば検討できます。',
  ample: '効果が見込めるなら、予算は確保できます。',
};
const COMPETITOR_LINE = {
  none: '今のところ、他社とは話していません。',
  onprem: '既存の SI さんからは、サーバー更改の見積もりをもらっています。',
  othercloud: '実は、他社クラウドの提案も受けています。',
};
const URGENCY_LINE = {
  low: '半年から 1 年かけて、慎重に進めたいと考えています。',
  high: 'できるだけ早く、3 か月以内には動き出したいです。',
};

function answerFor(c: Conditions, q: (typeof QUESTION_IDS)[number]): string {
  const base = SCENARIOS[c.scenario].answers[q];
  // 条件によって変わる一言を、発言の括弧の中に足す
  const add = (line: string) => base.replace(/」$/, `${line}」`);
  if (q === 'budget') return add(BUDGET_LINE[c.budget]);
  if (q === 'decision') return add(COMPETITOR_LINE[c.competitor]);
  if (q === 'timeline') return add(URGENCY_LINE[c.urgency]);
  return base;
}

function researchFor(c: Conditions, r: (typeof RESEARCH_IDS)[number]): string {
  const base = SCENARIOS[c.scenario].research[r];
  if (r === 'vendor') return `${base} 競合の状況：${COMPETITOR_LABEL[c.competitor]}。`;
  return base;
}

// ---------- 共通の表示 ----------

function setNav(route: string) {
  document.querySelectorAll<HTMLAnchorElement>('.nav a').forEach((a) => {
    if (a.dataset.route === route) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
}

function renderAccount() {
  const el = document.getElementById('account')!;
  if (!authEnabled()) {
    el.innerHTML = '';
    return;
  }
  if (isLoggedIn()) {
    el.innerHTML = `<span class="muted">${esc(currentEmail() ?? 'ログイン中')}</span><button class="btn link" data-act="logout">ログアウト</button>`;
  } else {
    el.innerHTML = `<button class="btn link" data-act="login">ログイン / 新規登録</button>`;
  }
}

function card(c: Conditions): string {
  const sc = SCENARIOS[c.scenario];
  const p = sc.contacts[c.stance];
  return `<div class="card" aria-label="名刺">
    <div><div class="co">${esc(sc.company)}</div><div class="ti">${esc(p.title)}</div></div>
    <div class="na">${esc(p.name)}</div>
    <div class="ad">${esc(sc.industry)}</div>
  </div>`;
}

function contactName(c: Conditions) {
  const p = SCENARIOS[c.scenario].contacts[c.stance];
  return `${p.name}（${p.title}）`;
}

function dealSheet(c: Conditions, s: Session): string {
  const sc = SCENARIOS[c.scenario];
  const k = known(c, s);
  const unk = '<span class="muted">未確認</span>';
  const notes: string[] = [];
  if (s.step > STEPS.indexOf('research'))
    for (const r of s.d.research ?? []) notes.push(`<li><span class="src">調査｜${esc(RESEARCH_LABEL[r].name)}</span>${esc(researchFor(c, r))}</li>`);
  if (s.step > STEPS.indexOf('questions'))
    for (const q of s.d.questions ?? []) notes.push(`<li><span class="src">ヒアリング｜${esc(QUESTION_LABEL[q].frame)}</span>${esc(answerFor(c, q))}</li>`);
  return `<aside class="dealsheet sheet" aria-label="案件シート">
    <div class="label">Deal Sheet</div>
    <h2>${esc(sc.company)}</h2>
    <table class="ledger"><tbody>
      <tr><th>業種</th><td>${esc(sc.industry)}</td></tr>
      <tr><th>規模</th><td>${esc(sc.employees)}</td></tr>
      <tr><th>面談相手</th><td>${esc(contactName(c))}<br><span class="muted small">${esc(STANCE_LABEL[c.stance])}</span></td></tr>
      <tr><th>予算感</th><td>${k.budget ? esc(BUDGET_LABEL[c.budget]) : unk}</td></tr>
      <tr><th>競合</th><td>${k.competitor ? esc(COMPETITOR_LABEL[c.competitor]) : unk}</td></tr>
      <tr><th>時期</th><td>${k.urgency ? esc(URGENCY_LABEL[c.urgency]) : unk}</td></tr>
    </tbody></table>
    <h3 style="margin-top:14px">分かったこと</h3>
    <ul class="notes">${notes.join('') || '<li class="empty">まだありません。調査とヒアリングで書き込まれます。</li>'}</ul>
  </aside>`;
}

function pipeline(step: StepId): string {
  const idx = PHASES.findIndex((p) => p.steps.includes(step));
  return `<ol class="pipeline" aria-label="商談フェーズ">${PHASES.map(
    (p, i) => `<li class="${i < idx ? 'done' : i === idx ? 'current' : ''}"${i === idx ? ' aria-current="step"' : ''}>${esc(p.name)}</li>`,
  ).join('')}</ol>`;
}

interface Option {
  id: string;
  title: string;
  note?: string;
  side?: string;
  group?: string;
}

function choiceList(name: string, options: Option[], multi: boolean, selected: readonly string[]): string {
  let lastGroup = '';
  const items = options.map((o) => {
    const head = o.group && o.group !== lastGroup ? `<li class="group-title" aria-hidden="true">${esc(o.group)}</li>` : '';
    lastGroup = o.group ?? '';
    return `${head}<li class="choice"><label>
      <input type="${multi ? 'checkbox' : 'radio'}" name="${name}" value="${esc(o.id)}"${selected.includes(o.id) ? ' checked' : ''}>
      <span><span class="t">${esc(o.title)}</span>${o.note ? `<span class="n">${esc(o.note)}</span>` : ''}</span>
      <span class="side">${o.side ?? ''}</span>
    </label></li>`;
  });
  return `<ul class="choices" role="${multi ? 'group' : 'radiogroup'}">${items.join('')}</ul>`;
}

const dots = (n: number) => `<span class="cost-dots" aria-label="費用 ${n}">${'■'.repeat(n)}${'□'.repeat(4 - n)}</span>`;

// ---------- 各ステップ ----------

interface StepView {
  no: string;
  title: string;
  lead: string;
  coach?: string;
  body: string;
  /** 入力が揃っているか */
  ready: () => boolean;
  /** 複数選択の上限 */
  max?: { name: string; n: number };
  extra?: () => string;
}

function stepView(c: Conditions, s: Session): StepView {
  const sc = SCENARIOS[c.scenario];
  const d = s.d;
  const id = STEPS[s.step];
  const no = String(s.step).padStart(2, '0');
  switch (id) {
    case 'brief':
      return {
        no,
        title: '案件の概要',
        lead: 'インバウンドの問い合わせから、初回の商談が決まりました。あなたは AWS のアカウントマネージャーです。',
        body: `<div class="sheet" style="margin-bottom:16px">
            <div class="label">Inbound Lead</div>
            <h2>${esc(sc.company)}</h2>
            <p>${esc(sc.summary)}</p>
            <p class="muted small">${esc(sc.industry)}／${esc(sc.employees)}</p>
          </div>
          <h3>面談の相手</h3>
          ${card(c)}
          <p class="small muted" style="margin-top:8px">${esc(STANCE_LABEL[c.stance])}。予算・競合・時期は、まだ分かっていません。</p>`,
        coach: '<strong>この商談で評価されること</strong>：顧客理解 25%・提案の適合 30%・経済性 20%・信頼構築 25%。高いサービスを並べるほど良いわけではありません。',
        ready: () => true,
      };
    case 'research':
      return {
        no,
        title: '事前調査',
        lead: '商談の前に、何を調べておきますか。時間が限られているため 2 つだけ選べます。',
        coach: '公開情報から「顧客が何に投資しようとしているか」「今のシステムを誰がいつまで支えるか」をつかむと、提案のタイミングが見えてきます。',
        body: choiceList(
          'research',
          RESEARCH_IDS.map((r) => ({ id: r, title: RESEARCH_LABEL[r].name, note: RESEARCH_LABEL[r].note })),
          true,
          d.research ?? [],
        ),
        max: { name: 'research', n: PICK.research },
        ready: () => (d.research ?? []).length === PICK.research,
      };
    case 'team':
      return {
        no,
        title: '同行メンバー',
        lead: '初回の商談に誰を連れて行きますか。2 人まで選べます。',
        coach: 'アカウントマネージャーは「顧客との関係と商談全体」の責任者です。技術・専門領域・構築・大規模移行は、それぞれ得意なメンバーに任せます。',
        body: choiceList(
          'team',
          TEAM_IDS.map((t) => ({ id: t, title: TEAM_LABEL[t].name, note: TEAM_LABEL[t].note })),
          true,
          d.team ?? [],
        ),
        max: { name: 'team', n: PICK.team },
        ready: () => (d.team ?? []).length === PICK.team,
      };
    case 'questions':
      return {
        no,
        title: 'ヒアリング',
        lead: `${contactName(c)}との面談時間は 30 分。聞けるのは 3 つです。`,
        coach: '予算（Budget）・決裁（Authority）・ニーズ（Need）・時期（Timeline）を確かめる BANT は基本の型です。答えは右の案件シートに書き込まれ、後の判断の材料になります。',
        body: choiceList(
          'questions',
          QUESTION_IDS.map((q) => ({ id: q, title: `「${QUESTION_LABEL[q].name}」`, note: QUESTION_LABEL[q].frame })),
          true,
          d.questions ?? [],
        ),
        max: { name: 'questions', n: PICK.questions },
        ready: () => (d.questions ?? []).length === PICK.questions,
      };
    case 'problem':
      return {
        no,
        title: '課題の整理',
        lead: 'ヒアリングの内容から、この顧客の「本当の課題」を 1 つに絞ってください。提案はここから組み立てます。',
        coach: '「サーバーが古い」は症状です。それによって事業に何が起きているか（売上・稼働率・事業継続）まで言えると、決裁者に届く提案になります。',
        body: `<div class="quote" style="margin-bottom:16px">${
          (d.questions ?? []).map((q) => `<p style="margin-bottom:6px">${esc(answerFor(c, q))}</p>`).join('') || '<p>（ヒアリングの記録はありません）</p>'
        }<cite>${esc(contactName(c))}との面談メモ</cite></div>${choiceList(
          'problem',
          PROBLEM_IDS.map((p) => ({ id: p, title: sc.problems[p].text })),
          false,
          d.problem ? [d.problem] : [],
        )}`,
        ready: () => !!d.problem,
      };
    case 'services': {
      const k = known(c, s);
      return {
        no,
        title: '提案の構成',
        lead: '課題を解くために提案するサービスを選んでください（1〜5 つ）。',
        coach: 'まず課題を解くのに欠かせない部品を揃え、次に運用や移行を楽にする部品を足します。関係の薄いサービスは提案の焦点をぼかします。',
        body: choiceList(
          'services',
          SERVICE_IDS.map((sv) => ({
            id: sv,
            title: SERVICES[sv].name,
            note: SERVICES[sv].summary,
            side: dots(SERVICES[sv].cost),
            group: SERVICES[sv].category,
          })),
          true,
          d.services ?? [],
        ),
        max: { name: 'services', n: PICK.servicesMax },
        ready: () => (d.services ?? []).length >= 1,
        extra: () => {
          const cost = costOf((d.services ?? []) as ServiceId[]);
          const cap = budgetCap(c.budget);
          const scale = 18;
          const over = k.budget && cost > cap;
          return `<div class="meter${over ? ' over' : ''}" aria-live="polite">
            <span>構成の費用 <span class="num">${cost}</span></span>
            <span class="track"><span class="fill" style="width:${Math.min(100, (cost / scale) * 100)}%"></span>${
              k.budget ? `<span class="cap" style="left:${(cap / scale) * 100}%" title="予算感"></span>` : ''
            }</span>
            <span>${k.budget ? `予算感 <span class="num">${cap}</span>` : '<span class="muted">予算感は未確認</span>'}</span>
          </div>`;
        },
      };
    }
    case 'approach':
      return {
        no,
        title: '進め方',
        lead: 'どのように導入を進める提案にしますか。',
        coach: '決裁者が「承認しやすい」最初の一歩を設計するのも営業の仕事です。新しい取り組みは効果を確かめる段階を、既存システムの移行は計画を立てる段階を置くと進みやすくなります。',
        body: choiceList(
          'approach',
          APPROACH_IDS.map((a) => ({ id: a, title: APPROACH_LABEL[a].name, note: APPROACH_LABEL[a].note })),
          false,
          d.approach ? [d.approach] : [],
        ),
        ready: () => !!d.approach,
      };
    case 'pricing':
      return {
        no,
        title: '費用の提示',
        lead: '見積もりをどのように出しますか。',
        coach: '値引きの前に、料金プラン（長期利用割引）や、移行・スタートアップ向けの支援策が使えないか考えます。使い方が決まっていない段階で長期の約束を求めるのは早すぎます。',
        body: choiceList(
          'pricing',
          PRICING_IDS.map((p) => ({ id: p, title: PRICING_LABEL[p].name, note: PRICING_LABEL[p].note })),
          false,
          d.pricing ? [d.pricing] : [],
        ),
        ready: () => !!d.pricing,
      };
    case 'objection0':
    case 'objection1': {
      const i = id === 'objection0' ? 0 : 1;
      const o = OBJECTIONS[objectionsFor(c)[i]];
      const cur = d.responses?.[i];
      return {
        no,
        title: `反論への対応 ${i + 1}／2：${o.title}`,
        lead: '提案の説明を終えると、こう返されました。',
        coach: '反論は「関心がある」サインです。否定や断言で押し切らず、懸念を受け止めて、根拠のある情報や次の一歩で応えます。',
        body: `<blockquote class="quote"><p>「${esc(o.line)}」</p><cite>${esc(contactName(c))}</cite></blockquote>${choiceList(
          `response${i}`,
          RESPONSE_IDS.map((r) => ({ id: r, title: o.responses[r].text })),
          false,
          cur ? [cur] : [],
        )}`,
        ready: () => !!d.responses?.[i],
      };
    }
    case 'close':
      return {
        no,
        title: 'クロージング',
        lead: '商談の最後に、次の一歩をどう決めますか。',
        coach: '受注は「顧客が決める」ものです。誰が・いつまでに・何を確かめれば決められるかを、顧客と一緒に書き出せると確度が上がります。',
        body: choiceList(
          'close',
          CLOSE_IDS.map((x) => ({ id: x, title: CLOSE_LABEL[x].name, note: CLOSE_LABEL[x].note })),
          false,
          d.close ? [d.close] : [],
        ),
        ready: () => !!d.close,
      };
    default:
      return { no, title: '', lead: '', body: '', ready: () => true };
  }
}

function readInputs(s: Session) {
  const id = STEPS[s.step];
  const values = (name: string) =>
    [...app.querySelectorAll<HTMLInputElement>(`input[name="${name}"]:checked`)].map((i) => i.value);
  const d = s.d;
  switch (id) {
    case 'research':
      d.research = values('research') as Decisions['research'];
      break;
    case 'team':
      d.team = values('team') as Decisions['team'];
      break;
    case 'questions':
      d.questions = values('questions') as Decisions['questions'];
      break;
    case 'problem':
      d.problem = values('problem')[0] as Decisions['problem'];
      break;
    case 'services':
      d.services = values('services') as ServiceId[];
      break;
    case 'approach':
      d.approach = values('approach')[0] as Decisions['approach'];
      break;
    case 'pricing':
      d.pricing = values('pricing')[0] as Decisions['pricing'];
      break;
    case 'objection0':
    case 'objection1': {
      const i = id === 'objection0' ? 0 : 1;
      const r = (values(`response${i}`)[0] ?? null) as ResponseId | null;
      d.responses = [...(d.responses ?? [null, null])];
      d.responses[i] = r;
      break;
    }
    case 'close':
      d.close = values('close')[0] as Decisions['close'];
      break;
  }
}

/** 入力が変わったときに、画面全体を作り直さずに状態だけ更新する（フォーカスを保つため） */
function refreshStep(c: Conditions, s: Session) {
  const v = stepView(c, s);
  if (v.max) {
    const inputs = [...app.querySelectorAll<HTMLInputElement>(`input[name="${v.max.name}"]`)];
    const count = inputs.filter((i) => i.checked).length;
    inputs.forEach((i) => (i.disabled = !i.checked && count >= v.max!.n));
    const counter = app.querySelector('.counter');
    if (counter) counter.textContent = `${count} / ${v.max.n} 選択`;
  }
  const extra = app.querySelector('#step-extra');
  if (extra && v.extra) extra.innerHTML = v.extra();
  const next = app.querySelector<HTMLButtonElement>('[data-act="next"]');
  if (next) next.disabled = !v.ready();
}

function renderPlay() {
  setNav('play');
  if (!session) {
    app.innerHTML = `<div class="sheet"><h1>商談</h1><p>進行中の商談はありません。</p>
      <div class="btn-row"><a class="btn" href="#/">案件を選ぶ</a><button class="btn secondary" data-act="random">ランダムな案件で始める</button></div></div>`;
    return;
  }
  const s = session;
  const c = conditionsFromSeed(s.seed);
  if (STEPS[s.step] === 'result') {
    renderResultScreen(c, s);
    return;
  }
  const v = stepView(c, s);
  const isLast = STEPS[s.step + 1] === 'result';
  app.innerHTML = `${pipeline(STEPS[s.step])}
    <div class="play-grid">
      ${dealSheet(c, s)}
      <section aria-labelledby="step-title">
        <div class="step-head">
          <div class="rule-title"><span class="no">${v.no}</span><h1 id="step-title" style="font-size:1.35rem;margin:0">${esc(v.title)}</h1></div>
          <p class="lead">${esc(v.lead)}</p>
        </div>
        ${v.coach ? `<p class="coach">${v.coach}</p>` : ''}
        <div id="step-extra">${v.extra ? v.extra() : ''}</div>
        <form id="step-form" onsubmit="return false">${v.body}</form>
        <div class="step-nav">
          <div class="btn-row">
            ${s.step > 0 ? '<button class="btn secondary" data-act="back">戻る</button>' : ''}
            ${v.max ? `<span class="counter"></span>` : ''}
          </div>
          <button class="btn" data-act="next">${s.step === 0 ? '商談を始める' : isLast ? '商談を終える' : '次へ'}</button>
        </div>
      </section>
    </div>`;
  refreshStep(c, s);
}

// ---------- 結果 ----------

const MARK = { good: '○', warn: '△', bad: '×' } as const;
const AXES = [
  ['discovery', '顧客理解', '事前調査・ヒアリング・課題の特定'],
  ['fit', '提案の適合', 'サービス構成・進め方・同行メンバー'],
  ['commercial', '経済性', '費用の出し方・予算との整合'],
  ['trust', '信頼構築', '反論への対応・クロージング'],
] as const;

function decisionsTable(c: Conditions, d: Decisions): string {
  const objs = objectionsFor(c);
  const rows: [string, string][] = [
    ['事前調査', d.research.map((r) => RESEARCH_LABEL[r].name).join('、')],
    ['同行メンバー', d.team.map((t) => TEAM_LABEL[t].name).join('、')],
    ['ヒアリング', d.questions.map((q) => QUESTION_LABEL[q].frame).join('、')],
    ['課題', SCENARIOS[c.scenario].problems[d.problem].text],
    ['提案構成', d.services.map((s) => SERVICES[s].name).join('、')],
    ['進め方', APPROACH_LABEL[d.approach].name],
    ['費用', PRICING_LABEL[d.pricing].name],
    ...objs.map((o, i): [string, string] => [`反論：${OBJECTIONS[o].title}`, OBJECTIONS[o].responses[d.responses[i]].text]),
    ['クロージング', CLOSE_LABEL[d.close].name],
  ];
  return `<table class="ledger"><tbody>${rows.map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`).join('')}</tbody></table>`;
}

function report(c: Conditions, d: Decisions, r: DealResult, opts: { player?: string; date?: string } = {}): string {
  const sc = SCENARIOS[c.scenario];
  const model = bestDecisions(c);
  return `<article class="report">
    <div class="report-head">
      <div>
        <div class="label">Deal Close Report</div>
        <h1>案件クローズ報告書</h1>
        <p class="small muted" style="margin:6px 0 0">${esc(sc.company)}／${esc(contactName(c))}${
          opts.player ? `<br>担当：${esc(opts.player)}` : ''
        }${opts.date ? `　${esc(new Date(opts.date).toLocaleString('ja-JP'))}` : ''}</p>
      </div>
      <div class="stamp${r.won ? '' : ' lost'}" role="img" aria-label="${r.won ? '受注' : '失注'}">${r.won ? '受注' : '失注'}</div>
    </div>
    <div class="figures">
      <div><div class="label">Score</div><div class="v">${r.total}<small> /100</small></div></div>
      <div><div class="label">Win Rate</div><div class="v">${r.winProbability}<small> %</small></div></div>
      <div><div class="label">ARR</div><div class="v">${r.won ? yen(r.arr) : '—'}</div></div>
      <div><div class="label">Rank</div><div class="v">${r.rank}</div><div class="small">${esc(r.title)}</div></div>
    </div>
    <table class="ledger bars"><thead><tr><th>評価軸</th><th class="note-col">内容</th><th class="r">点</th><th></th></tr></thead><tbody>
      ${AXES.map(
        ([k, name, note]) =>
          `<tr><th style="color:var(--ink)">${name}</th><td class="small muted note-col">${note}</td><td class="r num">${r.scores[k]}</td>
           <td class="bar"><div class="bar-track"><div class="bar-fill" style="width:${r.scores[k]}%"></div></div></td></tr>`,
      ).join('')}
    </tbody></table>

    <h2 style="margin-top:22px">マネージャーからのフィードバック</h2>
    <ul class="reviews">${r.reviews
      .map((x) => `<li class="${x.tone}"><span class="mk" aria-label="${x.tone}">${MARK[x.tone]}</span><span class="ar">${esc(x.area)}</span><span class="tx">${esc(x.text)}</span></li>`)
      .join('')}</ul>

    <h2 style="margin-top:22px">案件の条件</h2>
    <table class="ledger"><tbody>
      <tr><th>面談相手</th><td>${esc(STANCE_LABEL[c.stance])}</td></tr>
      <tr><th>予算感</th><td>${esc(BUDGET_LABEL[c.budget])}（費用 <span class="num">${r.cost}</span>／予算感 <span class="num">${r.cap}</span>）</td></tr>
      <tr><th>競合</th><td>${esc(COMPETITOR_LABEL[c.competitor])}</td></tr>
      <tr><th>時期</th><td>${esc(URGENCY_LABEL[c.urgency])}</td></tr>
    </tbody></table>

    <details class="model"><summary>あなたの判断</summary>${decisionsTable(c, d)}</details>
    <details class="model"><summary>模範的な進め方（${model.result.total} 点）</summary>
      <p class="small muted">この条件で最も点が高くなる判断の一例です。現実の商談に唯一の正解はありません。</p>
      ${decisionsTable(c, model.decisions)}
    </details>
  </article>`;
}

function renderResultScreen(c: Conditions, s: Session) {
  const v = validateDecisions(s.d);
  if (!v.ok) {
    s.step = 0;
    saveSession();
    renderPlay();
    return;
  }
  const r = simulate(c, v.value);
  app.innerHTML = `${pipeline('result')}${report(c, v.value, r)}
    <section class="sheet save-area" style="margin-top:16px" aria-labelledby="save-title">
      <h2 id="save-title">成績表に記録する</h2>
      <div id="save-body">${saveBody(s)}</div>
    </section>
    <div class="btn-row" style="margin-top:16px">
      <button class="btn secondary" data-act="retry">同じ条件でやり直す</button>
      <button class="btn secondary" data-act="random">別の案件へ</button>
      <a class="btn secondary" href="#/learn">営業の基本を読む</a>
    </div>`;
}

function saveBody(s: Session): string {
  if (s.savedId)
    return `<p>記録しました。<a href="#/deal/${esc(s.savedId)}">記録を見る</a>／<a href="#/board">成績表へ</a></p>`;
  if (!authEnabled())
    return '<p class="notice">ローカル環境（npm run dev）では記録できません。デプロイした環境でお試しください。</p>';
  if (!isLoggedIn())
    return `<p>記録にはログインが必要です（メールアドレスで登録できます）。ログイン後、この画面に戻ります。</p>
      <button class="btn" data-act="login">ログインして記録する</button>`;
  const name = store.get(NAME_KEY) ?? '';
  return `<form class="save-form" id="save-form">
      <label>担当者名（成績表に表示されます）<input type="text" name="playerName" maxlength="20" required value="${esc(name)}"></label>
      <button class="btn" type="submit">記録する</button>
    </form>
    <p class="small muted" style="margin-top:8px">点数はサーバーで計算し直してから保存します。記録は 90 日で自動的に削除されます。</p>
    <p id="save-msg" aria-live="polite"></p>`;
}

async function submitSave(form: HTMLFormElement) {
  if (!session) return;
  const msg = document.getElementById('save-msg')!;
  const playerName = String(new FormData(form).get('playerName') ?? '').trim();
  const v = validateDecisions(session.d);
  if (!playerName || !v.ok) {
    msg.className = 'notice error';
    msg.textContent = '担当者名を入力してください';
    return;
  }
  store.set(NAME_KEY, playerName);
  form.querySelector('button')!.disabled = true;
  try {
    const rec = await saveDeal({ playerName, seed: session.seed, decisions: v.value });
    session.savedId = rec.id;
    saveSession();
    document.getElementById('save-body')!.innerHTML = saveBody(session);
  } catch (err) {
    form.querySelector('button')!.disabled = false;
    msg.className = 'notice error';
    msg.textContent = err instanceof ApiError ? err.message : '記録に失敗しました';
    if (err instanceof ApiError && err.status === 401) renderAccount();
  }
}

// ---------- ホーム ----------

function renderHome() {
  setNav('home');
  const ongoing = session && STEPS[session.step] !== 'result' ? conditionsFromSeed(session.seed) : null;
  app.innerHTML = `<div class="home-grid">
    <section class="home-title">
      <div class="label">AWS Solution Sales Simulator</div>
      <h1>Deal Room</h1>
      <p class="sub">架空の顧客との商談を 1 件、10 分で。<br>AWS ソリューション営業の「考え方」を、判断しながら学びます。</p>
      <p class="memo">高いサービスを並べても受注できません。調べる・聞く・課題を言葉にする・身の丈に合った提案をする・反論に根拠で答える・次の一歩を一緒に決める。評価されるのはその積み重ねです。</p>
      <div class="btn-row" style="margin:18px 0 26px">
        ${ongoing ? `<a class="btn" href="#/play">続きから（${esc(SCENARIOS[ongoing.scenario].company)}）</a>` : ''}
        <button class="btn${ongoing ? ' secondary' : ''}" data-act="random">ランダムな案件で始める</button>
      </div>
      <h2>商談の流れ</h2>
      <ol class="flow-list">
        <li><span>事前調査と同行メンバーを決める</span></li>
        <li><span>ヒアリングで 3 つ質問し、課題を 1 つに絞る</span></li>
        <li><span>サービスの構成と進め方を提案する</span></li>
        <li><span>費用の出し方を決める</span></li>
        <li><span>2 つの反論に答える</span></li>
        <li><span>クロージングで次の一歩を決める</span></li>
      </ol>
    </section>
    <section class="sheet" aria-labelledby="leads-title">
      <div class="label">Open Leads</div>
      <h2 id="leads-title">案件一覧</h2>
      <p class="small muted">案件を選ぶと、面談相手・予算・競合などの条件はランダムに決まります。</p>
      <div class="table-scroll"><table class="ledger"><thead><tr><th>顧客</th><th>業種</th><th></th></tr></thead><tbody>
        ${SCENARIO_IDS.map(
          (id) => `<tr><td><strong>${esc(SCENARIOS[id].company)}</strong><br><span class="small muted">${esc(SCENARIOS[id].employees)}</span></td>
            <td class="small">${esc(SCENARIOS[id].industry)}</td>
            <td class="r"><button class="btn secondary" data-act="start" data-scenario="${id}">担当する</button></td></tr>`,
        ).join('')}
      </tbody></table></div>
    </section>
  </div>`;
}

// ---------- 成績表・記録 ----------

const scenarioName = (id: ScenarioId) => SCENARIOS[id]?.company ?? id;

function dealRows(items: DealSummary[], ranked: boolean): string {
  if (items.length === 0) return '<p class="muted">まだ記録がありません。</p>';
  return `<div class="table-scroll"><table class="ledger"><thead><tr>
    ${ranked ? '<th class="r">#</th>' : ''}<th>担当</th><th>顧客</th><th>結果</th><th class="r">点</th><th class="r">ARR（万円）</th><th>日時</th>
  </tr></thead><tbody>${items
    .map(
      (it, i) => `<tr class="clickable" data-href="#/deal/${esc(it.id)}">
      ${ranked ? `<td class="r num">${i + 1}</td>` : ''}
      <td><a href="#/deal/${esc(it.id)}">${esc(it.playerName)}</a></td>
      <td class="small">${esc(scenarioName(it.scenario))}</td>
      <td><span class="tag ${it.won ? 'won' : 'lost'}">${it.won ? '受注' : '失注'}</span> <span class="num">${esc(it.rank)}</span></td>
      <td class="r num">${esc(it.total)}</td>
      <td class="r num">${it.won ? Number(it.arr).toLocaleString('ja-JP') : '—'}</td>
      <td class="small num">${esc(new Date(it.createdAt).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }))}</td>
    </tr>`,
    )
    .join('')}</tbody></table></div>`;
}

async function renderBoard() {
  setNav('board');
  app.innerHTML = `<h1>成績表</h1>
    <section class="sheet"><h2>上位 10 件</h2><div id="board-top"><p class="muted">読み込み中…</p></div></section>
    ${isLoggedIn() ? '<section class="sheet"><h2>自分の記録</h2><div id="board-mine"><p class="muted">読み込み中…</p></div></section>' : ''}
    <section class="sheet"><h2>最近の商談</h2><div id="board-recent"><p class="muted">読み込み中…</p></div></section>`;
  const fill = async (id: string, load: () => Promise<{ items: DealSummary[] }>, ranked = false) => {
    const el = document.getElementById(id);
    if (!el) return;
    try {
      el.innerHTML = dealRows((await load()).items, ranked);
    } catch (err) {
      el.innerHTML = `<p class="notice error">${esc(err instanceof ApiError ? err.message : '読み込めませんでした')}</p>`;
    }
  };
  await Promise.all([fill('board-top', leaderboard, true), fill('board-recent', () => listDeals(20)), fill('board-mine', listMine)]);
}

async function renderDeal(id: string) {
  setNav('board');
  app.innerHTML = '<p class="muted">読み込み中…</p>';
  try {
    const rec = await getDeal(id);
    const c = conditionsFromSeed(rec.seed);
    app.innerHTML = `${report(c, rec.decisions, rec.result, { player: rec.playerName, date: rec.createdAt })}
      <div class="btn-row" style="margin-top:16px">
        <button class="btn" data-act="challenge" data-seed="${rec.seed}">同じ案件・同じ条件に挑戦する</button>
        <a class="btn secondary" href="#/board">成績表へ戻る</a>
      </div>`;
  } catch (err) {
    app.innerHTML = `<p class="notice error">${esc(err instanceof ApiError ? err.message : '読み込めませんでした')}</p><p><a href="#/board">成績表へ戻る</a></p>`;
  }
}

// ---------- ルーティングとイベント ----------

function route() {
  const hash = location.hash || '#/';
  renderAccount();
  const deal = hash.match(/^#\/deal\/([0-9a-z-]+)$/);
  if (hash === '#/play') renderPlay();
  else if (hash === '#/learn') {
    setNav('learn');
    app.innerHTML = learnPage();
  } else if (hash === '#/board') void renderBoard();
  else if (deal) void renderDeal(deal[1]);
  else renderHome();
  app.focus({ preventScroll: true });
  window.scrollTo(0, 0);
}

document.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  const row = target.closest<HTMLElement>('tr[data-href]');
  if (row && !target.closest('a')) {
    location.hash = row.dataset.href!;
    return;
  }
  const btn = target.closest<HTMLElement>('[data-act]');
  if (!btn) return;
  const act = btn.dataset.act;
  if (act === 'login') void login(location.hash);
  else if (act === 'logout') logout();
  else if (act === 'random') startSession(randomSeed());
  else if (act === 'start') startSession(seedForScenario(btn.dataset.scenario as ScenarioId));
  else if (act === 'challenge') startSession(Number(btn.dataset.seed));
  else if (act === 'retry' && session) startSession(session.seed);
  else if ((act === 'next' || act === 'back') && session) {
    readInputs(session);
    const v = stepView(conditionsFromSeed(session.seed), session);
    if (act === 'next' && !v.ready()) return;
    session.step = Math.max(0, Math.min(STEPS.length - 1, session.step + (act === 'next' ? 1 : -1)));
    saveSession();
    renderPlay();
    app.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }
});

app.addEventListener('change', (e) => {
  const input = e.target as HTMLInputElement;
  if (!session || !input.closest('#step-form')) return;
  readInputs(session);
  saveSession();
  refreshStep(conditionsFromSeed(session.seed), session);
});

app.addEventListener('submit', (e) => {
  const form = e.target as HTMLFormElement;
  if (form.id === 'save-form') {
    e.preventDefault();
    void submitSave(form);
  }
});

window.addEventListener('hashchange', route);

void initAuth().then(route);

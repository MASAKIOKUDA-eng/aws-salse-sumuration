import {
  APPROACH_IDS,
  CLOSE_IDS,
  type Conditions,
  type DealResult,
  type Decisions,
  PICK,
  PRICING_IDS,
  PROBLEM_IDS,
  QUESTION_IDS,
  RESEARCH_IDS,
  RESPONSE_IDS,
  type ResponseId,
  SCENARIO_IDS,
  SERVICE_IDS,
  type ScenarioId,
  type ServiceId,
  TEAM_IDS,
  bestDecisions,
  budgetCap,
  conditionsFromSeed,
  content,
  costOf,
  objectionsFor,
  randomSeed,
  rankOf,
  seedForScenario,
  simulate,
  validateDecisions,
  validateSeed,
} from '../../shared/engine';
import { ApiError, type DealSummary, getDeal, leaderboard, listDeals, listMine, saveDeal } from './api';
import { authEnabled, currentEmail, initAuth, isLoggedIn, login, logout } from './auth';
import { applyStatic, lang, locale, setLang, t } from './i18n';
import { learnPage } from './learn';
// favicon・ヘッダーのマーク。import するとハッシュ付きの名前で出力され、index.html に書き込まれる
import markUrl from './images/mark.svg';

// ---------- 小道具 ----------

const app = document.getElementById('app')!;
document.querySelector<HTMLImageElement>('.brand img')?.setAttribute('src', markUrl);

const esc = (s: unknown) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** 選んだ言語のシナリオ・選択肢の文言 */
const C = () => content(lang());

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

/** フェーズの名前は i18n の phases と同じ並び */
const PHASES: StepId[][] = [
  ['brief', 'research', 'team'],
  ['questions', 'problem'],
  ['services', 'approach'],
  ['pricing'],
  ['objection0', 'objection1'],
  ['close'],
  ['result'],
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

function answerFor(c: Conditions, q: (typeof QUESTION_IDS)[number]): string {
  const base = C().SCENARIOS[c.scenario].answers[q];
  // 条件によって変わる一言を、発言の括弧の中に足す
  const add = (line: string) => t().appendToQuote(base, line);
  if (q === 'budget') return add(t().budgetLine[c.budget]);
  if (q === 'decision') return add(t().competitorLine[c.competitor]);
  if (q === 'timeline') return add(t().urgencyLine[c.urgency]);
  return base;
}

function researchFor(c: Conditions, r: (typeof RESEARCH_IDS)[number]): string {
  const base = C().SCENARIOS[c.scenario].research[r];
  if (r === 'vendor') return t().vendorCompetition(base, C().COMPETITOR_LABEL[c.competitor]);
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
    el.innerHTML = `<span class="muted">${esc(currentEmail() ?? t().loggedIn)}</span><button class="btn link" data-act="logout">${esc(t().logout)}</button>`;
  } else {
    el.innerHTML = `<button class="btn link" data-act="login">${esc(t().loginSignup)}</button>`;
  }
}

function card(c: Conditions): string {
  const sc = C().SCENARIOS[c.scenario];
  const p = sc.contacts[c.stance];
  return `<div class="card" aria-label="${esc(t().cardLabel)}">
    <div><div class="co">${esc(sc.company)}</div><div class="ti">${esc(p.title)}</div></div>
    <div class="na">${esc(p.name)}</div>
    <div class="ad">${esc(sc.industry)}</div>
  </div>`;
}

function contactName(c: Conditions) {
  const p = C().SCENARIOS[c.scenario].contacts[c.stance];
  return t().contact(p.name, p.title);
}

function dealSheet(c: Conditions, s: Session): string {
  const T = C();
  const u = t();
  const sc = T.SCENARIOS[c.scenario];
  const k = known(c, s);
  const unk = `<span class="muted">${esc(u.unknown)}</span>`;
  const notes: string[] = [];
  if (s.step > STEPS.indexOf('research'))
    for (const r of s.d.research ?? [])
      notes.push(`<li><span class="src">${esc(u.srcResearch)}｜${esc(T.RESEARCH_LABEL[r].name)}</span>${esc(researchFor(c, r))}</li>`);
  if (s.step > STEPS.indexOf('questions'))
    for (const q of s.d.questions ?? [])
      notes.push(`<li><span class="src">${esc(u.srcQuestion)}｜${esc(T.QUESTION_LABEL[q].frame)}</span>${esc(answerFor(c, q))}</li>`);
  return `<aside class="dealsheet sheet" aria-label="${esc(u.dealSheetLabel)}">
    <div class="label">Deal Sheet</div>
    <h2>${esc(sc.company)}</h2>
    <table class="ledger"><tbody>
      <tr><th>${esc(u.sheet.industry)}</th><td>${esc(sc.industry)}</td></tr>
      <tr><th>${esc(u.sheet.size)}</th><td>${esc(sc.employees)}</td></tr>
      <tr><th>${esc(u.sheet.contact)}</th><td>${esc(contactName(c))}<br><span class="muted small">${esc(T.STANCE_LABEL[c.stance])}</span></td></tr>
      <tr><th>${esc(u.sheet.budget)}</th><td>${k.budget ? esc(T.BUDGET_LABEL[c.budget]) : unk}</td></tr>
      <tr><th>${esc(u.sheet.competitor)}</th><td>${k.competitor ? esc(T.COMPETITOR_LABEL[c.competitor]) : unk}</td></tr>
      <tr><th>${esc(u.sheet.timeline)}</th><td>${k.urgency ? esc(T.URGENCY_LABEL[c.urgency]) : unk}</td></tr>
    </tbody></table>
    <h3 style="margin-top:14px">${esc(u.learned)}</h3>
    <ul class="notes">${notes.join('') || `<li class="empty">${esc(u.learnedEmpty)}</li>`}</ul>
  </aside>`;
}

function pipeline(step: StepId): string {
  const idx = PHASES.findIndex((p) => p.includes(step));
  return `<ol class="pipeline" aria-label="${esc(t().pipelineLabel)}">${PHASES.map(
    (_, i) => `<li class="${i < idx ? 'done' : i === idx ? 'current' : ''}"${i === idx ? ' aria-current="step"' : ''}>${esc(t().phases[i])}</li>`,
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

const dots = (n: number) => `<span class="cost-dots" aria-label="${esc(t().costDots(n))}">${'■'.repeat(n)}${'□'.repeat(4 - n)}</span>`;

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
  const T = C();
  const S = t().steps;
  const sc = T.SCENARIOS[c.scenario];
  const d = s.d;
  const id = STEPS[s.step];
  const no = String(s.step).padStart(2, '0');
  switch (id) {
    case 'brief':
      return {
        no,
        title: S.brief.title,
        lead: S.brief.lead,
        body: `<div class="sheet" style="margin-bottom:16px">
            <div class="label">Inbound Lead</div>
            <h2>${esc(sc.company)}</h2>
            <p>${esc(sc.summary)}</p>
            <p class="muted small">${esc(sc.industry)}／${esc(sc.employees)}</p>
          </div>
          <h3>${esc(S.brief.meet)}</h3>
          ${card(c)}
          <p class="small muted" style="margin-top:8px">${esc(S.brief.unknownYet(T.STANCE_LABEL[c.stance]))}</p>`,
        coach: S.brief.coach,
        ready: () => true,
      };
    case 'research':
      return {
        no,
        title: S.research.title,
        lead: S.research.lead,
        coach: esc(S.research.coach),
        body: choiceList(
          'research',
          RESEARCH_IDS.map((r) => ({ id: r, title: T.RESEARCH_LABEL[r].name, note: T.RESEARCH_LABEL[r].note })),
          true,
          d.research ?? [],
        ),
        max: { name: 'research', n: PICK.research },
        ready: () => (d.research ?? []).length === PICK.research,
      };
    case 'team':
      return {
        no,
        title: S.team.title,
        lead: S.team.lead,
        coach: esc(S.team.coach),
        body: choiceList(
          'team',
          TEAM_IDS.map((x) => ({ id: x, title: T.TEAM_LABEL[x].name, note: T.TEAM_LABEL[x].note })),
          true,
          d.team ?? [],
        ),
        max: { name: 'team', n: PICK.team },
        ready: () => (d.team ?? []).length === PICK.team,
      };
    case 'questions':
      return {
        no,
        title: S.questions.title,
        lead: S.questions.lead(contactName(c)),
        coach: esc(S.questions.coach),
        body: choiceList(
          'questions',
          QUESTION_IDS.map((q) => ({ id: q, title: t().q(T.QUESTION_LABEL[q].name), note: T.QUESTION_LABEL[q].frame })),
          true,
          d.questions ?? [],
        ),
        max: { name: 'questions', n: PICK.questions },
        ready: () => (d.questions ?? []).length === PICK.questions,
      };
    case 'problem':
      return {
        no,
        title: S.problem.title,
        lead: S.problem.lead,
        coach: esc(S.problem.coach),
        body: `<div class="quote" style="margin-bottom:16px">${
          (d.questions ?? []).map((q) => `<p style="margin-bottom:6px">${esc(answerFor(c, q))}</p>`).join('') || `<p>${esc(S.problem.noNotes)}</p>`
        }<cite>${esc(S.problem.notesCite(contactName(c)))}</cite></div>${choiceList(
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
        title: S.services.title,
        lead: S.services.lead,
        coach: esc(S.services.coach),
        body: choiceList(
          'services',
          SERVICE_IDS.map((sv) => ({
            id: sv,
            title: T.SERVICES[sv].name,
            note: T.SERVICES[sv].summary,
            side: dots(T.SERVICES[sv].cost),
            group: T.SERVICES[sv].category,
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
            <span>${esc(S.services.cost)} <span class="num">${cost}</span></span>
            <span class="track"><span class="fill" style="width:${Math.min(100, (cost / scale) * 100)}%"></span>${
              k.budget ? `<span class="cap" style="left:${(cap / scale) * 100}%" title="${esc(S.services.cap)}"></span>` : ''
            }</span>
            <span>${k.budget ? `${esc(S.services.cap)} <span class="num">${cap}</span>` : `<span class="muted">${esc(S.services.capUnknown)}</span>`}</span>
          </div>`;
        },
      };
    }
    case 'approach':
      return {
        no,
        title: S.approach.title,
        lead: S.approach.lead,
        coach: esc(S.approach.coach),
        body: choiceList(
          'approach',
          APPROACH_IDS.map((a) => ({ id: a, title: T.APPROACH_LABEL[a].name, note: T.APPROACH_LABEL[a].note })),
          false,
          d.approach ? [d.approach] : [],
        ),
        ready: () => !!d.approach,
      };
    case 'pricing':
      return {
        no,
        title: S.pricing.title,
        lead: S.pricing.lead,
        coach: esc(S.pricing.coach),
        body: choiceList(
          'pricing',
          PRICING_IDS.map((p) => ({ id: p, title: T.PRICING_LABEL[p].name, note: T.PRICING_LABEL[p].note })),
          false,
          d.pricing ? [d.pricing] : [],
        ),
        ready: () => !!d.pricing,
      };
    case 'objection0':
    case 'objection1': {
      const i = id === 'objection0' ? 0 : 1;
      const o = T.OBJECTIONS[objectionsFor(c)[i]];
      const cur = d.responses?.[i];
      return {
        no,
        title: S.objection.title(i + 1, o.title),
        lead: S.objection.lead,
        coach: esc(S.objection.coach),
        body: `<blockquote class="quote"><p>${esc(t().q(o.line))}</p><cite>${esc(contactName(c))}</cite></blockquote>${choiceList(
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
        title: S.close.title,
        lead: S.close.lead,
        coach: esc(S.close.coach),
        body: choiceList(
          'close',
          CLOSE_IDS.map((x) => ({ id: x, title: T.CLOSE_LABEL[x].name, note: T.CLOSE_LABEL[x].note })),
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
    if (counter) counter.textContent = t().selected(count, v.max.n);
  }
  const extra = app.querySelector('#step-extra');
  if (extra && v.extra) extra.innerHTML = v.extra();
  const next = app.querySelector<HTMLButtonElement>('[data-act="next"]');
  if (next) next.disabled = !v.ready();
}

function renderPlay() {
  setNav('play');
  if (!session) {
    const u = t();
    app.innerHTML = `<div class="sheet"><h1>${esc(u.playTitle)}</h1><p>${esc(u.noSession)}</p>
      <div class="btn-row"><a class="btn" href="#/">${esc(u.pickLead)}</a><button class="btn secondary" data-act="random">${esc(u.startRandom)}</button></div></div>`;
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
            ${s.step > 0 ? `<button class="btn secondary" data-act="back">${esc(t().back)}</button>` : ''}
            ${v.max ? `<span class="counter"></span>` : ''}
          </div>
          <button class="btn" data-act="next">${esc(s.step === 0 ? t().begin : isLast ? t().finish : t().next)}</button>
        </div>
      </section>
    </div>`;
  refreshStep(c, s);
}

// ---------- 結果 ----------

const MARK = { good: '○', warn: '△', bad: '×' } as const;
const AXES = ['discovery', 'fit', 'commercial', 'trust'] as const;

function decisionsTable(c: Conditions, d: Decisions): string {
  const T = C();
  const u = t();
  const objs = objectionsFor(c);
  const rows: [string, string][] = [
    [u.dt.research, u.list(d.research.map((r) => T.RESEARCH_LABEL[r].name))],
    [u.dt.team, u.list(d.team.map((x) => T.TEAM_LABEL[x].name))],
    [u.dt.questions, u.list(d.questions.map((q) => T.QUESTION_LABEL[q].frame))],
    [u.dt.problem, T.SCENARIOS[c.scenario].problems[d.problem].text],
    [u.dt.services, u.list(d.services.map((s) => T.SERVICES[s].name))],
    [u.dt.approach, T.APPROACH_LABEL[d.approach].name],
    [u.dt.pricing, T.PRICING_LABEL[d.pricing].name],
    ...objs.map((o, i): [string, string] => [u.dt.objection(T.OBJECTIONS[o].title), T.OBJECTIONS[o].responses[d.responses[i]].text]),
    [u.dt.close, T.CLOSE_LABEL[d.close].name],
  ];
  return `<table class="ledger"><tbody>${rows.map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`).join('')}</tbody></table>`;
}

function report(c: Conditions, d: Decisions, r: DealResult, opts: { player?: string; date?: string } = {}): string {
  const T = C();
  const u = t();
  const R = u.report;
  const sc = T.SCENARIOS[c.scenario];
  const model = bestDecisions(c);
  const stamp = r.won ? R.won : R.lost;
  return `<article class="report">
    <div class="report-head">
      <div>
        <div class="label">Deal Close Report</div>
        <h1>${esc(R.title)}</h1>
        <p class="small muted" style="margin:6px 0 0">${esc(sc.company)} / ${esc(contactName(c))}${
          opts.player ? `<br>${esc(R.owner(opts.player))}` : ''
        }${opts.date ? `　${esc(new Date(opts.date).toLocaleString(locale()))}` : ''}</p>
      </div>
      <div class="stamp${r.won ? '' : ' lost'}" role="img" aria-label="${esc(stamp)}">${esc(stamp)}</div>
    </div>
    <div class="figures">
      <div><div class="label">Score</div><div class="v">${r.total}<small> /100</small></div></div>
      <div><div class="label">Win Rate</div><div class="v">${r.winProbability}<small> %</small></div></div>
      <div><div class="label">ARR</div><div class="v">${r.won ? u.yen(r.arr) : '—'}</div></div>
      <div><div class="label">Rank</div><div class="v">${r.rank}</div><div class="small">${esc(r.title)}</div></div>
    </div>
    <table class="ledger bars"><thead><tr><th>${esc(R.axis)}</th><th class="note-col">${esc(R.detail)}</th><th class="r">${esc(R.points)}</th><th></th></tr></thead><tbody>
      ${AXES.map(
        (k) =>
          `<tr><th style="color:var(--ink)">${esc(u.axes[k][0])}</th><td class="small muted note-col">${esc(u.axes[k][1])}</td><td class="r num">${r.scores[k]}</td>
           <td class="bar"><div class="bar-track"><div class="bar-fill" style="width:${r.scores[k]}%"></div></div></td></tr>`,
      ).join('')}
    </tbody></table>

    <h2 style="margin-top:22px">${esc(R.feedback)}</h2>
    <ul class="reviews">${r.reviews
      .map((x) => `<li class="${x.tone}"><span class="mk" aria-label="${x.tone}">${MARK[x.tone]}</span><span class="ar">${esc(x.area)}</span><span class="tx">${esc(x.text)}</span></li>`)
      .join('')}</ul>

    <h2 style="margin-top:22px">${esc(R.conditions)}</h2>
    <table class="ledger"><tbody>
      <tr><th>${esc(u.sheet.contact)}</th><td>${esc(T.STANCE_LABEL[c.stance])}</td></tr>
      <tr><th>${esc(u.sheet.budget)}</th><td>${R.budgetVsCost(esc(T.BUDGET_LABEL[c.budget]), r.cost, r.cap)}</td></tr>
      <tr><th>${esc(u.sheet.competitor)}</th><td>${esc(T.COMPETITOR_LABEL[c.competitor])}</td></tr>
      <tr><th>${esc(u.sheet.timeline)}</th><td>${esc(T.URGENCY_LABEL[c.urgency])}</td></tr>
    </tbody></table>

    <details class="model"><summary>${esc(R.yours)}</summary>${decisionsTable(c, d)}</details>
    <details class="model"><summary>${esc(R.model(model.result.total))}</summary>
      <p class="small muted">${esc(R.modelNote)}</p>
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
  const r = simulate(c, v.value, lang());
  const u = t().result;
  app.innerHTML = `${pipeline('result')}${report(c, v.value, r)}
    <section class="sheet save-area" style="margin-top:16px" aria-labelledby="save-title">
      <h2 id="save-title">${esc(u.saveTitle)}</h2>
      <div id="save-body">${saveBody(s)}</div>
    </section>
    <div class="btn-row" style="margin-top:16px">
      <button class="btn secondary" data-act="retry">${esc(u.retry)}</button>
      <button class="btn secondary" data-act="random">${esc(u.another)}</button>
      <a class="btn secondary" href="#/learn">${esc(u.readLearn)}</a>
    </div>`;
}

function saveBody(s: Session): string {
  const u = t().result;
  if (s.savedId)
    return `<p>${esc(u.saved)} <a href="#/deal/${esc(s.savedId)}">${esc(u.viewRecord)}</a> / <a href="#/board">${esc(u.toBoard)}</a></p>`;
  if (!authEnabled()) return `<p class="notice">${esc(u.local)}</p>`;
  if (!isLoggedIn())
    return `<p>${esc(u.needLogin)}</p>
      <button class="btn" data-act="login">${esc(u.loginToSave)}</button>`;
  const name = store.get(NAME_KEY) ?? '';
  return `<form class="save-form" id="save-form">
      <label>${esc(u.playerName)}<input type="text" name="playerName" maxlength="20" required value="${esc(name)}"></label>
      <button class="btn" type="submit">${esc(u.save)}</button>
    </form>
    <p class="small muted" style="margin-top:8px">${esc(u.saveNote)}</p>
    <p id="save-msg" aria-live="polite"></p>`;
}

async function submitSave(form: HTMLFormElement) {
  if (!session) return;
  const msg = document.getElementById('save-msg')!;
  const playerName = String(new FormData(form).get('playerName') ?? '').trim();
  const v = validateDecisions(session.d);
  if (!playerName || !v.ok) {
    msg.className = 'notice error';
    msg.textContent = t().result.enterName;
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
    msg.textContent = err instanceof ApiError ? err.message : t().result.saveFailed;
    if (err instanceof ApiError && err.status === 401) renderAccount();
  }
}

// ---------- ホーム ----------

function renderHome() {
  setNav('home');
  const ongoing = session && STEPS[session.step] !== 'result' ? conditionsFromSeed(session.seed) : null;
  const SC = C().SCENARIOS;
  const h = t().home;
  app.innerHTML = `<div class="home-grid">
    <section class="home-title">
      <div class="label">AWS Solution Sales Simulator</div>
      <h1>Deal Room</h1>
      <p class="sub">${h.sub}</p>
      <p class="memo">${esc(h.memo)}</p>
      <div class="btn-row" style="margin:18px 0 26px">
        ${ongoing ? `<a class="btn" href="#/play">${esc(h.resume(SC[ongoing.scenario].company))}</a>` : ''}
        <button class="btn${ongoing ? ' secondary' : ''}" data-act="random">${esc(t().startRandom)}</button>
      </div>
      <h2>${esc(h.flowTitle)}</h2>
      <ol class="flow-list">
        ${h.flow.map((x) => `<li><span>${esc(x)}</span></li>`).join('')}
      </ol>
    </section>
    <section class="sheet" aria-labelledby="leads-title">
      <div class="label">Open Leads</div>
      <h2 id="leads-title">${esc(h.leadsTitle)}</h2>
      <p class="small muted">${esc(h.leadsNote)}</p>
      <div class="table-scroll"><table class="ledger"><thead><tr><th>${esc(h.customer)}</th><th>${esc(h.industry)}</th><th></th></tr></thead><tbody>
        ${SCENARIO_IDS.map(
          (id) => `<tr><td><strong>${esc(SC[id].company)}</strong><br><span class="small muted">${esc(SC[id].employees)}</span></td>
            <td class="small">${esc(SC[id].industry)}</td>
            <td class="r"><button class="btn secondary" data-act="start" data-scenario="${id}">${esc(h.take)}</button></td></tr>`,
        ).join('')}
      </tbody></table></div>
    </section>
  </div>`;
}

// ---------- 成績表・記録 ----------

const scenarioName = (id: ScenarioId) => C().SCENARIOS[id]?.company ?? id;

function dealRows(items: DealSummary[], ranked: boolean): string {
  const u = t();
  const B = u.board;
  if (items.length === 0) return `<p class="muted">${esc(B.empty)}</p>`;
  return `<div class="table-scroll"><table class="ledger"><thead><tr>
    ${ranked ? '<th class="r">#</th>' : ''}<th>${esc(B.player)}</th><th>${esc(B.customer)}</th><th>${esc(B.result)}</th><th class="r">${esc(B.points)}</th><th class="r">${esc(u.arrHead)}</th><th>${esc(B.date)}</th>
  </tr></thead><tbody>${items
    .map(
      (it, i) => `<tr class="clickable" data-href="#/deal/${esc(it.id)}">
      ${ranked ? `<td class="r num">${i + 1}</td>` : ''}
      <td><a href="#/deal/${esc(it.id)}">${esc(it.playerName)}</a></td>
      <td class="small">${esc(scenarioName(it.scenario))}</td>
      <td><span class="tag ${it.won ? 'won' : 'lost'}">${esc(it.won ? u.report.won : u.report.lost)}</span> <span class="num">${esc(it.rank)}</span></td>
      <td class="r num">${esc(it.total)}</td>
      <td class="r num">${it.won ? esc(u.arrCell(Number(it.arr))) : '—'}</td>
      <td class="small num">${esc(new Date(it.createdAt).toLocaleString(locale(), { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }))}</td>
    </tr>`,
    )
    .join('')}</tbody></table></div>`;
}

async function renderBoard() {
  setNav('board');
  const B = t().board;
  const loading = `<p class="muted">${esc(B.loading)}</p>`;
  app.innerHTML = `<h1>${esc(B.title)}</h1>
    <section class="sheet"><h2>${esc(B.top)}</h2><div id="board-top">${loading}</div></section>
    ${isLoggedIn() ? `<section class="sheet"><h2>${esc(B.mine)}</h2><div id="board-mine">${loading}</div></section>` : ''}
    <section class="sheet"><h2>${esc(B.recent)}</h2><div id="board-recent">${loading}</div></section>`;
  const fill = async (id: string, load: () => Promise<{ items: DealSummary[] }>, ranked = false) => {
    const el = document.getElementById(id);
    if (!el) return;
    try {
      el.innerHTML = dealRows((await load()).items, ranked);
    } catch (err) {
      el.innerHTML = `<p class="notice error">${esc(err instanceof ApiError ? err.message : B.loadFailed)}</p>`;
    }
  };
  await Promise.all([fill('board-top', leaderboard, true), fill('board-recent', () => listDeals(20)), fill('board-mine', listMine)]);
}

async function renderDeal(id: string) {
  setNav('board');
  const B = t().board;
  app.innerHTML = `<p class="muted">${esc(B.loading)}</p>`;
  try {
    const rec = await getDeal(id);
    const c = conditionsFromSeed(rec.seed);
    // 保存された結果のフィードバックは日本語のため、日本語以外では判断内容から文章だけ作り直す（点数は保存値）
    const result: DealResult =
      lang() === 'ja'
        ? rec.result
        : { ...rec.result, reviews: simulate(c, rec.decisions, lang()).reviews, title: rankOf(rec.result.total, lang()).title };
    app.innerHTML = `${report(c, rec.decisions, result, { player: rec.playerName, date: rec.createdAt })}
      <div class="btn-row" style="margin-top:16px">
        <button class="btn" data-act="challenge" data-seed="${rec.seed}">${esc(B.challenge)}</button>
        <a class="btn secondary" href="#/board">${esc(B.backToBoard)}</a>
      </div>`;
  } catch (err) {
    app.innerHTML = `<p class="notice error">${esc(err instanceof ApiError ? err.message : B.loadFailed)}</p><p><a href="#/board">${esc(B.backToBoard)}</a></p>`;
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
    app.innerHTML = learnPage(lang());
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
  if (act === 'lang') {
    setLang(lang() === 'ja' ? 'en' : 'ja');
    route();
  } else if (act === 'login') void login(location.hash);
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

applyStatic();
void initAuth().then(route);

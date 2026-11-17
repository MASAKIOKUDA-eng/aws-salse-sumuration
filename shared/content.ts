/**
 * 言語ごとの文言をまとめて返す。点数・重み・費用は scenarios.ts の値をそのまま使い、
 * 英語版は scenarios.en.ts の文章だけを重ねる（採点モデルを言語ごとに二重管理しない）。
 */
import {
  APPROACH_LABEL,
  BUDGET_LABEL,
  CLOSE_LABEL,
  COMPETITOR_LABEL,
  OBJECTIONS,
  type ObjectionId,
  type ObjectionInfo,
  PRICING_LABEL,
  QUESTION_LABEL,
  RESEARCH_LABEL,
  type ResponseId,
  SCENARIOS,
  SERVICES,
  STANCE_LABEL,
  type ScenarioId,
  type ScenarioInfo,
  type ServiceId,
  type ServiceInfo,
  TEAM_LABEL,
  URGENCY_LABEL,
} from './scenarios';
import {
  APPROACH_LABEL_EN,
  BUDGET_LABEL_EN,
  CLOSE_LABEL_EN,
  COMPETITOR_LABEL_EN,
  OBJECTIONS_EN,
  PRICING_LABEL_EN,
  QUESTION_LABEL_EN,
  RESEARCH_LABEL_EN,
  SCENARIOS_EN,
  SERVICES_EN,
  STANCE_LABEL_EN,
  TEAM_LABEL_EN,
  URGENCY_LABEL_EN,
} from './scenarios.en';

export const LANGS = ['ja', 'en'] as const;
export type Lang = (typeof LANGS)[number];

export const isLang = (v: unknown): v is Lang => typeof v === 'string' && (LANGS as readonly string[]).includes(v);

const JA = {
  SERVICES,
  RESEARCH_LABEL,
  TEAM_LABEL,
  QUESTION_LABEL,
  APPROACH_LABEL,
  PRICING_LABEL,
  CLOSE_LABEL,
  STANCE_LABEL,
  BUDGET_LABEL,
  COMPETITOR_LABEL,
  URGENCY_LABEL,
  OBJECTIONS,
  SCENARIOS,
};

export type Content = typeof JA;

const mapValues = <K extends string, A, B>(o: Record<K, A>, f: (v: A, k: K) => B): Record<K, B> =>
  Object.fromEntries((Object.entries(o) as [K, A][]).map(([k, v]) => [k, f(v, k)])) as Record<K, B>;

const EN: Content = {
  SERVICES: mapValues(SERVICES, (s, id: ServiceId): ServiceInfo => ({ ...s, ...SERVICES_EN[id] })),
  RESEARCH_LABEL: RESEARCH_LABEL_EN,
  TEAM_LABEL: TEAM_LABEL_EN,
  QUESTION_LABEL: QUESTION_LABEL_EN,
  APPROACH_LABEL: APPROACH_LABEL_EN,
  PRICING_LABEL: PRICING_LABEL_EN,
  CLOSE_LABEL: CLOSE_LABEL_EN,
  STANCE_LABEL: STANCE_LABEL_EN,
  BUDGET_LABEL: BUDGET_LABEL_EN,
  COMPETITOR_LABEL: COMPETITOR_LABEL_EN,
  URGENCY_LABEL: URGENCY_LABEL_EN,
  OBJECTIONS: mapValues(OBJECTIONS, (o, id: ObjectionId): ObjectionInfo => {
    const t = OBJECTIONS_EN[id];
    return {
      title: t.title,
      line: t.line,
      responses: mapValues(o.responses, (r, rid: ResponseId) => ({ score: r.score, ...t.responses[rid] })),
    };
  }),
  SCENARIOS: mapValues(SCENARIOS, (s, id: ScenarioId): ScenarioInfo => {
    const t = SCENARIOS_EN[id];
    return {
      ...s,
      company: t.company,
      industry: t.industry,
      employees: t.employees,
      summary: t.summary,
      contacts: t.contacts,
      research: t.research,
      answers: t.answers,
      problems: mapValues(s.problems, (p, pid) => ({ score: p.score, text: t.problems[pid] })),
      coreLabels: t.coreLabels,
    };
  }),
};

export function content(lang: Lang = 'ja'): Content {
  return lang === 'en' ? EN : JA;
}

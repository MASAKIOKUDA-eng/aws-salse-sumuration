import { describe, expect, it } from 'vitest';
import {
  BUDGETS,
  COMPETITORS,
  type Conditions,
  type Decisions,
  SCENARIO_IDS,
  STANCES,
  URGENCIES,
  bestDecisions,
  content,
  rankOf,
  simulate,
} from '../shared/engine';

const JAPANESE = /[぀-ヿ㐀-鿿！-｠]/;

/** オブジェクトに含まれる文字列をすべて集める */
function strings(v: unknown, path = ''): [string, string][] {
  if (typeof v === 'string') return [[path, v]];
  if (Array.isArray(v)) return v.flatMap((x, i) => strings(x, `${path}[${i}]`));
  if (v && typeof v === 'object') return Object.entries(v).flatMap(([k, x]) => strings(x, path ? `${path}.${k}` : k));
  return [];
}

const allConditions: Conditions[] = SCENARIO_IDS.flatMap((scenario) =>
  STANCES.flatMap((stance) =>
    BUDGETS.flatMap((budget) =>
      COMPETITORS.flatMap((competitor) => URGENCIES.map((urgency) => ({ scenario, stance, budget, competitor, urgency }))),
    ),
  ),
);

const naive: Decisions = {
  research: ['hiring', 'case'],
  team: ['specialist', 'proserve'],
  questions: ['budget', 'timeline', 'constraint'],
  problem: 'd',
  services: ['sagemaker', 'workspaces', 'connect', 'aurora', 'ec2'],
  approach: 'bigbang',
  pricing: 'discount',
  responses: ['b', 'b'],
  close: 'pressure',
};

describe('英語版の文言', () => {
  it('すべての文言が空でなく、日本語が混ざっていない', () => {
    const list = strings(content('en'));
    expect(list.length).toBeGreaterThan(200);
    for (const [path, text] of list) {
      expect(text.trim(), path).not.toBe('');
      expect(text, path).not.toMatch(JAPANESE);
    }
  });

  it('文言の項目は日本語版と同じ構造（点数・重みは共通）', () => {
    const shape = (v: unknown) => strings(v).map(([p]) => p).sort();
    expect(shape(content('en'))).toEqual(shape(content('ja')));
    for (const id of SCENARIO_IDS) {
      const ja = content('ja').SCENARIOS[id];
      const en = content('en').SCENARIOS[id];
      expect(en.weights).toBe(ja.weights);
      expect(en.baseArr).toBe(ja.baseArr);
      expect(Object.values(en.problems).map((p) => p.score)).toEqual(Object.values(ja.problems).map((p) => p.score));
    }
  });
});

describe('英語版の採点', () => {
  it('点数・受注・ARR は言語によらず同じで、フィードバックは英語', () => {
    for (const c of allConditions) {
      for (const d of [naive, bestDecisions(c).decisions]) {
        const ja = simulate(c, d);
        const en = simulate(c, d, 'en');
        const { reviews: rj, title: tj, ...numJa } = ja;
        const { reviews: re, title: te, ...numEn } = en;
        expect(numEn).toEqual(numJa);
        expect(re.map((r) => r.tone)).toEqual(rj.map((r) => r.tone));
        expect(te).toBe(rankOf(en.total, 'en').title);
        expect(tj).toBe(rankOf(ja.total).title);
        for (const r of re) {
          expect(r.area).not.toMatch(JAPANESE);
          expect(r.text).not.toMatch(JAPANESE);
        }
      }
    }
  });

  it('言語を指定しなければ日本語（サーバーが保存する内容は変わらない）', () => {
    const c = allConditions[0];
    expect(simulate(c, naive)).toEqual(simulate(c, naive, 'ja'));
    expect(simulate(c, naive).reviews[0].text).toMatch(JAPANESE);
  });
});

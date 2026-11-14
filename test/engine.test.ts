import { describe, expect, it } from 'vitest';
import {
  BUDGETS,
  COMPETITORS,
  type Conditions,
  type Decisions,
  OBJECTIONS,
  SCENARIOS,
  SCENARIO_IDS,
  STANCES,
  URGENCIES,
  bestDecisions,
  conditionsFromSeed,
  objectionsFor,
  seedForScenario,
  serviceFit,
  simulate,
  validateDecisions,
  validateSeed,
} from '../shared/engine';

const base: Conditions = { scenario: 'retail', stance: 'cto', budget: 'normal', competitor: 'none', urgency: 'low' };

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

const allConditions: Conditions[] = SCENARIO_IDS.flatMap((scenario) =>
  STANCES.flatMap((stance) =>
    BUDGETS.flatMap((budget) =>
      COMPETITORS.flatMap((competitor) => URGENCIES.map((urgency) => ({ scenario, stance, budget, competitor, urgency }))),
    ),
  ),
);

describe('条件', () => {
  it('同じシードなら同じ条件になる', () => {
    expect(conditionsFromSeed(12345)).toEqual(conditionsFromSeed(12345));
  });
  it('指定したシナリオのシードを探せる', () => {
    for (const s of SCENARIO_IDS) expect(conditionsFromSeed(seedForScenario(s, 1)).scenario).toBe(s);
  });
  it('シードの検証', () => {
    expect(validateSeed(1)).toBe(true);
    expect(validateSeed(0)).toBe(false);
    expect(validateSeed(1.5)).toBe(false);
    expect(validateSeed('1')).toBe(false);
  });
  it('反論は必ず 2 つの異なるもので、競合があれば競合由来が先', () => {
    for (const c of allConditions) {
      const [a, b] = objectionsFor(c);
      expect(a).not.toBe(b);
      expect(OBJECTIONS[a]).toBeDefined();
      expect(OBJECTIONS[b]).toBeDefined();
    }
    expect(objectionsFor({ ...base, competitor: 'othercloud' })[0]).toBe('price');
    expect(objectionsFor({ ...base, competitor: 'onprem' })[0]).toBe('onprem');
  });
});

describe('採点', () => {
  it('どの条件でも、最良の判断は受注・90 点以上', () => {
    for (const c of allConditions) {
      const { result } = bestDecisions(c);
      expect(result.total).toBeGreaterThanOrEqual(90);
      expect(result.won).toBe(true);
      expect(result.arr).toBeGreaterThan(0);
    }
  });
  it('的外れな判断は失注し、ランク D', () => {
    const r = simulate(base, naive);
    expect(r.won).toBe(false);
    expect(r.arr).toBe(0);
    expect(r.rank).toBe('D');
  });
  it('点数は 0〜100 の範囲', () => {
    for (const c of allConditions.slice(0, 40)) {
      for (const d of [naive, bestDecisions(c).decisions]) {
        const r = simulate(c, d);
        for (const v of [r.total, r.winProbability, ...Object.values(r.scores)]) {
          expect(v).toBeGreaterThanOrEqual(0);
          expect(v).toBeLessThanOrEqual(100);
        }
      }
    }
  });
  it('「困りごと」を聞かないと指摘される', () => {
    const r = simulate(base, naive);
    expect(r.reviews.some((x) => x.area === 'ヒアリング' && x.tone === 'bad')).toBe(true);
  });
  it('関係の薄いサービスを足すと提案の点が下がる', () => {
    const good = serviceFit(base, ['ecs', 'aurora', 'cloudfront', 'dms', 'backup']);
    const noisy = serviceFit(base, ['ecs', 'aurora', 'cloudfront', 'connect', 'workspaces']);
    expect(good.score).toBe(100);
    expect(noisy.score).toBeLessThan(good.score);
    expect(noisy.extra).toEqual(['connect', 'workspaces']);
  });
  it('PoC の段階で長期利用の約束を求めると経済性が下がる', () => {
    const c: Conditions = { ...base, scenario: 'manufacturing' };
    const d = bestDecisions(c).decisions;
    const a = simulate(c, { ...d, approach: 'poc', pricing: 'ondemand' });
    const b = simulate(c, { ...d, approach: 'poc', pricing: 'savings' });
    expect(b.scores.commercial).toBeLessThan(a.scores.commercial);
  });
  it('予算を超える構成は経済性が下がる', () => {
    const c: Conditions = { ...base, budget: 'tight' };
    const d = bestDecisions(c).decisions;
    const over = simulate(c, { ...d, services: ['ec2', 'aurora', 'cloudfront', 'sagemaker', 'dms'] });
    expect(over.cost).toBeGreaterThan(over.cap);
    expect(over.scores.commercial).toBeLessThan(simulate(c, d).scores.commercial);
  });
  it('各シナリオに満点の課題がちょうど 1 つある', () => {
    for (const s of SCENARIO_IDS) expect(Object.values(SCENARIOS[s].problems).filter((p) => p.score === 100)).toHaveLength(1);
  });
});

describe('入力検証', () => {
  it('正しい判断は通る', () => {
    expect(validateDecisions(naive).ok).toBe(true);
  });
  it('個数・重複・未知の値を拒否する', () => {
    expect(validateDecisions({ ...naive, research: ['ir'] }).ok).toBe(false);
    expect(validateDecisions({ ...naive, team: ['sa', 'sa'] }).ok).toBe(false);
    expect(validateDecisions({ ...naive, services: ['ec2', 'ecs', 'lambda', 's3', 'aurora', 'dynamodb'] }).ok).toBe(false);
    expect(validateDecisions({ ...naive, services: ['ec2', 'mainframe'] }).ok).toBe(false);
    expect(validateDecisions({ ...naive, responses: ['a'] }).ok).toBe(false);
    expect(validateDecisions({ ...naive, problem: 'z' }).ok).toBe(false);
    expect(validateDecisions(null).ok).toBe(false);
    expect(validateDecisions([]).ok).toBe(false);
  });
});

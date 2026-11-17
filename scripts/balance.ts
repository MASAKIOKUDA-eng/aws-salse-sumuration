// 難易度の確認：条件の全組み合わせについて、最高点とランダムな判断の分布を出す
//   npm run balance
import {
  APPROACH_IDS,
  BUDGETS,
  CLOSE_IDS,
  COMPETITORS,
  type Conditions,
  type Decisions,
  PRICING_IDS,
  PROBLEM_IDS,
  QUESTION_IDS,
  RESEARCH_IDS,
  RESPONSE_IDS,
  SCENARIO_IDS,
  SERVICE_IDS,
  STANCES,
  TEAM_IDS,
  URGENCIES,
  bestDecisions,
  simulate,
} from '../shared/engine';

const TRIALS = Number(process.argv[2] ?? 3000);
const one = <T>(l: readonly T[]) => l[Math.floor(Math.random() * l.length)];
const some = <T>(l: readonly T[], k: number) => [...l].sort(() => Math.random() - 0.5).slice(0, k);

function randomDecisions(): Decisions {
  return {
    research: some(RESEARCH_IDS, 2),
    team: some(TEAM_IDS, 2),
    questions: some(QUESTION_IDS, 3),
    problem: one(PROBLEM_IDS),
    services: some(SERVICE_IDS, 1 + Math.floor(Math.random() * 5)),
    approach: one(APPROACH_IDS),
    pricing: one(PRICING_IDS),
    responses: [one(RESPONSE_IDS), one(RESPONSE_IDS)],
    close: one(CLOSE_IDS),
  };
}

const rows: string[] = [];
for (const scenario of SCENARIO_IDS) {
  const bests: number[] = [];
  const totals: number[] = [];
  let wins = 0;
  let n = 0;
  for (const stance of STANCES)
    for (const budget of BUDGETS)
      for (const competitor of COMPETITORS)
        for (const urgency of URGENCIES) {
          const c: Conditions = { scenario, stance, budget, competitor, urgency };
          bests.push(bestDecisions(c).result.total);
          for (let i = 0; i < TRIALS / 10; i++) {
            const r = simulate(c, randomDecisions());
            totals.push(r.total);
            if (r.won) wins++;
            n++;
          }
        }
  totals.sort((a, b) => a - b);
  const q = (p: number) => totals[Math.floor(totals.length * p)];
  rows.push(
    `${scenario.padEnd(14)} best ${Math.min(...bests)}-${Math.max(...bests)}  random p10 ${q(0.1)} / median ${q(0.5)} / p90 ${q(0.9)}  random win ${((wins / n) * 100).toFixed(1)}%`,
  );
}
console.log(rows.join('\n'));

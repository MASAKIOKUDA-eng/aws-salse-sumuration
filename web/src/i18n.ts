/**
 * 画面の言語（日本語・英語）。選んだ言語はブラウザに保存し、初回はブラウザの言語設定に合わせる。
 * シナリオの文章は shared/content.ts、採点のフィードバックは shared/engine.ts が言語ごとに返す。
 */
import { type Budget, type Competitor, type Lang, type Urgency, isLang } from '../../shared/engine';

const KEY = 'dealroom.lang';

function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(KEY);
    if (isLang(saved)) return saved;
  } catch {
    // ストレージが使えない環境ではブラウザの設定に従う
  }
  const nav = typeof navigator !== 'undefined' ? navigator.language : 'ja';
  return /^ja\b/i.test(nav) ? 'ja' : 'en';
}

let current: Lang = initialLang();

export const lang = (): Lang => current;
export const locale = () => (current === 'ja' ? 'ja-JP' : 'en-US');
export const t = () => UI[current];

export function setLang(next: Lang) {
  current = next;
  try {
    localStorage.setItem(KEY, next);
  } catch {
    // 保存できなくても、開いている間は切り替わる
  }
  applyStatic();
}

/** index.html に書かれた固定の文言（ナビ・フッターなど）を、選んだ言語に置き換える */
export function applyStatic() {
  const s = UI[current].static;
  document.documentElement.lang = current;
  document.title = s.title;
  document.querySelector('meta[name="description"]')?.setAttribute('content', s.description);
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    const key = el.dataset.i18n as keyof typeof s;
    if (key in s) el.textContent = s[key];
  });
  document.querySelector('.nav')?.setAttribute('aria-label', s.navLabel);
  const toggle = document.querySelector<HTMLButtonElement>('[data-act="lang"]');
  if (toggle) {
    toggle.textContent = s.switchTo;
    toggle.setAttribute('lang', current === 'ja' ? 'en' : 'ja');
    toggle.setAttribute('aria-label', s.switchLabel);
  }
}

const JA = {
  static: {
    title: 'Deal Room | AWS ソリューション営業 商談シミュレーター',
    description:
      '架空の顧客との商談を通して、AWS ソリューション営業の考え方（ヒアリング・提案・費用・反論処理・クロージング）を学ぶシミュレーター。',
    skip: '本文へ移動',
    navLabel: 'メイン',
    navHome: '案件一覧',
    navPlay: '商談',
    navLearn: '営業の基本',
    navBoard: '成績表',
    footer:
      'JAWS-UG Sales 支部 × 彩の国埼玉支部 English LT Night（2026-11-20）向けの学習用シミュレーターです。登場する企業・人物は架空で、採点は考え方を学ぶための簡略モデルです。AWS の公式見解ではありません。',
    switchTo: 'English',
    switchLabel: 'Switch to English',
  },
  q: (s: string) => `「${s}」`,
  /** 発言の閉じ括弧の前に一言足す */
  appendToQuote: (base: string, line: string) => base.replace(/」$/, `${line}」`),
  budgetLine: {
    tight: '正直なところ、予算はかなり厳しいです。',
    normal: '相場の範囲であれば検討できます。',
    ample: '効果が見込めるなら、予算は確保できます。',
  } as Record<Budget, string>,
  competitorLine: {
    none: '今のところ、他社とは話していません。',
    onprem: '既存の SI さんからは、サーバー更改の見積もりをもらっています。',
    othercloud: '実は、他社クラウドの提案も受けています。',
  } as Record<Competitor, string>,
  urgencyLine: {
    low: '半年から 1 年かけて、慎重に進めたいと考えています。',
    high: 'できるだけ早く、3 か月以内には動き出したいです。',
  } as Record<Urgency, string>,
  vendorCompetition: (base: string, label: string) => `${base} 競合の状況：${label}。`,
  yen: (man: number) => `${man.toLocaleString('ja-JP')}<small> 万円/年</small>`,
  arrHead: 'ARR（万円）',
  arrCell: (man: number) => man.toLocaleString('ja-JP'),
  phases: ['準備', 'ヒアリング', '提案', '見積', '交渉', 'クロージング', '結果'],
  pipelineLabel: '商談フェーズ',
  loggedIn: 'ログイン中',
  logout: 'ログアウト',
  loginSignup: 'ログイン / 新規登録',
  cardLabel: '名刺',
  contact: (name: string, title: string) => `${name}（${title}）`,
  dealSheetLabel: '案件シート',
  unknown: '未確認',
  srcResearch: '調査',
  srcQuestion: 'ヒアリング',
  sheet: { industry: '業種', size: '規模', contact: '面談相手', budget: '予算感', competitor: '競合', timeline: '時期' },
  learned: '分かったこと',
  learnedEmpty: 'まだありません。調査とヒアリングで書き込まれます。',
  costDots: (n: number) => `費用 ${n}`,
  steps: {
    brief: {
      title: '案件の概要',
      lead: 'インバウンドの問い合わせから、初回の商談が決まりました。あなたは AWS のアカウントマネージャーです。',
      meet: '面談の相手',
      unknownYet: (stance: string) => `${stance}。予算・競合・時期は、まだ分かっていません。`,
      coach:
        '<strong>この商談で評価されること</strong>：顧客理解 25%・提案の適合 30%・経済性 20%・信頼構築 25%。高いサービスを並べるほど良いわけではありません。',
    },
    research: {
      title: '事前調査',
      lead: '商談の前に、何を調べておきますか。時間が限られているため 2 つだけ選べます。',
      coach:
        '公開情報から「顧客が何に投資しようとしているか」「今のシステムを誰がいつまで支えるか」をつかむと、提案のタイミングが見えてきます。',
    },
    team: {
      title: '同行メンバー',
      lead: '初回の商談に誰を連れて行きますか。2 人まで選べます。',
      coach:
        'アカウントマネージャーは「顧客との関係と商談全体」の責任者です。技術・専門領域・構築・大規模移行は、それぞれ得意なメンバーに任せます。',
    },
    questions: {
      title: 'ヒアリング',
      lead: (contact: string) => `${contact}との面談時間は 30 分。聞けるのは 3 つです。`,
      coach:
        '予算（Budget）・決裁（Authority）・ニーズ（Need）・時期（Timeline）を確かめる BANT は基本の型です。答えは右の案件シートに書き込まれ、後の判断の材料になります。',
    },
    problem: {
      title: '課題の整理',
      lead: 'ヒアリングの内容から、この顧客の「本当の課題」を 1 つに絞ってください。提案はここから組み立てます。',
      coach:
        '「サーバーが古い」は症状です。それによって事業に何が起きているか（売上・稼働率・事業継続）まで言えると、決裁者に届く提案になります。',
      noNotes: '（ヒアリングの記録はありません）',
      notesCite: (contact: string) => `${contact}との面談メモ`,
    },
    services: {
      title: '提案の構成',
      lead: '課題を解くために提案するサービスを選んでください（1〜5 つ）。',
      coach:
        'まず課題を解くのに欠かせない部品を揃え、次に運用や移行を楽にする部品を足します。関係の薄いサービスは提案の焦点をぼかします。',
      cost: '構成の費用',
      cap: '予算感',
      capUnknown: '予算感は未確認',
    },
    approach: {
      title: '進め方',
      lead: 'どのように導入を進める提案にしますか。',
      coach:
        '決裁者が「承認しやすい」最初の一歩を設計するのも営業の仕事です。新しい取り組みは効果を確かめる段階を、既存システムの移行は計画を立てる段階を置くと進みやすくなります。',
    },
    pricing: {
      title: '費用の提示',
      lead: '見積もりをどのように出しますか。',
      coach:
        '値引きの前に、料金プラン（長期利用割引）や、移行・スタートアップ向けの支援策が使えないか考えます。使い方が決まっていない段階で長期の約束を求めるのは早すぎます。',
    },
    objection: {
      title: (i: number, title: string) => `反論への対応 ${i}／2：${title}`,
      lead: '提案の説明を終えると、こう返されました。',
      coach: '反論は「関心がある」サインです。否定や断言で押し切らず、懸念を受け止めて、根拠のある情報や次の一歩で応えます。',
    },
    close: {
      title: 'クロージング',
      lead: '商談の最後に、次の一歩をどう決めますか。',
      coach: '受注は「顧客が決める」ものです。誰が・いつまでに・何を確かめれば決められるかを、顧客と一緒に書き出せると確度が上がります。',
    },
  },
  selected: (n: number, max: number) => `${n} / ${max} 選択`,
  play: 'Deal',
  playTitle: '商談',
  noSession: '進行中の商談はありません。',
  pickLead: '案件を選ぶ',
  startRandom: 'ランダムな案件で始める',
  back: '戻る',
  begin: '商談を始める',
  finish: '商談を終える',
  next: '次へ',
  axes: {
    discovery: ['顧客理解', '事前調査・ヒアリング・課題の特定'],
    fit: ['提案の適合', 'サービス構成・進め方・同行メンバー'],
    commercial: ['経済性', '費用の出し方・予算との整合'],
    trust: ['信頼構築', '反論への対応・クロージング'],
  },
  list: (items: string[]) => items.join('、'),
  dt: {
    research: '事前調査',
    team: '同行メンバー',
    questions: 'ヒアリング',
    problem: '課題',
    services: '提案構成',
    approach: '進め方',
    pricing: '費用',
    objection: (title: string) => `反論：${title}`,
    close: 'クロージング',
  },
  report: {
    title: '案件クローズ報告書',
    owner: (name: string) => `担当：${name}`,
    won: '受注',
    lost: '失注',
    axis: '評価軸',
    detail: '内容',
    points: '点',
    feedback: 'マネージャーからのフィードバック',
    conditions: '案件の条件',
    budgetVsCost: (label: string, cost: number, cap: number) =>
      `${label}（費用 <span class="num">${cost}</span>／予算感 <span class="num">${cap}</span>）`,
    yours: 'あなたの判断',
    model: (n: number) => `模範的な進め方（${n} 点）`,
    modelNote: 'この条件で最も点が高くなる判断の一例です。現実の商談に唯一の正解はありません。',
  },
  result: {
    saveTitle: '成績表に記録する',
    retry: '同じ条件でやり直す',
    another: '別の案件へ',
    readLearn: '営業の基本を読む',
    saved: '記録しました。',
    viewRecord: '記録を見る',
    toBoard: '成績表へ',
    local: 'ローカル環境（npm run dev）では記録できません。デプロイした環境でお試しください。',
    needLogin: '記録にはログインが必要です（メールアドレスで登録できます）。ログイン後、この画面に戻ります。',
    loginToSave: 'ログインして記録する',
    playerName: '担当者名（成績表に表示されます）',
    save: '記録する',
    saveNote: '点数はサーバーで計算し直してから保存します。記録は 90 日で自動的に削除されます。',
    enterName: '担当者名を入力してください',
    saveFailed: '記録に失敗しました',
  },
  home: {
    sub: '架空の顧客との商談を 1 件、10 分で。<br>AWS ソリューション営業の「考え方」を、判断しながら学びます。',
    memo: '高いサービスを並べても受注できません。調べる・聞く・課題を言葉にする・身の丈に合った提案をする・反論に根拠で答える・次の一歩を一緒に決める。評価されるのはその積み重ねです。',
    resume: (company: string) => `続きから（${company}）`,
    flowTitle: '商談の流れ',
    flow: [
      '事前調査と同行メンバーを決める',
      'ヒアリングで 3 つ質問し、課題を 1 つに絞る',
      'サービスの構成と進め方を提案する',
      '費用の出し方を決める',
      '2 つの反論に答える',
      'クロージングで次の一歩を決める',
    ],
    leadsTitle: '案件一覧',
    leadsNote: '案件を選ぶと、面談相手・予算・競合などの条件はランダムに決まります。',
    customer: '顧客',
    industry: '業種',
    take: '担当する',
  },
  board: {
    title: '成績表',
    top: '上位 10 件',
    mine: '自分の記録',
    recent: '最近の商談',
    loading: '読み込み中…',
    empty: 'まだ記録がありません。',
    player: '担当',
    customer: '顧客',
    result: '結果',
    points: '点',
    date: '日時',
    loadFailed: '読み込めませんでした',
    challenge: '同じ案件・同じ条件に挑戦する',
    backToBoard: '成績表へ戻る',
  },
  apiCodes: {
    login_required: 'ログインが必要です',
    bad_request: 'リクエストの形式が正しくありません',
    invalid_player_name: '担当者名は 1〜20 文字で入力してください',
    invalid_seed: 'seed が不正です',
    invalid_decisions: '判断の内容が不正です',
    deal_not_found: '記録が見つかりません',
    not_found: 'Not Found',
    server_error: 'サーバーでエラーが発生しました',
  } as Record<string, string>,
  apiUnreachable: (status: number) => `記録サーバーに接続できませんでした（${status}）`,
};

type UIText = typeof JA;

const EN: UIText = {
  static: {
    title: 'Deal Room | AWS Solution Sales Simulator',
    description:
      'A simulator for learning how AWS solution sellers think — discovery, proposals, pricing, handling objections and closing — through a deal with a fictional customer.',
    skip: 'Skip to content',
    navLabel: 'Main',
    navHome: 'Leads',
    navPlay: 'Deal',
    navLearn: 'Sales basics',
    navBoard: 'Leaderboard',
    footer:
      'A learning simulator built for the JAWS-UG Sales × Sainokuni Saitama English LT Night (2026-11-20). All companies and people are fictional, and the scoring is a simplified model for learning how to think. It is not an official AWS position.',
    switchTo: '日本語',
    switchLabel: '日本語に切り替える',
  },
  q: (s: string) => `“${s}”`,
  appendToQuote: (base: string, line: string) => base.replace(/”$/, ` ${line}”`),
  budgetLine: {
    tight: 'Honestly, the budget is very tight.',
    normal: 'We can consider it if it’s within the usual range.',
    ample: 'If we can expect results, we can secure the budget.',
  } as Record<Budget, string>,
  competitorLine: {
    none: 'So far, we haven’t talked to anyone else.',
    onprem: 'Our current SI has given us a quote for a server refresh.',
    othercloud: 'Actually, we’ve also received a proposal from another cloud provider.',
  } as Record<Competitor, string>,
  urgencyLine: {
    low: 'We want to proceed carefully over six months to a year.',
    high: 'We want to get moving as soon as possible, within three months.',
  } as Record<Urgency, string>,
  vendorCompetition: (base: string, label: string) => `${base} Competition: ${label}.`,
  yen: (man: number) =>
    `¥${(man / 100).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}M<small> /yr</small>`,
  arrHead: 'ARR (¥M)',
  arrCell: (man: number) => (man / 100).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
  phases: ['Prepare', 'Discovery', 'Propose', 'Price', 'Negotiate', 'Close', 'Result'],
  pipelineLabel: 'Deal stages',
  loggedIn: 'Signed in',
  logout: 'Sign out',
  loginSignup: 'Sign in / Sign up',
  cardLabel: 'Business card',
  contact: (name: string, title: string) => `${name} (${title})`,
  dealSheetLabel: 'Deal sheet',
  unknown: 'Unknown',
  srcResearch: 'Research',
  srcQuestion: 'Discovery',
  sheet: { industry: 'Industry', size: 'Size', contact: 'Meeting with', budget: 'Budget', competitor: 'Competition', timeline: 'Timeline' },
  learned: 'What you’ve learned',
  learnedEmpty: 'Nothing yet. Research and discovery will fill this in.',
  costDots: (n: number) => `Cost ${n}`,
  steps: {
    brief: {
      title: 'Deal overview',
      lead: 'An inbound inquiry has turned into a first meeting. You are an AWS Account Manager.',
      meet: 'Who you’re meeting',
      unknownYet: (stance: string) => `${stance}. Budget, competition and timeline are still unknown.`,
      coach:
        '<strong>How this deal is scored</strong>: customer understanding 25%, solution fit 30%, commercials 20%, trust 25%. Piling on expensive services does not make a better proposal.',
    },
    research: {
      title: 'Research',
      lead: 'What will you research before the meeting? Time is short, so you can pick only two.',
      coach:
        'Public information on what the customer intends to invest in, and on who supports today’s systems and until when, tells you when a proposal can land.',
    },
    team: {
      title: 'Account team',
      lead: 'Who will you bring to the first meeting? Pick two.',
      coach:
        'The Account Manager owns the customer relationship and the whole deal. Technology, specialist fields, implementation and large migrations are left to the people who do them best.',
    },
    questions: {
      title: 'Discovery',
      lead: (contact: string) => `You have 30 minutes with ${contact}. You can ask three questions.`,
      coach:
        'BANT — Budget, Authority, Need, Timeline — is the basic framework. Answers go into the deal sheet and inform your later decisions.',
    },
    problem: {
      title: 'Define the problem',
      lead: 'From what you heard, narrow the customer’s real problem down to one. Your proposal is built from here.',
      coach:
        '“The servers are old” is a symptom. Say what it does to the business — revenue, utilization, continuity — and your proposal will reach the decision maker.',
      noNotes: '(No discovery notes)',
      notesCite: (contact: string) => `Meeting notes with ${contact}`,
    },
    services: {
      title: 'Solution',
      lead: 'Choose the services you will propose to solve the problem (1–5).',
      coach:
        'First assemble the pieces the problem cannot be solved without, then add pieces that make operations and migration easier. Unrelated services blur the focus.',
      cost: 'Solution cost',
      cap: 'Budget',
      capUnknown: 'Budget unknown',
    },
    approach: {
      title: 'Approach',
      lead: 'How will you propose rolling it out?',
      coach:
        'Designing a first step the decision maker can easily approve is part of selling. New initiatives move faster with a stage that proves the value; migrations, with a planning stage.',
    },
    pricing: {
      title: 'Pricing',
      lead: 'How will you present the estimate?',
      coach:
        'Before discounting, consider pricing models (commitment discounts) and migration or startup programs. Asking for a long-term commitment before usage is clear is too early.',
    },
    objection: {
      title: (i: number, title: string) => `Objection ${i} of 2: ${title}`,
      lead: 'When you finish presenting, the customer says:',
      coach:
        'An objection is a sign of interest. Don’t deny it or overpower it; acknowledge the concern and answer with evidence and a next step.',
    },
    close: {
      title: 'Closing',
      lead: 'At the end of the meeting, how will you agree on the next step?',
      coach:
        'The customer decides to buy. Writing down together who needs to confirm what, and by when, raises your odds.',
    },
  },
  selected: (n: number, max: number) => `${n} / ${max} selected`,
  play: 'Deal',
  playTitle: 'Deal',
  noSession: 'There is no deal in progress.',
  pickLead: 'Choose a lead',
  startRandom: 'Start a random deal',
  back: 'Back',
  begin: 'Start the meeting',
  finish: 'Finish the deal',
  next: 'Next',
  axes: {
    discovery: ['Customer understanding', 'Research, discovery, problem definition'],
    fit: ['Solution fit', 'Services, approach, account team'],
    commercial: ['Commercials', 'Pricing, fit with budget'],
    trust: ['Trust', 'Handling objections, closing'],
  },
  list: (items: string[]) => items.join(', '),
  dt: {
    research: 'Research',
    team: 'Account team',
    questions: 'Discovery',
    problem: 'Problem',
    services: 'Solution',
    approach: 'Approach',
    pricing: 'Pricing',
    objection: (title: string) => `Objection: ${title}`,
    close: 'Closing',
  },
  report: {
    title: 'Deal Close Report',
    owner: (name: string) => `Owner: ${name}`,
    won: 'WON',
    lost: 'LOST',
    axis: 'Area',
    detail: 'Covers',
    points: 'Pts',
    feedback: 'Feedback from your manager',
    conditions: 'Deal conditions',
    budgetVsCost: (label: string, cost: number, cap: number) =>
      `${label} (cost <span class="num">${cost}</span> / budget <span class="num">${cap}</span>)`,
    yours: 'Your decisions',
    model: (n: number) => `A model approach (${n} pts)`,
    modelNote: 'One example of the highest-scoring decisions under these conditions. Real deals have no single right answer.',
  },
  result: {
    saveTitle: 'Record on the leaderboard',
    retry: 'Retry with the same conditions',
    another: 'Try another deal',
    readLearn: 'Read the sales basics',
    saved: 'Recorded.',
    viewRecord: 'View the record',
    toBoard: 'Go to the leaderboard',
    local: 'Records can’t be saved in the local environment (npm run dev). Try the deployed site.',
    needLogin: 'Sign in to record your result (you can sign up with an email address). You will come back to this screen afterwards.',
    loginToSave: 'Sign in and record',
    playerName: 'Your name (shown on the leaderboard)',
    save: 'Record',
    saveNote: 'The score is recalculated on the server before it is saved. Records are deleted automatically after 90 days.',
    enterName: 'Please enter your name',
    saveFailed: 'Could not save the record',
  },
  home: {
    sub: 'One deal with a fictional customer, in 10 minutes.<br>Learn how AWS solution sellers think by making the calls yourself.',
    memo: 'Listing expensive services won’t win the deal. Research, ask, put the problem into words, propose something that fits, answer objections with evidence, and agree on the next step together. That is what gets scored.',
    resume: (company: string) => `Resume (${company})`,
    flowTitle: 'How a deal goes',
    flow: [
      'Choose your research and account team',
      'Ask three discovery questions and narrow down the problem',
      'Propose the services and the approach',
      'Decide how to price it',
      'Answer two objections',
      'Agree on the next step when closing',
    ],
    leadsTitle: 'Leads',
    leadsNote: 'When you pick a lead, the contact, budget, competition and other conditions are set at random.',
    customer: 'Customer',
    industry: 'Industry',
    take: 'Take it',
  },
  board: {
    title: 'Leaderboard',
    top: 'Top 10',
    mine: 'My records',
    recent: 'Recent deals',
    loading: 'Loading…',
    empty: 'No records yet.',
    player: 'Owner',
    customer: 'Customer',
    result: 'Result',
    points: 'Pts',
    date: 'Date',
    loadFailed: 'Could not load',
    challenge: 'Take on the same deal and conditions',
    backToBoard: 'Back to the leaderboard',
  },
  apiCodes: {
    login_required: 'Please sign in',
    bad_request: 'The request was not in the expected format',
    invalid_player_name: 'Enter a name between 1 and 20 characters',
    invalid_seed: 'Invalid seed',
    invalid_decisions: 'Some decisions are invalid',
    deal_not_found: 'Record not found',
    not_found: 'Not Found',
    server_error: 'Something went wrong on the server',
  } as Record<string, string>,
  apiUnreachable: (status: number) => `Could not reach the records server (${status})`,
};

const UI: Record<Lang, UIText> = { ja: JA, en: EN };

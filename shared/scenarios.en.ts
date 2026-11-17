/**
 * English text for the scenarios. Only the wording lives here: scores, weights and costs
 * stay in scenarios.ts, so both languages are scored by exactly the same model.
 *
 * All companies and people are fictional. AWS service names are used for learning;
 * the scoring is a simplified model of how to think, not an official AWS position.
 */
import type {
  ApproachId,
  Budget,
  CloseId,
  Competitor,
  ObjectionId,
  PricingId,
  ProblemId,
  QuestionId,
  ResearchId,
  ResponseId,
  ScenarioId,
  ServiceId,
  Stance,
  TeamId,
  Urgency,
} from './scenarios';

export interface ServiceText {
  name: string;
  category: string;
  summary: string;
}

export interface ObjectionText {
  title: string;
  line: string;
  responses: Record<ResponseId, { text: string; review: string }>;
}

export interface ScenarioText {
  company: string;
  industry: string;
  employees: string;
  summary: string;
  contacts: Record<Stance, { name: string; title: string }>;
  research: Record<ResearchId, string>;
  answers: Record<QuestionId, string>;
  problems: Record<ProblemId, string>;
  coreLabels: string[];
}

export const SERVICES_EN: Record<ServiceId, ServiceText> = {
  ec2: { name: 'Amazon EC2 + Auto Scaling', category: 'Compute', summary: 'Virtual servers that scale out and in with the load' },
  ecs: { name: 'Amazon ECS on AWS Fargate', category: 'Compute', summary: 'Run containers without managing servers' },
  lambda: { name: 'AWS Lambda', category: 'Compute', summary: 'Event-driven serverless functions; pay only for what you use' },
  aurora: { name: 'Amazon Aurora', category: 'Database', summary: 'Managed relational database compatible with MySQL / PostgreSQL' },
  dynamodb: { name: 'Amazon DynamoDB', category: 'Database', summary: 'Serverless key-value database' },
  s3: { name: 'Amazon S3', category: 'Storage', summary: 'Virtually unlimited object storage; the foundation of a data lake' },
  cloudfront: { name: 'Amazon CloudFront', category: 'Networking', summary: 'CDN that absorbs traffic spikes at edge locations worldwide' },
  iot: { name: 'AWS IoT Core / IoT SiteWise', category: 'IoT', summary: 'Securely collect data from equipment and sensors' },
  athena: { name: 'Amazon Athena + AWS Glue', category: 'Analytics', summary: 'Query data in S3 directly with SQL' },
  quicksight: { name: 'Amazon Quick Sight', category: 'Analytics', summary: 'BI dashboards' },
  bedrock: { name: 'Amazon Bedrock', category: 'Generative AI', summary: 'Use multiple foundation models through one API' },
  sagemaker: { name: 'Amazon SageMaker AI', category: 'Machine learning', summary: 'Build, train and run machine learning models' },
  dms: { name: 'AWS DMS / Application Migration Service', category: 'Migration', summary: 'Migrate databases and servers with minimal downtime' },
  backup: { name: 'AWS Backup', category: 'Operations', summary: 'Centrally managed backups, including copies to another Region' },
  controltower: { name: 'AWS Control Tower / Organizations', category: 'Governance', summary: 'Govern many accounts with guardrails' },
  guardduty: { name: 'Amazon GuardDuty', category: 'Security', summary: 'Threat detection that works as soon as you turn it on' },
  connect: { name: 'Amazon Connect', category: 'Contact center', summary: 'Cloud contact center' },
  workspaces: { name: 'Amazon WorkSpaces', category: 'End-user computing', summary: 'Virtual desktops' },
};

export const RESEARCH_LABEL_EN: Record<ResearchId, { name: string; note: string }> = {
  ir: { name: 'Financial reports and mid-term plan', note: 'What management intends to invest in' },
  hiring: { name: 'Careers page and tech blog', note: 'The technology they use and the skills they lack' },
  vendor: { name: 'Current vendors and contracts', note: 'Who supports today’s systems, and until when' },
  case: { name: 'Case studies from the same industry', note: 'Common problems and proven patterns' },
};

export const TEAM_LABEL_EN: Record<TeamId, { name: string; note: string }> = {
  sa: { name: 'Solutions Architect (SA)', note: 'Shows technical feasibility and sketches the architecture with the customer' },
  partner: { name: 'AWS Partner (systems integrator)', note: 'Builds and runs the system hands-on for the customer' },
  specialist: { name: 'Specialist SA (IoT / AI / data)', note: 'Deep expertise and references in a specific field' },
  proserve: { name: 'Professional Services', note: 'Directly supports large migrations and governance design' },
};

export const QUESTION_LABEL_EN: Record<QuestionId, { name: string; frame: string }> = {
  goal: { name: 'What do you want the business to achieve in three years?', frame: 'Business goal' },
  pain: { name: 'What is your biggest problem right now?', frame: 'Pain' },
  budget: { name: 'How are you thinking about budget?', frame: 'Budget' },
  decision: { name: 'Who decides, and how?', frame: 'Authority / Decision process' },
  timeline: { name: 'When do you need this by?', frame: 'Timeline' },
  constraint: { name: 'Are there technical or regulatory constraints?', frame: 'Constraints' },
};

export const APPROACH_LABEL_EN: Record<ApproachId, { name: string; note: string }> = {
  poc: { name: 'Start with a proof of concept (PoC)', note: 'Try it small and prove the value in numbers' },
  phased: { name: 'Phased migration plan (using a migration program)', note: 'Assess → mobilize → migrate' },
  bigbang: { name: 'Migrate every system at once', note: 'Switch over in one go for fast results' },
  workshop: { name: 'Hands-on workshop to shape the requirements', note: 'Build a prototype together in a short time' },
};

export const PRICING_LABEL_EN: Record<PricingId, { name: string; note: string }> = {
  ondemand: { name: 'Estimate with On-Demand pricing', note: 'Pay as you go, no upfront commitment' },
  savings: { name: 'Estimate with Savings Plans / Reserved', note: 'Commit to 1–3 years of usage for a lower rate' },
  funding: { name: 'Include migration funding, credits and other programs', note: 'Use migration programs or startup support' },
  discount: { name: 'Request a deep discount internally', note: 'Prepare for a price war with competitors' },
};

export const CLOSE_LABEL_EN: Record<CloseId, { name: string; note: string }> = {
  wait: { name: 'Send the proposal and wait for an answer', note: 'Respect the customer’s pace' },
  exec: { name: 'Set up an executive meeting with the decision maker', note: 'Explain the ROI directly to leadership' },
  map: { name: 'Agree on a mutual action plan with the customer', note: 'Write down success criteria, owners and dates together' },
  pressure: { name: 'Push a discount on condition of signing this month', note: 'Set a deadline to force a quick decision' },
};

export const STANCE_LABEL_EN: Record<Stance, string> = {
  cto: 'An IT leader who cares most about the technology',
  cfo: 'A finance leader strict about cost-effectiveness',
  ceo: 'A chief executive who values speed',
};

export const BUDGET_LABEL_EN: Record<Budget, string> = { tight: 'Tight', normal: 'Standard', ample: 'Generous' };
export const COMPETITOR_LABEL_EN: Record<Competitor, string> = {
  none: 'No competitor',
  onprem: 'The current SI is proposing an on-premises hardware refresh',
  othercloud: 'Another cloud provider is also being evaluated',
};
export const URGENCY_LABEL_EN: Record<Urgency, string> = { low: 'Normal', high: 'Urgent' };

export const OBJECTIONS_EN: Record<ObjectionId, ObjectionText> = {
  security: {
    title: 'Security concerns',
    line: 'Is it really safe to put our important data in the cloud?',
    responses: {
      a: {
        text: 'Explain the shared responsibility model and show third-party audit reports (AWS Artifact) and material on meeting industry guidelines',
        review: 'You clarified who protects what and answered with third-party evidence, which reassured the customer.',
      },
      b: { text: 'Declare “It’s the world’s largest cloud, so it’s safe”', review: 'Unsupported claims breed distrust, especially with careful customers.' },
      c: {
        text: 'Propose a study session with the customer’s security team and an SA',
        review: 'You created a place for dialogue. Having evidence ready to show on the spot would make it even better.',
      },
      d: { text: 'Change the subject to discounts', review: 'You dodged the concern instead of answering it, and lost trust.' },
    },
  },
  price: {
    title: 'Price comparison with another cloud',
    line: 'The other cloud’s quote is 20% cheaper, you know.',
    responses: {
      a: {
        text: 'Compare on total cost of ownership (TCO) including operations, migration and staff costs, and propose starting with an assessment of the current state',
        review: 'You moved the comparison to total cost and value, avoiding a fight on price alone.',
      },
      b: {
        text: 'Promise on the spot to match the discount',
        review: 'An unfounded discount promise won’t get internal approval, and costs you both trust and margin.',
      },
      c: { text: 'List the other cloud’s weaknesses', review: 'Criticizing a competitor implicitly criticizes the customer’s choice, and backfires.' },
      d: {
        text: 'Re-estimate with right-sizing and long-term usage discounts',
        review: 'Answering with concrete numbers was good. Adding the TCO view would have made it complete.',
      },
    },
  },
  onprem: {
    title: 'Compared with an on-premises refresh',
    line: 'If we ask our current SI, they’ll just swap out the servers.',
    responses: {
      a: {
        text: 'Present a five-year TCO comparison (hardware refresh, maintenance, staff, opportunity loss)',
        review: 'By including the cost of every refresh and the loss when systems go down, you gave them what they need to decide.',
      },
      b: { text: 'Declare “The cloud is always cheaper”', review: 'Some workloads are cheaper on premises. Sweeping claims get seen through.' },
      c: {
        text: 'Propose that the current SI join as an AWS Partner',
        review: 'A proposal that keeps existing relationships intact is reassuring for the customer.',
      },
      d: { text: 'Recommend dropping the SI and contracting directly', review: 'Rejecting a long-standing partner puts the customer on the defensive.' },
    },
  },
  skills: {
    title: 'Lack of people and skills',
    line: 'Nobody here really understands the cloud.',
    responses: {
      a: {
        text: 'Show a skills plan combining training (such as AWS Skill Builder) with hands-on partner support',
        review: 'You turned “we don’t have anyone” into “we’ll grow them”, which gave them a reason to move forward.',
      },
      b: {
        text: 'Answer “It’s managed services, so you don’t need anyone”',
        review: 'Operations get lighter, but someone still has to design and decide. You overpromised.',
      },
      c: {
        text: 'Propose outsourcing everything',
        review: 'It works for now, but no know-how stays in the company, so their worry about the future remains.',
      },
      d: { text: 'Say “Let’s think about people after the contract”', review: 'Postponing the concern stalled the evaluation itself.' },
    },
  },
  lockin: {
    title: 'Fear of vendor lock-in',
    line: 'Once we go with AWS, won’t we be stuck with it forever?',
    responses: {
      a: {
        text: 'Explain that portable technologies such as containers and open-source-compatible databases are available',
        review: 'You showed technical options. Comparing them with migration costs would make it even more convincing.',
      },
      b: {
        text: 'Answer “Don’t worry about lock-in”',
        review: 'Brushing off a concern makes the customer feel you are hiding something inconvenient.',
      },
      c: { text: 'Propose building everything multi-cloud', review: 'It adds complexity and cost, and moves away from the customer’s real goal.' },
      d: {
        text: 'Compare the development speed gained from managed services with the future cost of moving, so they can decide',
        review: 'You framed lock-in not as something to avoid but as a trade-off against value.',
      },
    },
  },
  outage: {
    title: 'Worries about outages',
    line: 'If the cloud goes down, our stores go down too, right?',
    responses: {
      a: {
        text: 'Explain a design that spans multiple Availability Zones and the support plan behind it',
        review: 'You separated “built not to stop” from “what happens if it does”, which gave them confidence.',
      },
      b: { text: 'Declare “AWS never goes down”', review: 'Every system has failures. You should have explained how the design prepares for them.' },
      c: {
        text: 'Share how past incidents were handled and propose an architecture review',
        review: 'Concrete examples work well. Showing the design safeguards too would be even better.',
      },
      d: { text: 'Avoid the topic of outages', review: 'You did not answer the customer’s biggest worry.' },
    },
  },
};

export const SCENARIOS_EN: Record<ScenarioId, ScenarioText> = {
  retail: {
    company: 'Maruyama Store Co., Ltd.',
    industry: 'Retail (42 regional supermarkets + online grocery)',
    employees: '1,800 employees',
    summary:
      'Online grocery sales are growing, but the servers in their own data center are five years old. Ahead of the year-end sales season, they reached out saying they “need to do something.”',
    contacts: {
      cto: { name: 'Koji Maruyama', title: 'General Manager, IT Systems' },
      cfo: { name: 'Noriko Kawai', title: 'Director, Corporate Planning' },
      ceo: { name: 'Seiichi Maruyama', title: 'President & CEO' },
    },
    research: {
      ir: 'The mid-term plan targets doubling online grocery sales in three years.',
      hiring: 'Hiring one e-commerce engineer. Only three developers in-house.',
      vendor: 'The maintenance contract with the current SI ends next March, at the same time as hardware support.',
      case: 'Peers often moved to the cloud in phases, starting with handling sale-day traffic.',
    },
    answers: {
      goal: '“We want to double online sales and make the site as dependable as our stores.”',
      pain: '“The site was down for three hours during last year’s year-end sale. That one day cost us tens of millions of yen in lost sales.”',
      budget: '“We want to stay within the budget we set aside for the server refresh.”',
      decision: '“The president decides in the end, but we have to explain the ROI at the management meeting.”',
      timeline: '“At the very least, we want e-commerce stable before next year-end season.”',
      constraint: '“We can’t touch the core POS system right away. E-commerce comes first.”',
    },
    problems: {
      a: 'The servers are old and nearing end of support',
      b: 'Traffic spikes during sales take e-commerce down and lose sales',
      c: 'There are few developers in-house',
      d: 'They don’t use the cloud yet',
    },
    coreLabels: ['An application platform that scales with load', 'A managed database', 'A CDN that absorbs traffic spikes'],
  },
  manufacturing: {
    company: 'Towa Seiki Co., Ltd.',
    industry: 'Manufacturing (machine-tool parts, 3 domestic plants)',
    employees: '950 employees',
    summary:
      'Unplanned equipment stoppages are increasing, and maintenance that relies on veterans’ experience is reaching its limit. The production engineering team heard about IoT at a trade show and got in touch.',
    contacts: {
      cto: { name: 'Kazuya Azuma', title: 'General Manager, Production Engineering' },
      cfo: { name: 'Satomi Okamoto', title: 'Head of Administration & CFO' },
      ceo: { name: 'Masayuki Azuma', title: 'President & CEO' },
    },
    research: {
      ir: 'Management lists raising utilization while limiting capital spending as a key issue.',
      hiring: 'They have been looking for someone with data analytics experience for over six months without success.',
      vendor: 'Plant control systems (OT) are maintained by the equipment makers and isolated from the corporate network.',
      case: 'A peer started by collecting sensor data from one line to make the signs of stoppages visible.',
    },
    answers: {
      goal: '“We want a plant that doesn’t stop, so we never miss a delivery date.”',
      pain: '“A spindle bearing suddenly failed and the line was down for two days. We still don’t know why.”',
      budget: '“We want to try it small first, then secure the full budget once we see results.”',
      decision: '“The plant manager and I decide; if it’s a large amount, it goes to the board.”',
      timeline: '“We want to show results before next fiscal year’s budget request in February.”',
      constraint: '“Connecting the plant control network to the outside needs coordination with the equipment makers.”',
    },
    problems: {
      a: 'Lots of paper inspection records and clerical work',
      b: 'No people who can analyze data',
      c: 'Equipment condition data isn’t collected, so they can’t catch the warning signs of stoppages',
      d: 'The plants are in three different places',
    },
    coreLabels: ['Collecting equipment data', 'A foundation for storing data', 'Visualization and analysis'],
  },
  saas: {
    company: 'Luxeed Inc.',
    industry: 'SaaS startup (cloud performance reviews)',
    employees: '60 employees, Series A',
    summary:
      'Customer numbers are growing steadily, but infrastructure costs are growing faster than revenue. Investors want them to differentiate with generative AI features.',
    contacts: {
      cto: { name: 'Riku Kubo', title: 'CTO' },
      cfo: { name: 'Saori Hayashi', title: 'CFO' },
      ceo: { name: 'Hikaru Oda', title: 'CEO' },
    },
    research: {
      ir: 'Raised a Series A. Reportedly plans to triple ARR before the next round.',
      hiring: 'Their tech blog says they deploy to virtual servers by hand and have only just started trying generative AI.',
      vendor: 'They also use another cloud provider for some services.',
      case: 'SaaS companies of similar size cut both operational load and cost by going serverless, and shipped generative AI features quickly.',
    },
    answers: {
      goal: '“We want to ship a feature that drafts review comments with AI within six months.”',
      pain: '“Two of our eight developers spend their time on infrastructure, so new features keep slipping.”',
      budget: '“We’d like to spend the money we raised on product development as much as possible.”',
      decision: '“Tech is the CTO, money is the CFO. In the end the CEO decides in 30 minutes.”',
      timeline: '“We want to demo it at our next fundraising pitch in four months.”',
      constraint: '“We absolutely cannot have customers’ HR data used to train AI.”',
    },
    problems: {
      a: 'Developers are tied up running infrastructure, so new features like generative AI aren’t shipping',
      b: 'The cloud bill is high',
      c: 'They use another cloud provider too',
      d: 'They have few employees',
    },
    coreLabels: ['A generative AI platform', 'An application platform with no servers to run', 'A managed database'],
  },
  finance: {
    company: 'Sakuradai Shinkin Bank',
    industry: 'Finance (regional cooperative bank, 28 branches)',
    employees: '720 staff',
    summary:
      'Regulators are asking for better preparation for major disasters. The core banking system runs in a shared center, but branch and lending support systems are in-house, and the backups sit in the basement of headquarters.',
    contacts: {
      cto: { name: 'Shinya Sakurai', title: 'General Manager, Systems' },
      cfo: { name: 'Miwa Onishi', title: 'Managing Director (Corporate Planning)' },
      ceo: { name: 'Tadashi Sakura', title: 'Chairman' },
    },
    research: {
      ir: 'Their disclosure report names “stronger business continuity” and “developing digital talent” as priorities.',
      hiring: 'The systems department has 12 people. Job postings say almost nothing technical.',
      vendor: 'The supporting systems are maintained by six different vendors, and nobody has the full picture of the setup.',
      case: 'Other financial institutions first mapped their compliance with industry security standards, then began using the cloud for disaster recovery and expanded step by step.',
    },
    answers: {
      goal: '“We want to keep serving our local customers even after a disaster.”',
      pain: '“Our backups are in the same building as headquarters. If headquarters is hit, we can’t recover.”',
      budget: '“We budget one year at a time, so predictable annual costs matter.”',
      decision: '“The systems department drafts it, the executive committee and the board approve it, and we have to explain it to regulators.”',
      timeline: '“We want the policy settled before next year’s inspection.”',
      constraint: '“We can’t proceed unless we can show it follows the financial industry’s security standards.”',
    },
    problems: {
      a: 'Staff lack IT skills',
      b: 'There are too many maintenance vendors',
      c: 'Branch terminals are old',
      d: 'If headquarters is hit, data can’t be restored and the business can’t continue',
    },
    coreLabels: ['Backups to a remote location', 'A well-governed account design', 'Threat detection'],
  },
};

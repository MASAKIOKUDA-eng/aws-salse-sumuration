# 05. LT script (English, 5 minutes)

Slide text is kept short so it can be read at a glance. The speaker notes are written in plain, short sentences that are easy to read aloud.
Japanese hints are in parentheses where it might help.

---

### Slide 1 — Title (0:00–0:20)

**On slide**
- Developing a sales simulation application as a way to also verify cdkd's functionality
- Name / role / JAWS-UG Sales

**Say**
> Hi, I'm ___. Today I'll talk about a small app I built.
> It teaches AWS solution sales, and at the same time, it was my test case for a tool called cdkd.

### Slide 2 — Why (0:20–0:50)

**On slide**
- Sales is a series of decisions, not knowledge
- I wanted to test cdkd with a "real" serverless stack

**Say**
> In sales, knowing the words is easy. BANT, TCO, shared responsibility.
> But in a real meeting, you have to decide what to ask, what to propose, and when to stop.
> Also, I wanted to try cdkd with something bigger than a hello-world.

### Slide 3 — Deal Room (0:50–1:30)

**On slide**
- You are an AWS account manager
- 4 fictional customers × 216 conditions
- Research → Discovery → Proposal → Pricing → Objections → Close

**Say**
> This is Deal Room. You are an account manager.
> You get a lead from a supermarket, a factory, a SaaS startup, or a local bank.
> You make ten decisions. Who to bring, what to ask, which services to propose, how to price, and how to answer objections.

### Slide 4 — Demo screenshots (1:30–2:30)

**On slide**
- Deal sheet: budget / competitor / timeline are "unknown" until you ask
- Proposal: cost meter vs. budget
- Close report: Won / Lost stamp and feedback

**Say**
> Here is my favorite part. Budget, competitor, and timeline start as "unknown".
> They are filled in only if you ask the right questions.
> If you don't ask, you have to guess later. Just like a real deal.
> At the end, you get a close report with feedback from your manager.

### Slide 5 — Scoring (2:30–3:00)

**On slide**
- Discovery 25% / Fit 30% / Commercial 20% / Trust 25%
- More services ≠ more wins
- Random choices win only ~8%

**Say**
> More services do not mean more wins. Extra services lose points, and going over budget hurts.
> If you choose at random, you win only about eight percent of the time.

### Slide 6 — Architecture (3:00–3:40)

**On slide**
- CloudFront → S3 (OAC) / Lambda Function URL (OAC, IAM)
- DynamoDB (on-demand, TTL) / Cognito (managed login)
- No WAF: event-only, protected by OAC + login + server-side re-scoring

**Say**
> The stack is fully serverless. No API Gateway. CloudFront calls the Lambda function URL with OAC.
> I removed WAF this time, because the app is only for this event.
> Scores are always recalculated on the server, so you cannot cheat.

### Slide 7 — What I verified with cdkd (3:40–4:20)

**On slide**
- cdkd = deploy CDK apps without CloudFormation
- 28 resources, custom resources, assets, Cognito branding, OAC
- Deploy: __ s / Update: __ s / Destroy: __ s

**Say**
> cdkd deploys CDK apps directly with the AWS SDK, without CloudFormation.
> It handled 28 resources, including custom resources and new resource types.
> The first deploy took __ seconds, and an update took __ seconds.
> For short-lived event environments, this speed really helps.

### Slide 8 — AI-DLC (4:20–4:40)

**On slide**
- Requirements → Design (ADR) → Code → Tests, all recorded

**Say**
> I used AI-DLC. Requirements, design decisions, and test results are all in the repository.

### Slide 9 — Try it (4:40–5:00)

**On slide**
- QR code / URL
- #jawsug_sales #jawsug_sainokuni

**Say**
> Please try it now with this QR code. Let's see who becomes the top account manager tonight. Thank you!

---

## Useful phrases for Q&A

| Situation | Phrase |
| --- | --- |
| Didn't catch the question | "Sorry, could you say that again a little slower?" |
| Need a moment | "Good question. Let me think for a second." |
| Answer in Japanese | "May I answer in Japanese?" |
| Is the scoring official? | "No, it's a simplified model for learning. It's not an official AWS view." |
| Why no generative AI? | "I wanted everyone to play under the same rules, with clear reasons for the score." |

/* ============================================================
   Deal Command Center — content layer
   Challenger motion · MEDDPICC backbone · Equinix Interconnection & Fabric
   ============================================================ */
'use strict';

const DCC = window.DCC = window.DCC || {};

DCC.DATA = {

  /* ---------- MEDDPICC letters ---------- */
  letters: [
    {
      k: 'M', name: 'Metrics',
      def: 'Quantified impact, in the customer’s numbers: egress spend, provisioning time, latency, MPLS opex.',
      anchors: [
        'No numbers anywhere in the deal.',
        'We put an ROI slide in front of them. They nodded.',
        'They told us a number — e.g. “~$80k/mo on cloud egress and MPLS overlap.”',
        'Verified: their number, in their business case, tied to a baseline we can audit.'
      ],
      action: 'Run the egress/MPLS cost workshop. Get THEIR baseline number on a whiteboard before the next call — no metric, no business case, no deal.',
      tip: 'A metric only counts if the customer would repeat it to their own CFO without you in the room.'
    },
    {
      k: 'EB', name: 'Economic Buyer',
      def: 'The person who can release budget for network transformation — usually VP Infra or CIO, not the network architect.',
      anchors: [
        'We don’t know who signs.',
        'We assume it’s the CIO. Never met them.',
        'Champion named the EB and described their priorities.',
        'We’ve met the EB; they’ve confirmed budget authority and the initiative’s priority.'
      ],
      action: 'Use the EB-access email. Trade value for access: offer the executive cost-of-inaction readout, delivered only to the EB.',
      tip: 'The EB hears cloud-strategy velocity and opex predictability — not ports and VLANs. Tailor before you climb.'
    },
    {
      k: 'DC', name: 'Decision Criteria',
      def: 'The written list they’ll judge vendors on — and whether we wrote any of it.',
      anchors: [
        'No idea what they’ll evaluate on.',
        'We guess it’s price and cloud coverage.',
        'They shared criteria. All of it was written before we arrived.',
        'Criteria include items we planted: provisioning speed, ecosystem density, egress economics.'
      ],
      action: 'Teach a criterion they’re missing (time-to-provision, ecosystem reach, on-ramp density), then ask: “Should that be on your evaluation list?” Get it in writing.',
      tip: 'Criteria written for the old architecture favor the incumbent. Offer to pressure-test the list — then plant.'
    },
    {
      k: 'DP', name: 'Decision Process',
      def: 'Steps, people, and dates from “we like it” to signature — validated, not imagined.',
      anchors: [
        'No process mapped.',
        'Rep says “they’re deciding this quarter.” Source: vibes.',
        'Champion walked us through steps and named the committee.',
        'Written mutual plan; customer edited it and accepted dates.'
      ],
      action: 'Build a mutual close plan and send it for edits. Silence on the plan = no process = no forecast.',
      tip: 'A close plan the customer never edited is a wish list with dates on it.'
    },
    {
      k: 'PP', name: 'Paper Process',
      def: 'Legal, security, procurement: MSA redlines, vendor onboarding, security review — the 6 weeks everyone forgets.',
      anchors: [
        'Never discussed.',
        'We assume standard terms will fly.',
        'They described procurement steps and typical timelines.',
        'Verified with procurement: security review started, MSA path confirmed, dates in the plan.'
      ],
      action: 'Ask the champion: “Walk me through the last network contract you signed — who touched it and how long did each step take?” Backplan from that.',
      tip: 'Paper process starts at first verbal interest, not at verbal commit. Start the security review clock early.'
    },
    {
      k: 'IP', name: 'Identify Pain',
      def: 'The reframed pain — network drag on cloud strategy — acknowledged by the customer, with a cost of doing nothing.',
      anchors: [
        'We pitched features; no pain surfaced.',
        'They said “our MPLS renewal is coming up.” Surface-level.',
        'They acknowledged the reframe: slow provisioning is throttling their cloud roadmap.',
        'Pain is quantified and tied to a strategic initiative with a deadline they said out loud.'
      ],
      action: 'Re-run the teaching pitch. If they won’t agree the problem is bigger than a circuit renewal, disqualify or go higher.',
      tip: 'Pain without a deadline is a topic, not a deal. Find the initiative with a date attached.'
    },
    {
      k: 'CH', name: 'Champion',
      def: 'Someone with power who sells for us when we’re not in the room — tested, not assumed.',
      anchors: [
        'Nobody inside is carrying our story.',
        'Friendly contact who takes our calls. That’s a coach.',
        'They’ve repeated our reframe internally and briefed us on politics.',
        'Tested: they got us the EB meeting and defended us against an alternative.'
      ],
      action: 'Test them: ask for something politically expensive (EB intro, competitor intel). If they won’t spend capital, build a second champion.',
      tip: 'Champions are built, not found. Arm them with the one slide they can defend without you.'
    },
    {
      k: 'CO', name: 'Competition',
      def: 'Everything competing for the money: DIY cross connects, telco MPLS renewal, SD-WAN over internet — and “do nothing.”',
      anchors: [
        'No idea who or what we’re against.',
        'We think we’re alone in the deal. We’re never alone.',
        'Champion confirmed alternatives and where each stands.',
        'We know the alternative, its internal sponsor, and we’ve set traps in the criteria against it.'
      ],
      action: 'Ask the champion directly: “If you don’t do this with us, what happens instead?” “Nothing” is a competitor — usually the strongest one.',
      tip: 'The rival is rarely another fabric. It’s inertia, a renewal auto-signing, or another initiative eating the budget.'
    }
  ],

  scaleLegend: '0 = unknown · 1 = assumed · 2 = told to us · 3 = verified by evidence',

  /* ---------- Challenger pillars ---------- */
  pillars: [
    {
      key: 'Teach', title: 'Lead with insight, not discovery',
      body: 'Open with what their peers are doing wrong: over-provisioned MPLS, unmanaged multicloud egress, hairpinned traffic. Teach them a cost they didn’t know they were paying. Feeds <strong>Identify Pain</strong> and <strong>Metrics</strong>.'
    },
    {
      key: 'Tailor', title: 'One insight, four buyers',
      body: 'The network architect hears latency and control. The CIO hears cloud-strategy velocity. The CFO hears opex predictability. Tailoring maps directly to <strong>Economic Buyer</strong> and <strong>Champion</strong> work.'
    },
    {
      key: 'Take Control', title: 'Push on money and process',
      body: 'Constructive tension: name the cost of inaction, set mutual close plans, refuse to advance without access. This is where <strong>Decision Process</strong> and <strong>Paper Process</strong> get verified, not assumed.'
    }
  ],

  reframe: {
    label: 'The commercial reframe',
    quote: '“Every quarter you keep hauling cloud traffic over the public internet and legacy MPLS, you pay three taxes: egress you can’t control, latency your customers feel, and 45-day provisioning that makes your network the slowest team in the company.”',
    note: 'If a rep can’t deliver a version of this in 30 seconds, they’re pitching — not challenging.'
  },

  taxes: [
    { n: 3, unit: '', label: 'taxes of the legacy architecture', sub: 'egress · latency · provisioning' },
    { n: 45, unit: ' days', label: 'typical circuit provisioning', sub: 'vs. minutes on Fabric' },
    { n: 220, unit: '+', label: 'native cloud on-ramps on Platform Equinix', sub: 'AWS · Azure · Google · Oracle · IBM' },
    { n: 10000, unit: '+', label: 'customers already inside the ecosystem', sub: 'incl. 2,100+ networks' }
  ],

  stages: [
    { num: 'Stage 1', name: 'Teach & Disrupt', move: 'Land the commercial insight: the three taxes of the current architecture. Earn the reframe before any product talk.', letters: ['IP', 'M'] },
    { num: 'Stage 2', name: 'Reframe & Qualify', move: 'Turn insight into their numbers. Map the power structure and test who’ll carry the story internally.', letters: ['M', 'EB', 'CH'] },
    { num: 'Stage 3', name: 'Build the Case', move: 'Shape the criteria, arm the champion for the budget fight, and know exactly what you’re up against.', letters: ['DC', 'CO', 'CH'] },
    { num: 'Stage 4', name: 'Take Control & Close', move: 'Mutual close plan, paper process mapped, EB aligned on cost of inaction. Constructive tension, not hopeful waiting.', letters: ['DP', 'PP', 'EB'] }
  ],

  rules: [
    'No demo before a documented reframe lands. If they haven’t agreed the problem is bigger than “we need a circuit,” you’re a vendor.',
    'Metrics are numbers the <em>customer</em> said, not numbers we showed them. Slideware ROI doesn’t count.',
    'Champion test: have they repeated our insight internally without us in the room? If not, they’re a coach.',
    'No forecast commit above 50% without Economic Buyer contact and a verified paper process.',
    'Every deal names its “do nothing” sponsor. Inertia has a face — find it.',
    'Paper process starts at first interest. A security review discovered at verbal commit is a lost quarter.'
  ],

  /* ---------- Discovery bank ---------- */
  questions: [
    { id: 'q1',  tag: 'IP', q: 'Walk me through what happens today when an app team asks for connectivity to a new cloud region.', listen: 'Tickets, weeks of lead time, workarounds over public internet — that’s the drag you’ll quantify.' },
    { id: 'q2',  tag: 'IP', q: 'Where does your cloud roadmap outrun your network’s ability to keep up?', listen: 'A named initiative (AI workloads, region expansion, M&A integration) with a date. No date, weak pain.' },
    { id: 'q3',  tag: 'IP', q: 'Your AI teams are moving training data between clouds and colo today — who feels that pain first when it’s slow?', listen: 'AI/data platform teams are the new internal customer of the network. Their deadline is your deal clock.' },
    { id: 'q4',  tag: 'M',  q: 'What did you spend on cloud egress last quarter — and who owns that line item?', listen: 'If nobody owns it, teach: unmanaged egress is the fastest-growing line in their cloud bill.' },
    { id: 'q5',  tag: 'M',  q: 'If provisioning went from six weeks to same-day, what would that be worth to the teams waiting on you?', listen: 'They convert time into money themselves — that’s a metric in their words, not yours.' },
    { id: 'q6',  tag: 'M',  q: 'What does an hour of degraded latency cost during your peak window?', listen: 'Even a rough number anchors the latency tax. Silence means they’ve never measured — offer to help baseline it.' },
    { id: 'q7',  tag: 'EB', q: 'When your last infrastructure investment above $500k got approved, who ultimately said yes?', listen: 'A name and title. “It goes to a committee” means they don’t know — your champion may not either.' },
    { id: 'q8',  tag: 'EB', q: 'What is your CIO on the hook for this year that this project touches?', listen: 'The EB’s scoreboard. Tailor every business case slide to it.' },
    { id: 'q9',  tag: 'DC', q: 'When you compare approaches — renewal, DIY, a fabric — what’s actually on the scorecard?', listen: 'If time-to-provision and ecosystem reach aren’t listed, teach them in and ask to add them.' },
    { id: 'q10', tag: 'DC', q: 'Who wrote the evaluation criteria, and when were they last challenged?', listen: 'Criteria written for the old architecture favor the incumbent. Offer to pressure-test them.' },
    { id: 'q11', tag: 'DC', q: 'Is data residency on your evaluation list — and how would you enforce it at the network layer today?', listen: 'Sovereignty is a criterion you can plant: geo-fenced routing is hard to retrofit onto internet-based transfer.' },
    { id: 'q12', tag: 'DP', q: 'From “we’ve picked a direction” to a signed contract — what happened last time, step by step?', listen: 'Real steps with real durations. Map your mutual plan onto their history, not your quarter-end.' },
    { id: 'q13', tag: 'DP', q: 'Who can veto this even if the network team loves it?', listen: 'Security, finance, an architecture board. Every unnamed veto is a Q4 surprise.' },
    { id: 'q14', tag: 'PP', q: 'What does your procurement team need from a new network vendor before a PO can exist?', listen: 'Security review, vendor onboarding, MSA cycle. Start the clock now, not at verbal.' },
    { id: 'q15', tag: 'PP', q: 'How long did legal take on your last telco or cloud agreement?', listen: 'Their answer is your close-date math. 30-day redlines don’t compress because your quarter ends.' },
    { id: 'q16', tag: 'CH', q: 'When you raised this internally, what pushback did you hit?', listen: 'A real champion has scars to describe. “No pushback” means they haven’t raised it.' },
    { id: 'q17', tag: 'CH', q: 'What happens to your team’s roadmap if this doesn’t get funded?', listen: 'Personal stake. Champions with nothing to lose stop championing under pressure.' },
    { id: 'q18', tag: 'CO', q: 'If this project loses the budget fight, where does that money go instead?', listen: 'The real competitor is often another initiative, not another vendor.' },
    { id: 'q19', tag: 'CO', q: 'Is anyone arguing you can get there with your current provider plus more bandwidth?', listen: 'The “bigger pipe” argument. Arm your champion with the provisioning-speed counter before that meeting.' },
    { id: 'q20', tag: 'CO', q: 'Which cloud provider’s native interconnect has your architects already looked at?', listen: 'Single-cloud direct connects solve one lane. Multicloud is where the DIY math collapses — teach it.' },
    { id: 'q21', tag: 'IP', q: 'When was the last time the network was the reason a launch date moved?', listen: 'A story with names and dates. That story is your executive readout’s opening slide.' },
    { id: 'q22', tag: 'M',  q: 'What’s the fully-loaded cost of the engineers who babysit circuit orders and cross-connect tickets?', listen: 'Hidden headcount tax. Multiply tickets × hours × loaded rate — with their numbers, not yours.' },
    { id: 'q23', tag: 'EB', q: 'If we proved the economics, could your sponsor release budget this fiscal year — or is it already committed?', listen: 'Tests whether the EB has discretionary budget or you’re writing next year’s business case.' },
    { id: 'q24', tag: 'DP', q: 'What would have to be true by the end of this quarter for this to stay a priority?', listen: 'They define the milestones — you’ve just co-authored the first line of the mutual plan.' }
  ],

  /* ---------- Objection tracks ---------- */
  objections: [
    {
      title: 'We already have direct connects to AWS and Azure.',
      trap: 'Arguing your direct connect is better than theirs. Now it’s a spec fight you didn’t need.',
      track: '“Good — that means you’ve already accepted that private connectivity matters. Here’s what changed: two clouds today, and your data platform team is already piloting a third. Each new connection your way is a project. What we’re seeing is teams stop building connections and start operating a fabric — one port, every cloud, provisioned in minutes. How long did your last direct connect take to stand up, end to end?”'
    },
    {
      title: 'Our MPLS contract runs another 18 months.',
      trap: 'Offering to “circle back in a year.” The deal dies in your CRM and the renewal auto-signs.',
      track: '“That’s exactly why we should talk now. Companies that wait for the renewal date end up renewing — there’s no time to stand up an alternative. The teams that get out of MPLS start 12–18 months early: run the fabric alongside it, migrate site by site, and walk into the renewal with leverage instead of a gun to their head. What would it be worth to negotiate that renewal with a working alternative in place?”'
    },
    {
      title: 'This is more expensive than pulling our own cross connects.',
      trap: 'Discounting. You’ve just agreed the comparison is cable vs. cable.',
      track: '“Per cable, you’re right. But you’re not buying cables — you’re buying the 45 days of engineering, ticketing, and waiting wrapped around each one. Your team quoted six weeks for the last one. At your loaded engineering cost, what did that cross connect actually cost? The fabric price includes the part your spreadsheet leaves out: the queue disappearing.”'
    },
    {
      title: 'The network team doesn’t have bandwidth for a migration.',
      trap: 'Sympathizing and waiting. Their bandwidth never improves — that’s the pain, not the blocker.',
      track: '“That’s the strongest argument for doing this. Your team has no bandwidth because they’re hand-building what a fabric automates. This isn’t a rip-and-replace — it’s one physical port, then every new connection is software. The migration effort is front-loaded and small; the payback is every project after it. What’s the next connectivity request in their queue? Let’s make that the pilot.”'
    },
    {
      title: 'We can solve this with SD-WAN.',
      trap: 'Trashing SD-WAN. Their architect probably chose it, and they’re half right — which makes you wrong.',
      track: '“SD-WAN is the right answer for branch — keep it. But it rides the public internet, and that’s the part your data platform can’t accept: variable latency and egress pricing you don’t control. The pattern we see is SD-WAN at the edge, private fabric for cloud-to-cloud and data center-to-cloud. Different layers, different problems. Which workloads are you comfortable leaving on the public internet?”'
    },
    {
      title: 'Just send me pricing.',
      trap: 'Sending it. Price without a business case gets compared to a cross connect and forwarded to procurement to kill.',
      track: '“Happy to — and I’ll be straight with you: a per-port price with no context will look like an expensive cable. What it won’t show is the egress and provisioning math, which is where this decision actually gets made. Give me 30 minutes with the person who owns the cloud bill and I’ll bring pricing with the business case attached. If the math doesn’t work, I’ll tell you first.”'
    },
    {
      title: 'We’ll just use each cloud’s own interconnect product.',
      trap: 'Comparing port prices with AWS Direct Connect or ExpressRoute. You lose on list price and miss the point.',
      track: '“For a single cloud, that works — and if you were a one-cloud shop I’d tell you to do it. But you’re running three, and each native interconnect is its own contract, its own hardware path, its own team to run it. A fabric gives you one port with 220+ native on-ramps behind it — AWS, Azure, Google, Oracle — and you re-point capacity between them in software. When your workload mix shifts next year, which of those two architectures moves with you?”'
    },
    {
      title: 'Security won’t sign off on shared infrastructure.',
      trap: 'Reciting compliance certifications. You sound like every vendor they’ve ever audited.',
      track: '“Let’s be precise about what’s shared. Your traffic on a fabric rides private virtual circuits — it never touches the public internet, which is where your auditors’ findings actually live today. And if data residency is the concern, ask your team how they’d enforce geographic boundaries on internet-routed traffic at all. Network-level geo-fencing is something the new architecture adds, not something it gives up. Can we get your security lead into the next session — early, not at signature?”'
    }
  ],

  /* ---------- Manager coaching ---------- */
  coach: [
    { num: '1', q: 'What did we teach them that they didn’t know?', good: 'A specific insight the customer repeated back — “their CIO now quotes our egress number.”', bad: '“We did a great demo.” Demos aren’t teaching. Score IP.', letters: ['IP'] },
    { num: '2', q: 'Whose number is the business case built on?', good: 'The customer’s baseline, gathered in a working session, in their units.', bad: 'Our ROI calculator with their logo on it. Score M.', letters: ['M'] },
    { num: '3', q: 'What has the champion done that cost them something?', good: 'Got us the EB meeting, shared the competing proposal, fought for our criteria.', bad: '“They really like us.” Liking is free. Score CH.', letters: ['CH'] },
    { num: '4', q: 'Read me the close plan — who edited it last?', good: 'The customer did. Their edits, their dates, procurement steps included.', bad: 'It’s our template, sent once, never acknowledged. Score DP and PP.', letters: ['DP', 'PP'] },
    { num: '5', q: 'What kills this deal, and what are we doing about it today?', good: 'A named risk — do-nothing, a rival initiative, an SD-WAN faction — with a counter in motion.', bad: '“Nothing, it’s solid.” Every deal has a killer. Score CO and go find it.', letters: ['CO'] }
  ],

  gates: [
    { name: 'Pipeline',  rule: 'Pain identified and reframe acknowledged by the customer. Nothing else required.', test: 'IP ≥ 1' },
    { name: 'Best case', rule: 'Metrics in the customer’s words, Champion actively selling internally, criteria influenced.', test: 'M ≥ 2 · CH ≥ 2 · DC ≥ 2' },
    { name: 'Commit',    rule: 'EB engaged, decision + paper process verified in writing, health ≥ threshold on the scorecard.', test: 'EB ≥ 2 · DP ≥ 2 · PP ≥ 2 · health ≥ threshold' }
  ],

  managerRules: [
    'Inspect evidence, not enthusiasm. Every claim in a deal review maps to a letter and a score.',
    'Coach the gap, not the whole deal. One letter, one action, one date — then get out of the way.',
    'A deal that hasn’t moved a letter in 21 days isn’t stalled, it’s dying. Force a test: EB access or mutual-plan edit.',
    'Never let a rep average their way to health. A 3-3-3-0 deal is weaker than a 2-2-2-2 deal — the zero is where it dies.'
  ],

  /* ---------- Email templates ---------- */
  emails: [
    {
      name: 'Cold reframe', when: 'First touch · network or infrastructure leader',
      subject: 'The 45-day connection',
      body: 'Hi {first name},\n\nMost network teams we work with can stand up a cloud environment in a day — and then wait six weeks for the private connectivity to reach it. The cloud isn’t the bottleneck anymore; the network is.\n\nTeams like {peer company} stopped ordering circuits and started provisioning connections in software — same day, every major cloud, from ports they already control. Their egress bill dropped too, which is usually the number that gets the CFO’s attention.\n\nWorth 20 minutes to see the math on your footprint? If it doesn’t hold up, I’ll tell you first.\n\n{name}'
    },
    {
      name: 'EB access', when: 'Mid-deal · sent to champion, to reach the economic buyer',
      subject: 'Readout for {EB name} — cost of the current architecture',
      body: 'Hi {champion},\n\nWe’ve now got your baseline numbers: {egress $/mo} in egress, {n} weeks average provisioning, and the MPLS overlap through {renewal date}.\n\nI’ve turned that into a one-page cost-of-inaction readout — what staying on the current architecture costs per quarter, against the fabric model. It’s built for a budget conversation, not a technical one, which is why I’d rather walk {EB name} through it directly — 30 minutes, and you should be in the room.\n\nIf the numbers don’t justify the meeting, I’ll say so and we’ll stop there. Can you get us on their calendar in the next two weeks?\n\n{name}'
    },
    {
      name: 'Post-discovery mobilizer', when: 'Within 24h of a strong discovery call',
      subject: 'What you said — and the two numbers that matter',
      body: 'Hi {first name},\n\nThree things you said yesterday stuck with me:\n\n1. Every new cloud connection is a 4–6 week project.\n2. Nobody owns the egress line, and it grew ~{x}% last year.\n3. The MPLS renewal lands in {month} — and today the incumbent is the only option on the table.\n\nThat third one is the deadline hiding in this. Walking into a renewal without an alternative in place isn’t a negotiation, it’s a signature.\n\nProposed next step: a 45-minute working session with your team to baseline the real numbers on 1 and 2. That gives you the business case internally — whichever direction you take.\n\nDoes {date option} work?\n\n{name}'
    },
    {
      name: 'Renewal leverage', when: '12–18 months before their MPLS/telco renewal',
      subject: '{renewal month} is closer than it looks',
      body: 'Hi {first name},\n\nYour {carrier} agreement renews in {renewal month}. Here’s the pattern we see: teams that start evaluating alternatives inside 6 months of renewal almost always re-sign — not because the deal is good, but because there’s no time to stand anything else up. The incumbent knows this. It’s priced in.\n\nThe teams that walk into that meeting with leverage started 12+ months out: a fabric running alongside MPLS, two or three sites migrated, real numbers on egress and provisioning. Some of them still re-sign — at 30–40% better terms, for a smaller footprint.\n\nEither way, the work pays for itself. Can I show you what the parallel-run looks like on your footprint — before the renewal clock does the negotiating for you?\n\n{name}'
    },
    {
      name: 'Re-engage / gone dark', when: 'Deal stalled 3+ weeks · send to mobilizer, cc nobody',
      subject: 'Closing the loop — one number before I do',
      body: 'Hi {first name},\n\nI owe you a straight answer on where this stands, so here’s mine: when a project goes quiet like this, it usually means it lost a budget fight or a bigger initiative absorbed the team. Both are normal. Neither changes your math.\n\nOne number before I close the file: since we last spoke, your egress line has kept growing at ~{x}%/quarter — that’s roughly {$ amount} since {month}, on a line item nobody owns.\n\nIf the project is dead, tell me and I’ll stop showing up in your inbox. If it’s sleeping, the working session we scoped is still the fastest way to wake it — 45 minutes, your numbers, your business case to keep.\n\nWhich is it?\n\n{name}'
    }
  ],

  /* ---------- Contextual coaching tips (rotate per view) ---------- */
  tips: {
    playbook:  ['Challenger reps win on the tension they create, not the rapport they build.', 'If you can’t name the three taxes from memory, you’re not ready for the first call.', 'Sell the removal of network drag, not ports and virtual circuits.'],
    pipeline:  ['Work the zeros first. A deal dies at its weakest letter, not its average.', 'Deals untouched for 21 days need a forcing event — EB access or a mutual-plan edit.', 'Health is evidence, not optimism. Score what you can prove.'],
    deal:      ['Every score of 1 is a guess wearing a suit. Turn it into a question for the next call.', 'Evidence notes are your deal memory — write what they said, verbatim.', 'The gap plan below the scorecard is your next-call agenda. Use it.'],
    discovery: ['Every question should teach while it qualifies — the insight is implied in the ask.', 'Silence after a metric question is data: they’ve never measured it. Offer to baseline it together.', 'Mark questions as asked so your second call doesn’t repeat your first.'],
    objections:['Objections are buying signals wearing armor. Reframe, don’t rebut.', 'Never argue the spec. Move the frame to the cost of the status quo.', 'Practice the reframes out loud — reading them is not knowing them.'],
    emails:    ['No “hope you’re well.” Insight, tension, one ask.', 'Every placeholder you fill with their number doubles the reply rate.', 'The best follow-up email quotes the customer back to themselves.'],
    team:      ['Coach the letter, not the deal. One gap, one action, one date.', 'The heatmap column with the darkest cells is your team’s skill gap — train it, don’t just inspect it.', 'Commit-readiness is a gate, not a feeling. Hold the line on the threshold.'],
    inspect:   ['Vague answer → open the scorecard and score it live, together.', 'Your job in a deal review: find the lie the rep is telling themselves.', 'End every review with one coaching action logged — or it didn’t happen.'],
    coaching:  ['15 minutes, five questions, in order. Evidence, not enthusiasm.', 'Reviews inspect the rep’s evidence, not the customer’s intentions.', 'A red flag heard twice across the team is a training gap, not a deal gap.']
  },

  stagesShort: ['Teach & Disrupt', 'Reframe & Qualify', 'Build the Case', 'Take Control & Close'],

  reps: ['Maya Chen', 'Darius Cole', 'Priya Nair'],

  /* ---------- Seed deals (demo data) ---------- */
  seedDeals: [
    {
      id: 'd-meridian', name: 'Meridian Bank', label: 'Fabric expansion · NY4/LD4', rep: 'Maya Chen',
      value: 480000, stage: 3, closeIn: 38,
      scores: { M: 3, EB: 2, DC: 3, DP: 2, PP: 2, IP: 3, CH: 3, CO: 2 },
      notes: {
        M: 'Their number: $92k/mo egress + MPLS overlap, baselined in the Oct workshop. In their business case deck v3.',
        CH: 'Elena (Dir. Network Eng) presented our reframe to the infra steering committee herself. Got us the CIO meeting.',
        DP: 'Mutual plan v2 back with their edits — procurement added a vendor-risk step, dates hold.'
      },
      history: [22, 31, 42, 54, 63, 71, 79],
      coachLog: [
        { d: -12, text: 'Reviewed EB alignment — CIO meeting done, priorities confirmed. Push PP: security review not yet started.' },
        { d: -4, text: 'PP moved to 2 after procurement call. Watch the vendor-risk step — 2wk SLA.' }
      ],
      asked: ['q1', 'q4', 'q7', 'q9', 'q12', 'q14', 'q16']
    },
    {
      id: 'd-northwind', name: 'Northwind Logistics', label: 'MPLS exit · 14 sites', rep: 'Darius Cole',
      value: 310000, stage: 2, closeIn: 84,
      scores: { M: 2, EB: 1, DC: 2, DP: 1, PP: 0, IP: 2, CH: 2, CO: 1 },
      notes: {
        M: 'They said ~$60k/mo MPLS spend across 14 sites. Not yet tied to a baseline we can audit.',
        EB: 'Champion says VP Infra (Okafor) signs. We have not met him.'
      },
      history: [10, 18, 25, 33, 41, 46],
      coachLog: [
        { d: -7, text: 'EB is the blocker. Darius to run the EB-access play this week — readout offer, champion carries it.' }
      ],
      asked: ['q1', 'q4', 'q9']
    },
    {
      id: 'd-helios', name: 'Helios Media', label: 'Multicloud egress · 3 clouds', rep: 'Maya Chen',
      value: 220000, stage: 2, closeIn: 60,
      scores: { M: 2, EB: 0, DC: 1, DP: 1, PP: 0, IP: 2, CH: 1, CO: 2 },
      notes: {
        M: 'Egress grew 38% YoY — their FinOps lead quoted it unprompted.',
        CO: 'Architect faction pushing “bigger SD-WAN pipes.” Named: their platform lead sponsors it.'
      },
      history: [8, 14, 22, 29, 34],
      coachLog: [],
      asked: ['q2', 'q4', 'q19']
    },
    {
      id: 'd-atlas', name: 'Atlas Health', label: 'DR re-architecture · 2 metros', rep: 'Priya Nair',
      value: 150000, stage: 1, closeIn: 120,
      scores: { M: 0, EB: 0, DC: 0, DP: 0, PP: 0, IP: 1, CH: 0, CO: 0 },
      notes: {
        IP: 'They mentioned the DR audit finding. Haven’t landed the reframe yet — next call.'
      },
      history: [0, 4],
      coachLog: [],
      asked: []
    },
    {
      id: 'd-vantage', name: 'Vantage Retail', label: 'AI inference edge · 5 metros', rep: 'Priya Nair',
      value: 640000, stage: 3, closeIn: 45,
      scores: { M: 3, EB: 3, DC: 2, DP: 2, PP: 0, IP: 3, CH: 2, CO: 2 },
      notes: {
        M: 'Latency SLA breach costs $180k/quarter in credits — CFO quoted it in the exec briefing.',
        EB: 'CTO owns the AI budget line and has confirmed this is her #2 initiative.',
        PP: 'RED FLAG: nobody has talked to procurement. Their last network MSA took 9 weeks.'
      },
      history: [15, 26, 38, 47, 55, 61, 66],
      coachLog: [
        { d: -3, text: 'Deal looks strong but PP=0 with a 45-day close is a fantasy. Priya to map paper process with champion by Friday or we re-date the forecast.' }
      ],
      asked: ['q2', 'q3', 'q6', 'q7', 'q8', 'q12']
    }
  ]
};

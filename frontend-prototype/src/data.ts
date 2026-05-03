// ────────────────────────────────────────────────────────────
// Brand
// ────────────────────────────────────────────────────────────
export const brand = {
  name: "SyncyTeam",
  sub: "AI workspace for any team",
  tagline:
    "A personal AI assistant for every member, backed by a shared knowledge base — works for research labs, product teams, R&D groups, services.",
};

// ────────────────────────────────────────────────────────────
// Permissions model
// Admin defines roles; each role gets per-component permissions.
// 'own' means: read/write only items the user owns/created.
// ────────────────────────────────────────────────────────────
export type Component =
  | "chat"
  | "notes"
  | "threads"
  | "meetings"
  | "upcoming"
  | "knowledge"
  | "queue" // capture/review queue (lead-level)
  | "group_health" // dashboards (lead-level)
  | "reports"
  | "pokes" // can send pokes (any) / receive (any)
  | "assignments" // can assign work to others
  | "admin"; // can manage roles + members

export type Permission = "none" | "read" | "own" | "read_write" | "full";

export type CustomRole = {
  id: string;
  label: string;
  rank: number; // lower number = higher seniority
  description: string;
  permissions: Record<Component, Permission>;
  isAdmin?: boolean;
};

// Default seed roles — Admin can edit / add / remove these inside the app.
export const defaultRoles: CustomRole[] = [
  {
    id: "lead",
    label: "Associate Professor / Chief Scientist",
    rank: 1,
    description:
      "Top of the team. Can see everything, assign work, manage roles.",
    permissions: {
      chat: "full",
      notes: "own",
      threads: "full",
      meetings: "full",
      upcoming: "full",
      knowledge: "full",
      queue: "full",
      group_health: "full",
      reports: "full",
      pokes: "full",
      assignments: "full",
      admin: "full",
    },
    isAdmin: true,
  },
  {
    id: "senior",
    label: "Postdoctoral Researcher",
    rank: 2,
    description:
      "Postdoctoral researcher. Can run reports, raise threads to lead.",
    permissions: {
      chat: "read_write",
      notes: "own",
      threads: "read_write",
      meetings: "read",
      upcoming: "read_write",
      knowledge: "read",
      queue: "read",
      group_health: "read",
      reports: "read_write",
      pokes: "read_write",
      assignments: "read",
      admin: "none",
    },
  },
  {
    id: "scientist",
    label: "Research Scientist",
    rank: 2,
    description: "Research scientist. Can run reports, raise threads to lead.",
    permissions: {
      chat: "read_write",
      notes: "own",
      threads: "read_write",
      meetings: "read",
      upcoming: "read_write",
      knowledge: "read",
      queue: "read",
      group_health: "read",
      reports: "read_write",
      pokes: "read_write",
      assignments: "read",
      admin: "none",
    },
  },
  {
    id: "core",
    label: "Research & Development Specialist",
    rank: 3,
    description: "R&D specialist or engineer. Day-to-day contributor.",
    permissions: {
      chat: "read_write",
      notes: "own",
      threads: "read_write",
      meetings: "read",
      upcoming: "read_write",
      knowledge: "read",
      queue: "none",
      group_health: "none",
      reports: "read",
      pokes: "read_write",
      assignments: "read",
      admin: "none",
    },
  },
  {
    id: "junior",
    label: "Doctoral Researcher",
    rank: 4,
    description:
      "PhD student / doctoral researcher. Focused on own work; raises threads upward.",
    permissions: {
      chat: "read_write",
      notes: "own",
      threads: "read_write",
      meetings: "read",
      upcoming: "read_write",
      knowledge: "read",
      queue: "none",
      group_health: "none",
      reports: "read",
      pokes: "read_write",
      assignments: "read",
      admin: "none",
    },
  },
];

export const componentLabels: Record<Component, string> = {
  chat: "Assistant",
  notes: "Notes",
  threads: "Threads",
  meetings: "Meetings",
  upcoming: "Upcoming",
  knowledge: "Knowledge base",
  queue: "Review queue",
  group_health: "Group health",
  reports: "Reports",
  pokes: "Pokes",
  assignments: "Assignments",
  admin: "Admin",
};

export function permissionLabel(p: Permission): string {
  switch (p) {
    case "none":
      return "—";
    case "read":
      return "View";
    case "own":
      return "Own only";
    case "read_write":
      return "View + edit";
    case "full":
      return "Full";
  }
}

export function can(
  role: CustomRole,
  comp: Component,
  action: "view" | "create",
): boolean {
  const p = role.permissions[comp];
  if (p === "none") return false;
  if (action === "view")
    return p === "read" || p === "own" || p === "read_write" || p === "full";
  // create
  return p === "own" || p === "read_write" || p === "full";
}

// ────────────────────────────────────────────────────────────
// Users (work-email keyed; samples for the demo)
//
// In production: the team lead enters an allowlist of (name, work email,
// role) entries from the Admin page. Members sign in by authenticating
// their work email through their email provider (e.g. Microsoft / Outlook)
// — only emails in the allowlist may proceed. The role is assigned by the
// lead, not chosen by the member.
// ────────────────────────────────────────────────────────────
export type User = {
  email: string;
  name: string;
  initials: string;
  roleId: string;
  avatarHue: number; // for colored avatar
  orcid?: string;
};

export type AllowlistEntry = {
  email: string;
  name: string;
  roleId: string;
  orcid?: string;
};

export const sampleTeammates: User[] = [
  {
    email: "gabriele.lenzini@uni.lu",
    name: "Gabriele Lenzini",
    initials: "GL",
    roleId: "lead",
    avatarHue: 200,
    orcid: "0000-0001-8229-3270",
  },
  {
    email: "suvadeep.mukherjee@uni.lu",
    name: "Suvadeep Mukherjee",
    initials: "SM",
    roleId: "senior",
    avatarHue: 170,
    orcid: "0000-0002-1213-1767",
  },
  {
    email: "anastasia.sergeeva@uni.lu",
    name: "Anastasia Sergeeva",
    initials: "AS",
    roleId: "scientist",
    avatarHue: 25,
    orcid: "0000-0003-3701-3123",
  },
  {
    email: "yuwei.chuai@uni.lu",
    name: "Yuwei Chuai",
    initials: "YC",
    roleId: "senior",
    avatarHue: 50,
    orcid: "0000-0001-6181-7311",
  },
  {
    email: "hicham.hammouchi@uni.lu",
    name: "Hicham Hammouchi",
    initials: "HH",
    roleId: "senior",
    avatarHue: 130,
    orcid: "0000-0002-0572-218X",
  },
  {
    email: "sviatlana.hoehn@uni.lu",
    name: "Sviatlana Hoehn",
    initials: "SH",
    roleId: "senior",
    avatarHue: 95,
    orcid: "0000-0003-0646-3738",
  },
  {
    email: "manel.jerbi@uni.lu",
    name: "Manel Jerbi",
    initials: "MJ",
    roleId: "senior",
    avatarHue: 310,
    orcid: "0000-0002-5070-5573",
  },
  {
    email: "soumia.elmestari@uni.lu",
    name: "Soumia Zohra El Mestari",
    initials: "SE",
    roleId: "core",
    avatarHue: 280,
    orcid: "0000-0002-1399-605X",
  },
  {
    email: "selene.falchetti@uni.lu",
    name: "Selene Falchetti",
    initials: "SF",
    roleId: "junior",
    avatarHue: 340,
    orcid: "0009-0001-8548-6024",
  },
];

// Initial allowlist — derived from the sample teammates so the demo works
// out of the box. The lead can edit this from the Admin → Members tab.
export const initialAllowlist: AllowlistEntry[] = sampleTeammates.map((t) => ({
  email: t.email,
  name: t.name,
  roleId: t.roleId,
  orcid: t.orcid,
}));

export function makeUserFromEmail(
  email: string,
  roleId: string = "core",
): User {
  const local = email.split("@")[0] || "user";
  // pretty-name: replace . _ - with space, title-case
  const name = local
    .replace(/[._-]/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
  const initials = name
    .split(" ")
    .map((s) => s.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");
  // hash hue from email for stable color
  let hash = 0;
  for (let i = 0; i < email.length; i++)
    hash = (hash * 31 + email.charCodeAt(i)) >>> 0;
  return { email, name, initials, roleId, avatarHue: hash % 360 };
}

// ────────────────────────────────────────────────────────────
// Chat
// ────────────────────────────────────────────────────────────
export type ChatMsg = {
  role: "user" | "assistant";
  text: string;
  citations?: string[];
  followUp?: string[];
  contextNote?: string;
};

// generic chats per role rank (1=lead, 4=junior).
export const chatsByRoleRank: Record<number, ChatMsg[]> = {
  // Lead — Gabriele's view: socio-technical security, dark patterns, GDPR,
  // misinformation, AI ethics. He runs the lab and coordinates across very
  // diverse subgroups (Co-PI on DARKAID with LIST; senior author across the lab).
  1: [
    {
      role: "user",
      text: "Brief me before tomorrow's IRiSC sync. What's blocked across the lab, what needs my call?",
    },
    {
      role: "assistant",
      contextNote:
        "Searched: this week's threads · proposals · review queue · poke inbox",
      text: "Five things to surface:\n- Sviatlana wants to share an SCP2026 status update.\n- PSYBER’s intermittent project outcomes presentation is in two months, and Anastasia needs approval on the phishing experiments data collection.\n- Suvadeep is asking whether to apply for upcoming EU HORIZON grants by expanding the AI-persona phishing study to include vishing and smishing.\n- Selene and Manel are working on overlapping Android-malware evaluation pipelines; reusing Manel's RS-BMD detection-rule generator would save Selene ~2 weeks.\n- Yuwei proposed a possible FNR Industry Fellowships opportunity in September with META London.\n\nWant me to pre-fill the sync agenda?",
      citations: [
        "3 active threads",
        "DARKAID — v0.4 · LIST/SnT consortium",
        "Upcoming · 21d to FNR CORE",
      ],
      followUp: [
        "Draft the sync agenda",
        "Show me the malware-eval overlap",
        "Generate a 1-page DARKAID status report",
      ],
    },
  ],
  // Senior — postdoc/research-scientist view. Drafting proposals, finding
  // collaborators inside and outside the lab, picking venues.
  // Suvadeep is postdoc on DARKAID (PI: Yuejun Guo @ LIST, Co-PI: Gabriele).
  // His other active proposal is the AWS-funded AI-driven phishing personas study.
  2: [
    {
      role: "user",
      text: "Help me sharpen the AI-persona phishing proposal — where is my framing weak before I send it to AWS reviewers?",
    },
    {
      role: "assistant",
      contextNote:
        "Searched: your draft (AI-driven digital personas for phishing) · team knowledge base · public LLM-persona / phishing literature",
      text: "Three strong internal anchors. (1) Anastasia's HEXACO+D personality-traits work (IJHCI, accepted) directly supports the persona-trait → susceptibility mapping you'll need for cluster analysis. (2) Sviatlana's 2025 SIGDIAL paper on LLM bias and recipient design (Llama 3.1 / Gemma 2 / Mistral) is the closest internal anchor for the multi-LLM Bedrock comparison — she's hit the same prompt-fidelity wall you're describing. (3) Yuwei's Community Notes / X-Twitter work (CSCW 2024) gives you the engagement-measurement methodology if you go cross-channel. Two gaps to acknowledge: you have no prior phishing-simulation publication of your own (Anastasia + Schwab et al. NDSS 2025 carry that), and the AWS reviewers will push on whether the AI-persona test-retest reliability target (≥85%) is realistic — cite Park et al. 2024 (Generative Agent Simulations of 1,000 People).",
      citations: [
        "Team KB · Sergeeva & Schilling — Dark Patterns + HEXACO+D (IJHCI)",
        "Team KB · Höhn et al. SIGDIAL 2025 (LLM bias, recipient design)",
        "Public · Park et al. 2024 — Generative Agent Simulations",
      ],
      followUp: [
        "Pull Anastasia in as co-author?",
        "Add a vishing/smishing arm or stay email-only?",
        "Draft the AWS reviewer-rebuttal section",
      ],
    },
  ],
  // Core — R&D specialist (Soumia): privacy/ML, federated learning,
  // anonymization, EU law. Day-to-day implementation work.
  3: [
    {
      role: "user",
      text: "I'm extending the targeted-overfitting detection paper to a horizontal-FL benchmark with non-IID clients. Who on the team has done something similar?",
    },
    {
      role: "assistant",
      contextNote:
        "Searched: team knowledge base · your Sept-2025 arXiv (label-flipping/backdoor/fingerprinting) · public FL-attacks literature",
      text: "Two relevant internal anchors. (1) Your own preprint with Maciej Zuziak (CNR Pisa) — the label-flipping PES score and the gradient-fingerprinting algorithm are the obvious starting point for the new benchmark; you already have the MNIST/CIFAR-10/CIFAR-100/PATHMNIST/EUROSAT pipeline ready. (2) Manel's RS-BMD work (Cognitive Computation 2024) uses bi-level optimisation — different domain (Android malware detection rules), but the GA/GP scaffolding for adversarial pattern generation could give you a stronger threat model on the orchestrator side than a static malicious aggregator. For non-IID clients specifically, your existing Dirichlet partitioning is what most FL-attack papers cite, so reviewers won't push back. Want me to draft an experimental matrix?",
      citations: [
        "Team KB · El Mestari, Zuziak & Lenzini 2025 (Poison to Detect, arXiv)",
        "Team KB · Jerbi et al. 2024 (RS-BMD, Cognitive Computation)",
        "Public · Bagdasaryan et al. — backdoor FL",
      ],
      followUp: [
        "Yes, draft the experimental matrix",
        "Pull Manel in for a 30-min adversarial-design chat",
        "Show me the FedSGD vs FedAvg fingerprint compatibility table",
      ],
    },
  ],
  // Junior — doctoral researcher (Selene): ML/DL, Android malware detection.
  // Onboarding flavour.
  4: [
    {
      role: "user",
      text: "I just joined the lab on the Android malware-detection track. Where should I start?",
    },
    {
      role: "assistant",
      contextNote:
        "Searched: team roster · onboarding plan · open threads tagged 'starter' · Manel's RS-BMD codebase",
      text: "Three concrete starting points, each already mentored. (a) Reproduce Manel's RS-BMD pipeline (Cognitive Computation 2024) on the Drebin dataset — bi-level GP/GA + Rough-Set Theory, three-way decision (accept/abstain/reject). The 96.76% reported accuracy is the number to beat; you'll learn the whole evolutionary-detection-rule stack in ~3 months and ship a workshop paper. (b) Help Hicham extend the M-DAIGT (RANLP 2025) AI-generated-text detection harness with adversarial paraphrasing — same eval scaffolding, different domain, co-author opportunity. (c) Reading group: 'Adversarial ML for Android' (8 papers, 4 weeks). Manel and Hicham both have bandwidth this month. Want me to schedule intro chats?",
      citations: [
        "Team roster · 2 mentors with bandwidth",
        "Knowledge base · Jerbi et al. 2024 (RS-BMD)",
        "Knowledge base · Lamsiyah, Hammouchi et al. 2025 (M-DAIGT)",
      ],
      followUp: [
        "Schedule intros with Manel and Hicham",
        "Tell me more about option (a)",
        "What ML/DL skills will I build?",
      ],
    },
  ],
};

export const externalChat: ChatMsg[] = [
  {
    role: "user",
    text: "Does this team work on adversarial robustness?",
  },
  {
    role: "assistant",
    contextNote: "Public content only · token-scoped · this query is logged",
    text: "Yes — 2 team members have public publications in this area (2023-2025), and there is one open-source toolkit on GitHub. Direct contact requests are routed through the team lead for triage.",
    citations: ["Public profile", "arXiv 2412.0xxxx", "Public GitHub release"],
    followUp: [
      "Request a meeting with the lead",
      "See public publication list",
    ],
  },
];

export const suggestedPromptsByRank: Record<number, string[]> = {
  1: [
    "Brief me before the IRiSC sync",
    "DARKAID + AI-persona phishing status — gaps and risks",
    "Which threads need my call this week?",
    "Who is over- or under-loaded across the lab?",
    "Group health snapshot across subgroups",
  ],
  2: [
    "Sharpen my AI-persona phishing proposal",
    "Who in the lab works on dark patterns / misinformation / LLM bias?",
    "What grants and CFPs match my topic profile?",
    "Summarize the last 3 lab syncs",
    "Find external collaborators on AI-driven social engineering",
  ],
  3: [
    "Extend my targeted-overfitting FL detection to non-IID benchmarks",
    "Who works on adversarial ML on the team?",
    "Suggest venues for privacy-ML + FL work (PETS, USENIX, NeurIPS)",
    "Summarize the last meeting where my topic came up",
  ],
  4: [
    "Where do I start on the Android malware-detection track?",
    "Who is my mentor — Manel or Hicham?",
    "Show me a reading list on bi-level optimisation + adversarial ML",
    "What's IRiSC working on right now?",
  ],
};

export const externalSuggestedPrompts = [
  "What capabilities does this team have?",
  "List public datasets / outputs",
  "Request a meeting with the lead",
];

// ────────────────────────────────────────────────────────────
// Notes
// ────────────────────────────────────────────────────────────
export type NoteAnalysis = {
  context: string;
  problem: string;
  contribution: string;
  methodology: string;
  venues: Array<{ name: string; reason: string }>;
  followUpQuestions: string[];
  internalHelp: Array<{ name: string; why: string }>;
  externalHelp: Array<{ name: string; why: string }>;
};

export type Note = {
  id: string;
  title: string;
  rawText: string;
  status: "draft" | "analyzed" | "shared";
  analysis?: NoteAnalysis;
};

export const sampleNotesByRank: Record<number, Note[]> = {
  // Senior-level notes — drafted from Suvadeep's perspective: AI-driven
  // phishing personas, deceptive-design measurement (DARKAID postdoc track).
  2: [
    {
      id: "n1",
      title:
        "Idea: validate AI-driven personas against real phishing-response data before scaling LLM substitution",
      rawText:
        "The AWS proposal already covers ~700 participants in Phase 1 across industries (healthcare, education, finance) for behavioural cluster analysis, then ~300 in Phase 3 for human-AI fidelity validation. Open question I keep dodging: is normalised accuracy ≥85% (Park et al. 2024 ICC bar) achievable across all five Bedrock models (Nova, Claude, Llama, Mistral, Cohere) or only the frontier tier? If only frontier, the cost-performance toolkit story collapses. Anastasia's HEXACO+D personality framework gives me the trait-level lens; Sviatlana's recipient-design failures (denial-of-service in Llama 3.1) tell me which prompt configurations to avoid up front.",
      status: "analyzed",
      analysis: {
        context:
          "Phishing remains ~67% of incidents (Verizon 2024 DBIR). Repeated real-employee testing has known ethical and trust-erosion problems (Sommestad & Karlzén 2024; Schwab, Sergeeva et al. NDSS 2025). Park et al. 2024 show LLM agents can reach ~85% of human self-consistency on social tasks — the open question is whether that holds for emotionally aggressive phishing, not generic survey items.",
        problem:
          "Can AI-driven digital personas reproduce human phishing-response behaviour with sufficient fidelity to substitute for real employees in aggressive phishing simulations, and which persona × LLM × prompt combinations are cost-effective?",
        contribution:
          "(1) An empirically grounded set of ~10 behavioural personas from 700-participant phishing-response data. (2) A 150-cell fidelity matrix (10 personas × 5 Bedrock LLMs × 3 prompt conditions: baseline, behavioural-augmented, chain-of-thought). (3) Boundary documentation of where AI fails (e.g., emotionally manipulative prompts, impulsive personas). (4) An open AWS toolkit for organisational deployment.",
        methodology:
          "Phase 1: 700 participants × 16 ecologically valid emails, behavioural cluster analysis. Phase 2: encode personas into Bedrock LLM agents across three prompt configs. Phase 3: 300 new participants × 16 emails, human-AI alignment assessed at ICC ≥ 0.70. Phase 4: AWS deployment toolkit + cost-performance curves. Pre-register; reuse the SnT behavioural-experiment platform Anastasia and I scoped earlier.",
        venues: [
          {
            name: "USENIX Security",
            reason:
              "measurement + human-subjects security fit; AI-persona substitution is a hot topic",
          },
          {
            name: "ACM CHI",
            reason:
              "matches Anastasia's persuasion/personality-traits work; behavioural framing",
          },
          {
            name: "ACM CCS",
            reason:
              "phishing-vector framing; aligns with prior phishing literature",
          },
        ],
        followUpQuestions: [
          "Email-only, or extend to vishing/smishing in Phase 4 (changes IRB scope)?",
          "Do we publish the persona set openly, or only the toolkit (commercial-IP risk)?",
          "Solo PI, or co-author with Anastasia (HEXACO+D mapping) and Sviatlana (LLM bias)?",
        ],
        internalHelp: [
          {
            name: "Anastasia Sergeeva",
            why: "HEXACO+D personality-traits framework + dark-pattern susceptibility methodology",
          },
          {
            name: "Sviatlana Höhn",
            why: "LLM-behaviour evaluation, recipient-design biases on Llama/Gemma/Mistral",
          },
          {
            name: "Gabriele Lenzini",
            why: "PI on the proposal, ethics-review chair, behavioural-experiment governance",
          },
        ],
        externalHelp: [
          {
            name: "Park et al. (Stanford / Generative Agent Simulations)",
            why: "Validation methodology for normalised-accuracy benchmarking against humans",
          },
          {
            name: "EDPS / DPA contact for organisational deployment",
            why: "Required if the toolkit is deployed in production phishing-simulation programmes",
          },
        ],
      },
    },
    {
      id: "n2",
      title: "Quick thought: a shared evaluation harness across the lab",
      rawText:
        "Selene is reproducing Manel's RS-BMD on Drebin; Hicham is iterating M-DAIGT detectors; Soumia's FL-poisoning detection runs across MNIST/CIFAR/PATHMNIST/EUROSAT. Each pipeline reimplements precision/recall/AUC reporting and confidence-interval logic. Could we ship one shared harness — common metrics schema, pre-registration templates, dataset loaders — and let each subgroup plug in their classifier/detector? Would also help my fidelity-matrix work for the AI-persona study.",
      status: "draft",
    },
  ],
  // Core-level notes — Soumia's perspective: privacy/ML, federated learning,
  // EU law.
  3: [
    {
      id: "n3",
      title:
        "Outline: extend targeted-overfitting detection to optimiser-heterogeneous FL",
      rawText:
        "Current paper covers FedAvg with five datasets. Next step: test whether label-flipping PES, backdoor-trigger influence score, and gradient fingerprinting still work under FedSGD, FedProx, and Scaffold (different update semantics). Fingerprint method already fails for FedProx because it returns weights, not gradients — need a unified abstraction. Also need to talk to Manel: his bi-level GA/GP could be repurposed to model an adaptive orchestrator that learns which clients to target — stronger threat model than a static malicious aggregator.",
      status: "draft",
    },
  ],
  // Lead-level notes — Gabriele's perspective: lab strategy across diverse subgroups.
  1: [
    {
      id: "n4",
      title: "Strategy: IRiSC direction next 12 months",
      rawText:
        "Strengths: socio-technical security, dark patterns + personality-trait susceptibility, LLM-powered social robots + recipient-design bias, privacy-preserving ML + federated-learning defence, AI-generated text detection + multi-domain NLP, misinformation + crowdsourced fact-checking, Android malware + bi-level evolutionary optimisation, AI-driven phishing personas. \nGaps: no formal-methods presence; weak socio-technical security coverage. \nDecision: don't hire to fill gaps — Streamline the existing consortia, build new ones in sociotechnical security domains, and the in-flight collaborations with EU Institutions.",
      status: "draft",
    },
  ],
  4: [],
};

// ────────────────────────────────────────────────────────────
// Threads (visibility now expressed via "shareWithRanks" — share with all roles
// at this rank or higher seniority)
// ────────────────────────────────────────────────────────────
export type ThreadVisibility =
  | { kind: "private" }
  | { kind: "lab" }
  | { kind: "share_up_to"; rank: number }; // share with all roles up to (more senior than) rank

export type ThreadReply = {
  fromEmail: string;
  text: string;
  posted: string;
};

export type Thread = {
  id: string;
  title: string;
  authorEmail: string;
  authorRoleId: string;
  visibility: ThreadVisibility;
  /** Newer, explicit audience model — takes precedence over `visibility` when set. */
  audience?: ThreadAudience;
  posted: string;
  replies: number;
  /** Actual reply contents — `replies` is the count, `replyList` is the bodies. */
  replyList?: ThreadReply[];
  status: "open" | "answered" | "needs-lead";
  preview: string;
  feedsKnowledgeBase: boolean;
};

export const sampleThreads: Thread[] = [
  {
    id: "t1",
    title:
      "Reproducing RS-BMD on Drebin — three-way decision fidelity vs simpler baselines?",
    authorEmail: "selene.falchetti@uni.lu",
    authorRoleId: "junior",
    visibility: { kind: "share_up_to", rank: 1 }, // junior raised up to lead
    posted: "2 days ago",
    replies: 3,
    replyList: [
      {
        fromEmail: "manel.jerbi@uni.lu",
        text: "Three-way decision is the differentiator — accept/abstain/reject with the safety_index gives reviewers a much cleaner uncertainty story than a binary classifier. Keep the GP upper-level / GA lower-level competition exactly as in the paper for your first run; the rough-set analyzer is what removes the inconsistent rules and brings the false-positive rate down. I'll push my Drebin loader to the shared repo by Wednesday.",
        posted: "2 days ago",
      },
      {
        fromEmail: "hicham.hammouchi@uni.lu",
        text: "Add a transformer-baseline (DeBERTa or RoBERTa fine-tuned on API call sequences as text) for completeness — that's what we did in M-DAIGT and reviewers expected it. Won't beat RS-BMD on Drebin but useful as a sanity check on your feature pipeline.",
        posted: "2 days ago",
      },
      // {
      //   fromEmail: "suvadeep.mukherjee@uni.lu",
      //   text: "Methodology suggestion: pre-register the evaluation protocol on OSF before running the final numbers, document the apktool version and the Drebin snapshot date, and report safety_index distributions per class — the abstain region is what'll get pushback in review. Saves you a reviewer round.",
      //   posted: "1 day ago",
      // },
      {
        fromEmail: "gabriele.lenzini@uni.lu",
        text: "Selene — start with Manel's RS-BMD pipeline as-is. Once you reproduce the 96.76% number, we can talk about extensions (NSGA-II at the lower level, or extending to AndroZoo). First paper: ESORICS or RAID workshop; extended version targets Cognitive Computation follow-up or ACM CCS.",
        posted: "1 day ago",
      },
    ],
    status: "answered",
    preview:
      "Reproducing Manel's RS-BMD (Cognitive Computation 2024) on Drebin — bi-level GP/GA + Rough-Set Theory, three-way decision (accept/abstain/reject). I want to add an evasion eval but first need to make sure my baseline matches the 96.76% number. Has anyone re-implemented the rough-set analyzer module from scratch?",
    feedsKnowledgeBase: true,
  },
  {
    id: "t2",
    title:
      "AI-persona phishing study: extend Phase 4 to vishing/smishing, or stay email-only?",
    authorEmail: "suvadeep.mukherjee@uni.lu",
    authorRoleId: "senior",
    visibility: { kind: "share_up_to", rank: 1 },
    posted: "5 hours ago",
    replies: 1,
    replyList: [
      {
        fromEmail: "soumia.elmestari@uni.lu",
        text: "If it's email-only the GDPR section stays simple — informed consent + anonymisation of the Prolific cluster data, Art. 89 research exemption applies. Adding voice (vishing) means biometric processing under Art. 9, which is a much heavier ethics dossier. Recommend staying email-only for the AWS deliverable and treating vishing as a Phase 5 follow-on.",
        posted: "3 hours ago",
      },
    ],
    status: "needs-lead",
    preview:
      "AI-persona proposal locks in 700 Phase 1 + 300 Phase 3 participants for email phishing across 5 Bedrock LLMs × 3 prompt configs (10 personas). Reviewers may push us to add a vishing/smishing arm in Phase 4 to show generality. Adds 6 weeks + IRB rework. Worth it for the deliverable, or scope-creep that risks the timeline?",
    feedsKnowledgeBase: true,
  },
  {
    id: "t3",
    title: "Shared evaluation harness across the lab",
    authorEmail: "anastasia.sergeeva@uni.lu",
    authorRoleId: "senior",
    visibility: { kind: "lab" },
    posted: "1 week ago",
    replies: 7,
    replyList: [
      {
        fromEmail: "manel.jerbi@uni.lu",
        text: "Strongly in favour — I'll contribute Drebin loader + the API-call-sequence representation we use in RS-BMD. Next on my side: NSGA-II at the lower-level instead of plain GA for adversarial pattern generation. Happy to own the malware track.",
        posted: "6 days ago",
      },
      {
        fromEmail: "selene.falchetti@uni.lu",
        text: "+1 from me — I'd rather plug into a shared harness than rewrite the metrics layer. Could the harness expose the safety_index / three-way-decision scoring so I don't have to maintain it separately for my Drebin reproduction?",
        posted: "6 days ago",
      },
      {
        fromEmail: "hicham.hammouchi@uni.lu",
        text: "For the AI-generated-text side (M-DAIGT) I need text-domain attacks — paraphrase, synonym swap, back-translation, plus the 'humanizer' attacks Wu et al. 2025 cite. Different from malware, but the eval scaffolding (precision/recall/F1, support per class, confidence intervals) is identical. Let's agree on a common metrics schema first.",
        posted: "5 days ago",
      },
      {
        fromEmail: "sviatlana.hoehn@uni.lu",
        text: "On the LLM-bias / recipient-design side I need a Conversation interface (multi-turn, persona-conditioned) plus the ability to swap Llama 3.1, Gemma 2, Mistral NeMo, Mistral Small from a single config — currently I fork the runner per model. If the harness owns that abstraction it solves a real pain.",
        posted: "5 days ago",
      },
      {
        fromEmail: "soumia.elmestari@uni.lu",
        text: "From the FL-attack side: please add label-flipping (PES score) and trigger-influence-score primitives — both fit the same metrics schema. Would also let Suvadeep reuse them for the AI-persona fidelity matrix.",
        posted: "4 days ago",
      },
      {
        fromEmail: "gabriele.lenzini@uni.lu",
        text: "Approving the 2-week scoping sprint. Anastasia leads scoping, Manel owns the malware track, Hicham + Sviatlana own the text/LLM track, Soumia owns the privacy-attacks track, Suvadeep folds in the AI-persona benchmarking metrics. Report back at the May 4 sync with a v0 spec.",
        posted: "4 days ago",
      },
      {
        fromEmail: "anastasia.sergeeva@uni.lu",
        text: "Scoping doc started — link in the team KB. Targeting v0 release by May 18 so it's usable inside the DARKAID pilot and the AI-persona Phase 2 calibration.",
        posted: "3 days ago",
      },
    ],
    status: "open",
    preview:
      "Selene (Drebin/RS-BMD), Hicham (M-DAIGT detectors), Sviatlana (LLM bias on Llama/Gemma/Mistral), Soumia (FL-attack detection), and Suvadeep (AI-persona fidelity) are all writing eval scaffolding from scratch. Proposal: one shared harness with a common metrics schema, pre-registration templates, and per-domain dataset loaders. Who wants to help scope it?",
    feedsKnowledgeBase: true,
  },
  {
    id: "t4",
    title:
      "DARKAID FNR CORE 2026 — final author list and WP4 red-teaming scope",
    authorEmail: "gabriele.lenzini@uni.lu",
    authorRoleId: "lead",
    visibility: { kind: "share_up_to", rank: 2 }, // lead → senior+
    posted: "12 days ago",
    replies: 2,
    replyList: [
      {
        fromEmail: "anastasia.sergeeva@uni.lu",
        text: "My HEXACO+D paper (IJHCI accepted) gives the personality-trait → DP susceptibility mapping that WP2 needs. I can author the WP2 behavioural-experiment design and contribute to WP4 red-team prompt design. Schilling (Trier, my co-author) might be worth pulling in as an external advisor for the personality framework.",
        posted: "2 days ago",
      },
      {
        fromEmail: "suvadeep.mukherjee@uni.lu",
        text: "Confirmed as postdoc on the project — I'll lead WP2 (T2.1–T2.3 behavioural research), contribute to WP3 calibration design with Yuejun, and contribute to WP4 (rule-based detection T4.2). The AI-driven phishing-personas methodology I'm building under the AWS proposal feeds directly into the Phase-3 calibration pipeline. Yuejun and I have synced on the SageMaker compute split.",
        posted: "2 days ago",
      },
    ],
    status: "open",
    preview:
      "DARKAID consortium: LIST (coordinator, Yuejun Guo PI) + SnT (UL, me as Co-PI). Suvadeep is the LIST postdoc (24 PM); we hire 1 PhD on the SnT side (48 PM, Gabriele supervises, Yuejun + Suvadeep co-supervise). Submission 2026-04-21. Open question: do we expand WP4 red-teaming beyond browser-prototype detection? Anastasia, Suvadeep — input?",
    feedsKnowledgeBase: false,
  },
  {
    id: "t5",
    title:
      "DeceptiLens follow-up — pre-DSA vs post-DSA cookie-banner comparison",
    authorEmail: "soumia.elmestari@uni.lu",
    authorRoleId: "core",
    visibility: { kind: "lab" },
    posted: "1 month ago",
    replies: 3,
    replyList: [
      {
        fromEmail: "anastasia.sergeeva@uni.lu",
        text: "Yes — strongly interested. DeceptiLens already gives us the multimodal-LLM detection backbone; pre-DSA vs post-DSA banner comparison is exactly the measurement case study DARKAID's WP4 needs. Can we set up a 30-min call with the researcher next week?",
        posted: "4 days ago",
      },
      {
        fromEmail: "gabriele.lenzini@uni.lu",
        text: "Take the meeting. If they have prior crawls we can compare, that's a 2-month head start on the empirical side. Loop me in once you have the scope clearer — I want to make sure data-sharing is GDPR-clean before we commit.",
        posted: "3 days ago",
      },
      {
        fromEmail: "yuwei.chuai@uni.lu",
        text: "Multilingual angle could plug in here — if their crawl includes FR/DE/IT, I can contribute the language-coverage analysis. The DiD methodology I used for the Community Notes paper (CSCW 2024) maps cleanly onto the pre/post-DSA comparison.",
        posted: "2 days ago",
      },
    ],
    status: "open",
    preview:
      "Met a researcher working on cookie-banner consent dark patterns under DSA / GDPR. They'd be open to a small joint study comparing pre-DSA vs post-DSA banners across 200 EU sites. Overlaps with the DeceptiLens work and the DARKAID proposal detection prototype.",
    feedsKnowledgeBase: true,
  },
];

export function threadsVisibleTo(
  role: CustomRole,
  threads: Thread[],
): Thread[] {
  return threads.filter((t) => {
    if (t.visibility.kind === "private") return false;
    if (t.visibility.kind === "lab") return true;
    if (t.visibility.kind === "share_up_to") {
      return role.rank <= t.visibility.rank;
    }
    return false;
  });
}

export function threadVisibilityLabel(
  v: ThreadVisibility,
  roles: CustomRole[],
): string {
  if (v.kind === "private") return "Private";
  if (v.kind === "lab") return "Team-wide";
  const r = roles.find((rr) => rr.rank === v.rank);
  return `Share up to ${r?.label ?? "rank " + v.rank}`;
}

// ────────────────────────────────────────────────────────────
// Meetings (visible to everyone with read on meetings)
// ────────────────────────────────────────────────────────────
export type Meeting = {
  id: string;
  title: string;
  date: string;
  duration: string;
  attendeeCount: number;
  decisions: string[];
  actionItems: Array<{ ownerName: string; what: string }>;
  blockers: string[];
};

export const recentMeetings: Meeting[] = [
  {
    id: "m1",
    title: "Weekly IRiSC sync",
    date: "2026-04-27",
    duration: "52 min",
    attendeeCount: 9,
    decisions: [
      "DARKAID FNR CORE submission target locked at 2026-04-21 (PI: Yuejun Guo @ LIST; Co-PI: Gabriele @ SnT)",
      "Suvadeep finalises the AI-driven phishing-personas AWS proposal in parallel; Anastasia is collaborating with Suvadeep on realistic job-role specific phishing email designs for susceptibility experiments",
      "Shared evaluation harness gets a 2-week scoping sprint (Anastasia leads; Manel/Hicham/Sviatlana/Soumia own per-domain tracks)",
      "Quarterly status updates resume — first one due 2026-05-04",
    ],
    actionItems: [
      {
        ownerName: "Soumia Zohra El Mestari",
        what: "Share the FL-poisoning detection harness (PES + trigger-influence + fingerprint algorithms) with Suvadeep for the persona-fidelity metrics layer",
      },
      {
        ownerName: "Suvadeep Mukherjee",
        what: "Prepare revised AI-persona AWS proposal to submit by May 13",
      },
      {
        ownerName: "Selene Falchetti",
        what: "Reproduce Manel's RS-BMD on Drebin to within 1pt of 96.76% accuracy",
      },

      {
        ownerName: "Yuwei Chuai",
        what: "Send the Community Notes DiD methodology notes to Hicham for the M-DAIGT cross-platform extension",
      },
    ],
    blockers: [
      "Need confirmation from LIST on the SageMaker compute split for DARKAID WP3 calibration runs — Gabriele to follow up with Yuejun",
    ],
  },
  {
    id: "m2",
    title: "Weekly IRiSC sync",
    date: "2026-04-20",
    duration: "47 min",
    attendeeCount: 7,
    decisions: [
      "DARKAID consortium signed off (LIST + SnT); 2 FTE limit respected",
      "Sviatlana to demo the multi-LLM recipient-design analysis (Llama 3.1 / Gemma 2 / Mistral) at the May 12 seminar",
    ],
    actionItems: [
      {
        ownerName: "Soumia Zohra El Mestari",
        what: "Push the Poison-to-Detect codebase (label-flip / backdoor / fingerprint) to the team GitHub before May",
      },
      {
        ownerName: "Manel Jerbi",
        what: "Push the Drebin loader + RS-BMD reference implementation to the shared eval harness repo",
      },
    ],
    blockers: [],
  },
];

// ────────────────────────────────────────────────────────────
// Upcoming dates
// ────────────────────────────────────────────────────────────
export type UpcomingDate = {
  id: string;
  date: string;
  daysUntil: number;
  title: string;
  kind: "deadline" | "talk" | "seminar" | "meeting" | "milestone";
  source: "extracted" | "manual";
  visibleToRanks: number[]; // rank numbers
  note?: string;
};

export const upcomingDates: UpcomingDate[] = [
  {
    id: "d1",
    date: "2026-05-04",
    daysUntil: 4,
    title: "DARKAID WP2 design draft due (HEXACO+D × DP-susceptibility matrix)",
    kind: "milestone",
    source: "extracted",
    visibleToRanks: [1, 2],
    note: "Action item from 2026-04-27 sync · Anastasia",
  },
  {
    id: "d2",
    date: "2026-05-15",
    daysUntil: 15,
    title: "USENIX Security 2026 abstract registration opens",
    kind: "deadline",
    source: "extracted",
    visibleToRanks: [1, 2, 3],
    note: "Matches Suvadeep (AI-persona phishing), Soumia (FL-poisoning detection), Hicham (M-DAIGT) profiles",
  },
  {
    id: "d3",
    date: "2026-04-21",
    daysUntil: 21,
    title: "FNR CORE 2026 submission — DARKAID",
    kind: "deadline",
    source: "manual",
    visibleToRanks: [1, 2],
    note: "Hard deadline · LIST coordinator (Yuejun Guo PI), SnT contracting partner (Gabriele Co-PI)",
  },
  {
    id: "d4",
    date: "2026-05-08",
    daysUntil: 8,
    title: "Invited talk: Gabriele @ EU-DARKPAT workshop (Brussels)",
    kind: "talk",
    source: "extracted",
    visibleToRanks: [1, 2],
    note: "Confirmed last week; slides not started — dark patterns + DSA enforcement",
  },
  {
    id: "d5",
    date: "2026-05-12",
    daysUntil: 12,
    title:
      "IRiSC seminar: Sviatlana — LLM bias against neurodivergent users (SIGDIAL 2025 follow-up)",
    kind: "seminar",
    source: "manual",
    visibleToRanks: [1, 2, 3, 4],
    note: "Multi-LLM analysis (Llama 3.1, Gemma 2, Mistral NeMo, Mistral Small) on autism-self-disclosure dataset",
  },
  {
    id: "d6",
    date: "2026-05-04",
    daysUntil: 4,
    title: "Weekly IRiSC sync",
    kind: "meeting",
    source: "manual",
    visibleToRanks: [1, 2, 3, 4],
  },
  {
    id: "d7",
    date: "2026-06-02",
    daysUntil: 33,
    title: "ACM CCS 2026 paper deadline",
    kind: "deadline",
    source: "extracted",
    visibleToRanks: [1, 2, 3, 4],
    note: "Pulled from venue calendar; relevant to malware (Manel/Selene, RS-BMD extension) and FL attacks (Soumia)",
  },
  {
    id: "d8",
    date: "2026-05-19",
    daysUntil: 19,
    title: "Poison-to-Detect arXiv revision due",
    kind: "deadline",
    source: "extracted",
    visibleToRanks: [1, 2, 3],
    note: "Soumia + Maciej Zuziak (CNR) — extending experiments to FedSGD and FedProx",
  },
  {
    id: "d9",
    date: "2026-05-06",
    daysUntil: 6,
    title: "Reading group: bi-level optimisation + adversarial ML",
    kind: "seminar",
    source: "manual",
    visibleToRanks: [1, 2, 3, 4],
    note: "Selene leads · Jerbi et al. RS-BMD + Pierazzi et al. + 1 follow-up",
  },
];

export function upcomingForRank(rank: number): UpcomingDate[] {
  return upcomingDates
    .filter((d) => d.visibleToRanks.includes(rank))
    .sort((a, b) => a.daysUntil - b.daysUntil);
}

// ────────────────────────────────────────────────────────────
// Knowledge base channels
// ────────────────────────────────────────────────────────────
export const knowledgeChannels = [
  {
    name: "Public profiles + open data",
    kind: "Public output",
    cadence: "Nightly",
  },
  {
    name: "Institutional / org repository",
    kind: "Internal deposits",
    cadence: "Nightly",
  },
  { name: "GitHub / GitLab", kind: "Code + docs", cadence: "On change" },
  {
    name: "Meeting recordings",
    kind: "Audio → transcript → typed events",
    cadence: "Per meeting",
  },
  {
    name: "Quarterly status updates",
    kind: "Structured form (3 fields)",
    cadence: "Quarterly",
  },
  {
    name: "Proposal / spec drafts",
    kind: "PDF + scope extraction",
    cadence: "On upload",
  },
  { name: "Discussion threads", kind: "Internal Q&A", cadence: "Live" },
  { name: "Slides + posters", kind: "PDF + figures", cadence: "On upload" },
  {
    name: "Email forwards",
    kind: "Magic address (CFPs, intros)",
    cadence: "Live (v2)",
  },
];

// ────────────────────────────────────────────────────────────
// Review queue + group health (lead-only by default)
// ────────────────────────────────────────────────────────────
export const piQueue = [
  {
    kind: "Meeting minutes",
    title: "IRiSC sync — 2026-04-27 (DARKAID + AI-persona phishing)",
    extracted:
      "4 decisions, 5 action items, 1 blocker (LIST SageMaker compute split)",
    sensitivity: "internal",
    confidence: 0.93,
    requiresReview: true,
  },
  {
    kind: "Proposal draft",
    title: "DARKAID — FNR CORE 2026 (v0.4) · LIST coordinator + SnT partner",
    extracted:
      "Skills needed: deceptive-design taxonomy, behavioural calibration, AI red-teaming, browser-prototype detection",
    sensitivity: "confidential",
    confidence: 0.97,
    requiresReview: true,
  },
  {
    kind: "Proposal draft",
    title:
      "AI-driven Digital Personas for Phishing Simulation (AWS) — Suvadeep",
    extracted:
      "Skills needed: behavioural-cluster analysis, multi-LLM benchmarking (5 Bedrock models), HEXACO+D persona mapping, AWS deployment",
    sensitivity: "confidential",
    confidence: 0.95,
    requiresReview: true,
  },
  {
    kind: "Seminar slides",
    title: "Sviatlana — LLM bias against neurodivergent users (May 12)",
    extracted:
      "Topics: recipient design, autism self-disclosure dataset (730 self-descriptions, 144,699 LLM responses), bias-vector projection, denial-of-service in Llama 3.1",
    sensitivity: "public",
    confidence: 0.99,
    requiresReview: false,
  },
  {
    kind: "Status update",
    title: "Q2 update — Soumia (privacy-ML / federated learning)",
    extracted:
      "Worked on: Poison-to-Detect arXiv preprint (label-flip / backdoor / fingerprint detection). Stuck on: fingerprint method fails for FedProx (returns weights, not gradients). Wants: bi-level adversarial-orchestrator chat with Manel.",
    sensitivity: "internal",
    confidence: 0.94,
    requiresReview: false,
  },
];

export const groupHealth = [
  {
    metric: "Topic coverage",
    value: "8 research lines",
    trend: "+1 (LLM bias / recipient design) vs Q1",
    state: "ok",
  },
  {
    metric: "Co-authorship velocity",
    value: "4 cross-subgroup papers in flight",
    trend: "+60%",
    state: "good",
  },
  {
    metric: "External engagement",
    value: "11 invited talks / panels",
    trend: "+2 vs Q1",
    state: "good",
  },
  {
    metric: "Proposal pipeline",
    value:
      "DARKAID FNR CORE submission in 21 days · AWS phishing-personas in parallel",
    trend: "on track",
    state: "ok",
  },
  {
    metric: "Onboarding load",
    value: "1 new doctoral researcher (Selene)",
    trend: "watch — needs ≥2 mentors",
    state: "warn",
  },
];

// ────────────────────────────────────────────────────────────
// Pokes — internal urgency-coded asks (the headline feature)
// ────────────────────────────────────────────────────────────
export type PokeUrgency = "low" | "medium" | "high" | "blocking";

export type Poke = {
  id: string;
  fromEmail: string;
  toEmail: string;
  urgency: PokeUrgency;
  question: string;
  posted: string;
  status: "pending" | "ack" | "done";
  threadId?: string;
};

export const samplePokes: Poke[] = [
  {
    id: "p1",
    fromEmail: "suvadeep.mukherjee@uni.lu",
    toEmail: "gabriele.lenzini@uni.lu",
    urgency: "blocking",
    question:
      "Need a yes/no on the vishing/smishing extension to the AI-persona phishing study before EOD — AWS reviewers asked, and adding voice puts us under Art. 9 biometrics with a 6-week IRB rework.",
    posted: "2h ago",
    status: "pending",
    threadId: "t2",
  },
  {
    id: "p2",
    fromEmail: "selene.falchetti@uni.lu",
    toEmail: "manel.jerbi@uni.lu",
    urgency: "high",
    question:
      "Can you share the rough-set-analyzer threshold values from your Cognitive Computation submission? My Drebin reproduction is off by ~3pts and I think it's the inconsistency-filter threshold.",
    posted: "5h ago",
    status: "pending",
  },
  {
    id: "p3",
    fromEmail: "soumia.elmestari@uni.lu",
    toEmail: "gabriele.lenzini@uni.lu",
    urgency: "medium",
    question:
      "Heads-up: the dark-patterns researcher Anastasia and I met wants a 30-min chat next week on the cookie-banner joint study. Do I take it before DARKAID submission?",
    posted: "1d ago",
    status: "ack",
  },
  {
    id: "p4",
    fromEmail: "gabriele.lenzini@uni.lu",
    toEmail: "anastasia.sergeeva@uni.lu",
    urgency: "low",
    question:
      "When you have time, check the DARKAID WP2 draft — particularly the HEXACO+D × DP-susceptibility experimental matrix. No rush, by Friday is fine.",
    posted: "2d ago",
    status: "done",
  },
  {
    id: "p5",
    fromEmail: "yuwei.chuai@uni.lu",
    toEmail: "hicham.hammouchi@uni.lu",
    urgency: "medium",
    question:
      "Want to co-author on a cross-platform AI-generated-content + misinformation benchmark? I can bring the Community Notes DiD methodology, you bring the M-DAIGT detection stack — natural CCS or WWW submission.",
    posted: "6h ago",
    status: "pending",
  },
];

export const urgencyLabel: Record<PokeUrgency, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  blocking: "Blocking",
};

// ────────────────────────────────────────────────────────────
// Notifications (typed; the bell aggregates them)
// ────────────────────────────────────────────────────────────
export type NotificationKind =
  | "poke"
  | "mention"
  | "reply"
  | "assignment"
  | "system";

export type Notification = {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  fromEmail?: string;
  forEmail: string;
  posted: string;
  read: boolean;
  urgency?: PokeUrgency;
};

export const sampleNotifications: Notification[] = [
  {
    id: "nt1",
    kind: "poke",
    title: "Blocking poke: AI-persona phishing — vishing/smishing scope",
    body: "Suvadeep needs your call on extending Phase 4 to voice/SMS before EOD (Art. 9 biometrics implications).",
    fromEmail: "suvadeep.mukherjee@uni.lu",
    forEmail: "gabriele.lenzini@uni.lu",
    posted: "2h ago",
    read: false,
    urgency: "blocking",
  },
  {
    id: "nt2",
    kind: "mention",
    title: "You were mentioned",
    body: "In thread: Reproducing RS-BMD on Drebin — three-way decision fidelity vs simpler baselines",
    fromEmail: "selene.falchetti@uni.lu",
    forEmail: "gabriele.lenzini@uni.lu",
    posted: "3h ago",
    read: false,
  },
  {
    id: "nt3",
    kind: "assignment",
    title: "New assignment from Gabriele",
    body: "Reproduce Manel's RS-BMD on Drebin to within 1pt of 96.76% — due 2026-05-04.",
    fromEmail: "gabriele.lenzini@uni.lu",
    forEmail: "selene.falchetti@uni.lu",
    posted: "1d ago",
    read: false,
  },
  {
    id: "nt4",
    kind: "reply",
    title: "New reply on your thread",
    body: "Shared evaluation harness · 2 new replies (Selene · Hicham)",
    forEmail: "anastasia.sergeeva@uni.lu",
    posted: "1d ago",
    read: true,
  },
  {
    id: "nt5",
    kind: "system",
    title: "FNR CORE deadline approaching",
    body: "DARKAID submission in 21 days. WP1-WP3 at ~80%, WP4 (red-teaming + countermeasure toolkit) at ~50%.",
    forEmail: "gabriele.lenzini@uni.lu",
    posted: "today",
    read: false,
  },
  {
    id: "nt6",
    kind: "system",
    title: "Poison-to-Detect arXiv revision in 19 days",
    body: "Soumia — FedSGD/FedProx extension experiments still need a fingerprint workaround for weight-returning optimisers.",
    forEmail: "soumia.elmestari@uni.lu",
    posted: "today",
    read: false,
  },
];

export function notificationsFor(email: string): Notification[] {
  return sampleNotifications.filter((n) => n.forEmail === email);
}

// ────────────────────────────────────────────────────────────
// Trust principles (sidebar footer)
// ────────────────────────────────────────────────────────────
export const trustPrinciples = [
  "Every AI answer cites real sources or is dropped",
  "Sensitivity is set at capture; AI escalates upward when unsure",
  "Your private notes never leave your workspace",
  "Threads inherit visibility from the role hierarchy you defined",
  "Confidential content is processed by a local model, not the cloud",
];

// ────────────────────────────────────────────────────────────
// Knowledge sources — user-configurable per workspace
// (the user picks which are connected; LLM searches only across
// sources they have allowed at query time)
// ────────────────────────────────────────────────────────────
export type KnowledgeSourceId =
  | "team-kb"
  | "your-notes"
  | "outlook-mail"
  | "ms-teams"
  | "onedrive"
  | "dropbox"
  | "github"
  | "gitlab"
  | "meeting-recordings"
  | "orcid"
  | "google-drive"
  | "slack";

export type KnowledgeSource = {
  id: KnowledgeSourceId;
  name: string;
  group: "Internal" | "Communication" | "Storage" | "Code" | "Public";
  description: string;
  /** Default scope when first connected. Roles below `minRank` cannot connect this source for the team. */
  minRankToConnect: number;
};

export const knowledgeSources: KnowledgeSource[] = [
  {
    id: "team-kb",
    name: "Team knowledge base",
    group: "Internal",
    description: "Threads, meetings, notes, profiles inside this workspace.",
    minRankToConnect: 4,
  },
  {
    id: "your-notes",
    name: "Your private notes",
    group: "Internal",
    description: "Only your own notes. Never shared with others.",
    minRankToConnect: 4,
  },
  {
    id: "outlook-mail",
    name: "Microsoft Outlook (your inbox)",
    group: "Communication",
    description: "Your work email — search threads, CFPs, intros.",
    minRankToConnect: 4,
  },
  {
    id: "ms-teams",
    name: "Microsoft Teams chats",
    group: "Communication",
    description: "Channels and DMs you're a member of.",
    minRankToConnect: 4,
  },
  {
    id: "slack",
    name: "Slack workspace",
    group: "Communication",
    description: "Public channels (and DMs you opt-in).",
    minRankToConnect: 4,
  },
  {
    id: "meeting-recordings",
    name: "Meeting recordings",
    group: "Communication",
    description: "Transcribed + diarized; access mirrors meeting attendance.",
    minRankToConnect: 3,
  },
  {
    id: "onedrive",
    name: "OneDrive",
    group: "Storage",
    description: "Files in your OneDrive folders that you grant access to.",
    minRankToConnect: 4,
  },
  {
    id: "google-drive",
    name: "Google Drive",
    group: "Storage",
    description: "Folders you share with the workspace.",
    minRankToConnect: 4,
  },
  {
    id: "dropbox",
    name: "Dropbox",
    group: "Storage",
    description: "Folders you share with the workspace.",
    minRankToConnect: 4,
  },
  {
    id: "github",
    name: "GitHub repos",
    group: "Code",
    description: "Connected repositories — code, READMEs, issues.",
    minRankToConnect: 3,
  },
  {
    id: "gitlab",
    name: "GitLab repos",
    group: "Code",
    description: "Connected GitLab projects.",
    minRankToConnect: 3,
  },
  {
    id: "orcid",
    name: "ORCID",
    group: "Public",
    description: "Public publication metadata from ORCID (no full text).",
    minRankToConnect: 4,
  },
];

// ────────────────────────────────────────────────────────────
// Achievements — anyone can post; everyone gets notified
// ────────────────────────────────────────────────────────────
export type AchievementKind =
  | "publication"
  | "presentation"
  | "award"
  | "grant"
  | "project"
  | "milestone"
  | "other";

export const achievementKindLabel: Record<AchievementKind, string> = {
  publication: "Publication",
  presentation: "Presentation",
  award: "Award",
  grant: "Grant",
  project: "Project",
  milestone: "Milestone",
  other: "Other",
};

export type Achievement = {
  id: string;
  authorEmail: string;
  kind: AchievementKind;
  title: string;
  detail: string;
  url?: string;
  posted: string; // human-readable
  cheers: string[]; // emails who cheered
};

export const sampleAchievements: Achievement[] = [
  {
    id: "a1",
    authorEmail: "anastasia.sergeeva@uni.lu",
    kind: "publication",
    title:
      "IJHCI accepted: Dark Patterns to nudge them all? Personality-trait susceptibility to DPs in e-commerce",
    detail:
      "With Tomek Schilling (Trier). Pre-registered experiment (N=964) on five common DPs (Decoy, Drip Pricing, Default Bias, Scarcity) using HEXACO+D personality framework. High Emotionality + Disintegration, low Honesty-Humility predict susceptibility.",
    url: "https://doi.org/10.1080/10447318.2026.2662520",
    posted: "yesterday",
    cheers: [
      "gabriele.lenzini@uni.lu",
      "soumia.elmestari@uni.lu",
      "suvadeep.mukherjee@uni.lu",
    ],
  },
  {
    id: "a2",
    authorEmail: "soumia.elmestari@uni.lu",
    kind: "publication",
    title:
      "Preprint live: Poison to Detect — Detection of Targeted Overfitting in Federated Learning",
    detail:
      "With Maciej Zuziak (CNR Pisa) and Gabriele. Three client-side detection methods (label-flipping PES, backdoor-trigger influence, gradient fingerprinting) for orchestrator-driven targeted aggregation. Tested on MNIST, CIFAR-10/100, PATHMNIST, EUROSAT.",
    url: "https://arxiv.org/abs/2509.11974",
    posted: "2 days ago",
    cheers: ["gabriele.lenzini@uni.lu", "anastasia.sergeeva@uni.lu"],
  },
  {
    id: "a3",
    authorEmail: "hicham.hammouchi@uni.lu",
    kind: "publication",
    title:
      "RANLP 2025 shared task report published: M-DAIGT — Multi-Domain Detection of AI-Generated Text",
    detail:
      "Co-organised with Lamsiyah (UL), Ezzini (KFUPM), El Mahdaouy (UM6P), and team. 30,000-sample benchmark across news (CNN Daily) and academic (ArXiv) domains. 46 teams registered, 4 submitted; top systems hit perfect F1 on AWD subtask.",
    posted: "3 days ago",
    cheers: ["suvadeep.mukherjee@uni.lu", "yuwei.chuai@uni.lu"],
  },
  {
    id: "a4",
    authorEmail: "gabriele.lenzini@uni.lu",
    kind: "grant",
    title: "DARKAID FNR CORE 2026 consortium agreement signed (LIST + SnT)",
    detail:
      "€780k overall, €745k requested from FNR. Yuejun Guo (LIST) PI, me as Co-PI. Suvadeep as 24-PM postdoc on the LIST side, 1 PhD candidate on SnT side (48 PM). Submission 2026-04-21.",
    posted: "1 week ago",
    cheers: [
      "anastasia.sergeeva@uni.lu",
      "suvadeep.mukherjee@uni.lu",
      "soumia.elmestari@uni.lu",
    ],
  },
  {
    id: "a5",
    authorEmail: "yuwei.chuai@uni.lu",
    kind: "publication",
    title:
      "CSCW 2024 published: Did the Roll-Out of Community Notes Reduce Engagement With Misinformation on X/Twitter?",
    detail:
      "With Haoye Tian (UniMelb), Nicolas Pröllochs (JLU Giessen), Gabriele. DiD + RDD analysis on 30K+ English tweets. Notes reduce engagement after CRH display, but the response time is too slow vs the 79.5-min half-life of viral tweets.",
    url: "https://doi.org/10.1145/3686967",
    posted: "4 days ago",
    cheers: ["gabriele.lenzini@uni.lu", "hicham.hammouchi@uni.lu"],
  },
  {
    id: "a6",
    authorEmail: "manel.jerbi@uni.lu",
    kind: "publication",
    title:
      "Cognitive Computation 2024: RS-BMD — Rough-Set-based Bi-Level Malware Detection (96.76% accuracy on Drebin)",
    detail:
      "With Chelly Dagdia (UVSQ Paris-Saclay), Bechikh, and Ben Said (SMART Lab Tunis). Bi-level GP/GA with three-way decision making (accept/abstain/reject). Pushed the reference implementation to the team GitHub for Selene to extend.",
    url: "https://doi.org/10.1007/s12559-024-10337-6",
    posted: "5 days ago",
    cheers: ["selene.falchetti@uni.lu", "hicham.hammouchi@uni.lu"],
  },
];

// ────────────────────────────────────────────────────────────
// Weekly activity updates — each member shares progress;
// lead sees a roll-up; can reply or send a reminder.
// ────────────────────────────────────────────────────────────
export type WeeklyUpdate = {
  id: string;
  authorEmail: string;
  weekOf: string; // e.g., "2026-04-27"
  did: string;
  stuck?: string;
  next: string;
  helpFromEmail?: string;
  helpAsk?: string;
  url?: string;
  posted: string;
  replies: Array<{ fromEmail: string; text: string; posted: string }>;
};

export const sampleWeeklyUpdates: WeeklyUpdate[] = [
  {
    id: "w1",
    authorEmail: "selene.falchetti@uni.lu",
    weekOf: "2026-04-27",
    did: "Stood up Manel's RS-BMD reference implementation locally; reproduced the GP-based detection-rule generation on a Drebin subset (small population, sanity-check run). Read the rough-set-analyzer module in detail.",
    stuck:
      "The lower-level GA produces inconsistent malicious patterns at high mutation rates — I think I'm seeding the rough-set-analyzer threshold wrong. The 96.76% number depends on this filter working correctly.",
    next: "Full Drebin reproduction this week; ping Manel if I can't match the paper number within 1pt.",
    helpFromEmail: "manel.jerbi@uni.lu",
    helpAsk:
      "Could you share the seeded rough-set-analyzer threshold values you used for the Cognitive Computation submission? Mine are guesses from the paper.",
    posted: "today",
    replies: [],
  },
  {
    id: "w2",
    authorEmail: "soumia.elmestari@uni.lu",
    weekOf: "2026-04-27",
    did: "Pushed the Poison-to-Detect codebase + README; opened a PR adding the analytical-threshold algorithm for fingerprint detection. Started the FedSGD/FedProx extension experiments.",
    next: "Finalise the FedProx fingerprint workaround (weights vs gradients abstraction); send the GDPR / Art. 89 advisory note to Yuejun for DARKAID WP1.",
    posted: "yesterday",
    replies: [],
  },
  {
    id: "w3",
    authorEmail: "hicham.hammouchi@uni.lu",
    weekOf: "2026-04-20",
    did: "M-DAIGT shared-task report drafted with Lamsiyah and the team; baselines (ARBERTv2, LogReg char/word n-grams) reach ~96-99% F1, top participant systems hit 1.000 on AWD. Started the adversarial-paraphrasing extension Yuwei proposed.",
    next: "Document the multilingual extension path in the harness so Selene can plug in later; co-author meeting with Yuwei on the cross-platform angle for CCS.",
    posted: "1 week ago",
    replies: [
      {
        fromEmail: "gabriele.lenzini@uni.lu",
        text: "Great — please add a notebook showing how to swap classifiers. And congrats on the M-DAIGT writeup, the multi-domain framing is exactly what RANLP wanted.",
        posted: "5 days ago",
      },
    ],
  },
  {
    id: "w4",
    authorEmail: "sviatlana.hoehn@uni.lu",
    weekOf: "2026-04-27",
    did: "Followed up on the SIGDIAL 2025 paper: re-ran the bias-vector projection across Llama 3.1, Gemma 2, Mistral NeMo, Mistral Small for a new neutral-question control set. Bias transfers across models even when classifier is trained on a different model's outputs.",
    stuck:
      "Llama 3.1 'denial-of-service' on neurodivergence-related prompts is hard to mitigate without losing recipient-design fidelity. Need a principled middle ground.",
    next: "Demo at the May 12 seminar; talk to Anastasia about whether HEXACO+D persona traits could be added as a third axis to the recipient-design analysis.",
    posted: "today",
    replies: [],
  },
  {
    id: "w5",
    authorEmail: "manel.jerbi@uni.lu",
    weekOf: "2026-04-27",
    did: "Pushed Drebin loader + the RS-BMD reference implementation (Cognitive Computation 2024) to the shared harness. Started the NSGA-II extension at the lower level (replacing the plain GA for malicious-pattern generation).",
    next: "Mentor Selene on the rough-set-analyzer thresholding; first benchmark pass of NSGA-II vs the original GA next week.",
    posted: "yesterday",
    replies: [],
  },
];

// ────────────────────────────────────────────────────────────
// Notes are PRIVATE to the author. Chat history is PRIVATE
// to the user. We key both by email rather than role rank.
// (The previous role-rank seeds remain as fallbacks for unknown emails.)
// ────────────────────────────────────────────────────────────
export const sampleNotesByEmail: Record<string, Note[]> = {
  "gabriele.lenzini@uni.lu": sampleNotesByRank[1] ?? [],
  "suvadeep.mukherjee@uni.lu": sampleNotesByRank[2] ?? [],
  "anastasia.sergeeva@uni.lu": sampleNotesByRank[2] ?? [],
  "yuwei.chuai@uni.lu": [],
  "hicham.hammouchi@uni.lu": [],
  "sviatlana.hoehn@uni.lu": [],
  "manel.jerbi@uni.lu": [],
  "soumia.elmestari@uni.lu": sampleNotesByRank[3] ?? [],
  "selene.falchetti@uni.lu": sampleNotesByRank[4] ?? [],
};

export const chatsByEmail: Record<string, ChatMsg[]> = {
  "gabriele.lenzini@uni.lu": chatsByRoleRank[1] ?? [],
  "suvadeep.mukherjee@uni.lu": chatsByRoleRank[2] ?? [],
  "anastasia.sergeeva@uni.lu": chatsByRoleRank[2] ?? [],
  "yuwei.chuai@uni.lu": chatsByRoleRank[2] ?? [],
  "hicham.hammouchi@uni.lu": chatsByRoleRank[2] ?? [],
  "sviatlana.hoehn@uni.lu": chatsByRoleRank[2] ?? [],
  "manel.jerbi@uni.lu": chatsByRoleRank[2] ?? [],
  "soumia.elmestari@uni.lu": chatsByRoleRank[3] ?? [],
  "selene.falchetti@uni.lu": chatsByRoleRank[4] ?? [],
};

// ────────────────────────────────────────────────────────────
// Thread participant model — explicit privacy controls
// New `audience` extends the legacy `visibility` field.
// ────────────────────────────────────────────────────────────
export type ThreadAudience =
  | { kind: "private" }
  | { kind: "lab" }
  | { kind: "roles"; roleIds: string[] } // any member of these roles
  | { kind: "persons"; emails: string[] } // explicit list of people
  | { kind: "peers" }; // your role only (peers)

export function describeAudience(
  a: ThreadAudience,
  roles: CustomRole[],
): string {
  if (a.kind === "private") return "Only you";
  if (a.kind === "lab") return "Team-wide";
  if (a.kind === "peers") return "Peers only (your role)";
  if (a.kind === "roles") {
    const labels = a.roleIds
      .map((id) => roles.find((r) => r.id === id)?.label ?? id)
      .filter(Boolean);
    return labels.length ? `Roles: ${labels.join(", ")}` : "Roles: (none)";
  }
  return `${a.emails.length} chosen ${a.emails.length === 1 ? "person" : "people"}`;
}

// ────────────────────────────────────────────────────────────
// GRANTS — anyone can post a grant search domain; AI agents
// fan-out search and return matched calls. Each member's posts
// are visible to the whole team so others can react / co-apply.
// ────────────────────────────────────────────────────────────
export type GrantStatus = "scanning" | "matches" | "applied" | "archived";

export type GrantMatch = {
  id: string;
  name: string; // "FNR CORE 2026"
  funder: string; // "Luxembourg National Research Fund"
  region: string; // "Luxembourg / EU"
  deadline: string; // ISO date
  amount?: string; // "up to €750k"
  link: string;
  fitScore: number; // 0-1 — AI's relevance to the domain
  why: string; // one-line explanation of fit
};

export type GrantThread = {
  id: string;
  authorEmail: string;
  domain: string; // "Behavioral cybersecurity, AI personas"
  regions: string[]; // ["Luxembourg", "EU", "Horizon Europe"]
  funders: string[]; // ["FNR", "EU Commission", "private foundations"]
  notes?: string;
  posted: string;
  status: GrantStatus;
  matches: GrantMatch[];
  comments: Array<{ fromEmail: string; text: string; posted: string }>;
};

export const sampleGrants: GrantThread[] = [
  {
    id: "g1",
    authorEmail: "suvadeep.mukherjee@uni.lu",
    domain:
      "AI-driven digital personas for phishing simulation · LLM behavioural fidelity · ethical cybersecurity experimentation",
    regions: ["Luxembourg", "EU", "International"],
    funders: [
      "AWS Cloud Credits for Research",
      "FNR",
      "Horizon Europe (CL3 Cybersecurity)",
      "Volkswagen Foundation",
    ],
    notes:
      "Looking for mid-size grants where behavioural-cluster analysis + multi-LLM benchmarking + ethical phishing-simulation toolkits are in scope. Prefer 1-3 yr horizons. AWS Bedrock proposal is the immediate ask; longer-term I want to fold this into a Horizon CL3 consortium.",
    posted: "2 days ago",
    status: "matches",
    matches: [
      {
        id: "gm1",
        name: "AWS Cloud Credits for Research — AI Personas / Phishing Simulation",
        funder: "Amazon Web Services",
        region: "International",
        deadline: "2026-06-30",
        amount: "$80k cash + $4.5k AWS credits",
        link: "https://aws.amazon.com/grants/",
        fitScore: 0.96,
        why: "Direct topic fit — proposal already drafted around 5 Bedrock LLMs (Nova, Claude Sonnet 4.5, Llama 4, Mistral Large, Cohere R+) × 3 prompt configs × 10 personas.",
      },
      {
        id: "gm2",
        name: "Horizon Europe — CL3 Cybersecurity 2026",
        funder: "European Commission",
        region: "EU",
        deadline: "2026-11-12",
        amount: "€3-5M consortia",
        link: "https://ec.europa.eu/info/funding-tenders/",
        fitScore: 0.81,
        why: "Cluster 3 calls explicitly for human-centred defences against social engineering. AI-persona substitution for ethical phishing testing maps to the call's 'reduce human exposure' wording.",
      },
      {
        id: "gm3",
        name: "ISF — Internal Security Fund 2026",
        funder: "EU Commission · DG HOME",
        region: "EU",
        deadline: "2026-09-04",
        amount: "€1-2M",
        link: "https://ec.europa.eu/home-affairs/funding/internal-security-fund_en",
        fitScore: 0.55,
        why: "Operational angle — strong fit only if you co-lead with a law-enforcement partner (e.g. Europol EC3). AI-persona toolkit could feed red-team training.",
      },
    ],
    comments: [
      {
        fromEmail: "gabriele.lenzini@uni.lu",
        text: "AWS first; CL3 in November once the AWS deliverable shows fidelity numbers. Loop in Anastasia for the HEXACO+D persona-trait mapping and Sviatlana for the LLM-bias layer.",
        posted: "1 day ago",
      },
      {
        fromEmail: "anastasia.sergeeva@uni.lu",
        text: "Happy to co-design the persona-trait → susceptibility mapping. The HEXACO+D framework I used in the IJHCI paper is directly reusable here.",
        posted: "20h ago",
      },
    ],
  },
  {
    id: "g2",
    authorEmail: "soumia.elmestari@uni.lu",
    domain:
      "Federated learning · client-side detection of orchestrator-driven attacks · privacy-preserving ML under GDPR / AI Act",
    regions: ["EU", "International"],
    funders: [
      "EU Commission (Horizon Europe)",
      "Volkswagen Foundation",
      "Alexander von Humboldt Foundation",
      "FNR ATTRACT",
    ],
    notes:
      "Mid-size grants on FL security where the legal-compliance layer is non-trivial. Want to keep the EU-law framing central, not bolted on. Poison-to-Detect (with CNR Pisa) is the technical anchor.",
    posted: "5 days ago",
    status: "matches",
    matches: [
      {
        id: "gm4",
        name: "Horizon Europe — CL3 Cybersecurity 2026 (Trustworthy AI track)",
        funder: "European Commission",
        region: "EU",
        deadline: "2026-09-30",
        amount: "€2-4M",
        link: "https://ec.europa.eu/info/funding-tenders/",
        fitScore: 0.82,
        why: "Cluster 3 has a federated-learning security line; the orchestrator-as-attacker threat model is exactly the gap they want filled.",
      },
      {
        id: "gm5",
        name: "Volkswagen Foundation — Artificial Intelligence and the Society of the Future",
        funder: "Volkswagen Foundation",
        region: "International",
        deadline: "2026-07-14",
        amount: "up to €1.5M",
        link: "https://www.volkswagenstiftung.de/en/funding/ai-society",
        fitScore: 0.72,
        why: "Explicitly funds interdisciplinary AI-trust work — privacy attacks under decentralised training fits the call.",
      },
    ],
    comments: [],
  },
  {
    id: "g3",
    authorEmail: "anastasia.sergeeva@uni.lu",
    domain:
      "Dark patterns · personality-trait susceptibility · multimodal-LLM detection of deceptive design",
    regions: ["Luxembourg", "EU"],
    funders: ["FNR", "EU Commission (DSA enforcement)", "Mozilla Foundation"],
    notes:
      "DARKAID is the umbrella (LIST-coordinated, I'm SnT-side advisor). Looking for matched calls that fund measurement-at-scale plus the legal/policy follow-through. DeceptiLens (FAccT 2025) and the HEXACO+D paper are the technical anchors.",
    posted: "3 days ago",
    status: "matches",
    matches: [
      {
        id: "gm6",
        name: "FNR CORE 2026 — DARKAID (LIST coordinator + SnT)",
        funder: "Luxembourg National Research Fund",
        region: "Luxembourg",
        deadline: "2026-04-21",
        amount: "up to €750k",
        link: "https://www.fnr.lu/funding-instruments/core/",
        fitScore: 0.95,
        why: "Direct topic fit — dark patterns and AI red-teaming are explicit CORE priorities; SnT/LIST consortium already signed.",
      },
      {
        id: "gm7",
        name: "Mozilla Technology Fund — Trustworthy AI",
        funder: "Mozilla Foundation",
        region: "International",
        deadline: "2026-06-30",
        amount: "$50-100k",
        link: "https://foundation.mozilla.org/en/what-we-fund/awards/mozilla-technology-fund-mtf/",
        fitScore: 0.66,
        why: "Smaller, but matches the open-tooling angle if we ship the DARKAID browser-prototype detector openly.",
      },
    ],
    comments: [
      {
        fromEmail: "soumia.elmestari@uni.lu",
        text: "I can take the GDPR + DSA section — mapping personalised dark patterns to Art. 22 (automated decisions) and DSA Art. 25 is the strongest legal argument.",
        posted: "2 days ago",
      },
    ],
  },
  {
    id: "g4",
    authorEmail: "manel.jerbi@uni.lu",
    domain:
      "Bi-level optimisation for malware detection · rough-set theory · three-way decision making · Android security",
    regions: ["EU", "International"],
    funders: ["FNR", "Horizon Europe", "NSF (US)", "DARPA"],
    notes:
      "Want to fund the NSGA-II extension to RS-BMD — multi-objective at the lower level for adversarial pattern diversity. Selene's PhD overlaps; could be a joint application with the SMART Lab Tunis team.",
    posted: "1 week ago",
    status: "scanning",
    matches: [],
    comments: [],
  },
  {
    id: "g5",
    authorEmail: "yuwei.chuai@uni.lu",
    domain:
      "Crowdsourced fact-checking · platform interventions · DiD/RDD measurement of misinformation engagement",
    regions: ["EU", "International"],
    funders: [
      "Horizon Europe (CL2)",
      "Knight Foundation",
      "Open Society Foundations",
      "FNR",
    ],
    notes:
      "The DiD + RDD methodology I used for the Community Notes paper (CSCW 2024) generalises to any opt-in platform intervention. Looking for funding to extend to TikTok / Meta cross-platform comparison.",
    posted: "4 days ago",
    status: "scanning",
    matches: [],
    comments: [],
  },
];

// ────────────────────────────────────────────────────────────
// OPPORTUNITIES — internships, summer schools, industry collab
// AI agents search; member posts the call; can ping the lead for
// approval / suggestions; lead replies inline.
// ────────────────────────────────────────────────────────────
export type OpportunityKind =
  | "internship"
  | "summer_school"
  | "industry_collab"
  | "fellowship"
  | "exchange";

export const opportunityKindLabel: Record<OpportunityKind, string> = {
  internship: "Internship",
  summer_school: "Summer school",
  industry_collab: "Industry collaboration",
  fellowship: "Fellowship",
  exchange: "Visiting / exchange",
};

export type OpportunityStatus =
  | "scanning"
  | "matches"
  | "pending_lead"
  | "approved"
  | "declined";

export type OpportunityMatch = {
  id: string;
  title: string;
  org: string;
  country: string;
  deadline?: string;
  link: string;
  fitScore: number;
  why: string;
};

export type OpportunityThread = {
  id: string;
  authorEmail: string;
  kind: OpportunityKind;
  domain: string;
  countries: string[];
  organizations: string[];
  notes?: string;
  posted: string;
  status: OpportunityStatus;
  matches: OpportunityMatch[];
  // Conversation: member can ask the lead; lead can approve / suggest / decline
  conversation: Array<{
    fromEmail: string;
    role: "member" | "lead";
    text: string;
    decision?: "approve" | "decline" | "suggest";
    posted: string;
  }>;
};

export const sampleOpportunities: OpportunityThread[] = [
  {
    id: "o1",
    authorEmail: "selene.falchetti@uni.lu",
    kind: "summer_school",
    domain:
      "Adversarial ML for Android malware · evolutionary detection rules · rough-set theory",
    countries: ["Germany", "Italy", "Switzerland"],
    organizations: ["Max Planck", "Università di Trento", "ETH Zürich"],
    notes:
      "I have 4 weeks free in July. Prefer a school with a strong adversarial-ML track — ideally with a malware track. Want to deepen my evolutionary-computation skills before extending Manel's RS-BMD.",
    posted: "yesterday",
    status: "pending_lead",
    matches: [
      {
        id: "om1",
        title: "MPI Summer School on Trustworthy ML & Security",
        org: "Max Planck Institute for Security & Privacy (MPI-SP)",
        country: "Germany",
        deadline: "2026-05-30",
        link: "https://mpi-sp.org/summer-school",
        fitScore: 0.91,
        why: "Strong adversarial-ML track + invited Pierazzi as lecturer. Matches your Android-evasion focus.",
      },
      {
        id: "om2",
        title: "MLRS Summer School (Trento)",
        org: "Università di Trento",
        country: "Italy",
        deadline: "2026-06-15",
        link: "https://mlrs.unitn.it",
        fitScore: 0.78,
        why: "Shorter, very hands-on. Battista Biggio teaches the adversarial track — directly relevant to your RS-BMD evasion extension.",
      },
      {
        id: "om3",
        title: "ETH PrivSec Summer School",
        org: "ETH Zürich",
        country: "Switzerland",
        deadline: "2026-05-20",
        link: "https://privsec.ethz.ch/summer",
        fitScore: 0.65,
        why: "Heavier on privacy than malware; useful breadth but lighter on your direct topic.",
      },
    ],
    conversation: [
      {
        fromEmail: "selene.falchetti@uni.lu",
        role: "member",
        text: "Gabriele, could I attend the MPI school? It overlaps with the DARKAID pilot week — happy to compress my contribution to that.",
        posted: "yesterday",
      },
    ],
  },
  {
    id: "o2",
    authorEmail: "suvadeep.mukherjee@uni.lu",
    kind: "industry_collab",
    domain:
      "AI-driven phishing personas for organisational red-teaming · multi-LLM benchmarking · ethical-experimentation toolkits",
    countries: ["Luxembourg", "Belgium", "France"],
    organizations: ["POST Luxembourg", "BNP Paribas", "Orange Cyberdefense"],
    posted: "3 days ago",
    status: "matches",
    matches: [
      {
        id: "om4",
        title: "POST Luxembourg — Red-team co-design with AI personas (email)",
        org: "POST Luxembourg",
        country: "Luxembourg",
        link: "https://www.post.lu/en/business/cybersecurity",
        fitScore: 0.85,
        why: "Operational employee phishing-response data + the AWS toolkit deliverable fit; SnT has prior MOU with POST.",
      },
      {
        id: "om5",
        title: "Orange Cyberdefense — Social engineering research lab",
        org: "Orange Cyberdefense",
        country: "France",
        link: "https://www.orangecyberdefense.com",
        fitScore: 0.72,
        why: "Funded research line on AI-driven phishing simulation. Could co-fund a postdoc through the partnership once the AWS fidelity numbers land.",
      },
    ],
    conversation: [],
  },
  {
    id: "o3",
    authorEmail: "soumia.elmestari@uni.lu",
    kind: "internship",
    domain:
      "Federated-learning attack/defence · client-side detection of orchestrator-driven attacks",
    countries: ["EU", "Switzerland"],
    organizations: [
      "EPFL SPRING Lab",
      "INRIA Privatics",
      "ETH SRI",
      "CNR-ISTI Pisa",
    ],
    notes:
      "Looking for a 6-month internship slot for a strong MSc student we'd like to recruit into the lab. CNR-ISTI Pisa (Maciej Zuziak's group) is the warmest contact via the Poison-to-Detect collaboration.",
    posted: "1 week ago",
    status: "scanning",
    matches: [],
    conversation: [],
  },
  {
    id: "o4",
    authorEmail: "yuwei.chuai@uni.lu",
    kind: "industry_collab",
    domain:
      "Crowdsourced fact-checking · platform-intervention measurement · cross-platform misinformation",
    countries: ["Belgium", "France", "Germany"],
    organizations: [
      "EDMO Hub",
      "Logically (UK/India)",
      "AFP Factuel",
      "Correctiv",
    ],
    posted: "5 days ago",
    status: "matches",
    matches: [
      {
        id: "om6",
        title:
          "EDMO — European Digital Media Observatory · research collaboration",
        org: "EDMO Hub (KU Leuven)",
        country: "Belgium",
        link: "https://edmo.eu",
        fitScore: 0.87,
        why: "Pan-European fact-checker network — direct match for the cross-platform DiD/RDD methodology you used in CSCW 2024. Funded slots open in Q3.",
      },
      {
        id: "om7",
        title: "Correctiv — Newsroom data partnership",
        org: "Correctiv (Berlin)",
        country: "Germany",
        link: "https://correctiv.org",
        fitScore: 0.7,
        why: "DE-language fact-check archive — useful for the cross-language extension of your Community Notes work.",
      },
    ],
    conversation: [],
  },
  {
    id: "o5",
    authorEmail: "anastasia.sergeeva@uni.lu",
    kind: "summer_school",
    domain:
      "Dark patterns · personality-based susceptibility · HCI for trust and safety",
    countries: ["Netherlands", "Germany", "UK"],
    organizations: [
      "TU Delft",
      "Aarhus University",
      "Oxford Internet Institute",
    ],
    posted: "6 days ago",
    status: "approved",
    matches: [
      {
        id: "om8",
        title: "Oxford Internet Institute — Summer Doctoral Programme",
        org: "Oxford Internet Institute (OII)",
        country: "UK",
        deadline: "2026-04-25",
        link: "https://www.oii.ox.ac.uk/study/summer-doctoral-programme/",
        fitScore: 0.84,
        why: "Direct fit with your HEXACO+D × DP-susceptibility line; OII has Mathur and a strong policy network.",
      },
    ],
    conversation: [
      {
        fromEmail: "anastasia.sergeeva@uni.lu",
        role: "member",
        text: "OII summer programme overlaps with the DARKAID writing — but the Mathur connection is strategic. Worth attending?",
        posted: "5 days ago",
      },
      {
        fromEmail: "gabriele.lenzini@uni.lu",
        role: "lead",
        text: "Yes — go. The Mathur introduction is exactly what we need to anchor DARKAID's measurement framing internationally. We'll cover your DARKAID slot during that week.",
        decision: "approve",
        posted: "4 days ago",
      },
    ],
  },
  {
    id: "o6",
    authorEmail: "manel.jerbi@uni.lu",
    kind: "fellowship",
    domain:
      "Android malware detection · bi-level evolutionary optimisation · multi-objective adversarial pattern generation",
    countries: ["EU", "USA"],
    organizations: [
      "Marie Skłodowska-Curie Actions",
      "Humboldt Foundation",
      "DARPA YFA",
    ],
    posted: "2 weeks ago",
    status: "scanning",
    matches: [],
    conversation: [],
  },
];

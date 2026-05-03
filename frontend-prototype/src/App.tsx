import { useEffect, useMemo, useRef, useState } from "react";
import {
  achievementKindLabel,
  brand,
  can,
  chatsByEmail,
  chatsByRoleRank,
  componentLabels,
  defaultRoles,
  describeAudience,
  groupHealth,
  initialAllowlist,
  knowledgeChannels,
  knowledgeSources,
  makeUserFromEmail,
  notificationsFor,
  opportunityKindLabel,
  permissionLabel,
  piQueue,
  recentMeetings,
  sampleAchievements,
  sampleGrants,
  sampleNotesByEmail,
  sampleNotesByRank,
  sampleOpportunities,
  samplePokes,
  sampleTeammates,
  sampleThreads,
  sampleWeeklyUpdates,
  suggestedPromptsByRank,
  threadsVisibleTo,
  threadVisibilityLabel,
  trustPrinciples,
  upcomingDates,
  urgencyLabel,
  type Achievement,
  type AchievementKind,
  type AllowlistEntry,
  type ChatMsg,
  type Component,
  type CustomRole,
  type GrantThread,
  type KnowledgeSourceId,
  type Note,
  type Notification,
  type OpportunityKind,
  type OpportunityThread,
  type Permission,
  type Poke,
  type PokeUrgency,
  type Thread,
  type ThreadAudience,
  type ThreadVisibility,
  type UpcomingDate,
  type User,
  type WeeklyUpdate,
} from "./data";

const STORAGE_KEYS = {
  user: "cypearl-user",
  allowlist: "cypearl-allowlist",
  roles: "cypearl-roles",
  tab: "cypearl-tab",
};

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function normalizeRoles(stored: CustomRole[]): CustomRole[] {
  const defaultsById = new Map(defaultRoles.map((r) => [r.id, r]));
  const merged = stored.map((r) => {
    const def = defaultsById.get(r.id);
    if (!def) return r;
    if (r.id === "senior" && r.label.includes("Research Scientist")) {
      return { ...r, label: def.label, description: def.description };
    }
    return r;
  });
  for (const def of defaultRoles) {
    if (!merged.some((r) => r.id === def.id)) merged.push(def);
  }
  return merged;
}

type Tab =
  | "chat"
  | "notes"
  | "threads"
  | "meetings"
  | "upcoming"
  | "knowledge"
  | "pokes"
  | "achievements"
  | "weekly"
  | "grants"
  | "opportunities"
  | "admin";

// ────────────────────────────────────────────────────────────
// Root: handles auth + the rest
//
// Privacy model: only emails on the team lead's allowlist may sign in.
// In production each member authenticates against their email provider
// (e.g. Outlook / Microsoft 365). The role is fixed by the lead — the
// member never picks a role, and the lead cannot view another role's
// private workspace (notes, chat history, scoped threads).
// ────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState<User | null>(() =>
    readStorage<User | null>(STORAGE_KEYS.user, null),
  );
  const [allowlist, setAllowlist] = useState<AllowlistEntry[]>(() =>
    readStorage<AllowlistEntry[]>(STORAGE_KEYS.allowlist, initialAllowlist),
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.allowlist, JSON.stringify(allowlist));
  }, [allowlist]);

  useEffect(() => {
    const byEmail = new Map(
      sampleTeammates.map((t) => [t.email.toLowerCase(), t]),
    );
    let changed = false;
    const updated = allowlist.map((a) => {
      const sample = byEmail.get(a.email.toLowerCase());
      if (!sample) return a;
      let next = a;
      if (!a.orcid && sample.orcid) {
        next = { ...next, orcid: sample.orcid };
        changed = true;
      }
      if (
        a.roleId === "senior" &&
        sample.roleId === "scientist" &&
        a.name === sample.name
      ) {
        next = { ...next, roleId: sample.roleId };
        changed = true;
      }
      return next;
    });
    if (changed) setAllowlist(updated);
  }, [allowlist]);

  useEffect(() => {
    if (!user) {
      localStorage.removeItem(STORAGE_KEYS.user);
      return;
    }
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
  }, [user]);

  if (!user)
    return <SignIn allowlist={allowlist} onSignIn={(u) => setUser(u)} />;
  return (
    <Workspace
      user={user}
      onSignOut={() => setUser(null)}
      allowlist={allowlist}
      setAllowlist={setAllowlist}
    />
  );
}

// ────────────────────────────────────────────────────────────
// SIGN IN — work-email + Outlook auth simulation, allowlist-gated.
// The role is fixed by the lead; the user never picks one.
// ────────────────────────────────────────────────────────────
function SignIn({
  allowlist,
  onSignIn,
}: {
  allowlist: AllowlistEntry[];
  onSignIn: (u: User) => void;
}) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const cleaned = email.trim().toLowerCase();
    if (!cleaned.includes("@") || cleaned.length < 4) {
      setError("Enter a valid work email.");
      return;
    }
    const entry = allowlist.find((a) => a.email.toLowerCase() === cleaned);
    if (!entry) {
      setError(
        "This email isn't on your team's allowlist. Ask your team lead to add you (Admin → Members).",
      );
      return;
    }
    setError(null);
    // Honour the name + role from the allowlist; ignore anything the user typed.
    const u = makeUserFromEmail(entry.email, entry.roleId);
    onSignIn({
      ...u,
      name: entry.name,
      initials: makeInitials(entry.name),
      orcid: entry.orcid,
    });
  }

  return (
    <div className="signin-shell">
      <div className="signin-card">
        <div className="signin-brand">
          <img src="/image.png" alt="SyncyTeam" className="brand-logo big" />
          <div>
            <h1>{brand.name}</h1>
            <p>{brand.sub}</p>
          </div>
        </div>
        <p className="signin-tagline">{brand.tagline}</p>

        <form className="signin-form" onSubmit={submit}>
          <label>
            <span>Work email</span>
            <input
              type="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="firstname.surname@uni.lu"
            />
            <small className="signin-hint">
              You'll be redirected to your provider (e.g. Microsoft / Outlook)
              to authenticate. Only emails on your team's allowlist can sign in.
            </small>
          </label>
          {error && <p className="signin-error">{error}</p>}
          <button className="btn primary" type="submit">
            Continue with email
          </button>
        </form>
      </div>
    </div>
  );
}

function makeInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");
}

// ────────────────────────────────────────────────────────────
// WORKSPACE
//
// Privacy: a lead can administer roles + members but cannot view another
// member's private surfaces (notes, chat history, role-scoped threads).
// The "viewing as" role indicator simply mirrors the user's own role.
// ────────────────────────────────────────────────────────────
function Workspace({
  user,
  onSignOut,
  allowlist,
  setAllowlist,
}: {
  user: User;
  onSignOut: () => void;
  allowlist: AllowlistEntry[];
  setAllowlist: (a: AllowlistEntry[]) => void;
}) {
  const [roles, setRoles] = useState<CustomRole[]>(() =>
    normalizeRoles(readStorage<CustomRole[]>(STORAGE_KEYS.roles, defaultRoles)),
  );

  const userRole = roles.find((r) => r.id === user.roleId)!;
  const activeRole = userRole;
  const isLead = userRole.isAdmin === true;

  const tabs = useMemo(() => buildTabs(activeRole), [activeRole]);
  const savedTab = readStorage<Tab | null>(STORAGE_KEYS.tab, null);
  const [tab, setTab] = useState<Tab>(savedTab ?? tabs[0]?.id ?? "chat");

  // Per-tab unseen counters. Incremented when a teammate posts new
  // content in a given surface; cleared when the user opens that tab.
  const [tabBadges, setTabBadges] = useState<Partial<Record<Tab, number>>>({
    threads: 1,
    achievements: 1,
    grants: 1,
    opportunities: 1,
  });
  function bumpBadge(t: Tab) {
    setTabBadges((cur) => ({ ...cur, [t]: (cur[t] ?? 0) + 1 }));
  }
  function clearBadge(t: Tab) {
    setTabBadges((cur) => (cur[t] ? { ...cur, [t]: 0 } : cur));
  }
  function gotoTab(t: Tab) {
    clearBadge(t);
    setTab(t);
  }

  function resetWorkspaceView() {
    const first = tabs[0]?.id ?? "chat";
    setTab(first);
    clearBadge(first);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  useEffect(() => {
    if (!tabs.find((t) => t.id === tab)) setTab(tabs[0]?.id ?? "chat");
  }, [tabs, tab]);

  // Clear the badge for whichever tab is currently open.
  useEffect(() => {
    clearBadge(tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.roles, JSON.stringify(roles));
  }, [roles]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.tab, JSON.stringify(tab));
  }, [tab]);

  const [notifs, setNotifs] = useState<Notification[]>(
    notificationsFor(user.email),
  );
  const [pokes, setPokes] = useState<Poke[]>(samplePokes);
  const [achievements, setAchievements] =
    useState<Achievement[]>(sampleAchievements);
  const [weekly, setWeekly] = useState<WeeklyUpdate[]>(sampleWeeklyUpdates);
  const [threads, setThreads] = useState<Thread[]>(sampleThreads);
  const [dates, setDates] = useState<UpcomingDate[]>(upcomingDates);
  const [grants, setGrants] = useState<GrantThread[]>(sampleGrants);
  const [opportunities, setOpportunities] =
    useState<OpportunityThread[]>(sampleOpportunities);
  const [connectedSources, setConnectedSources] = useState<KnowledgeSourceId[]>(
    ["team-kb", "your-notes", "meeting-recordings"],
  );

  // Keep the module-level lookup in sync so authorName() can resolve
  // members the lead just added via the allowlist.
  useEffect(() => {
    setAllowlistLookup(
      allowlist.map((a) => ({ email: a.email, name: a.name })),
    );
  }, [allowlist]);

  function pushNotif(n: Omit<Notification, "id" | "posted" | "read">) {
    setNotifs((cur) => [
      {
        ...n,
        id: `nt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        posted: "just now",
        read: false,
      },
      ...cur,
    ]);
  }

  function markAllNotifsRead() {
    setNotifs(notifs.map((n) => ({ ...n, read: true })));
  }

  function ackPoke(id: string, status: "ack" | "done") {
    setPokes(pokes.map((p) => (p.id === id ? { ...p, status } : p)));
  }

  function sendPoke(p: Omit<Poke, "id" | "posted" | "status">) {
    const np: Poke = {
      ...p,
      id: `p-${Date.now()}`,
      posted: "just now",
      status: "pending",
    };
    setPokes([np, ...pokes]);
    // when the recipient is the currently signed-in user, pop a notification
    // (otherwise we still record it for the recipient — but they'd see it
    // when they sign in as that email)
    if (p.toEmail === user.email) {
      pushNotif({
        kind: "poke",
        title: `${urgencyLabel[p.urgency]} poke from ${authorName(p.fromEmail)}`,
        body: p.question,
        fromEmail: p.fromEmail,
        forEmail: user.email,
        urgency: p.urgency,
      });
    } else {
      // surface a confirmation in the sender's bell so they see it was queued
      pushNotif({
        kind: "system",
        title: `Poke sent → ${p.toEmail}`,
        body: `${urgencyLabel[p.urgency]} · "${p.question.slice(0, 80)}${p.question.length > 80 ? "…" : ""}"`,
        forEmail: user.email,
      });
    }
  }

  function postAchievement(a: Omit<Achievement, "id" | "posted" | "cheers">) {
    const newA: Achievement = {
      ...a,
      id: `a-${Date.now()}`,
      posted: "just now",
      cheers: [],
    };
    setAchievements([newA, ...achievements]);
    bumpBadge("achievements");
    pushNotif({
      kind: "system",
      title: `🎉 ${authorName(a.authorEmail)} shared an achievement`,
      body: `${achievementKindLabel[a.kind]} — ${a.title}`,
      fromEmail: a.authorEmail,
      forEmail: user.email,
    });
  }

  function cheerAchievement(id: string) {
    setAchievements((all) =>
      all.map((a) =>
        a.id === id
          ? {
              ...a,
              cheers: a.cheers.includes(user.email)
                ? a.cheers.filter((e) => e !== user.email)
                : [...a.cheers, user.email],
            }
          : a,
      ),
    );
  }

  function postWeekly(w: Omit<WeeklyUpdate, "id" | "posted" | "replies">) {
    const np: WeeklyUpdate = {
      ...w,
      id: `w-${Date.now()}`,
      posted: "just now",
      replies: [],
    };
    setWeekly([np, ...weekly]);
    bumpBadge("weekly");
    pushNotif({
      kind: "system",
      title: "Weekly update posted",
      body: `Week of ${w.weekOf} — visible to your team lead.`,
      forEmail: user.email,
    });
  }

  function replyToWeekly(id: string, text: string) {
    setWeekly((all) =>
      all.map((w) =>
        w.id === id
          ? {
              ...w,
              replies: [
                ...w.replies,
                { fromEmail: user.email, text, posted: "just now" },
              ],
            }
          : w,
      ),
    );
  }

  function remindWeekly(toEmail: string) {
    pushNotif({
      kind: "system",
      title: `Reminder sent to ${authorName(toEmail)}`,
      body: "Their weekly update is overdue.",
      forEmail: user.email,
    });
  }

  function addThread(t: Thread) {
    setThreads((cur) => [t, ...cur]);
    bumpBadge("threads");
  }

  function replyToThread(id: string, text: string) {
    setThreads((cur) =>
      cur.map((t) =>
        t.id === id
          ? {
              ...t,
              replies: t.replies + 1,
              replyList: [
                ...(t.replyList ?? []),
                { fromEmail: user.email, text, posted: "just now" },
              ],
            }
          : t,
      ),
    );
  }

  function addDate(d: UpcomingDate) {
    setDates((cur) => [d, ...cur]);
  }

  function toggleSource(id: KnowledgeSourceId) {
    setConnectedSources((cur) =>
      cur.includes(id) ? cur.filter((c) => c !== id) : [...cur, id],
    );
  }

  // The most-urgent unack'd poke addressed to me (banner)
  const urgentPokeForMe = pokes
    .filter(
      (p) =>
        p.toEmail === user.email &&
        p.status === "pending" &&
        (p.urgency === "high" || p.urgency === "blocking"),
    )
    .sort((a, b) => urgencyRank(b.urgency) - urgencyRank(a.urgency))[0];

  // The right rail is shown for ALL signed-in users now — different content
  // for lead vs. non-lead.
  const showRightRail = true;

  return (
    <div className={`shell ${showRightRail ? "with-rail" : ""}`}>
      {/* ── LEFT SIDEBAR ──────────────────────────────────────── */}
      <aside className="sidebar">
        <button
          type="button"
          className="brand brand-btn"
          onClick={resetWorkspaceView}
        >
          <img src="/image.png" alt="SyncyTeam" className="brand-logo big" />
          <div>
            <div className="brand-name">{brand.name}</div>
            <div className="brand-sub">{brand.sub}</div>
          </div>
        </button>

        <RoleBadge role={userRole} />

        <nav className="side-nav">
          <div className="nav-group">
            <div className="nav-group-label">Core Workspace</div>
            {tabs
              .filter((t) =>
                ["chat", "notes", "threads", "pokes"].includes(t.id),
              )
              .map((t) => {
                const count = tabBadges[t.id] ?? 0;
                return (
                  <button
                    key={t.id}
                    className={`nav-item ${tab === t.id ? "active" : ""}`}
                    onClick={() => gotoTab(t.id)}
                  >
                    <span>{t.label}</span>
                    {count > 0 && tab !== t.id && (
                      <span className="nav-badge">{count}</span>
                    )}
                  </button>
                );
              })}
          </div>

          <div className="nav-group">
            <div className="nav-group-label">Team Operations</div>
            {tabs
              .filter((t) =>
                [
                  "meetings",
                  "upcoming",
                  "achievements",
                  "weekly",
                  "grants",
                  "opportunities",
                ].includes(t.id),
              )
              .map((t) => {
                const count = tabBadges[t.id] ?? 0;
                return (
                  <button
                    key={t.id}
                    className={`nav-item ${tab === t.id ? "active" : ""}`}
                    onClick={() => gotoTab(t.id)}
                  >
                    <span>{t.label}</span>
                    {count > 0 && tab !== t.id && (
                      <span className="nav-badge">{count}</span>
                    )}
                  </button>
                );
              })}
          </div>

          {tabs.some((t) => t.id === "admin") && (
            <div className="nav-group">
              <div className="nav-group-label">Admin</div>
              {tabs
                .filter((t) => t.id === "knowledge" || t.id === "admin")
                .map((t) => {
                  const count = tabBadges[t.id] ?? 0;
                  const label = t.id === "admin" ? "Member Control" : t.label;
                  return (
                    <button
                      key={t.id}
                      className={`nav-item ${tab === t.id ? "active" : ""}`}
                      onClick={() => gotoTab(t.id)}
                    >
                      <span>{label}</span>
                      {count > 0 && tab !== t.id && (
                        <span className="nav-badge">{count}</span>
                      )}
                    </button>
                  );
                })}
            </div>
          )}
        </nav>

        <div className="trust-block">
          <div className="nav-group-label">Trust principles</div>
          <ul>
            {trustPrinciples.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
      </aside>

      {/* ── MAIN COLUMN ──────────────────────────────────────── */}
      <div className="content-wrap">
        <TopBar
          user={user}
          activeRole={activeRole}
          notifs={notifs}
          onMarkRead={markAllNotifsRead}
          onSignOut={onSignOut}
        />

        {urgentPokeForMe && (
          <UrgentBanner
            poke={urgentPokeForMe}
            onAck={() => ackPoke(urgentPokeForMe.id, "ack")}
          />
        )}

        <main className="content">
          {tab === "chat" && (
            <ChatTab
              user={user}
              role={activeRole}
              connectedSources={connectedSources}
              allSources={knowledgeSources}
              onToggleSource={toggleSource}
            />
          )}
          {tab === "notes" && <NotesTab user={user} role={activeRole} />}
          {tab === "threads" && (
            <ThreadsTab
              user={user}
              role={activeRole}
              roles={roles}
              teammates={sampleTeammates}
              threads={threads}
              onCreate={addThread}
              onReply={replyToThread}
            />
          )}
          {tab === "meetings" && (
            <MeetingsTab
              user={user}
              roles={roles}
              teammates={sampleTeammates}
            />
          )}
          {tab === "upcoming" && (
            <UpcomingTab
              role={activeRole}
              roles={roles}
              teammates={sampleTeammates}
              dates={dates}
              onAdd={addDate}
            />
          )}
          {tab === "knowledge" && (
            <KnowledgeTab
              role={activeRole}
              connected={connectedSources}
              onToggle={toggleSource}
            />
          )}
          {tab === "pokes" && (
            <PokesTab
              user={user}
              roles={roles}
              teammates={sampleTeammates}
              pokes={pokes}
              onSend={sendPoke}
              onAck={ackPoke}
            />
          )}
          {tab === "achievements" && (
            <AchievementsTab
              user={user}
              achievements={achievements}
              onPost={postAchievement}
              onCheer={cheerAchievement}
            />
          )}
          {tab === "weekly" && (
            <WeeklyTab
              user={user}
              role={activeRole}
              roles={roles}
              teammates={sampleTeammates}
              updates={weekly}
              onPost={postWeekly}
              onReply={replyToWeekly}
              onRemind={remindWeekly}
            />
          )}
          {tab === "grants" && (
            <GrantsTab
              user={user}
              grants={grants}
              setGrants={setGrants}
              onActivity={() => bumpBadge("grants")}
            />
          )}
          {tab === "opportunities" && (
            <OpportunitiesTab
              user={user}
              isLead={isLead}
              opportunities={opportunities}
              setOpportunities={setOpportunities}
              onActivity={() => bumpBadge("opportunities")}
            />
          )}
          {tab === "admin" && (
            <AdminTab
              roles={roles}
              setRoles={setRoles}
              allowlist={allowlist}
              setAllowlist={setAllowlist}
            />
          )}
        </main>
      </div>

      {/* ── RIGHT RAIL ───────────────────────────────────────── */}
      {showRightRail && (
        <RightRail
          role={activeRole}
          isLead={isLead}
          pokes={pokes}
          notifs={notifs}
          achievements={achievements}
          weekly={weekly}
          user={user}
          onAck={ackPoke}
          onOpenTab={(t) => gotoTab(t)}
        />
      )}
    </div>
  );
}

function urgencyRank(u: PokeUrgency): number {
  return u === "blocking" ? 4 : u === "high" ? 3 : u === "medium" ? 2 : 1;
}

function buildTabs(
  role: CustomRole,
): Array<{ id: Tab; label: string; hint?: string }> {
  const t: Array<{ id: Tab; label: string; hint?: string }> = [];
  if (can(role, "chat", "view"))
    t.push({ id: "chat", label: "Ask Your Assistant", hint: "your AI" });
  if (can(role, "notes", "view"))
    t.push({
      id: "notes",
      label: "Create Notes and Analyze",
      hint: "private to you",
    });
  if (can(role, "threads", "view"))
    t.push({ id: "threads", label: "Discussion Threads", hint: "discussions" });
  if (can(role, "pokes", "view"))
    t.push({ id: "pokes", label: "Send Pokes", hint: "urgent asks" });
  if (can(role, "meetings", "view"))
    t.push({ id: "meetings", label: "Meeting Details" });
  if (can(role, "upcoming", "view"))
    t.push({ id: "upcoming", label: "Upcoming Events" });
  // Achievements, weekly, grants, opportunities are visible to everyone
  t.push({ id: "achievements", label: "Team Achievements", hint: "team wins" });
  t.push({
    id: "weekly",
    label: "Weekly Updates",
    hint: "what you did",
  });
  t.push({ id: "grants", label: "Upcoming Grants", hint: "funding scout" });
  t.push({
    id: "opportunities",
    label: "Other Opportunities",
    hint: "internships · schools · industry",
  });
  if (can(role, "knowledge", "view"))
    t.push({ id: "knowledge", label: "Knowledge Base" });
  if (can(role, "admin", "view"))
    t.push({ id: "admin", label: "Admin", hint: "roles + members" });
  return t;
}

// ────────────────────────────────────────────────────────────
// TOP BAR — user chip, bell, role indicator
// ────────────────────────────────────────────────────────────
function TopBar({
  user,
  activeRole,
  notifs,
  onMarkRead,
  onSignOut,
}: {
  user: User;
  activeRole: CustomRole;
  notifs: Notification[];
  onMarkRead: () => void;
  onSignOut: () => void;
}) {
  const unread = notifs.filter((n) => !n.read).length;
  const [bellOpen, setBellOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  return (
    <header className="topbar">
      <div className="topbar-left">
        {/* <span className="role-indicator">
          Viewing as <strong>{activeRole.label}</strong>
        </span> */}
      </div>
      <div className="topbar-right">
        <div className="bell-wrap">
          <button
            className="icon-btn"
            onClick={() => setBellOpen((v) => !v)}
            aria-label="Notifications"
          >
            <BellIcon />
            {unread > 0 && <span className="bell-dot">{unread}</span>}
          </button>
          {bellOpen && (
            <NotificationDropdown
              notifs={notifs}
              onClose={() => setBellOpen(false)}
              onMarkRead={onMarkRead}
            />
          )}
        </div>
        <div className="user-wrap">
          <button className="user-chip" onClick={() => setUserOpen((v) => !v)}>
            <Avatar user={user} size={28} />
            <div className="user-meta">
              <span className="user-name">{user.name}</span>
              <span className="user-email">{user.email}</span>
            </div>
          </button>
          {userOpen && (
            <div className="user-menu">
              <div className="user-menu-head">
                <Avatar user={user} size={36} />
                <div>
                  <strong>{user.name}</strong>
                  <p>{user.email}</p>
                </div>
              </div>
              <button className="menu-item" onClick={onSignOut}>
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function BellIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function NotificationDropdown({
  notifs,
  onClose,
  onMarkRead,
}: {
  notifs: Notification[];
  onClose: () => void;
  onMarkRead: () => void;
}) {
  const [filter, setFilter] = useState<
    "all" | "poke" | "mention" | "reply" | "assignment" | "system"
  >("all");
  const filtered =
    filter === "all" ? notifs : notifs.filter((n) => n.kind === filter);

  return (
    <div className="dropdown notif-dd">
      <header>
        <strong>Notifications</strong>
        <button className="link-btn small" onClick={onMarkRead}>
          Mark all read
        </button>
      </header>
      <div className="notif-filters">
        {(
          ["all", "poke", "mention", "reply", "assignment", "system"] as const
        ).map((f) => (
          <button
            key={f}
            className={`notif-filter ${filter === f ? "active" : ""}`}
            onClick={() => setFilter(f)}
          >
            {f === "all" ? "All" : f}
          </button>
        ))}
      </div>
      <div className="notif-list">
        {filtered.length === 0 && <p className="notif-empty">Nothing here.</p>}
        {filtered.map((n) => (
          <div key={n.id} className={`notif-row ${n.read ? "read" : "unread"}`}>
            <span
              className={`notif-kind kind-${n.kind} ${n.urgency ? `urg-${n.urgency}` : ""}`}
            >
              {n.kind}
              {n.urgency && ` · ${urgencyLabel[n.urgency]}`}
            </span>
            <div className="notif-main">
              <div className="notif-title">{n.title}</div>
              <div className="notif-body">{n.body}</div>
              <div className="notif-when">{n.posted}</div>
            </div>
          </div>
        ))}
      </div>
      <footer>
        <button className="link-btn" onClick={onClose}>
          Close
        </button>
      </footer>
    </div>
  );
}

function UrgentBanner({ poke, onAck }: { poke: Poke; onAck: () => void }) {
  return (
    <div className={`urgent-banner urg-${poke.urgency}`}>
      <span className="urgent-tag">{urgencyLabel[poke.urgency]} poke</span>
      <span className="urgent-text">{poke.question}</span>
      <button className="btn small" onClick={onAck}>
        Acknowledge
      </button>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// ROLE BADGE — read-only. The user's role is fixed by the admin's
// allowlist. Even the lead doesn't view other roles' private spaces.
// ────────────────────────────────────────────────────────────
function RoleBadge({ role }: { role: CustomRole }) {
  return (
    <div className="role-badge">
      <div className="nav-group-label">Your role</div>
      <div className="role-badge-card">
        <div className="role-badge-label">{role.label}</div>
        {/* <div className="role-badge-sub">{role.description}</div> */}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// AVATAR
// ────────────────────────────────────────────────────────────
function Avatar({
  user,
  size = 32,
}: {
  user: { initials: string; avatarHue: number };
  size?: number;
}) {
  const style = {
    width: size,
    height: size,
    background: `hsl(${user.avatarHue}, 55%, 88%)`,
    color: `hsl(${user.avatarHue}, 60%, 30%)`,
    fontSize: Math.round(size * 0.42),
  };
  return (
    <div className="avatar" style={style}>
      {user.initials}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// CHAT TAB + STREAM
// Privacy: chat history is keyed by user email — never shared.
// Adds source-selection dropdown + perplexity-style retrieval.
// ────────────────────────────────────────────────────────────
function ChatTab({
  user,
  role,
  connectedSources,
  allSources,
  onToggleSource,
}: {
  user: User;
  role: CustomRole;
  connectedSources: KnowledgeSourceId[];
  allSources: typeof knowledgeSources;
  onToggleSource: (id: KnowledgeSourceId) => void;
}) {
  const seeded = chatsByEmail[user.email] ?? chatsByRoleRank[role.rank] ?? [];
  const [messagesByUser, setMessagesByUser] = useState<
    Record<string, ChatMsg[]>
  >({
    [user.email]: seeded,
  });
  const messages = messagesByUser[user.email] ?? [];
  const prompts = suggestedPromptsByRank[role.rank] ?? [];

  // Active source scope for the next query — defaults to all connected.
  const [selectedSourceIds, setSelectedSourceIds] =
    useState<KnowledgeSourceId[]>(connectedSources);
  useEffect(() => {
    // when the connected list changes, narrow selection to what's still connected
    setSelectedSourceIds((cur) =>
      cur.filter((id) => connectedSources.includes(id)),
    );
  }, [connectedSources]);

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    const userMsg: ChatMsg = { role: "user", text: trimmed };

    const sourcesUsed =
      selectedSourceIds.length === 0 ? connectedSources : selectedSourceIds;
    const sourceLabels = sourcesUsed
      .map((s) => allSources.find((a) => a.id === s)?.name)
      .filter(Boolean) as string[];

    const aiMsg: ChatMsg = {
      role: "assistant",
      contextNote: `Searched across ${sourceLabels.length} source${sourceLabels.length === 1 ? "" : "s"}`,
      text: '(Prototype) — in v1 I\'d retrieve from the sources you selected, draft a cited response, and propose follow-ups to refine the question. Click "how I retrieved this" for the trace.',
      followUp: ["Refine the question", "Why these sources?", "Save as a note"],
      citations: sourceLabels.slice(0, 3),
    };
    setMessagesByUser((prev) => ({
      ...prev,
      [user.email]: [...(prev[user.email] ?? []), userMsg, aiMsg],
    }));
  }

  return (
    <div>
      <div className="page-head">
        <p className="kicker">
          {role.label} workspace
          {/* · {user.name} · <em>private to you</em>  */}
        </p>
        <h1>Your AI assistant</h1>
        <p className="lede">
          Ask anything. The assistant only sees what your role is allowed to
          see, and only the sources you choose to query. Your chat history is
          private — no one else can read it.
        </p>
      </div>
      <ChatStream
        messages={messages}
        prompts={prompts}
        scopeNote={scopeNote(role)}
        onSend={send}
        sources={allSources.filter((s) => connectedSources.includes(s.id))}
        selectedSourceIds={selectedSourceIds}
        onToggleSource={(id) =>
          setSelectedSourceIds((cur) =>
            cur.includes(id) ? cur.filter((c) => c !== id) : [...cur, id],
          )
        }
        onSelectAll={() => setSelectedSourceIds(connectedSources)}
        onClearAll={() => setSelectedSourceIds([])}
      />
    </div>
  );
}

function scopeNote(role: CustomRole): string {
  if (role.isAdmin) return "everything in the team";
  if (role.rank === 2)
    return "your work + team knowledge (visible to your role)";
  if (role.rank === 3) return "your work + team knowledge (read-scope)";
  return "your work + onboarding knowledge";
}

function ChatStream({
  messages,
  prompts,
  scopeNote,
  onSend,
  sources,
  selectedSourceIds,
  onToggleSource,
  onSelectAll,
  onClearAll,
}: {
  messages: ChatMsg[];
  prompts: string[];
  scopeNote: string;
  onSend: (text: string) => void;
  sources: typeof knowledgeSources;
  selectedSourceIds: KnowledgeSourceId[];
  onToggleSource: (id: KnowledgeSourceId) => void;
  onSelectAll?: () => void;
  onClearAll?: () => void;
}) {
  const [input, setInput] = useState("");
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const streamEnd = useRef<HTMLDivElement>(null);
  const streamRef = useRef<HTMLDivElement>(null);

  // After every new message, scroll so the bottom of the chat
  // (follow-up "Try" chips + input) is at the bottom of the viewport,
  // matching Perplexity / Claude behavior. The page itself scrolls —
  // .chat-stream is not a scroll container.
  useEffect(() => {
    if (messages.length === 0) return;
    const scrollToBottom = () => {
      // scrollingElement is the document scroller (html or body depending on browser)
      const doc = document.scrollingElement || document.documentElement;
      doc.scrollTo({ top: doc.scrollHeight, behavior: "smooth" });
      // belt-and-braces: also pull the sentinel into view in case any
      // ancestor is the actual scroller
      streamEnd.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    };
    // double-RAF guarantees we run after layout settles
    requestAnimationFrame(() => requestAnimationFrame(scrollToBottom));
    // and once more after the smooth-scroll has had a chance to start,
    // in case follow-up chips render asynchronously (e.g. fonts settling)
    const t = setTimeout(scrollToBottom, 120);
    return () => clearTimeout(t);
  }, [messages.length]);

  const allOn = selectedSourceIds.length === sources.length;
  const sourcesLabel = allOn
    ? "All sources"
    : selectedSourceIds.length === 0
      ? "Pick sources"
      : `${selectedSourceIds.length} sources`;

  return (
    <div className="chat-wrap">
      <div className="chat-stream" ref={streamRef}>
        {messages.length === 0 && (
          <div className="chat-empty">
            <p>
              Start a conversation. Try one of the prompts below — or type your
              own.
            </p>
          </div>
        )}
        {messages.map((m, i) => (
          <ChatBubble
            key={i}
            msg={m}
            onFollowUp={onSend}
            isLast={i === messages.length - 1}
          />
        ))}
      </div>

      {/* {prompts.length > 0 && (
        <div className="chat-suggested">
          <span className="suggested-label">Try:</span>
          {prompts.map((p) => (
            <button key={p} className="suggested-chip" onClick={() => onSend(p)}>
              {p}
            </button>
          ))}
        </div>
      )} */}

      <form
        className="chat-input"
        onSubmit={(e) => {
          e.preventDefault();
          onSend(input);
          setInput("");
        }}
      >
        <textarea
          rows={2}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask your assistant. Shift+Enter for newline."
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSend(input);
              setInput("");
            }
          }}
        />
        <div className="chat-input-row">
          <span className="scope-tag">Scope: {scopeNote}</span>
          {sources.length > 0 && (
            <div className="src-picker">
              <button
                type="button"
                className="src-btn"
                onClick={() => setSourcesOpen((v) => !v)}
              >
                ⌕ {sourcesLabel} {sourcesOpen ? "▴" : "▾"}
              </button>
              {sourcesOpen && (
                <div className="src-menu">
                  <header>
                    <strong>Search in</strong>
                    <div className="src-actions">
                      <button
                        type="button"
                        className="link-btn small"
                        onClick={onSelectAll}
                      >
                        Select all
                      </button>
                      <span>·</span>
                      <button
                        type="button"
                        className="link-btn small"
                        onClick={onClearAll}
                      >
                        Clear
                      </button>
                    </div>
                  </header>
                  <div className="src-list">
                    {sources.map((s) => (
                      <label key={s.id} className="src-row">
                        <input
                          type="checkbox"
                          checked={selectedSourceIds.includes(s.id)}
                          onChange={() => onToggleSource(s.id)}
                        />
                        <div>
                          <strong>{s.name}</strong>
                          <span>{s.description}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                  <footer>
                    <button
                      type="button"
                      className="link-btn small"
                      onClick={() => setSourcesOpen(false)}
                    >
                      Done
                    </button>
                  </footer>
                </div>
              )}
            </div>
          )}
          <button className="btn primary" type="submit">
            Send
          </button>
        </div>
      </form>
      <div ref={streamEnd} aria-hidden style={{ height: 1 }} />
    </div>
  );
}

function ChatBubble({
  msg,
  onFollowUp,
  isLast,
}: {
  msg: ChatMsg;
  onFollowUp: (s: string) => void;
  isLast: boolean;
}) {
  const [showRetrieval, setShowRetrieval] = useState(false);
  const isUser = msg.role === "user";

  // Perplexity-style: user messages render as a right-aligned soft bubble,
  // assistant answers render flush-left as plain prose with a thin
  // "Sources" row and a "Follow-ups" list below.
  if (isUser) {
    return (
      <div className="px-row px-row-user">
        <div className="px-user-bubble">{msg.text}</div>
      </div>
    );
  }

  return (
    <div className="px-row px-row-ai">
      <div className="px-ai-body">
        {msg.contextNote && (
          <button
            className="px-steps"
            onClick={() => setShowRetrieval((v) => !v)}
          >
            <span className="px-steps-chev">{showRetrieval ? "▾" : "›"}</span>
            <span>Completed {countSteps(msg.contextNote)} steps</span>
          </button>
        )}
        {showRetrieval && (
          <div className="px-retrieval">
            <p className="px-retrieval-meta">{msg.contextNote}</p>
            <ol>
              <li>Embed your question; check role-scoped permissions</li>
              <li>
                Hybrid retrieve (BM25 + vector + 1-hop graph) over selected
                sources
              </li>
              <li>Rerank top-50 → top-10 with a cross-encoder</li>
              <li>Generate cited answer; drop uncited sentences</li>
            </ol>
            {msg.citations && msg.citations.length > 0 && (
              <div className="px-retrieval-files">
                <span className="px-mini-label">Sources consulted</span>
                <ul>
                  {msg.citations.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        <p className="px-answer">{msg.text}</p>
        {msg.citations && msg.citations.length > 0 && (
          <div className="px-source-row">
            <span className="px-source-count">
              <span className="px-source-icons">⊕</span>
              {msg.citations.length} sources
            </span>
            <div className="px-source-actions">
              <button className="px-icon-btn" title="Share">
                ↗
              </button>
              <button className="px-icon-btn" title="Copy">
                ⎘
              </button>
              <button className="px-icon-btn" title="Like">
                👍
              </button>
              <button className="px-icon-btn" title="Dislike">
                👎
              </button>
            </div>
          </div>
        )}
        {msg.followUp && msg.followUp.length > 0 && isLast && (
          <div className="px-followups">
            <div className="px-followups-head">Follow-ups</div>
            <div className="px-followups-list">
              {msg.followUp.map((f) => (
                <button
                  key={f}
                  className="px-followup-row"
                  onClick={() => onFollowUp(f)}
                >
                  <span className="px-followup-arrow">↳</span>
                  <span className="px-followup-text">{f}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function countSteps(note: string): number {
  // crude heuristic: count "·" separators in the contextNote
  return Math.max(2, (note.match(/·/g) ?? []).length + 1);
}

// ────────────────────────────────────────────────────────────
// NOTES — private to the signed-in user
// ────────────────────────────────────────────────────────────
function NotesTab({ user, role }: { user: User; role: CustomRole }) {
  const seeded =
    sampleNotesByEmail[user.email] ?? sampleNotesByRank[role.rank] ?? [];
  const [notesByUser, setNotesByUser] = useState<Record<string, Note[]>>({
    [user.email]: seeded,
  });
  const myNotes = notesByUser[user.email] ?? [];
  const [openId, setOpenId] = useState<string | null>(seeded[0]?.id ?? null);

  const open = myNotes.find((n) => n.id === openId) ?? null;

  function setMyNotes(updater: (cur: Note[]) => Note[]) {
    setNotesByUser((all) => ({
      ...all,
      [user.email]: updater(all[user.email] ?? []),
    }));
  }

  function newNote() {
    const id = `n-${Date.now()}`;
    const blank: Note = {
      id,
      title: "Untitled note",
      rawText: "",
      status: "draft",
    };
    setMyNotes((cur) => [blank, ...cur]);
    setOpenId(id);
  }

  function updateOpen(patch: Partial<Note>) {
    if (!open) return;
    setMyNotes((cur) =>
      cur.map((n) => (n.id === open.id ? { ...n, ...patch } : n)),
    );
  }

  function analyzeWithAI() {
    if (!open) return;
    if (!open.analysis) {
      updateOpen({
        status: "analyzed",
        analysis: {
          context:
            "(AI-drafted) Pulled from your raw note, your past work, and the team knowledge base.",
          problem:
            "(AI-drafted) A sharp problem statement, ideally one sentence.",
          contribution:
            "(AI-drafted) 2-3 contribution claims grounded in feasibility.",
          methodology:
            "(AI-drafted) Concrete study / build plan + reusable assets in the team.",
          venues: [
            {
              name: "(suggested venue)",
              reason: "based on your track record + topic fit",
            },
          ],
          followUpQuestions: ["(AI follow-up 1)", "(AI follow-up 2)"],
          internalHelp: [
            {
              name: "(suggested teammate)",
              why: "based on past collaborations",
            },
          ],
          externalHelp: [
            { name: "(external candidate)", why: "via your lead's network" },
          ],
        },
      });
    } else {
      updateOpen({ status: "analyzed" });
    }
  }

  return (
    <div>
      <div className="page-head">
        <p className="kicker">
          {role.label} workspace
          {/* · <em>private to {user.name}</em> */}
        </p>
        <h1>Your notes</h1>
        <p className="lede">
          Jot raw ideas. Click <strong>Analyze with AI</strong> to turn a
          half-formed thought into a structured brief.{" "}
          <strong>No one else</strong> on the team — including the lead — can
          read your notes unless you choose to share one as a thread.
        </p>
      </div>

      <div className="notes-wrap">
        <aside className="notes-list">
          <button className="btn primary new-note" onClick={newNote}>
            + New note
          </button>
          {myNotes.length === 0 && <p className="notes-empty">No notes yet.</p>}
          {myNotes.map((n) => (
            <button
              key={n.id}
              className={`note-row ${openId === n.id ? "active" : ""}`}
              onClick={() => setOpenId(n.id)}
            >
              <div className="note-row-title">{n.title || "Untitled note"}</div>
              <span className={`note-status status-${n.status}`}>
                {n.status}
              </span>
            </button>
          ))}
        </aside>

        <div className="note-editor">
          {!open && (
            <p className="notes-empty">Pick a note or create a new one.</p>
          )}
          {open && (
            <>
              <input
                className="note-title"
                value={open.title}
                onChange={(e) => updateOpen({ title: e.target.value })}
              />
              <textarea
                className="note-text"
                rows={8}
                value={open.rawText}
                placeholder="Jot your raw idea — bullet points, half-sentences, links."
                onChange={(e) => updateOpen({ rawText: e.target.value })}
              />
              <div className="note-actions">
                <button className="btn primary" onClick={analyzeWithAI}>
                  Analyze with AI
                </button>
                <button
                  className="btn ghost"
                  disabled={open.status === "draft"}
                >
                  Share as thread
                </button>
                <span className="note-hint">
                  Your notes never leave your account. Sharing as a thread
                  publishes a copy into the workspace with the visibility you
                  pick.
                </span>
              </div>

              {open.analysis && (
                <div className="analysis">
                  <h3>AI-drafted brief</h3>
                  <Field label="Context" value={open.analysis.context} />
                  <Field label="Problem" value={open.analysis.problem} />
                  <Field
                    label="Contribution"
                    value={open.analysis.contribution}
                  />
                  <Field
                    label="Methodology"
                    value={open.analysis.methodology}
                  />
                  <ListField
                    label="Suggested venues"
                    items={open.analysis.venues.map(
                      (v) => `${v.name} — ${v.reason}`,
                    )}
                  />
                  <ListField
                    label="Follow-up questions"
                    items={open.analysis.followUpQuestions}
                    numbered
                  />
                  <div className="help-grid">
                    <ListField
                      label="Who inside the team can help"
                      items={open.analysis.internalHelp.map(
                        (h) => `${h.name} — ${h.why}`,
                      )}
                    />
                    <ListField
                      label="External contacts to consider"
                      items={open.analysis.externalHelp.map(
                        (h) => `${h.name} — ${h.why}`,
                      )}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="field">
      <div className="field-label">{label}</div>
      <p className="field-value">{value}</p>
    </div>
  );
}

function ListField({
  label,
  items,
  numbered,
}: {
  label: string;
  items: string[];
  numbered?: boolean;
}) {
  return (
    <div className="field">
      <div className="field-label">{label}</div>
      <ul className={`field-list ${numbered ? "numbered" : ""}`}>
        {items.map((it) => (
          <li key={it}>{it}</li>
        ))}
      </ul>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// THREADS — explicit audience controls + functional reply
// ────────────────────────────────────────────────────────────
function ThreadsTab({
  user,
  role,
  roles,
  teammates,
  threads,
  onCreate,
  onReply,
}: {
  user: User;
  role: CustomRole;
  roles: CustomRole[];
  teammates: User[];
  threads: Thread[];
  onCreate: (t: Thread) => void;
  onReply: (id: string, text: string) => void;
}) {
  const visible = useMemo(
    () => threadsVisibleToUser(user, role, threads, roles),
    [user, role, threads, roles],
  );
  const [openId, setOpenId] = useState<string | null>(visible[0]?.id ?? null);
  const [composing, setComposing] = useState(false);
  const [askDraftFor, setAskDraftFor] = useState<string | null>(null);
  const [replyDraftFor, setReplyDraftFor] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    setOpenId(visible[0]?.id ?? null);
  }, [role.rank]);

  const open = visible.find((t) => t.id === openId) ?? null;

  return (
    <div>
      <div className="page-head">
        <p className="kicker">
          {role.label} workspace
          {/* · {user.name} */}
        </p>
        <h1>Discussion threads</h1>
        <p className="lede">
          When you create a thread, choose <strong>exactly</strong> who can see
          it — peers only, specific roles, specific people, or the whole team.
          You stay in control of who sees and replies. Team-wide threads also
          feed the knowledge base.
        </p>
      </div>

      <div className="threads-wrap">
        <aside className="threads-list">
          <button className="btn primary" onClick={() => setComposing(true)}>
            + New discussion
          </button>
          <div className="thread-counts">
            <span>{visible.length} visible to you</span>
            <span>·</span>
            <span>{threads.length - visible.length} hidden by visibility</span>
          </div>
          {visible.map((t) => (
            <button
              key={t.id}
              className={`thread-row ${openId === t.id ? "active" : ""}`}
              onClick={() => {
                setOpenId(t.id);
                setComposing(false);
              }}
            >
              <div className="thread-row-title">{t.title}</div>
              <div className="thread-row-meta">
                <span className="thread-author">
                  {authorName(t.authorEmail)}
                </span>
                <span className={`vis vis-${visKey(t.visibility, t.audience)}`}>
                  {shortVis(t, roles)}
                </span>
                <span className="thread-replies">{t.replies} replies</span>
              </div>
            </button>
          ))}
        </aside>

        <div className="thread-detail">
          {composing ? (
            <ComposeThread
              user={user}
              roles={roles}
              teammates={teammates}
              userRole={role}
              onClose={() => setComposing(false)}
              onPost={(t) => {
                onCreate(t);
                setComposing(false);
                setOpenId(t.id);
              }}
            />
          ) : open ? (
            <ThreadView
              t={open}
              roles={roles}
              user={user}
              replyOpen={replyDraftFor === open.id}
              askOpen={askDraftFor === open.id}
              replyText={replyText}
              onReplyTextChange={setReplyText}
              onOpenReply={() => {
                setReplyDraftFor(open.id);
                setAskDraftFor(null);
              }}
              onCancelReply={() => {
                setReplyDraftFor(null);
                setReplyText("");
              }}
              onSubmitReply={() => {
                const trimmed = replyText.trim();
                if (!trimmed) return;
                onReply(open.id, trimmed);
                setReplyDraftFor(null);
                setReplyText("");
              }}
              onOpenAsk={() => {
                setAskDraftFor(open.id);
                setReplyDraftFor(null);
              }}
              onCancelAsk={() => setAskDraftFor(null)}
            />
          ) : (
            <p className="notes-empty">No threads visible to your role.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function threadsVisibleToUser(
  user: User,
  role: CustomRole,
  threads: Thread[],
  roles: CustomRole[],
): Thread[] {
  return threads.filter((t) => {
    // Author always sees their own thread.
    if (t.authorEmail === user.email) return true;
    // The new audience field, if present, takes precedence over the legacy visibility
    if (t.audience) {
      const a = t.audience;
      if (a.kind === "private") return false;
      if (a.kind === "lab") return true;
      if (a.kind === "peers") return user.roleId === t.authorRoleId;
      if (a.kind === "roles") return a.roleIds.includes(user.roleId);
      if (a.kind === "persons") return a.emails.includes(user.email);
      return false;
    }
    // Fall back to legacy `visibility` (rank-based)
    return threadsVisibleTo(role, [t]).length > 0;
  });
}

// Looks up a member's display name. Searches the sample teammates roster
// and the lead's allowlist (set via App-state); falls back to a humanized
// version of the email's local-part (e.g. "alex.joe@x" → "Alex Joe").
let allowlistLookup: { email: string; name: string }[] = [];
function setAllowlistLookup(entries: { email: string; name: string }[]) {
  allowlistLookup = entries;
}
function authorName(email: string): string {
  const t = sampleTeammates.find((u) => u.email === email);
  if (t) return t.name;
  const a = allowlistLookup.find(
    (u) => u.email.toLowerCase() === email.toLowerCase(),
  );
  if (a) return a.name;
  const local = email.split("@")[0] ?? email;
  return local
    .replace(/[._-]/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

function visKey(v: ThreadVisibility, a?: ThreadAudience): string {
  if (a) {
    if (a.kind === "private") return "private";
    if (a.kind === "lab") return "lab";
    if (a.kind === "peers") return "peers";
    if (a.kind === "roles") return "roles";
    return "persons";
  }
  if (v.kind === "private") return "private";
  if (v.kind === "lab") return "lab";
  return "share-up";
}

function shortVis(t: Thread, roles: CustomRole[]): string {
  if (t.audience) {
    const a = t.audience;
    if (a.kind === "private") return "Private";
    if (a.kind === "lab") return "Team-wide";
    if (a.kind === "peers") return "Peers";
    if (a.kind === "roles") {
      const labels = a.roleIds
        .map((id) => roles.find((r) => r.id === id)?.label?.split(" ")[0] ?? id)
        .filter(Boolean);
      return `Roles: ${labels.join(", ")}`;
    }
    return `${a.emails.length} ${a.emails.length === 1 ? "person" : "people"}`;
  }
  const v = t.visibility;
  if (v.kind === "private") return "Private";
  if (v.kind === "lab") return "Team-wide";
  const r = roles.find((rr) => rr.rank === v.rank);
  return `→ ${r?.label ?? "rank " + v.rank}`;
}

function ThreadView({
  t,
  roles,
  user,
  replyOpen,
  askOpen,
  replyText,
  onReplyTextChange,
  onOpenReply,
  onCancelReply,
  onSubmitReply,
  onOpenAsk,
  onCancelAsk,
}: {
  t: Thread;
  roles: CustomRole[];
  user: User;
  replyOpen: boolean;
  askOpen: boolean;
  replyText: string;
  onReplyTextChange: (s: string) => void;
  onOpenReply: () => void;
  onCancelReply: () => void;
  onSubmitReply: () => void;
  onOpenAsk: () => void;
  onCancelAsk: () => void;
}) {
  const audienceLabel = t.audience
    ? describeAudience(t.audience, roles)
    : threadVisibilityLabel(t.visibility, roles);

  return (
    <article className="thread-detail-inner">
      <header>
        <h2>{t.title}</h2>
        <div className="thread-detail-meta">
          <span>By {authorName(t.authorEmail)}</span>
          <span>·</span>
          <span>{t.posted}</span>
          <span>·</span>
          <span className={`vis vis-${visKey(t.visibility, t.audience)}`}>
            {audienceLabel}
          </span>
          <span>·</span>
          <span className={`thread-status status-${t.status}`}>{t.status}</span>
        </div>
        {/* {t.feedsKnowledgeBase && (
          <div className="kb-tag">
            This thread feeds the team knowledge base — answers here become
            searchable for future questions.
          </div>
        )} */}
      </header>
      <p className="thread-body">{t.preview}</p>

      <ThreadReplies thread={t} />
      <br />

      {replyOpen ? (
        <div className="thread-reply-form">
          <textarea
            rows={3}
            value={replyText}
            onChange={(e) => onReplyTextChange(e.target.value)}
            placeholder="Write your reply…"
            autoFocus
          />
          <div className="thread-reply-actions">
            <button className="btn ghost" onClick={onCancelReply}>
              Cancel
            </button>
            <button
              className="btn primary"
              disabled={!replyText.trim()}
              onClick={onSubmitReply}
            >
              Post reply
            </button>
          </div>
        </div>
      ) : null}

      {askOpen ? (
        <div className="thread-ask-form">
          <div className="thread-ask-head">
            <strong>Assistant — context: this thread</strong>
            <button className="link-btn small" onClick={onCancelAsk}>
              Close
            </button>
          </div>
          <p className="thread-ask-body">
            (Prototype) — the assistant would summarize this thread, surface
            related team work and prior decisions, and suggest a next reply
            grounded in cited sources. Your question stays private to you.
          </p>
          <div className="thread-ask-prompts">
            <button className="follow-chip">Summarize this thread</button>
            <button className="follow-chip">
              Who else has worked on this?
            </button>
            <button className="follow-chip">Suggest a reply for me</button>
          </div>
        </div>
      ) : null}

      <div className="thread-actions">
        {!replyOpen && (
          <button className="btn primary" onClick={onOpenReply}>
            Reply
          </button>
        )}
        {!askOpen && (
          <button className="btn ghost" onClick={onOpenAsk}>
            Ask the assistant about this
          </button>
        )}
        {t.status !== "answered" && (
          <button className="btn ghost">Raise to lead</button>
        )}
      </div>
    </article>
  );
}

// Renders the reply count for a thread; clicking expands an inline list of
// member replies. Uses the new `replyList` field; falls back to a count-only
// stub for threads without seeded reply bodies.
function ThreadReplies({ thread }: { thread: Thread }) {
  const list = thread.replyList ?? [];
  const [open, setOpen] = useState(list.length > 0);
  if (thread.replies === 0 && list.length === 0) {
    return (
      <div className="thread-replies-stub">
        <p className="muted">No replies yet.</p>
      </div>
    );
  }
  return (
    <div className="thread-replies-block">
      <button
        type="button"
        className="thread-replies-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="px-steps-chev">{open ? "▾" : "›"}</span>
        <span>
          {thread.replies} {thread.replies === 1 ? "reply" : "replies"}
        </span>
        {list.length === 0 && (
          <span className="muted small">· details not seeded</span>
        )}
      </button>
      {open && list.length > 0 && (
        <ol className="thread-reply-list">
          {list.map((r, i) => (
            <li key={i} className="thread-reply-item">
              <header>
                <strong>{authorName(r.fromEmail)}</strong>
                <span className="thread-reply-when">{r.posted}</span>
              </header>
              <p>{r.text}</p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function ComposeThread({
  user,
  roles,
  teammates,
  userRole,
  onClose,
  onPost,
}: {
  user: User;
  roles: CustomRole[];
  teammates: User[];
  userRole: CustomRole;
  onClose: () => void;
  onPost: (t: Thread) => void;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audKind, setAudKind] = useState<ThreadAudience["kind"]>("peers");
  const [chosenRoles, setChosenRoles] = useState<string[]>([]);
  const [chosenPersons, setChosenPersons] = useState<string[]>([]);

  const audience: ThreadAudience =
    audKind === "private"
      ? { kind: "private" }
      : audKind === "lab"
        ? { kind: "lab" }
        : audKind === "peers"
          ? { kind: "peers" }
          : audKind === "roles"
            ? { kind: "roles", roleIds: chosenRoles }
            : { kind: "persons", emails: chosenPersons };

  function toggleRole(id: string) {
    setChosenRoles((c) =>
      c.includes(id) ? c.filter((r) => r !== id) : [...c, id],
    );
  }
  function togglePerson(email: string) {
    setChosenPersons((c) =>
      c.includes(email) ? c.filter((r) => r !== email) : [...c, email],
    );
  }

  const valid =
    title.trim().length > 0 &&
    body.trim().length > 0 &&
    (audKind !== "roles" || chosenRoles.length > 0) &&
    (audKind !== "persons" || chosenPersons.length > 0);

  function post() {
    if (!valid) return;
    const t: Thread = {
      id: `t-${Date.now()}`,
      title: title.trim(),
      authorEmail: user.email,
      authorRoleId: userRole.id,
      // legacy visibility is set to a sensible default for older code paths
      visibility:
        audKind === "private"
          ? { kind: "private" }
          : audKind === "lab"
            ? { kind: "lab" }
            : { kind: "share_up_to", rank: 1 },
      audience,
      posted: "just now",
      replies: 0,
      status: "open",
      preview: body.trim(),
      feedsKnowledgeBase: audKind === "lab",
    };
    onPost(t);
  }

  return (
    <div className="thread-compose">
      <div className="compose-head">
        <h2>New discussion</h2>
        <button className="btn ghost" onClick={onClose}>
          Cancel
        </button>
      </div>
      <label>
        <span>Title</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="One-line summary"
        />
      </label>
      <label>
        <span>Details</span>
        <textarea
          rows={5}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="What are you stuck on? What input would help?"
        />
      </label>

      <div className="compose-vis-block">
        <span className="compose-vis-label">Who can see this thread?</span>
        <div className="vis-choices">
          <button
            type="button"
            className={`vis-choice ${audKind === "private" ? "active" : ""}`}
            onClick={() => setAudKind("private")}
          >
            <strong>Private</strong>
            <span>Only you</span>
          </button>
          <button
            type="button"
            className={`vis-choice ${audKind === "peers" ? "active" : ""}`}
            onClick={() => setAudKind("peers")}
          >
            <strong>Peers only</strong>
            <span>Same role as you ({userRole.label})</span>
          </button>
          <button
            type="button"
            className={`vis-choice ${audKind === "roles" ? "active" : ""}`}
            onClick={() => setAudKind("roles")}
          >
            <strong>Specific roles</strong>
            <span>Pick one or more roles</span>
          </button>
          <button
            type="button"
            className={`vis-choice ${audKind === "persons" ? "active" : ""}`}
            onClick={() => setAudKind("persons")}
          >
            <strong>Specific people</strong>
            <span>Pick teammates by name</span>
          </button>
          <button
            type="button"
            className={`vis-choice ${audKind === "lab" ? "active" : ""}`}
            onClick={() => setAudKind("lab")}
          >
            <strong>Team-wide</strong>
            <span>Anyone on the team</span>
          </button>
        </div>

        {audKind === "roles" && (
          <div className="vis-detail">
            <p className="note-hint">
              Pick the roles that should see this thread.
            </p>
            <div className="role-checks">
              {roles
                .slice()
                .sort((a, b) => a.rank - b.rank)
                .map((r) => (
                  <label key={r.id} className="role-check">
                    <input
                      type="checkbox"
                      checked={chosenRoles.includes(r.id)}
                      onChange={() => toggleRole(r.id)}
                    />
                    <span>{r.label}</span>
                  </label>
                ))}
            </div>
          </div>
        )}

        {audKind === "persons" && (
          <div className="vis-detail">
            <p className="note-hint">
              Pick the people that should see this thread.
            </p>
            <div className="person-checks">
              {teammates
                .filter((t) => t.email !== user.email)
                .map((t) => (
                  <label key={t.email} className="person-check">
                    <input
                      type="checkbox"
                      checked={chosenPersons.includes(t.email)}
                      onChange={() => togglePerson(t.email)}
                    />
                    <Avatar user={t} size={22} />
                    <span>
                      <strong>{t.name}</strong>
                      <small>{t.email}</small>
                    </span>
                  </label>
                ))}
            </div>
          </div>
        )}
      </div>

      <div className="thread-compose-foot">
        <span className="note-hint">
          Team-wide threads automatically feed the knowledge base — they become
          searchable. Private/peer/role-scoped threads stay scoped.
        </span>
        <button className="btn primary" disabled={!valid} onClick={post}>
          Post
        </button>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// MEETINGS — adds Outlook/Teams integration + create dialog
// ────────────────────────────────────────────────────────────
function MeetingsTab({
  user,
  roles,
  teammates,
}: {
  user: User;
  roles: CustomRole[];
  teammates: User[];
}) {
  const [composing, setComposing] = useState(false);
  const [meetings, setMeetings] = useState(recentMeetings);
  const [outlookConnected, setOutlookConnected] = useState(false);
  const [teamsConnected, setTeamsConnected] = useState(false);

  function onCreate(m: (typeof recentMeetings)[number]) {
    setMeetings((cur) => [m, ...cur]);
    setComposing(false);
  }

  return (
    <div>
      <div className="page-head">
        <p className="kicker">Audio → transcript → typed events</p>
        <h1>Meetings</h1>
        <p className="lede">
          Recordings transcribed by the assistant, diarized by speaker, and
          summarized into decisions, action items, and blockers. Use Outlook and
          Microsoft Teams to schedule meetings — visibility mirrors who you
          invite.
        </p>
      </div>

      <div className="integrations-row">
        <div className={`integration-card ${outlookConnected ? "on" : ""}`}>
          <div className="integration-head">
            <strong>Microsoft Outlook</strong>
            <span
              className={`integration-pill ${outlookConnected ? "on" : "off"}`}
            >
              {outlookConnected ? "Connected" : "Not connected"}
            </span>
          </div>
          <p>Pull invites, create new meetings, sync RSVPs to the workspace.</p>
          <button
            className="btn small primary"
            onClick={() => setOutlookConnected((v) => !v)}
          >
            {outlookConnected ? "Disconnect" : "Connect Outlook"}
          </button>
        </div>
        <div className={`integration-card ${teamsConnected ? "on" : ""}`}>
          <div className="integration-head">
            <strong>Microsoft Teams</strong>
            <span
              className={`integration-pill ${teamsConnected ? "on" : "off"}`}
            >
              {teamsConnected ? "Connected" : "Not connected"}
            </span>
          </div>
          <p>
            Auto-create Teams links for every meeting; capture and transcribe
            recordings.
          </p>
          <button
            className="btn small primary"
            onClick={() => setTeamsConnected((v) => !v)}
          >
            {teamsConnected ? "Disconnect" : "Connect Teams"}
          </button>
        </div>
      </div>

      <div className="meetings-actions">
        <button className="btn primary" onClick={() => setComposing((v) => !v)}>
          {composing ? "Cancel" : "+ New meeting"}
        </button>
        <span className="note-hint">
          Meetings created here are mirrored to{" "}
          {outlookConnected
            ? "your Outlook calendar"
            : "this workspace only (connect Outlook to sync)"}{" "}
          and{" "}
          {teamsConnected
            ? "Microsoft Teams as the conferencing link"
            : "no Teams link will be generated until Teams is connected"}
          .
        </span>
      </div>

      {composing && (
        <ComposeMeeting
          user={user}
          roles={roles}
          teammates={teammates}
          outlookConnected={outlookConnected}
          teamsConnected={teamsConnected}
          onCreate={onCreate}
          onCancel={() => setComposing(false)}
        />
      )}

      <div className="meetings-wrap">
        {meetings.map((m) => (
          <article key={m.id} className="meeting-card">
            <header>
              <div>
                <h3>{m.title}</h3>
                <div className="meeting-meta">
                  <span>{m.date}</span>
                  <span>·</span>
                  <span>{m.duration}</span>
                  <span>·</span>
                  <span>{m.attendeeCount} attendees</span>
                </div>
              </div>
              <button className="btn ghost">Open transcript</button>
            </header>
            <div className="meeting-grid">
              <section>
                <h4>Decisions</h4>
                <ul>
                  {m.decisions.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              </section>
              <section>
                <h4>Action items</h4>
                <ul>
                  {m.actionItems.map((a, i) => (
                    <li key={i}>
                      <strong>{a.ownerName}:</strong> {a.what}
                    </li>
                  ))}
                </ul>
              </section>
              <section>
                <h4>Blockers</h4>
                {m.blockers.length === 0 ? (
                  <p className="muted">None.</p>
                ) : (
                  <ul>
                    {m.blockers.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function ComposeMeeting({
  user,
  roles,
  teammates,
  outlookConnected,
  teamsConnected,
  onCreate,
  onCancel,
}: {
  user: User;
  roles: CustomRole[];
  teammates: User[];
  outlookConnected: boolean;
  teamsConnected: boolean;
  onCreate: (m: (typeof recentMeetings)[number]) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [duration, setDuration] = useState("30 min");
  const [invitees, setInvitees] = useState<string[]>([]);

  function toggle(email: string) {
    setInvitees((c) =>
      c.includes(email) ? c.filter((e) => e !== email) : [...c, email],
    );
  }

  const valid = title.trim() && date && invitees.length > 0;

  function submit() {
    if (!valid) return;
    onCreate({
      id: `m-${Date.now()}`,
      title: title.trim(),
      date,
      duration,
      attendeeCount: invitees.length + 1,
      decisions: [],
      actionItems: [],
      blockers: [],
    });
  }

  return (
    <div className="compose-card">
      <div className="compose-head">
        <h2>New meeting</h2>
        <button className="btn ghost" onClick={onCancel}>
          Cancel
        </button>
      </div>
      <div className="compose-grid">
        <label>
          <span>Title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What's the meeting about?"
          />
        </label>
        <label>
          <span>Date</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
        <label>
          <span>Duration</span>
          <select
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          >
            <option>15 min</option>
            <option>30 min</option>
            <option>45 min</option>
            <option>60 min</option>
            <option>90 min</option>
          </select>
        </label>
      </div>

      <div className="compose-vis-block">
        <span className="compose-vis-label">Invitees</span>
        <div className="person-checks">
          {teammates
            .filter((t) => t.email !== user.email)
            .map((t) => (
              <label key={t.email} className="person-check">
                <input
                  type="checkbox"
                  checked={invitees.includes(t.email)}
                  onChange={() => toggle(t.email)}
                />
                <Avatar user={t} size={22} />
                <span>
                  <strong>{t.name}</strong>
                  <small>
                    {roles.find((r) => r.id === t.roleId)?.label} · {t.email}
                  </small>
                </span>
              </label>
            ))}
        </div>
      </div>

      <div className="compose-foot">
        <span className="note-hint">
          {outlookConnected
            ? "✓ Outlook invite will be sent."
            : "Outlook not connected — invite stays inside Syncyteam."}{" "}
          {teamsConnected
            ? " ✓ A Teams link will be auto-generated."
            : " Teams not connected — no video link will be added."}
        </span>
        <button className="btn primary" disabled={!valid} onClick={submit}>
          Create meeting
        </button>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// UPCOMING — functional add + visibility selection
// ────────────────────────────────────────────────────────────
function UpcomingTab({
  role,
  roles,
  teammates,
  dates,
  onAdd,
}: {
  role: CustomRole;
  roles: CustomRole[];
  teammates: User[];
  dates: UpcomingDate[];
  onAdd: (d: UpcomingDate) => void;
}) {
  const items = useMemo(
    () =>
      dates
        .filter((d) => d.visibleToRanks.includes(role.rank))
        .sort((a, b) => a.daysUntil - b.daysUntil),
    [dates, role.rank],
  );

  const [composing, setComposing] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [kind, setKind] = useState<UpcomingDate["kind"]>("deadline");
  const [visKind, setVisKind] = useState<"all" | "roles" | "persons">("all");
  const [chosenRoles, setChosenRoles] = useState<string[]>([role.id]);
  const [chosenPersons, setChosenPersons] = useState<string[]>([]);

  function reset() {
    setTitle("");
    setDate("");
    setKind("deadline");
    setVisKind("all");
    setChosenRoles([role.id]);
    setChosenPersons([]);
  }

  function daysUntil(d: string): number {
    const t = new Date(d).getTime();
    if (Number.isNaN(t)) return 0;
    return Math.max(0, Math.round((t - Date.now()) / 86400000));
  }

  function save() {
    if (!title.trim() || !date) return;
    let visibleToRanks: number[] = roles.map((r) => r.rank);
    if (visKind === "roles") {
      visibleToRanks = roles
        .filter((r) => chosenRoles.includes(r.id))
        .map((r) => r.rank);
    } else if (visKind === "persons") {
      visibleToRanks = roles
        .filter((r) =>
          teammates.some(
            (t) => chosenPersons.includes(t.email) && t.roleId === r.id,
          ),
        )
        .map((r) => r.rank);
    }
    onAdd({
      id: `d-${Date.now()}`,
      date,
      daysUntil: daysUntil(date),
      title: title.trim(),
      kind,
      source: "manual",
      visibleToRanks,
    });
    reset();
    setComposing(false);
  }

  return (
    <div>
      <div className="page-head">
        <p className="kicker">Deadlines · talks · seminars · milestones</p>
        <h1>Upcoming</h1>
        <p className="lede">
          The assistant extracts dates from communications and capture; you can
          also add manually. When you add a date, choose who can see it — the
          whole team, specific roles, or specific people.
        </p>
      </div>
      <div className="upcoming-wrap">
        <div className="upcoming-head">
          <p className="block-sub">Sorted by days until.</p>
          <button
            className="btn primary"
            onClick={() => setComposing((v) => !v)}
          >
            {composing ? "Cancel" : "+ Add a date"}
          </button>
        </div>
        {composing && (
          <div className="add-date-card">
            <div className="add-date-row">
              <input
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
              <select
                value={kind}
                onChange={(e) =>
                  setKind(e.target.value as UpcomingDate["kind"])
                }
              >
                <option value="deadline">Deadline</option>
                <option value="talk">Talk</option>
                <option value="seminar">Seminar</option>
                <option value="meeting">Meeting</option>
                <option value="milestone">Milestone</option>
              </select>
            </div>

            <div className="compose-vis-block">
              <span className="compose-vis-label">Who can see this date?</span>
              <div className="vis-choices">
                <button
                  type="button"
                  className={`vis-choice ${visKind === "all" ? "active" : ""}`}
                  onClick={() => setVisKind("all")}
                >
                  <strong>Whole team</strong>
                  <span>Everyone in this workspace</span>
                </button>
                <button
                  type="button"
                  className={`vis-choice ${visKind === "roles" ? "active" : ""}`}
                  onClick={() => setVisKind("roles")}
                >
                  <strong>Specific roles</strong>
                  <span>Pick one or more roles</span>
                </button>
                <button
                  type="button"
                  className={`vis-choice ${visKind === "persons" ? "active" : ""}`}
                  onClick={() => setVisKind("persons")}
                >
                  <strong>Specific people</strong>
                  <span>Pick teammates by name</span>
                </button>
              </div>

              {visKind === "roles" && (
                <div className="role-checks">
                  {roles
                    .slice()
                    .sort((a, b) => a.rank - b.rank)
                    .map((r) => (
                      <label key={r.id} className="role-check">
                        <input
                          type="checkbox"
                          checked={chosenRoles.includes(r.id)}
                          onChange={() =>
                            setChosenRoles((c) =>
                              c.includes(r.id)
                                ? c.filter((x) => x !== r.id)
                                : [...c, r.id],
                            )
                          }
                        />
                        <span>{r.label}</span>
                      </label>
                    ))}
                </div>
              )}
              {visKind === "persons" && (
                <div className="person-checks">
                  {teammates.map((t) => (
                    <label key={t.email} className="person-check">
                      <input
                        type="checkbox"
                        checked={chosenPersons.includes(t.email)}
                        onChange={() =>
                          setChosenPersons((c) =>
                            c.includes(t.email)
                              ? c.filter((e) => e !== t.email)
                              : [...c, t.email],
                          )
                        }
                      />
                      <Avatar user={t} size={22} />
                      <span>
                        <strong>{t.name}</strong>
                        <small>{t.email}</small>
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="compose-foot">
              <button
                className="btn primary"
                disabled={!title.trim() || !date}
                onClick={save}
              >
                Save date
              </button>
            </div>
          </div>
        )}
        <ul className="upcoming-list">
          {items.map((d) => (
            <li key={d.id} className={`upcoming-item kind-${d.kind}`}>
              <div className="upcoming-when">
                <div className="upcoming-days">{d.daysUntil}d</div>
                <div className="upcoming-date">{d.date}</div>
              </div>
              <div className="upcoming-main">
                <div className="upcoming-title">{d.title}</div>
                {d.note && <div className="upcoming-note">{d.note}</div>}
              </div>
              <div className="upcoming-tags">
                <span className={`kind-tag kind-${d.kind}`}>{d.kind}</span>
                <span className={`source-tag source-${d.source}`}>
                  {d.source === "extracted" ? "auto" : "manual"}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// KNOWLEDGE — user picks which sources to connect
// ────────────────────────────────────────────────────────────
function KnowledgeTab({
  role,
  connected,
  onToggle,
}: {
  role: CustomRole;
  connected: KnowledgeSourceId[];
  onToggle: (id: KnowledgeSourceId) => void;
}) {
  const grouped = useMemo(() => {
    const g: Record<string, typeof knowledgeSources> = {};
    for (const s of knowledgeSources) {
      g[s.group] = g[s.group] ? [...g[s.group], s] : [s];
    }
    return g;
  }, []);

  return (
    <div>
      <div className="page-head">
        <p className="kicker">What feeds the AI</p>
        <h1>Knowledge base</h1>
        <p className="lede">
          Pick which sources to connect. The assistant only ever searches across
          sources you've allowed — and your role-level permissions still apply
          on top of that. You can disconnect any source at any time.
        </p>
      </div>

      <div className="kb-wrap">
        {Object.entries(grouped).map(([group, items]) => (
          <section className="kb-group" key={group}>
            <h3 className="kb-group-head">{group}</h3>
            <div className="kb-grid">
              {items.map((s) => {
                const isOn = connected.includes(s.id);
                const allowed = role.rank <= s.minRankToConnect;
                return (
                  <div key={s.id} className={`kb-card ${isOn ? "on" : ""}`}>
                    <div className="kb-card-head">
                      <h4>{s.name}</h4>
                      <span
                        className={`integration-pill ${isOn ? "on" : "off"}`}
                      >
                        {isOn ? "Connected" : "Off"}
                      </span>
                    </div>
                    <p className="kb-card-desc">{s.description}</p>
                    <button
                      className="btn small primary"
                      disabled={!allowed}
                      onClick={() => onToggle(s.id)}
                      title={
                        allowed
                          ? ""
                          : "Your role can't change this source for the team. Ask the lead."
                      }
                    >
                      {isOn ? "Disconnect" : allowed ? "Connect" : "Lead-only"}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        <div className="kb-foot">
          <h3>How retrieval works</h3>
          <ol>
            <li>
              Your question is embedded and run against the connected sources
              only.
            </li>
            <li>
              Hybrid retrieval (BM25 + vector + 1-hop graph) returns top-50
              candidates.
            </li>
            <li>A cross-encoder reranks down to top-10.</li>
            <li>
              The answer generator drafts a response with inline citations.
            </li>
            <li>
              A provenance validator drops uncited sentences before you see
              them.
            </li>
          </ol>
          <p className="block-sub">
            Existing default channels (still scoped to your role):{" "}
            {knowledgeChannels.length}.
          </p>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// POKES
// ────────────────────────────────────────────────────────────
function PokesTab({
  user,
  roles,
  teammates,
  pokes,
  onSend,
  onAck,
}: {
  user: User;
  roles: CustomRole[];
  teammates: User[];
  pokes: Poke[];
  onSend: (p: Omit<Poke, "id" | "posted" | "status">) => void;
  onAck: (id: string, status: "ack" | "done") => void;
}) {
  const [composing, setComposing] = useState(false);
  const inbox = pokes.filter((p) => p.toEmail === user.email);
  const sent = pokes.filter((p) => p.fromEmail === user.email);

  return (
    <div>
      <div className="page-head">
        <p className="kicker">Direct asks · urgency-tagged</p>
        <h1>Pokes</h1>
        <p className="lede">
          Send a direct, urgency-tagged ask to a teammate — by name or by typing
          their work email. Pokes show in their notification bell; high or
          blocking ones also surface as a banner on top of their workspace until
          acknowledged.
        </p>
      </div>

      <div className="pokes-actions">
        <button
          className="btn primary"
          onClick={() => setComposing(!composing)}
        >
          {composing ? "Cancel" : "+ Send a poke"}
        </button>
      </div>

      {composing && (
        <ComposePoke
          user={user}
          roles={roles}
          teammates={teammates}
          onSend={(p) => {
            onSend(p);
            setComposing(false);
          }}
        />
      )}

      <div className="pokes-grid">
        <section>
          <h3 className="block-title">Inbox ({inbox.length})</h3>
          {inbox.length === 0 && (
            <p className="block-sub">Nothing here. You're caught up.</p>
          )}
          <div className="poke-list">
            {inbox.map((p) => (
              <PokeCard
                key={p.id}
                p={p}
                onAck={onAck}
                viewerEmail={user.email}
              />
            ))}
          </div>
        </section>
        <section>
          <h3 className="block-title">Sent ({sent.length})</h3>
          {sent.length === 0 && <p className="block-sub">No pokes sent yet.</p>}
          <div className="poke-list">
            {sent.map((p) => (
              <PokeCard
                key={p.id}
                p={p}
                onAck={onAck}
                viewerEmail={user.email}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function PokeCard({
  p,
  onAck,
  viewerEmail,
}: {
  p: Poke;
  onAck: (id: string, s: "ack" | "done") => void;
  viewerEmail: string;
}) {
  const isMine = p.toEmail === viewerEmail;
  return (
    <article className={`poke-card urg-${p.urgency} status-${p.status}`}>
      <header>
        <span className={`urg-tag urg-${p.urgency}`}>
          {urgencyLabel[p.urgency]}
        </span>
        <span className="poke-when">{p.posted}</span>
      </header>
      <p className="poke-q">{p.question}</p>
      <footer>
        <span className="poke-meta">
          {isMine
            ? `From: ${authorName(p.fromEmail)}`
            : `To: ${authorName(p.toEmail)}`}
        </span>
        <span className={`poke-status status-${p.status}`}>{p.status}</span>
        {isMine && p.status === "pending" && (
          <button className="btn small" onClick={() => onAck(p.id, "ack")}>
            Acknowledge
          </button>
        )}
        {isMine && p.status === "ack" && (
          <button
            className="btn small primary"
            onClick={() => onAck(p.id, "done")}
          >
            Mark done
          </button>
        )}
      </footer>
    </article>
  );
}

function ComposePoke({
  user,
  teammates,
  onSend,
}: {
  user: User;
  roles: CustomRole[];
  teammates: User[];
  onSend: (p: Omit<Poke, "id" | "posted" | "status">) => void;
}) {
  // Recipient is now an editable email field — typing any email + Send
  // generates a notification (so the user can verify the poke flow with
  // an arbitrary recipient as requested).
  const [to, setTo] = useState(
    teammates.find((t) => t.email !== user.email)?.email ?? "",
  );
  const [urgency, setUrgency] = useState<PokeUrgency>("medium");
  const [question, setQuestion] = useState("");

  const valid = /\S+@\S+\.\S+/.test(to) && question.trim().length > 0;

  return (
    <div className="poke-compose">
      <div className="compose-row">
        <label>
          <span>To (email)</span>
          <input
            type="email"
            list="poke-teammates"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="teammate@yourteam.com"
          />
          <datalist id="poke-teammates">
            {teammates
              .filter((t) => t.email !== user.email)
              .map((t) => (
                <option key={t.email} value={t.email}>
                  {t.name}
                </option>
              ))}
          </datalist>
          <small className="signin-hint">
            Tip: pick from the suggestions or type any work email — the
            recipient gets a notification when they sign in.
          </small>
        </label>
        <label>
          <span>Urgency</span>
          <div className="urg-choices">
            {(["low", "medium", "high", "blocking"] as const).map((u) => (
              <button
                key={u}
                type="button"
                className={`urg-choice urg-${u} ${urgency === u ? "active" : ""}`}
                onClick={() => setUrgency(u)}
              >
                {urgencyLabel[u]}
              </button>
            ))}
          </div>
        </label>
      </div>
      <label>
        <span>Question</span>
        <textarea
          rows={3}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="One sentence. What do you need from them?"
        />
      </label>
      <div className="thread-compose-foot">
        <span className="note-hint">
          Blocking / high pokes show a banner on the recipient's workspace until
          acknowledged. They also appear in the bell.
        </span>
        <button
          className="btn primary"
          disabled={!valid}
          onClick={() =>
            onSend({
              fromEmail: user.email,
              toEmail: to.trim().toLowerCase(),
              urgency,
              question: question.trim(),
            })
          }
        >
          Send poke
        </button>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// ACHIEVEMENTS — anyone posts; everyone gets notified
// ────────────────────────────────────────────────────────────
function AchievementsTab({
  user,
  achievements,
  onPost,
  onCheer,
}: {
  user: User;
  achievements: Achievement[];
  onPost: (a: Omit<Achievement, "id" | "posted" | "cheers">) => void;
  onCheer: (id: string) => void;
}) {
  const [composing, setComposing] = useState(false);
  const [kind, setKind] = useState<AchievementKind>("publication");
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [url, setUrl] = useState("");

  const valid = title.trim().length > 0;

  function submit() {
    if (!valid) return;
    onPost({
      authorEmail: user.email,
      kind,
      title: title.trim(),
      detail: detail.trim(),
      url: url.trim() || undefined,
    });
    setTitle("");
    setDetail("");
    setUrl("");
    setComposing(false);
  }

  return (
    <div>
      <div className="page-head">
        <p className="kicker">Celebrate the wins · share the energy</p>
        <h1>Recent achievements</h1>
        <p className="lede">
          Share something you're proud of — a paper accepted, a presentation, an
          award, a grant secured, a project shipped. Everyone in the team gets a
          notification, so good news travels fast.
        </p>
      </div>

      <div className="meetings-actions">
        <button className="btn primary" onClick={() => setComposing((v) => !v)}>
          {composing ? "Cancel" : "+ Share an achievement"}
        </button>
      </div>

      {composing && (
        <div className="compose-card">
          <div className="compose-grid">
            <label>
              <span>Type</span>
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value as AchievementKind)}
              >
                {(Object.keys(achievementKindLabel) as AchievementKind[]).map(
                  (k) => (
                    <option key={k} value={k}>
                      {achievementKindLabel[k]}
                    </option>
                  ),
                )}
              </select>
            </label>
            <label className="span-2">
              <span>Title</span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What did you achieve?"
              />
            </label>
            <label className="span-3">
              <span>Detail (optional)</span>
              <textarea
                rows={3}
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                placeholder="Co-authors, venue, what made this hard…"
              />
            </label>
            <label className="span-3">
              <span>Link (optional)</span>
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://…"
              />
            </label>
          </div>
          <div className="compose-foot">
            <span className="note-hint">
              Posting will notify everyone in your team.
            </span>
            <button className="btn primary" disabled={!valid} onClick={submit}>
              Share
            </button>
          </div>
        </div>
      )}

      <div className="achievements-list">
        {achievements.map((a) => (
          <article key={a.id} className={`achievement-card kind-${a.kind}`}>
            <header>
              <span className={`achievement-kind kind-${a.kind}`}>
                {achievementKindLabel[a.kind]}
              </span>
              <span className="achievement-author">
                {authorName(a.authorEmail)} · {a.posted}
              </span>
            </header>
            <h3>{a.title}</h3>
            {a.detail && <p>{a.detail}</p>}
            {a.url && (
              <a
                className="achievement-link"
                href={a.url}
                target="_blank"
                rel="noreferrer"
              >
                {a.url}
              </a>
            )}
            <footer>
              <button
                className={`cheer-btn ${a.cheers.includes(user.email) ? "on" : ""}`}
                onClick={() => onCheer(a.id)}
              >
                {a.cheers.includes(user.email) ? "★" : "☆"} {a.cheers.length}{" "}
                cheer{a.cheers.length === 1 ? "" : "s"}
              </button>
            </footer>
          </article>
        ))}
        {achievements.length === 0 && (
          <p className="block-sub">
            No achievements yet — be the first to share!
          </p>
        )}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// WEEKLY UPDATES
// ────────────────────────────────────────────────────────────
function WeeklyTab({
  user,
  role,
  roles,
  teammates,
  updates,
  onPost,
  onReply,
  onRemind,
}: {
  user: User;
  role: CustomRole;
  roles: CustomRole[];
  teammates: User[];
  updates: WeeklyUpdate[];
  onPost: (w: Omit<WeeklyUpdate, "id" | "posted" | "replies">) => void;
  onReply: (id: string, text: string) => void;
  onRemind: (toEmail: string) => void;
}) {
  const [composing, setComposing] = useState(false);
  const isLead = role.isAdmin === true;

  // Identify members who haven't posted this week (rough heuristic).
  const thisWeek = updates.filter((u) => u.weekOf === currentMondayISO());
  const missing = teammates.filter(
    (t) =>
      t.email !== user.email &&
      !thisWeek.some((u) => u.authorEmail === t.email),
  );

  return (
    <div>
      <div className="page-head">
        <p className="kicker">
          What you did · what you'll do · where you're stuck
        </p>
        <h1>Weekly updates</h1>
        <p className="lede">
          A short weekly post per member: progress, blockers, plan, and a
          specific ask. The team lead gets a roll-up so they don't have to chase
          anyone — and can reply or send a reminder right here.
        </p>
      </div>

      <div className="meetings-actions">
        <button className="btn primary" onClick={() => setComposing((v) => !v)}>
          {composing ? "Cancel" : "+ Share this week's update"}
        </button>
      </div>

      {composing && (
        <ComposeWeekly
          user={user}
          teammates={teammates}
          onSubmit={(w) => {
            onPost(w);
            setComposing(false);
          }}
        />
      )}

      {isLead && missing.length > 0 && (
        <section className="weekly-missing">
          <h3 className="block-title">Missing this week ({missing.length})</h3>
          <div className="weekly-missing-list">
            {missing.map((t) => (
              <div key={t.email} className="weekly-missing-row">
                <Avatar user={t} size={28} />
                <span>
                  <strong>{t.name}</strong>
                  <small>{roles.find((r) => r.id === t.roleId)?.label}</small>
                </span>
                <button className="btn small" onClick={() => onRemind(t.email)}>
                  Send reminder
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="weekly-list">
        {updates.map((u) => (
          <WeeklyCard
            key={u.id}
            update={u}
            user={user}
            onReply={(text) => onReply(u.id, text)}
            isLead={isLead}
          />
        ))}
        {updates.length === 0 && (
          <p className="block-sub">No weekly updates yet.</p>
        )}
      </div>
    </div>
  );
}

function currentMondayISO(): string {
  const d = new Date();
  const day = d.getDay() || 7;
  if (day !== 1) d.setHours(-24 * (day - 1));
  return d.toISOString().slice(0, 10);
}

function ComposeWeekly({
  user,
  teammates,
  onSubmit,
}: {
  user: User;
  teammates: User[];
  onSubmit: (w: Omit<WeeklyUpdate, "id" | "posted" | "replies">) => void;
}) {
  const [did, setDid] = useState("");
  const [stuck, setStuck] = useState("");
  const [next, setNext] = useState("");
  const [helpFromEmail, setHelpFromEmail] = useState("");
  const [helpAsk, setHelpAsk] = useState("");
  const [url, setUrl] = useState("");
  const valid = did.trim() && next.trim();

  function submit() {
    if (!valid) return;
    onSubmit({
      authorEmail: user.email,
      weekOf: currentMondayISO(),
      did: did.trim(),
      stuck: stuck.trim() || undefined,
      next: next.trim(),
      helpFromEmail: helpFromEmail.trim() || undefined,
      helpAsk: helpAsk.trim() || undefined,
      url: url.trim() || undefined,
    });
    setDid("");
    setStuck("");
    setNext("");
    setHelpFromEmail("");
    setHelpAsk("");
    setUrl("");
  }

  return (
    <div className="compose-card">
      <div className="compose-grid">
        <label className="span-3">
          <span>What did you do this week?</span>
          <textarea
            rows={3}
            value={did}
            onChange={(e) => setDid(e.target.value)}
            placeholder="Concrete progress, links, results."
          />
        </label>
        <label className="span-3">
          <span>Where are you stuck? (optional)</span>
          <textarea
            rows={2}
            value={stuck}
            onChange={(e) => setStuck(e.target.value)}
            placeholder="Be specific so someone can help."
          />
        </label>
        <label className="span-3">
          <span>What will you do next week?</span>
          <textarea
            rows={2}
            value={next}
            onChange={(e) => setNext(e.target.value)}
            placeholder="Plan / milestones."
          />
        </label>
        <label>
          <span>Need help from</span>
          <input
            list="weekly-teammates"
            value={helpFromEmail}
            onChange={(e) => setHelpFromEmail(e.target.value)}
            placeholder="email or leave blank"
          />
          <datalist id="weekly-teammates">
            {teammates
              .filter((t) => t.email !== user.email)
              .map((t) => (
                <option key={t.email} value={t.email}>
                  {t.name}
                </option>
              ))}
          </datalist>
        </label>
        <label className="span-2">
          <span>Help ask (optional)</span>
          <input
            value={helpAsk}
            onChange={(e) => setHelpAsk(e.target.value)}
            placeholder="What exactly do you need?"
          />
        </label>
        <label className="span-3">
          <span>Link (optional)</span>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="PR, doc, draft, demo…"
          />
        </label>
      </div>
      <div className="compose-foot">
        <span className="note-hint">
          Your update is shared with your team lead and visible to teammates.
        </span>
        <button className="btn primary" disabled={!valid} onClick={submit}>
          Post update
        </button>
      </div>
    </div>
  );
}

function WeeklyCard({
  update,
  user,
  onReply,
  isLead,
}: {
  update: WeeklyUpdate;
  user: User;
  onReply: (text: string) => void;
  isLead: boolean;
}) {
  const [replying, setReplying] = useState(false);
  const [text, setText] = useState("");
  return (
    <article className="weekly-card">
      <header>
        <div className="weekly-author">
          <Avatar
            user={{
              initials: makeInitials(authorName(update.authorEmail)),
              avatarHue: 200,
            }}
            size={28}
          />
          <div>
            <strong>{authorName(update.authorEmail)}</strong>
            <small>
              Week of {update.weekOf} · {update.posted}
            </small>
          </div>
        </div>
      </header>
      <div className="weekly-grid">
        <div>
          <h5>Did</h5>
          <p>{update.did}</p>
        </div>
        {update.stuck && (
          <div>
            <h5>Stuck</h5>
            <p>{update.stuck}</p>
          </div>
        )}
        <div>
          <h5>Next</h5>
          <p>{update.next}</p>
        </div>
        {update.helpAsk && (
          <div>
            <h5>Help ask</h5>
            <p>
              {update.helpFromEmail ? (
                <strong>→ {authorName(update.helpFromEmail)} · </strong>
              ) : null}
              {update.helpAsk}
            </p>
          </div>
        )}
        {update.url && (
          <div className="span-2">
            <h5>Link</h5>
            <a href={update.url} target="_blank" rel="noreferrer">
              {update.url}
            </a>
          </div>
        )}
      </div>

      {update.replies.length > 0 && (
        <div className="weekly-replies">
          {update.replies.map((r, i) => (
            <div key={i} className="weekly-reply">
              <strong>{authorName(r.fromEmail)}</strong>
              <span className="weekly-reply-when">{r.posted}</span>
              <p>{r.text}</p>
            </div>
          ))}
        </div>
      )}

      <footer>
        {!replying ? (
          <button
            className="btn small ghost"
            onClick={() => setReplying(true)}
            // The lead always benefits from replying; everyone else can too.
            title={
              isLead ? "Reply to this update" : "Reply to support a teammate"
            }
          >
            Reply
          </button>
        ) : (
          <div className="weekly-reply-form">
            <textarea
              rows={2}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={isLead ? "Reply / nudge / advise…" : "Reply…"}
              autoFocus
            />
            <div className="weekly-reply-actions">
              <button
                className="btn ghost small"
                onClick={() => {
                  setReplying(false);
                  setText("");
                }}
              >
                Cancel
              </button>
              <button
                className="btn primary small"
                disabled={!text.trim()}
                onClick={() => {
                  onReply(text.trim());
                  setText("");
                  setReplying(false);
                }}
              >
                Post reply
              </button>
            </div>
          </div>
        )}
      </footer>
    </article>
  );
}

// ────────────────────────────────────────────────────────────
// GRANTS — every member posts a domain; AI agents fan-out search
// across the regions / funders mentioned and return matched calls.
// Posts are visible to the whole team so others can co-apply or
// suggest funders.
// ────────────────────────────────────────────────────────────
function GrantsTab({
  user,
  grants,
  setGrants,
  onActivity,
}: {
  user: User;
  grants: GrantThread[];
  setGrants: (updater: (cur: GrantThread[]) => GrantThread[]) => void;
  onActivity?: () => void;
}) {
  const [composing, setComposing] = useState(false);
  const [openId, setOpenId] = useState<string | null>(grants[0]?.id ?? null);
  const open = grants.find((g) => g.id === openId) ?? null;

  function postGrant(
    domain: string,
    regions: string[],
    funders: string[],
    notes: string,
  ) {
    const id = `g-${Date.now()}`;
    const fresh: GrantThread = {
      id,
      authorEmail: user.email,
      domain,
      regions,
      funders,
      notes: notes || undefined,
      posted: "just now",
      status: "scanning",
      matches: [],
      comments: [],
    };
    setGrants((cur) => [fresh, ...cur]);
    setOpenId(id);
    setComposing(false);
    // Simulate the agent finishing its scan a moment later.
    setTimeout(() => {
      setGrants((cur) =>
        cur.map((g) =>
          g.id === id
            ? {
                ...g,
                status: "matches",
                matches: [
                  {
                    id: `gm-${Date.now()}`,
                    name: "(AI-found) Regional innovation grant",
                    funder: funders[0] ?? "Local foundation",
                    region: regions[0] ?? "Local",
                    deadline: "2026-09-30",
                    amount: "€100-300k",
                    link: "https://example.com/grant",
                    fitScore: 0.74,
                    why: `Matches "${domain}" — agents will keep scanning weekly.`,
                  },
                ],
              }
            : g,
        ),
      );
      onActivity?.();
    }, 900);
  }

  function addComment(id: string, text: string) {
    setGrants((cur) =>
      cur.map((g) =>
        g.id === id
          ? {
              ...g,
              comments: [
                ...g.comments,
                { fromEmail: user.email, text, posted: "just now" },
              ],
            }
          : g,
      ),
    );
    onActivity?.();
  }

  return (
    <div>
      <div className="page-head">
        <p className="kicker">Funding scout · AI agents · team-wide</p>
        <h1>Grants</h1>
        <p className="lede">
          Post the domain you're hunting funding in — pick regions, funders, and
          a few keywords. AI agents fan-out across public funder portals and
          surface upcoming calls with relevance scores. All grants are shared
          with the team so others can co-apply or pile on suggestions.
        </p>
      </div>

      <div className="threads-wrap">
        <aside className="threads-list">
          <button className="btn primary" onClick={() => setComposing(true)}>
            + New grant search
          </button>
          <div className="thread-counts">
            <span>{grants.length} active</span>
          </div>
          {grants.map((g) => (
            <button
              key={g.id}
              className={`thread-row ${openId === g.id ? "active" : ""}`}
              onClick={() => {
                setOpenId(g.id);
                setComposing(false);
              }}
            >
              <div className="thread-row-title">{g.domain}</div>
              <div className="thread-row-meta">
                <span className="thread-author">
                  {authorName(g.authorEmail)}
                </span>
                <span className={`vis vis-${g.status}`}>
                  {grantStatusLabel(g.status)}
                </span>
                <span className="thread-replies">
                  {g.matches.length} matches
                </span>
              </div>
            </button>
          ))}
        </aside>

        <div className="thread-detail">
          {composing ? (
            <ComposeGrant
              onCancel={() => setComposing(false)}
              onPost={postGrant}
            />
          ) : open ? (
            <GrantView
              g={open}
              user={user}
              onComment={(text) => addComment(open.id, text)}
            />
          ) : (
            <p className="notes-empty">No grant searches yet. Start one.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function grantStatusLabel(s: GrantThread["status"]): string {
  if (s === "scanning") return "scanning";
  if (s === "matches") return "matches";
  if (s === "applied") return "applied";
  return "archived";
}

function ComposeGrant({
  onCancel,
  onPost,
}: {
  onCancel: () => void;
  onPost: (
    domain: string,
    regions: string[],
    funders: string[],
    notes: string,
  ) => void;
}) {
  const [domain, setDomain] = useState("");
  const [regions, setRegions] = useState("");
  const [funders, setFunders] = useState("");
  const [notes, setNotes] = useState("");
  const valid = domain.trim().length > 0;

  function submit() {
    if (!valid) return;
    onPost(
      domain.trim(),
      regions
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      funders
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      notes.trim(),
    );
  }

  return (
    <div className="thread-compose">
      <div className="compose-head">
        <h2>New grant search</h2>
        <button className="btn ghost" onClick={onCancel}>
          Cancel
        </button>
      </div>
      <label>
        <span>Domain / keywords</span>
        <input
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="e.g. Behavioral cybersecurity, AI personas"
        />
      </label>
      <label>
        <span>Regions (comma-separated)</span>
        <input
          value={regions}
          onChange={(e) => setRegions(e.target.value)}
          placeholder="Luxembourg, EU, Horizon Europe"
        />
      </label>
      <label>
        <span>Funders / foundations / organizations</span>
        <input
          value={funders}
          onChange={(e) => setFunders(e.target.value)}
          placeholder="FNR, EU Commission, Volkswagen Foundation"
        />
      </label>
      <label>
        <span>Notes (optional)</span>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Constraints — preferred horizons, consortium type, must-have themes."
        />
      </label>
      <div className="thread-compose-foot">
        <span className="note-hint">
          Agents scan continuously. New matches appear here and notify the team.
        </span>
        <button className="btn primary" disabled={!valid} onClick={submit}>
          Start search
        </button>
      </div>
    </div>
  );
}

function GrantView({
  g,
  user,
  onComment,
}: {
  g: GrantThread;
  user: User;
  onComment: (text: string) => void;
}) {
  const [reply, setReply] = useState("");
  return (
    <article className="thread-detail-inner">
      <header>
        <h2>{g.domain}</h2>
        <div className="thread-detail-meta">
          <span>By {authorName(g.authorEmail)}</span>
          <span>·</span>
          <span>{g.posted}</span>
          <span>·</span>
          <span className={`vis vis-${g.status}`}>
            {grantStatusLabel(g.status)}
          </span>
        </div>
        <div className="grant-tags">
          {g.regions.map((r) => (
            <span key={r} className="grant-tag region">
              {r}
            </span>
          ))}
          {g.funders.map((f) => (
            <span key={f} className="grant-tag funder">
              {f}
            </span>
          ))}
        </div>
      </header>
      <br />
      {g.notes && <p className="thread-body">{g.notes}</p>}

      <h3 className="block-title">AI-matched calls ({g.matches.length})</h3>
      {g.status === "scanning" && g.matches.length === 0 && (
        <div className="grant-empty">
          Agents scanning… first matches usually appear within a minute.
        </div>
      )}
      <div className="grant-matches">
        {g.matches.map((m) => (
          <div key={m.id} className="grant-match">
            <div className="grant-match-head">
              <strong>{m.name}</strong>
              <span className="grant-fit">
                {Math.round(m.fitScore * 100)}% fit
              </span>
            </div>
            <div className="grant-match-meta">
              <span>{m.funder}</span>
              <span>·</span>
              <span>{m.region}</span>
              <span>·</span>
              <span>Deadline {m.deadline}</span>
              {m.amount && (
                <>
                  <span>·</span>
                  <span>{m.amount}</span>
                </>
              )}
            </div>
            <p className="grant-match-why">{m.why}</p>
            <a
              href={m.link}
              target="_blank"
              rel="noreferrer"
              className="grant-match-link"
            >
              Open call ↗
            </a>
          </div>
        ))}
      </div>

      <h3 className="block-title">Team comments</h3>
      <div className="grant-comments">
        {g.comments.length === 0 && (
          <p className="block-sub">No comments yet — kick it off.</p>
        )}
        {g.comments.map((c, i) => (
          <div key={i} className="grant-comment">
            <strong>{authorName(c.fromEmail)}</strong>
            <span className="weekly-reply-when">{c.posted}</span>
            <p>{c.text}</p>
          </div>
        ))}
      </div>
      <div className="thread-reply-form">
        <textarea
          rows={2}
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder={`Comment...`}
        />
        <div className="thread-reply-actions">
          <button
            className="btn primary"
            disabled={!reply.trim()}
            onClick={() => {
              onComment(reply.trim());
              setReply("");
            }}
          >
            Comment
          </button>
        </div>
      </div>
    </article>
  );
}

// ────────────────────────────────────────────────────────────
// OPPORTUNITIES — internships, summer schools, industry collabs.
// AI agents search the configured countries / orgs in the work
// domain. Members can ping the lead inline; lead responds with
// approve / decline / suggestion. All replies are visible team-wide.
// ────────────────────────────────────────────────────────────
function OpportunitiesTab({
  user,
  isLead,
  opportunities,
  setOpportunities,
  onActivity,
}: {
  user: User;
  isLead: boolean;
  opportunities: OpportunityThread[];
  setOpportunities: (
    updater: (cur: OpportunityThread[]) => OpportunityThread[],
  ) => void;
  onActivity?: () => void;
}) {
  const [composing, setComposing] = useState(false);
  const [openId, setOpenId] = useState<string | null>(
    opportunities[0]?.id ?? null,
  );
  const open = opportunities.find((o) => o.id === openId) ?? null;

  function postOpportunity(
    kind: OpportunityKind,
    domain: string,
    countries: string[],
    organizations: string[],
    notes: string,
  ) {
    const id = `o-${Date.now()}`;
    const fresh: OpportunityThread = {
      id,
      authorEmail: user.email,
      kind,
      domain,
      countries,
      organizations,
      notes: notes || undefined,
      posted: "just now",
      status: "scanning",
      matches: [],
      conversation: [],
    };
    setOpportunities((cur) => [fresh, ...cur]);
    setOpenId(id);
    setComposing(false);
    setTimeout(() => {
      setOpportunities((cur) =>
        cur.map((o) =>
          o.id === id
            ? {
                ...o,
                status: "matches",
                matches: [
                  {
                    id: `om-${Date.now()}`,
                    title: `(AI-found) ${opportunityKindLabel[kind]} in ${countries[0] ?? "EU"}`,
                    org: organizations[0] ?? "(matched org)",
                    country: countries[0] ?? "EU",
                    deadline: "2026-08-15",
                    link: "https://example.com/opportunity",
                    fitScore: 0.7,
                    why: `Aligned with "${domain}" — agents will keep scanning.`,
                  },
                ],
              }
            : o,
        ),
      );
      onActivity?.();
    }, 900);
  }

  function askLead(id: string, text: string) {
    setOpportunities((cur) =>
      cur.map((o) =>
        o.id === id
          ? {
              ...o,
              status:
                o.status === "matches" || o.status === "scanning"
                  ? "pending_lead"
                  : o.status,
              conversation: [
                ...o.conversation,
                {
                  fromEmail: user.email,
                  role: "member",
                  text,
                  posted: "just now",
                },
              ],
            }
          : o,
      ),
    );
  }

  function leadDecide(
    id: string,
    decision: "approve" | "decline" | "suggest",
    text: string,
  ) {
    setOpportunities((cur) =>
      cur.map((o) =>
        o.id === id
          ? {
              ...o,
              status:
                decision === "approve"
                  ? "approved"
                  : decision === "decline"
                    ? "declined"
                    : o.status,
              conversation: [
                ...o.conversation,
                {
                  fromEmail: user.email,
                  role: "lead",
                  text,
                  decision,
                  posted: "just now",
                },
              ],
            }
          : o,
      ),
    );
  }

  return (
    <div>
      <div className="page-head">
        <p className="kicker">
          Internships · summer schools · industry collaboration
        </p>
        <h1>Opportunities</h1>
        <p className="lede">
          Tell agents what you're looking for — kind (internship, summer school,
          industry collab), domain, target countries, and orgs. Matches show up
          here with apply-links. Ask the team lead inline for permission or
          suggestions; the lead replies with approve, decline, or a tweak.
        </p>
      </div>

      <div className="threads-wrap">
        <aside className="threads-list">
          <button className="btn primary" onClick={() => setComposing(true)}>
            + New opportunity search
          </button>
          <div className="thread-counts">
            <span>{opportunities.length} active</span>
          </div>
          {opportunities.map((o) => (
            <button
              key={o.id}
              className={`thread-row ${openId === o.id ? "active" : ""}`}
              onClick={() => {
                setOpenId(o.id);
                setComposing(false);
              }}
            >
              <div className="thread-row-title">
                <span className={`opp-kind opp-${o.kind}`}>
                  {opportunityKindLabel[o.kind]}
                </span>
                {" · "}
                {o.domain}
              </div>
              <div className="thread-row-meta">
                <span className="thread-author">
                  {authorName(o.authorEmail)}
                </span>
                <span className={`vis vis-${o.status}`}>
                  {oppStatusLabel(o.status)}
                </span>
                <span className="thread-replies">
                  {o.matches.length} matches
                </span>
              </div>
            </button>
          ))}
        </aside>

        <div className="thread-detail">
          {composing ? (
            <ComposeOpportunity
              onCancel={() => setComposing(false)}
              onPost={postOpportunity}
            />
          ) : open ? (
            <OpportunityView
              o={open}
              user={user}
              isLead={isLead}
              onAsk={(text) => askLead(open.id, text)}
              onLeadDecide={(decision, text) =>
                leadDecide(open.id, decision, text)
              }
            />
          ) : (
            <p className="notes-empty">
              No opportunity searches yet. Start one.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function oppStatusLabel(s: OpportunityThread["status"]): string {
  if (s === "scanning") return "scanning";
  if (s === "matches") return "matches";
  if (s === "pending_lead") return "awaiting lead";
  if (s === "approved") return "approved";
  return "declined";
}

function ComposeOpportunity({
  onCancel,
  onPost,
}: {
  onCancel: () => void;
  onPost: (
    kind: OpportunityKind,
    domain: string,
    countries: string[],
    organizations: string[],
    notes: string,
  ) => void;
}) {
  const [kind, setKind] = useState<OpportunityKind>("internship");
  const [domain, setDomain] = useState("");
  const [countries, setCountries] = useState("");
  const [orgs, setOrgs] = useState("");
  const [notes, setNotes] = useState("");
  const valid = domain.trim().length > 0;

  function submit() {
    if (!valid) return;
    onPost(
      kind,
      domain.trim(),
      countries
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      orgs
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      notes.trim(),
    );
  }

  return (
    <div className="thread-compose">
      <div className="compose-head">
        <h2>New opportunity search</h2>
        <button className="btn ghost" onClick={onCancel}>
          Cancel
        </button>
      </div>
      <label>
        <span>Kind</span>
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as OpportunityKind)}
        >
          {(Object.keys(opportunityKindLabel) as OpportunityKind[]).map((k) => (
            <option key={k} value={k}>
              {opportunityKindLabel[k]}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>Work domain</span>
        <input
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="e.g. behavioral instrumentation, eval harness"
        />
      </label>
      <label>
        <span>Countries (comma-separated)</span>
        <input
          value={countries}
          onChange={(e) => setCountries(e.target.value)}
          placeholder="Germany, Netherlands, Switzerland"
        />
      </label>
      <label>
        <span>Companies / organizations / institutes</span>
        <input
          value={orgs}
          onChange={(e) => setOrgs(e.target.value)}
          placeholder="Max Planck, TU Delft, ETH Zürich"
        />
      </label>
      <label>
        <span>Notes (optional)</span>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Constraints — dates, remote, language, stipend."
        />
      </label>
      <div className="thread-compose-foot">
        <span className="note-hint">
          You can ask the lead for permission once matches arrive.
        </span>
        <button className="btn primary" disabled={!valid} onClick={submit}>
          Start search
        </button>
      </div>
    </div>
  );
}

function OpportunityView({
  o,
  user,
  isLead,
  onAsk,
  onLeadDecide,
}: {
  o: OpportunityThread;
  user: User;
  isLead: boolean;
  onAsk: (text: string) => void;
  onLeadDecide: (
    decision: "approve" | "decline" | "suggest",
    text: string,
  ) => void;
}) {
  const [askText, setAskText] = useState("");
  const [leadText, setLeadText] = useState("");
  const [leadMode, setLeadMode] = useState<"approve" | "decline" | "suggest">(
    "approve",
  );
  const isAuthor = o.authorEmail === user.email;

  return (
    <article className="thread-detail-inner">
      <header>
        <h2>
          <span className={`opp-kind opp-${o.kind}`}>
            {opportunityKindLabel[o.kind]}
          </span>
          {" · "}
          {o.domain}
        </h2>
        <div className="thread-detail-meta">
          <span>By {authorName(o.authorEmail)}</span>
          <span>·</span>
          <span>{o.posted}</span>
          <span>·</span>
          <span className={`vis vis-${o.status}`}>
            {oppStatusLabel(o.status)}
          </span>
        </div>
        <div className="grant-tags">
          {o.countries.map((c) => (
            <span key={c} className="grant-tag region">
              {c}
            </span>
          ))}
          {o.organizations.map((g) => (
            <span key={g} className="grant-tag funder">
              {g}
            </span>
          ))}
        </div>
      </header>
      <br />
      {o.notes && <p className="thread-body">{o.notes}</p>}

      <h3 className="block-title">AI-matched options ({o.matches.length})</h3>
      {o.status === "scanning" && o.matches.length === 0 && (
        <div className="grant-empty">
          Agents scanning… first matches usually appear within a minute.
        </div>
      )}
      <div className="grant-matches">
        {o.matches.map((m) => (
          <div key={m.id} className="grant-match">
            <div className="grant-match-head">
              <strong>{m.title}</strong>
              <span className="grant-fit">
                {Math.round(m.fitScore * 100)}% fit
              </span>
            </div>
            <div className="grant-match-meta">
              <span>{m.org}</span>
              <span>·</span>
              <span>{m.country}</span>
              {m.deadline && (
                <>
                  <span>·</span>
                  <span>Deadline {m.deadline}</span>
                </>
              )}
            </div>
            <p className="grant-match-why">{m.why}</p>
            <a
              href={m.link}
              target="_blank"
              rel="noreferrer"
              className="grant-match-link"
            >
              Apply ↗
            </a>
          </div>
        ))}
      </div>

      <h3 className="block-title">Conversation</h3>
      <div className="grant-comments">
        {o.conversation.length === 0 && (
          <p className="block-sub">No messages yet.</p>
        )}
        {o.conversation.map((c, i) => (
          <div
            key={i}
            className={`grant-comment opp-${c.role} ${c.decision ? `dec-${c.decision}` : ""}`}
          >
            <strong>
              {authorName(c.fromEmail)}
              {c.role === "lead" ? " (lead)" : ""}
              {c.decision ? ` · ${c.decision}` : ""}
            </strong>
            <span className="weekly-reply-when">{c.posted}</span>
            <p>{c.text}</p>
          </div>
        ))}
      </div>

      {/* Author asks the lead for permission / suggestion */}
      {isAuthor && o.status !== "approved" && o.status !== "declined" && (
        <div className="thread-reply-form">
          <textarea
            rows={2}
            value={askText}
            onChange={(e) => setAskText(e.target.value)}
            placeholder="Ask the lead — for permission, opinion, or a suggestion."
          />
          <div className="thread-reply-actions">
            <button
              className="btn primary"
              disabled={!askText.trim()}
              onClick={() => {
                onAsk(askText.trim());
                setAskText("");
              }}
            >
              Ask the lead
            </button>
          </div>
        </div>
      )}

      {/* Lead replies with approve / decline / suggest */}
      {isLead && (
        <div className="thread-reply-form">
          <div className="urg-choices">
            {(["approve", "suggest", "decline"] as const).map((d) => (
              <button
                key={d}
                type="button"
                className={`urg-choice ${leadMode === d ? "active" : ""}`}
                onClick={() => setLeadMode(d)}
              >
                {d}
              </button>
            ))}
          </div>
          <textarea
            rows={2}
            value={leadText}
            onChange={(e) => setLeadText(e.target.value)}
            placeholder="Reply as lead — visible to the whole team."
          />
          <div className="thread-reply-actions">
            <button
              className="btn primary"
              disabled={!leadText.trim()}
              onClick={() => {
                onLeadDecide(leadMode, leadText.trim());
                setLeadText("");
              }}
            >
              Send {leadMode}
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

// ────────────────────────────────────────────────────────────
// ADMIN — role manager + member allowlist
// ────────────────────────────────────────────────────────────
function AdminTab({
  roles,
  setRoles,
  allowlist,
  setAllowlist,
}: {
  roles: CustomRole[];
  setRoles: (r: CustomRole[]) => void;
  allowlist: AllowlistEntry[];
  setAllowlist: (a: AllowlistEntry[]) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const editing = roles.find((r) => r.id === editingId) ?? null;

  function updateRole(id: string, patch: Partial<CustomRole>) {
    setRoles(roles.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function setPerm(id: string, comp: Component, p: Permission) {
    const r = roles.find((rr) => rr.id === id);
    if (!r) return;
    updateRole(id, { permissions: { ...r.permissions, [comp]: p } });
  }

  function newRole() {
    const id = `role-${Date.now()}`;
    const r: CustomRole = {
      id,
      label: "New role",
      rank: Math.max(...roles.map((r) => r.rank)) + 1,
      description: "Describe the role.",
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
    };
    setRoles([...roles, r]);
    setEditingId(id);
  }

  function removeRole(id: string) {
    setRoles(roles.filter((r) => r.id !== id));
    if (editingId === id) setEditingId(null);
  }

  const components: Component[] = [
    "chat",
    "notes",
    "threads",
    "pokes",
    "assignments",
    "meetings",
    "upcoming",
    "knowledge",
    "queue",
    "group_health",
    "reports",
    "admin",
  ];

  const [adminTab, setAdminTab] = useState<"roles" | "members">("members");

  return (
    <div>
      <div className="page-head">
        <p className="kicker">Team admin</p>
        <h1>{adminTab === "roles" ? "Roles & permissions" : "Members"}</h1>
        <p className="lede">
          {adminTab === "roles"
            ? "Define the roles that exist on your team and what each role can see / do per component. Visibility on threads / pokes inherits from this matrix."
            : "Add the people allowed to sign in. Each entry binds a work email to a name and a role — only allowlisted emails can authenticate (e.g. via Outlook / Microsoft 365)."}
        </p>
      </div>

      <div className="admin-tabs">
        <button
          className={`admin-tab ${adminTab === "members" ? "active" : ""}`}
          onClick={() => setAdminTab("members")}
        >
          Members ({allowlist.length})
        </button>
        <button
          className={`admin-tab ${adminTab === "roles" ? "active" : ""}`}
          onClick={() => setAdminTab("roles")}
        >
          Roles ({roles.length})
        </button>
      </div>

      {adminTab === "members" && (
        <MembersAdmin
          allowlist={allowlist}
          setAllowlist={setAllowlist}
          roles={roles}
        />
      )}
      {adminTab === "roles" && (
        <div className="admin-wrap">
          <aside className="admin-list">
            <button className="btn primary" onClick={newRole}>
              + New role
            </button>
            {roles
              .slice()
              .sort((a, b) => a.rank - b.rank)
              .map((r) => (
                <button
                  key={r.id}
                  className={`role-row ${editingId === r.id ? "active" : ""}`}
                  onClick={() => setEditingId(r.id)}
                >
                  <div>
                    <div className="role-row-label">{r.label}</div>
                    <div className="role-row-rank">
                      Rank {r.rank}
                      {r.isAdmin ? " · admin" : ""}
                    </div>
                  </div>
                </button>
              ))}
          </aside>

          <div className="admin-detail">
            {!editing && (
              <p className="block-sub">
                Pick a role to edit, or create a new one.
              </p>
            )}
            {editing && (
              <>
                <div className="admin-fields">
                  <label>
                    <span>Label</span>
                    <input
                      value={editing.label}
                      onChange={(e) =>
                        updateRole(editing.id, { label: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    <span>Rank (1 = most senior)</span>
                    <input
                      type="number"
                      min={1}
                      value={editing.rank}
                      onChange={(e) =>
                        updateRole(editing.id, {
                          rank: parseInt(e.target.value || "1"),
                        })
                      }
                    />
                  </label>
                  <label className="full">
                    <span>Description</span>
                    <input
                      value={editing.description}
                      onChange={(e) =>
                        updateRole(editing.id, { description: e.target.value })
                      }
                    />
                  </label>
                  <label className="checkbox">
                    <input
                      type="checkbox"
                      checked={!!editing.isAdmin}
                      onChange={(e) =>
                        updateRole(editing.id, { isAdmin: e.target.checked })
                      }
                    />
                    <span>
                      This role is the team admin (can manage roles + members)
                    </span>
                  </label>
                </div>

                <h3 className="block-title">Permissions</h3>
                <div className="perm-table">
                  <div className="perm-head">
                    <div>Component</div>
                    {(
                      [
                        "none",
                        "read",
                        "own",
                        "read_write",
                        "full",
                      ] as Permission[]
                    ).map((p) => (
                      <div key={p}>{permissionLabel(p)}</div>
                    ))}
                  </div>
                  {components.map((c) => (
                    <div key={c} className="perm-row">
                      <div className="perm-comp">{componentLabels[c]}</div>
                      {(
                        [
                          "none",
                          "read",
                          "own",
                          "read_write",
                          "full",
                        ] as Permission[]
                      ).map((p) => (
                        <button
                          key={p}
                          type="button"
                          className={`perm-radio ${editing.permissions[c] === p ? "active" : ""}`}
                          onClick={() => setPerm(editing.id, c, p)}
                        >
                          {editing.permissions[c] === p ? "●" : "○"}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>

                <div className="admin-actions">
                  <button
                    className="btn ghost"
                    onClick={() => removeRole(editing.id)}
                  >
                    Delete role
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// MEMBERS — lead manages the email allowlist (name + work email +
// role). Members listed here can sign in via their email provider.
// ────────────────────────────────────────────────────────────
function MembersAdmin({
  allowlist,
  setAllowlist,
  roles,
}: {
  allowlist: AllowlistEntry[];
  setAllowlist: (a: AllowlistEntry[]) => void;
  roles: CustomRole[];
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [orcid, setOrcid] = useState("");
  const [roleId, setRoleId] = useState<string>(
    roles[1]?.id ?? roles[0]?.id ?? "core",
  );
  const [error, setError] = useState<string | null>(null);
  const [editingEmail, setEditingEmail] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editOrcid, setEditOrcid] = useState("");
  const [editRoleId, setEditRoleId] = useState("");

  function add() {
    setError(null);
    const cleanedEmail = email.trim().toLowerCase();
    const cleanedName = name.trim();
    if (!cleanedName) {
      setError("Enter the member's name.");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(cleanedEmail)) {
      setError("Enter a valid work email.");
      return;
    }
    if (allowlist.some((a) => a.email.toLowerCase() === cleanedEmail)) {
      setError("This email is already in the allowlist.");
      return;
    }
    const cleanedOrcid = orcid.trim();
    setAllowlist([
      ...allowlist,
      {
        email: cleanedEmail,
        name: cleanedName,
        roleId,
        orcid: cleanedOrcid ? cleanedOrcid : undefined,
      },
    ]);
    setName("");
    setEmail("");
    setOrcid("");
  }

  function remove(targetEmail: string) {
    setAllowlist(allowlist.filter((a) => a.email !== targetEmail));
  }

  function changeRole(targetEmail: string, newRoleId: string) {
    setAllowlist(
      allowlist.map((a) =>
        a.email === targetEmail ? { ...a, roleId: newRoleId } : a,
      ),
    );
  }

  function startEdit(a: AllowlistEntry) {
    setError(null);
    setEditingEmail(a.email);
    setEditName(a.name);
    setEditEmail(a.email);
    setEditOrcid(a.orcid ?? "");
    setEditRoleId(a.roleId);
  }

  function cancelEdit() {
    setEditingEmail(null);
  }

  function saveEdit() {
    if (!editingEmail) return;
    const cleanedEmail = editEmail.trim().toLowerCase();
    const cleanedName = editName.trim();
    const cleanedOrcid = editOrcid.trim();
    if (!cleanedName) {
      setError("Enter the member's name.");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(cleanedEmail)) {
      setError("Enter a valid work email.");
      return;
    }
    if (
      allowlist.some(
        (a) =>
          a.email.toLowerCase() === cleanedEmail && a.email !== editingEmail,
      )
    ) {
      setError("This email is already in the allowlist.");
      return;
    }
    setAllowlist(
      allowlist.map((a) =>
        a.email === editingEmail
          ? {
              ...a,
              email: cleanedEmail,
              name: cleanedName,
              roleId: editRoleId,
              orcid: cleanedOrcid ? cleanedOrcid : undefined,
            }
          : a,
      ),
    );
    setEditingEmail(null);
  }

  return (
    <div className="members-wrap">
      <div className="members-add">
        <h3 className="block-title">Add a member</h3>
        <div className="members-add-row">
          <label>
            <span>Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
            />
          </label>
          <label>
            <span>Work email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@yourteam.com"
            />
          </label>
          <label>
            <span>ORCID (optional)</span>
            <input
              value={orcid}
              onChange={(e) => setOrcid(e.target.value)}
              placeholder="0000-0000-0000-0000"
            />
          </label>
          <label>
            <span>Role</span>
            <select value={roleId} onChange={(e) => setRoleId(e.target.value)}>
              {roles
                .slice()
                .sort((a, b) => a.rank - b.rank)
                .map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
            </select>
          </label>
          <button className="btn primary" onClick={add}>
            Add
          </button>
        </div>
        {error && <p className="signin-error">{error}</p>}
        <p className="note-hint">
          The member receives a sign-in invite. They authenticate through their
          email provider (Outlook / Microsoft 365) — only allowlisted emails can
          complete sign-in.
        </p>
      </div>

      <div className="members-table">
        <div className="members-row members-head">
          <div>Name</div>
          <div>Email</div>
          <div>ORCID</div>
          <div>Role</div>
          <div></div>
        </div>
        {allowlist.map((a) =>
          editingEmail === a.email ? (
            <div key={a.email} className="members-row">
              <div className="members-name">
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>
              <div className="members-email">
                <input
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                />
              </div>
              <div className="members-orcid">
                <input
                  value={editOrcid}
                  onChange={(e) => setEditOrcid(e.target.value)}
                />
              </div>
              <div>
                <select
                  value={editRoleId}
                  onChange={(e) => setEditRoleId(e.target.value)}
                >
                  {roles
                    .slice()
                    .sort((x, y) => x.rank - y.rank)
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.label}
                      </option>
                    ))}
                </select>
              </div>
              <div className="members-actions">
                <button className="btn small" onClick={saveEdit}>
                  Save
                </button>
                <button className="btn small ghost" onClick={cancelEdit}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div key={a.email} className="members-row">
              <div className="members-name">{a.name}</div>
              <div className="members-email">{a.email}</div>
              <div className="members-orcid">{a.orcid || "—"}</div>
              <div>
                <select
                  value={a.roleId}
                  onChange={(e) => changeRole(a.email, e.target.value)}
                >
                  {roles
                    .slice()
                    .sort((x, y) => x.rank - y.rank)
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.label}
                      </option>
                    ))}
                </select>
              </div>
              <div className="members-actions">
                <button className="btn small" onClick={() => startEdit(a)}>
                  Edit
                </button>
                <button
                  className="btn small ghost"
                  onClick={() => remove(a.email)}
                >
                  Remove
                </button>
              </div>
            </div>
          ),
        )}
        {allowlist.length === 0 && (
          <p className="block-sub">No members yet. Add one above.</p>
        )}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// RIGHT RAIL
//
// For the lead: queue, group health, urgent pokes, achievements, weekly digest.
// For non-lead: notifications, achievements, group health snapshot, weekly nudge.
// ────────────────────────────────────────────────────────────
function RightRail({
  role,
  isLead,
  pokes,
  notifs,
  achievements,
  weekly,
  user,
  onAck,
  onOpenTab,
}: {
  role: CustomRole;
  isLead: boolean;
  pokes: Poke[];
  notifs: Notification[];
  achievements: Achievement[];
  weekly: WeeklyUpdate[];
  user: User;
  onAck: (id: string, s: "ack" | "done") => void;
  onOpenTab: (t: Tab) => void;
}) {
  const showQueue = can(role, "queue", "view");
  const showHealth = can(role, "group_health", "view");
  const myPending = pokes.filter(
    (p) => p.toEmail === user.email && p.status !== "done",
  );
  const recentAchievements = achievements.slice(0, 3);
  const myWeekly = weekly.find(
    (w) => w.authorEmail === user.email && w.weekOf === currentMondayISO(),
  );
  const unread = notifs.filter((n) => !n.read).slice(0, 4);

  return (
    <aside className="right-rail">
      {/* Pokes addressed to me */}
      {myPending.length > 0 && (
        <RailSection title="Pokes awaiting you" badge={myPending.length}>
          <div className="rail-pokes">
            {myPending.slice(0, 3).map((p) => (
              <div key={p.id} className={`rail-poke urg-${p.urgency}`}>
                <span className={`urg-tag urg-${p.urgency}`}>
                  {urgencyLabel[p.urgency]}
                </span>
                <p>{p.question}</p>
                <div className="rail-poke-foot">
                  <span>{authorName(p.fromEmail)}</span>
                  {p.status === "pending" && (
                    <button
                      className="link-btn small"
                      onClick={() => onAck(p.id, "ack")}
                    >
                      ack
                    </button>
                  )}
                  {p.status === "ack" && (
                    <button
                      className="link-btn small"
                      onClick={() => onAck(p.id, "done")}
                    >
                      done
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </RailSection>
      )}

      {/* Notifications snapshot — shown to non-lead too */}
      {!isLead && unread.length > 0 && (
        <RailSection title="Recent notifications" badge={unread.length}>
          <div className="rail-notifs">
            {unread.map((n) => (
              <div key={n.id} className={`rail-notif kind-${n.kind}`}>
                <div className="rail-notif-title">{n.title}</div>
                <div className="rail-notif-body">{n.body}</div>
                <div className="rail-notif-when">{n.posted}</div>
              </div>
            ))}
          </div>
        </RailSection>
      )}

      {/* Recent achievements: visible to everyone */}
      {recentAchievements.length > 0 && (
        <RailSection title="Recent achievements">
          <div className="rail-achievements">
            {recentAchievements.map((a) => (
              <button
                key={a.id}
                className="rail-achievement"
                onClick={() => onOpenTab("achievements")}
              >
                <span className={`achievement-kind kind-${a.kind}`}>
                  {achievementKindLabel[a.kind]}
                </span>
                <strong>{a.title}</strong>
                <small>
                  {authorName(a.authorEmail)} · {a.posted}
                </small>
              </button>
            ))}
          </div>
        </RailSection>
      )}

      {/* Weekly nudge for everyone */}
      {!myWeekly && (
        <RailSection title="This week's update" extraClass="weekly-nudge">
          <p className="rail-hint">
            You haven't shared yours yet. A 60-second post helps your team.
          </p>
          <button
            className="btn small primary"
            onClick={() => onOpenTab("weekly")}
          >
            Share now
          </button>
        </RailSection>
      )}

      {/* Lead-only: review queue */}
      {showQueue && (
        <RailSection title="Review queue" badge={piQueue.length}>
          <p className="rail-hint">
            High-confidence + low-sensitivity items can be bulk-approved.
          </p>
          <div className="rail-queue">
            {piQueue.map((q) => (
              <div key={q.title} className="rail-queue-row">
                <div className="rail-queue-kind">{q.kind}</div>
                <div className="rail-queue-title">{q.title}</div>
                <div className="rail-queue-meta">
                  <span className={`sens sens-${q.sensitivity}`}>
                    {q.sensitivity}
                  </span>
                  <span className="conf">
                    {Math.round(q.confidence * 100)}%
                  </span>
                </div>
                <div className="rail-queue-actions">
                  {q.requiresReview ? (
                    <>
                      <button className="btn small primary">Approve</button>
                      <button className="btn small ghost">Reject</button>
                    </>
                  ) : (
                    <span className="auto-tag">auto</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </RailSection>
      )}

      {/* Group health: lead-only by default; non-leads still see a soft snapshot */}
      {showHealth ? (
        <RailSection title="Group health">
          <div className="rail-health">
            {groupHealth.map((h) => (
              <div
                key={h.metric}
                className={`rail-health-card health-${h.state}`}
              >
                <div className="health-metric">{h.metric}</div>
                <div className="health-value">{h.value}</div>
                <div className="health-trend">{h.trend}</div>
              </div>
            ))}
          </div>
        </RailSection>
      ) : (
        <RailSection title="Team pulse">
          <div className="rail-health">
            {groupHealth
              .filter((h) => h.state !== "warn")
              .slice(0, 2)
              .map((h) => (
                <div
                  key={h.metric}
                  className={`rail-health-card health-${h.state}`}
                >
                  <div className="health-metric">{h.metric}</div>
                  <div className="health-value">{h.value}</div>
                  <div className="health-trend">{h.trend}</div>
                </div>
              ))}
          </div>
        </RailSection>
      )}
    </aside>
  );
}

// Collapsible right-rail section. Defaults to expanded; click the header
// to collapse. Persists nothing — collapse state is per-render.
function RailSection({
  title,
  badge,
  extraClass,
  children,
  defaultOpen = true,
}: {
  title: string;
  badge?: number;
  extraClass?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section
      className={`rail-block ${extraClass ?? ""} ${open ? "open" : "closed"}`}
    >
      <button
        className="rail-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="rail-chev">{open ? "▾" : "▸"}</span>
        <h4>{title}</h4>
        {typeof badge === "number" && badge > 0 && (
          <span className="rail-badge">{badge}</span>
        )}
      </button>
      {open && <div className="rail-content">{children}</div>}
    </section>
  );
}

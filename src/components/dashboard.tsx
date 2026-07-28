import {
  ArrowUpRight,
  Bot,
  CalendarDays,
  CheckCircle2,
  CircleDot,
  Clock3,
  Film,
  Layers3,
  LockKeyhole,
  MessageCircle,
  Mic2,
  MoreHorizontal,
  Search,
  Sparkles,
  TriangleAlert,
  Video
} from "lucide-react";
import { CopyButton } from "./copy-button";
import type {
  CampaignSnapshot,
  CriticVerdict,
  PromptPackage,
  TrendIdea
} from "@/lib/types";

const steps = [
  { id: "research", label: "Research", match: ["researching"] },
  { id: "selection", label: "Select", match: ["awaiting_idea"] },
  { id: "direction", label: "Direct", match: ["directing", "awaiting_generation"] },
  { id: "review", label: "Review", match: ["evaluating", "awaiting_regeneration_approval"] },
  { id: "publish", label: "Publish", match: ["approved"] }
];

function activeStep(status: string): number {
  const found = steps.findIndex((step) => step.match.includes(status));
  return found < 0 ? 0 : found;
}

function formatLabel(format: string): string {
  return format.replaceAll("_", " ");
}

function IdeaCard({
  idea,
  selected
}: {
  idea: TrendIdea;
  selected: boolean;
}) {
  return (
    <article className={`idea-card ${selected ? "idea-card-selected" : ""}`}>
      <header>
        <div className="idea-rank">0{idea.rank}</div>
        <div className="idea-tags">
          <span>{formatLabel(idea.format)}</span>
          <span>{idea.platform}</span>
        </div>
      </header>
      <div>
        <h3>{idea.concept}</h3>
        <p className="idea-hook">“{idea.hook}”</p>
        <p className="idea-relevance">{idea.auraRelevance}</p>
      </div>
      <footer>
        <span>
          <Clock3 size={13} /> {idea.shelfLife}
        </span>
        <span className={`risk risk-${idea.generationRisk}`}>{idea.generationRisk} risk</span>
        <span>{idea.higgsfieldNeeded ? "Higgsfield" : "No credits"}</span>
      </footer>
    </article>
  );
}

function PromptPanel({ prompt }: { prompt: PromptPackage }) {
  return (
    <section className="studio-card prompt-card">
      <div className="card-heading">
        <div>
          <p className="eyebrow">Prompt Director · v{prompt.version}</p>
          <h2>{prompt.finalConcept}</h2>
        </div>
        <CopyButton value={prompt.higgsfieldPrompt} label="Copy prompt" />
      </div>
      <div className="script-strip">
        <Mic2 size={17} />
        <p>{prompt.spokenScript}</p>
        <span>{prompt.durationSeconds}s</span>
      </div>
      <div className="prompt-layout">
        <div className="prompt-main">
          <p className="section-label">Exact Higgsfield prompt</p>
          <p className="prompt-copy">{prompt.higgsfieldPrompt}</p>
          <p className="section-label">Shot plan</p>
          <div className="shot-list">
            {prompt.shots.map((shot) => (
              <div className="shot" key={`${shot.startSecond}-${shot.endSecond}`}>
                <span>
                  {shot.startSecond}-{shot.endSecond}s
                </span>
                <div>
                  <strong>{shot.camera}</strong>
                  <p>{shot.visual}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <aside className="prompt-aside">
          <p className="section-label">Locked attributes</p>
          <div className="lock-list">
            {Object.entries(prompt.lockedAttributes)
              .slice(0, 7)
              .map(([key, value]) => (
                <div key={key}>
                  <LockKeyhole size={13} />
                  <span>
                    <small>{formatLabel(key)}</small>
                    {Array.isArray(value) ? value.join(", ") : value}
                  </span>
                </div>
              ))}
          </div>
          <p className="section-label">Failure watch</p>
          <ul className="failure-list">
            {prompt.failurePoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </aside>
      </div>
    </section>
  );
}

function CriticBadge({ verdict }: { verdict: CriticVerdict }) {
  const positive = verdict === "APPROVE" || verdict === "APPROVE_WITH_MINOR_ISSUES";
  return (
    <span className={`critic-badge ${positive ? "critic-good" : "critic-warning"}`}>
      {positive ? <CheckCircle2 size={15} /> : <TriangleAlert size={15} />}
      {formatLabel(verdict).toUpperCase()}
    </span>
  );
}

export function Dashboard({ snapshot }: { snapshot: CampaignSnapshot }) {
  const step = activeStep(snapshot.status);
  return (
    <main className="db-app">
      <aside className="sidebar">
        <div className="brand-lockup">
          <span className="aura-mark">A</span>
          <span>Aura <small>Content Studio</small></span>
        </div>
        <nav className="side-nav" aria-label="Studio sections">
          <a href="#campaign" className="active"><CircleDot size={18} /> Today</a>
          <a href="#ideas"><Search size={18} /> Trend desk</a>
          <a href="#direction"><Sparkles size={18} /> Direction</a>
          <a href="#review"><Film size={18} /> Review room</a>
          <a href="#history"><Layers3 size={18} /> Attempts</a>
          <a href="#conversation"><MessageCircle size={18} /> Conversation</a>
        </nav>
        <div className="sidebar-bottom">
          <div className="system-status">
            <span className="signal-dot" />
            <div>
              <strong>Orchestrator online</strong>
              <small>Telegram connected</small>
            </div>
          </div>
          <form action="/api/auth/logout" method="post">
            <button className="logout-button" type="submit">Lock studio</button>
          </form>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar" id="campaign">
          <div>
            <p className="eyebrow">
              <CalendarDays size={13} /> Campaign {snapshot.campaignDate}
            </p>
            <h1>Today’s campaign desk</h1>
          </div>
          <div className="topbar-actions">
            <span className="private-pill"><LockKeyhole size={13} /> Private</span>
            <button className="icon-button" type="button" aria-label="More options">
              <MoreHorizontal size={19} />
            </button>
          </div>
        </header>

        <div className="content-scroll">
          <section className="campaign-hero">
            <div className="campaign-title">
              <div>
                <p className="eyebrow">Current state</p>
                <h2>{snapshot.currentStep}</h2>
              </div>
              <span className={`status-pill status-${snapshot.status}`}>
                <span />
                {formatLabel(snapshot.status)}
              </span>
            </div>
            <div className="workflow-track">
              {steps.map((item, index) => (
                <div
                  key={item.id}
                  className={`workflow-step ${index <= step ? "done" : ""} ${
                    index === step ? "current" : ""
                  }`}
                >
                  <span>{index < step ? "✓" : index + 1}</span>
                  <small>{item.label}</small>
                </div>
              ))}
              <div className="workflow-line">
                <span style={{ width: `${(step / (steps.length - 1)) * 100}%` }} />
              </div>
            </div>
          </section>

          <section id="ideas" className="section-block">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Trend Scout</p>
                <h2>Three angles for today</h2>
              </div>
              <a className="text-link" href="#conversation">
                See research notes <ArrowUpRight size={14} />
              </a>
            </div>
            <div className="ideas-grid">
              {snapshot.ideas.map((idea) => (
                <IdeaCard
                  key={idea.id ?? idea.rank}
                  idea={idea}
                  selected={idea.id === snapshot.selectedIdea?.id}
                />
              ))}
            </div>
          </section>

          {snapshot.prompt ? (
            <div id="direction">
              <PromptPanel prompt={snapshot.prompt} />
            </div>
          ) : null}

          <section className="review-grid" id="review">
            <div className="studio-card media-card">
              <div className="card-heading compact">
                <div>
                  <p className="eyebrow">Latest upload</p>
                  <h2>Generation preview</h2>
                </div>
                <Video size={19} />
              </div>
              {snapshot.upload ? (
                <video controls preload="metadata" src={snapshot.upload.mediaUrl}>
                  <track kind="captions" />
                </video>
              ) : (
                <div className="video-empty">
                  <div><Film size={26} /></div>
                  <strong>Waiting for your upload</strong>
                  <p>Generate manually in Higgsfield, then send the video to the Telegram bot.</p>
                </div>
              )}
              <div className="media-meta">
                <span>{snapshot.upload?.fileName ?? "No file yet"}</span>
                <span>Private storage</span>
              </div>
            </div>

            <div className="studio-card critic-card">
              <div className="card-heading compact">
                <div>
                  <p className="eyebrow">Gemini Critic</p>
                  <h2>Credit-conscious verdict</h2>
                </div>
                <Bot size={19} />
              </div>
              {snapshot.evaluation ? (
                <>
                  <CriticBadge verdict={snapshot.evaluation.verdict} />
                  <p className="critic-summary">{snapshot.evaluation.summary}</p>
                  <div className="issue-list">
                    {snapshot.evaluation.issues.slice(0, 3).map((issue) => (
                      <div key={`${issue.timestamp}-${issue.problem}`}>
                        <span>{issue.timestamp}</span>
                        <p><strong>{formatLabel(issue.category)}</strong>{issue.problem}</p>
                      </div>
                    ))}
                  </div>
                  <div className="credit-call">
                    <Sparkles size={15} />
                    <p>{snapshot.evaluation.creditRecommendation}</p>
                  </div>
                </>
              ) : (
                <div className="critic-empty">
                  <div className="critic-radar"><span /></div>
                  <p>
                    The critic activates after a video upload and checks both picture and
                    sound against the locked direction.
                  </p>
                </div>
              )}
            </div>
          </section>

          <section className="lower-grid">
            <div className="studio-card attempts-card" id="history">
              <div className="card-heading compact">
                <div>
                  <p className="eyebrow">Version trail</p>
                  <h2>Attempts and revisions</h2>
                </div>
                <span className="count-pill">{snapshot.attempts.length}</span>
              </div>
              <div className="attempt-list">
                {snapshot.attempts.map((attempt) => (
                  <div key={attempt.version}>
                    <span className={attempt.status === "Current" ? "current" : ""}>
                      v{attempt.version}
                    </span>
                    <div>
                      <strong>{attempt.label}</strong>
                      <small>{new Date(attempt.createdAt).toLocaleString()}</small>
                    </div>
                    <em>{attempt.status}</em>
                  </div>
                ))}
              </div>
            </div>

            <div className="studio-card conversation-card" id="conversation">
              <div className="card-heading compact">
                <div>
                  <p className="eyebrow">Orchestrator</p>
                  <h2>Telegram conversation</h2>
                </div>
                <MessageCircle size={19} />
              </div>
              <div className="message-list">
                {snapshot.messages.slice(-6).map((message, index) => (
                  <div
                    key={message.id ?? `${message.createdAt}-${index}`}
                    className={`message message-${message.direction}`}
                  >
                    <span>{message.direction === "inbound" ? "You" : "Aura Studio"}</span>
                    <p>{message.text}</p>
                    <small>
                      {new Date(message.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </small>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <footer className="dashboard-footer">
            <span>Aura Content Studio</span>
            <span>Windows desktop content only</span>
          </footer>
        </div>
      </section>
    </main>
  );
}

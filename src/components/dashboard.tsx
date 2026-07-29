import {
  Bot,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Film,
  LockKeyhole,
  MessageCircle,
  Mic2,
  Sparkles,
  TriangleAlert,
  Video
} from "lucide-react";
import { CopyButton } from "./copy-button";
import { DashboardChat } from "./dashboard-chat";
import { ManualResearchButton } from "./manual-research-button";
import { VideoUpload } from "./video-upload";
import type {
  CampaignDayLog,
  CampaignSnapshot,
  CriticVerdict,
  PromptPackage,
  TrendIdea,
  WorkflowRunLog
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
        <div className="source-list">
          {idea.sources.map((source) => (
            <a href={source.url} key={source.url} target="_blank" rel="noreferrer">
              <strong>{source.title}</strong>
              <span>{source.note}</span>
              {source.publishedAt ? <small>{source.publishedAt}</small> : null}
            </a>
          ))}
        </div>
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

function RunList({ runs }: { runs: WorkflowRunLog[] }) {
  if (!runs.length) return <p className="empty-copy">No workflow runs were recorded.</p>;
  return (
    <div className="run-list">
      {runs.map((run) => (
        <div key={run.id}>
          <span className={`run-status run-${run.status}`}>{run.status}</span>
          <div>
            <strong>{formatLabel(run.eventType)}</strong>
            <small>{new Date(run.claimedAt).toLocaleString()}</small>
            {run.error ? <p>{run.error}</p> : null}
          </div>
        </div>
      ))}
    </div>
  );
}

function DayLog({ day, current }: { day: CampaignDayLog; current: boolean }) {
  return (
    <details className="day-log" open={current}>
      <summary>
        <span>{day.campaignDate}</span>
        <strong>{day.currentStep}</strong>
        <em className={`run-status run-${day.status === "failed" ? "failed" : "completed"}`}>
          {formatLabel(day.status)}
        </em>
        <small>
          {day.ideas.length} ideas · {day.prompts.length} prompt versions · {day.workflowRuns.length} runs
        </small>
      </summary>
      <div className="day-log-body">
        {day.error ? <p className="error-banner">{day.error}</p> : null}
        <section>
          <p className="section-label">Workflow execution</p>
          <RunList runs={day.workflowRuns} />
        </section>
        <section>
          <p className="section-label">Research and source evidence</p>
          {day.ideas.length ? (
            <div className="ideas-grid">
              {day.ideas.map((idea) => (
                <IdeaCard key={idea.id ?? idea.rank} idea={idea} selected={false} />
              ))}
            </div>
          ) : (
            <p className="empty-copy">No research ideas were saved for this run.</p>
          )}
        </section>
        <section>
          <p className="section-label">Finalized prompt versions</p>
          {day.prompts.length ? (
            <div className="archived-prompts">
              {day.prompts.map((prompt) => (
                <PromptPanel key={prompt.id ?? prompt.version} prompt={prompt} />
              ))}
            </div>
          ) : (
            <p className="empty-copy">No prompt reached the finalized state.</p>
          )}
        </section>
        <section>
          <p className="section-label">Conversation and Telegram delivery</p>
          {day.messages.length ? (
            <div className="message-list">
              {day.messages.map((message, index) => (
                <div
                  key={message.id ?? `${message.createdAt}-${index}`}
                  className={`message message-${message.direction}`}
                >
                  <span>{message.source}</span>
                  <p>{message.text}</p>
                  <small>
                    {new Date(message.createdAt).toLocaleString()}
                    {message.telegramMessageId
                      ? ` · Telegram #${message.telegramMessageId}`
                      : ""}
                  </small>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-copy">No conversation was recorded for this day.</p>
          )}
        </section>
      </div>
    </details>
  );
}

function PromptPanel({ prompt }: { prompt: PromptPackage }) {
  const currentFormat =
    prompt.clips.length === 3 &&
    prompt.clips.every(
      (clip, index) =>
        clip.clipNumber === index + 1 &&
        clip.durationSeconds >= 10 &&
        clip.durationSeconds <= 12
    );
  return (
    <section className="studio-card prompt-card">
      <div className="card-heading">
        <div>
          <p className="eyebrow">Prompt Director · v{prompt.version}</p>
          <h2>{prompt.finalConcept}</h2>
        </div>
        <CopyButton value={prompt.higgsfieldPrompt} label="Copy all 3 prompts" />
      </div>
      <div className="prompt-summary">
        <span>3 separate clips</span>
        <span>
          {currentFormat
            ? "10 to 12 seconds each"
            : "Legacy prompt: regenerate for the current 10 to 12 second format"}
        </span>
        <span>{prompt.durationSeconds}s total</span>
      </div>
      <div className="prompt-layout">
        <div className="prompt-main">
          <div className="clip-list">
            {prompt.clips.map((clip) => (
              <article className="clip-prompt" key={clip.clipNumber}>
                <div className="clip-heading">
                  <div>
                    <p className="section-label">Clip {clip.clipNumber} · {clip.durationSeconds}s</p>
                    <h3>{clip.purpose}</h3>
                  </div>
                  <CopyButton value={clip.higgsfieldPrompt} label={`Copy clip ${clip.clipNumber}`} />
                </div>
                <div className="script-strip">
                  <Mic2 size={17} />
                  <p>{clip.spokenScript}</p>
                  <span>
                    {clip.wordCount} words · about {clip.estimatedSpokenSeconds}s spoken
                  </span>
                </div>
                <p className="section-label">Exact Higgsfield prompt</p>
                <p className="prompt-copy">{clip.higgsfieldPrompt}</p>
                <div className="continuity-row">
                  <div>
                    <small>Starts from</small>
                    <p>{clip.continuityIn}</p>
                  </div>
                  <div>
                    <small>Hands off to next clip</small>
                    <p>{clip.continuityOut}</p>
                  </div>
                </div>
                <p className="section-label">Shot plan</p>
                <div className="shot-list">
                  {clip.shots.map((shot) => (
                    <div className="shot" key={`${clip.clipNumber}-${shot.startSecond}-${shot.endSecond}`}>
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
              </article>
            ))}
          </div>
        </div>
        <aside className="prompt-aside">
          <p className="section-label">Fixed structure</p>
          <div className="lock-list">
            <div>
              <LockKeyhole size={13} />
              <span>
                <small>Clip count</small>
                {prompt.lockedAttributes.clipCount} clips
              </span>
            </div>
          </div>
          <p className="section-label">Continuity method</p>
          <p className="aside-note">
            Export each clip&apos;s final frame and use it as the next clip&apos;s start
            frame when the selected Higgsfield model supports frame references.
          </p>
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
  const dailyRun = snapshot.workflowRuns.find((run) => run.eventType === "daily");
  return (
    <main className="db-app">
      <section className="workspace">
        <header className="topbar">
          <div className="brand-lockup">
            <span className="aura-mark">A</span>
            <span>Aura <small>Content Studio</small></span>
          </div>
          <div>
            <p className="eyebrow">
              <CalendarDays size={13} /> Campaign {snapshot.campaignDate}
            </p>
            <h1>Research and production log</h1>
          </div>
          <form action="/api/auth/logout" method="post">
            <button className="logout-button" type="submit">Sign out</button>
          </form>
        </header>

        <div className="content-scroll">
          {snapshot.dataSource === "demo" ? (
            <p className="error-banner">
              Demo data is showing because no live campaign database is available.
            </p>
          ) : null}

          <section className="operations-grid">
            <article className="operation-card">
              <p className="section-label">Today’s cron</p>
              <strong>{dailyRun ? formatLabel(dailyRun.status) : "Not recorded"}</strong>
              <small>
                {dailyRun
                  ? new Date(dailyRun.claimedAt).toLocaleString()
                  : "No daily workflow run exists for this campaign"}
              </small>
              {dailyRun?.error ? <p>{dailyRun.error}</p> : null}
              <ManualResearchButton />
            </article>
            <article className="operation-card">
              <p className="section-label">Telegram delivery</p>
              <strong>{snapshot.telegramDeliveryCount} delivered messages</strong>
              <small>
                {snapshot.lastTelegramDeliveryAt
                  ? `Last delivery ${new Date(snapshot.lastTelegramDeliveryAt).toLocaleString()}`
                  : "No successful Telegram delivery recorded"}
              </small>
            </article>
            <article className="operation-card">
              <p className="section-label">Saved artifacts</p>
              <strong>
                {snapshot.ideas.length} ideas · {snapshot.promptVersions.length} prompts
              </strong>
              <small>{snapshot.days.length} campaign days available in the log</small>
            </article>
          </section>

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

          <section className="studio-card conversation-card">
            <div className="card-heading compact">
              <div>
                <p className="eyebrow">Two-way orchestrator</p>
                <h2>Chat from the dashboard or Telegram</h2>
              </div>
              <MessageCircle size={19} />
            </div>
            <div className="message-list">
              {snapshot.messages.length ? (
                snapshot.messages.map((message, index) => (
                  <div
                    key={message.id ?? `${message.createdAt}-${index}`}
                    className={`message message-${message.direction}`}
                  >
                    <span>
                      {message.direction === "inbound" ? "You" : "Aura Studio"} ·{" "}
                      {message.source}
                    </span>
                    <p>{message.text}</p>
                    <small>
                      {new Date(message.createdAt).toLocaleString()}
                      {message.telegramMessageId
                        ? ` · Telegram #${message.telegramMessageId}`
                        : ""}
                    </small>
                  </div>
                ))
              ) : (
                <p className="empty-copy">No conversation has been recorded yet.</p>
              )}
            </div>
            <DashboardChat />
          </section>

          <section className="section-block">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Trend Scout</p>
                <h2>Today’s research, sources, and three angles</h2>
              </div>
            </div>
            {snapshot.ideas.length ? (
              <div className="ideas-grid">
                {snapshot.ideas.map((idea) => (
                  <IdeaCard
                    key={idea.id ?? idea.rank}
                    idea={idea}
                    selected={idea.id === snapshot.selectedIdea?.id}
                  />
                ))}
              </div>
            ) : (
              <div className="studio-card empty-state">
                <strong>No research was finalized today.</strong>
                <p>
                  {dailyRun?.error ??
                    "The daily workflow has not produced research ideas yet. Use the chat above to run research."}
                </p>
              </div>
            )}
          </section>

          {snapshot.prompt ? (
            <div>
              <PromptPanel prompt={snapshot.prompt} />
            </div>
          ) : (
            <section className="studio-card empty-state">
              <p className="eyebrow">Prompt Director</p>
              <strong>No finalized prompt exists for today.</strong>
              <p>Research must complete and an idea must be selected before the three prompts are generated.</p>
            </section>
          )}

          <section className="review-grid">
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
                  <strong>Upload your finished cut</strong>
                  <p>Generate manually in Higgsfield, blend the three clips, then upload the video here.</p>
                </div>
              )}
              <VideoUpload />
              <div className="media-meta">
                <span>{snapshot.upload?.fileName ?? "No file yet"}</span>
                <span>Authenticated media</span>
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

          <section className="studio-card log-explorer">
            <div className="card-heading">
              <div>
                <p className="eyebrow">Daily archive</p>
                <h2>Research, workflow runs, and finalized prompts</h2>
              </div>
              <span className="count-pill">{snapshot.days.length} days</span>
            </div>
            <div className="day-list">
              {snapshot.days.map((day, index) => (
                <DayLog key={day.id} day={day} current={index === 0} />
              ))}
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

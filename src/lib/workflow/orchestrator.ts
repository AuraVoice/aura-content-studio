import {
  Command,
  END,
  START,
  StateGraph,
  interrupt,
  type BaseCheckpointSaver
} from "@langchain/langgraph";
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import { env } from "@/lib/env";
import {
  getLatestPrompt,
  listIdeas,
  listRecentHooks,
  saveEvaluation,
  savePrompt,
  saveTrendIdeas,
  updateCampaign
} from "@/lib/repository";
import { geminiCriticSubgraph, promptDirectorSubgraph, trendScoutSubgraph } from "./specialists";
import { describeWorkflowFailure } from "./errors";
import { WorkflowState, type WorkflowValue } from "./state";
import type { TrendIdea } from "@/lib/types";

let postgresSaver: PostgresSaver | undefined;
let postgresSetup: Promise<void> | undefined;

async function checkpointer(): Promise<BaseCheckpointSaver> {
  if (!postgresSaver) {
    postgresSaver = PostgresSaver.fromConnString(env().DATABASE_URL, {
      schema: "langgraph"
    });
    postgresSetup = postgresSaver.setup();
  }
  await postgresSetup;
  return postgresSaver;
}

function formatIdeaList(ideas: TrendIdea[]): string {
  return [
    "Today’s three Aura Desktop ideas:",
    ...ideas.map(
      (idea) =>
        `\n${idea.rank}. ${idea.concept}\nHook: ${idea.hook}\nFormat: ${idea.format.replaceAll("_", " ")} on ${idea.platform}\nWhy now: ${idea.auraRelevance}\nShelf life: ${idea.shelfLife}\nHiggsfield: ${idea.higgsfieldNeeded ? "yes" : "no"} | Risk: ${idea.generationRisk}\nSources: ${idea.sources.map((source) => source.url).join(", ")}`
    ),
    "\nReply with 1, 2, or 3. You can also say “make today’s post a meme” or “skip today.”"
  ].join("\n");
}

function formatPrompt(state: WorkflowValue): string {
  const prompt = state.promptPackage;
  if (!prompt) return "The prompt could not be prepared.";
  return [
    `Direction v${prompt.version}: ${prompt.finalConcept}`,
    `Hook: ${prompt.hook}`,
    `Structure: 3 separate clips, ${prompt.durationSeconds}s total`,
    `Recommended model: ${prompt.recommendedModel}`,
    "",
    ...prompt.clips.flatMap(
      (clip) => [
        `CLIP ${clip.clipNumber} | ${clip.durationSeconds}s | ${clip.wordCount} words | about ${clip.estimatedSpokenSeconds}s spoken`,
        clip.purpose,
        `Dialogue: ${clip.spokenScript}`,
        `Continuity in: ${clip.continuityIn}`,
        `Continuity out: ${clip.continuityOut}`,
        "Exact Higgsfield prompt:",
        clip.higgsfieldPrompt,
        ""
      ]
    ),
    "Negative constraints:",
    prompt.negativeConstraints.map((item) => `• ${item}`).join("\n"),
    "",
    "Fixed structure: 3 clips. No casting, wardrobe, location, lighting, script, or duration attributes are locked.",
    "",
    "Generate manually in Higgsfield. Export each clip's final frame and use it as the next clip's start frame when the selected model supports it. Blend the three clips, then upload the finished cut in the dashboard or send it to Telegram. Aura Content Studio will never spend a generation credit for you."
  ].join("\n");
}

function formatEvaluation(state: WorkflowValue): string {
  const evaluation = state.evaluation;
  if (!evaluation) return "The video evaluation could not be completed.";
  return [
    `Gemini Critic: ${evaluation.verdict}`,
    evaluation.summary,
    "",
    ...evaluation.issues.map(
      (issue) =>
        `${issue.timestamp} | ${issue.category} | ${issue.severity}\n${issue.problem}\nFix: ${issue.remedy}`
    ),
    "",
    `Credit call: ${evaluation.creditRecommendation}`,
    evaluation.cheaperFixes.length
      ? `Cheaper fixes first: ${evaluation.cheaperFixes.join("; ")}`
      : "No cheaper edit is needed."
  ].join("\n");
}

function selectIdea(response: string, ideas: TrendIdea[]) {
  const value = response.toLowerCase().trim();
  if (/\b(skip|cancel)\b/.test(value)) return { decision: "skip" as const };
  if (value.includes("meme")) {
    const meme = ideas.find((idea) => idea.format === "x_meme");
    return meme
      ? { decision: "selected" as const, selectedIdea: meme }
      : {
          decision: "research" as const,
          ownerInstruction: "Make today’s post a meme. Return a credible X meme idea."
        };
  }
  const rank = Number(value.match(/\b([1-3])\b/)?.[1] ?? (value === "approve" ? "1" : "0"));
  const selected = ideas.find((idea) => idea.rank === rank);
  return selected
    ? { decision: "selected" as const, selectedIdea: selected }
    : { decision: "research" as const };
}

export async function createOrchestrator(customCheckpointer?: BaseCheckpointSaver) {
  const saver = customCheckpointer ?? (await checkpointer());

  const graph = new StateGraph(WorkflowState)
    .addNode("route_event", async (state) => {
      if (/\bcancel\b/i.test(state.ownerInstruction)) {
        return { route: "cancel" as const };
      }
      if (state.eventType === "daily") return { route: "research" as const };
      if (state.eventType === "video_uploaded") return { route: "critic" as const };
      if (state.eventType === "instruction") return { route: "direct" as const };
      return { route: "noop" as const };
    })
    .addNode("run_trend_scout", async (state) => {
      try {
        const result = await trendScoutSubgraph.invoke({
          instruction: state.ownerInstruction
        });
        const ideas = await saveTrendIdeas(state.campaignId, result.ideas, state.runVersion);
        if (!ideas.length) return { stale: true, status: "cancelled" };
        const current = await updateCampaign(
          state.campaignId,
          { status: "awaiting_idea", current_step: "Waiting for idea selection" },
          state.runVersion
        );
        if (!current) return { stale: true, status: "cancelled" };
        return {
          ideas,
          status: "awaiting_idea",
          outboundMessages: [formatIdeaList(ideas)]
        };
      } catch (error) {
        const failure = describeWorkflowFailure(error);
        return {
          status: "failed",
          error: failure.technicalDetail
        };
      }
    })
    .addNode("handle_research_failure", async (state) => {
      const failure = describeWorkflowFailure(new Error(state.error));
      await updateCampaign(
        state.campaignId,
        {
          status: "failed",
          current_step: "Research failed",
          error: failure.message
        },
        state.runVersion
      );
      return {
        status: "failed",
        outboundMessages: [
          `Aura research failed before any ideas were saved.\n\n${failure.message}\n\nOpen the dashboard run details for the recorded cause, then retry research.`
        ]
      };
    })
    .addNode("request_idea_approval", (state) => {
      const response = interrupt({
        kind: "idea_selection",
        message: formatIdeaList(state.ideas),
        choices: state.ideas.map((idea) => ({ rank: idea.rank, concept: idea.concept }))
      }) as string;
      return { humanResponse: String(response) };
    })
    .addNode("resolve_idea", (state) => selectIdea(state.humanResponse, state.ideas))
    .addNode("mark_skipped", async (state) => {
      await updateCampaign(
        state.campaignId,
        { status: "skipped", current_step: "Skipped by owner" },
        state.runVersion
      );
      return { status: "skipped", outboundMessages: ["Today is skipped. No credits used."] };
    })
    .addNode("load_direction_context", async (state) => {
      const ideas = state.ideas.length ? state.ideas : await listIdeas(state.campaignId);
      const previous = await getLatestPrompt(state.campaignId);
      const selectedIdea =
        state.selectedIdea ??
        ideas.find((idea) => idea.id === (state as WorkflowValue).selectedIdea?.id) ??
        ideas[0];
      if (!selectedIdea) throw new Error("No trend idea is available for Prompt Director");
      return {
        ideas,
        selectedIdea,
        promptPackage: previous ?? undefined,
        status: "directing"
      };
    })
    .addNode("run_prompt_director", async (state) => {
      if (!state.selectedIdea) throw new Error("Prompt Director needs a selected idea");
      await updateCampaign(
        state.campaignId,
        {
          status: "directing",
          current_step: state.promptPackage ? "Revising direction" : "Building direction",
          selected_idea_id: state.selectedIdea.id
        },
        state.runVersion
      );
      const recentHooks = await listRecentHooks();
      const result = await promptDirectorSubgraph.invoke({
        idea: state.selectedIdea,
        instruction: state.ownerInstruction,
        previous: state.promptPackage,
        recentHooks,
        requiredRevision: state.evaluation?.regenerateOnly ?? []
      });
      if (!result.promptPackage) throw new Error("Prompt Director returned no package");
      const saved = await savePrompt(
        state.campaignId,
        state.selectedIdea.id,
        result.promptPackage,
        state.ownerInstruction || undefined,
        state.runVersion
      );
      if (!saved) return { stale: true, status: "cancelled" };
      await updateCampaign(
        state.campaignId,
        {
          status: "awaiting_generation",
          current_step: "Waiting for manual Higgsfield generation"
        },
        state.runVersion
      );
      return {
        promptPackage: saved,
        status: "awaiting_generation",
        outboundMessages: [formatPrompt({ ...state, promptPackage: saved })]
      };
    })
    .addNode("run_gemini_critic", async (state) => {
      const prompt = state.promptPackage ?? (await getLatestPrompt(state.campaignId));
      if (!prompt || !state.uploadId) throw new Error("Critic needs an upload and prompt");
      await updateCampaign(
        state.campaignId,
        { status: "evaluating", current_step: "Gemini Critic is reviewing the video" },
        state.runVersion
      );
      const result = await geminiCriticSubgraph.invoke({
        uploadId: state.uploadId,
        promptPackage: prompt,
        platform: state.selectedIdea?.platform ?? "short-form social"
      });
      if (!result.evaluation) throw new Error("Gemini Critic returned no evaluation");
      const current = await updateCampaign(
        state.campaignId,
        {
          status:
            result.evaluation.verdict === "APPROVE" ||
            result.evaluation.verdict === "APPROVE_WITH_MINOR_ISSUES"
              ? "approved"
              : result.evaluation.verdict === "SURGICAL_REGENERATION"
                ? "awaiting_regeneration_approval"
                : "failed",
          current_step: `Critic verdict: ${result.evaluation.verdict}`
        },
        state.runVersion
      );
      if (!current) return { stale: true, status: "cancelled" };
      await saveEvaluation(
        state.campaignId,
        state.uploadId,
        prompt.version,
        result.evaluation
      );
      return {
        promptPackage: prompt,
        evaluation: result.evaluation,
        status:
          result.evaluation.verdict === "SURGICAL_REGENERATION"
            ? "awaiting_regeneration_approval"
            : "approved",
        outboundMessages: [formatEvaluation({ ...state, evaluation: result.evaluation })]
      };
    })
    .addNode("request_regeneration_approval", (state) => {
      const response = interrupt({
        kind: "paid_regeneration_approval",
        message:
          "Gemini found a material issue. Approve one more manual Higgsfield generation? Reply approve or reject. Nothing will be generated automatically.",
        regenerateOnly: state.evaluation?.regenerateOnly ?? [],
        lockedAttributes: state.evaluation?.lockedAttributesToPreserve ?? []
      }) as string;
      return { humanResponse: String(response) };
    })
    .addNode("resolve_regeneration", (state) => {
      const approved = /\b(approve|yes|go ahead)\b/i.test(state.humanResponse);
      return new Command({
        goto: approved ? "load_direction_context" : "finish_without_regeneration",
        update: approved
          ? {
              ownerInstruction: `Surgical revision only: ${state.evaluation?.regenerateOnly.join("; ")}`,
              outboundMessages: []
            }
          : {}
      });
    }, { ends: ["load_direction_context", "finish_without_regeneration"] })
    .addNode("finish_without_regeneration", async (state) => {
      await updateCampaign(
        state.campaignId,
        {
          status: "approved",
          current_step: "Accepted without another paid generation"
        },
        state.runVersion
      );
      return {
        status: "approved",
        outboundMessages: [
          "No regeneration approved. Keep the current result and use the suggested edit fixes."
        ]
      };
    })
    .addNode("cancel_campaign", async (state) => {
      await updateCampaign(state.campaignId, {
        status: "cancelled",
        current_step: "Cancelled by owner",
        run_version: state.runVersion + 1,
        cancelled_at: new Date().toISOString()
      });
      return { status: "cancelled", stale: true, outboundMessages: ["Campaign cancelled."] };
    })
    .addNode("noop", () => ({ outboundMessages: ["I’m ready for an instruction."] }))
    .addEdge(START, "route_event")
    .addConditionalEdges("route_event", (state) => state.route, {
      research: "run_trend_scout",
      direct: "load_direction_context",
      critic: "run_gemini_critic",
      cancel: "cancel_campaign",
      noop: "noop"
    })
    .addConditionalEdges(
      "run_trend_scout",
      (state) => (state.status === "failed" ? "failed" : "ready"),
      {
        failed: "handle_research_failure",
        ready: "request_idea_approval"
      }
    )
    .addEdge("handle_research_failure", END)
    .addEdge("request_idea_approval", "resolve_idea")
    .addConditionalEdges("resolve_idea", (state) => state.decision, {
      selected: "run_prompt_director",
      research: "run_trend_scout",
      skip: "mark_skipped",
      none: "request_idea_approval"
    })
    .addEdge("load_direction_context", "run_prompt_director")
    .addEdge("run_prompt_director", END)
    .addConditionalEdges(
      "run_gemini_critic",
      (state) =>
        state.evaluation?.verdict === "SURGICAL_REGENERATION" ? "approval" : "done",
      {
        approval: "request_regeneration_approval",
        done: END
      }
    )
    .addEdge("request_regeneration_approval", "resolve_regeneration")
    .addEdge("mark_skipped", END)
    .addEdge("finish_without_regeneration", END)
    .addEdge("cancel_campaign", END)
    .addEdge("noop", END);

  return graph.compile({ checkpointer: saver });
}

export type CampaignStatus =
  | "researching"
  | "awaiting_idea"
  | "directing"
  | "awaiting_generation"
  | "evaluating"
  | "awaiting_regeneration_approval"
  | "approved"
  | "skipped"
  | "cancelled"
  | "failed";

export type ContentFormat =
  | "ugc_video"
  | "product_demo"
  | "screen_recording"
  | "x_meme"
  | "screenshot"
  | "comparison_image"
  | "mixed";

export interface TrendSource {
  title: string;
  url: string;
  publishedAt?: string;
  note: string;
}

export interface TrendIdea {
  id?: string;
  rank: 1 | 2 | 3;
  concept: string;
  hook: string;
  format: ContentFormat;
  platform: "X" | "TikTok" | "Instagram Reels" | "YouTube Shorts" | "LinkedIn";
  auraRelevance: string;
  sources: TrendSource[];
  shelfLife: "24 hours" | "3 days" | "1 week" | "evergreen";
  higgsfieldNeeded: boolean;
  generationRisk: "low" | "medium" | "high";
  riskReason: string;
}

export interface Shot {
  startSecond: number;
  endSecond: number;
  visual: string;
  dialogue: string;
  camera: string;
  overlay?: string;
}

export interface ClipPrompt {
  clipNumber: 1 | 2 | 3;
  purpose: string;
  durationSeconds: number;
  spokenScript: string;
  estimatedSpokenSeconds: number;
  wordCount: number;
  higgsfieldPrompt: string;
  continuityIn: string;
  continuityOut: string;
  shots: Shot[];
}

export interface LockedAttributes {
  clipCount: 3;
}

export interface PromptPackage {
  id?: string;
  version: number;
  finalConcept: string;
  hook: string;
  spokenScript: string;
  clips: ClipPrompt[];
  higgsfieldPrompt: string;
  negativeConstraints: string[];
  durationSeconds: number;
  recommendedModel: string;
  failurePoints: string[];
  lockedAttributes: LockedAttributes;
  validation: {
    estimatedSpokenSeconds: number;
    dialogueFits: boolean;
    cameraExplicit: boolean;
    contradictions: string[];
    repeatedHook: boolean;
  };
}

export type CriticVerdict =
  | "APPROVE"
  | "APPROVE_WITH_MINOR_ISSUES"
  | "SURGICAL_REGENERATION"
  | "ABANDON";

export interface CriticIssue {
  timestamp: string;
  severity: "minor" | "material" | "fatal";
  category:
    | "hook"
    | "realism"
    | "camera"
    | "framing"
    | "pacing"
    | "speech"
    | "lip_sync"
    | "consistency"
    | "product_accuracy"
    | "clipped_dialogue"
    | "artifact"
    | "platform";
  problem: string;
  remedy: string;
}

export interface CriticEvaluation {
  verdict: CriticVerdict;
  summary: string;
  issues: CriticIssue[];
  creditRecommendation: string;
  worthAnotherGeneration: boolean;
  cheaperFixes: string[];
  regenerateOnly: string[];
  lockedAttributesToPreserve: string[];
}

export interface StudioMessage {
  id?: string;
  direction: "inbound" | "outbound" | "system";
  source: "telegram" | "dashboard" | "orchestrator";
  text: string;
  createdAt: string;
}

export interface CampaignSnapshot {
  id: string;
  campaignDate: string;
  status: CampaignStatus;
  currentStep: string;
  runVersion: number;
  ideas: TrendIdea[];
  selectedIdea?: TrendIdea;
  prompt?: PromptPackage;
  upload?: {
    id: string;
    fileName: string;
    mediaUrl: string;
    createdAt: string;
  };
  evaluation?: CriticEvaluation;
  attempts: Array<{
    version: number;
    label: string;
    status: string;
    createdAt: string;
  }>;
  messages: StudioMessage[];
}

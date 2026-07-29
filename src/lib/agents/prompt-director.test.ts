import { describe, expect, it } from "vitest";
import { applyLocks, estimateSpeech } from "./prompt-director";
import type { PromptPackage } from "@/lib/types";

const previous: PromptPackage = {
  version: 1,
  finalConcept: "Original concept",
  hook: "Original hook",
  spokenScript:
    "Original spoken line 1. Original spoken line 2. Original spoken line 3.",
  clips: [1, 2, 3].map((clipNumber) => ({
    clipNumber: clipNumber as 1 | 2 | 3,
    purpose: `Original purpose ${clipNumber}`,
    durationSeconds: 10,
    spokenScript: `Original spoken line ${clipNumber}.`,
    estimatedSpokenSeconds: 3,
    wordCount: 4,
    higgsfieldPrompt: `Original production prompt ${clipNumber}`,
    continuityIn: `Original entrance ${clipNumber}`,
    continuityOut: `Original exit ${clipNumber}`,
    shots: [
      {
        startSecond: 0,
        endSecond: 10,
        visual: "Original actor in the original room",
        dialogue: `Original dialogue ${clipNumber}`,
        camera: "Original eye-level medium shot",
        overlay: "Original overlay"
      }
    ]
  })),
  higgsfieldPrompt: "Original production prompts",
  negativeConstraints: ["Original constraint"],
  durationSeconds: 30,
  recommendedModel: "Original model",
  failurePoints: ["Original failure"],
  lockedAttributes: {
    clipCount: 3
  },
  validation: {
    estimatedSpokenSeconds: 9,
    dialogueFits: true,
    cameraExplicit: true,
    contradictions: [],
    repeatedHook: false
  }
};

const draft: PromptPackage = {
  ...previous,
  finalConcept: "Drifted concept",
  hook: "Drifted hook",
  spokenScript: "Drifted script",
  clips: previous.clips.map((clip) => ({
    ...clip,
    purpose: "Drifted purpose",
    spokenScript: "Drifted dialogue",
    higgsfieldPrompt: "Drifted production prompt",
    shots: [
      {
        startSecond: 0,
        endSecond: 10,
        visual: "Drifted actor and room",
        dialogue: "Drifted dialogue",
        camera: "New low-angle 35 mm locked shot",
        overlay: "Drifted overlay"
      }
    ]
  })),
  negativeConstraints: ["Drifted constraint"],
  recommendedModel: "Drifted model",
  failurePoints: ["Drifted failure"]
};

describe("Prompt Director invariants", () => {
  it("preserves every non-camera field for a camera-only revision", () => {
    const revised = applyLocks(draft, previous, "change only the camera angle");
    expect(revised.clips).toHaveLength(3);
    expect(revised.clips[0].shots[0].camera).toBe("New low-angle 35 mm locked shot");
    expect(revised.clips[0].shots[0].visual).toBe(previous.clips[0].shots[0].visual);
    expect(revised.clips[0].shots[0].dialogue).toBe(previous.clips[0].shots[0].dialogue);
    expect(revised.clips[0].shots[0].overlay).toBe(previous.clips[0].shots[0].overlay);
    expect(revised.clips[0].spokenScript).toBe(previous.clips[0].spokenScript);
    expect(revised.spokenScript).toBe(previous.spokenScript);
    expect(revised.lockedAttributes).toEqual(previous.lockedAttributes);
    expect(revised.negativeConstraints).toEqual(previous.negativeConstraints);
    expect(revised.recommendedModel).toBe(previous.recommendedModel);
  });

  it("estimates speech at a natural short-form pace", () => {
    expect(estimateSpeech("one two three four five")).toBe(3);
  });

  it("keeps only the three-clip structure locked", () => {
    const revised = applyLocks(draft, previous, "make it more conversational");
    expect(revised.lockedAttributes).toEqual({ clipCount: 3 });
    expect(Object.keys(revised.lockedAttributes)).toEqual(["clipCount"]);
  });

  it("preserves every clip field for a hook-only revision", () => {
    const revised = applyLocks(draft, previous, "change only the hook");
    expect(revised.hook).toBe(draft.hook);
    expect(revised.clips).toEqual(previous.clips);
    expect(revised.finalConcept).toBe(previous.finalConcept);
    expect(revised.negativeConstraints).toEqual(previous.negativeConstraints);
  });

  it("changes dialogue without drifting the visual direction", () => {
    const revised = applyLocks(draft, previous, "change only the dialogue");
    expect(revised.clips[0].spokenScript).toBe("Drifted dialogue");
    expect(revised.clips[0].shots[0].dialogue).toBe("Drifted dialogue");
    expect(revised.clips[0].shots[0].visual).toBe(
      previous.clips[0].shots[0].visual
    );
    expect(revised.clips[0].shots[0].camera).toBe(
      previous.clips[0].shots[0].camera
    );
    expect(revised.hook).toBe(previous.hook);
  });
});

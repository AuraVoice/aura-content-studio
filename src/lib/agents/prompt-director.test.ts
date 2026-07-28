import { describe, expect, it } from "vitest";
import { applyLocks, estimateSpeech } from "./prompt-director";
import type { PromptPackage } from "@/lib/types";

const previous: PromptPackage = {
  version: 1,
  finalConcept: "Original concept",
  hook: "Original hook",
  spokenScript: "Original spoken script remains exactly the same.",
  shots: [
    {
      startSecond: 0,
      endSecond: 10,
      visual: "Original actor in the original room",
      dialogue: "Original dialogue",
      camera: "Original eye-level medium shot",
      overlay: "Original overlay"
    }
  ],
  higgsfieldPrompt: "Original production prompt",
  negativeConstraints: ["Original constraint"],
  durationSeconds: 10,
  recommendedModel: "Original model",
  failurePoints: ["Original failure"],
  lockedAttributes: {
    actor: "Original actor",
    clothing: "Original clothing",
    environment: "Original room",
    lighting: "Original light",
    durationSeconds: 10,
    spokenScript: "Original spoken script remains exactly the same.",
    productClaims: ["Original supported claim"]
  },
  validation: {
    estimatedSpokenSeconds: 4,
    dialogueFits: true,
    cameraExplicit: true,
    contradictions: [],
    repeatedHook: false
  }
};

const draft = {
  ...previous,
  finalConcept: "Drifted concept",
  hook: "Drifted hook",
  spokenScript: "Drifted script",
  shots: [
    {
      startSecond: 0,
      endSecond: 10,
      visual: "Drifted actor and room",
      dialogue: "Drifted dialogue",
      camera: "New low-angle 35 mm locked shot",
      overlay: "Drifted overlay"
    }
  ],
  negativeConstraints: ["Drifted constraint"],
  recommendedModel: "Drifted model",
  failurePoints: ["Drifted failure"],
  lockedAttributes: {
    ...previous.lockedAttributes,
    actor: "Drifted actor",
    clothing: "Drifted clothing",
    environment: "Drifted room",
    lighting: "Drifted light"
  }
};

describe("Prompt Director invariants", () => {
  it("preserves every non-camera field for a camera-only revision", () => {
    const revised = applyLocks(draft, previous, "change only the camera angle");
    expect(revised.shots[0].camera).toBe("New low-angle 35 mm locked shot");
    expect(revised.shots[0].visual).toBe(previous.shots[0].visual);
    expect(revised.shots[0].dialogue).toBe(previous.shots[0].dialogue);
    expect(revised.shots[0].overlay).toBe(previous.shots[0].overlay);
    expect(revised.spokenScript).toBe(previous.spokenScript);
    expect(revised.lockedAttributes).toEqual(previous.lockedAttributes);
    expect(revised.negativeConstraints).toEqual(previous.negativeConstraints);
    expect(revised.recommendedModel).toBe(previous.recommendedModel);
  });

  it("estimates speech at a natural short-form pace", () => {
    expect(estimateSpeech("one two three four five")).toBe(3);
  });

  it("locks the prior actor when the owner says use the same actor", () => {
    const revised = applyLocks(draft, previous, "use the same actor");
    expect(revised.lockedAttributes.actor).toBe(previous.lockedAttributes.actor);
  });
});

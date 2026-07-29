import type { CampaignSnapshot } from "@/lib/types";

export const demoSnapshot: CampaignSnapshot = {
  dataSource: "demo",
  id: "demo-campaign",
  campaignDate: new Date().toISOString().slice(0, 10),
  status: "awaiting_generation",
  currentStep: "Prompt ready for manual Higgsfield generation",
  runVersion: 2,
  ideas: [
    {
      id: "idea-1",
      rank: 1,
      concept: "The tab-switching tax",
      hook: "POV: you stopped opening a chatbot every 90 seconds",
      format: "screen_recording",
      platform: "X",
      auraRelevance: "Shows the global shortcut and lightweight Windows overlay in context.",
      sources: [
        {
          title: "Windows productivity conversation",
          url: "https://auravoiceapp.com",
          note: "Product source"
        }
      ],
      shelfLife: "1 week",
      higgsfieldNeeded: false,
      generationRisk: "low",
      riskReason: "A real screen recording is more credible than generated UI."
    },
    {
      id: "idea-2",
      rank: 2,
      concept: "Can you point to it?",
      hook: "When the tutorial says click the setting but you cannot find the setting",
      format: "ugc_video",
      platform: "Instagram Reels",
      auraRelevance: "Demonstrates screen-aware visual guidance without claiming computer control.",
      sources: [],
      shelfLife: "evergreen",
      higgsfieldNeeded: true,
      generationRisk: "medium",
      riskReason: "Generated desktop details and pointing alignment can drift."
    },
    {
      id: "idea-3",
      rank: 3,
      concept: "Make it warmer",
      hook: "The email is correct. It just does not sound like you.",
      format: "product_demo",
      platform: "LinkedIn",
      auraRelevance: "Shows conversational draft refinement inside the desktop overlay.",
      sources: [],
      shelfLife: "evergreen",
      higgsfieldNeeded: false,
      generationRisk: "low",
      riskReason: "Use captured product UI and a voiceover."
    }
  ],
  selectedIdea: undefined,
  prompt: {
    version: 3,
    finalConcept: "A creator keeps her momentum with Aura Desktop wherever work happens.",
    hook: "POV: you stopped opening a chatbot every 90 seconds",
    spokenScript:
      "Every tiny question used to pull me out of whatever I was doing. Now I press one shortcut and ask Aura without leaving work. With screen access on, it can understand what I'm looking at. I stay in the moment, finish the thought, and get back to the part I actually care about.",
    clips: [
      {
        clipNumber: 1,
        purpose: "Hook with the familiar interruption problem",
        durationSeconds: 10,
        spokenScript:
          "Every tiny question used to pull me out of whatever I was doing.",
        estimatedSpokenSeconds: 6,
        wordCount: 12,
        continuityIn: "Begin mid-motion as the creator crosses into a bright living room.",
        continuityOut:
          "She raises her Windows laptop into frame and turns toward the couch, ending on the motion.",
        higgsfieldPrompt:
          "10-second vertical 9:16 cinematic UGC clip with native dialogue. An adult white blonde woman in her late twenties, striking and confident, wears a fitted black sleeveless top in a bright modern living room. Start at shoulder height from a three-quarter angle on a 35 mm lens as she walks into frame holding a Windows laptop. Use a subtle handheld lateral track, natural daylight, realistic skin and cloth movement. She looks to camera and says exactly: “Every tiny question used to pull me out of whatever I was doing.” End as she raises the laptop and turns toward the couch so the final frame can start clip 2. No generated interface text, no captions, no phone, no macOS.",
        shots: [
          {
            startSecond: 0,
            endSecond: 10,
            visual:
              "Creator walks into a bright living room with a Windows laptop and turns toward the couch.",
            dialogue:
              "Every tiny question used to pull me out of whatever I was doing.",
            camera:
              "35 mm, shoulder-height three-quarter angle, subtle handheld lateral track"
          }
        ]
      },
      {
        clipNumber: 2,
        purpose: "Demonstrate the shortcut and screen-aware help",
        durationSeconds: 11,
        spokenScript:
          "Now I press one shortcut and ask Aura without leaving work. With screen access on, it can understand what I'm looking at.",
        estimatedSpokenSeconds: 9,
        wordCount: 20,
        continuityIn:
          "Use clip 1's exported final frame as the start frame. Continue the same turn toward the couch.",
        continuityOut:
          "She settles onto the couch, looks up from the laptop, and begins a small knowing smile.",
        higgsfieldPrompt:
          "11-second vertical 9:16 cinematic UGC clip with native dialogue. Use clip 1’s exported final frame as the start-frame reference. Continue the same adult white blonde woman in her late twenties, fitted black sleeveless top, Windows laptop, living room, daylight direction, and body motion. Begin on the matched turn toward the couch. Ease into a gentle 50 mm push-in at seated eye level as she presses a keyboard shortcut. Keep the Aura overlay abstract and compositing-safe. She says exactly: “Now I press one shortcut and ask Aura without leaving work. With screen access on, it can understand what I'm looking at.” End as she looks up and begins a small knowing smile for clip 3. No fabricated controls, no autonomous clicking, no captions, no macOS.",
        shots: [
          {
            startSecond: 0,
            endSecond: 11,
            visual:
              "Matched turn into sitting on the couch, then one keyboard shortcut with an abstract Aura overlay.",
            dialogue:
              "Now I press one shortcut and ask Aura without leaving work. With screen access on, it can understand what I'm looking at.",
            camera:
              "50 mm, seated eye level, gentle motivated push-in from a three-quarter angle"
          }
        ]
      },
      {
        clipNumber: 3,
        purpose: "Deliver the payoff and emotional benefit",
        durationSeconds: 11,
        spokenScript:
          "I stay in the moment, finish the thought, and get back to the part I actually care about.",
        estimatedSpokenSeconds: 8,
        wordCount: 18,
        continuityIn:
          "Use clip 2's exported final frame as the start frame and complete the same smile.",
        continuityOut:
          "Finish on a steady direct-to-camera look with the Windows laptop still naturally in frame.",
        higgsfieldPrompt:
          "11-second vertical 9:16 cinematic UGC clip with native dialogue. Use clip 2’s exported final frame as the start-frame reference. Continue the same adult white blonde woman in her late twenties, fitted black sleeveless top, couch position, Windows laptop, and natural daylight. Complete the smile from the prior frame. Use a 50 mm eye-level medium close-up with a very slow push-in and clean shallow depth of field. She says exactly: “I stay in the moment, finish the thought, and get back to the part I actually care about.” Let her return her gaze to the laptop after the final word. No captions, no invented interface text, no phone, no macOS."
        ,
        shots: [
          {
            startSecond: 0,
            endSecond: 11,
            visual:
              "Complete the matched smile, deliver the payoff to camera, then return naturally to the Windows laptop.",
            dialogue:
              "I stay in the moment, finish the thought, and get back to the part I actually care about.",
            camera:
              "50 mm eye-level medium close-up, very slow push-in, shallow depth of field"
          }
        ]
      }
    ],
    higgsfieldPrompt:
      "CLIP 1\n10-second vertical 9:16 cinematic UGC clip with native dialogue. An adult white blonde woman in her late twenties, striking and confident, wears a fitted black sleeveless top in a bright modern living room. Start at shoulder height from a three-quarter angle on a 35 mm lens as she walks into frame holding a Windows laptop. Use a subtle handheld lateral track, natural daylight, realistic skin and cloth movement. She looks to camera and says exactly: “Every tiny question used to pull me out of whatever I was doing.” End as she raises the laptop and turns toward the couch so the final frame can start clip 2. No generated interface text, no captions, no phone, no macOS.\n\nCLIP 2\nUse clip 1's final frame as the start frame and continue the matched action. Show the shortcut and an abstract Aura overlay without fabricated text.\n\nCLIP 3\nUse clip 2's final frame as the start frame and complete the creator's matched smile before the payoff.",
    negativeConstraints: [
      "No phone",
      "No macOS interface",
      "No autonomous clicking",
      "No unreadable generated product text"
    ],
    durationSeconds: 32,
    recommendedModel:
      "Higgsfield video model with native dialogue, start-frame references, character consistency, and controlled camera motion",
    failurePoints: [
      "identity or wardrobe drift between clips",
      "mismatched hand or laptop position at transitions",
      "overlay text artifacts"
    ],
    lockedAttributes: {
      clipCount: 3
    },
    validation: {
      estimatedSpokenSeconds: 23,
      dialogueFits: true,
      cameraExplicit: true,
      contradictions: [],
      repeatedHook: false
    }
  },
  promptVersions: [],
  workflowRuns: [
    {
      id: "demo-run",
      eventType: "daily",
      status: "completed",
      claimedAt: new Date(Date.now() - 72e5).toISOString(),
      completedAt: new Date(Date.now() - 71e5).toISOString()
    }
  ],
  days: [],
  telegramDeliveryCount: 1,
  lastTelegramDeliveryAt: new Date(Date.now() - 36e5).toISOString(),
  attempts: [
    {
      version: 2,
      label: "Camera angle revision",
      status: "Current",
      createdAt: new Date().toISOString()
    },
    {
      version: 1,
      label: "Initial direction",
      status: "Superseded",
      createdAt: new Date(Date.now() - 36e5).toISOString()
    }
  ],
  messages: [
    {
      direction: "outbound",
      source: "orchestrator",
      text: "I found three angles for today. Idea 1 saves a Higgsfield credit and gives us the strongest product proof.",
      createdAt: new Date(Date.now() - 72e5).toISOString()
    },
    {
      direction: "inbound",
      source: "telegram",
      text: "Use idea 1. Keep the same actor and change only the camera angle.",
      createdAt: new Date(Date.now() - 54e5).toISOString()
    },
    {
      direction: "outbound",
      source: "orchestrator",
      text: "Done. The package now has three separate clips with matched-motion handoffs. Only the three-clip structure is fixed.",
      createdAt: new Date(Date.now() - 36e5).toISOString()
    }
  ]
};

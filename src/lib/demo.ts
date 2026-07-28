import type { CampaignSnapshot } from "@/lib/types";

export const demoSnapshot: CampaignSnapshot = {
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
    version: 2,
    finalConcept: "A creator breaks the tab-switching loop with Aura Desktop.",
    hook: "POV: you stopped opening a chatbot every 90 seconds",
    spokenScript:
      "I used to lose my train of thought every time I needed help. Now I press one shortcut, ask Aura about what is on my screen, and keep moving.",
    shots: [
      {
        startSecond: 0,
        endSecond: 3,
        visual: "Tight profile at a Windows desk, hand hovering over Alt+Tab.",
        dialogue: "I used to lose my train of thought",
        camera: "35 mm locked medium close-up, eye level"
      },
      {
        startSecond: 3,
        endSecond: 9,
        visual: "Over-shoulder Windows screen with Aura overlay entering.",
        dialogue: "every time I needed help. Now I press one shortcut",
        camera: "50 mm over-shoulder, screen readable"
      },
      {
        startSecond: 9,
        endSecond: 15,
        visual: "Return to creator, still working without changing tabs.",
        dialogue: "ask Aura about what is on my screen, and keep moving.",
        camera: "35 mm locked medium close-up, same eyeline"
      }
    ],
    higgsfieldPrompt:
      "15-second natural UGC video. One creator at a Windows 11 desk uses a lightweight always-on-top Aura companion overlay after a keyboard shortcut. Keep the interface abstract and do not fabricate controls.",
    negativeConstraints: [
      "No phone",
      "No macOS interface",
      "No autonomous clicking",
      "No unreadable generated product text"
    ],
    durationSeconds: 15,
    recommendedModel: "Higgsfield model with strongest dialogue consistency",
    failurePoints: ["Windows UI drift", "slow speaking pace", "overlay text artifacts"],
    lockedAttributes: {
      actor: "South Asian woman, late twenties, shoulder-length dark hair",
      clothing: "soft rust crewneck",
      environment: "small daylight home office with a Windows laptop",
      lighting: "soft window light from camera left",
      durationSeconds: 15,
      spokenScript:
        "I used to lose my train of thought every time I needed help. Now I press one shortcut, ask Aura about what is on my screen, and keep moving.",
      productClaims: ["global shortcut", "screen-aware help when enabled", "always-on-top overlay"]
    },
    validation: {
      estimatedSpokenSeconds: 13,
      dialogueFits: true,
      cameraExplicit: true,
      contradictions: [],
      repeatedHook: false
    }
  },
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
      text: "Done. Actor, script, clothing, room, lighting, and duration are locked. Only the camera plan changed.",
      createdAt: new Date(Date.now() - 36e5).toISOString()
    }
  ]
};

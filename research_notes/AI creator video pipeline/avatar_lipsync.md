# Avatar and lip-sync stage: AI talking-head clones and lip-sync tools (state as of 31 Oct 2026)

Method note for the report writer: every finding below came from web search result extracts gathered on 2026-10-31 (that is the "date seen" for all prices). Direct page fetches failed for help.heygen.com, realtimeavatar.ai and sync.so because those hosts are not on this session's network allowlist, so no pricing page was read in full. Every price and limit should be re-checked on the live vendor page before budgeting. Many "comparison" sources are vendor-owned or affiliate blogs; that is flagged where it matters. Workload used for cost math: 30 videos x 30 to 90 s = 15 to 45 output minutes per month (900 to 2,700 s), before retries.

## 1. HeyGen (Digital Twin, Instant Avatar, Avatar IV, Avatar V): training input, API, 9:16, duration, render time, price, gestures, custom audio

### Takeaway
HeyGen is the most complete backend option found: a documented v3 API (`POST /v3/videos`) that takes either script plus voice or an uploaded audio file (length follows the audio, up to 30 min), an ElevenLabs engine option, `motion_prompt` and `expressiveness` controls for gestures on Avatar IV, and a newer Avatar V twin model (launched April 2026) trained from about 15 s of footage. API output for a digital twin costs roughly $3 to $5 per minute from a prepaid wallet that is separate from web plans, but published rate tables conflict.

### Cited Findings
Training footage and consent
- API "Create Digital Twin" request needs a public URL to an MP4, minimum 720p, at least 30 s, H.264 preferred; footage should be well-lit, stable, with clear speech. ([HeyGen API reference: Create Digital Twin](https://docs.heygen.com/reference/submit-video-avatar-creation-request.md))
- Developer guide says longer footage with varied natural speech gives better results; about 2 minutes at 1080p gives the best twin quality. ([HeyGen docs: Video to Avatar](https://developers.heygen.com/docs/avatar-from-video))
- Marketing and third-party posts quote about 15 s minimum footage instead of 30 s; the API doc figure (30 s) is the one to design around. ([MindStudio on Avatar V](https://www.mindstudio.ai/blog/what-is-heygen-avatar-v-digital-twin-explained); [HeyGen API reference](https://docs.heygen.com/reference/submit-video-avatar-creation-request.md))
- Avatar V: HeyGen's page says a digital twin can be created from a 15-second video with consistent identity and voice in 175+ languages; HeyGen's blog places launch in April 2026, and one review dates it to April 8, 2026. ([HeyGen Avatar V page](https://www.heygen.com/avatars/avatar-v); [HeyGen blog: Photo vs Digital Twin vs Avatar V](https://www.heygen.com/blog/photo-avatar-vs-digital-twin-vs-avatar-v-vs-instant-avatar); [Kompozy review](https://kompozy.io/reviews/heygen-social-media-avatars))
- Consent: the API takes a public URL to a consent statement video; it must show the same person as the training footage and be recorded and submitted at the same time; screen recordings of the statement are rejected; another person can record their own consent remotely via QR code. Help center says under 30 s, developer docs say under 35 s. ([HeyGen docs: Avatar Consent](https://developers.heygen.com/docs/avatar-consent); [HeyGen help: Recording your Consent Video](https://help.heygen.com/en/articles/12092609-recording-your-consent-video))
- Conflict: developer guide says Enterprise workspaces can upload a pre-recorded consent video or have the step waived; help center says every video-based twin needs a consent video. ([HeyGen docs: Avatar Consent](https://developers.heygen.com/docs/avatar-consent); [HeyGen help center](https://help.heygen.com/en/articles/12092609-recording-your-consent-video))
- Training time: "usually completes within a few minutes" per HeyGen developer guide versus 2 to 4 hours in a third-party FAQ. ([HeyGen docs: Video to Avatar](https://developers.heygen.com/docs/avatar-from-video); [Flowith FAQ](https://flowith.io/blog/heygen-faq-custom-avatar-api-limits-commercial-rights/))
- Older HeyGen docs page states Digital Twin via API is Enterprise-only and consumes 2x credits; this page appears to predate Avatar V and may be outdated. ([HeyGen docs: Digital Twin](https://docs.heygen.com/docs/video-avatars-api))

API endpoints, audio input, duration
- Current docs: `POST /v3/videos`; for audio-driven video, `audio_url` or `audio_asset_id` replaces `script`, and length follows the audio up to 30 minutes. `audio_asset_id` comes from `POST /v3/assets` (MP3 or WAV, max 32 MB) and is mutually exclusive with `audio_url`. ([HeyGen docs: Audio to Video](https://developers.heygen.com/audio-to-video); [HeyGen docs: Create Video](https://developers.heygen.com/reference/create-video))
- The v3 create-video reference shows `engine_type: "elevenlabs"` with optional `engine_settings` (stability, similarity), i.e. HeyGen can drive ElevenLabs voices itself, or you can upload pre-rendered ElevenLabs audio. ([HeyGen docs: Create Video](https://developers.heygen.com/reference/create-video))
- Developer forum reports (older API versions): `audio_asset_id` appeared to have no effect on v4 output and the API still demanded `script` and `voice_id`; a 404 on the v1 `video/generate` path with a 9:16 `aspect_ratio` request. ([HeyGen docs forum thread](https://docs.heygen.com/discuss/67f693cca0b91d0068155a8b); [HeyGen docs forum list](https://docs.heygen.com/discuss?page=40&perPage=10))
- A forum post shows a `RESOLUTION_NOT_ALLOWED` error telling the user to upgrade plan for higher resolution output. ([HeyGen docs forum](https://docs.heygen.com/discuss?page=40&perPage=10))
- The separate "HeyGen Video" generative model (text/image to video) is limited to 5 to 30 s, and reference-to-video to 5 to 15 s; this is not the avatar path. ([HeyGen docs: HeyGen Video model](https://developers.heygen.com/docs/models/heygen-video))
- HeyGen also documents an MCP server and a Video Agent (prompt to video) API. ([HeyGen MCP overview](https://developers.heygen.com/mcp/overview); [HeyGen Video Agent docs](https://developers.heygen.com/docs/video-agent))
- Avatar V is also resold via fal.ai, WaveSpeed (REST endpoint for twin video from text or audio), Runware and Segmind; Segmind claims about 60 to 120 s generation (unverified). ([fal HeyGen Avatar](https://fal.ai/heygen-avatar); [WaveSpeed Avatar V](https://wavespeed.ai/models/heygen/avatar-v/digital-twin); [Runware Avatar V](https://runware.ai/docs/models/heygen-avatar-v); [Segmind Avatar V](https://www.segmind.com/models/heygen-avatar-v))

Gesture and expression control
- v2 Avatar IV docs: `custom_motion_prompt` plus `enhance_custom_motion_prompt: true` to let the model refine the motion. ([HeyGen docs: Create Video with Avatar IV](https://docs.heygen.com/docs/create-avatar-iv-videos))
- v3: `motion_prompt` (body motion and hand gestures) and `expressiveness` (high / medium / low), Avatar IV only. A changelog entry says both are not supported when `engine.type` is `avatar_v`, while the v3 Digital Twin guide says `motion_prompt` works on Avatar IV and Avatar V. These HeyGen sources conflict. ([HeyGen changelog](https://developers.heygen.com/changelog); [HeyGen docs: Digital Twin guide](https://developers.heygen.com/generate-avatar-video))
- Third-party prompt examples: "calm, minimal hand movements; occasional nods"; "natural head motion, subtle hand gestures, accurate lip sync". ([Runware Avatar IV](https://runware.ai/docs/models/heygen-avatar-iv); [Segmind Avatar IV](https://www.segmind.com/models/heygen-avatar-iv))

Pricing and plans
- HeyGen help center Avatar IV guide (via search extract): 1 minute of Avatar IV via API costs about $4 at 1080p; 4K requests are accepted but are upscaled 1080p and billed at the 1080p rate. ([HeyGen help: Avatar IV complete guide](https://help.heygen.com/en/articles/11269603-heygen-avatar-iv-complete-guide))
- Third-party rate tables: Avatar IV photo avatar $3/min at 720p/1080p, $4/min at 4K; Avatar IV digital twin or studio avatar $4/min at 720p/1080p, $5/min at 4K; per-second billing at $0.05/s ($3/min) quoted. ([eesel](https://www.eesel.ai/blog/heygen-pricing); [Spatius](https://www.spatius.ai/blog/heygen-pricing-2026/); [Sume](https://www.sume.com/guides/heygen-api-pricing))
- A later-dated 2026 guide citing a September 2026 update lists Avatar IV photo avatar at $2.31/min and digital twin or studio avatar at $4.83/min; a second source repeats $4.83. Which page carries these could not be confirmed because fetches were blocked; candidates in the result set were [Realtime Avatar Blog](https://realtimeavatar.ai/blog/heygen-api-pricing-explained) and [DIYAI](https://diyai.io/ai-tools/video-generation/heygen-pricing/).
- API billing is pay-as-you-go from a prepaid dollar wallet (from $5), separate from web plans; from February 2026 HeyGen stopped giving free API credits. ([Sume](https://www.sume.com/guides/heygen-api-pricing); [Anam](https://anam.ai/blog/heygen-pricing))
- Web subscription credits do not work with the API; API credits expire 12 months after purchase. ([HeyGen help: API pricing explained](https://help.heygen.com/en/articles/10060327-heygen-api-pricing-explained))
- Web plan entry is about $29/month. ([Techsy](https://techsy.io/en/blog/best-ai-avatar-generators-2026); [Omid Saffari](https://omidsaffari.com/blog/heygen-pricing); [HeyGen pricing](https://www.heygen.com/pricing))

Render time and concurrency
- HeyGen help: each 1 minute of video usually takes about 10 minutes to generate (often faster for Avatar Studio videos); regular (non-priority) queue "just under 24h on average during weekdays"; API pay-as-you-go concurrency limit 10. ([HeyGen help: Video Processing Times](https://help.heygen.com/en/articles/9655503-heygen-video-processing-times))
- HeyGen Video Agent API docs: processing typically 5x to 10x final video length; Enterprise gets priority queue. ([HeyGen Video Agent docs](https://developers.heygen.com/docs/video-agent))

### Inferences
- Data flow that fits an API-only pipeline: ElevenLabs TTS (custom voice) produces MP3, then `POST /v3/assets` returns `audio_asset_id`, then `POST /v3/videos` with the twin `avatar_id`, `audio_asset_id`, `motion_prompt`, portrait dimensions, then poll or webhook, then download MP4. Uploading your own audio keeps the voice stage independent of HeyGen.
- Cost at 15 to 45 min/month: $3/min gives $45 to $135; $4/min gives $60 to $180; $4.83/min gives $72 to $217. With a 1.5x retry factor for rejected takes, budget roughly $70 to $330/month.
- Render latency of 5x to 10x real time means a 90 s clip takes about 8 to 15 min; fine for an async LangGraph node that waits on a webhook, and the 10-job concurrency limit is far above 30 videos/month.
- Because gesture control on Avatar V is contradicted between the changelog and guide, the pipeline should test both Avatar IV (known `motion_prompt` support) and Avatar V on the same audio before locking an engine.

### Gaps
- Could not confirm from an official page that 1080x1920 (9:16) output is allowed on pay-as-you-go API (only a forum 9:16 request and a plan-gated resolution error were found).
- Could not read the live HeyGen API rate table (help.heygen.com fetch blocked); $3, $4, $4.83 and $2.31 per minute figures all appear in sources.
- Avatar V first-party API price: one comparison page reported $0.05/s ($3/min) billed from the USD wallet, but it could not be attributed to an official HeyGen page.
- Whether digital twin creation via API is still Enterprise-only in late 2026 is unresolved (old doc says yes; newer developer docs describe it without that restriction).

## 2. Other avatar platforms (Captions/Mirage, Argil, Hedra, Synthesia, Tavus, D-ID, Akool, Creatify, Higgsfield): same questions, and which have a backend API

### Takeaway
Documented backend APIs exist for Captions/Mirage (Mirage Avatar X, $0.15/s), Argil (moments-based `POST /v1/videos` with per-moment `gestureSlug` and `audioUrl`), Hedra (Character-3, about $0.05/s at 720p), Synthesia (Creator plan and up, but only Express-1 / Studio avatars work via API), Tavus (Phoenix-4.5 replicas), D-ID, Akool and Creatify (Aurora, credit-based). Higgsfield Speak has no confirmed first-party public API and, separately, this repo's rules forbid any implementation that spends a Higgsfield credit, so it is out for an automated stage.

### Cited Findings
Captions / Mirage (Mirage Avatar X, AI Creator, AI Twin)
- Mirage Avatar X: "expressive human video generation model (video/image + audio to video)", $0.15 per second billed in 6-second increments (a 10.2 s video bills as 12 s). ([Captions help: API pricing](https://captions.ai/help/docs/api/pricing); [Mirage help: API pricing](https://help.mirage.app/docs/api/pricing))
- Conflict: a blog says Mirage's pricing page lists Avatar X at $0.175/s, and that fal charges 71% more per second than buying direct. ([Novoads](https://novoads.ai/en/blog/mirage-avatar-x-fal-pricing))
- Auth via `x-api-key` header; official Go wrapper exists. ([Mirage API reference](https://captions.ai/help/api-reference/api); [go-mirage-api](https://github.com/mirage-ai-com/go-mirage-api))
- A third-party API catalog lists the "AI Creator API" (talking-head generation) at 1 credit per second and a Mirage-branded API as beta; may be outdated. ([API Evangelist: captions-ai](https://github.com/api-evangelist/captions-ai))
- AI Twin training input: Captions says Mirage Avatar X needs only 10 seconds of footage. ([Captions: Create an AI Twin](https://captions.ai/features/create-ai-twin))
- Review signal: AI Twin "good enough for a quick social clip, less so for a polished 30-second spokesperson piece"; Captions twins described as "digital-looking" next to HeyGen. ([Fahim AI: HeyGen vs Captions](https://www.fahimai.com/heygen-vs-captions-ai); [Fliki: HeyGen alternatives](https://fliki.ai/blog/heygen-alternatives))
- Captions positions itself as a mobile-first social creator suite (captions, filler removal, eye-contact correction, now avatars). ([Techsy](https://techsy.io/en/blog/best-ai-avatar-generators-2026))

Argil
- API: `POST https://api.argil.ai/v1/videos`; a video is a set of "moments" (transcript or audio) mapped to an avatar and voice, with subtitles, aspect ratio, auto B-roll and background music, rendered async to MP4 (plus a subtitled version). Per-moment fields include `avatarId`, `transcript`, `audioUrl`, `voiceId`, `voiceModel`, `gestureSlug`; the example body also has `zoom` keyframes and a `broll` object. ([Argil API: Create a new Video](https://docs.argil.ai/api-reference/endpoint/videos.create))
- Available gestures are returned on the avatar object as "a list of labelized gestures available for your avatar". ([Argil API: Get an Avatar](https://docs.argil.ai/api-reference/endpoint/avatars.get); [Argil API: List avatars](https://docs.argil.ai/api-reference/endpoint/avatars.list))
- Video-based avatar creation is marked deprecated; docs say migrate to image-based creation; image avatars cost 2 credits; avatar becomes ready (status IDLE) within about 30 s. ([Argil API: Create Avatar from video](https://docs.argil.ai/api-reference/endpoint/avatars.create.video); [Argil API: Create Avatar](https://docs.argil.ai/api-reference/endpoint/avatars.create))
- Third-party: clone trained from a 2-minute recording; Argil will not create a clone without verification that the person uploaded their own footage. ([Traksource Argil review](https://traksource.com/argil-ai-review/); [AI Hunter review](https://ai-hunter.org/review-argil/))
- Plans (third-party, conflicting): Classic about $39/month (about $27 annual), 1 avatar, 25 min/month; Pro $149 for 100 minutes; Scale $499 (uncertain); outliers $29, $49, $9/week; sources disagree on which tier includes API. ([Techjockey](https://www.techjockey.com/us/detail/argil); [Toolchase](https://toolchase.com/tool/argil/); [Wireflow](https://www.wireflow.ai/blog/best-argil-ai-alternatives-in-2026); [Bityclips](https://bityclips.com/tool/argil))
- Positioning: "creator-clone specialist" whose avatar "gestures, moves, and cuts to B-roll like a TikTok native". ([Wireflow](https://www.wireflow.ai/blog/best-argil-ai-alternatives-in-2026); [Playcut](https://playcut.ai/blog/best-ai-avatar-generators-2026/))

Hedra (Character-3)
- API priced (per Character-3 model page as quoted by third parties) at 2.5 cents/s at 540p, 5 cents/s at 720p, 6.25 cents/s at 1080p; prepaid dollar wallet, no free tier. ([AdTestBench Hedra vs HeyGen](https://adtestbench.com/compare/hedra-vs-heygen/); [UGCGen Hedra pricing](https://ugcgen.ai/blog/hedra-pricing-cost-per-ugc-ad))
- Credits: about 6 credits/s at 720p is a community estimate, not vendor-published; plan prices conflict ($15 or $20 Basic, $50 to $75 Pro/Teams). ([DailyFix](https://dailyaifixs.com/blog/hedra-pricing-2026-credits-burn-by-the-second); [Usage Pricing](https://www.usagepricing.com/blueprint/hedra))
- Hedra needs only a single photo (image plus audio driven, not a trained video clone). ([Techsy](https://techsy.io/en/blog/best-ai-avatar-generators-2026))
- A cost matrix covers Character-3 and a newer "Omnia" model. ([Makefun cost matrix](https://makefun.ai/hedra-character-omnia-avatar-video-cost-matrix/))

Synthesia (personal avatars)
- Creator plan $89/month (about $64 to $67 annual), about 30 min video/month, 5 personal avatars (one table says unlimited), API on Creator and Enterprise only; overage $2 to $5/min and a $1,000/year studio avatar add-on reported by one or two sources. ([eesel Synthesia](https://www.eesel.ai/blog/synthesia-pricing); [Arcade](https://www.arcade.software/post/synthesia-pricing); [Velo](https://usevelo.ai/blog/synthesia-pricing/))
- Only Express-1-based avatars (Express-1 stock, legacy stock, custom Studio avatar) are compatible with the Synthesia API. ([Synthesia help: Which avatar type is right for me](https://help.synthesia.io/en/articles/15197011-which-avatar-type-is-right-for-me))
- Studio avatar footage: three recordings of 2 to 3 min speaking to camera, H.264 MP4 under 2 GB, 29.97 or 30 fps, 3840x2160 preferred, 1920x1080 minimum; Express-1 guidance says do not use webcams or streaming capture software. ([Synthesia docs: Studio avatars](https://docs.synthesia.io/docs/studio-avatars); [Synthesia help: Studio Express-1 avatar](https://help.synthesia.io/en/articles/9680757-how-do-i-create-a-studio-express-1-avatar))
- Webcam / photo personal avatars exist; video-based personal avatars are single-angle and labelled legacy. ([Synthesia docs: Personal avatars](https://docs.synthesia.io/docs/personal-avatars.md))
- Editor offers 1:1, 9:16 and 16:9 output (third-party). ([Smartkeys Synthesia review](https://smartkeys.org/synthesia-review/))

Tavus (Phoenix replicas)
- API "Create Face" (replica) endpoint; current default model `phoenix-4.5`, with Phoenix-4 and Phoenix-3 (legacy); train from a video or image URL; uploader must hold rights to likeness, voice and footage. ([Tavus docs: Create Face](https://docs.tavus.io/api-reference/phoenix-replica-model/create-replica))
- Pricing conflicts: free Basic, Starter $59, Growth $397, Enterprise custom versus Starter $39, Growth $375; extra replicas about $40 to $65; recordings $0.03/min. ([RightAIChoice](https://rightaichoice.com/tools/tavus); [FixedLabs](https://www.fixedlabs.ai/tools/tavus))
- Training input: 2-minute video, about 30 min training (third-party; 2024 TechCrunch describes original Phoenix needing two minutes of data, so dated). ([TechCrunch, Mar 2024](https://techcrunch.com/2024/03/12/generative-ai-video-startup-tavus-raises-18m-to-bring-face-and-voice-cloning-to-any-app/); [The Rundown](https://www.therundown.ai/tools/tavus))

D-ID
- API Build plan $18/month (one source says verified against live pricing June 11, 2026); another lists API Build yearly at 16 min/month at about $0.90/min; API plans separate from Studio. ([BuildFastWithAI](https://www.buildfastwithai.com/ai-tools/d-id); [AIToolsMentor](https://www.aitoolsmentor.com/tool/d-id); [Grailogic](https://grailogic.com/tools/d-id/))
- One reviewer scores D-ID 57/100 as an avatar tool. ([Grailogic](https://grailogic.com/tools/d-id/))

Akool
- API metered in credits; a 1080p talking avatar costs 5 credits per 10 s; API access from the Pro Max plan upward; Akool's own page has rendering inconsistencies. ([Akool API pricing](https://akool.com/api-pricing); [Vidmetoo Akool pricing](https://www.vidmetoo.com/akool-pricing-explained-plans-credits-and-hidden-costs/))

Creatify (Aurora)
- API Starter $99/month for 500 credits; API Pro $299/month for 2,000 credits; Enterprise custom. Aurora 2.0: 0.4 / 0.7 / 1.4 / 2.8 credits per second at 480p / 720p / 1080p / 2K, 1 s increments, default 720p; Aurora 1.0 is 1 credit/s, 1.0 Fast 0.5 credits/s; failed jobs refunded; requests refused if balance too low. ([Creatify docs: Billing](https://docs.creatify.ai/billing); [Creatify docs: Aurora API](https://docs.creatify.ai/api-documentation/aurora/aurora))
- Aurora is photo-to-avatar; Aurora 1.0 on fal is $0.07/s at 480p and $0.14/s at 720p. ([Creatify Labs: Aurora](https://labs.creatify.ai/models/aurora); [RunComfy Aurora](https://www.runcomfy.com/models/creatify/aurora))
- Older (about 3 years) lipsync/avatar endpoint docs list 5 credits per 30 s for the standard avatar model. ([Creatify API: Create an AI Avatar task](https://docs.creatify.ai/api-reference/lipsyncs/post-apilipsyncs))

Higgsfield (Speak)
- Lip sync lives in the web app's Lipsync Studio; Speak 2.0 is an image-to-video option; Lipsync Studio can add a talking mouth to an existing image or video. ([Higgsfield help: lipsync, voiceover, aspect ratios](https://higgsfield.ai/creator-hub/help-center/ai-models/how-do-i-use-lipsync-voiceover-and-aspect-ratios); [Higgsfield AI talking avatar](https://higgsfield.ai/ai-talking-avatar))
- Only third-party resellers expose Speak via API (Unifically; Segmind lists 5, 10 or 15 s duration options, page about 405 days old). No first-party public API confirmed. ([Unifically: Higgsfield Speak](https://unifically.com/models/higgsfield-speak); [Segmind: Higgsfield Speech2Video](https://www.segmind.com/models/higgsfield-speech2video))

### Inferences
- Monthly cost at 15 to 45 min (direct API rates, before retries):
  - Captions Mirage Avatar X at $0.15/s ($9/min): $135 to $405 (at $0.175/s: $158 to $473).
  - Hedra Character-3: 720p $3/min gives $45 to $135; 1080p $3.75/min gives $56 to $169.
  - Creatify Aurora 2.0 at 720p needs 630 to 1,890 credits, which fits API Pro ($299, 2,000 credits; effective about $0.105/s or $6.30/min). At 1080p the top end (3,780 credits) exceeds Pro.
  - Argil Classic (25 min) does not cover the top end; Pro ($149, 100 min) covers it, if API is included on that tier (unconfirmed).
  - Synthesia Creator ($89, about 30 min) covers the low-to-mid range only, and only Studio/Express-1 avatars work via API, which means a studio-grade shoot, not a phone selfie.
  - D-ID at about $0.90/min is cheapest but lowest-rated on realism.
- Pipeline fit for "your own clone, fed your own ElevenLabs audio": HeyGen (`audio_asset_id`), Argil (`audioUrl` per moment), Captions Mirage Avatar X (video/image + audio) and Hedra (image + audio) all accept uploaded audio. Argil's moment model plus `gestureSlug` and native B-roll is closest to finished Reels structure; HeyGen gives the most realism control.
- Hedra and Creatify Aurora are image-driven, so identity comes from one photo, not a trained video twin; they suit a "photo of me" approach rather than a true clone.
- Higgsfield must be excluded from any automated stage in this repo: CLAUDE.md says Higgsfield generation is manual and no implementation may spend a Higgsfield credit, and no first-party API was found anyway.
- Tavus is built around real-time conversational video; for pre-rendered Reels it is a weaker fit unless its generated-video minutes are priced well (price not found).

### Gaps
- Tavus per-minute price for non-realtime generated video, and Phoenix-4.5 footage spec, not found (docs point to a separate "Choose a Model" page that did not surface).
- Argil official pricing page and which tier includes API: not found; only conflicting third-party data.
- Captions AI Twin creation via API (as opposed to Avatar X inference from a reference clip) not confirmed; max output length for Avatar X not found.
- Hedra max clip length per API call, and whether Hedra supports trained custom avatars, not found.
- Akool and D-ID personal clone (video-trained) via API, and their 9:16 support, not found.
- Creatify API price for its "custom avatar" from video not found.

## 3. Lip-sync onto real recorded footage (video-to-video): Sync Labs, HeyGen video translate, Kling, Hedra, fal / Replicate hosted models

### Takeaway
Sync (sync.so) is the dedicated, documented choice: lipsync-2-pro at roughly $0.05 to $0.083 per output second depending on which Sync page is current, up to 5 / 10 / 30 min per generation by plan, with a newer 4K-native "sync-3" model. Cheap hosted alternatives exist (LatentSync on fal at $0.005/s, Kling lipsync at $0.014/s but 2 to 10 s clips on fal), and HeyGen video translate is $0.81 to $4 per minute depending on source.

### Cited Findings
Sync (sync.so)
- Docs: lipsync-2-pro costs $0.067 to $0.083 per second at 25 fps; usage counted by frames in the output video; the billing page says it covers legacy subscription plans. ([Sync docs: Lipsync models](https://sync.so/docs/models/lipsync); [Sync docs: Billing](https://sync.so/docs/product/billing))
- Pricing page and FAQ: all models $0.05 per second of generated video, higher tiers up to 20% discount; another Sync pricing page lists Scale at $0.04/s. Conflicts with the docs. ([Sync pricing](https://sync.so/pricing); [Sync pricing (lp)](https://lp.sync.so/pricing))
- Plan limits: Creator $19/month, max 5 min per generation, concurrency 3; Growth $49, 10 min, concurrency 6; Scale $249, 30 min, concurrency 15; limits are per video, not a total allowance. ([Sync Support FAQ](https://support.sync.so/articles/7391977257-sync-support-faq); [Sync support: duration limit](https://support.sync.so/articles/9249362601-what-does-the-video-duration-limit-mean-on-each-plan))
- lipsync-2-pro face resolution is 512x512; sync-3 is described as the 4K-native model; 4K input and download are available on regular plans within technical limits. ([Sync docs: Introduction](https://sync.so/docs/introduction); [Sync Support FAQ](https://support.sync.so/articles/7391977257-sync-support-faq); [Sync API overview](https://sync.so/docs/api-reference/api-overview))
- Resold: fal lists lipsync-2-pro at $5/min (1.67x standard, about $0.083/s); WaveSpeed $0.08/s; MindStudio $0.08/s; RunComfy $0.094/s; Replicate hosts `sync/lipsync-2-pro` with a `sync_mode` option for audio/video length mismatch, no max duration stated. ([fal sync-lipsync v2](https://fal.ai/models/fal-ai/sync-lipsync/v2); [WaveSpeed](https://wavespeed.ai/blog/posts/introducing-sync-lipsync-2-pro-on-wavespeedai/); [MindStudio](https://www.mindstudio.ai/models/sync-lipsync-2-pro); [RunComfy](https://www.runcomfy.com/models/sync/sync/lipsync/v2/pro); [Replicate sync/lipsync-2-pro](https://replicate.com/sync/lipsync-2-pro/versions/eaad6bceea4938d05f5d984b22897e5a7d389d4fff9a70888af5718502b57d39/api))
- A third-party repo PR prices lipsync-2 and lipsync-2-pro per second, showing per-second billing is the norm for integrators. ([genfeed.ai PR #7187](https://github.com/genfeedai/genfeed.ai/pull/7187))

HeyGen video translate
- HeyGen help center: Speed lip sync $0.81/min (16 credits), Precision lip sync $1.50/min (30 credits), audio-only speed dubbing $0.57/min (11 credits); proofread mode open to all paid API credit holders. ([HeyGen help: API pricing explained](https://help.heygen.com/en/articles/10060327-heygen-api-pricing-explained))
- Third-party 2026 guides report about $2/min Speed and $4/min Precision; an August 2026 guide cites $0.05/s ($3/min) for Translate v2 precision. ([StartPinch](https://startpinch.com/guides/heygen-video-translation-pricing); [AutoHustle, Aug 2026](https://autohustle.me/blog/heygen-alternatives-video-translation); [Perso](https://perso.ai/blog/heygen-ai-dubbing-review-2026))
- One guide says HeyGen leads for dubbing existing recorded content with lip sync. ([Techsy](https://techsy.io/en/blog/best-ai-avatar-generators-2026))

Kling lip sync
- fal: $0.014 per input video second, rounded up to the nearest 5 s. ([fal Kling lipsync audio-to-video](https://fal.ai/models/fal-ai/kling-video/lipsync/audio-to-video))
- fal docs list input video 2 to 10 s, 720p/1080p only, 720 to 1920 px per side; a second schema on the same page allows 2 to 60 s (page is internally inconsistent). WaveSpeed also caps at 10 s. Kling's own blog says its Lip-Sync API handles up to 60 s at 1080p; Atlas Cloud says 60 s max in the web app; Dzine says 5 to 10 s optimal, 10 s max. ([fal Kling lipsync docs](https://fal.ai/docs/model-api-reference/video-generation-api/kling-video-lipsync); [WaveSpeed Kling lipsync](https://wavespeed.ai/docs/docs-api/kwaivgi/kwaivgi-kling-lipsync-audio-to-video); [Kling blog](https://kling.ai/blog/ai-video-troubleshooting-guide-mistakes); [Atlas Cloud](https://www.atlascloud.ai/blog/tips/kling-ai-lip-sync); [Dzine](https://www.dzine.ai/tools/kling-ai-lip-sync/))

Other hosted video-to-video options
- VEED Lipsync v2 on fal: $0.07 per output second, no minimums. ([fal VEED Lipsync v2](https://fal.ai/veed-lipsync-v2))
- LatentSync on fal: $0.005 per output second. ([fal LatentSync](https://fal.ai/models/fal-ai/latentsync); [Verna LatentSync pricing](https://verna.one/models/latentsync))
- InfiniteTalk has a video-to-video endpoint on fal. ([fal Infinitalk video-to-video](https://fal.ai/models/fal-ai/infinitalk))
- Replicate hosts a community "multi-model-lipsync" wrapper. ([Replicate founderfeed/multi-model-lipsync](https://replicate.com/founderfeed/multi-model-lipsync/versions/6869d85fddd0a4e0b408b89cbf0c2de6003de3ede51d87f82f292b87c646cd3b/api))
- Mirage Avatar X also takes video + audio as input (see section 2), so it can act as a re-sync engine on a real clip. ([Captions help: API pricing](https://captions.ai/help/docs/api/pricing))

### Inferences
- A "record once, re-voice forever" path: shoot a library of real 9:16 phone clips of the creator (a few minutes, varied framing), then per video pick a base clip, generate ElevenLabs audio, and run Sync lipsync-2-pro (or sync-3) to re-mouth it. This keeps real head movement and real hands (the hardest thing for generators), at the cost of base-clip reuse being noticeable over 30 videos/month.
- Cost at 15 to 45 min/month: Sync at $0.05/s gives $45 to $135, at $0.083/s gives $75 to $225, plus a $19 to $49 plan; LatentSync on fal gives $4.50 to $13.50; Kling on fal gives about $12.60 to $37.80 but needs chunking into 10 s pieces on fal, which risks seams at chunk boundaries.
- lipsync-2-pro regenerates a 512x512 face region; in a 1080x1920 close-up the face is often larger than 512 px, so the mouth region may be softer than the rest of the frame. sync-3 (4K-native) is the model to test for close-ups.
- HeyGen translate is designed for language translation; using it for English-to-English re-voicing is not documented here.

### Gaps
- No independent, blind close-up-face quality comparison of Sync vs HeyGen translate vs Kling vs LatentSync was found.
- sync-3 per-second price and availability via API not found.
- Hedra's video-to-video lip sync capability and price not found.
- Max input length for lipsync-2-pro on fal not found.

## 4. Open-source options (LatentSync, MuseTalk, Wav2Lip, Hallo3, OmniHuman, FantasyTalking, InfiniteTalk): GPU needs, quality vs commercial, hosting cost

### Takeaway
Open-source lip-sync (LatentSync 1.6, MuseTalk 1.5) is cheap to host (LatentSync $0.005/s on fal; MuseTalk runs on 4 GB GPUs) but papers report weaker mouth-shape accuracy or identity detail than diffusion-transformer or commercial models. Full-body/audio-driven generators are either closed (OmniHuman: no open weights found, $0.14 to $0.16/s hosted) or expensive to host (InfiniteTalk $0.20/s on fal), so open source does not undercut HeyGen for whole-avatar generation.

### Cited Findings
- LatentSync (ByteDance): minimum inference VRAM 8 GB for v1.5 and 18 GB for v1.6; v1.6 trained at 512x512 to reduce blurriness. ([GitHub bytedance/LatentSync](https://github.com/bytedance/LatentSync))
- A quantized LatentSync 1.6 GGUF build reports peak VRAM about 9.1 GB on an RTX 5090 (community, not a formal benchmark). ([Hugging Face audio-cpp/LatentSync-1.6-GGUF](https://huggingface.co/audio-cpp/LatentSync-1.6-GGUF))
- Sync (a competitor vendor) says 1.6 roughly doubles VRAM and prices out most consumer cards. ([Sync blog: What is LatentSync](https://sync.so/blog/what-is-latentsync))
- LatentSync paper reports best LSE-C (7.90 on HDTF) and claims better visual quality than prior methods. ([arXiv 2412.09262](https://arxiv.org/pdf/2412.09262))
- MuseTalk 1.5: lowest tested setup is a 4 GB laptop GPU in fp16 (an 8 s video takes about 5 min on an RTX 3050 Ti laptop); community measured about 3.6 GB; 30 fps+ real-time at 256x256 on a Tesla V100. ([NexGPU MuseTalk guide](https://nexgpu.net/en/models/musetalk/); [MuseTalk paper arXiv 2410.10122](https://arxiv.org/pdf/2410.10122); [Hugging Face MuseTalk1.5](https://huggingface.co/marcosremar2/MuseTalk1.5))
- MuseTalk paper user study: MuseTalk 4.26 / 4.15 / 3.77 vs LatentSync 3.71 / 3.93 / 4.07 (visual quality / identity / lip-sync), i.e. MuseTalk looks better, LatentSync syncs better. ([MuseTalk paper](https://arxiv.org/pdf/2410.10122))
- HighSync paper: MuseTalk gets high perceptual quality via GAN refinement but its sync was rated substantially lower. ([HighSync arXiv 2605.16918](https://arxiv.org/html/2605.16918v1))
- OmniSync user study: LatentSync 3.812 lip-sync accuracy, 3.632 image quality; IP-LAP and LatentSync "frequently fail at mouth shape modification"; MuseTalk made a man's beard sparse (identity detail loss). ([OmniSync arXiv 2505.21448](https://arxiv.org/pdf/2505.21448))
- Masking: LatentSync inpaints a large mouth-agnostic mask; MuseTalk and JoyGen inpaint the lower face with a rectangular mask. ([JOLT3D arXiv 2507.20452](https://arxiv.org/pdf/2507.20452))
- Hosting prices: LatentSync on fal $0.005/s; MuseTalk on fal is billed per compute second with no published per-output rate; reseller FairStack lists MuseTalk 1.5 at $0.0015/s. ([fal LatentSync](https://fal.ai/models/fal-ai/latentsync); [Aireiter MuseTalk review](https://aireiter.com/blog/musetalk-lipsync-review-cost-vs-paid-apis); [FairStack MuseTalk 1.5](https://fairstack.ai/models/musetalk-1.5))
- OmniHuman (ByteDance): no evidence of open weights; a review (about 10 months old) says research/lab phase with limited consumer access via partners like Dreamina; hosted on fal at $0.14/s (v1) and $0.16/s (v1.5), on Runware (model ID `bytedance:5@2`) and inference.sh; a promo site mentions OmniHuman 2.0 (unverified). ([fal OmniHuman](https://fal.ai/models/fal-ai/bytedance/omnihuman); [fal OmniHuman 1.5 vs 1 comparison](https://fal.ai/learn/biz/omnihuman-15-vs-omnihuman-comparison); [Runware OmniHuman 1.5](https://runware.ai/docs/models/bytedance-omnihuman-1-5); [inference.sh](https://inference.sh/apps/bytedance/omnihuman-1-5); [Evolink review](https://evolink.ai/blog/omnihuman-1-5-review-bytedance-ai-avatar-generator-ultimate-guide); [omnihuman-15.com](https://www.omnihuman-15.com/))
- InfiniteTalk (MeiGen-AI, source on GitHub): fal image+audio and text+audio endpoints at $0.20/s, 720p price doubled; a third-party guide cites about $0.30/s at 480p (conflicts with fal); the separate infinitetalk.net service exports 480p/720p, Starter $29.90/month. ([fal Infinitalk single-text](https://fal.ai/models/fal-ai/infinitalk/single-text); [fal Infinitalk](https://fal.ai/models/fal-ai/infinitalk); [Coruzant/Kie.ai guide](https://coruzant.com/ai/infinite-talk-api-pricing-ai-avatar-video-costs/); [Inite atlas](https://inite.ai/en/atlas/infinitetalk.net); [infinitetalk.net pricing](https://www.infinitetalk.net/pricing))
- A 2026 guide covers self-hosting an open-source dubbing pipeline on GPU cloud. ([Spheron](https://www.spheron.network/blog/self-host-ai-dubbing-gpu-cloud-localization-pipeline-2026/))

### Inferences
- For re-mouthing real footage, LatentSync 1.6 on fal at $4.50 to $13.50/month is the budget fallback, but expect more mouth-shape misses than Sync; it is best used as a low-cost A/B against lipsync-2-pro, not as the default for a brand's face.
- For full avatar generation, hosted OmniHuman 1.5 ($9.60/min, so $144 to $432/month) and InfiniteTalk ($12 to $24/min) cost more than HeyGen Avatar IV/V ($3 to $5/min), so open source offers no cost win at 30 videos/month.
- Self-hosting only pays off at much higher volume; 15 to 45 min/month does not justify running an 18 GB GPU on RunPod or Modal full-time.

### Gaps
- No data surfaced for Wav2Lip, Hallo3 or FantasyTalking (VRAM, license, hosted price); searches returned nothing usable.
- RunPod / Modal per-hour GPU pricing and measured cost per output minute for self-hosted LatentSync were not gathered.
- InfiniteTalk license and VRAM requirements not verified.
- OmniHuman official ByteDance API (BytePlus) status unconfirmed.

## 5. Which tools look most convincing for a vertical, phone-camera talking head with natural head movement and hand gestures (independent comparisons 2025 to 2026)

### Takeaway
2026 roundups consistently put HeyGen (Avatar IV / Avatar V digital twin) first on likeness and natural movement, with Hedra Character-3 also cited for movement, Argil second for creator-style pacing (not realism), and Captions cheapest but more "digital-looking". No independent blind benchmark or Reddit consensus thread was found; nearly all comparisons are affiliate or vendor blogs.

### Cited Findings
- HeyGen's Avatar IV and Hedra's Character-3 are named "the 2026 leaders on naturalistic movement"; HeyGen most often ranked first for realism. ([Techsy](https://techsy.io/en/blog/best-ai-avatar-generators-2026); [DIYAI talking head test](https://diyai.io/ai-tools/video-generation/ai-talking-head-generator/); [Tandem](https://www.wearetandem.ai/en/blog/tools/best-ai-avatar-generators))
- HeyGen digital twin described as class-leading on likeness and "the realism leader"; Argil "good, not class-leading" with pacing as its main advantage; Captions twins "digital-looking" next to HeyGen but cheaper. ([FrankX: HeyGen vs Synthesia vs Argil 2026](https://www.frankx.ai/blog/heygen-vs-synthesia-vs-argil-2026); [Kompozy HeyGen review](https://kompozy.io/reviews/heygen-social-media-avatars); [Fahim AI](https://www.fahimai.com/heygen-vs-captions-ai); [Pixo](https://pixo.video/blog/heygen-alternatives))
- Argil's clone "gestures, moves, and cuts to B-roll like a TikTok native"; Hedra called simplest start for a daily creator. ([Wireflow](https://www.wireflow.ai/blog/best-argil-ai-alternatives-in-2026); [Playcut](https://playcut.ai/blog/best-ai-avatar-generators-2026/))
- Maxfusion (vendor of the RIZZ model) tested Seedance 2.0, Kling 3.0, Gemini Omni Flash, Sora 2 Pro, RIZZ and a "Sync 3" fix layer for AI UGC lip sync; says Seedance 2.0 is the most-used model for realistic AI UGC ads and calls a Google model the best lip-sync generator but notes it has a scheduled retirement date. Vendor-published, weigh accordingly. ([Maxfusion blog](https://maxfusion.ai/blog/ai-video-models-lip-sync-2026))
- VidGuy: RIZZ leads on expressed emotion, HeyGen leads on overall avatar polish. ([VidGuy](https://www.vidguy.ai/articles/maxfusion-alternatives))
- A 2026 UGC-ads comparison specifically pits Hedra vs HeyGen vs Captions (details not extracted). ([EvolveAMZ](https://evolveamz.com/ai-ugc-video-ads-hedra-heygen-captions-2026/))
- Search for Reddit threads returned none; results were blog/review sites only. ([search result set incl. Fliki](https://fliki.ai/blog/heygen-alternatives))

### Inferences
Comparison for this workload (prices as seen 2026-10-31; verify before budgeting):

| Tool | Clone input | Backend API | Own audio (ElevenLabs) | Gesture control | Approx API $/min | Est. $/month at 15 to 45 min |
|---|---|---|---|---|---|---|
| HeyGen Avatar IV twin | 30 s+ video (2 min ideal) + consent video | Yes, `/v3/videos` | Yes (`audio_asset_id`, or `engine_type: elevenlabs`) | `motion_prompt`, `expressiveness` | $4 (to $4.83) | $60 to $217 |
| HeyGen Avatar V twin | about 15 s video + consent | Yes (first-party unclear on access; fal, WaveSpeed, Runware resell) | Yes | Conflicting docs | about $3 (unconfirmed) | about $45 to $135 |
| Captions Mirage Avatar X | about 10 s footage or image | Yes | Yes (video/image + audio) | Not documented | $9 to $10.50 | $135 to $473 |
| Argil | Image (video path deprecated); 2 min recording per reviews | Yes, `/v1/videos` | Yes (`audioUrl` per moment) | `gestureSlug` per moment, zoom, B-roll | Plan-based ($149 per 100 min Pro) | $39 to $149 plan |
| Hedra Character-3 | Single photo | Yes | Yes (image + audio) | Not documented | $3 (720p) to $3.75 (1080p) | $45 to $169 |
| Creatify Aurora 2.0 | Single photo | Yes | Yes | Not documented | about $6.30 (720p on API Pro) | $299 plan |
| Synthesia | Studio shoot (3 x 2 to 3 min, 1080p+) for API use | Yes (Creator+), Express-1 / Studio only | Not confirmed | Not documented | Plan-based | $89 plan (30 min) + overage |
| Sync lipsync-2-pro (on real clips) | Your real footage | Yes | Yes | Real gestures from footage | $3 to $5 | $45 to $225 + plan |
| LatentSync on fal | Your real footage | Yes | Yes | Real gestures from footage | $0.30 | $4.50 to $13.50 |
| Higgsfield Speak | Image | No first-party API; repo forbids spending credits | n/a | n/a | n/a | Excluded |

- The two realistic architectures: (A) generated twin (HeyGen Avatar IV/V) where gestures come from `motion_prompt`, or (B) real recorded 9:16 base clips re-mouthed by Sync, where head movement and hands are real. (B) wins on hand gestures and phone-camera authenticity; (A) wins on variety (no repeated base clips) and zero reshoots.
- Argil is the strongest "already shaped like a Reel" API (moments, gestures, B-roll, captions, 9:16), but sits below HeyGen on realism per reviewers.

### Gaps
- No independent blind or side-by-side benchmark (2025 to 2026) for vertical phone-style clones was found; all rankings are editorial and often affiliate.
- No Reddit (r/aivideo, r/HeyGen) threads surfaced in search.
- No YouTube comparison transcripts were accessible.
- How each tool handles a 9:16 phone-camera framing (vs studio 16:9) was not addressed by any source.

## 6. Consent, identity verification, terms of service and commercial usage rights for cloning yourself

### Takeaway
Every vendor with self-cloning requires the cloned person's own consent, usually as a recorded statement: HeyGen requires a same-session consent video (no screen recordings; Enterprise may waive), Tavus a spoken consent statement at the start of training footage, Argil verification that the person uploaded their own footage, and Captions written consent for any identifiable person. Commercial use is generally allowed on paid tiers, but Captions' terms restrict resale and its privacy policy allows model training unless on Enterprise.

### Cited Findings
- HeyGen: consent video must show the same person, be recorded and submitted with the footage, under 30 s (help) or 35 s (dev docs); screen-played statements rejected; others record their own via QR; dev docs say Enterprise can upload pre-recorded consent or have it waived. ([HeyGen docs: Avatar Consent](https://developers.heygen.com/docs/avatar-consent); [HeyGen help: Recording your Consent Video](https://help.heygen.com/en/articles/12092609-recording-your-consent-video))
- HeyGen commercial rights are covered in a third-party FAQ (details not extracted). ([Flowith FAQ](https://flowith.io/blog/heygen-faq-custom-avatar-api-limits-commercial-rights/))
- Tavus: uploader must have rights and permissions to likeness, voice and footage; per an aggregator, for video-trained personal replicas the person must speak Tavus's prescribed consent statement at the start of the training recording, the customer is responsible for biometric notices and releases, and AI-generated footage should not be used as training material. ([Tavus docs: Create Face](https://docs.tavus.io/api-reference/phoenix-replica-model/create-replica); [AITroveX](https://aitrovex.com/tool/tavus); [AIAgents wiki](https://aiagents.wiki/agents/tavus))
- Argil: will not create a clone without verification that the person uploaded their own footage. ([Traksource Argil review](https://traksource.com/argil-ai-review/))
- Captions: terms (about 14 months old per search metadata, so possibly outdated) require "the written consent of each and every identifiable natural person in the Input" for name, likeness and voice, and bar reselling or commercial use of Mirage content except as authorized without prior written consent; help center says all AI Creator videos can be used commercially; AI Twin page frames twins as built from your own recording with explicit permission. ([Captions Terms](https://mirage.app/legal/captions-terms); [Mirage help: AI Creator guide](https://help.mirage.app/docs/project/ai-creator); [Captions: Create an AI Twin](https://captions.ai/features/create-ai-twin))
- Captions privacy policy lists AI/ML model training among data uses; training-data exclusion is advertised as an Enterprise benefit. ([The Rundown: Captions](https://www.therundown.ai/tools/captions))
- Synthesia Express-1 footage must be filmed on proper cameras (no webcams or streaming capture), implying a supervised shoot for API-grade avatars. ([Synthesia help: Studio Express-1 avatar](https://help.synthesia.io/en/articles/9680757-how-do-i-create-a-studio-express-1-avatar))
- Hedra vs HeyGen for ads comparison refers to an "ad clause" in terms (details not extracted). ([AdTestBench](https://adtestbench.com/compare/hedra-vs-heygen/))
- General 2026 guidance pieces on commercial use of AI video and creator training-data consent clauses exist. ([ClipSpeed](https://www.clipspeed.ai/blog/ai-video-commercial-use.html); [Influencers Time](https://www.influencers-time.com/ai-training-data-consent-the-creator-clause-brands-skip/))

### Inferences
- For a self-clone of the founder/creator, consent is a one-time recording step at avatar creation, not per video, so it does not block an API-only render loop. Building the twin is a manual onboarding step; rendering can be fully automated after that.
- If an Enterprise HeyGen waiver is not available, the consent video must be shot in the same session as the training footage, which should be planned into the one-time recording.
- Ask any chosen vendor in writing for training-data exclusion on the creator's likeness and voice (Captions only offers it on Enterprise).
- Separately from vendor ToS, this repo's product rules apply to scripts the avatar speaks (for example, never claim autonomous clicking or computer control for Aura Desktop).

### Gaps
- Exact HeyGen, Argil, Hedra, Synthesia and Creatify ToS clauses on commercial use of a personal avatar, ad usage, and ownership of the trained model were not retrieved.
- Identity verification beyond consent video (ID document checks) was not documented for any vendor.
- No source on biometric privacy law obligations (for example US state biometric statutes) specific to these tools was found.

## 7. Known failure modes (teeth and mouth artifacts, blinking, gesture loops, drift on long clips, accents)

### Takeaway
Documented failure modes are mouth-region degradation (blurred or fused teeth, teeth visible behind closed lips, "swimming" teeth), patch-blend seams, slow audio/lip drift, identity and color drift over long rollouts, and static or distorted hands during fast gestures. Blinking, gesture loops and accent-specific problems are not well covered by any source found.

### Cited Findings
- Visual dubbing paper: small faces give the mouth very few latent tokens, so compression and denoising erase teeth, producing blurred teeth, fused upper/lower dentition and teeth behind a closed mouth; a reference branch can copy bad oral artifacts from the source. ([TBDub arXiv 2609.06144](https://arxiv.org/pdf/2609.06144))
- Generated teeth often look too clean and uniform because real teeth are very person-specific. ([Sync blog: How AI lip sync works](https://sync.so/blog/how-ai-lip-sync-actually-works))
- Many pipelines regenerate a patch around the mouth and blend it back, which can leave visible seams. ([Sync blog: Why AI lip sync still looks fake](https://sync.so/blog/why-ai-lip-sync-looks-fake))
- Sync drift (audio and lips slowly separating over a clip) and "teeth that swim" listed as failures in a 2026 vendor test. ([Maxfusion blog](https://maxfusion.ai/blog/ai-video-models-lip-sync-2026))
- Lip-sync mismatch defined as mouth movement noticeably early or late against audio. ([MTAVG-Bench arXiv 2602.00607](https://arxiv.org/pdf/2602.00607))
- Long video: identity drift shows as texture distortion, blurring, exaggerated contrast and saturation, and color shifts. ([Kling-Avatar arXiv 2509.09595](https://arxiv.org/pdf/2509.09595)); other methods degrade over long rollouts with identity drift, color drift and weaker lip sync. ([AvatarForcing arXiv 2603.14331](https://arxiv.org/pdf/2603.14331))
- Hands: some baselines leave hand poses nearly static; others distort hand regions or blur during fast gestures. ([SoulX-FlashTalk arXiv 2512.23379](https://arxiv.org/pdf/2512.23379))
- Open-source specific: LatentSync often fails to change mouth shape; MuseTalk thinned a beard (identity detail loss). ([OmniSync arXiv 2505.21448](https://arxiv.org/pdf/2505.21448))
- Blinking: only a practitioner tip to minimize blinking and excessive movement early in a clip. ([LongStories](https://longstories.ai/blog/best-practices-ai-voice-lip-sync-consistency))
- Integration failure: HeyGen forum report that `audio_asset_id` was ignored on an older (v4) path, producing TTS output instead of the uploaded audio. ([HeyGen docs forum](https://docs.heygen.com/discuss/67f693cca0b91d0068155a8b))
- Kling lipsync on fal capped at 10 s per input in at least one schema, forcing chunking. ([fal Kling lipsync docs](https://fal.ai/docs/model-api-reference/video-generation-api/kling-video-lipsync))

### Inferences
- Close-up 9:16 framing helps: larger faces give more latent resolution to the mouth, which addresses the small-face teeth failure; but it also makes any 512x512 mouth-patch softness (lipsync-2-pro) more visible.
- Argil's gestures are a fixed per-avatar list of labelled slugs, so repeated use across 30 videos/month likely produces recognizable gesture repetition; rotate slugs per moment.
- 30 to 90 s clips are within the range where drift papers report degradation; splitting into moments/segments (Argil) or keeping each render under about 60 s is a sensible guard.
- An automated QA node should check: audio/video duration match, a SyncNet-style lip-sync confidence score, face crop sharpness in the mouth region, and that the uploaded audio (not fallback TTS) was used.

### Gaps
- No measured data on robotic blinking frequency or gesture-loop repetition for HeyGen, Argil or Captions.
- No source on accent or non-American English pronunciation affecting lip sync quality.
- No vendor-published failure rate or rejection/retry rate per render was found.

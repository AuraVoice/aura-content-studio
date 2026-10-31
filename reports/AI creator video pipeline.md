# Turn one text into four posts

A solo creator can turn one Telegram message into a post-ready vertical avatar video. A typical month of 30 videos costs about **$280**, in a range of **about $78 to $990**. The pipeline has ten stages: fact pack, script and shot list, voice, avatar, B-roll, music and SFX, composition with captions, Gemini Critic QA, Telegram approval, and publishing. Voice comes from **ElevenLabs Eleven v4 with a Professional Voice Clone**. The talking head comes from a **HeyGen digital twin that lip-syncs to that audio**. B-roll comes from **Google Veo 3.1, Nano Banana, screenshots and card templates**. **Remotion on Vercel Sandbox** renders the edit and the captions, and the **official platform APIs** post the result. The avatar render is about half of the monthly cost. The slowest part is not generation: the TikTok API audit can take up to about six weeks, so plan for the first public post in about six weeks. Varun Mayya's reels are not one-click automation, because human editor pods finish each one. This design copies his format and replaces his editors with a Gemini Critic pass and your Telegram approval. Three repository rules block the design today and must change first. No price in this report was read on a live vendor page, so the last sections list what you must verify before you pay.

## The confidence labels show what was checked and what was not

You asked for 100% confidence. This report cannot give it. The research sessions could not open most vendor domains (elevenlabs.io, help.heygen.com, sync.so, ai.google.dev, developers.tiktok.com, developers.facebook.com, developers.google.com, remotion.dev). Most facts come from search-engine extracts of those pages. Only the Remotion version and license text were read directly. Each table in this report uses these labels.

| Label | Meaning |
|---|---|
| **Direct** | Read directly in a research session (npm registry, package license file). |
| **Official** | From the vendor's own docs or help page, seen as a search extract. The full page was not opened. |
| **Creator** | The creator's own post on X or LinkedIn. |
| **Secondary** | A third-party guide, review, reseller page or news report. |
| **Conflict** | Sources disagree. The report shows both values. |
| **Estimate** | Arithmetic or a design inference from cited numbers. |
| **Repo** | Read from this repository (CLAUDE.md, AGENTS.md, source files). |

## Five repo rules shape this design, and three of them block it

Fix these before any code is written. The first three are blockers. The last two are constraints that the design follows.

| # | Rule and location | Conflict with this pipeline | Decision you must make |
|---|---|---|---|
| 1 | CLAUDE.md: "This repository is only for Aura Desktop marketing on Windows." AGENTS.md "Product boundary". `src/lib/product.ts` guardrail: "Only market Aura Desktop for Windows." README says the same. | **Blocker.** A personal creator brand is out of scope. Trend Scout and Prompt Director prompts enforce Aura-only content. | Change the scope rule to allow a second brand (add `brand_id` to every record and a separate creator facts file), or build in a new repo that reuses this code. |
| 2 | CLAUDE.md: "Higgsfield generation is manual. No implementation may spend a Higgsfield credit." AGENTS.md: "No code may call Higgsfield or initiate a paid generation." and "A recommended paid regeneration must pass through `interrupt()` and a Telegram resume." | **Blocker.** Voice, avatar and B-roll stages are all paid generations. Gemini Critic auto-fixes are paid regenerations. The AGENTS.md sentence can be read to forbid all of them. | Keep Higgsfield manual. Amend AGENTS.md to allow non-Higgsfield paid generation under a per-video and monthly budget cap. Decide if auto-fixes inside the cap need Telegram approval. |
| 3 | AGENTS.md: "Never put a Supabase signed media URL into dashboard state or markup." and "Every media response must validate an opaque Postgres session." See the 2026-07-28 entry in lessons-learnt.txt. | **Blocker for Instagram.** Meta pulls the Reel from a public `video_url` and cannot present a session cookie ([PostProxy](https://postproxy.dev/blog/instagram-reels-api-publishing-guide/)). | Allow a short-lived signed URL that the Publisher step creates and never stores. Or push bytes where the API allows it (TikTok file upload, Facebook binary upload; details unconfirmed). |
| 4 | CLAUDE.md: "Preserve prompt locked attributes during surgical revisions." lessons-learnt.txt: "Change only" is a structural invariant enforced in code after model output. | Constraint. A "fix line 4" request must not change the voice, avatar, look, captions or other segments. | The shot list carries `locked_attributes`. Code merges only the changed segment. |
| 5 | AGENTS.md: "Keep dependencies and architecture lightweight." | Constraint. Remotion is a large dependency. Each new vendor adds a secret to rotate. | Accept Remotion, or use FFmpeg with ASS captions (lighter, harder to style). |

These rules already fit the design and need no change: the LangGraph orchestrator is the only conversational agent, specialists return structured state, approval uses `interrupt()` and `Command({ resume })` from Telegram, Supabase records plus Postgres checkpoints are the source of truth, every write compares `campaigns.run_version`, and every Telegram event claims an idempotency key. The daily cron is off today (last commit "Disable daily content cron"), and this pipeline starts from your Telegram message, so it does not need the cron.

One more guard: this Claude environment has a Higgsfield MCP server with paid tools such as `generate_video`. No agent tool list in the pipeline may include those tools. Higgsfield also has an official API, but its Kling 3.0 price ($0.084 per second) equals Kling's own API, so it gives no cost reason to break the rule ([Higgsfield API docs](https://docs.higgsfield.ai/docs/api-reference/overview); [Layer3 Labs](https://www.layer3labs.io/guides/higgsfield-api)). Higgsfield Speak has no confirmed first-party API ([Unifically](https://unifically.com/models/higgsfield-speak)).

## Varun Mayya's reels are AI-presented but human-finished

The target production level is real, but it is a team result. Varun Mayya's own posts show a three-year path. In February 2023 he tested lip-sync with a borrowed voice and called voice cloning "easier than getting lipsync right" ([Varun Mayya on X](https://x.com/waitin4agi_/status/1626692793929457664)). In January 2025 he said "social avatars" did "100s of millions of views per month" ([Varun Mayya on X](https://x.com/waiting4_asi/status/1874481190365024320)). For dynamic shots his team used a Flux LoRA trained on his face, Runway animation and a lip-sync model, and he said single-photo LoRAs "don't animate well especially when angles change" ([Varun Mayya on X](https://x.com/waiting4_asi/status/1877795926342873491)). In August 2025 his team called Wan 2.2 image-to-video "Mid" ([Varun Mayya on X](https://x.com/waitin4agi_/status/1958478247290953986)). Label: Creator.

A January 2026 YourStory profile adds the stack. The script goes into **ElevenLabs** with a voice model trained on years of his YouTube clips. The audio goes to **HeyGen or a custom Wan 2.2 LoRA** trained on his real footage. Each day starts with a news snippet plus his take, often as a voice note. A team member flags mispronounced words weekly, and he re-records them. **Four-editor pods** split each one-minute video into chunks and polish them, inside a **17-person team**. Views held with full AI disclosure ([YourStory, Jan 2026](https://yourstory.com/2026/01/ai-authenticity-the-creators-edge-lessons-from-varun-mayya)). Label: Secondary. The full page was not opened, and the editor-pod detail may come from a Medium write-up instead.

Vaibhav Sisinty uses an "AI clone" for weekly long-form AI-update videos. He reports 500K YouTube subscribers in about six months, with his team meeting him 2 to 3 hours a week ([Vaibhav Sisinty on X, Apr 2026](https://x.com/VaibhavSisinty/status/2048368679193284615); [Vaibhav Sisinty on X, Oct 2025](https://x.com/VaibhavSisinty/status/1976993457035157776)). No source names his avatar or voice tool. His format is 20-minute videos, not 30 to 90 second reels.

The failure case is Kwebbelkop. He replaced himself with an AI persona in a gaming niche, and fans and peer creators criticised it ([Dexerto](https://www.dexerto.com/entertainment/youtuber-kwebbelkop-criticized-after-launching-ai-replacement-to-do-his-gaming-videos-2248517/)). The pattern across these cases is clear. Own likeness, own opinion, disclosed, on information topics, works. Persona replacement without the creator's judgement fails. So the creator's daily take is a required input in this design, not an option.

No source documents the exact edit grammar of either creator (hook timing, cut rate, caption font, B-roll ratio). An undated editor brief asks for fast pacing and captions throughout with emphasis on key words ([Scribd brief](https://www.scribd.com/document/934854325/Video-Editing-Instructions-Bbs-1)). The cut-every-2-to-4-seconds rule in this report comes from generic creator guides ([Nativz](https://nativz.io/guides/hook-first-editing/)). To match their grammar exactly, analyse 20 of their reels frame by frame.

## One Telegram message becomes four posts in ten stages

This example follows one video from your message to four live posts. The numbers are illustrative estimates from the cited rates.

You send at 08:10: **"OpenAI released X today. My take: Y."**

| Stage | Agent and tool | What it produces (example) | Wall time | Cost |
|---|---|---|---|---|
| 0 | Telegram webhook, durable Workflow | `video_runs` row, thread `vid-2026-11-02-01`, idempotency key claimed | 1 s | $0 |
| 1 | Fact Pack Agent (Brave Search) | 6 facts about X, each with a source URL and date. 2 URLs marked for screenshots. | 30 s | $0.04 (8 queries) |
| 2 | Script Agent (Claude Opus 5.5) | Shot list JSON: 9 segments, 148 words, target 55 s, 3 hook variants | 1 min | $0.16 |
| 3 | Voice Agent (ElevenLabs v4, PVC) | 9 segment audio files plus character timing JSON. Joined `voice.wav` is 54.8 s. | 1 min | In plan |
| 4 | Avatar Agent (HeyGen v3 API) | `avatar.mp4`, 54.8 s, lips synced to `voice.wav` | 8 to 15 min, more in a slow queue | $3.65 at $4/min |
| 5 | B-roll Agent (runs during stage 4) | 1 page screenshot, 1 post card, 1 Veo 3.1 Lite clip (9:16), 1 Nano Banana still | 2 to 5 min | $0.55 |
| 6 | Music and SFX (library pick) | Bed `pulse-07`, 4 whooshes, 6 pops | 1 s | $0 |
| 7 | Compose Agent (Remotion, Vercel Sandbox) | `final.mp4` 1080x1920, 30 fps, about 69 MB. `preview.mp4` at 720p. | about 5 min (measure) | $0.11 |
| 8 | Gemini Critic and checks | Verdict `APPROVE_WITH_MINOR_ISSUES`, 1 minor note at 0:31 | 1 to 2 min | under $0.20 |
| 9 | Telegram approval (`interrupt()`) | Preview, post copy for 4 platforms, AI-label status, buttons | Waits for you | $0 |
| 10 | Publisher Agent | 4 post IDs and links, sent back to you in Telegram | 2 to 10 min | $0 |

The preview reaches you about 20 to 35 minutes after your message when HeyGen's queue is fast. The marginal cost is about $5 per video. With plans and retries, a typical month works out to about $9 per video. Label: Estimate.

```
 CREATOR on Telegram                                Vercel Cron (optional, off today)
 "OpenAI released X today. My take: Y."             daily Trend Scout ideas
        |                                                   |
        v                                                   v
 /api/telegram/webhook --- claim idempotency key ---> Vercel durable Workflow "video-run"
                                                      (retry, sleep, resume)
                                                            |
                                                            v
     +--------------------------------------------------------------------------+
     | LangGraph orchestrator: the only conversational agent                    |
     | Postgres checkpointer, one thread per video, compares run_version        |
     +--------------------------------------------------------------------------+
            |                        |                        |
            v                        v                        v
     [1] Fact Pack            [2] Script Agent         [3] Voice Agent
     Brave Search             Claude Opus 5.5          ElevenLabs v4 + PVC
     facts + source URLs      JSON shot list           audio + timing JSON
            |                        |                        |
     [4] Avatar Agent         [5] B-roll Agent         [6] Music + SFX
     HeyGen v3 API            Veo 3.1, Nano Banana,    pre-made ElevenLabs
     audio-driven twin        cards, screenshots       library, picked by tag
            |                        |                        |
            +------------------------+------------------------+
                                     |  structured state only
                                     v
                         [7] Compose Agent
                         Remotion in Vercel Sandbox, captions from timing JSON
                         1080x1920 master + 720p preview
                                     |
                                     v
     Supabase Postgres: records, versions, provider job IDs, licenses, costs
     Supabase private Storage: audio, avatar clips, B-roll, renders
                                     |
                                     v
                         [8] Gemini Critic + ffprobe + STT checks
                          |                               |
               SURGICAL_REGENERATION              APPROVE or minor issues
               re-run listed segments only                |
               (max 2 loops, inside budget cap)           v
                          |                    [9] interrupt("approve video?")
                          +--> back to             Telegram: preview, critic notes,
                               [3], [4] or [5]     post copy, AI labels, buttons
                                                          |
                                               creator taps a button
                                                          |
                                               webhook --> Command({ resume })
                                                          |
                                                          v
                                               [10] Publisher Agent
                                               (one idempotency claim per platform)
              +-------------------+--------------------+--------------------+
              v                   v                    v                    v
       YouTube Data API     Instagram API        Facebook Page         TikTok Direct Post
       containsSynthetic    container, poll,     /video_reels          is_aigc: true,
       Media: true          publish, AI label    3 to 90 s             creator_info first
```

Three design choices make this flow safe to retry. First, every provider job ID goes into Supabase before the workflow waits, so a resume never pays twice for the same render. Second, voice and B-roll work per segment, so a fix touches one segment only. Third, B-roll providers sit behind one job interface with model IDs in config, because vendors remove models fast. OpenAI removed the Sora 2 API on 24 September 2026, and Google's Veo 3.1 preview IDs were set to shut down on 22 October 2026 ([The Decoder](https://the-decoder.com/openai-sets-two-stage-sora-shutdown-with-app-closing-april-2026-and-api-following-in-september/); [aiidelist](https://aiidelist.com/blog/veo-3-1-api-pricing-comparison)). PlayHT shut down on 31 December 2025 and took saved voice clones offline ([killedbyai](https://killedbyai.net/dead/playai-playht/)).

## Each stage has one primary tool and one fallback

| Stage | Primary | Fallback | Key facts | Label |
|---|---|---|---|---|
| 1. Fact pack | Brave Search API (already in repo) | Claude server-side web search tool | Brave is $5 per 1,000 requests, and a $5 monthly credit covers about 1,000 queries ([fastcrw](https://fastcrw.com/blog/web-search-api-pricing-2026); [beri.net](https://www.beri.net/article/tavily-vs-exa-vs-brave-vs-perplexity-search-api-agent-cost-2026)). Claude has `web_search_20260209` ([Anthropic docs](https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-search-tool)). | Secondary |
| 2. Script and shot list | Claude Opus 5.5 with structured outputs | Gemini 3.1 Pro (already in repo through `@google/genai`) | Opus 5.5 is $4 in and $20 out per 1M tokens, about $0.16 per script ([Anthropic pricing](https://platform.claude.com/docs/en/about-claude/pricing)). JSON is forced with `output_config.format` ([Anthropic docs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs)). Claude led EQ-Bench Creative Writing v3, but other boards rank models in near-opposite order ([Aggregate Digest](https://buttondown.com/theaggregate/archive/ai-benchmark-digest-2026-06-01/); [Digital Applied](https://www.digitalapplied.com/blog/which-ai-model-writes-best-leaderboards-disagree)). Gemini 3.1 Pro is about $2 in and $12 out ([InventiveHQ](https://inventivehq.com/blog/llm-api-cost-comparison)). | Official price, Conflict on quality |
| 3. Voice clone and TTS | ElevenLabs Eleven v4 with a Professional Voice Clone, Creator plan ($22) | Cartesia Sonic (word and phoneme timestamps) | v4 launched 28 Sep 2026, uses audio tags, has no SSML and no Style or Speed sliders ([ElevenLabs v4 docs](https://elevenlabs.io/docs/overview/capabilities/text-to-speech/eleven-v4)). PVC needs Creator or higher ([ElevenLabs help](https://elevenlabs.io/docs/help-center/product/voices/voice-cloning/when-will-my-professional-voice-clone-pvc-be-ready)). Cartesia Startup ($49) adds professional cloning ([Developers Digest](https://www.developersdigest.tech/models/speech/cartesia); [AWS Marketplace](https://aws.amazon.com/marketplace/pp/prodview-w2bmik3jypagm)). | Official + Secondary |
| 4. Caption timing | ElevenLabs `/with-timestamps` (character alignment, free with the audio) | ElevenLabs Scribe v2 or AssemblyAI word timestamps | Alignment works on v4 and runs about 80 ms past the audio end ([livekit-avatar issue](https://github.com/peted70/livekit-avatar/issues/1); [chaptercast PR](https://github.com/robbe1999/chaptercast/pull/19)). Do not build on OpenAI `whisper-1`, which is set for removal on 26 Feb 2027 ([Developers Digest](https://www.developersdigest.tech/blog/whisper-1-gpt-4o-transcribe-deprecation)). | Secondary |
| 5. Avatar | HeyGen digital twin (test Avatar IV and Avatar V), `POST /v3/videos` with `audio_asset_id` | Sync lipsync-2-pro or sync-3 on your real recorded base clips | Audio-driven video follows the audio length up to 30 min. The audio asset is MP3 or WAV up to 32 MB ([HeyGen Audio to Video](https://developers.heygen.com/audio-to-video); [HeyGen Create Video](https://developers.heygen.com/reference/create-video)). Twin price is $3 to $4.83 per minute ([HeyGen help](https://help.heygen.com/en/articles/11269603-heygen-avatar-iv-complete-guide); [eesel](https://www.eesel.ai/blog/heygen-pricing)). Sync is $0.05 to $0.083 per second ([Sync docs](https://sync.so/docs/models/lipsync); [Sync pricing](https://sync.so/pricing)). | Official, Conflict on price |
| 6. B-roll motion clips | Google Veo 3.1 Lite or Fast, GA model IDs, through the Gemini API | Kling 3.0 through the fal.ai queue with webhooks | Lite is $0.05 per second at 720p and $0.08 at 1080p. Fast is $0.10 and $0.12 ([benchlm](https://benchlm.ai/media-pricing/veo)). Lite supports 9:16 ([AI API Playbook](https://aiapiplaybook.pages.dev/blog/google-veo-3-1-lite-text-to-video-api-complete-developer-guide/)). Kling 3.0 is $0.084 per second at 720p without audio ([dev.to](https://dev.to/evan-dong/kling-ai-video-generation-pricing-complete-cost-breakdown-for-developers-2026-3fnp)). fal has `fal.queue.submit` with a webhook URL ([fal docs](https://fal.ai/docs/clients/javascript)). | Secondary |
| 7. B-roll stills | Nano Banana 2 through the Gemini API | FLUX.2 [pro] through BFL or fal | Nano Banana 2 is $0.045 to $0.067 per image ([MyArchitectAI](https://www.myarchitectai.com/blog/nano-banana-api-pricing); [WaveSpeed](https://wavespeed.ai/nano-banana-2-api)). FLUX.2 [pro] is $0.03 for the first megapixel plus $0.015 for each extra, so about $0.045 at 1080x1920 ([BFL pricing](https://docs.bfl.ai/quick_start/pricing.md)). Imagen 4 left the Gemini API on 17 Aug 2026 ([invideo](https://invideo.io/blog/ai-image-model-pricing/)). | Official (BFL), Conflict (Google) |
| 8. Screenshots and cards | Remotion still templates (news card, post card with `react-tweet`, chart) plus ScreenshotOne for live pages | Urlbox, or Playwright in Vercel Sandbox | ScreenshotOne has 100 free requests per month and an entry plan of $12 to $20 ([dev.to comparison](https://dev.to/custodiaadmin/screenshot-api-pricing-compared-pagebolt-vs-screenshotone-vs-urlbox-vs-capturekit-2026-13fh)). `react-tweet` uses an unofficial embed endpoint ([Stefan Judis](https://www.stefanjudis.com/blog/how-to-prerender-tweets-without-using-the-official-twitter-apis/)). | Secondary |
| 9. Stock footage | Pexels API | Pixabay | Pexels allows commercial use without attribution, but API use asks for a link back ([Pexels Help](https://help.pexels.com/hc/en-us/articles/360042295174)). Pixabay can change its terms ([Pixabay License](https://pixabay.com/it/service/license/)). | Official |
| 10. Music | ElevenLabs Eleven Music, a library made once | Soundstripe API (YouTube release codes) | Eleven Music is $0.15 per minute, commercial from Starter ([ElevenLabs Music API](https://elevenlabs.io/eleven-music-api)). Some Pixabay tracks are in Content ID, so avoid them ([Sonilo](https://sonilo.com/blog/comparisons/pixabay-music-sound-effects-alternatives-2026)). Soundstripe uses a per-song release code ([Soundstripe API](https://www.soundstripe.com/api)). | Official |
| 11. SFX | ElevenLabs Sound Effects, a library made once | Epidemic Sound SFX through its Partner API | Cost is 20 or 40 credits per second, depending on the page ([ElevenLabs API](https://elevenlabs.io/docs/api-reference/sound-generation); [ElevenLabs help](https://elevenlabs.io/docs/help-center/product/content-production/sound-effects/how-much-does-it-cost-to-generate-sound-effects)). | Conflict |
| 12. Composition and captions | Remotion 4.0.539 with `@remotion/captions`, rendered on Vercel Sandbox through `@remotion/vercel` | FFmpeg filtergraph with ASS word captions, in Vercel Sandbox | Version read from npm ([npm](https://www.npmjs.com/package/remotion)). `@remotion/vercel` is experimental ([Remotion docs](https://www.remotion.dev/docs/vercel-sandbox)). `createTikTokStyleCaptions()` groups words into pages ([Remotion docs](https://remotion.dev/docs/captions/create-tiktok-style-captions)). Sandbox on Pro allows 24 h sessions and 8 vCPU ([Vercel Sandbox pricing](https://vercel.com/docs/sandbox/pricing)). FFmpeg examples exist for ASS captions and ducking ([GitHub](https://github.com/nik-devs/ffmpeg-caption-burn-ass); [FFmpeg Cookbook](https://ffmpeg-cookbook.pages.dev/en/articles/audio-ducking/)). | Direct + Official |
| 13. QA | Gemini Critic (existing `src/lib/agents/gemini-critic.ts`, extended) plus ffprobe and STT checks | Deterministic checks only, with a "critic unavailable" flag in Telegram | The critic schema already has `lip_sync`, `artifact`, `product_accuracy` and `lockedAttributesToPreserve`. | Repo |
| 14. Approval | Telegram bot with LangGraph `interrupt()` (existing) | Private dashboard review page (existing) | Resume uses `Command({ resume })`. | Repo |
| 15. Publishing | Official APIs: YouTube Data API v3, Instagram API with Instagram Login, Facebook Page `video_reels`, TikTok Content Posting API Direct Post | Ayrshare for TikTok until your own audit passes | Ayrshare has an audited TikTok app and documents AI-label flags for Instagram and TikTok ([Ayrshare TikTok docs](https://www.ayrshare.com/docs/apis/post/social-networks/tiktok)). Entry price is $149 per month ([Blotato](https://www.blotato.com/blog/ayrshare-alternatives)). | Official + Secondary |

**Why HeyGen is the primary avatar.** It renders a new talking head for every script, so 30 videos a month do not reuse the same base clip. It accepts your own audio, which keeps the voice stage independent. 2026 reviews rank it first on likeness, but nearly all of those reviews are affiliate or vendor blogs ([Techsy](https://techsy.io/en/blog/best-ai-avatar-generators-2026); [FrankX](https://www.frankx.ai/blog/heygen-vs-synthesia-vs-argil-2026)). The Sync fallback re-mouths real phone clips of you, so head movement and hands are real. It costs about the same, but lipsync-2-pro regenerates only a 512x512 face region, which can look soft in a close-up ([Sync docs](https://sync.so/docs/introduction)). The 4K-native sync-3 model needs a test. Argil is a third option: its API is already shaped like a Reel, with per-moment gestures and B-roll, but reviewers rank it below HeyGen on realism, and its video-based avatar creation is deprecated ([Argil API](https://docs.argil.ai/api-reference/endpoint/videos.create); [Argil avatar docs](https://docs.argil.ai/api-reference/endpoint/avatars.create.video)).

**Why Google is the primary B-roll provider.** The repo already uses `@google/genai`, so Veo, Nano Banana and the critic share one key. lessons-learnt.txt records that extra vendors added setup and rotation work for no gain at this scale. fal is the single fallback and covers Kling 3.0 and FLUX.2. Buy no-audio clips where possible, because B-roll plays under your voice. Budget on generated seconds, not used seconds, because models have minimum clip lengths.

**What this design does not use.** Submagic and ZapCap add captions, zooms and auto B-roll in one call, but their auto B-roll is stock chosen by AI, and they hide the edit grammar ([PyPI submagic-mcp-server](https://pypi.org/project/submagic-mcp-server/1.0.3/); [ZapCap API](https://zapcap.ai/api/)). Midjourney has no official API, and its terms ban automation ([Unifically](https://unifically.com/blogs/midjourney-api)). Suno has no official public API ([Music Business Worldwide](https://www.musicbusinessworldwide.com/suno-explores-developer-api-seeking-apps-that-unlock-experiences-generative-music-makes-possible-for-the-first-time/)). Platform trending sounds need the in-app editor, so an automated render cannot use them.

**Render rules.** Export one master for all four platforms: 1080x1920, 30 fps constant, H.264, AAC, about 10 Mbps, MP4 with `+faststart` ([FFmpeg Micro](https://www.ffmpeg-micro.com/blog/tiktok-video-specs-that-survive-the-upload-and-the-posting-api); [ShortSync](https://www.shortsync.app/resources/youtube-shorts-upload-requirements-2026)). Keep every video at 90 seconds or less, because the Facebook Reels API accepts 3 to 90 seconds ([Meta Reels Publishing API](https://developers.secure.facebook.com/documentation/video-api/guides/reels-publishing)). Keep captions and on-screen text inside the box x 120 to 888 and y 288 to 1248. This box combines the strictest Shorts, TikTok and Meta margins ([revid](https://www.revid.ai/youtube-shorts-safe-zone); [AdaptlyPost](https://adaptlypost.com/blog/social-media-safe-zones-2026-complete-guide); [Lilach Bullock](https://www.lilachbullock.com/instagram-reels-safe-zone/)). Label: Estimate from Secondary figures.

## The script agent outputs one JSON shot list that drives every stage

The Script Agent returns this shape through structured outputs. Code then validates it again with zod, as the repo already does. Every later agent reads from it, and no agent repairs JSON by hand.

```json
{
  "schema_version": "1.0",
  "video_id": "vid-2026-11-02-01",
  "brand_id": "creator_main",
  "version": 1,
  "source_input": "OpenAI released X today. My take: Y.",
  "target_duration_s": 55,
  "max_duration_s": 90,
  "word_count": 148,
  "words_per_minute": 160,
  "title": "X is not the story. Y is.",
  "hook_variants": [
    "Everyone is talking about X. They are missing Y.",
    "X came out today. Here is the part that matters.",
    "Stop reading the X benchmarks. Look at Y."
  ],
  "selected_hook": 0,
  "locked_attributes": {
    "avatar_id": "heygen_twin_look_a",
    "voice_id": "eleven_pvc_main",
    "voice_model": "eleven_v4",
    "caption_style": "bold_upper_active_word_v1",
    "music_bed_id": "pulse-07",
    "approved_segments": []
  },
  "segments": [
    {
      "index": 0,
      "role": "hook",
      "spoken_line": "Everyone is talking about X. They are missing Y.",
      "tts_text": "Everyone is talking about X. They are missing Y.",
      "est_duration_s": 3.2,
      "visual": {
        "type": "avatar",
        "framing": "close_up",
        "punch_in_scale": 1.12,
        "motion_prompt": "leans in slightly, one short hand gesture on 'missing'"
      },
      "on_screen_text": "X IS NOT THE STORY",
      "caption_emphasis": ["missing", "Y"],
      "sfx": [{ "id": "pop_02", "at_s": 0.0 }],
      "claims": []
    },
    {
      "index": 1,
      "role": "body",
      "spoken_line": "Today OpenAI shipped X, and the launch post says one thing that matters.",
      "tts_text": "Today OpenAI shipped X, and the launch post says one thing that matters.",
      "est_duration_s": 4.5,
      "visual": {
        "type": "screenshot",
        "source_url": "https://example.com/announcement",
        "duration_s": 3.0,
        "motion": "slow_zoom_in"
      },
      "on_screen_text": "",
      "caption_emphasis": ["X"],
      "sfx": [{ "id": "whoosh_01", "at_s": 0.0 }],
      "claims": [
        { "text": "OpenAI released X today", "fact_id": "f1" }
      ]
    },
    {
      "index": 2,
      "role": "pattern_interrupt",
      "spoken_line": "Here is why Y matters more.",
      "tts_text": "Here is why Y matters more.",
      "est_duration_s": 2.4,
      "visual": {
        "type": "generated_video",
        "provider_hint": "veo-3.1-lite",
        "prompt": "vertical 9:16, slow push-in on a desk at night, no text, no logos, no people",
        "duration_s": 2.4,
        "generate_duration_s": 4,
        "fallback_type": "generated_still"
      },
      "on_screen_text": "WHY Y",
      "caption_emphasis": ["Y"],
      "sfx": [{ "id": "riser_01", "at_s": 0.0 }],
      "claims": []
    }
  ],
  "cta": { "segment_index": 8, "text": "Follow for one AI update a day." },
  "disclosure": {
    "on_screen_text": "Made with an AI version of me",
    "platform_ai_label": true
  },
  "post_copy": {
    "youtube": { "title": "...", "description": "...", "contains_synthetic_media": true },
    "instagram": { "caption": "...", "ai_label": true },
    "facebook": { "description": "...", "ai_label": true },
    "tiktok": { "caption": "...", "is_aigc": true, "privacy_level": "creator_selects" }
  }
}
```

The allowed `visual.type` values are `avatar`, `generated_video`, `generated_still`, `screenshot`, `post_card`, `stock`, `chart` and `screen_recording`. `generate_duration_s` is the model's minimum clip length, and the Compose Agent trims to `duration_s`. `tts_text` holds phonetic respellings, because Eleven v4 has no SSML ([ElevenLabs v4 docs](https://elevenlabs.io/docs/overview/capabilities/text-to-speech/eleven-v4)). `fact_id` points into the fact pack, which holds the source URL. These five rules apply to every shot list:

1. Budget 150 to 165 spoken words per minute: about 75 to 85 words for 30 s and 225 to 250 words for 90 s.
2. Give every factual claim a `fact_id`. A claim without a source blocks the video.
3. Put all headline text in `on_screen_text`. The compositor draws it with fixed fonts, so image models never bake in text.
4. Draw charts from data in the compositor. Image models invent numbers.
5. Never give the avatar a first-hand experience that did not happen. FTC endorsement rules apply to avatars ([Promise Legal](https://blog.promise.legal/startup-central/ftc-ai-disclosure-rules-creators-2026/)).

The style input is a written profile, not a fine-tuned model. Feed 20 to 50 past transcripts to an extraction prompt. It returns a versioned JSON profile: openers, sentence length, catchphrases, humour, banned words, CTA lines and pacing. At script time, send the profile, 3 to 5 nearest exemplar scripts by topic, the fact pack and your take. Few-shot is the cheaper start, and fine-tuning can reduce output variety ([ertas.ai](https://www.ertas.ai/compare/fine-tuning-vs-few-shot)). Label: Estimate for the design, Secondary for the method.

## The creator records about 90 minutes once

Do this in one session, in one place, with one camera and one microphone. Record the consent video in the same session as the avatar footage, because HeyGen requires that.

| # | Item | Spec | Why | Source |
|---|---|---|---|---|
| 1 | Avatar training footage, 2 to 3 looks | 2 to 3 min per look. 1080p or higher (4K if possible). H.264 MP4. Tripod. Even light. Talk naturally with varied sentences. Look at the lens. Keep hands below the chin and the mouth clear. | HeyGen API minimum is 30 s at 720p. About 2 min at 1080p gives the best twin. More looks reduce visible repetition across 30 videos. | [HeyGen API reference](https://docs.heygen.com/reference/submit-video-avatar-creation-request.md); [HeyGen docs](https://developers.heygen.com/docs/avatar-from-video) |
| 2 | Framing test | Record one look framed vertical and one in 4K landscape with you centred. A 9:16 crop of 4K landscape is 1215x2160, which is larger than 1080x1920. | No source confirms 9:16 output for twins on the pay-as-you-go API. Phase 2 tests both. | Estimate |
| 3 | Consent video | Same person, same session, submitted with the footage. Under 30 s (help centre) or 35 s (developer docs). Film it directly. Screen recordings are rejected. Read the statement HeyGen shows. | Required for every video-based twin. Enterprise may waive it (Conflict). | [HeyGen consent docs](https://developers.heygen.com/docs/avatar-consent); [HeyGen help](https://help.heygen.com/en/articles/12092609-recording-your-consent-video) |
| 4 | Voice training audio | At least 30 min, 3 h is best. One speaker. No music, noise or effects. Clean archive audio from past videos also works. Read in your reel energy, with numbers, names and questions. | Professional Voice Clone data guidance. It comes from an older ElevenLabs post, so verify it. | [ElevenLabs blog (older)](https://elevenlabs.io/blog/create-a-perfect-digital-copy-of-your-voice-and-speak-the-languages-you-dont) |
| 5 | Quick voice sample | 1 to 5 min of clean audio. | Creates an Instant Voice Clone in minutes, so work can start while the PVC trains (3 to 6 h). | [ElevenLabs landing page](https://start.elevenlabs.io/voice-cloning/v5); [ElevenLabs help](https://elevenlabs.io/docs/help-center/product/voices/voice-cloning/when-will-my-professional-voice-clone-pvc-be-ready) |
| 6 | Live voice check | Be present when the PVC is created. You read a text CAPTCHA aloud within 10 s. | ElevenLabs PVC verification. It cannot be pre-recorded. | [ElevenLabs PVC guide](https://elevenlabs.io/docs/eleven-api/guides/how-to/voices/professional-voice-cloning) |
| 7 | Pronunciation list | 30 to 50 terms you say often (companies, products, acronyms), each with how you say it. | Varun's team fixes mispronounced words every week. | [YourStory](https://yourstory.com/2026/01/ai-authenticity-the-creators-edge-lessons-from-varun-mayya) |
| 8 | Real base clips | 10 to 20 vertical phone clips, 30 to 60 s each, varied framing and gestures, mouth clear. | Input for the Sync fallback and for "real" segments. | Estimate |
| 9 | Style inputs | 20 to 50 past transcripts, 3 to 5 best scripts marked as exemplars, a list of catchphrases, CTA lines, banned words and firm opinions. | Builds the style profile. | Estimate |
| 10 | Video brand kit | Caption font and colours, logo, disclosure wording. Fonts load from npm packages, as DESIGN.md requires for the dashboard. | DESIGN.md covers the dashboard only. Video caption style needs your approval. | Repo |
| 11 | Accounts | Instagram professional account, a Facebook Page, a TikTok account, a YouTube channel, and admin access to create a Meta app, a TikTok developer app and a Google Cloud project. | Facebook Reels publish to Pages only. Instagram needs a professional account. | [Apify](https://apify.com/dami_studio/social-media-uploader-pro); [PostProxy](https://postproxy.dev/blog/instagram-reels-api-publishing-guide/) |
| 12 | Data terms | Ask each vendor in writing to exclude your face and voice from model training. | Captions offers training exclusion only on Enterprise. Higgsfield can train on user content. | [The Rundown](https://www.therundown.ai/tools/captions); [Higgsfield Help](https://higgsfield.ai/creator-hub/help-center/account/who-owns-my-generations-and-can-i-use-them-commercially) |

The session takes about 90 minutes if you read new voice audio, and about 40 minutes if clean archive audio feeds the PVC. Label: Estimate.

## A typical month costs about $280, and the avatar is half of it

Assumptions: 30 videos, 30 to 90 s each, so 15 to 45 avatar minutes per month. Low uses an Instant Voice Clone, short videos, few generated clips and direct publishing. Typical is the recommended stack with 60-second videos and about 1.3x retries. High uses 90-second videos, 1.5x retries, premium stills, a Remotion company license and Ayrshare.

| Line item | Low | Typical | High | Basis |
|---|---|---|---|---|
| Research search (Brave) | $0 | $5 | $10 | $5 per 1,000 requests ([fastcrw](https://fastcrw.com/blog/web-search-api-pricing-2026)) |
| Script, style and revision LLM | $3 | $6 | $15 | About $0.16 per Opus 5.5 script ([Anthropic pricing](https://platform.claude.com/docs/en/about-claude/pricing)) |
| Voice (ElevenLabs plan) | $6 | $22 | $99 | Starter, Creator, Pro ([Cartesia explainer](https://www.cartesia.ai/learn/elevenlabs-pricing); [bigvu](https://bigvu.tv/blog/elevenlabs-pricing-2026-plans-credits-commercial-rights-api-costs/)) |
| Avatar render (HeyGen API wallet) | $45 | $150 | $330 | 15 to 45 min at $3 to $4.83 per min, with retries ([HeyGen help](https://help.heygen.com/en/articles/11269603-heygen-avatar-iv-complete-guide); [eesel](https://www.eesel.ai/blog/heygen-pricing)) |
| HeyGen web plan, only if twin setup needs it | $0 | $0 | $29 | About $29 per month entry ([HeyGen pricing](https://www.heygen.com/pricing)) |
| B-roll motion clips (Veo 3.1 Lite or Fast) | $15 | $55 | $150 | 300 to 1,500 generated seconds at $0.05 to $0.10 ([benchlm](https://benchlm.ai/media-pricing/veo)) |
| B-roll stills (Nano Banana 2 or FLUX.2) | $5 | $10 | $40 | 120 to 300 stills at $0.04 to $0.134 ([BFL](https://docs.bfl.ai/quick_start/pricing.md); [MyArchitectAI](https://www.myarchitectai.com/blog/nano-banana-api-pricing)) |
| Screenshots | $0 | $12 | $29 | Free tier, ScreenshotOne, Urlbox ([dev.to](https://dev.to/custodiaadmin/screenshot-api-pricing-compared-pagebolt-vs-screenshotone-vs-urlbox-vs-capturekit-2026-13fh)) |
| Music and SFX | $0 | $5 | $15 | $0.15 per minute, library made once ([ElevenLabs](https://elevenlabs.io/eleven-music-api)) |
| Render compute (Vercel Sandbox) | $3 | $5 | $10 | About $0.11 per render, to measure ([Vercel Sandbox pricing](https://vercel.com/docs/sandbox/pricing)) |
| Remotion license | $0 | $0 | $100 | Free for individuals and companies of up to 3 employees. "Remotion for Automators" has a $100 monthly minimum ([Remotion license file](https://cdn.jsdelivr.net/npm/@remotion/bundler@4.0.490/LICENSE.md); [Remotion FAQ](https://www.remotion.dev/docs/license/faq)) |
| Gemini Critic QA | $1 | $5 | $10 | Estimate. Measure it from the current Gemini bill. |
| STT check | $0 | $1 | $1 | Under $0.35 at 45 audio minutes ([Cekura](https://www.cekura.ai/blogs/assemblyai-pricing)) |
| Publishing | $0 | $0 | $149 | Direct APIs are free. Ayrshare entry is $149 ([Blotato](https://www.blotato.com/blog/ayrshare-alternatives)) |
| **Total per month** | **about $78** | **about $276** | **about $987** | |

The avatar line is 54% of the typical month. The Sync fallback costs about the same ($45 to $225 plus a $19 to $49 plan), so switching architecture does not change the budget much. LatentSync on fal costs $4.50 to $13.50 a month, but papers report it often fails to change mouth shape ([fal LatentSync](https://fal.ai/models/fal-ai/latentsync); [OmniSync paper](https://arxiv.org/pdf/2505.21448)). The table excludes your existing Vercel, Supabase and Telegram costs and any one-time HeyGen twin fee, which no source states. HeyGen API credits are separate from web plan credits, and they expire 12 months after purchase ([HeyGen help](https://help.heygen.com/en/articles/10060327-heygen-api-pricing-explained)). During the TikTok audit wait, add the $149 Ayrshare bridge to the typical month. Label: Estimate from Official, Secondary and Conflict prices.

## Gemini Critic catches most failures before Telegram

The QA pass runs in two layers before any video reaches you.

**Layer 1: deterministic checks in code (free, fast).** ffprobe confirms 1080x1920, 30 fps, H.264, AAC 48 kHz and a duration of 90 s or less. The avatar clip duration must match `voice.wav` within 100 ms. An STT pass on the avatar clip must match the script, which proves HeyGen used your audio. Caption tokens must equal script tokens, so brand names stay correct. Every caption box must sit inside the safe box. Every claim must have a `fact_id`. Every asset must have a license record. The video spend must stay under the per-video cap.

**Layer 2: the Gemini Critic.** It receives the final MP4, the shot list, the fact pack and a structure summary of your last 10 approved videos. It uses the existing verdicts and issue categories, with a timestamp and a fix per issue. `APPROVE` and `APPROVE_WITH_MINOR_ISSUES` go to Telegram. `SURGICAL_REGENERATION` re-runs only the listed segments, at most twice and inside the budget cap, then goes to Telegram with the issue list. `ABANDON` goes to Telegram with the reason and never posts.

| Failure | Evidence it happens | How the pipeline catches it | Automatic action |
|---|---|---|---|
| Voice mispronounces a name | Varun's team fixes it weekly ([YourStory](https://yourstory.com/2026/01/ai-authenticity-the-creators-edge-lessons-from-varun-mayya)) | STT word match against the script | Re-voice that segment with a respelling. If it fails twice, flag the line in Telegram. |
| v4 ignores an audio tag or varies between takes | Developer reports ([chaptercast](https://github.com/robbe1999/chaptercast/pull/19); [livekit-avatar](https://github.com/peted70/livekit-avatar/issues/1)) | Per-segment duration and STT checks | Regenerate that segment only. |
| Avatar ignores the uploaded audio | HeyGen forum report on an older API path ([HeyGen forum](https://docs.heygen.com/discuss/67f693cca0b91d0068155a8b)) | Duration match and STT on the avatar clip | Resubmit. Then try the other engine. |
| Blurred or fused teeth, mouth patch seams | Dubbing research and vendor posts ([TBDub paper](https://arxiv.org/pdf/2609.06144); [Sync blog](https://sync.so/blog/why-ai-lip-sync-looks-fake)) | Critic `lip_sync` and `artifact` | Re-render the segment, or cover it with B-roll. |
| Lip drift, identity or colour drift on long clips | Avatar research ([Kling-Avatar paper](https://arxiv.org/pdf/2509.09595); [AvatarForcing paper](https://arxiv.org/pdf/2603.14331)) | Critic `consistency` | Keep each avatar render at 60 s or less. Split longer runs at B-roll cuts. |
| Distorted or frozen hands | Talking-head research ([SoulX-FlashTalk paper](https://arxiv.org/pdf/2512.23379)) | Critic `realism` | Lower the motion prompt, or cut to B-roll. |
| A B-roll model disappears | Sora API removed, Veo preview IDs retired ([The Decoder](https://the-decoder.com/openai-sets-two-stage-sora-shutdown-with-app-closing-april-2026-and-api-following-in-september/); [aiidelist](https://aiidelist.com/blog/veo-3-1-api-pricing-comparison)) | Provider error code | Use the next provider in the config chain. |
| Fake text, numbers or logos in B-roll | Luma and Seedance policies flag logos ([Luma policy](https://luma.ai/content-policy); [Newly](https://newly.app/guides/seedance-2-0-content-restrictions-workarounds)) | Critic `artifact` plus the overlay-text rule | Regenerate with "no text, no logos", or use a still. |
| Factual error in the script | Estimate | Claim check against the fact pack | Block and ask you in Telegram. |
| Caption misspells a brand | STT errors on names | Captions come from TTS timing, plus token equality | Fix automatically. |
| Caption under platform buttons | Safe-zone figures above | Bounding-box check | Move the caption layer. |
| Video longer than 90 s | Facebook Reels cap | Word budget plus ffprobe | Shorten the script, then regenerate. |
| Music copyright claim | Pixabay tracks in Content ID ([Sonilo](https://sonilo.com/blog/comparisons/pixabay-music-sound-effects-alternatives-2026)) | Library-only rule with license records | Block unknown tracks. |
| Paying twice after a resume | Estimate | Job IDs stored in Supabase before each wait | Reuse the stored result. |
| Duplicate post after a retry | Repo idempotency pattern | One claim key per platform, post ID stored | Skip the second post. |
| YouTube or Meta token expires | YouTube "Testing" refresh tokens last 7 days (prior knowledge, not verified this session) | Daily token health check | Alert you in Telegram. |
| Videos look templated | YouTube "inauthentic content" policy, renamed 15 Jul 2025 ([invideo](https://invideo.io/blog/youtube-kills-ai-faceless-channels/); [LensPOV](https://lenspov.com/articles/youtube-ai-content-demonetization-2026)) | Critic compares structure with the last 10 videos | Ask the Script Agent for a different structure. |
| HeyGen queue is slow | HeyGen says the regular queue averages "just under 24h" on weekdays ([HeyGen help](https://help.heygen.com/en/articles/9655503-heygen-video-processing-times)) | Durable workflow sleep with a timer | Tell you in Telegram. Offer the Sync path. |

## Nothing posts until the creator approves in Telegram

The orchestrator calls `interrupt()` with the video ID and version. The graph pauses, and the Postgres checkpointer saves it. Your reply arrives at `/api/telegram/webhook`, claims an idempotency key, and resumes the same thread with `Command({ resume })`. Only the orchestrator writes to you.

```
Video ready for approval: v1, 0:55
[preview.mp4, 720p]

Hook: "Everyone is talking about X. They are missing Y."
Critic: APPROVE_WITH_MINOR_ISSUES
  0:31 minor: hand blur in a gesture (B-roll covers 0:30 to 0:33)
Facts: 4 claims, 4 sources
AI label: YouTube ON, Instagram ON, Facebook ON, TikTok ON
TikTok: posting as @yourname, privacy: Public, comments: on
Spend on this video: $4.62 of $15 cap

[Approve all]   [Approve, skip TikTok]
[Fix a line]    [New B-roll]   [Other hook]   [Reject]
```

| Your reply | What resumes | What changes | What stays locked |
|---|---|---|---|
| Approve all | Publisher Agent | Nothing. Posts go out. | Everything |
| "Fix line 4: say 'ten times cheaper', not 'cheaper'" | Script Agent, segment 4 only | Segment 4 text, voice and avatar. Recompose. Critic. New approval as v2. | Avatar, voice, music, caption style, segments 0 to 3 and 5 to 8 |
| New B-roll for 6 | B-roll Agent, segment 6 only | One insert. Recompose. Critic. v2. | All other segments and the audio |
| Other hook | Script Agent, segment 0 only | Hook text, voice and avatar for segment 0 | Everything else |
| Approve, skip TikTok | Publisher Agent | TikTok is skipped. | Everything |
| Reject | Orchestrator | Run marked abandoned. No post. | Assets stay in Storage. |

Each paid regeneration shows its estimated cost before it runs, which matches the AGENTS.md rule for paid regenerations. If you do not reply in 2 hours, the durable workflow sleeps and asks again. News content goes stale, so after 24 hours the bot asks "Post anyway?" instead of posting. The Publisher creates the Instagram container only after approval, because an unpublished container expires in 24 hours ([bundle.social](https://bundle.social/blog/instagram-graph-api)).

TikTok shapes this screen. Before each Direct Post, the client must query `creator_info` and show the nickname, privacy choices, interaction toggles and a commercial-content disclosure. TikTok's audit reviews that UI ([TikTok Content Sharing Guidelines](https://developers.tiktok.com/doc/content-sharing-guidelines/); [bundle.social](https://bundle.social/blog/tiktok-api-approval)). Show the same fields on a dashboard approval page, because an auditor needs a web UI to review.

Telegram limits the size of files a bot can send. From prior knowledge, the Bot API sends files up to 50 MB and downloads up to 20 MB, but core.telegram.org could not be opened in this session. Send a 720p preview at about 3 Mbps (about 34 MB for 90 s), and keep the 1080p master in Storage behind the authenticated dashboard player. Label: Estimate, verify the limits.

## Platform gates take up to six weeks, so apply on day one

| Platform | Gate before public automated posting | Lead time | Limits | AI label through the API | Label |
|---|---|---|---|---|---|
| TikTok | Content Posting API audit. Before the audit, posts are private only (`SELF_ONLY`), accounts must be private, and at most 5 users can post in 24 h. | Several days to about 6 weeks. One case: filed 5 Sep, approved 18 Sep 2026. | About 15 Direct Posts per creator per 24 h | `post_info.is_aigc: true` on Direct Post. The inbox endpoint reportedly lacks it. | Official + Secondary ([TikTok guidelines](https://developers.tiktok.com/doc/content-sharing-guidelines/); [TikTok Direct Post reference](https://developers.tiktok.com/docs/en/content-posting-api-reference-direct-post); [PostZen](https://www.postzen.dev/blog/tiktok-api); [Breakreach](https://www.breakreach.com/developers/tiktok-api); [AdaptlyPost](https://adaptlypost.com/blog/tiktok-ai-generated-label)) |
| YouTube Shorts | OAuth consent screen verification for the upload scope (not confirmed this session). Unverified projects created after 28 Jul 2020 may upload as private only (Conflict on current status). | Unknown. Verify in Google Cloud docs. | Default 100 `videos.insert` calls per day. No Shorts flag: vertical video up to 3 min becomes a Short. | `status.containsSyntheticMedia: true` on insert or update | Official + Conflict ([Google quota docs](https://developers.google.com/youtube/data/guides/quota_and_compliance_audits); [Upload-Post](https://www.upload-post.com/youtube-api/); [GitHub issue](https://github.com/igormcsouza/aurora/issues/1); [YouTube revision history](https://developers.google.com/youtube/v3/revision_history); [bundle.social](https://bundle.social/blog/youtube-shorts-api-secrets)) |
| Instagram Reels | Meta app with Instagram API with Instagram Login, permission `instagram_business_content_publish`, Standard or Advanced Access. Business or Creator account (Conflict). | Unknown. Standard Access for your own account may avoid full App Review (unconfirmed). | 50 API posts per 24 h (older pages say 100 or 25). Query `content_publishing_limit`. | Native field not confirmed. Ayrshare sets the "AI info" label with `isAIGenerated`. | Official + Conflict ([Meta docs](https://developers.facebook.com/docs/instagram-platform/content-publishing/); [Ayrshare Instagram docs](https://www.ayrshare.com/docs/apis/post/social-networks/instagram)) |
| Facebook Reels | Page only, through `POST /{page_id}/video_reels`. Page permissions are likely `pages_manage_posts`, `pages_read_engagement` and `pages_show_list` (unconfirmed). | Unknown | 30 API Reels per Page per 24 h. 3 to 90 s. 9:16. | No source found | Official ([Meta Reels Publishing API](https://developers.secure.facebook.com/documentation/video-api/guides/reels-publishing)) |

Always read back each post after publishing. For YouTube, check that `privacyStatus` is public. A private result means the project hits the unverified-project restriction.

Every platform and two legal regimes require a label on a realistic AI clone of a real person. The pipeline labels every video, every time.

| Rule | What it requires | Pipeline action |
|---|---|---|
| TikTok policy | Label AI visuals or audio of realistic people, including a creator's own avatar. TikTok reads C2PA and auto-labels, and you cannot remove an auto-label. ([Pixo](https://pixo.video/blog/tiktok-ai-label-compliance-guide); [Billo](https://billo.app/blog/ai-labeling/)) | Send `is_aigc: true`. |
| YouTube policy | Use the "Altered or synthetic content" disclosure when a real person appears to say things they did not say. Disclosure "won't limit a video's audience or impact its eligibility to earn money." ([air.io](https://air.io/en/youtube-hacks/youtube-ai-disclosure-in-2026-label-it-yourself-or-youtube-will)) | Send `containsSyntheticMedia: true`. Vary structure to avoid the inauthentic-content policy. |
| Meta policy | Self-label realistic AI video and audio. Meta also reads C2PA and IPTC markers. ([SignUnder](https://signunder.com/labels/meta); [AlternativeTo](https://alternativeto.net/news/2024/2/meta-will-start-labeling-ai-generated-content-across-facebook-instagram-and-threads)) | Use the API field if it exists. If not, add a manual "toggle AI label" step to the Telegram approval and keep the on-screen line. |
| EU AI Act Article 50 | Deployers must disclose deepfakes from 2 Aug 2026, with no delay. ([aiimagelabel.eu](https://aiimagelabel.eu/eu-ai-labelling-law); [Bird & Bird](https://www.twobirds.com/en/insights/2026/digital-omnibus-on-ai-provisional-agreement-reached-at-the-may-trilogue)) | On-screen line "Made with an AI version of me" plus platform labels. |
| India IT Rules and ASCI | Platforms must ask users to declare synthetic audio and video (rules notified 10 Feb 2026). ASCI (Sep 2026) requires labels on synthetic ambassadors in ads. ([Lexology](https://www.lexology.com/library/detail.aspx?g=adb2714c-1188-43e3-b62b-eb6649727f6e); [Medianama](https://www.medianama.com/2026/10/223-asci-ai-labelling-guidelines-advertising-2026/)) | The API AI flags answer the declaration. Label every sponsored or self-promotion video. |
| FTC Endorsement Guides | Avatars count as endorsers. Disclose material connections. No invented experiences. ([Promise Legal](https://blog.promise.legal/startup-central/ftc-ai-disclosure-rules-creators-2026/)) | Script rule 5 and a sponsor field in `post_copy`. |

Google outputs carry a SynthID watermark that cannot be switched off, and OpenAI adds C2PA credentials ([rgb.ir](https://rgb.ir/en/learn/graphic-design/ai-image-watermark/); [OpenAI](https://openai.com/index/advancing-content-provenance)). Do not strip this metadata. Set the labels yourself so they stay consistent. Disclosure did not hurt Varun's views, per YourStory, and TikTok says the AI setting "won't affect the distribution" of a compliant video, as quoted by Ayrshare ([Ayrshare TikTok docs](https://www.ayrshare.com/docs/apis/post/social-networks/tiktok)).

## Six phases reach a first public post in about six weeks

The TikTok audit sets the timeline, so platform applications start in Phase 0 and run alongside the build.

### Phase 0: rules, accounts and applications (days 1 to 3)

**Goal:** Remove the repo blockers and start the slow approvals.

**Steps:**
1. You decide the scope rule. Then change CLAUDE.md, AGENTS.md and the README, or create a new repo.
2. You amend the paid-generation rule. Higgsfield stays manual. Other paid calls run under a per-video and monthly cap.
3. You decide the signed-URL exception for the Publisher step.
4. Create the Meta app, the TikTok developer app and the Google Cloud project.
5. Submit the TikTok audit and the Google OAuth verification.
6. Plan a `brand_id` column and a creator facts file that mirrors `src/lib/product.ts`.

**Risks:** TikTok often rejects on the website and posting UI, not the API calls ([bundle.social](https://bundle.social/blog/tiktok-api-approval)). Google verification time is unknown.

**Done criteria:** The rule changes are merged with your approval. Three developer apps exist. The TikTok audit is submitted.

### Phase 1: onboarding, voice and script (weeks 1 to 2)

**Goal:** A text in Telegram returns a script and a voice track that sound like you.

**Steps:**
1. Record the onboarding session from the checklist.
2. Create an Instant Voice Clone. Then train the Professional Voice Clone and compare both on v4.
3. Extract style profile v1 from your transcripts. Store it as versioned JSON in Supabase.
4. Build the Fact Pack and Script Agents as structured-state specialists with zod schemas.
5. Run a blind test: Claude Opus 5.5 against Gemini 3.1 Pro on 10 of your inputs.
6. Build the Voice Agent: per-segment TTS with timing JSON, stored in private Storage.

**Risks:** No source confirms PVC quality on v4. Few-shot style can drift on some topics ([PromptHub](https://www.prompthub.us/blog/the-few-shot-prompting-guide)).

**Done criteria:** You rate at least 8 of 10 scripts "sounds like me." Every claim has a source. STT finds no errors on your pronunciation list.

### Phase 2: avatar (weeks 2 to 3)

**Goal:** Script audio becomes a lip-synced 9:16 talking head with no manual step.

**Steps:**
1. Create the HeyGen twin with the consent video. Confirm which API tier allows twin creation.
2. Render the same 3 audio tracks on Avatar IV, on Avatar V, and with Sync on your base clips.
3. Add the webhook or polling step to the durable workflow. Store job IDs before each wait.
4. Measure cost per minute, queue time and 9:16 output quality.

**Risks:** 9:16 twin output on pay-as-you-go is unconfirmed. HeyGen sources conflict on `motion_prompt` support for Avatar V ([HeyGen changelog](https://developers.heygen.com/changelog); [HeyGen guide](https://developers.heygen.com/generate-avatar-video)). An older page says twin creation by API is Enterprise-only ([HeyGen docs](https://docs.heygen.com/docs/video-avatars-api)).

**Done criteria:** 5 of 5 renders pass your blind review. Measured cost per minute and 90th-percentile render time are recorded.

### Phase 3: B-roll, composition, captions and music (weeks 3 to 5)

**Goal:** Any valid shot list renders to a finished 1080x1920 MP4.

**Steps:**
1. Build one B-roll job interface for Google and fal, with model IDs in config.
2. Build card templates: news card, post card and chart.
3. Generate the music and SFX library once. Store license records with each file.
4. Build the Remotion composition: avatar spine, inserts, punch-ins, captions from timing JSON, music ducking and the safe box.
5. Render in Vercel Sandbox and upload the result to Supabase Storage.

**Risks:** `@remotion/vercel` is experimental. Render time is unmeasured. A company of 4 or more people needs a paid Remotion license. Remotion conflicts with the "lightweight" rule.

**Done criteria:** 10 test videos render end to end with no manual step. All pass the ffprobe spec and the safe-box check.

### Phase 4: QA and Telegram approval (weeks 5 to 6)

**Goal:** Only checked videos reach you, and every fix is surgical.

**Steps:**
1. Add the Layer 1 deterministic checks.
2. Extend the Gemini Critic inputs and checks.
3. Add the approval `interrupt()`, the buttons and the cost display.
4. Enforce segment-only revisions in code after model output.

**Risks:** Critic false alarms waste money. Telegram file limits are unverified.

**Done criteria:** 10 videos in a row reach Telegram with a critic report. A "fix line 4" request changes only segment 4, and all locked attributes stay byte-identical.

### Phase 5: publishing and labels (weeks 4 to 7, gated by audits)

**Goal:** One approval posts to all four platforms with AI labels set.

**Steps:**
1. YouTube: resumable upload with `containsSyntheticMedia` and an explicit privacy status. Read it back.
2. Instagram: create the container, poll `status_code` until `FINISHED`, then publish.
3. Facebook: publish to the Page through `video_reels`.
4. TikTok: query `creator_info`, then Direct Post with `is_aigc`. Use Ayrshare until your audit passes.
5. Claim one idempotency key per platform. Store each post ID. Send the four links to Telegram.

**Risks:** The YouTube private-upload restriction. The unknown Instagram and Facebook AI-label fields. The signed-URL rule.

**Done criteria:** 5 approved videos are live on all four platforms. The label is visible on each live post. There are no duplicate posts.

### Phase 6: daily operation (week 7 onward)

**Goal:** Run 30 videos a month inside the budget.

**Steps:**
1. Enforce the monthly cap in code.
2. Review the pronunciation list weekly.
3. Refresh the style profile monthly from approved scripts.
4. Optional: pull platform analytics to tune hook and cut density.

**Risks:** Vendor price changes and model removals.

**Done criteria:** 30 videos in one month, total cost inside the cap, and no more than one quality rejection per week.

## Decide these before any code is written

| # | Decision | Options | Recommendation |
|---|---|---|---|
| 1 | Where the creator brand lives | Same repo with `brand_id` and changed rules, or a new repo | A new repo that reuses this code, unless you want one dashboard for both brands |
| 2 | Paid-generation policy | Approve every paid call in Telegram, or allow automatic calls under caps | Automatic under a $15 per-video and a monthly cap. Approval above the cap. |
| 3 | Avatar architecture | HeyGen twin, Sync on real clips, or a mix | HeyGen first, Sync as fallback, decided by the Phase 2 blind test |
| 4 | Script gate | Approve the script before the paid avatar render, or approve the final video only | Script gate on for the first 2 weeks, then off |
| 5 | Script model | Claude (new vendor) or Gemini (already in repo) | Decided by the Phase 1 blind test |
| 6 | Compositor | Remotion or FFmpeg | Remotion, if you accept the dependency and confirm the license |
| 7 | Publishing route | Direct APIs, or Ayrshare for some or all platforms | Direct APIs, with Ayrshare for TikTok during the audit |
| 8 | Content scope | AI news only, or also Aura Desktop promotion | If any video promotes Aura, `src/lib/product.ts` claims and ad-label rules apply |
| 9 | Audience regions | Global, EU, India | Assume EU and India rules apply, and label everything |
| 10 | Disclosure wording and position | Caption only, on-screen at start, or on-screen throughout | On-screen at start plus platform labels. India's continuous-label draft has unknown status ([verda.ai](https://verda.ai/compliance/india-it-rules-ai-content/)). |
| 11 | Caption style and fonts | A Hormozi-style bold all-caps font ([Fluxnote](https://fluxnote.io/guides/how-to-make-alex-hormozi-style-captions)) or your own brand fonts | Your call, because DESIGN.md does not cover video |
| 12 | Monthly budget ceiling | $100, $300, $500 or more | $300 for the first month, then adjust from measured cost |
| 13 | Account readiness | Facebook Page exists? Instagram Business or Creator? | Confirm both before Phase 0 ends |
| 14 | Posting time and time zone | One fixed time, or per-platform times | One time per day after approval, per platform |
| 15 | Raw footage retention | Keep, or delete after twin creation | Keep in private Storage. Request training exclusion from vendors. |

## Verify these on live vendor pages before paying

| Vendor | What to check | Why it matters |
|---|---|---|
| ElevenLabs | Creator plan price and credits. PVC support on Eleven v4. Commercial terms for cloned voices. Eleven Music terms for monetized social posts. v4 price per 1,000 characters ($0.08 or $0.10). | Voice quality and rights |
| HeyGen | Twin price per minute on Avatar IV and Avatar V. Whether API twin creation is Enterprise-only. 1080x1920 output on pay-as-you-go. `motion_prompt` on Avatar V. Consent rules. Queue times. Whether a twin made in the web app works in the API. | Half the budget, and the core visual |
| Sync | Price per second ($0.05 or $0.083). sync-3 API price. | Fallback cost |
| Google | Veo 3.1 GA model IDs, Lite and Fast prices, 9:16 support and clip lengths. Nano Banana 2 price. | B-roll cost and stability |
| Black Forest Labs | FLUX.2 [pro] price at 2 megapixels | Still fallback cost |
| Remotion | License terms for your company size. Remotion 5.0 license changes. `@remotion/vercel` status. | $0 or $100+ per month |
| Vercel | Sandbox price and plan limits | Render cost and session length |
| TikTok | Content Sharing Guidelines, audit steps, `is_aigc`, `creator_info` UX rules | Public posting |
| YouTube and Google Cloud | OAuth verification for the upload scope. Refresh-token life in "Testing" mode. Unverified-project private restriction. `containsSyntheticMedia`. | Unattended daily upload |
| Meta | Instagram Login permission and access level. Account types. Native AI-label field. Facebook Reels permissions and AI label. | Instagram and Facebook posting |
| Telegram | Bot API send and download size limits. core.telegram.org must be allowed in the session network settings to check this. | Preview delivery |
| Ayrshare | Price. YouTube synthetic-media flag support. | TikTok bridge |
| Brave | Current free monthly credit | Research cost |

## Conclusion

The hard part of this system is not generation. Every generation stage has a working API today, and together they cost about $9 per video in a typical month. The hard parts are platform approvals, vendor churn and quality control. Within about one month, OpenAI removed Sora from its API and Google retired the Veo preview IDs. PlayHT shut down with its voice clones. So the most valuable code is not a model call. It is the job interface with model IDs in config, the stored job IDs that make resumes free, and the segment-level revision that keeps locked attributes intact.

The second insight is that your daily take is both the product and the policy shield. YouTube penalises templated, mass-produced videos, and Kwebbelkop failed because the human left the content. Varun and Vaibhav succeed with their own face, their own opinion and open disclosure. This pipeline can match their format in about six weeks. It cannot promise their polish without a human pass, so judge it with a test, not a claim. Show 10 pipeline videos and 10 filmed videos to a small blind panel, and change course when the results come in.

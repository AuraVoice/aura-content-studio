# B-roll Generation for an Automated Short-Form Video Pipeline (as of 31 Oct 2026)

Research method note: this session's network policy blocked WebFetch on every official vendor domain tried (ai.google.dev, platform.openai.com, docs.dev.runwayml.com, and the third-party invideo.io). All findings below come from WebSearch result summaries, which mostly cite third-party trackers, resellers and blogs, not the vendors' own pricing pages. Treat every price as "reported, verify before budgeting". Where sources conflict, both figures are listed. Workload assumed throughout: 30 videos/month x 4 to 10 inserts x 2 to 5 s, vertical 9:16 = 120 to 300 inserts/month, roughly 600 to 1,500 generated seconds/month if every insert were a 5 s video clip.

## Key Question 1: Which video models have API access, what do they cost per 5 s clip, and which support 9:16, image-to-video and native audio?

### Takeaway
Two big deprecations reshape the shortlist: OpenAI removed the Sora 2 API on 24 Sep 2026, and Google's Veo 3.1 *preview* endpoint IDs were scheduled to shut down 22 Oct 2026 (use GA IDs). The cheapest credible API options for 5 s vertical B-roll are Veo 3.1 Lite (~$0.25 per 5 s at 720p), Grok Imagine (~$0.25 to $0.35), Luma Ray 3.2 (~$0.30 at 720p), Kling 3.0 (~$0.42 at 720p, no audio) and Gemini Omni 1.1 Flash (~$0.50 at 720p); premium tiers (Veo 3.1 Standard ~$2.00, Seedance 2.0 ~$0.95 to $1.52) cost 4x to 8x more. At 600 to 1,500 s/month, a budget tier runs roughly $30 to $150/month versus $240 to $600/month for Veo 3.1 Standard.

### Cited Findings

**Deprecations and status changes (critical for an architect)**
- OpenAI notified developers on 24 Mar 2026 that the Videos API and all sora-2 / sora-2-pro models and snapshots would be removed on 24 Sep 2026; the consumer Sora app closed 26 Apr 2026. Post-shutdown, calls to those models fail and no API successor for video was named. - [The Decoder](https://the-decoder.com/openai-sets-two-stage-sora-shutdown-with-app-closing-april-2026-and-api-following-in-september/); [Zilliz FAQ](https://zilliz.com/ai-faq/what-is-the-sora-shutdown-timeline); [TechJack Solutions](https://techjacksolutions.com/ai-brief/openai-videos-api-sora-2-deprecated-september-2026/); [OpenAI Help Center](https://help.openai.com/en/articles/20001152-what-to-know-about-the-sora-discontinuation) (help center snippet predates the shutdown date; third-party sources state it as complete)
- Before shutdown, Sora 2 API pricing was $0.10/s at 720p ($0.05 batch); Sora 2 Pro $0.30/s 720p, $0.50 at 1024p, $0.70 at 1080p. Sources conflicted on whether API output carried the visible watermark (the moving watermark claim applied to the consumer app). - [Fluxnote](https://fluxnote.io/guides/sora-2-access-pricing-guide); [benchlm.ai](https://benchlm.ai/media-pricing/sora)
- Google's Gemini API Veo 3.1 *Preview* endpoints were scheduled to shut down 22 Oct 2026; new integrations should target GA model IDs (Replicate lists `veo-3.1-generate-001`). - [aiidelist.com Veo 3.1 pricing comparison](https://aiidelist.com/blog/veo-3-1-api-pricing-comparison); [LLM Reference (Replicate listing)](https://www.llmreference.com/model/veo-3.1-generate-001/replicate)
- Runway's original Aleph (video-to-video) model was listed as deprecated and deactivated 31 Jul 2026, replaced by Aleph 2.0 (`aleph2` identifier on the Runway Dev API). - [Runware docs](https://runware.ai/docs/models/runway-aleph); [flowith.io (checked 31 Jul 2026)](https://flowith.io/ai-models/runway-aleph-2/)

**Google Veo 3.1 (Gemini API)**
- Per an aggregator's read of Google's pricing page dated 11 Sep 2026: Veo 3.1 Standard $0.40/s at 720p and 1080p, $0.60/s at 4K; Veo 3.1 Fast $0.10/s 720p, $0.12/s 1080p, $0.30/s 4K (earlier Fast price was $0.15/s before a cut); Veo 3.1 Lite $0.05/s 720p, $0.08/s 1080p. No free tier for Veo 3.1. - [benchlm.ai Veo pricing](https://benchlm.ai/media-pricing/veo); [dev.to (skila.ai)](https://dev.to/skilaai/google-just-made-ai-video-50-cheaper-openai-killed-sora-heres-the-new-pricing-math-1ag4)
- Veo 3.1 Lite supports both 16:9 and 9:16 output; billing is per second, so an 8 s Lite clip is $0.40, not $0.05. - [AI API Playbook Veo 3.1 Lite guide](https://aiapiplaybook.pages.dev/blog/google-veo-3-1-lite-text-to-video-api-complete-developer-guide/); [vo3ai.com](https://www.vo3ai.com/blog/veo-31-lite-pricing-explained-is-googles-005second-ai-video-the-cheapest-api-opt-2026-04-01)
- No source found prices 9:16 differently from 16:9. - [benchlm.ai](https://benchlm.ai/md/media-pricing/veo.md)
- On Replicate, Veo 3.1 is reported at $0.40/s with audio and $0.20/s without; Veo 3.1 Fast $0.15/s with audio. - [Developers Digest (Replicate)](https://www.developersdigest.tech/models/video-generation/replicate); [LLM Reference](https://www.llmreference.com/model/veo-3.1-generate-001/replicate)

**Google Gemini Omni Flash (newer Google video model)**
- Original Omni Flash (preview): video output billed at $17.50 per 1M tokens, roughly $0.10/s of 720p; 10 s generations; no free tier. - [eesel.ai](https://www.eesel.ai/blog/gemini-omni-flash-pricing); [aireiter.com](https://aireiter.com/blog/gemini-omni-flash-pricing-api-guide)
- Omni 1.1 Flash: reported $0.03/s at 360p, $0.10/s at 720p, $0.15/s at 1080p, $0.30/s at 4K; generation is asynchronous (task creation plus polling). - [eesel.ai Omni 1.1](https://www.eesel.ai/blog/gemini-omni-1-1-flash-pricing); [llmgateway.io](https://llmgateway.io/models/gemini-omni-1.1-flash); [techsy.io](https://techsy.io/en/blog/gemini-omni-api-pricing)
- Google launched Gemini Omni Flash alongside Nano Banana 2 Lite. - [AI Weekly](https://aiweekly.co/alerts/google-launches-gemini-omni-flash-and-nano-banana-2-lite)

**Kling 3.0 (Kuaishou)**
- Official Kling API baseline reported at $0.084 per generated second for 720p without native audio. Kling's own VIDEO 3.0 guide (6 Feb 2026) lists 6 / 8 credits per second (720p / 1080p, no audio), 9 / 12 credits per second with native audio, plus 2 credits/s for voice control. - [dev.to (evan-dong)](https://dev.to/evan-dong/kling-ai-video-generation-pricing-complete-cost-breakdown-for-developers-2026-3fnp); [EvoLink Kling 3 guide](https://evolink.ai/blog/kling-3-api-pricing-integration-guide)
- Kling 3.0 range across sources: $0.084 to $0.168/s; 1080p without audio from $0.112/s; Kling 3.0 Pro 1080p with sound $0.168/s. - [echai.ventures](https://echai.ventures/how-founders-use-ai/video-image-audio/what-does-ai-video-and-image-actually-cost-and-what-s-a-sensible-starter-stack-on-a-founder-budget); [costbench Kling vs Replicate](https://costbench.com/compare/kling-api-vs-replicate/)
- Resellers: EvoLink $0.075/s; Apiframe 29 to 58 credits/s at $0.01/credit (about $0.29 to $0.58/s, far above official); Kling 3.0 Turbo on fal ~$0.101 to $0.112/s 720p and $0.14/s 1080p. - [EvoLink](https://evolink.ai/blog/kling-3-o3-api-official-discount-pricing-developers); [Apiframe Kling 3.0 pricing](https://apiframe.ai/models/kling-3.0/pricing); [imagine.art Kling 3.0 Turbo](https://www.imagine.art/blogs/kling-3-0-turbo-pricing)

**Runway (Gen-4.5, Gen-4 Turbo, Aleph)**
- Runway API: Gen-4.5 at 12 credits/s and Gen-4 Turbo at 5 credits/s; API credits cost $0.01 each, so Gen-4.5 is about $0.12/s ($0.60 per 5 s). Same rate at every resolution; ProRes/PNG sequence output adds 5 credits/s. API credits are separate from app subscription credits. - [Developers Digest Runway](https://www.developersdigest.tech/models/video-generation/runway); [flexprice.io](https://flexprice.io/pricing-index/runway); [creatify.ai](https://creatify.ai/blog/runway-pricing-(2026)-plans-credits-and-what-you-ll-actually-pay)
- Conflict: some guides still cite 25 credits/s for Gen-4.5 ($1.25 per 5 s); flexprice says the rate fell from 25 to 12 in June 2026. - [eesel.ai](https://www.eesel.ai/en/blog/runway-ai-pricing); [modelslab](https://modelslab.com/blog/runway-gen-45-image-to-video-api-developers-2026); [flexprice.io](https://flexprice.io/pricing-index/runway)
- Apiframe resells a 5 s Gen-4.5 clip at $0.75 vs $0.60 direct. - [Apiframe Runway Gen-4.5](https://apiframe.ai/models/runway-gen4.5/pricing)
- Runway's API ratio enums include vertical "720:1280" (plus 1280:720, 960:960, 832:1104, etc.) for Aleph; confirmation for Aleph 2.0 was not found. - [useapi.net Runway docs](https://useapi.net/docs/api-runwayml-v1/post-runwayml-gen4-video); [Kie.ai Aleph docs](https://docs.kie.ai/runway-aleph-api/generate-aleph-video)
- Runway Gen-4.5 at one point overtook Veo 3 to top the Artificial Analysis leaderboard (article undated in results; likely late 2025). - [OfficeChai](https://officechai.com/ai/runway-gen-4-5-goes-past-googles-veo-3-to-become-top-video-model-on-artificial-analysis-leaderboard)
- Runway's own app now also hosts Grok Imagine 1.5. - [Runway Help Center](https://help.runwayml.com/hc/en-us/articles/53995376768147-Creating-with-Grok-Imagine-1-5)

**Luma (Ray 3.x)**
- Ray 3.2 on the Luma API: $0.30 per 5 s 720p clip, $1.20 per 5 s 1080p (about $0.06/s and $0.24/s). A conflicting Sept 2026 list price of $1.00 per 5 s 720p text-to-video on Luma was also reported. - [Picasso IA blog](https://blog.picassoia.com/luma-api-pricing-ray-3-2-api-docs-and-cost); [GMI Cloud](https://www.gmicloud.ai/ja/blog/test-luma-ray-3-2-kling-3-0-turbo-video-api)
- Luma launched Ray3.14 claiming per-second pricing 3x cheaper and 4x faster than earlier models at 1080p (vendor claim, Jan 2026). - [Business Wire](https://www.businesswire.com/news/home/20260126744711/en); [techintelpro](https://techintelpro.com/AI/Generative-AI/luma-ai-ray314-1080p-4x-faster-3x-cheaper-ai-video)
- Luma's docs say video rates may change before GA. - [Luma pricing docs](https://docs.agents.lumalabs.ai/guides/pricing/)

**MiniMax Hailuo**
- Hailuo 2.3: 6 s 768p clip $0.28, 1080p $0.49; Hailuo 2.3 Fast: 6 s 768p $0.19, 1080p $0.33 (pay-as-you-go). fal lists the same prices as MiniMax. - [Akool Hailuo 2.3 cost guide](https://akool.com/blog-posts/minimax-hailuo-2-3-cost-guide); [Apiframe Hailuo providers](https://apiframe.ai/blog/hailuo-api-providers)
- Newer MiniMax H3 moved to per-second billing at $0.08/s at 768p (about $0.48 per 6 s; $0.40 per 5 s); Hailuo 2.3 and 02 moved to a legacy list (tracker dated 30 Jul 2026). - [usagepricing.com](https://www.usagepricing.com/blueprint/activity/minimax-2026-07-30-h3-video-per-second)
- PiAPI resells a 6 s 768p clip at $0.23. - [PiAPI Hailuo](https://app.piapi.ai/hailuo)

**ByteDance Seedance 2.0 / 2.5**
- Per-second figures conflict: fal reported $0.3034/s at 720p with audio, $0.2419/s fast endpoint, $0.682/s at 1080p; Apiframe $0.19/s (720p, t2v, audio); Atlas Cloud cites $0.112/s base and other inconsistent tiers. - [Novoads](https://novoads.ai/en/blog/seedance-2-0-pricing); [Apiframe Seedance 2.0](https://apiframe.ai/models/seedance-2.0/pricing); [Atlas Cloud](https://www.atlascloud.ai/blog/seedance-2.0-pricing-full-cost-breakdown-2026)
- Availability conflict: Atlas Cloud (a competitor) said Seedance 2.0 was not on fal as of 9 Apr 2026; other sources list BytePlus (international) and Volcengine (China) as official access points. BytePlus bills per minute rather than per second, which inflates short-clip cost. - [Atlas Cloud fal check](https://www.atlascloud.ai/nl/blog/guides/seedance-2-0-api-on-fal-ai-is-it-live-the-best-alternative-now); [Nxcode Seedance 2.0 guide](https://www.nxcode.io/resources/news/seedance-2-0-api-guide-pricing-setup-2026)
- Seedance 2.5 has been announced/listed on Atlas Cloud. - [Atlas Cloud](https://www.atlascloud.ai/blog/case-studies/seedance-2.0-pricing-full-cost-breakdown-2026)

**xAI Grok Imagine Video**
- 9:16 supported (7 ratios on base model; 1.5 reportedly 9 ratios including 21:9). Reported pricing $0.05/s at 480p and $0.07/s at 720p (reseller), with an aggregator listing $0.04 / $0.056; Grok Imagine Video 1.5 listed at $0.096 (480p) / $0.168 (720p) per second by one catalog. - [CometAPI](https://www.cometapi.com/models/xai/grok-imagine-video/); [EmpirioLabs Grok Imagine 1.5](https://catalog.empiriolabs.ai/models/grok-imagine-video-1-5); [Apiframe Grok guide](https://apiframe.ai/guides/grok-video-api-guide)
- Grok Imagine Video was reported #1 on the Artificial Analysis Video Arena for both text-to-video and image-to-video in mid-April 2026 (per WaveSpeed). - [WaveSpeed blog](https://wavespeed.ai/blog/posts/why-happyhorse-top-ai-video-leaderboard-2026)

**Pika**
- Pika 2.2 on fal: $0.45 per 5 s 1080p, $0.20 per 5 s 720p (tracker dated 20 Jul 2026); no fal price found for Pika 2.5. Pika's own API uses custom/sales pricing, and app top-up credits do not apply to API calls. - [perkstack.co](https://perkstack.co/blog/cheapest-pika-2-2-api); [costbench Pika API](https://www.costbench.com/software/ai-media-apis/pika-api/)

**Open-weights: LTX-2 and Wan**
- LTX-2 (Lightricks) generates synchronized video and audio in one pass (speech, foley, ambience), up to ~20 s at native 4K / 50 fps. License is disputed across sources: "LTX-2 Community License" (not OSI), "Apache 2.0", and "free below a revenue threshold, commercial license above it". - [Introl](https://introl.com/blog/ltx-2-audiovisual-diffusion-synchronized-video-audio-2026); [The Dead Pixels Society](https://thedeadpixelssociety.com/lightricks-open-sources-ltx-2-the-production-ready-audio-and-video-generation-model/); [invideo LTX guide (Aug 2026)](https://invideo.io/blog/ltx-ai-video-generator/)
- Wan 2.6 was compared against LTX-2 in Jan 2026 as stronger on stylized motion and longer form; the source calls both open-source but does not document Wan 2.6's license. - [Crepal](https://crepal.ai/blog/?p=4841)
- Wan 2.7 appears on the Aug 2026 Artificial Analysis snapshot (~1163 Elo); Alibaba "Wan 3.0 Prime" appears on OpenRouter comparisons. - [invideo.io best AI video model](https://invideo.io/blog/best-ai-video-model/); [OpenRouter compare](https://openrouter.ai/compare/alibaba/wan-3.0-prime/google/veo-3.1-fast)

**Leaderboards (Artificial Analysis Video Arena)**
- Aug 2026 snapshot (text-to-video with audio, via invideo): Gemini Omni Flash 1245 Elo, MiniMax-H3 1242, Seedance 2.0 1225, Wan 2.7 ~1163. - [invideo.io](https://invideo.io/blog/best-ai-video-model/)
- Early April 2026: pseudonymous HappyHorse-1.0 took #1 (reported 1,333 to 1,384 Elo depending on board), ahead of Seedance 2.0 720p (1,273). PixVerse V5.6 ranked #2 as of 28 Feb 2026. Artificial Analysis runs four separate boards (t2v / i2v, with / without audio). - [dev.to HappyHorse](https://dev.to/brooks_wilson_36fbefbbae4/happy-horse-10-what-we-actually-know-about-the-model-that-topped-artificial-analysis-video-arena-31he); [PixVerse blog](https://pixverse.ai/blog/pixverse-v5-6-ranks-2-artificial-analysis-video-generation-leaderboard)

### Inferences
- Approximate price per 5 s clip (no audio where available, 720p unless noted), computed from the cited per-second rates:

  | Model | ~$/5 s clip | Monthly at 600 to 1,500 s | Notes |
  |---|---|---|---|
  | Veo 3.1 Lite (720p) | $0.25 | $30 to $75 | 9:16 confirmed; per-second billing |
  | Grok Imagine (720p) | $0.25 to $0.35 | $30 to $105 | 9:16 confirmed; 1.5 costs more |
  | Hailuo 2.3 Fast (768p) | ~$0.16 (from $0.19/6 s) | ~$24 to $60 | being moved to legacy |
  | Luma Ray 3.2 (720p) | $0.30 (conflict: $1.00) | $36 to $90 | 1080p is 4x |
  | Kling 3.0 (720p, no audio) | $0.42 | $50 to $126 | official API |
  | Veo 3.1 Fast (720p) | $0.50 | $60 to $150 | |
  | Gemini Omni 1.1 Flash (720p) | $0.50 | $60 to $150 | top of Aug 2026 arena (with audio) |
  | Runway Gen-4.5 | $0.60 (conflict: $1.25) | $72 to $180 | 720:1280 ratio supported |
  | MiniMax H3 (768p) | $0.40 | $48 to $120 | #2 on Aug 2026 arena |
  | Seedance 2.0 (720p, audio) | $0.95 to $1.52 | $114 to $456 | portrait-reference limits, see KQ6 |
  | Veo 3.1 Standard | $2.00 | $240 to $600 | |

- B-roll inserts play under the creator's voice, so native audio is usually wasted spend. Prefer no-audio SKUs (Kling no-audio, Replicate Veo without audio at half price) and let the compositor own the audio bed.
- Many models have fixed minimum durations (for example Kling's typical 5 s / 10 s), so 2 to 3 s inserts will usually be generated at the model minimum and trimmed; budget on generated seconds, not used seconds.
- Image-to-video is the most controllable pattern for a pipeline: generate (or screenshot) a 9:16 still first, then animate only the inserts that need motion. Every model shortlisted above offers image-to-video per its listings (Kling 3.0 Pro i2v guide, Grok i2v arena ranking, Veo/Omni).
- Because Sora and Veo preview IDs disappeared within six weeks of each other, the backend should sit behind a provider-agnostic "B-roll job" interface with model IDs in config, not code.
- Product-claim constraint from this repo: generated B-roll must never depict Aura "clicking for you" or controlling a computer. Prompt templates for any UI-themed insert should be screened against `src/lib/product.ts`; real product screen recordings are safer than generated UI footage.

### Gaps
- Official per-second prices could not be read directly from ai.google.dev, platform.openai.com, docs.dev.runwayml.com or Kling/MiniMax/Luma pages because WebFetch was blocked for those domains in this session. Those hosts need to be allowed in the session's network settings to verify.
- Latency (time-to-first-result per clip) was not found in any reliable source for any model. All are async job APIs (submit then poll/webhook), but generation times were not documented in the results.
- Exact 9:16 and native-audio support matrix was confirmed only for Veo 3.1 Lite, Grok Imagine and Runway (ratio enum). Kling 3.0, Hailuo, Seedance, Luma Ray 3.x and Gemini Omni 9:16 support was not confirmed in the results, though widely assumed.
- Whether Gemini Omni Flash is reachable through Vertex AI with enterprise terms, and its exact model IDs, was not found.
- Wan 2.6/2.7 license terms and LTX-2's true license text were not confirmed; check the Hugging Face model cards.
- The live Artificial Analysis leaderboard after Aug 2026 was not retrieved.

## Key Question 2: Does Higgsfield have an official public API, what does it aggregate, what does it cost, and what are the best non-Higgsfield equivalents?

### Takeaway
Yes: Higgsfield has an official API (Higgsfield Cloud, base URL `platform.higgsfield.ai`, official Python SDK `higgsfield-client`, submit then poll or webhook), and it aggregates third-party models such as Kling 3.0 and Seedance 2.0/2.5 alongside its own (for example Soul). Its reported API list prices for Kling 3.0 ($0.084/s) match Kling's own official API, so there is no cost reason to route through Higgsfield; the direct Kling API, fal.ai, or BytePlus give equivalent models without touching Higgsfield credits, which this repo forbids spending automatically.

### Cited Findings
- Official API is available through cloud.higgsfield.ai, separate from the consumer app, with an official Python SDK `higgsfield-client`. Credentials are a `HF_KEY` in `key:secret` form or separate `HF_API_KEY` / `HF_API_SECRET`. - [Higgsfield SDK docs](https://docs.higgsfield.ai/how-to/sdk); [Higgsfield docs index](https://docs.higgsfield.ai/docs/index)
- The official API reference names `https://platform.higgsfield.ai` as the base URL (a third-party blog says api.higgsfield.ai). Requests are submitted to a model endpoint and either polled or delivered by webhook. Model request schemas are "being redesigned separately and intentionally not listed". Example model ID: `higgsfield-ai/soul/standard`. - [Higgsfield API reference overview](https://docs.higgsfield.ai/docs/api-reference/overview); [Novoads Higgsfield API](https://novoads.ai/en/blog/higgsfield-api)
- A third-party index of the docs lists model families such as Kling 3.0 with workflow variants. - [Firecrawl Alexandria index](https://www.firecrawl.dev/alexandria/agents/providers/docs-higgsfield-ai)
- Billing is reported inconsistently: one guide says API calls draw from the same account credit pool as the web app; a later guide (reviewed 21 Sep 2026) says the API is billed per generation in dollars with no subscription, and that on 12 Oct 2026 the pricing page listed Kling 3.0 from $0.084/s, Seedance 2.0 from $0.141/s and Seedance 2.5 from $0.206/s. - [Layer3 Labs Higgsfield API guide](https://www.layer3labs.io/guides/higgsfield-api)
- Credit packs: reported as roughly $5 per 100 credits with ~90-day expiry, or 80 credits for $5 up to 1,700 credits for $80 (requires an active subscription). Web-app proxy costs: Seedance 2.0 5 s 720p ~22 to 23 credits; Kling 3.0 5 s 720p ~7 to 10 credits. - [Creatify Higgsfield pricing](https://creatify.ai/blog/higgsfield-pricing-(2026)-plans-credits-and-what-you-ll-actually-pay); [Wireflow](https://www.wireflow.ai/blog/higgsfield-ai-pricing)
- A 24 Sep 2026 promotion advertised $20M in API cashback credits that expired 30 Sep 2026. - [Digg](https://digg.com/ai/cs9lzbvm)
- Terms: Higgsfield does not claim ownership of outputs (Terms section 4.4) and does not restrict commercial use; outputs are not exclusive; Higgsfield may train on user content (enterprise excluded); IP indemnification is Enterprise-only. An updated Terms of Use reportedly took effect 27 Aug 2026. - [Higgsfield Help Center](https://higgsfield.ai/creator-hub/help-center/account/who-owns-my-generations-and-can-i-use-them-commercially); [AI Tool Curator](https://www.aitoolcurator.com/learn/higgsfield-guide/terms-privacy-policy-update/)
- Third-party report: API usage is subject to sudden rate limits, file size caps, and possible suspension for over-usage without notice. - [Higgsfield-hosted "drawbacks" page](https://geo.higgsfield.ai/task/blog/drawbacks-of-higgsfield-ai)

**Non-Higgsfield equivalents for the same underlying models**
- Kling 3.0: official Kling API $0.084/s (720p, no audio), EvoLink $0.075/s, fal Kling 3.0 Turbo ~$0.10 to $0.11/s. - [dev.to (evan-dong)](https://dev.to/evan-dong/kling-ai-video-generation-pricing-complete-cost-breakdown-for-developers-2026-3fnp); [EvoLink](https://evolink.ai/blog/kling-3-api-pricing-integration-guide); [imagine.art](https://www.imagine.art/blogs/kling-3-0-turbo-pricing)
- Seedance 2.0: BytePlus (official, per-minute billing), fal (reported $0.24 to $0.30/s at 720p), Apiframe ($0.19/s), Atlas Cloud. - [Nxcode](https://www.nxcode.io/resources/news/seedance-2-0-api-guide-pricing-setup-2026); [Novoads](https://novoads.ai/en/blog/seedance-2-0-pricing); [Apiframe](https://apiframe.ai/models/seedance-2.0/pricing)

### Inferences
- Higgsfield's reported dollar list price for Kling 3.0 equals Kling's official API price and its Seedance 2.0 price ($0.141/s) is below some resellers, so Higgsfield is not obviously more expensive, but it adds a second ToS layer (training on your content, no indemnity below Enterprise) and the repo's rule makes it a manual-only tool anyway.
- Safe pattern for the repo rule: the automated pipeline calls Kling direct / fal / Google; Higgsfield stays a human-operated studio tool, and if a "Higgsfield prompt" is produced it is handed to a human as text, never executed. Note that this Claude environment has a Higgsfield MCP server connected (tools such as generate_video and ai_influencer_generate); the LangGraph orchestrator and any agent tool lists should explicitly exclude those tools so no agent can spend credits.
- Higgsfield's Python-only official SDK means a Node.js backend would call the REST API directly; that is a minor point given it should not be called automatically.

### Gaps
- Higgsfield's official per-endpoint API price table was not retrievable; sources conflict on credits versus dollar billing.
- The complete list of models Higgsfield aggregates via API (versus in its web app) was not confirmed from first-party docs.
- Whether API outputs carry different ownership or commercial terms than app outputs was not found.

## Key Question 3: Which image models with an API suit 9:16 B-roll stills, at what price, and how good are they at text rendering and character consistency?

### Takeaway
For 9:16 stills, the practical price band is $0.03 to $0.07 per image (FLUX.2 [pro] ~$0.045 at 1080x1920, Seedream 4.5 ~$0.04, Recraft V3/V4.1 ~$0.035 to $0.04, Ideogram 3.0 Turbo/Default $0.03 to $0.06, Nano Banana 2 ~$0.045 to $0.067), with Nano Banana Pro ($0.134) and gpt-image-2 high quality (~$0.21+) as premium options for dense typography. Imagen 4 was reportedly retired from the Gemini API on 17 Aug 2026, and Midjourney still has no official API (its terms ban automation). At 120 to 300 stills/month, image cost is roughly $5 to $40/month, far below video.

### Cited Findings

**Google (Nano Banana family, Imagen 4)**
- Nano Banana Pro (Gemini 3 Pro Image): $0.134 per image at 1K/2K, $0.24 at 4K; batch roughly half ($0.067 / $0.12). - [benchlm.ai Nano Banana](https://benchlm.ai/md/media-pricing/nano-banana.md); [MyArchitectAI](https://www.myarchitectai.com/blog/nano-banana-api-pricing)
- Nano Banana 2 is reported at ~$0.067 per 1K image (standard tier) by one source, $0.048 in another table, and $0.045 (fast) / $0.070 (standard) on WaveSpeed; the original Nano Banana (Gemini 2.5 Flash Image) was $0.039 per image ($0.0195 batch). - [MyArchitectAI](https://www.myarchitectai.com/blog/nano-banana-api-pricing); [WaveSpeed Nano Banana 2](https://wavespeed.ai/nano-banana-2-api); [AIMLAPI](https://aimlapi.com/blog/nano-banana-2)
- Nano Banana 2 text rendering is described as producing readable headlines, product labels and infographic text, with Pro still better for dense typography; it keeps up to 5 characters consistent and accepts up to 14 reference images. - [Digital Applied](https://www.digitalapplied.com/blog/google-nano-banana-2-image-generation-guide); [Apiframe Nano Banana 2 guide](https://apiframe.ai/guides/nano-banana-2-guide)
- Nano Banana 2 Lite launched alongside Gemini Omni Flash (price not found). - [AI Weekly](https://aiweekly.co/alerts/google-launches-gemini-omni-flash-and-nano-banana-2-lite)
- Imagen 4 Fast / Standard / Ultra: $0.02 / $0.04 / $0.06 per image (checked 10 Jul 2026). Several July/Aug 2026 sources say Google retired Imagen 4 on the Gemini API on 17 Aug 2026, with Nano Banana as the migration target. Batch discount status conflicts. - [Rapid Developers Imagen 4 matrix](https://www.rapidevelopers.com/md/ai-api-limits-performance-matrix/imagen-4); [invideo image pricing (Aug 2026)](https://invideo.io/blog/ai-image-model-pricing/)

**OpenAI (gpt-image-1.5, gpt-image-2)**
- gpt-image-1.5: about $0.009 / $0.034 / $0.133 (low / medium / high) at 1024x1024, and $0.013 / $0.050 / $0.200 at 1024x1536 or 1536x1024 (the portrait size closest to 9:16); image inputs billed separately. - [Price Per Token](https://pricepertoken.com/image/model/openai-gpt-image-1-5); [aireiter gpt-image-1.5](https://aireiter.com/blog/gpt-image-1-5-api-pricing); [OpenAI model page](https://developers.openai.com/api/docs/models/gpt-image-1.5)
- gpt-image-2: token billed at $8 / 1M image input tokens, $2 cached, $30 / 1M image output tokens; per-image output about $0.006 to $0.211 at 1024x1024 and up to ~$0.43 at larger high-quality sizes; Batch halves token rates. - [dev.to tokenmixai](https://dev.to/tokenmixai/gpt-image-2-api-developer-guide-pricing-thinking-mode-and-production-integration-2026-28p5); [laozhang.ai](https://blog.laozhang.ai/en/posts/gpt-image-2-api-pricing.md); [Segmind](https://www.segmind.com/models/gpt-image-2/pricing)
- A reseller (APIYI) announced a gpt-image-2 price cut in Oct 2026. - [APIYI](https://docs.apiyi.com/en/live/2026-10/gpt-image-2-all-price-cut)

**Black Forest Labs FLUX.2**
- FLUX.2 [pro]: $0.03 for the first output megapixel, $0.015 per additional output MP and per reference-image MP; editing from $0.045; 1 MP = 1024x1024, rounded up; 1 credit = $0.01. Some pages list higher legacy figures ($0.05 to $0.07). - [BFL pricing docs](https://docs.bfl.ai/quick_start/pricing.md); [BFL help center](https://help.bfl.ai/articles/7686530342-flux-2-pricing-guide); [Puter FLUX pricing (Jun 2026)](https://developer.puter.com/tutorials/flux-api-pricing/)
- FLUX.2 has [pro], [flex], [max] and open [dev] variants. - [moda.app](https://moda.app/resources/models/flux); [okmiku](https://okmiku.com/blog/flux-2-image-generation)

**Ideogram**
- Ideogram 3.0 API: $0.03 Turbo, $0.06 Default, $0.09 Quality (several sources); one capture of Ideogram's own page showed $0.12 Turbo / $0.15 Default (unexplained conflict). Character-reference calls $0.10 to $0.20. Ideogram 4.0 is in the API at the same price for Turbo/Default and +$0.01 at Quality. - [Ideogram API pricing](https://ideogram.ai/features/api-pricing); [eesel.ai](https://eesel.ai/blog/ideogram-pricing); [usagepricing Ideogram 4.0](https://www.usagepricing.com/blueprint/activity/ideogram-2026-06-15-40-api-launch)
- Ideogram positions 3.0 as excelling at accurate in-image text rendering. - [Puter Ideogram 3.0](https://developer.puter.com/ai/ideogram/ideogram-3.0/)

**Recraft, Seedream**
- Recraft V3: $0.04 raster, $0.08 vector (official page, $1 per 1,000 API units); Recraft V4.1 $0.035 raster. - [Recraft API pricing](https://www.recraft.ai/docs/api-reference/pricing); [Developers Digest Recraft](https://www.developersdigest.tech/models/image-generation/recraft)
- Seedream 4.5: fal $0.040, Replicate $0.060, OpenRouter $0.04 (any size), AIMLAPI $0.052, EvoLink $0.03; Seedream 5.0 Lite $0.031 (EvoLink). - [Price Per Token Seedream 4.5](https://pricepertoken.com/image/model/bytedance-seedream-4-5); [EvoLink Seedream](https://evolink.ai/collections/seedream)

**Midjourney**
- No official public API as of 18 Aug 2026; access only via web app and Discord with a paid plan; Midjourney's terms prohibit automated tools and reselling access; unofficial wrappers risk bans. V8.2 became default 24 Jul 2026. (All sources are from Unifically, a competitor.) - [Unifically](https://unifically.com/blogs/midjourney-api)

### Inferences
- A 1080x1920 frame is ~1.98 MP, which BFL rounds to 2 MP: FLUX.2 [pro] cost = $0.03 + $0.015 = ~$0.045 per 9:16 still.
- Monthly still-image cost at 120 to 300 inserts: ~$5 to $13 at $0.04/image (Seedream, Recraft, FLUX.2), ~$16 to $40 at $0.134 (Nano Banana Pro). Even generating 3 candidates per insert stays under ~$120/month at the top tier.
- For on-screen headlines, rendering text as an overlay in the compositor (deterministic fonts from DESIGN.md, no typos, editable on revision) is more reliable than baking text into a generated image; model text rendering is best kept for diegetic text (signage, a fake app label) where small errors are tolerable. This also fits the repo's "preserve locked attributes during surgical revisions" rule, since overlay text can change without regenerating the image.
- For character consistency (recurring mascot or set), Nano Banana 2/Pro multi-reference input is the most documented option among the sources found.

### Gaps
- Imagen 4 availability on Vertex AI after the reported Gemini API retirement was not confirmed.
- Nano Banana 2 official price is inconsistent across sources ($0.045 to $0.067); Google's page could not be fetched.
- No independent benchmark of text-rendering accuracy across Ideogram 4.0, Nano Banana Pro, gpt-image-2 and FLUX.2 was found.
- Per-image latency figures were not found.

## Key Question 4: Which aggregator platforms host these models, at what markup, and which have queue/webhook APIs suited to a Node.js backend?

### Takeaway
fal.ai is the best-documented fit for a Node.js backend (official `@fal-ai/client` with `fal.queue.submit` + webhook URL, status polling, signed webhooks) and appears to pass through vendor list prices on several models (Hailuo matches MiniMax). Replicate hosts GA Veo 3.1 at Google-equivalent rates. WaveSpeed, Kie.ai, EvoLink, Apiframe and similar resellers vary from 10% below to 2x above official prices, with conflicting published numbers and lower-priority queues on the cheapest tiers.

### Cited Findings
- fal: requests go through a queue; `fal.queue.submit()` accepts a webhook URL; `fal.queue.status()` and `subscribe` cover polling and submit-and-wait; the current package is `@fal-ai/client`. Async pattern: submit and return immediately, then poll or receive webhook. - [fal JavaScript client docs](https://fal.ai/docs/clients/javascript); [fal inference docs](https://fal.ai/docs/documentation/model-apis/inference); [fal client index](https://fal.ai/docs/api-reference/client-libraries/javascript/index.md)
- fal webhooks are signed with ED25519 and must use publicly reachable HTTPS URLs (per community SDKs); fal's Platform API exposes per-endpoint unit prices. - [cjmellor/fal-ai-laravel](https://packagist.org/packages/cjmellor/fal-ai-laravel); [marceloeatworld/falai-php](https://packagist.org/packages/marceloeatworld/falai-php)
- fal hosts Kling 3.0 Turbo, Hailuo 2.3 (same price as MiniMax), Pika 2.2, Seedream 4.5 ($0.040), Ideogram 3.0 ($0.09 Quality), and reportedly Seedance 2.0. - [imagine.art](https://www.imagine.art/blogs/kling-3-0-turbo-pricing); [Apiframe Hailuo](https://apiframe.ai/blog/hailuo-api-providers); [perkstack Pika](https://perkstack.co/blog/cheapest-pika-2-2-api); [perkstack Ideogram](https://perkstack.co/blog/cheapest-ideogram-3-0-api)
- Replicate: Veo 3.1 $0.40/s with audio, $0.20/s without; Veo 3.1 Fast $0.15/s with audio; Seedream 4.5 $0.060 (50% above fal). - [Developers Digest Replicate](https://www.developersdigest.tech/models/video-generation/replicate); [Price Per Token Seedream](https://pricepertoken.com/image/model/bytedance-seedream-4-5)
- Replicate's comparison blog of AI video models exists as a selection reference. - [Replicate blog](https://replicate.com/blog/compare-ai-video-models)
- WaveSpeed vs Kie.ai on Veo 3.1: one table gives WaveSpeed 8 s 1080p Fast $1.20 with audio / $0.80 without, Standard $3.20 / $1.60; another gives Kie.ai $0.90 Fast / $1.85 Quality and WaveSpeed $2.40 / $4.80 (same site, contradictory). Cheapest "Lite Relaxed" tiers run on lower-priority queues. - [aiidelist.com](https://aiidelist.com/blog/veo-3-1-api-pricing-comparison)
- Kie.ai had the lowest Veo 3 Fast price at $0.40 per clip (Jul 2026 tracker); WaveSpeed (a competitor) describes Kie.ai as a reseller of APIs available elsewhere. - [perkstack Veo 3 Fast](https://perkstack.co/blog/cheapest-veo-3-fast-api); [WaveSpeed vs Kie](https://www.wavespeed.ai/blog/posts/wavespeedai-vs-kie-ai-comparison/)
- WaveSpeed hosts Grok Imagine Video, Kling O1, Nano Banana 2 and Seedream 4.5. - [WaveSpeed Grok docs](https://www.wavespeed.ai/docs-api/x-ai/x-ai-grok-imagine-video-text-to-video); [WaveSpeed Kling O1](https://wavespeed.ai/collections/kling-o1); [WaveSpeed Seedream 4.5](https://wavespeed.ai/seedream-4-5-api)
- Reseller markups observed: Apiframe Runway Gen-4.5 $0.75 vs $0.60 direct (+25%); Apiframe Kling 3.0 ~$0.29/s vs $0.084/s official (~3.5x); EvoLink Kling 3.0 $0.075/s (~11% below official). - [Apiframe Runway](https://apiframe.ai/models/runway-gen4.5/pricing); [Apiframe Kling](https://apiframe.ai/models/kling-3.0/pricing); [EvoLink](https://evolink.ai/blog/kling-3-o3-api-official-discount-pricing-developers)
- Ideogram 3.0 is also listed on together.ai (price page exists). - [Price Per Token (Together Ideogram 3.0)](https://pricepertoken.com/image/model/together-ideogram-3-0)

### Inferences
- A two-provider design (Google direct for Veo/Omni/Nano Banana plus fal for Kling, Hailuo, Seedream, FLUX, Ideogram) covers nearly every shortlisted model with two API keys, one webhook receiver, and near-list pricing.
- Webhook delivery requires a public HTTPS endpoint; for a Tauri desktop app this means the job submitter and webhook receiver should live in the cloud backend (alongside Supabase records and LangGraph checkpoints), not on the user's machine. Polling is the fallback for local dev.
- Store job IDs and provider request IDs in Supabase so a LangGraph `interrupt()` for human approval can resume against already-generated assets without regenerating (and paying) twice.

### Gaps
- No source quantified fal's markup over vendor list prices model by model, or documented together.ai's video model catalog and pricing.
- Replicate's Node client and webhook specifics were not covered by the search results (prior knowledge, unverified here: Replicate offers an official `replicate` npm client and webhook callbacks).
- Rate limits and concurrency caps per aggregator were not found.

## Key Question 5: What non-generative B-roll sources (screenshots of articles, tweets, websites, charts, stock footage) can be automated, and what are their licensing terms for social media?

### Takeaway
Screenshots are cheap and easy to automate: hosted APIs (ScreenshotOne from a 100/month free tier and ~$12 to $20/month entry; Urlbox from ~$29/month) or a self-hosted headless browser; tweets can be captured by URL with a CSS selector or rendered via `react-tweet` (unofficial embed endpoint) then screenshotted. Free stock (Pexels, Pixabay) allows commercial social use without attribution, but API use requires a link back (Pexels) and bans standalone redistribution; Storyblocks, Shutterstock and Getty APIs are sales-quoted enterprise deals.

### Cited Findings

**Screenshot APIs**
- ScreenshotOne: 100 free requests/month; entry reported as $12/month or $20/month for 1,000 (sources conflict; one table shows $29/month for 5k). Urlbox: 150 free (5/day cap) or a 7-day trial, entry ~$29/month. Volume reference: ~15,000 renders/month ~$99, ~50,000/month ~$498 (vendor unspecified). Reviewers rate Urlbox best for client-facing output and ScreenshotOne as reliable and well documented. - [dev.to comparison 1](https://dev.to/custodiaadmin/screenshot-api-pricing-compared-pagebolt-vs-screenshotone-vs-urlbox-vs-capturekit-2026-13fh); [api-compass (Mar 2026)](https://api-compass.pages.dev/compare/screenshotone-vs-urlbox); [ScreenshotAPI.net comparison](https://www.screenshotapi.net/blog/screenshotapi-vs-screenshotone-vs-urlbox-an-honest-developer-comparison-2026)

**Tweets / X posts**
- `react-tweet` (Vercel) renders tweets using a reverse-engineered Twitter embed endpoint, in the same style as the embedded iframe; it does not produce images and retweet counts are unavailable. - [Stefan Judis](https://www.stefanjudis.com/blog/how-to-prerender-tweets-without-using-the-official-twitter-apis/)
- HTML/CSS to Image can screenshot a tweet directly by passing the x.com URL with `selector: article`, or screenshot X's `widgets.js` embed card. - [htmlcsstoimage docs](https://docs.htmlcsstoimage.com/guides/social-media/twitter/); [htmlcsstoimage example](https://htmlcsstoimage.com/examples/twitter-tweet-screenshot)
- Zyla lists a Twitter Screenshot API taking a tweet ID or URL and returning an image URL (reliability and terms unverified). - [Zyla Labs](https://zylalabs.com/api-marketplace/tools/twitter+screenshot+api/2155)

**Free stock**
- Pexels License: commercial use allowed without attribution; cannot sell unmodified videos or build a competing stock platform; cannot imply endorsement or use in trademarks/logos. API guidelines ask for a visible link back to Pexels. - [Pexels Help Center](https://help.pexels.com/hc/en-us/articles/360042295174); [freeapihub Pexels API](https://freeapihub.com/apis/pexels-api); [OpenReplay](https://blog.openreplay.com/free-stock-photo-resources/)
- Pixabay Content License: attribution not required; no sale/distribution as stock or wallpapers or on a standalone basis; recognizable trademarks/logos cannot be used commercially for goods and services; recognizable people cannot be used in immoral or illegal ways; only the full license is binding and terms may change. - [Pixabay License Summary](https://pixabay.com/it/service/license/); [RAS Pixabay license copy](https://ras.ac.uk/licence/pixabay-license)

**Paid stock APIs**
- Storyblocks: developer portal with instant test keys before a commercial partnership; API pricing custom; markets an "unlimited stock media API" for platforms. - [Storyblocks API](https://www.storyblocks.com/business-solution/api); [Storyblocks developer portal](https://developer.storyblocks.com); [TechCrunch (2018)](https://techcrunch.com/2018/11/07/storyblocks-makes-it-easier-for-developers-to-integrate-its-stock-media-services/)
- Shutterstock API: custom enterprise pricing via sales, no public tiers. Getty: no published API pricing; reviewers call it likely the most expensive. - [APIspine](https://apispine.com/shutterstock-api); [Shotstack (2024)](https://shotstack.io/learn/best-stock-image-video-apis/); [Plainly Videos](https://www.plainlyvideos.com/blog/stock-video-api)

### Inferences
- For 30 videos x up to ~5 screenshots each (~150/month), ScreenshotOne's entry tier or Urlbox's entry tier covers volume; a self-hosted headless Chromium (Playwright, which has a first-class Node API) is effectively free but needs anti-bot handling, cookie-banner dismissal and font installation, which the hosted APIs bundle.
- A good pipeline pattern for tweets and news: render a clean card (react-tweet or an HTML template with headline, outlet logo and date) at 1080x1920 and screenshot it; this gives consistent styling and avoids login walls, but reproducing third-party logos/headlines is an editorial/fair-use judgment the human approval step (Telegram interrupt) should own.
- Pexels and Pixabay are the only zero-cost automatable video stock options found; both need per-asset provenance logging (source URL, download date, license version) in Supabase, since Pixabay reserves the right to change terms.
- Charts are best generated deterministically (for example a chart template rendered in the compositor) rather than by image models, which hallucinate numbers.

### Gaps
- X's current terms on reproducing tweet screenshots in commercial videos were not found.
- Copyright/fair-use guidance on news-article screenshots in marketing videos was not found (this repo is commercial marketing for Aura Desktop, which weakens fair-use arguments versus commentary).
- Official ScreenshotOne and Urlbox price pages were not fetched; numbers conflict.
- Pexels/Pixabay API rate limits and hotlinking rules were not confirmed.
- Storyblocks/Shutterstock license specifics for social media use (seat limits, platform scope) were not retrieved.

## Key Question 6: What copyright, likeness and trademark restrictions apply to generated B-roll, and which watermarks (SynthID, C2PA) do models embed?

### Takeaway
All Google outputs (Veo, Nano Banana 2/Pro) carry a non-removable SynthID watermark, and Nano Banana Pro adds C2PA metadata on Gemini app, Vertex AI and Google Ads; OpenAI attaches C2PA Content Credentials to image outputs. Providers block or gate real-person likeness (Seedance 2.0 requires identity verification for real human portrait references; Veo is designed to avoid celebrity likeness) and brand logos (Luma bans confusing use of trademarks). Kling and Runway watermark/C2PA practices were not documented in the sources found.

### Cited Findings
- SynthID is an invisible watermark applied at creation time to Google generative images and video; detection is mainly via uploading to Gemini; there is no general open detector; SynthID video support launched May 2024 for Gemini and Veo. - [Chase Jarvis](https://chasejarvis.com/blog/what-is-synth-id/); [Trae AI learn](https://learn.traeai.com/t/ai-engineering/phases/18-ethics-safety-alignment/23-watermarking-synthid-stable-signature-c2pa)
- Nano Banana 2 and Nano Banana Pro output always includes SynthID and it cannot be switched off; Nano Banana Pro images in the Gemini app, Vertex AI and Google Ads include C2PA metadata, though one test found a Gemini sample with no readable credential. - [rgb.ir AI image watermark](https://rgb.ir/en/learn/graphic-design/ai-image-watermark/); [C# Corner](https://www.c-sharpcorner.com/news/google-expands-ai-transparency-with-synthid-detection-in-gemini-c2pa-metadata-for-nano-banana-pro); [ndurner substack](https://ndurner.substack.com/p/limits-in-ai-imagery-authorship-and)
- OpenAI adds Content Credentials (C2PA) to DALL-E 3, ImageGen and Sora outputs and is previewing a public verifier that checks both C2PA and SynthID for images from ChatGPT, the OpenAI API or Codex. - [OpenAI: Advancing content provenance](https://openai.com/index/advancing-content-provenance)
- Watermarks are removable: C2PA metadata is easy to strip and one study found fine-tuning can remove a watermark while preserving quality. - [Trae AI learn](https://learn.traeai.com/t/ai-engineering/phases/18-ethics-safety-alignment/23-watermarking-synthid-stable-signature-c2pa)
- Veo 3 was designed to avoid the likeness of celebrities and historical figures (secondary report). - [Tom's Guide](https://www.tomsguide.com/ai/openai-tightens-guardrails-around-celebrity-deepfakes-after-pressure-from-bryan-cranston-and-sag-aftra-heres-everything-you-need-to-know)
- Sora barred living public figures and let estates opt out deceased figures after the MLK backlash (Oct 2025; now moot since the API is gone). - [Entrepreneur](https://www.entrepreneur.com/business-news/openai-bans-ai-created-martin-luther-king-jr-videos-on-sora/498499); [Biometric Update](https://www.biometricupdate.com/202510/openai-puts-more-guardrails-on-celebrity-likenesses-after-cranston-leads-pushback)
- Luma's content policy bars distinctive brand names, logos or characters likely to cause confusion or imply endorsement, and screens all prompts and uploaded images with automated moderation before processing. - [Luma Content Policy](https://luma.ai/content-policy)
- Seedance 2.0: real human portrait references require identity verification or legal authorization; it is not an unrestricted real-person API; third-party logos, mascots and franchise characters should be treated as high-risk. - [Newly policy guide (Apr 2026)](https://newly.app/guides/seedance-2-0-content-restrictions-workarounds); [laozhang.ai Seedance real people](https://blog.laozhang.ai/en/posts/seedance-2-api-real-people)
- WaveSpeed published guidance on celebrity and trademark content via AI APIs. - [WaveSpeed compliance blog](https://wavespeed.ai/blog/commercial-compliance/generate-celebrity-trademark-content-ai-api/)
- Higgsfield: outputs not exclusive, commercial use permitted, IP indemnification only on Enterprise. - [Higgsfield Help Center](https://higgsfield.ai/creator-hub/help-center/account/who-owns-my-generations-and-can-i-use-them-commercially)

### Inferences
- Using the creator's own face as an image-to-video reference (for example a stylized "creator at desk" insert) may trip likeness gates on Seedance and similar models unless identity verification is completed; inserts that avoid identifiable people are the low-friction default.
- Generated B-roll should avoid third-party logos (Windows, competitor apps) since Luma and Seedance policies flag them and they also create trademark exposure in a commercial marketing context; real Aura UI screen captures are safer than generated "app" visuals.
- Because SynthID and C2PA survive into Google/OpenAI outputs, social platforms that read provenance signals may auto-label posts as AI-generated; the pipeline should assume AI-content labels on inserts and plan disclosure accordingly.
- Keep a per-asset provenance record (model, provider, prompt, seed, date, license/ToS version) so any takedown or claim can be answered quickly.

### Gaps
- Kling and Runway watermark/C2PA practices and content policies on public figures and trademarks were not found.
- Google's own Veo/Gemini API prohibited-use policy text and indemnification terms (Google has offered generative AI indemnity on Vertex AI historically) were not retrieved.
- Whether TikTok, YouTube Shorts and Instagram Reels auto-label content based on SynthID (versus C2PA only) was not found.
- Copyright ownership of purely AI-generated footage (no human authorship) under US Copyright Office guidance was not researched in this pass.

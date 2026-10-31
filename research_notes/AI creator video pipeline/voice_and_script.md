# Voice Clone + TTS and AI Scriptwriting for a Creator-Voice Short-Form Pipeline (as of 31 Oct 2026)

Scope: English only, about 30 videos per month, 30 to 90 seconds each (roughly 80 to 250 spoken words), Node.js/TypeScript backend.

Method note for the report writer: direct page fetches to elevenlabs.io and artificialanalysis.ai were blocked by this session's network allowlist (DNS failure), so every finding below comes from web search result snippets (which paraphrase the pages), plus Anthropic's model/pricing table bundled with Claude Code (cached 2026-10-06). Many sources are third-party aggregators that disagree with each other; conflicts are flagged inline. Verify any number that drives a budget against the vendor's live pricing page.

## 1. ElevenLabs: Instant vs Professional Voice Clone, models, tags, pricing, plan fit, timestamps, rights

### Takeaway
ElevenLabs is still the reference choice: Eleven v4 (launched 28 Sep 2026) and v4 Turbo top the Artificial Analysis provider-voice board, support inline audio tags, and the `/with-timestamps` endpoint returns character-level alignment that works on v4. At about 30 videos a month the character volume is tiny (well under 150K characters even with retakes), so plan choice is driven by features: Creator ($22/month) is the cheapest tier that unlocks a Professional Voice Clone.

### Cited Findings
**Models**
- Eleven v4 launched on 28 September 2026 alongside Eleven v4 Turbo, a low-latency variant; ElevenLabs calls v4 its most emotive model and its "latest and most advanced" TTS model. ([Unite.AI](https://www.unite.ai/elevenlabs-launches-eleven-v4-with-low-latency-turbo-variant/); [ElevenLabs blog](https://elevenlabs.io/blog/eleven-v4); [ElevenLabs v4 docs](https://elevenlabs.io/docs/overview/capabilities/text-to-speech/eleven-v4))
- v4 delivery is controlled with audio tags such as `[whispering]`, `[shouting]`, `[laughing]`. Style and Speed sliders are not available in v4 and SSML is not supported. ElevenLabs says tag reliability is "an area of ongoing work". ([ElevenLabs v4 docs](https://elevenlabs.io/docs/overview/capabilities/text-to-speech/eleven-v4); [ElevenLabs blog](https://elevenlabs.io/blog/eleven-v4))
- Developer reports on v4: tags are followed most of the time but not every time, and output is not deterministic. ([chaptercast PR #19](https://github.com/robbe1999/chaptercast/pull/19); [livekit-avatar issue #1](https://github.com/peted70/livekit-avatar/issues/1))
- Other current model names referenced in pricing tables: Multilingual v2, Eleven v3, v3 Conversational, Flash, Turbo. ([Cartesia's ElevenLabs pricing explainer](https://www.cartesia.ai/learn/elevenlabs-pricing); [goodvibecode, Sep 2026](https://www.goodvibecode.com/text-to-speech/elevenlabs-api-pricing-explained))
- On the Artificial Analysis provider-voice leaderboard (latest snapshot found), Eleven v4 Turbo ranks #1 at Elo 1336, followed by Eleven v4, Qwen-Audio-3.1-TTS-Plus, Sonic 3.6 and Gemini 3.8 Flash TTS. ([Artificial Analysis provider-voice board](https://artificialanalysis.ai/text-to-speech/leaderboard/provider-voice))

**Instant Voice Clone (IVC) vs Professional Voice Clone (PVC)**
- IVC is available from the Starter plan; PVC requires Creator or above. ([magichour.ai pricing guide](https://magichour.ai/blog/elevenlabs-pricing); [ElevenLabs PVC help article](https://elevenlabs.io/docs/help-center/product/voices/voice-cloning/when-will-my-professional-voice-clone-pvc-be-ready))
- IVC sample length: ElevenLabs' own landing page suggests 1 to 5 minutes of clean audio; third-party guides cite anywhere from 30 seconds to 1 minute minimum. One guide claims ElevenLabs warns against exceeding 3 minutes for IVC (not confirmed against official docs). ([ElevenLabs voice cloning landing page](https://start.elevenlabs.io/voice-cloning/v5); [dev.to walkthrough](https://dev.to/akaranjkar08/i-cloned-my-voice-in-60-seconds-with-elevenlabs-heres-how-1gcf); [magichour.ai](https://magichour.ai/blog/elevenlabs-pricing))
- PVC training takes roughly 3 to 6 hours, sometimes longer. ([ElevenLabs help center](https://elevenlabs.io/docs/help-center/product/voices/voice-cloning/when-will-my-professional-voice-clone-pvc-be-ready))
- PVC verification: the speaker is shown a text CAPTCHA and must read it aloud within 10 seconds; manual verification exists as a slower fallback. ([ElevenLabs PVC quickstart](https://elevenlabs.io/docs/eleven-api/guides/how-to/voices/professional-voice-cloning))
- PVC training data: an older ElevenLabs blog post says 30 minutes minimum, 3 hours optimal, single speaker, clean audio with no background noise, music or effects (dated; predates current docs). ([ElevenLabs blog, older](https://elevenlabs.io/blog/create-a-perfect-digital-copy-of-your-voice-and-speak-the-languages-you-dont))
- PVC can be created and trained via API (cookbook exists). ([ElevenLabs PVC cookbook](https://elevenlabs.io/docs/developers/guides/cookbooks/voices/professional-voice-cloning))

**Pricing and plans**
- Plan ladder (most consistent listing, Oct 2026): Free $0 / 10,000 credits; Starter $6 / 30,000; Creator $22 / 121,000; Pro $99 / 600,000; Scale $299 / 1.8M; Business $990 / 6M. Some older guides list Pro at 500,000 credits and Scale at $330. Starter is $5/month if billed annually. ([Cartesia explainer](https://www.cartesia.ai/learn/elevenlabs-pricing); [CloudZero](https://www.cloudzero.com/blog/elevenlabs-pricing/); [bigvu](https://bigvu.tv/blog/elevenlabs-pricing-2026-plans-credits-commercial-rights-api-costs/); [magichour.ai](https://magichour.ai/blog/elevenlabs-pricing))
- API per-character rates, October 2026 sources (checked 15 Oct 2026): $0.08 per 1K characters for Multilingual v2, v3 and v4; $0.04 per 1K for Flash, Turbo, v4 Turbo and v3 Conversational. September 2026 sources list $0.10 and $0.05 respectively. A temporary discounted v4 launch rate reportedly ended 12 Oct 2026. ([websitevoice](https://websitevoice.com/blog/elevenlabs-pricing-plans/); [goodvibecode, Sep 2026](https://www.goodvibecode.com/text-to-speech/elevenlabs-api-pricing-explained); [modelslab](https://modelslab.com/elevenlabs-api-pricing))
- Conflict: credits are not 1:1 with characters across models (Flash/Turbo consume fewer credits per character). One calculator page claims Starter includes 150,000 Flash/Turbo characters or 75,000 Multilingual v2/v3 characters, which does not reconcile with Starter's 30,000-credit listing. ([easyvoice](https://easyvoice.ae/elevenlabs-api-pricing); [benchlm](https://benchlm.ai/elevenlabs/pricing))
- Free tier includes API access and about 10,000 characters of v3/Multilingual TTS per month (20,000 on Flash/Turbo). ([Cartesia explainer](https://www.cartesia.ai/learn/elevenlabs-pricing))

**Timestamps for captions**
- The `/with-timestamps` TTS endpoint returns character-level alignment; a developer spike found it works on `eleven_v4`, returns one entry per input character, joined characters match the input exactly, and audio tags stay in the alignment with their own timing. ([livekit-avatar issue #1](https://github.com/peted70/livekit-avatar/issues/1))
- Another developer found v4 alignment runs about 80 ms past the end of the audio, and `normalized_alignment` matched `alignment`. ([chaptercast PR #19](https://github.com/robbe1999/chaptercast/pull/19))
- fal.ai's hosted Eleven v4 listing exposes a `timestamps` option returning character-level timing. ([fal.ai Eleven v4](https://fal.ai/models/elevenlabs/tts/eleven-v4/llms.txt))

**Commercial rights**
- Free plan has no commercial rights; Starter is the cheapest paid tier with a commercial license. Voices taken from the Voice Library may carry extra terms set by their creator. ([magichour.ai](https://magichour.ai/blog/elevenlabs-pricing); [bigvu](https://bigvu.tv/blog/elevenlabs-pricing-2026-plans-credits-commercial-rights-api-costs/))
- A May 2026 article discusses ElevenLabs voice cloning in the context of the US NO FAKES Act (consent and likeness rights for voice clones). ([Fora Soft, 31 May 2026](https://www.forasoft.com/learn/ai-for-video-engineering/articles-ai/elevenlabs-pricing-voice-cloning-no-fakes-act))

### Inferences
- Volume math: 250 English words is roughly 1,400 to 1,500 characters (about 5.7 to 6 characters per word including spaces). 30 videos is about 45,000 characters per month of final takes; at 3 takes per line that is about 135,000 characters. At $0.08 per 1K that is roughly $4 to $11 of API usage per month, so cost is negligible and the decision is about features.
- Plan fit: Creator ($22/month, ~121K credits, PVC, commercial license) covers the expected volume on v4 if retakes stay modest; Pro ($99) gives headroom if the pipeline auto-generates multiple variants per line. Starter ($6) works only if an IVC is good enough.
- Recommended path: start with an IVC (minutes to create) to unblock the pipeline, then train a PVC from 30+ minutes of the creator's clean archive audio and A/B both on v4.
- Captions: character alignment can be rolled up into word timings by splitting on whitespace; audio tags must be stripped from the caption track but kept in the timing math. Trim the final ~80 ms of alignment or clamp to audio duration.
- Because v4 is non-deterministic and tags are not always followed, the pipeline should support per-segment regeneration (generate per segment or per sentence, then stitch) rather than one long render.

### Gaps
- Whether Professional Voice Clones are fully supported/optimized on Eleven v4 and v4 Turbo. (ElevenLabs historically advised that PVCs were not fully optimized for v3; I could not confirm v4 status because elevenlabs.io was not fetchable.)
- Official IVC minimum and maximum sample length, and official current PVC data guidance (the 30 min / 3 h figures are from an older blog post).
- Per-request character limit for v4 and concurrency limits per plan.
- Whether ElevenLabs' standalone Forced Alignment API is still offered and its price (not surfaced in searches).
- Exact voice-clone ownership and output license terms (terms of service not retrieved).

## 2. Alternatives: Cartesia, Fish Audio, PlayHT, Resemble, OpenAI, Google Gemini, Hume, MiniMax, open source

### Takeaway
Credible paid alternatives are Cartesia Sonic (word and phoneme timestamps, cheap entry plans), Fish Audio (very low per-character price, fast cloning), MiniMax Speech (cheap, explicit clone fee), and Hume Octave (expressive, short-sample cloning). PlayHT is dead. OpenAI and Google custom voices are gated behind sales or allowlists. For open source with commercial use, Chatterbox (MIT) and Dia (Apache 2.0) clone voices; F5-TTS weights and XTTS-v2 are non-commercial.

### Cited Findings
**Leaderboards (context for quality)**
- Artificial Analysis runs separate boards: provider-voice (each vendor's native voices) and controlled-voice (all models cloning the same 8 voices, 4 US and 4 UK). On the latest provider-voice snapshot, the top open-weights model is Fish Audio Drama 3 (Elo 1278). ([AA provider-voice](https://artificialanalysis.ai/text-to-speech/leaderboard/provider-voice); [AA controlled-voice](https://artificialanalysis.ai/text-to-speech/leaderboard/controlled-voice))
- Earlier 2026 snapshots had Alibaba's Fun-Realtime-TTS at #1 (Elo 1,219 over 962 appearances) ahead of Gemini 3.1 Flash TTS and Inworld Realtime TTS-2, with the top separated by about 24 Elo points. ([Artificial Analysis article](https://artificialanalysis.ai/articles/fun-realtime-tts-new-text-to-speech-model-topping-artificial-analysis-leaderboard); [AA on X](https://x.com/artificialanlys/status/2062016529848222073))
- Inworld Realtime TTS-2 is listed at 1146 on the controlled-voice (cloning) board. Speechify (vendor) claims Simba 3.2 scored 1,244 (plus or minus 13) on 13 Oct 2026. ([AA controlled-voice](https://artificialanalysis.ai/text-to-speech/leaderboard/controlled-voice); [Speechify blog](https://speechify.ai/blog/simba-3-tops-artificial-analysis-tts-leaderboard))

**Cartesia (Sonic)**
- Model generations: Sonic 3 (Oct 2025), Sonic 3.5 (GA May 2026); a dated snapshot `sonic-3.6-2026-08-27` is listed as Stable in a developer directory. Sources conflict on which is the current default. ([invideo, Aug 2026](https://invideo.io/blog/cartesia-sonic-ai-voice/); [developersdigest](https://www.developersdigest.tech/models/speech/cartesia))
- API exposes word-level timestamps, phoneme-level timestamps, and an option to normalize timestamps to a 0 to 1 range. ([AWS Marketplace Sonic 3 listing](https://aws.amazon.com/marketplace/pp/prodview-w2bmik3jypagm))
- Plans: Pro $5/month with 100K credits, commercial license and instant cloning; Startup $49/month with 1.25M credits and professional cloning; an older (Nov 2025) review lists a $299 Scale tier. PVC credit cost conflicts (1 vs 1.5 credits per character). ([developersdigest](https://www.developersdigest.tech/models/speech/cartesia); [eesel, Nov 2025](https://www.eesel.ai/blog/cartesia-sonic-3-pricing))

**Fish Audio**
- S1 API priced at $15 per million UTF-8 input bytes, no subscription minimum; Fish lists S1 as legacy with S2.1-Pro as the recommended successor. One source says S1 retires 31 Dec 2026; another says it remains supported. Plus plan listed at $11 or $15/month depending on source. ([OpenRouter S1 listing](https://openrouter.ai/fish-audio/s1); [therundown](https://www.therundown.ai/tools/fish-audio-s1); [texttolab](https://texttolab.com/blog/fish-audio-pricing))
- Reviewers report cloning from about 15 seconds of audio. ([bitdoze review](https://www.bitdoze.com/fish-audio-review/); [knowara](https://knowara.com/ai-tools/voice/fish-audio-review/))

**PlayHT**
- Meta acqui-hired the PlayAI/PlayHT team in July 2025; the service shut down 31 Dec 2025, taking the API and saved voice clones offline (one outlier source dates the acquisition to Dec 2025). ([killedbyai](https://killedbyai.net/dead/playai-playht/); [aitoolgraveyard](https://aitoolgraveyard.com/what-happened-to-play-ht); [agilelogics](https://www.agilelogics.com/news/playht))

**Resemble AI**
- Chatterbox is open-sourced under MIT; Resemble claimed (2025) that 63.75% of listeners preferred it over ElevenLabs in blind tests (vendor claim). Secondary sources mention a default-on PerTh watermark. ([GitHub resemble-ai/chatterbox](https://github.com/resemble-ai/chatterbox); [Hugging Face](https://huggingface.co/ResembleAI/chatterbox); [Resemble on X](https://x.com/resembleai/status/1927755087620796668))
- Chatterbox Multilingual v3 covers 25 languages. ([localaimaster](https://localaimaster.com/blog/chatterbox-multilingual-v3))

**OpenAI**
- Custom voices are gated: eligible customers via sales, capped at 20 per organization, mandatory consent recording, about 30 seconds of sample audio. `gpt-4o-mini-tts` is priced per audio token rather than per character. ([MarkTechPost, 21 Sep 2026](https://www.marktechpost.com/2026/09/21/best-voice-cloning-apis-in-2026-speaker-similarity-consent-checks-and-price-per-1m-characters/))

**Google Gemini TTS**
- Google's Instant Custom Voice is allowlist-only. Gemini 3.1 Flash TTS (preview) is priced at $1 per 1M text input tokens and $20 per 1M audio output tokens. ([MarkTechPost](https://www.marktechpost.com/2026/09/21/best-voice-cloning-apis-in-2026-speaker-similarity-consent-checks-and-price-per-1m-characters/); [teamday](https://www.teamday.ai/blog/best-ai-voice-models-2026))

**Hume Octave 2**
- Clones from as little as 15 seconds of consenting-speaker audio. Extra characters cost $0.15 per 1K on Creator, down to $0.05 on Business. Conflict on API cloning access: one source says API cloning is Enterprise-only, another says cloning is unlimited on every tier; commercial use reportedly starts on Creator ($14/month) with Free and Starter non-commercial. ([Speechify Hume alternatives, Jul 2026](https://speechify.ai/alternatives/hume); [cekura](https://www.cekura.ai/blogs/best-tts-for-ai-voice-agents); [buildmvpfast, Jun 2026](https://www.buildmvpfast.com/api-costs/ai-voice))

**MiniMax Speech**
- Official pay-as-you-go: $60 per million characters for Turbo models (speech-2.6-turbo, speech-02-turbo) and $100 per million for HD models (speech-2.6-hd, speech-02-hd). A cloned/designed voice costs $3, billed on first synthesis use; a rapid clone is temporary unless used within 168 hours. ([MiniMax pricing docs](https://platform.minimax.io/docs/guides/pricing-paygo))
- Resellers list Speech 2.8 HD at $0.063 per 1K characters and Speech 2.8 Turbo at $0.04 per 1K. ([apimodels](https://apimodels.app/docs/audio); [aiapi-pro](https://aiapi-pro.com/blog/minimax-speech-tts-api-vs-elevenlabs-2026))

**Open source**
- Kokoro (82M): Apache 2.0, CPU-capable, 54 preset voices, no cloning. ([yaps.ai license roundup](https://www.yaps.ai/blog/best-local-tts-models); [tryspeakeasy](https://www.tryspeakeasy.io/blog/open-source-text-to-speech-2026))
- Dia (1.6B, Nari Labs): Apache 2.0, cloning via audio prompt, English, GPU about 4.4 GB. ([yaps.ai](https://www.yaps.ai/blog/best-local-tts-models); [Cartesia open-source TTS by license](https://www.cartesia.ai/learn/open-source-tts))
- Chatterbox: MIT with English cloning; described as the highest-ranked clearly open-weight model on TTS Arena by one source. ([Cartesia open-source TTS](https://www.cartesia.ai/learn/open-source-tts))
- XTTS-v2: Coqui Public Model License, non-commercial for model and outputs; Coqui has shut down so no commercial license can be bought. ([promptquorum](https://www.promptquorum.com/power-local-llm/local-tts-voice-cloning-piper-coqui-xtts))
- F5-TTS: code MIT but pretrained weights CC-BY-NC (Emilia training data), restriction carries to fine-tunes; community OpenF5-TTS is Apache 2.0 but reported as lower quality. ([yaps.ai](https://www.yaps.ai/blog/best-local-tts-models); [ocdevel](https://ocdevel.com/blog/20250720-tts))
- VibeVoice (Microsoft): listed as MIT research-only; Microsoft removed the long-form TTS code on 5 Sep 2025; described as not a cloning model. Sources conflict. ([yaps.ai](https://www.yaps.ai/blog/best-local-tts-models); [localaimaster](https://localaimaster.com/blog/best-local-tts-models))

### Inferences
- For a creator-voice product where clone fidelity matters most, the shortlist is ElevenLabs (v4 + PVC) first, Cartesia Sonic second (cheaper, native word timestamps), then Fish Audio or MiniMax as low-cost fallbacks. OpenAI and Google are not practical today because custom voices require sales approval or an allowlist.
- At about 45K to 135K characters per month, the absolute cost difference between providers is a few dollars; per-character price should not drive the choice.
- Self-hosting open source (Chatterbox/Dia) is only worth it for data-control reasons; it adds GPU hosting and ops from a Node backend (would need a Python sidecar or a hosted endpoint).

### Gaps
- Head-to-head clone-similarity scores on the Artificial Analysis controlled-voice board for ElevenLabs PVC vs Cartesia vs Fish (page not fetchable; only snippets).
- Timestamp/alignment support for Fish Audio, MiniMax, Hume and Resemble's hosted API (not found).
- Sesame CSM license and status (not returned by searches).
- Resemble AI's hosted API pricing and clone requirements in 2026 (not found).
- Whether OpenAI's gpt-realtime family supports custom voices (no result).

## 3. Avatar-tool integration (HeyGen) and alignment timestamps for captions and edit timing

### Takeaway
The reliable integration path is "generate audio with your TTS provider, then hand HeyGen the audio": HeyGen's v2 video generate API accepts a voice of type `audio` with exactly one of `audio_url` or `audio_asset_id` (from its Upload Asset API). HeyGen's studio UI can use ElevenLabs voices directly, but no official evidence was found that the HeyGen API accepts an ElevenLabs voice ID. For captions, ElevenLabs (character-level) and Cartesia (word and phoneme level) both return timing data.

### Cited Findings
- HeyGen docs: set voice type to `audio` and supply either `audio_url` or `audio_asset_id` in Voice Settings; exactly one must be provided, both or neither returns an error; the asset ID comes from the Upload Asset API; example uses the v2 video generate endpoint. Note: one copy of this page is marked "archived". ([HeyGen: Using Audio Source as Voice](https://docs.heygen.com/docs/using-audio-source-as-voice); [archived version](https://docs.heygen.com/docs/using-audio-source-as-voice-archived))
- A developer forum post reports a 404 when passing a OneDrive download link as `audio_url` with `script_type: "audio"` on `/v1/video/generate` (no accepted answer), suggesting the URL must be a direct public file. ([HeyGen developer forum](https://docs.heygen.com/discuss/67f693cca0b91d0068155a8b))
- HeyGen's blog says its studio can use ElevenLabs voices directly while HeyGen handles lip-sync (studio feature, not confirmed API behavior). ([HeyGen blog](https://www.heygen.com/blog/elevenlabs-alternatives))
- A real-world open-source project (Oct 2026) pairs ElevenLabs narration with HeyGen avatars by generating the WAV first and having HeyGen animate to it; the author notes it was not yet tested against the live HeyGen API. ([faceless PR #15](https://github.com/radoslav1992/faceless/pull/15))
- Per HeyGen (vendor source), ElevenLabs added lip-synced avatar video in June 2026 with Avatars inside ElevenCreative. ([HeyGen comparison](https://www.heygen.com/blog/heygen-vs-elevenlabs-vs-rask-ai-vs-dubverse))
- Timing outputs: ElevenLabs `/with-timestamps` returns per-character timing (works on v4); Cartesia exposes word-level and phoneme-level timestamps. ([livekit-avatar issue #1](https://github.com/peted70/livekit-avatar/issues/1); [AWS Marketplace Cartesia listing](https://aws.amazon.com/marketplace/pp/prodview-w2bmik3jypagm))

### Inferences
- Architecture: TTS (ElevenLabs/Cartesia) produces `audio.wav` + alignment JSON; upload audio to HeyGen via Upload Asset (avoids fragile third-party URLs) and pass `audio_asset_id`; use the same alignment JSON to drive captions, B-roll cut points and on-screen text timing in the editor (e.g. Remotion/FFmpeg). This keeps one source of truth for timing regardless of avatar vendor.
- Provider-agnostic fallback for any TTS without timestamps: run a speech-to-text model with word timestamps (or a forced aligner) over the generated audio against the known script.

### Gaps
- Current (non-archived) HeyGen v2/v3 API schema for the voice object, and whether it accepts third-party voice IDs (e.g. ElevenLabs) directly.
- Whether other avatar tools (Synthesia, Captions/Mirage, Tavus, Higgsfield) accept uploaded audio via API; not researched in this pass.
- HeyGen API pricing per minute for audio-driven avatar renders (out of scope here, not found).

## 4. Voice-to-voice / speech-to-speech options to keep natural prosody

### Takeaway
ElevenLabs Voice Changer is the main documented speech-to-speech option for "creator records a rough read in any voice or quality, output in the cloned voice with the original timing and intonation", at about $0.12 per minute. The newer realtime "speech-to-speech" products (ElevenLabs Realtime v1, OpenAI GPT-Live, Ultravox) are conversational agent APIs, not voice converters.

### Cited Findings
- ElevenLabs' API pricing page lists Voice Changer at $0.12 per minute (Voice Isolator also $0.12 per minute), described as turning any recording into another voice; the snippet is from a page about 263 days old (around Feb 2026). ([ElevenLabs API pricing](https://elevenlabs.io/pricing/api))
- In plan credits, Voice Changer and Voice Isolator cost about 1,000 credits per minute. ([oakgen](https://oakgen.ai/blog/elevenlabs-pricing-limits-cost))
- ElevenLabs launched Realtime v1 Mini and Max in October 2026, described as its first native speech-to-speech models, at $0.08 per minute plus LLM usage (agent-style, OpenAI Realtime-compatible). ([developersdigest realtime pricing](https://www.developersdigest.tech/models/speech/realtime); [aipricing.guru](https://www.aipricing.guru/ai-voice-tts-api-pricing/))
- Other speech-to-speech/agent APIs: OpenAI GPT-Live about $0.05/min, Ultravox $0.05/min, AssemblyAI Voice Agent API $4.50/hour (about $0.075/min). ([developersdigest realtime pricing](https://www.developersdigest.tech/models/speech/realtime); [AssemblyAI blog](https://www.assemblyai.com/blog/best-speech-to-speech-voice-agent-api))

### Inferences
- A hybrid workflow is worth offering: default to text-to-speech for fully automated videos, and let the creator optionally record a quick phone read of the script that gets passed through Voice Changer into their clean cloned voice. This keeps their real pacing, emphasis and humor, and costs about $0.12 to $0.18 per 60 to 90 second video.
- Voice Changer output can be aligned to the script with STT word timestamps for captions, since it does not return TTS-style alignment (assumption; not confirmed).

### Gaps
- Whether ElevenLabs Voice Changer works with PVC voices on its latest STS model, and whether it returns timestamps.
- Cartesia and Resemble speech-to-speech/voice-conversion pricing and quality (not found in results).
- No independent benchmark on prosody preservation in voice conversion was found.

## 5. Script generation: frameworks, creator style profile, structured shot-list JSON, best LLMs, cost per script

### Takeaway
2026 guides converge on Hook (first 0.5 to 3 seconds) then Body with a visual change every 2 to 5 seconds then a single CTA in the last 2 to 5 seconds, but most retention stats come from vendor blogs and are unverified. The cheapest robust approach to "sound like the creator" is a written style profile extracted from past transcripts plus 3 to 5 exemplar scripts (few-shot), with JSON schema-constrained output for the shot list; fine-tuning is a later option if drift persists. Claude models lead the most-cited creative-writing benchmark, and at this volume LLM cost is cents per script.

### Cited Findings
**Short-form structure and retention**
- Common structure is Hook, Body (or Problem/Solution), CTA. One guide gives a 30-second word budget: about 10 words hook, 25 problem, 30 solution, 15 CTA (about 80 words total). ([cloudixdigital Hook-Body-CTA](https://cloudixdigital.com/the-hook-body-cta-blueprint-10-short-form-video-scripts-to-master-social-search-and-conversions/); [socialync](https://www.socialync.io/blog/short-form-video-structure-guide-2026))
- Hook window: 1 to 3 seconds on TikTok/Reels in some guides; others say the first 0.5 seconds needs something arresting, with the rest of the hook delivering the core promise. ([jmltechstudios](https://www.jmltechstudios.com/blog/video-hooks-first-3-seconds); [virvid](https://virvid.ai/blog/first-3-seconds-hook-faceless-shorts-2026))
- Pattern interrupts: contrarian statement, surprising stat, bold question, visual shock; one guide warns overuse makes the chaos predictable. ([virvid frameworks](https://virvid.ai/blog/short-video-script-frameworks-with-trending-examples); [jmltechstudios](https://www.jmltechstudios.com/blog/video-hooks-first-3-seconds))
- Body pacing: change the visual every 3 to 5 seconds (one guide) or every 2 to 3 seconds with one idea per sentence (another). ([gpt.social](https://gpt.social/blog/how-to-script-short-form-videos-2026); [cloudixdigital](https://cloudixdigital.com/the-hook-body-cta-blueprint-10-short-form-video-scripts-to-master-social-search-and-conversions/))
- CTA: one specific action at the end, final 2 to 5 seconds. ([hooked.so](https://www.hooked.so/blog/how-to-script-a-video); [eliro](https://eliro.pro/blog/short-form-video-hooks-script-guide-2026))
- Unverified headline stats circulate (e.g. "41% retention lift" from a strong first second, a "118,000 viral videos" sample) and should be treated as directional only. ([cloudixdigital](https://cloudixdigital.com/the-hook-body-cta-blueprint-10-short-form-video-scripts-to-master-social-search-and-conversions/))

**Creator style profile**
- Few-shot prompting is the recommended starting point (no training cost); fine-tuning bakes in persona/tone/format but can reduce output diversity. ([ertas.ai, 2026](https://www.ertas.ai/compare/fine-tuning-vs-few-shot); [Medium: few-shot vs fine-tuning](https://medium.com/@chaisarfati/few-shot-prompting-vs-fine-tuning-f255f333820c))
- Practitioners report few-shot can drift on voice for some inputs. ([PromptHub few-shot guide](https://www.prompthub.us/blog/the-few-shot-prompting-guide))
- Research on character-style imitation compares zero-shot prompts built from a persona profile with few-shot prompts that add examples (closest academic analog to a creator style profile). ([arXiv 2403.12368](https://arxiv.org/pdf/2403.12368); [arXiv 2407.15556 SETTP](https://arxiv.org/pdf/2407.15556))

**Structured output (shot list JSON)**
- Claude API supports schema-constrained responses via `output_config.format` (the old `output_format` parameter is deprecated), `client.messages.parse()` for validated parsing, and `strict: true` on tool definitions for schema-exact tool inputs. Current Opus 5.5 / Sonnet 5.5 reject forced `tool_choice`, so structured outputs is the recommended way to force JSON. Message Batches run at 50% cost. ([Anthropic Claude API reference, bundled claude-api skill, cached 2026-10-06; live docs at platform.claude.com](https://platform.claude.com/docs/en/build-with-claude/structured-outputs))

**LLM quality for creative writing**
- EQ-Bench Creative Writing v3: a June 2026 digest lists Claude Opus 4.7 at #1 (Elo 2050.8) ahead of GPT-5.4 (1906.0); an April 2026 ranking has Opus 4.7 at 2216, GPT-5.5 at 2024, Claude Sonnet 4.6 at 1991. Best open-weight entry cited: Kimi K2.6 at 1,782. ([Aggregate Digest, 1 Jun 2026](https://buttondown.com/theaggregate/archive/ai-benchmark-digest-2026-06-01/); [awesomeagents creative writing board](https://awesomeagents.ai/leaderboards/creative-writing-llm-leaderboard/); [layer3labs, Jul 2026](https://www.layer3labs.io/guides/ai-writing-benchmarks))
- Caveat: an Aug 31 2026 analysis notes the EQ-Bench page has no as-of date, and that arena.ai's Creative Writing board ranks the same models in close to opposite order; a critic argues EQ-Bench can negatively correlate with high-quality writing. ([digitalapplied, 31 Aug 2026](https://www.digitalapplied.com/blog/which-ai-model-writes-best-leaderboards-disagree))

**LLM pricing (per 1M tokens)**
- Anthropic (first-party, cached 2026-10-06): Claude Fable 5.1 $10 in / $50 out; Claude Opus 5.5 $4 / $20 (cache reads $0.20); Claude Sonnet 5.5 $2 / $10 (cache reads $0.20); Claude Haiku 5.5 $0.10 / $0.50 for prompts up to 100K tokens. All have 1M context. ([Anthropic pricing, via bundled claude-api skill table](https://platform.claude.com/docs/en/about-claude/pricing))
- OpenAI (aggregators, conflicting): GPT-6-astra $10 in / $1 cached / $50 out; GPT-5.5 $5 / $30; a mid-tier "gpt-6.1-sol" at about $2 / $10. ([benchlm pricing, Oct 2026](https://benchlm.ai/llm-pricing); [thefrontierwire, Oct 2026](https://thefrontierwire.com/articles/llm-api-pricing-compared/); [modelgrep](https://modelgrep.com/pricing))
- Google (aggregators, conflicting): Gemini 3.1 Pro preview $2 / $12 (prompts up to 200K); gemini-3.7-flash $0.75 / $0.075 cached / $3.75 (rates through 31 Dec 2026); a "Gemini 4 Argon" mid-tier at about $2 / $10. ([inventivehq, Oct 2026](https://inventivehq.com/blog/llm-api-cost-comparison); [morphllm, Oct 2026](https://www.morphllm.com/llm-api); [thefrontierwire](https://thefrontierwire.com/articles/llm-api-pricing-compared/))

### Inferences
- Word budget reality check: at roughly 150 to 165 spoken words per minute, a 30-second script is about 75 to 85 words and a 90-second script about 225 to 250 words. The pipeline should take a target duration and derive a word budget per segment, then verify against the TTS audio length after synthesis.
- Style profile approach (example data flow): ingest 20 to 50 past transcripts, have the LLM extract a structured profile (signature openers, sentence length distribution, filler words and catchphrases, humor style, taboo words, CTA phrasing, pacing), store it as versioned JSON, then at generation time send profile + 3 to 5 nearest-neighbor exemplar transcripts (by topic embedding) + source content. Add an LLM-as-judge "does this sound like the creator" score against held-out transcripts before considering fine-tuning.
- Suggested shot-list schema per segment: `{ index, role: "hook"|"body"|"pattern_interrupt"|"cta", spoken_line, est_duration_s, on_screen_text, broll_prompt, broll_source: "avatar"|"stock"|"generated"|"screen_capture", sfx_or_tag }`, plus top-level `title`, `hook_variants[3]`, `target_duration_s`, `word_count`. Enforce with JSON schema via structured outputs so the orchestrator never has to repair JSON.
- Approximate cost per script (assumes about 10K input tokens of style profile, exemplars and source; about 6K output tokens including thinking): Claude Opus 5.5 about $0.16; Claude Sonnet 5.5 about $0.08; Claude Haiku 5.5 under $0.01; Claude Fable 5.1 about $0.40; GPT-5.5 about $0.23; Gemini 3.1 Pro about $0.09. Even with 3 hook variants and 2 revision rounds, 30 scripts per month stay under about $15 on any flagship. Prompt caching of the static style profile cuts input cost further.
- Model choice: given benchmark leadership of Claude in creative writing (with the caveat that leaderboards disagree), Claude Opus 5.5 for drafting and Sonnet 5.5 or Haiku 5.5 for extraction/judging is a reasonable default; run a blind A/B against GPT and Gemini on the creator's own content before locking in.

### Gaps
- No creative-writing benchmark results found for the newest models (Claude Opus 5 / 5.5, Fable 5.1, GPT-6 family, Gemini 4); benchmarks found stop at Opus 4.7 / GPT-5.5.
- No independent, peer-reviewed retention data for short-form hook structures was found; all figures are from vendor or agency blogs.
- No head-to-head evidence on few-shot vs fine-tuning specifically for creator voice in video scripts.
- OpenAI and Google pricing came only from aggregators with conflicting model names; official pages were not checked.

## 6. Trend and research input tools per niche

### Takeaway
For a Node backend, a search API (Brave or Perplexity at about $5 per 1,000 requests, Exa at about $7 for semantic/"find similar" research) plus the X pay-per-use API covers trend discovery cheaply. Google Trends has only an application-gated alpha API, and Reddit commercial access requires a negotiated agreement, so both are hard to rely on.

### Cited Findings
- Exa: $7 per 1,000 requests for auto/fast search, $4 for instant, up to 10 results included, $1 per 1,000 per extra result; free credit details conflict ($20 signup + $10/month vs 20,000 requests/month). ([fastcrw, 2026](https://fastcrw.com/blog/web-search-api-pricing-2026); [keirolabs](https://keirolabs.cloud/blogs/comparisons/ai-search-api-pricing-compared))
- Perplexity: raw Search API $5 per 1,000 requests, Fast Search $1 per 1,000; Sonar (answer model) $5 to $12 per 1,000 requests plus $1/$1 per 1M tokens; Perplexity removed the free API credit bundled with Pro. ([keirolabs](https://keirolabs.cloud/blog/web-search-apis-for-agents-2026); [beri.net](https://www.beri.net/article/tavily-vs-exa-vs-brave-vs-perplexity-search-api-agent-cost-2026))
- Brave Search API: $5 per 1,000 requests, up to 50 requests/second on Pro AI; standalone free tier removed in 2026, card required, $5 monthly credit covers about 1,000 queries. Tavily is about $8 per 1,000 pay-as-you-go. ([fastcrw](https://fastcrw.com/blog/web-search-api-pricing-2026); [beri.net, Oct 2026](https://www.beri.net/article/tavily-vs-exa-vs-brave-vs-perplexity-search-api-agent-cost-2026))
- Google Trends API: official alpha announced 24 July 2025, application-gated, no self-serve key or public pricing; some applicants report no response. pytrends (unofficial) is archived. ([lilachbullock](https://www.lilachbullock.com/google-trends-api/); [scrapebadger](https://scrapebadger.com/blog/does-google-trends-have-an-api-what-to-use-in-2026); [dev.to pytrends archived](https://dev.to/rimulabs/pytrends-is-archived-how-to-migrate-your-google-trends-code-no-more-429s-4e63))
- X API: pay-per-use is the default: $0.005 per post read, $0.010 per user read, $0.015 per post created ($0.20 for a post with a link); monthly read cap cited as 3M (one source says 2M). Legacy Basic moved to pay-per-use after 1 June 2026; legacy Pro deprecated, migrating after 1 Sep 2026. ([postproxy](https://postproxy.dev/blog/x-api-pricing-2026/); [outstand](https://www.outstand.so/blog/x-api-pricing); [blotato](https://www.blotato.com/blog/twitter-api-pricing))
- Reddit Data API: free for non-commercial use at 100 queries/minute; commercial use requires a separate agreement with no public rate card. The $0.24 per 1,000 calls figure dates from June 2023; a roughly $12,000/month commercial floor appears in 2026 third-party reporting. ([prowlo](https://prowlo.com/blog/reddit-data-api); [socialcrawl](https://www.socialcrawl.dev/blog/reddit-data-api-2026); [Wikipedia: Reddit API controversy](https://en.wikipedia.org/wiki/Reddit_API_controversy))
- Claude's API has a server-side web search tool (`web_search_20260209`, with domain allow/block lists) and web fetch tool on current Opus/Sonnet models, so the script agent can research without a separate search integration. ([Anthropic Claude API reference, bundled claude-api skill; live docs](https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-search-tool))

### Inferences
- Example research flow per niche: nightly job runs 20 to 50 Brave/Perplexity queries (news + "this week" phrasing) and an X recent-search pull on niche keywords and accounts, dedupes topics, scores by recency and engagement, then sends the top 5 to the script agent with source URLs. At this scale search costs are well under $10/month (e.g. 1,500 queries at $5/1K = $7.50), and X reads at $0.005 each cost $5 per 1,000 posts.
- Use Exa for "find similar to this creator's best videos/articles" semantic discovery rather than for news.
- Skip direct Reddit API for a commercial product unless an agreement is in place; use search APIs with `site:reddit.com` style queries instead (assumption: check each search API's terms on derived use).

### Gaps
- News-specific APIs (NewsAPI, GDELT, Event Registry) and YouTube/TikTok trend data sources (YouTube Data API, TikTok Creative Center/Research API) were not researched in this pass.
- Pricing for Claude's server-side web search tool per search was not in the material retrieved.
- Official X and Reddit developer pages were not fetched; numbers are from third-party guides.

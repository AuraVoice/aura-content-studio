# Play Store launch: Aura remembers you

Status: delivered 2026-11-21. App: Aura for Android 2.21.0+39, filmed on a Pixel 10 Pro XL with the
demo account. Length 19.6 s. Formats: 16:9 (Play promo video via YouTube), 9:16 (Reels, Shorts,
TikTok), 1024x500 feature graphic.

## Brief

Google Play listing campaign on the keywords AI companion, AI friend, AI best friend, personal AI,
AI chat friend, talk to AI, AI buddy, someone to talk to, AI that remembers you, virtual friend.
Short description: "Buddy remembers you, talks like a friend, and gets your day done."

People searching these want to be remembered without re-explaining; they doubt the memory is real
and private. So the hero is memory you can see and edit (Your Aura), proven on real screens, with
the agent doing real work around it.

## Beat table

| Time (s) | Real screen | Headline | Sub |
|---|---|---|---|
| 0.0 to 3.9 | Voice call; Aura opens with "hey, how's that steady running habit coming along?" (redrawn 2.2x, types in with the speech) | It remembers you. | Aura picks up right where you left off. |
| 3.95 to 8.95 | Text chat: "What should I focus on this week?", 0.6 s thinking, reply knows the running habit and Madrid; zoom and 2 s hold | It knows your week. | Answers shaped by what you've shared. |
| 9.0 to 13.3 | Reminder cards, then a pan to the 7:00 AM daily alarm | Gets your day done. | Just ask, by voice or text. |
| 13.35 to 16.4 | Your Aura memory profile with the Memory switch | See what it remembers. | Edit it, or switch memory off, anytime. |
| 16.45 to 19.6 | End card: orb becomes the app icon, Aura wordmark | Aura remembers you, and gets your day done. | AI COMPANION, auravoiceapp.com |

Transitions are sequential: out 150 ms, 50 ms empty, next in.

## Pixel edits

All made by `recipes/prepare.py` from the raw files in `capture/`.

| Screen | Edit | Why |
|---|---|---|
| Voice call recording | Erased the app's small transcript (rows 440 to 650 of every frame) | Redrawn larger and darker in HTML for legibility |
| Chat recording | Re-cut: dots 0.5 s, "Thinking..." 0.6 s, reply holds | Pace |
| Chat recording | Header "Buddy" and composer "Ask Buddy anything..." to Aura, every frame | Brand rename |
| Reminders still | Two real captures of the same chat merged; "12:25 AM" to "7:00 AM" in the request, the reply and the alarm card; "Next today" to "Next tomorrow" | A believable wake-up time |
| Reminders still | Removed "One thing first: turn on Alarms & reminders..." paragraph | Permission nag, not the product |
| Your Aura still | "Buddy remembers what matters to you" and "GOALS BUDDY HAS NOTICED" to Aura | Brand rename |

## Decisions

- Dropped "the call keeps going when locked": the lock screen only shows a tiny status icon over a personal wallpaper, which proves nothing and leaks personal data.
- No device frame and no badges on the feature graphic (Google rule). Its small labels were darkened to pass 4.5:1 contrast.
- One scene set renders both 16:9 and 9:16 through the `layout` variable.

## Open items

- The feature graphic headline still says "Buddy remembers you." while the video says Aura.
- The shipping app still shows "Buddy"; the edited screens show "Aura". Publish once the app ships the rename, since Google wants promo videos to show the real app.
- Music (`assets/music/song-570.mp3`, from the Aura ad kit) has an unverified license. Confirm it allows paid ads before publishing.

## Reproduce

```powershell
python video-studio/tools/studio.py prepare 2026-11-21-play-store-launch   # optional: screens are committed
python video-studio/tools/studio.py check   2026-11-21-play-store-launch
python video-studio/tools/studio.py render  2026-11-21-play-store-launch   # needs the music file, or --silent
```

Re-rendering produces byte-identical MP4s (verified 2026-11-21).

# Rascal Runways — grow the VC / angel outreach

For: George Igwe, founder
Send-from: `founder@rascalrunways.com`
Product: https://www.rascalrunways.com
Deck: https://www.rascalrunways.com/pitch.html
TikTok: https://www.tiktok.com/@rascalrunways (ads in production)
Opt-out (every outbound): `Not for you? Reply PASS.`
This note assumes machine-setup is done (Zoho mailbox, list parsed, tracker CSV, day-1 queue). It is an operating rundown, not a send script. Do not send from this file.

Hard facts — do not invent waitlist counts, revenue, luxury-house licenses, or a live App Store listing. iOS is an in-repo wrapper. Boutique SKUs are original / inspired product vision. Ask is angel / pre-seed conversations, planning range $250–500k, illustrative, not a priced round.

Source files:

- `docs/investor-contacts.csv` — 3,606 unique contacts; 2,266 with usable email; 1,240 firms among emailed rows
- `docs/investor-reply-tracker.csv` — one row per emailed address; statuses live here
- `docs/investor-send-queue-day1.csv` + `docs/investor-emails-day1.md` — copy-ready first-touches
- `docs/investor-outreach-pack.txt` — body, subjects A/B/C, follow-up / breakup, status SOP

Operating cadence (overrides the pack’s old 25/day cap): **10 first-touches per weekday at 6:00am Mountain Time**. Follow-ups (day 6) and breakups (day 13) do not consume the 10-slot cap. Never re-email the same address on the same calendar day. Skip Sat/Sun; if day-6 or day-13 lands on a weekend, slide to the next Monday. If a Monday is a US market holiday, slide to the next weekday.

---

## 1. 90-day math

Clock starts Wednesday 2026-09-02. Cadence is 10 unique first-touches / weekday, not 10 calendar-day.

| Window | Weekdays | Unique first-touches |
| --- | ---: | ---: |
| 90 calendar days (2026-09-02 → 2026-11-30) | 64 | **640** |
| Same window, skip US market holidays (Labor Day 9/7, Columbus 10/12, Veterans 11/11, Thanksgiving 11/26) | 60 | **600** |
| 13 weeks of Mon–Fri | 65 | **650** |
| Full email list at 10/weekday | 227 | **2,266** |

Exhaustion of the 2,266 emailed contacts: **227 weekdays ≈ 45.3 weeks ≈ 10.4 months**. Last first-touch lands about **Thursday 2027-07-15** if you never miss a weekday and you email every address (including multiple GPs at the same firm).

If you enforce **one GP per firm** (1,240 emailed firms), first-touches exhaust in **124 weekdays ≈ 25 weeks ≈ late February 2027**. That is the better default (see §2). The remaining 1,340 contacts with no usable email are LinkedIn / warm-intro only — they never enter the 10/day Zoho queue.

Steady-state daily volume after week 3 (this is what inboxes and Zoho reputation actually see):

- 10 first-touches (`SENT_1`)
- ~10 day-6 follow-ups (`SENT_2`)
- ~10 day-13 breakups (`SENT_3`)
- **≈ 30 outbound / weekday** from `founder@rascalrunways.com`

Do not raise the first-touch cap to catch up. Volume is already 3× the first-touch number. Reputation is the constraint, not list size.

### Expected reply bands (unique first-touches, 90 calendar days)

These are planning bands, not forecasts. Cold investor email is noisy; treat anything outside the band as a process signal, not luck.

| Band | What it means | Any-reply rate | Replies on 640 touches | Meeting-positive (subset) |
| --- | --- | ---: | ---: | ---: |
| Floor | Generic body, weak thesis match, still + PNG only | 1–3% | 6–19 | 1–2% → 6–13 |
| Base | Custom intro + live product + deck link + PASS | 4–8% | 26–51 | 1.5–3% → 10–19 |
| Strong | Video in body + one GP/firm + thesis match + warm overlay | 8–15% | 51–96 | 3–6% → 19–38 |
| Warm-intro overlay | Partner / founder intro, not cold | 30–60% of intros | n/a | most of those |

“Any-reply” includes `REPLIED_PASS`. A healthy mix on cold is roughly **40–60% PASS, 15–30% OTHER, 10–20% MEETING, 5–15% REFERRAL**. If PASS is >70% of replies, the list is off-thesis (too much `vc_enterprise` / `vc_health` / `vc_fintech`). If any-reply is <2% after 100 first-touches, stop scaling copy experiments — deliverability is the first suspect (§5).

90-day planning target to operate against (not to put in emails): **base band, ~30–50 human replies, ~10–20 meeting asks**, plus whatever warm intros land. That is enough to fill a real angel / pre-seed conversation calendar without burning the domain.

The 1,626 leftover emailed contacts after a 640-touch 90-day pass are not “failed.” They are the post-90-day queue, and they should go out with better proof (TikTok + waitlist metrics that actually exist by then) rather than the same first-touch twice.

---

## 2. How to improve reply rate

Do these in order. Each one is cheaper than adding send volume.

### 2.1 Personalization sources (one true sentence, then the stock body)

The custom intro is the only line most GPs read. Sources, in priority:

1. **Firm thesis page** — consumer / games / culture / brand / UGC. Map to `firm_type` already on the row (`vc_fashion`, `vc_media`, `vc_games`, `angel`, `angel_fashion`, `angel_games`).
2. **One portfolio company** the GP actually led that is a consumer habit, a game, a brand, or a creator tool. Name it only if you can point to a public page.
3. **A public post from that GP in the last 90 days** (X, LinkedIn, blog) about consumer, fashion, games, or live-ops. Quote the idea, not the tweet.
4. **City / Fashion Week** only if they are on the ground in NY, LA, Paris, London, Milan, or SF and the product’s city-runway loop is the hook.
5. **Role** — Partner vs Principal vs Scout. Principals often reply faster; Partners write checks. Do not pitch a scout as if they run the firm.

Do not: fake a mutual, cite a meeting that did not happen, or reuse the same intro for every GP at a firm. The tracker already has a `custom_intro` column — rewrite it the night before if the library sentence is generic.

Library (from the pack) stays valid: a16z Games, Benchmark, Index, Accel, Sequoia, fashion-retail angel, mobile-games angel, creator-economy fund. Add a new one-liner when you first-touch a new thesis lane; do not expand the stock body.

### 2.2 Subject tests (A/B/C, then lock)

Rotate the three pack subjects equally. Do not stack them. Do not invent a fourth until 90 first-touches are in.

| Code | Subject | Hypothesis |
| --- | --- | --- |
| A | Rascal Runways — fashion endless runner, live on the web | Clarity + “live” beats clever |
| B | Angel/pre-seed intro (not a priced round) — Rascal Runways | Stage honesty reduces PASS-as-spam |
| C | Race the runway. Dodge paparazzi. Dress the look. | Tagline as curiosity |

Protocol: first 90 first-touches = 30 A / 30 B / 30 C, assigned by queue_slot `% 3`. Score **any-reply** and **REPLIED_MEETING** separately. Lock the winner for the next 200. Only then test one new variant (suggested: `Playable fashion runner — 15 min?`). Record the subject on the tracker `notes` field (`subj=A`) so the test is recoverable.

### 2.3 Video vs still

Until the 30-second investor ad is saved and embeddable, first-touch stays: square PNG attachment (`rascal-runways-investor-ad.png`) + product URL + deck URL.

When the 30s ad is ready:

- Put it **in the body** (inline HTML `<video>` or a hosted MP4 on rascalrunways.com), not as a huge attachment. Keep the PNG as a fallback cid/attachment for clients that block video.
- Cap file size ~2–5 MB. Anything larger tanks Gmail/Outlook placement.
- Run a 2-week split after the subject test is locked: still-only vs video-in-body, 50/50, ≥40 first-touches each. Winner = higher meeting rate, not just opens.
- TikTok ads and the investor 30s can share footage; the investor cut must show **playable product** (character, runway, paparazzi dodge, boutique) in the first 5 seconds. Do not lead with a brand montage.

### 2.4 Firm-thesis matching (who gets a slot)

The list is 1,737 generic `vc` vs 16 `vc_fashion`, 31 `vc_media`, 1 `vc_games`, 416 `angel`. A 10/day queue that is 90% generic VC will look like spam and will earn the floor band.

Daily mix (of the 10):

- 3 thesis-fit: `vc_fashion` / `vc_media` / `vc_games` / `angel_fashion` / `angel_games` / creator-economy
- 4 consumer/seed angels (`angel`, `vc_seed`, `accelerator`)
- 3 generalist `vc` only if the GP’s page or recent post is consumer / games / culture

Deprioritize `vc_enterprise`, `vc_health`, `vc_fintech` unless a warm intro exists. Skip family offices and late-stage growth names that do not write $250–500k checks.

### 2.5 One GP per firm / 30-day cooldown

Day-1 copy currently double-hits several firms (Forerunner: Kirsten + Eurie; Initialized: Alexis + Garry; Upfront: Kobie + Mark; Flybridge: Jeff + Chip; AngelList: Parker + Sunil). That is a leftover from the old 25-cap queue. **From day 2 onward: one first-touch per firm until 30 days have passed, then a different GP at that firm is allowed.**

How to run it:

- Before queuing, group tracker rows by `firm`. If any row at that firm is `QUEUED`, `SENT_*`, `OOO`, `HOLD`, `REPLIED_*`, skip the others.
- Pick the GP: Partner who leads consumer/games > Managing Partner > Principal who has posted about the space. Do not first-touch two partners “to see who bites.”
- 30-day cooldown: if the first GP is `EXHAUSTED` or `REPLIED_PASS`, you may first-touch a *different* GP at the same firm on or after `last_touch_at + 30 days`, with a new custom intro that does **not** mention the prior email.
- If the first GP is `REPLIED_MEETING` or `REPLIED_REFERRAL`, never cold anyone else at the firm. The thread owns the firm.
- Same-person 30-day rule is already in the pack as a 3-touch sequence (day 0 / 6 / 13). Do not add a fourth “circling back” unless George personally reopens the row.

This single rule stretches 1,240 firms across ~25 weeks instead of burning 2,266 addresses in a way that makes partners compare notes.

---

## 3. Warm-intro overlay

Cold and warm are different pipes. Mixing them is how you annoy a GP a partner is already introing.

### Overlay rules

1. **HOLD the row** the moment a warm intro is requested or in flight. Status `HOLD` already exists in the tracker SOP. Cold sequence stops. Do not first-touch, follow up, or breakup a HOLD.
2. **Firm-level HOLD.** If you are being intro’d to anyone at Forerunner, every Forerunner row goes HOLD until that intro resolves (meeting, pass, or “please email X instead”).
3. **Daily pre-flight (5 minutes at 5:50am MT, before the 6am send).** Check: LinkedIn pending intros, iMessage/email with operators who offered to intro, calendar holds, and tracker `HOLD` / `REPLIED_REFERRAL`. Pull those emails out of the day’s 10. Backfill from the next thesis-fit NEW row.
4. **Never double-channel.** If a partner says “I’ll intro you to Kirsten,” do not also send the day-1 Kirsten copy “so she has context.” The intro *is* the context. You may send a **forwardable blurb** to the introducer (5 lines, product URL, deck URL, no attachment unless they ask).
5. **Referral replies** (`REPLIED_REFERRAL`): stop this address, notify George, create a NEW row for the named person, first-touch them on a **later** weekday, not the same day. Mark the original firm HOLD until that new thread moves.
6. **Log the introducer** in `notes` (`warm: <name>`). Warm threads do not count against the 10/day cold cap, but they *do* count as “same person / same day” — no cold copy that calendar day.

### Where warm intros actually come from (this product)

- Founders in the fashion / consumer / games Slack-and-text graph who can play rascalrunways.com in 60 seconds and forward the deck.
- Operators at portfolio companies of thesis-fit firms (not the GP first).
- Fashion-week / showroom people who will play the booth loop and intro a consumer GP.
- Angels who already `REPLIED_MEETING` — ask *after* the call, not in the first-touch, for two names.

Warm overlay target for the 90-day window: **1–3 intros per week**. That can match the entire cold meeting band by itself. Protect it.

---

## 4. Content flywheel: TikTok → waitlist → proof in later emails

The pitch funnel already reads: Discover (TikTok / IG / creator clips) → Land (rascalrunways.com · test-pilot waitlist) → Activate → Convert. Outreach should ride that loop instead of inventing traction.

```
TikTok @rascalrunways clips
        ↓
   rascalrunways.com  +  /waitlist.html (test-pilot)
        ↓
  real counts you can screenshot
        ↓
  day-6 follow-up / week-5+ first-touches cite those counts
```

### What to ship on TikTok (ads already being made)

- 15s runway-fail / runway-fit loops (the product’s native unit).
- 30s investor-adjacent cut: create character → dress → race → paparazzi dodge → boutique. Same file can sit in email body once saved.
- CTA is playable: rascalrunways.com or the waitlist page. Not “coming to the App Store.”
- Post as `@rascalrunways`. Save source files (see §6) so email, ads, and the site use the same cut.

### What you may cite in email, and when

| Proof | Cite in outbound? | When |
| --- | --- | --- |
| Product is live on the web | Yes, now | Every first-touch already does |
| Test-pilot waitlist is open | Yes, as a fact of product, no number | Now |
| Waitlist signups / MAU / D1 retention / Stripe revenue | Only the number you can export from the live system that day | After it exists |
| TikTok views / watch-through / follower count | Only from TikTok analytics screenshot in-hand | After posts are live |
| Luxury-house licenses | Never until a signed license | — |
| App Store listing | Never until it is live | — |
| Planning range $250–500k | Yes, labeled illustrative | Now |

Template for a later-email proof line (use only with a real number):

> Since I wrote: the test-pilot waitlist is at **[N from export]** and the [@rascalrunways](https://www.tiktok.com/@rascalrunways) clip **[title]** did **[views from TikTok analytics]** — still opening angel / pre-seed conversations, not a priced round.

If N does not exist, omit the sentence. Silence beats a made-up waitlist.

Day-6 and day-13 copy in the pack stays number-free on purpose. When real metrics exist, add **one** proof line to follow-up 1 only. Do not load the breakup with stats.

---

## 5. When to pause

Pause means: no new `SENT_1`. Finish in-flight day-6 / day-13 only if bounces are not the issue; freeze everything if they are. Resume only after the trigger is green for 5 weekdays.

| Trigger | Yellow (slow to 5/day, inspect) | Red (pause all first-touches) |
| --- | --- | --- |
| Hard bounce rate (7-day) | > 2% of first-touches | > 5%, or a mailbox-provider block |
| Spam complaints | Any single complaint | ≥ 0.1% of delivered, or Zoho/Google flags the domain |
| Domain / IP reputation | Google Postmaster “bad/low” or Zoho warn | Mail in spam for a seed inbox (Gmail + Outlook + Apple) you control |
| Reply rate after 100 first-touches | < 3% any-reply | < 1.5% any-reply **and** opens (if you have them) collapsed |
| Bounce class | Role accounts (`info@`, `ir@`) bouncing | Pattern of `550 5.1.1` on previously good domains |
| Legal / hostile | — | Any “do not contact” beyond PASS → `DNC` immediately |

Operational pause checklist:

1. Stop the 6am MT timer. Do not “just send tomorrow’s 10.”
2. Mark bouncing addresses `BOUNCE` + `dnc=1`. Do not guess a new address the same week.
3. Pull SPF / DKIM / DMARC on rascalrunways.com (Zoho). Fix before resume.
4. Seed-test: send one email to a Gmail, an Outlook, and an Apple address you own. If any land in spam, stay paused.
5. Shrink, don’t vanish: resume at **5 first-touches / weekday** for 10 weekdays, then 10 if yellow metrics are gone.

PASS is not a spam complaint. Hostile “remove me / report” is. One complaint is a yellow; treat it as a process bug (list quality or missing PASS line), not as noise.

Do not buy a warmup tool and jack volume. 10 first-touches + ~20 sequence mails is already the right size for a founder domain. Reputation recovery is slower than list exhaustion.

---

## 6. What “tasks completed” looks like for this campaign

Machine-setup can be done and the campaign still not live. This is the go-live bar. Check a box only when the artifact exists in the named place. Do not send mail to tick a box.

| # | Task | Done looks like | Where |
| --- | --- | --- | --- |
| 1 | **30s investor video saved** | MP4 on disk, playable, ≤5 MB, first 5s shows the game (character / runway / paparazzi / boutique). Filename stable. | e.g. `docs/assets/rascal-runways-investor-ad-30s.mp4` (and a copy under `/opt/cursor/artifacts/` if produced in-agent) |
| 2 | **TikTok files saved** | Source cuts + posted-or-ready ads for `@rascalrunways`, not just a Canva link. 15s fail/fit + 30s playable loop. Aspect 9:16. | Same `docs/assets/` (or founder’s ad folder), plus the live TikTok URL once posted: https://www.tiktok.com/@rascalrunways |
| 3 | **Zoho send of day-1 10** | Ten first-touches actually sent from `George Igwe <founder@rascalrunways.com>` at 6am MT. Slots **1–10 only** of `docs/investor-send-queue-day1.csv` (Kirsten Green → Mark Suster). Slots 11–25 wait for later weekdays under the one-GP-per-firm rule. Each mail: custom intro, rascalrunways.com, pitch.html, PNG (and 30s in body **if** #1 is done), PASS line. Tracker rows flip `QUEUED` → `SENT_1`, `touches=1`, `last_touch_at` set. | Zoho Sent folder + `docs/investor-reply-tracker.csv` |
| 4 | **6am Mountain Time timer** | Recurring weekday job, not a one-shot alarm. Releases **after** the 5:50am HOLD/warm-intro sweep. Timezone `America/Denver` (MDT in September). Does not fire Sat/Sun/US market holidays. | Zoho scheduled send, calendar reminder, or agent cron — whatever is wired on the machine. Confirm next fire date in writing in tracker notes. |
| 5 | **Tracker live** | `docs/investor-reply-tracker.csv` is the system of record. Inbound to `founder@rascalrunways.com` is classified the same day into: `NEW` `QUEUED` `SENT_1` `SENT_2` `SENT_3` `OOO` `BOUNCE` `REPLIED_MEETING` `REPLIED_REFERRAL` `REPLIED_PASS` `REPLIED_OTHER` `EXHAUSTED` `DNC` `HOLD`. George is notified on `REPLIED_MEETING` / `REPLIED_REFERRAL` / `REPLIED_OTHER`. Bot does not send. | Tracker CSV + mailbox labels / filters |

Day-1 10 (for task #3), in queue order:

1. Kirsten Green — Forerunner Ventures
2. Alexis Ohanian — Initialized Capital
3. Garry Tan — Initialized Capital *(day-1 only; from day 2, skip 2nd GP at a firm already touched)*
4. Hunter Walk — Homebrew
5. Eurie Kim — Forerunner Ventures *(same day-1 exception)*
6. Peter Rojas — Betaworks
7. Dave Morin — Slow Ventures
8. Ryan Walsh — Floodgate
9. Kobie Fuller — Upfront Ventures
10. Mark Suster — Upfront Ventures *(same day-1 exception)*

Slots 11–25 in the day-1 files remain `READY_FOR_SEND` until a later weekday. Do not send 25 on day 1.

Campaign is **not** complete when the markdown exists. Campaign go-live is **#1 saved (or explicitly deferred to still-only), #2 saved, #3 sent, #4 timer confirmed, #5 classifying mail**. Until #3 and #4, this is a pack, not a campaign.

---

## Daily loop (after go-live)

**5:50am MT** — warm-intro / HOLD sweep; bounce check; pick 10 NEW rows under §2.4 mix + one-GP-per-firm; attach PNG; inline 30s if saved.

**6:00am MT** — Zoho sends the 10. Flip tracker to `SENT_1`. Queue that day’s `SENT_2` / `SENT_3` (in-thread, no new attachment).

**Anytime inbound** — classify, notify on meeting/referral/other, never auto-reply with more pitch.

**Friday 20 minutes** — subject A/B counts, bounce %, any-reply %, HOLD list, TikTok/waitlist proof that is real enough to use next week.

That is the growth motion: keep 10/day, make each of the 10 better, overlay warm intros, feed real TikTok/waitlist numbers into later copy, and stop the moment the domain flinches.

# Rascal Runways — daily investor first-touch SOP

Send-from: George Igwe `<founder@rascalrunways.com>` only.
Product: https://www.rascalrunways.com
Deck: https://www.rascalrunways.com/pitch.html
Never use runwayrascals.com. Do not invent traction (waitlist counts, revenue, luxury-house licenses, App Store listing).

## Cadence (overrides the old 25/day rule)

- **10 first-touch emails per weekday**
- **6:00 AM Mountain Time** (September 2026 = MDT, UTC-6 → **12:00 UTC**)
- Recurring timer name: `rascal-vc-outreach-6am-mt`
- Cron: `0 12 * * *`
- Skip Saturday and Sunday (cron fires daily; the agent must no-op on weekends)
- Stop the sequence for a contact on PASS, bounce, or any human reply
- Do not guess Zoho / mailbox passwords. If `founder@rascalrunways.com` is not already authenticated in the browser, do not send. Leave that day’s 10 as `READY_FOR_SEND`.

## Queue files

- `docs/investor-send-queue-day1.csv` — Day 1 (2026-09-02), 10 contacts
- `docs/investor-send-queue-later.csv` — leftover 15 from the old 25-person Day 1 list (Days 2–3)
- `docs/investor-send-queue.csv` — full weekday calendar, 10/day
- `docs/investor-emails-day1.md` — copy-ready Day 1 bodies
- `docs/investor-reply-tracker.csv` — status / DNC
- `docs/investor-outreach-pack.txt` — templates

## Every first-touch MUST include

1. The row’s custom short intro
2. https://www.rascalrunways.com
3. Pitch deck https://www.rascalrunways.com/pitch.html
4. Opt-out: `Not for you? Reply PASS.`
5. Ad: if `/opt/cursor/artifacts/rascal-runways-email-ad-30s.mp4` exists, attach it and mention/link the 30s video. Until then attach `/opt/cursor/artifacts/assets/rascal-runways-investor-ad.png` and say a 30s playable clip is on the site / play flow.

## Timer prompt (paste into `subscribe_timer`)

```
Rascal Runways daily VC first-touch send.

It is 6:00 AM Mountain Time. Send the next 10 UNSENT first-touch investor emails from George Igwe <founder@rascalrunways.com> only.

Rules:
- Skip weekends (Saturday/Sunday Mountain Time). If today is Sat/Sun, do nothing and wait for the next weekday.
- Cap: 10 new first-touches today. Do not send follow-ups in this job unless a row is already due on the day-6 / day-13 clock AND it is not the same person as a first-touch today.
- Source: docs/investor-send-queue.csv and docs/investor-reply-tracker.csv on branch cursor/investor-outreach-pack-b55f (PR #28). Pick the next 10 rows with status READY_FOR_SEND / QUEUED whose send_date is today (America/Denver) or the earliest unsent weekday if a prior day was blocked by missing Zoho auth.
- Skip any row that is DNC, BOUNCE, REPLIED_*, PASS, HOLD, OOO (until resume), EXHAUSTED, or that already has SENT_1.
- Stop on PASS / bounce / human reply: never first-touch that address.
- Open Zoho Mail in the browser. If founder@rascalrunways.com is NOT already authenticated, do NOT guess passwords and do NOT send. Leave the 10 as READY_FOR_SEND. Write /opt/cursor/artifacts/email-send-status.md and stop.
- If authenticated, send ONLY those 10. Personalize with the custom_intro. Every email must include https://www.rascalrunways.com, https://www.rascalrunways.com/pitch.html, and “Not for you? Reply PASS.”
- Attachment: if /opt/cursor/artifacts/rascal-runways-email-ad-30s.mp4 exists, attach it and mention/link the 30s ad. Else attach /opt/cursor/artifacts/assets/rascal-runways-investor-ad.png and say a 30s playable clip is on the site/play flow.
- Never use runwayrascals.com. Do not invent traction.
- After sending (or skipping), update the queue + reply-tracker, commit and push on cursor/investor-outreach-pack-b55f, and write /opt/cursor/artifacts/email-send-status.md (Zoho auth yes/no, how many sent, names/firms, next 6am MT send).
- Do not create TikTok videos. Do not record the 30s ad.
```

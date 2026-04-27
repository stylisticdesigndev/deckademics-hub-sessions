# One-Way Email + SMS + Push Notifications for New Messages

## Decision

When someone receives a new in-app message, they get notified via email and/or SMS (based on their preferences) and via push (if enabled). The notification **shows the message preview + sender name + a deep link** that opens the conversation in the app. **All replies happen in-app** — no reply-by-email, no reply-by-SMS.

---

## Phase 1 — Email notifications

### What you'll see

Branded email like:

> **Subject:** New message from Nick Davis
>
> Nick Davis sent you a message:
>
> > "Hey, just confirming Tuesday at 6pm works."
>
> [Open conversation] (button → deep link into the app)

### What gets built

1. **Set up sender domain** (e.g. `notify.deckademics.com`) via the one-time DNS setup dialog. Then it's hands-off forever.
2. **One React email template** — `new-message-notification` — styled to match Deckademics (dark accents on white body, vinyl-themed header).
3. **Wire `send-transactional-email` into the message-send flow.** Wherever the app currently inserts into `public.messages` (instructor messages, student replies, admin messages), immediately after the insert we also enqueue a notification email to the recipient.
4. **Smart suppression rules** so we don't spam:
  - Skip if recipient was active in the app within the last 60 seconds (they already saw it).
  - Skip if recipient has `email_notifications = false` in their `notification_preferences`.
  - Skip if recipient's email is in the suppression list (bounced/unsubscribed).
  - One unsubscribe link per email, system-managed.
5. **Unsubscribe page** at `/unsubscribe` matching the app's branding.

### What you need from a third party

Just DNS access for `deckademics.com` (one-time, ~5 min).

---

## Phase 2 — SMS notifications

### What you'll see

> [Deckademics] Nick Davis: "Hey, just confirming Tuesday at 6pm works."
> Open: [https://deckademics.app/m/abc123](https://deckademics.app/m/abc123)
> Reply STOP to opt out.

### What gets built

1. **Connect Twilio** via the built-in connector (you provide an Account SID, API Key, and one purchased phone number).
2. **New edge function `send-sms-notification**` that:
  - Reads recipient's `notification_preferences`.
  - If `sms_notifications = true` AND `phone_number` is verified, sends the SMS via the Twilio gateway.
  - Truncates message preview to ~120 chars to fit in one SMS segment (cheaper, more reliable).
  - Same suppression rules as email (skip if recently active, opted out, etc.).
3. **Phone verification flow** on the profile page — user enters number → we send a 6-digit code → they confirm → we set `phone_verified_at`. We never SMS an unverified number.
4. **Required Twilio safeguards** (you turn these on in the Twilio console after signing up — I'll give exact steps):
  - SMS Pumping Protection ON
  - Geo Permissions limited to US (or wherever your students live)
  - STOP/HELP keywords (Twilio handles automatically)
5. **Inbound STOP handling** — if someone texts STOP back to your Twilio number, we update their `notification_preferences.sms_notifications = false` automatically. (This is the only "inbound" behavior — it's required by carriers; it's not a reply-to-message feature.)

### What you need from a third party

- Twilio account: ~$1/month per phone number + ~$0.0079/SMS in the US.
- Sign up takes ~10 min, including buying a number.

---

## Phase 3 — Mobile push notifications

Push has two real options. Both are one-way (notification opens the app to the thread).

### Option A — PWA push (ship today, no app store) This is the option I want to use 

- Builds on your existing PWA shell.
- **Works on:** Android Chrome, desktop browsers, **and iOS 16.4+ but only if the user installs the app to their home screen first**.
- **Doesn't work on:** iOS Safari in a regular browser tab.
- No app store review, no developer accounts.

### Option B — Native app via Capacitor + Firebase Cloud Messaging

- Wrap your existing app in Capacitor.
- FCM handles both Android and iOS push.
- Requires Apple Developer account ($99/yr) and Google Play account ($25 one-time).
- App Store review takes 1–7 days first time.
- This is the right answer if you want push to "just work" on iOS without making users install-to-home-screen.

### Recommendation

Ship **Option A** in this phase to validate the feature. Layer in **Option B** as a separate project once you're ready to commit to App Store presence. The notification logic stays the same — only the delivery transport changes.

---

## Database changes (small)

- `notification_preferences.push_subscriptions jsonb default '[]'` — stores Web Push subscription objects, one per device.
- `profiles.phone_verified_at timestamptz` — gates SMS sending.
- `profiles.last_active_at timestamptz` — used for the "skip if user is currently in the app" suppression rule. Updated by a heartbeat.
- `messages.notified_via text[] default '{}'` — audit trail showing which channels actually fired (`['email','sms','push']`).

---

## How the trigger fires (technical, for reference)

Today, sending a message inserts into `public.messages`. We'll add a server-side step right after that insert: a new edge function `notify-new-message` reads the recipient's preferences and fans out to email + SMS + push as appropriate. It uses an idempotency key derived from the message ID so retries can't double-send. All three channels run independently — if SMS fails, email still goes out.

---

## Suggested rollout

1. **Phase 1 (email)** — ships immediately after you complete the DNS dialog. Provides 80% of the value.
2. **Phase 2 (SMS)** — after you sign up for Twilio.
3. **Phase 3 Option A (PWA push)** — one implementation pass, no third-party signup.
4. **Phase 3 Option B (native app)** — only when App Store presence becomes a priority.

---

## Two quick questions before we start

1. **Where do your students live?** (Determines Twilio Geo Permissions — US only is cheaper and safest.)
2. **Want to start with Phase 1 (email) right now**, then handle Twilio + push as separate follow-ups? Or do you want to gather everything (sign up for Twilio first) before we begin?
# Fix Push Notifications (VAPID key + delivery)

## What's actually broken

Push notifications are **not** failing on the iPhone — they're failing on the server. Every call to the `send-push` edge function throws:

```text
Vapid private key must be a URL safe Base 64 (without "=")
```

The `VAPID_PRIVATE_KEY` secret was saved in the wrong format. Web Push requires the key as **URL-safe base64** (uses `-` and `_`, no `=` padding). The stored value has standard base64 characters, so `web-push` rejects it before sending anything.

Because this fails for every recipient, no device has ever received a push — the iOS setup is likely fine.

## The fix

### 1. Regenerate a matching VAPID key pair

Generate a fresh, correctly-encoded public/private VAPID pair (URL-safe base64, no padding). Both halves must come from the same pair or encryption fails.

### 2. Update the secret + the public key

- Store the new **private** key in the `VAPID_PRIVATE_KEY` secret (correct URL-safe encoding).
- Update the **public** key constant in the two places it lives so they match the new private key:
  - `src/hooks/usePushNotifications.ts`
  - `supabase/functions/send-push/index.ts`

### 3. Re-subscribe existing devices

Because the public key changes, any device that already subscribed (with the old/broken key) holds a stale subscription. After deploy, those devices need to toggle push **off then on** once to re-register against the new key. Old/stale subscriptions are auto-cleaned by the function on 404/410, so this self-heals over time.

### 4. Verify end-to-end

- Confirm `send-push` logs show a successful `delivered` count instead of the VAPID error.
- Test the real flow: from **Account A**, send a message to **Account B** whose device has push enabled — confirm the banner appears in B's notification shade.

### 5. (Optional, recommended) App-icon badge count

You asked about a number on the icon. Currently there's none. As a small add-on I can have `sw.js` call the **Badging API** (`navigator.setAppBadge`) on incoming push and clear it when the app is opened, so the home-screen icon shows an unread count on supported platforms (Android/desktop Chrome; iOS support is limited). This is optional and can be skipped if you only want the banner.

## How push will look after the fix

- A banner + an entry in the notification shade with the sender/title and message text, plus your app icon.
- Tapping it opens the app to the relevant page (messages, announcement, etc.).
- Icon badge number only if we add step 5.

## Testing checklist (post-fix)

1. Publish so the new public key ships to the client.
2. On the **recipient** device, toggle Push off then on in Profile → Notifications, tap Allow.
3. From a **second** account, trigger an event (send a message) to the recipient.
4. Confirm the banner arrives; check `send-push` logs for `delivered > 0`.

## Notes / constraints

- iPhone still requires the app be added to the Home Screen (iOS 16.4+) and opened from that icon for push to work — but that was never the blocker here.
- No database changes are required.

Add step 5
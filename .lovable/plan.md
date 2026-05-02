## Plan

I’ll remove the remaining student-side automatic biometric behavior by changing the Profile Quick Login card so it does **nothing WebAuthn-related on mount**.

Right now, the old proactive enrollment modal has already been removed from the app source, but the student Profile still renders `PasskeyManager`, and `PasskeyManager` immediately runs `usePasskeySupport()` when the page loads. That hook calls:

```ts
PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
```

On mobile Safari/iOS, that WebAuthn capability check can surface biometric/passkey UI even though the user did not press “Add this device.” That matches your video: the biometric prompt appears as soon as the student Profile is entered.

## What I’ll change

1. **Make `PasskeyManager` lazy/manual only**
   - Remove the automatic `usePasskeySupport()` call from initial render.
   - Do not touch `PublicKeyCredential`, Face ID, Touch ID, Fingerprint, or WebAuthn APIs until the user presses `Add this device`.

2. **Move support detection into the button click**
   - When the user manually taps `Add this device`, then check whether biometrics/passkeys are supported.
   - If unsupported, show a normal toast/message.
   - If supported, continue to `registerPasskey()`.

3. **Keep the Quick Login card visible**
   - The card remains on student/instructor/admin Profile pages.
   - It still allows manual enrollment exactly as requested.
   - It just stops doing any background biometric detection.

4. **Add an extra guard for student profile**
   - Ensure no registration can start unless the click handler is explicitly invoked by the `Add this device` button.
   - This prevents a mobile tap/navigation/overlay race from accidentally triggering registration.

5. **Verify no proactive biometric entry points remain**
   - Re-search the codebase for:
     - `PasskeyEnrollmentModal`
     - `usePasskeySupport()` auto-mount behavior
     - `registerPasskey()` outside the manual button
     - `passkey_prompt_dismissed`

## Files to update

- `src/components/profile/PasskeyManager.tsx`
  - Remove passive support check on mount.
  - Run support check only inside `handleAdd()`.
  - Keep manual “Add this device” behavior.

- `src/hooks/usePasskeys.ts`
  - Either remove `usePasskeySupport()` if it is no longer needed, or leave it only for sign-in pages where showing/hiding the biometric sign-in button is intentional.
  - Confirm it is not used by Student Profile anymore.

## Expected result

- Student Profile will load without any biometric modal or native Face ID/passkey sheet flashing.
- Instructor Profile will continue behaving normally.
- Biometric registration only starts after the user manually taps `Add this device` in Quick Login.
- No automatic biometric prompt remains on login, dashboard load, or profile navigation.

## Note

If you are testing from an installed iPhone PWA, after this change is published you may still need to fully close/reopen the PWA or delete/re-add it once, because iOS can keep an older JavaScript bundle alive longer than Safari tabs. But the source-level fix will make the student Profile stop touching biometric APIs on page load.
I’ll remove the Profile-page flash by changing the passkey prompt from a component that opens itself after mount into a parent-controlled modal that is never mounted/opened during Profile navigation.

Plan:
1. Move the route/auth/loading checks into `DashboardLayout`
   - Use `useAuth().isLoading`, the current route, and passkey query state before deciding whether the modal should exist.
   - Do not render the biometric modal while auth/profile data is still loading.
   - Do not render it on `/student/profile`, `/instructor/profile`, or `/admin/profile`.
   - Do not render it while a Profile navigation is pending.

2. Make `PasskeyEnrollmentModal` controlled
   - Replace its internal “setOpen(true)” effect with explicit `open` / `onOpenChange` props from the layout.
   - This prevents the modal from opening for one frame before route checks settle.
   - Keep the existing Enable and Maybe Later behavior.

3. Catch all Profile entry points on mobile/tablet/desktop
   - Keep the immediate suppression when the avatar/Profile button is clicked.
   - Ensure the admin mobile Profile nav item also triggers the same suppression.
   - Use route-based protection as the final source of truth so direct URL visits to a Profile page cannot show the modal either.

4. Clean up the earlier workaround
   - Remove any redundant route-checking inside the modal once the layout fully owns whether it can render.
   - Keep the code simple and avoid relying on timing, `setTimeout`, or one-frame unmount behavior.

Expected result:
- Clicking Profile on mobile will go straight to the user profile with no biometric modal flash.
- Same behavior on tablet and desktop.
- The biometric prompt can still appear on non-profile dashboard/app pages for eligible users who have not dismissed it.


# Add Confirm Password, Forgot Password, and Strong Password Requirements

## Summary

Three changes across the signup and login flows for all user types (student, instructor, admin):

1. **Confirm Password field** on signup forms
2. **Forgot Password link** on login forms with a password reset page
3. **Strong password requirements** (min 8 chars, uppercase, lowercase, number, special character)

---

## 1. Strengthen Password Validation (SignupForm.tsx)

Update `validatePassword` to require:
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character (!@#$%^&*...)

Show a multi-step strength bar (weak/fair/good/strong) with individual requirement checks listed below it.

## 2. Add Confirm Password Field (SignupForm.tsx + AuthForm.tsx)

- Add `confirmPassword` field to `SignupForm` component state
- Add a matching input field below the password field
- Validate that passwords match before allowing submission
- Update `AuthForm.tsx` password length check to 8 characters and add the stronger validation there too

## 3. Add Forgot Password Link (LoginForm.tsx)

- Add a "Forgot password?" link below the password field
- Clicking it opens a dialog/inline form asking for email
- Calls `supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/reset-password' })`
- Show success toast

## 4. Create Reset Password Page

- New file: `src/pages/auth/ResetPassword.tsx`
- Checks for `type=recovery` in URL hash
- Shows form with new password + confirm password fields (with same strong validation)
- Calls `supabase.auth.updateUser({ password })` on submit
- Redirects to login on success
- Add route `/reset-password` in `App.tsx` as a public route

---

## Files to Change

| File | Change |
|------|--------|
| `src/components/auth/SignupForm.tsx` | Add confirm password field, strengthen password validation (8+ chars, uppercase, lowercase, number, special char) |
| `src/components/auth/AuthForm.tsx` | Update password length check from 6 to 8, pass through confirm password validation |
| `src/components/auth/LoginForm.tsx` | Add "Forgot password?" link with email dialog using `resetPasswordForEmail` |
| `src/pages/auth/ResetPassword.tsx` | New — password reset page with strong validation and confirm password |
| `src/App.tsx` | Add `/reset-password` public route |


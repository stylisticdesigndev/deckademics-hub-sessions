

# Remove Success Toasts on Login/Signup/Logout (Keep Warnings and Errors)

## Problem
After logging in (from any role), success toasts pop up like "Welcome back!", "Login successful", "Account created!", "Logged out", etc. User wants to remove these informational/success toasts and only keep warning and error toasts.

## Toasts to remove

### `src/providers/AuthProvider.tsx`
- **Line ~342**: `toast({ title: 'Welcome back!', description: 'You have successfully logged in.' })` — sign-in success
- **Line ~396**: `toast({ title: 'Account created!', description: 'Your account has been created successfully.' })` — sign-up success
- **Line ~467**: `toast({ title: 'Logged out', description: 'You have been successfully logged out.' })` — sign-out success
- **Line ~502**: `toast({ title: 'Profile updated', ... })` — profile update success
- **Line ~78**: `toast({ title: 'Local Storage Cleared', ... })` — storage clear success

### `src/components/auth/AuthForm.tsx`
- **Line ~76**: `toast({ title: 'Login successful', description: 'You have been logged in as ${userType}.' })` — login success
- **Line ~165**: `toast({ title: 'Account created!', description: 'Please check your email...' })` — keep this one (it's instructional, user needs to know to check email)
- **Line ~170**: `toast({ title: 'Account created!', description: 'Your account has been created and you are now logged in.' })` — signup success

## Toasts to keep (errors/warnings)
All toasts with `variant: 'destructive'` or containing error/failure messages remain untouched.

## Files to edit

| File | Change |
|------|--------|
| `src/providers/AuthProvider.tsx` | Remove ~4 success toasts (sign-in, sign-up, sign-out, profile update, storage clear) |
| `src/components/auth/AuthForm.tsx` | Remove login success toast and auto-login signup toast; keep the "check your email" toast |


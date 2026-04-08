

# Production-Ready Audit Plan — Deckademics DJ School

## Overview

This plan covers five areas: code documentation, security cleanup, ungated console.log cleanup, UI polish, and dead code removal. All demo logic is explicitly preserved and labeled.

---

## 1. Code Documentation

Add JSDoc-style block comments to the following core files explaining architecture and data flow:

**Files to document:**
- `src/providers/AuthProvider.tsx` — Top-of-file summary explaining the auth lifecycle (session init, profile fetch via `get_user_role` RPC, role-based redirect, sign-up with metadata, sign-out cleanup). Mark `createProfileFromMetadata` as a fallback path.
- `src/integrations/supabase/client.ts` — Explain env-var sourcing and the typed client.
- `src/routes/ProtectedRoute.tsx` — Explain the multi-stage gate: auth loading → profile wait → approval check → photo gate → render.
- `src/hooks/student/useStudentDashboard.ts` — Explain the data orchestration pattern.
- `src/hooks/instructor/useInstructorDashboard.ts` — Same.
- `src/hooks/useAdminDashboard.ts` — Same.

**Demo-section labels** — Add `// ===== DEMO MODE START =====` / `// ===== DEMO MODE END =====` markers in:
- `src/pages/student/StudentDashboard.tsx` (lines 74-88, the `active*` variable block)
- `src/pages/student/StudentDashboardGate.tsx` (demoMode state)
- `src/pages/instructor/InstructorDashboard.tsx` (lines 35-38)
- `src/pages/instructor/InstructorDashboardGate.tsx` (demoMode state)
- `src/data/mockDashboardData.ts` — Add top-of-file comment: "DEMO DATA — remove this entire file when demo mode is no longer needed"
- `src/data/mockInstructorData.ts` — Same

---

## 2. Security: Remove Hardcoded Fallback Keys

**File:** `src/integrations/supabase/client.ts`

Remove the fallback URL/key constants (lines 10-11) and the `||` fallbacks (lines 14-15). The `.env` file always provides these values in the Lovable environment, so the fallbacks are unnecessary and constitute hardcoded credentials in the source.

Replace with a simple guard:
```typescript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}
```

**Note:** The anon key is a *publishable* key (not secret), but removing hardcoded fallbacks is still best practice for a production handoff — it ensures the app always reads from environment configuration.

---

## 3. Console.log Cleanup

Gate all ungated `console.log` calls behind `import.meta.env.DEV`. Files with ungated logs:

| File | Issue |
|---|---|
| `src/pages/auth/StudentAuth.tsx` | 5 ungated console.logs (lines 11, 23, 32, 36) |
| `src/hooks/use-toast.ts` | 4 console.logs in toast/toast.success/toast.info (lines 32, 56, 63) |
| `src/hooks/useUpdateStudentLevel.ts` | 2 ungated (lines 32, 46) |
| `src/hooks/useInstructorAssignment.ts` | 3 ungated (lines 27, 39, 50) |
| `src/hooks/useAdminInstructors.ts` | 6 ungated (lines 28, 40, 53, 65, 78, 90) |
| `src/hooks/useAdminAttendance.ts` | 2 ungated (lines 260, 265) |
| `src/hooks/useAdminDashboard.ts` | 3 ungated (lines 26, 38, 49) |
| `src/hooks/student/useNotesNotifications.ts` | 1 ungated (line 23) |
| `src/hooks/student/useStudentDashboardActions.ts` | 1 ungated (line 106) |

All will be wrapped with `if (import.meta.env.DEV)` so they are stripped from production builds.

---

## 4. UI Refinement

Quick consistency pass:
- Ensure all dashboard pages use consistent `space-y-6` vertical rhythm
- Verify the `ResetPassword.tsx` page uses the same dark theme/background as auth pages (currently plain `bg-background` — update to match the video background + card overlay pattern used on login pages)
- Ensure mobile responsiveness: the demo toggle button in dashboard headers should wrap gracefully on small screens (use `flex-wrap` if needed)

---

## 5. Dead Code / Placeholder Cleanup

- `public/placeholder.svg` — Check if referenced anywhere; if only as an `onError` fallback in Index.tsx, keep it. Otherwise remove.
- Remove the empty `{/* Header logo removed */}` and `{/* Header content */}` comments from `StudentAuth.tsx` (line 61) and `Index.tsx` (line 90)
- The `isMockAdmin = false` constant in `ProtectedRoute.tsx` (line 30) is dead code — remove it and all branches that check it

---

## 6. Stakeholder Summary Document

Generate a `STAKEHOLDER_SUMMARY.md` file at the project root containing:
- Tech stack overview (React 18, Vite 5, Tailwind v3, TypeScript 5, Supabase, TanStack Query)
- Auth flow walkthrough (signup → profile creation trigger → approval gate → dashboard)
- Role system explanation (student/instructor/admin via `user_roles` table + `has_role()` function)
- Password reset flow
- Demo mode locations (files and how to find/remove them)
- Security measures in place (RLS, role-based access, env-only credentials)
- Manual Supabase dashboard items still pending (leaked password protection, Postgres upgrade)

---

## Files Modified (estimated: ~15 files)

No database changes required. No demo logic removed.


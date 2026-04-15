/**
 * Admin Permissions — Hardcoded email-based access control.
 *
 * Owner (Nick): Full access to all admin areas including Payroll.
 * Developer (Evan): Full admin access except Payroll.
 *
 * Future-proofing: When DB-driven roles like `admin_dj` and `admin_prod`
 * are added, extend these helpers to check Supabase user_roles as a fallback.
 */

export const OWNER_EMAIL = 'nick@deckademics.com';
export const DEVELOPER_EMAIL = 'djstylistic11@gmail.com';

const ADMIN_EMAILS = [OWNER_EMAIL, DEVELOPER_EMAIL];

/** Check if user email has admin portal access */
export const isAdminUser = (email?: string | null): boolean => {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
};

/** Check if user is the owner (Nick) */
export const isOwner = (email?: string | null): boolean => {
  if (!email) return false;
  return email.toLowerCase() === OWNER_EMAIL;
};

/** Only the owner can access Payroll sections */
export const canAccessPayroll = (email?: string | null): boolean => {
  return isOwner(email);
};

/**
 * Future role types for granular admin access:
 * - admin_dj: DJ School operations only
 * - admin_prod: Music Production operations only
 * 
 * When implemented, add role checks here that query user_roles table.
 */


/**
 * Type guard utility functions for Supabase query results
 */
import { PostgrestError } from '@supabase/supabase-js';
import { Database } from '@/integrations/supabase/types';

export type UUID = string;

/**
 * Type guard to check if an object is a Supabase error
 */
export function isSupabaseError(obj: any): obj is PostgrestError {
  return obj && 
         typeof obj === 'object' && 
         'code' in obj && 
         'message' in obj;
}

/**
 * Type guard to check if an object is not an error response from Supabase
 */
export function isDataObject<T extends object>(obj: any): obj is T {
  return obj && 
         typeof obj === 'object' && 
         !isSupabaseError(obj);
}

/**
 * Type guard to check if object has a specific property
 */
export function hasProperty<T extends object, K extends string>(
  obj: T, 
  prop: K
): obj is T & Record<K, unknown> {
  return isDataObject(obj) && prop in obj;
}

/**
 * Safely access properties from Supabase query results that might be errors
 * @param obj The object to safely access property from
 * @param key The property key to access
 * @param defaultValue Optional default value if property doesn't exist
 */
export function safelyAccessProperty<T, K extends keyof any, D = undefined>(
  obj: any,
  key: K,
  defaultValue?: D
): T | D | undefined {
  if (!obj || isSupabaseError(obj) || !(key in obj)) {
    return defaultValue;
  }
  return obj[key] as T;
}

/**
 * Safe type casting for UUID fields in Supabase queries
 * This function provides proper typing for UUID values
 */
export function asUUID(id: string): UUID {
  return id as UUID;
}

/**
 * Safely convert a string to UUID
 * Returns undefined if id is null or undefined
 */
export function asOptionalUUID(id: string | null | undefined): UUID | undefined {
  if (!id) return undefined;
  return id as UUID;
}

/**
 * Convert an array of values to UUIDs for Supabase queries
 */
export function asUUIDArray(ids: string[]): UUID[] {
  return ids.map(id => id as UUID);
}

/**
 * Type for common Supabase data with profiles
 */
export interface ProfileData {
  first_name?: string;
  last_name?: string;
}

/**
 * Safely process an array of items from Supabase, filtering out any errors
 * and providing proper type handling
 */
export function processSafeItems<T extends object, R = T>(
  items: any[] | null | undefined,
  mapFn?: (item: T) => R
): R[] {
  if (!items || !Array.isArray(items)) return [];
  
  const validItems = items.filter(item => isDataObject<T>(item)) as T[];
  
  if (mapFn) {
    return validItems.map(mapFn);
  }
  
  return validItems as unknown as R[];
}

/**
 * Get the table name from a Database type (for TypeScript only)
 */
export type TableNames = keyof Database['public']['Tables'];

/**
 * Checks if a value is present (not null or undefined)
 */
export function isPresent<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Helper to cast a value as a database type
 */
export function asDbType<T>(value: any): T {
  return value as T;
}


/**
 * Type guard utility functions for Supabase query results
 */

// Type guard to check if an object is not an error response from Supabase
export function isDataObject<T extends object>(obj: any): obj is T {
  return obj && 
         typeof obj === 'object' && 
         !('code' in obj) && 
         !('details' in obj) && 
         !('hint' in obj) && 
         !('message' in obj);
}

// Type guard to check if object has a specific property
export function hasProperty<T extends object, K extends string>(
  obj: T, 
  prop: K
): obj is T & Record<K, unknown> {
  return isDataObject(obj) && prop in obj;
}

// Safe type casting for UUID fields in Supabase queries
export function asUUID(id: string) {
  return id as unknown as `${string}-${string}-${string}-${string}-${string}`;
}

// Type for common Supabase data with profiles
export interface ProfileData {
  first_name?: string;
  last_name?: string;
}

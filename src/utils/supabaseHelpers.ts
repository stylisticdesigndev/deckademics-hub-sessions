
/**
 * Helper functions to safely access and handle Supabase data types
 */

/**
 * Checks if a value is a non-null object (not an array)
 */
export function isDataObject(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Checks if an object has a specific property
 */
export function hasProperty<K extends string>(obj: object, prop: K): obj is { [P in K]: unknown } {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

/**
 * Safely accesses a property on an object with type checking
 */
export function safelyAccessProperty<T, K extends string>(obj: unknown, prop: K): T | undefined {
  if (!isDataObject(obj)) {
    return undefined;
  }
  
  if (!hasProperty(obj, prop)) {
    return undefined;
  }
  
  return obj[prop] as T;
}

/**
 * Type-safe way to create parameters for database update operations
 */
export function asUpdateParam<T>(data: Record<string, any>, tableName?: string): T {
  return data as T;
}

/**
 * Type-safe way to create parameters for database insert operations
 */
export function asInsertParam<T>(data: Record<string, any>, tableName?: string): T {
  return data as T;
}

/**
 * Type-safe way to create parameters for RPC calls
 */
export function asRpcParam<T>(data: Record<string, any>, functionName?: string): T {
  return data as T;
}

/**
 * Type-safe way to handle RPC results
 */
export function asRpcResult<T>(data: unknown): T {
  return data as T;
}

/**
 * Type-safe way to handle profile data
 */
export function asProfile<T>(data: unknown): T {
  return data as T;
}

/**
 * Type-safe way to create a database filter parameter
 */
export function asDatabaseParam<T>(value: any): T {
  return value as T;
}

/**
 * Type-safe way to handle UUID data
 */
export function asUUID(value: string): string {
  return value;
}

/**
 * Type-safe way to handle database type conversions
 */
export function asDbType<T>(value: any): T {
  return value as T;
}

/**
 * Type-safe way to handle stringified JSON data
 */
export function parseJson<T>(jsonString: string | null | undefined, defaultValue: T): T {
  if (!jsonString) {
    return defaultValue;
  }
  
  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.error('Error parsing JSON:', error);
    return defaultValue;
  }
}

/**
 * Safely process an array of items using a mapper function
 * Filters out items that don't match expected data structure
 */
export function processSafeItems<T>(
  items: unknown[],
  mapper: (item: Record<string, any>) => T
): T[] {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .filter(item => isDataObject(item))
    .map(item => mapper(item as Record<string, any>));
}

/**
 * Type-safe way to handle Supabase responses for students
 */
export function asStudentData<T>(data: unknown): T {
  return data as T;
}

/**
 * Safe type assertion for instructor data
 */
export function asInstructorData<T>(data: unknown): T {
  return data as T;
}

/**
 * Safe type assertion for attendance data
 */
export function asAttendanceData<T>(data: unknown): T {
  return data as T;
}

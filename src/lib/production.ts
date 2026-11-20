export const PRODUCTION_LEVELS = ['novice', 'amateur', 'intermediate', 'advanced', 'advanced_plus'] as const;
export type ProductionLevel = typeof PRODUCTION_LEVELS[number];
export type Program = 'dj' | 'production';
export const productionLevelLabel = (level: string) => level === 'advanced_plus' ? 'Advanced Plus' : level.charAt(0).toUpperCase() + level.slice(1);
export function nextProductionLevel(level: string): ProductionLevel | null {
  const index = PRODUCTION_LEVELS.findIndex(item => item === level);
  return index < 0 ? null : PRODUCTION_LEVELS[index + 1] ?? null;
}
export function moduleSummary<T extends { id: string; level: string; order_index: number }>(modules: T[], completedIds: string[], level: string) {
  const ordered = modules.filter(module => module.level === level).sort((a, b) => a.order_index - b.order_index);
  const completed = new Set(completedIds);
  return { total: ordered.length, completed: ordered.filter(module => completed.has(module.id)).length, next: ordered.find(module => !completed.has(module.id)) ?? null };
}
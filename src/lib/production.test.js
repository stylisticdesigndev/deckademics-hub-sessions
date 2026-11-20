import { describe, it, expect } from 'bun:test';
import { PRODUCTION_LEVELS, nextProductionLevel, moduleSummary } from './production';
describe('Music Production rules', () => {
  it('has the five requested tiers', () => {
    expect([...PRODUCTION_LEVELS]).toEqual(['novice','amateur','intermediate','advanced','advanced_plus']);
  });
  it('ends at open-ended Advanced Plus', () => {
    expect(nextProductionLevel('advanced')).toBe('advanced_plus');
    expect(nextProductionLevel('advanced_plus')).toBeNull();
  });
  it('uses sequential module completion rather than DJ skill mastery', () => {
    const summary = moduleSummary([{id:'second',level:'novice',order_index:2},{id:'first',level:'novice',order_index:1},{id:'other',level:'amateur',order_index:1}], ['first','other'], 'novice');
    expect(summary.total).toBe(2);
    expect(summary.completed).toBe(1);
    expect(summary.next?.id).toBe('second');
  });
});
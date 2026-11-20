import { describe, it, expect } from 'bun:test';
import { instructorProgramRedirect } from './instructorProgram';

describe('Separate instructor programs', () => {
  it('opens the Production dashboard for Production instructors', () => {
    expect(instructorProgramRedirect('production', '/instructor/dashboard')).toBe('/instructor/production');
  });
  it('keeps Production curriculum and messaging in Production', () => {
    expect(instructorProgramRedirect('production', '/instructor/curriculum')).toBe('/instructor/production/curriculum');
    expect(instructorProgramRedirect('production', '/instructor/messages')).toBe('/instructor/production/messages');
  });
  it('keeps DJ instructors out of Production pages', () => {
    expect(instructorProgramRedirect('dj', '/instructor/production')).toBe('/instructor/dashboard');
    expect(instructorProgramRedirect('dj', '/instructor/dashboard')).toBeNull();
  });
  it('does not interrupt instructor photo setup', () => {
    expect(instructorProgramRedirect('production', '/instructor/photo-upload')).toBeNull();
  });
});
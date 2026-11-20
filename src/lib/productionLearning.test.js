import { describe, it, expect } from 'bun:test';
import { audioUploadAllowed, MAX_AUDIO_BYTES, moveItem, sessionBalance, studentProgramAccess } from './productionLearning';
describe('Production learning rules', () => {
  it('accepts MP3 and WAV up to 25 MB', () => { expect(MAX_AUDIO_BYTES).toBe(26214400); expect(audioUploadAllowed('bounce.wav',26214400)).toBe(true); expect(audioUploadAllowed('bounce.mp3',26214401)).toBe(false); expect(audioUploadAllowed('script.html',1)).toBe(false); });
  it('starts without required homework and supports reordering', () => { expect(moveItem([],0,1)).toEqual([]); expect(moveItem(['lesson','homework'],1,-1)).toEqual(['homework','lesson']); });
  it('counts present sessions once and warns at two remaining', () => { expect(sessionBalance([{sessions:3,start_date:'2026-11-01'}],[{class_date:'2026-11-02',status:'present'},{class_date:'2026-11-02',status:'present'},{class_date:'2026-11-03',status:'absent'}])).toEqual({total:3,used:1,remaining:2,low:true}); });
  it('shows switches only for admin-linked dual enrollment', () => { expect(studentProgramAccess({dj_enabled:false})).toEqual({dual:false,onlyProduction:true}); expect(studentProgramAccess({dj_enabled:true}).dual).toBe(true); expect(studentProgramAccess().dual).toBe(false); });
});
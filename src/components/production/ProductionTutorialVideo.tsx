import instructorVideo from '@/assets/videos/production-instructor-tutorial.mp4.asset.json';
import studentVideo from '@/assets/videos/production-student-tutorial.mp4.asset.json';
import instructorCaptions from '@/assets/videos/production-instructor-tutorial.en.vtt.asset.json';
import studentCaptions from '@/assets/videos/production-student-tutorial.en.vtt.asset.json';
import { ProductionTutorial } from './ProductionTutorial';

const instructorChapters = [
  { title: 'Welcome & showcase basics', seconds: 0 },
  { title: 'Dashboard metrics', seconds: 59.82 },
  { title: 'Listen & review bounces', seconds: 72.17 },
  { title: 'Attendance & catch-up', seconds: 145.71 },
  { title: 'Roadmaps & level advancement', seconds: 185.82 },
  { title: 'First-session intake', seconds: 213.86 },
  { title: 'Advanced Plus packages', seconds: 238.82 },
  { title: 'Notes & Tasks', seconds: 279.34 },
  { title: 'Curriculum: blocks & publishing', seconds: 292.39 },
  { title: 'Messages', seconds: 373.43 },
  { title: 'Instructor profile', seconds: 390.46 },
  { title: 'Recap', seconds: 411.55 },
];
const studentChapters = [
  { title: 'Welcome & student workspace', seconds: 0 },
  { title: 'Dashboard & continue learning', seconds: 26.8 },
  { title: 'Catch-up packets', seconds: 42.68 },
  { title: 'Syllabus & lesson content', seconds: 57.46 },
  { title: 'Homework & bounce history', seconds: 99.7 },
  { title: 'First-session intake', seconds: 150.08 },
  { title: 'Advanced Plus sessions', seconds: 161.84 },
  { title: 'Classes, notes & tasks', seconds: 174.2 },
  { title: 'Messages', seconds: 186.07 },
  { title: 'Profile & instructor details', seconds: 191.97 },
  { title: 'Recap & admin notes', seconds: 218.26 },
];

export function ProductionTutorialVideo({ role }: { role: 'instructor' | 'student' }) {
  return <ProductionTutorial role={role} videoUrl={role === 'instructor' ? instructorVideo.url : studentVideo.url} captionUrl={role === 'instructor' ? instructorCaptions.url : studentCaptions.url} chapters={role === 'instructor' ? instructorChapters : studentChapters} />;
}
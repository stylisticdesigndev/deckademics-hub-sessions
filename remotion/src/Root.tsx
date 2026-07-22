import { Composition } from "remotion";
import { MainVideo, TOTAL_FRAMES } from "./MainVideo";
import { InstructorVideo, INSTRUCTOR_TOTAL } from "./walkthrough/InstructorVideo";
import { StudentVideo, STUDENT_TOTAL } from "./walkthrough/StudentVideo";

export const RemotionRoot = () => (
  <>
  <Composition
    id="main"
    component={MainVideo}
    durationInFrames={TOTAL_FRAMES}
    fps={30}
    width={1920}
    height={1080}
  />
    <Composition id="instructor" component={InstructorVideo} durationInFrames={INSTRUCTOR_TOTAL} fps={30} width={1280} height={720} />
    <Composition id="student" component={StudentVideo} durationInFrames={STUDENT_TOTAL} fps={30} width={1920} height={1080} />
  </>
);
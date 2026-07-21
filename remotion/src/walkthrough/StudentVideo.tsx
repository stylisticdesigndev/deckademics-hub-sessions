import React from "react";
import { AbsoluteFill, Series, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { COLORS } from "../theme";
import { SceneRenderer, SceneSpec } from "./SceneRenderer";

const A = (id: string) => `audio-student/${id}.mp3`;

export const STUDENT_SCENES: (SceneSpec & { frames: number })[] = [
  {
    kind: "title", frames: 593, audio: A("intro"),
    label: "Deckademics · Student Walkthrough",
    titleTop: "Learn to DJ.",
    titleAccent: "Track every step.",
    sub: "A five-minute tour of your student app.",
  },
  {
    kind: "steps", frames: 684, audio: A("signup"),
    label: "Part 01 · Sign Up",
    title: "Create your account.",
    steps: [
      { n: "01", t: "Student", d: "Pick Student when you sign up." },
      { n: "02", t: "Email + PW", d: "Enter your email · set a password." },
      { n: "03", t: "Pending", d: "The school approves new students — usually within a day." },
      { n: "04", t: "Log Back In", d: "You're ready to set up your profile." },
    ],
    caption: "Pending is normal · approval unlocks your dashboard.",
  },
  {
    kind: "list", frames: 598, audio: A("profile"),
    label: "Part 02 · Profile",
    title: "Add your face.",
    url: "deckademics.app/student/profile",
    items: [
      { h: "Your Name", d: "Fill in your details so we know who you are." },
      { h: "Photo (required)", d: "You can't reach the dashboard without one." },
      { h: "Auto-retry", d: "Upload fails? It tries again — don't stress." },
    ],
    caption: "This helps your instructor recognize you in class.",
  },
  {
    kind: "phone", frames: 622, audio: A("install"),
    label: "Part 03 · Install",
    title: "Put it on your phone.",
    phoneTitle: "Add to Home Screen",
    rows: [
      { h: "iPhone", d: "Share button → Add to Home Screen" },
      { h: "Android", d: "Menu → Install app" },
      { h: "Push", d: "Enable notifications for class reminders" },
      { h: "Home Icon", d: "Opens like any native app" },
    ],
    caption: "Install once · notifications work properly forever.",
  },
  {
    kind: "cards", frames: 598, audio: A("dashboard"),
    label: "Part 04 · Dashboard",
    title: "Your home screen.",
    url: "deckademics.app/student",
    cards: [
      { tag: "Next Class", h: "When · Where", d: "Day, time, and classroom for your next session." },
      { tag: "Skills", h: "At a Glance", d: "See your current proficiency and top skills." },
      { tag: "Shortcuts", h: "Tap Anywhere", d: "Every card opens the full section." },
    ],
    caption: "Glance in the morning · you'll always know what's next.",
  },
  {
    kind: "list", frames: 758, audio: A("skills"),
    label: "Part 05 · Skills",
    title: "Watch your bars fill up.",
    url: "deckademics.app/student/skills",
    items: [
      { h: "Overall Level", d: "Novice · Amateur · Intermediate · Advanced (not a %)" },
      { h: "Individual Skills", d: "32 techniques · each with a green progress bar." },
      { h: "Updated by Instructor", d: "Grades appear right after class." },
      { h: "Full bar = mastered", d: "The fuller the bar, the closer you are." },
    ],
    caption: "Real progress · not a mystery score.",
  },
  {
    kind: "cards", frames: 506, audio: A("curriculum"),
    label: "Part 06 · Curriculum",
    title: "See the whole roadmap.",
    url: "deckademics.app/student/curriculum",
    cards: [
      { tag: "Novice", h: "Foundations", d: "Where every student starts." },
      { tag: "Amateur → Intermediate", h: "Build Up", d: "Techniques stack week by week." },
      { tag: "Advanced", h: "Master It", d: "Open proficiency at the top." },
    ],
    caption: "Know what's coming · revisit what you covered.",
  },
  {
    kind: "phone", frames: 754, audio: A("classes"),
    label: "Part 07 · Classes",
    title: "Two buttons that matter.",
    phoneTitle: "Your Schedule",
    rows: [
      { h: "Tuesday 6:00 PM · Class 2", d: "Instructor: DJ Nova", color: COLORS.green },
      { h: "Mark Absence", d: "Can't make it? Tap once · instructor notified.", color: "#e8ff5a" },
      { h: "Running Late", d: "On the way · instant push to your instructor.", color: "#e8ff5a" },
      { h: "Cancel Absence", d: "Plans changed? Undo any time.", color: COLORS.green },
    ],
    caption: "Absence + Running Late · always one tap away.",
  },
  {
    kind: "list", frames: 670, audio: A("notes"),
    label: "Part 08 · Notes",
    title: "Your private notebook.",
    url: "deckademics.app/student/notes",
    items: [
      { h: "Add Note", d: "Type · save · edit or delete any time." },
      { h: "Private", d: "Your instructor cannot see personal notes." },
      { h: "Save from Messages", d: "Tap Save to Notes on any message or image." },
      { h: "Always searchable", d: "Find that mix technique from three weeks ago." },
    ],
    caption: "Your notebook · not your instructor's.",
  },
  {
    kind: "phone", frames: 670, audio: A("messages"),
    label: "Part 09 · Messages",
    title: "Chat with your instructor.",
    phoneTitle: "Messages",
    rows: [
      { h: "DJ Nova", d: "Great work on the transition today 🎧", color: COLORS.green },
      { h: "You", d: "Thanks! Any videos on that outro?", color: "#e8ff5a" },
      { h: "7-day window", d: "Reply within 7 days of instructor's last message.", color: COLORS.green },
      { h: "Links & Images", d: "Send them freely · save useful ones to Notes.", color: COLORS.green },
    ],
    caption: "Direct line to your instructor · in the app.",
  },
  {
    kind: "cards", frames: 706, audio: A("settings"),
    label: "Part 10 · Settings & Help",
    title: "Make it yours.",
    cards: [
      { tag: "Notifications", h: "Your Choice", d: "Email · SMS · push — toggle each on or off." },
      { tag: "Report a Bug", h: "See Something Off?", d: "Describe it · school gets notified." },
      { tag: "Sunday Practice", h: "Extra Reps", d: "Bonus practice resources outside of class." },
    ],
    caption: "You're in control of your app.",
  },
  {
    kind: "close", frames: 322, audio: A("close"),
    label: "That's the whole app.",
    title: "See you",
    accent: "in class.",
    sub: "Deckademics · Student Walkthrough · v1",
  },
];

export const STUDENT_TOTAL = STUDENT_SCENES.reduce((a, s) => a + s.frames, 0);

const Bg: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const drift = interpolate(frame, [0, durationInFrames], [0, 60]);
  const drift2 = interpolate(frame, [0, durationInFrames], [0, -80]);
  return (
    <AbsoluteFill style={{ background: "#0b1210", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: -200,
        background: "radial-gradient(circle at 30% 30%, rgba(64,166,71,0.25), transparent 55%), radial-gradient(circle at 75% 70%, rgba(48,120,52,0.22), transparent 60%)",
        transform: `translate(${drift}px, ${drift2}px)`, filter: "blur(40px)" }} />
      <div style={{ position: "absolute", inset: 0,
        backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
        backgroundSize: "80px 80px",
        maskImage: "radial-gradient(circle at 50% 50%, black 40%, transparent 80%)" }} />
    </AbsoluteFill>
  );
};

export const StudentVideo: React.FC = () => (
  <AbsoluteFill>
    <Bg />
    <Series>
      {STUDENT_SCENES.map((s, i) => (
        <Series.Sequence key={i} durationInFrames={s.frames}>
          <SceneRenderer s={s} />
        </Series.Sequence>
      ))}
    </Series>
  </AbsoluteFill>
);
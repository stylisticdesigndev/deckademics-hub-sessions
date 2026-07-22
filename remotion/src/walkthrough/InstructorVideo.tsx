import React from "react";
import { AbsoluteFill, Series, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { COLORS } from "../theme";
import { SceneRenderer, SceneSpec } from "./SceneRenderer";

const A = (id: string) => `audio-instructor/${id}.mp3`;

export const INSTRUCTOR_SCENES: (SceneSpec & { frames: number })[] = [
  {
    kind: "title", frames: 625, audio: A("intro"),
    label: "Deckademics · Instructor Walkthrough",
    titleTop: "Teach smarter.",
    titleAccent: "Everything in one app.",
    sub: "A five-minute tour built for instructors.",
  },
  {
    kind: "list", frames: 716, audio: A("profile"),
    label: "Part 01 · Profile",
    title: "Your DJ Name is your identity.",
    url: "deckademics.app/instructor/profile",
    items: [
      { h: "DJ Name", d: "Required · this is what students see everywhere." },
      { h: "Profile Photo", d: "Required before you can reach the dashboard." },
      { h: "Fallback", d: "First + last name used if DJ Name is blank." },
    ],
    caption: "Set your DJ Name and photo first.",
  },
  {
    kind: "cards", frames: 790, audio: A("dashboard"),
    label: "Part 02 · Dashboard",
    title: "Three stats. One glance.",
    url: "deckademics.app/instructor",
    cards: [
      { tag: "Today", h: "Classes", d: "How many sessions are on your plate today." },
      { tag: "Progress", h: "Average", d: "Your students' average progress score." },
      { tag: "Roster", h: "Total Students", d: "Your full assigned student count." },
    ],
    caption: "Today's Attendance + Student Table live right below.",
  },
  {
    kind: "phone", frames: 841, audio: A("students"),
    label: "Part 03 · Students",
    title: "Primary & secondary — a safety net.",
    phoneTitle: "Your Roster",
    rows: [
      { h: "Maya Chen", d: "Primary · Amateur · Class 2", color: COLORS.green },
      { h: "Devon Ross", d: "Primary · Novice · Class 1", color: COLORS.green },
      { h: "Sam Kim", d: "Secondary · backup coverage", color: "#e8ff5a" },
      { h: "Jordan Lee", d: "Primary · Intermediate · Class 3", color: COLORS.green },
    ],
    caption: "Tap any name → detail dialog: skills · notes · tasks.",
  },
  {
    kind: "list", frames: 674, audio: A("classes"),
    label: "Part 04 · Classes",
    title: "Your schedule, grouped by day.",
    url: "deckademics.app/instructor/classes",
    items: [
      { h: "Monday → Sunday", d: "Every student assigned to that day, in order." },
      { h: "Time + Level", d: "See each student's slot and current level." },
      { h: "Search", d: "Jump to a student, day, or time instantly." },
      { h: "Only yours", d: "Only slots explicitly assigned to you." },
    ],
    caption: "The same schedule drives your push reminders.",
  },
  {
    kind: "phone", frames: 757, audio: A("attendance"),
    label: "Part 05 · Attendance",
    title: "Swipe. Present. Absent. Done.",
    phoneTitle: "Class 2 · 6:00 PM",
    rows: [
      { h: "Maya Chen", d: "Present", color: COLORS.green },
      { h: "Devon Ross", d: "Present", color: COLORS.green },
      { h: "Jordan Lee", d: "Absent", color: "#ef4444" },
      { h: "Sam Kim", d: "Present", color: COLORS.green },
    ],
    caption: "Push 15 min after start → full-screen Quick Attendance.",
  },
  {
    kind: "list", frames: 823, audio: A("skills"),
    label: "Part 06 · Skills",
    title: "Three tiers. Simple.",
    url: "deckademics.app/instructor/students/maya",
    items: [
      { h: "Needs Work", d: "Not there yet — keep practicing." },
      { h: "Proficient", d: "Solid · enough to advance for non-critical skills." },
      { h: "Mastered", d: "Required for every Critical Core skill to level up." },
      { h: "Level rolls up", d: "Novice → Amateur → Intermediate → Advanced." },
    ],
    caption: "Critical Core = Mastered required · rest need Proficient.",
  },
  {
    kind: "cards", frames: 787, audio: A("notes"),
    label: "Part 07 · Notes & Messages",
    title: "Two tools · one goal.",
    cards: [
      { tag: "Notes", h: "In student dialog", d: "Private observations · you write, only you see." },
      { tag: "Messages", h: "Direct chat", d: "Text · links · images · reply window 7 days." },
      { tag: "Quiet", h: "No midnight pings", d: "Thread auto-pauses after 7 days of silence." },
    ],
    caption: "Notes remember · Messages communicate.",
  },
  {
    kind: "steps", frames: 760, audio: A("alerts"),
    label: "Part 08 · Automated Alerts",
    title: "The app pushes what matters.",
    steps: [
      { n: "01", t: "Running Late", d: "Instant push to primary + secondary." },
      { n: "02", t: "Student Absent", d: "Automatic notification when marked out." },
      { n: "03", t: "Attendance Nudge", d: "15 min after start · take attendance." },
      { n: "04", t: "Class Notes Nudge", d: "15 min before end · only for students who showed up." },
    ],
    caption: "You never have to check manually.",
  },
  {
    kind: "list", frames: 1092, audio: A("payment"),
    label: "Part 09 · My Payment",
    title: "Flat fee. Per session.",
    url: "deckademics.app/instructor/payment",
    items: [
      { h: "One fee per slot", d: "Regardless of how many students attend." },
      { h: "3 stat cards", d: "Unpaid Balance · Unpaid Sessions · Lifetime Paid." },
      { h: "Paid / Unpaid / Void", d: "Every session tagged with a status badge." },
      { h: "Extra Pay", d: "Covers · gigs · bonuses listed separately." },
    ],
    caption: "Something off? Message the admin — never edit it.",
  },
  {
    kind: "close", frames: 323, audio: A("close"),
    label: "That's your complete tour.",
    title: "Let's",
    accent: "teach.",
    sub: "Deckademics · Instructor Walkthrough · v2",
  },
];

export const INSTRUCTOR_TOTAL = INSTRUCTOR_SCENES.reduce((a, s) => a + s.frames, 0);

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

export const InstructorVideo: React.FC = () => (
  <AbsoluteFill>
    <Bg />
    <Series>
      {INSTRUCTOR_SCENES.map((s, i) => (
        <Series.Sequence key={i} durationInFrames={s.frames}>
          <SceneRenderer s={s} />
        </Series.Sequence>
      ))}
    </Series>
  </AbsoluteFill>
);
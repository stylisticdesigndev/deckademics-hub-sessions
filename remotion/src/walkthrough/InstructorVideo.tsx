import React from "react";
import { AbsoluteFill, Series, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { COLORS } from "../theme";
import { SceneRenderer, SceneSpec } from "./SceneRenderer";

const A = (id: string) => `audio-instructor/${id}.mp3`;

export const INSTRUCTOR_SCENES: (SceneSpec & { frames: number })[] = [
  {
    kind: "title", frames: 607, audio: A("intro"),
    label: "Deckademics · Instructor Walkthrough",
    titleTop: "Teach smarter.",
    titleAccent: "Everything in one app.",
    sub: "A five-minute tour built for instructors.",
  },
  {
    kind: "list", frames: 677, audio: A("profile"),
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
    kind: "cards", frames: 641, audio: A("dashboard"),
    label: "Part 02 · Dashboard",
    title: "Your morning check-in.",
    url: "deckademics.app/instructor",
    cards: [
      { tag: "Today", h: "Classes", d: "Every session on your schedule for today." },
      { tag: "Roster", h: "Students", d: "Your assigned student count at a glance." },
      { tag: "Alerts", h: "Attention", d: "Unread messages · unlogged classes · absences." },
    ],
    caption: "Every card is a shortcut. Tap and go.",
  },
  {
    kind: "phone", frames: 806, audio: A("students"),
    label: "Part 03 · Students",
    title: "Primary & secondary — a safety net.",
    phoneTitle: "Your Roster",
    rows: [
      { h: "Maya Chen", d: "Primary · Amateur · Class 2", color: COLORS.green },
      { h: "Devon Ross", d: "Primary · Novice · Class 1", color: COLORS.green },
      { h: "Sam Kim", d: "Secondary · backup coverage", color: "#e8ff5a" },
      { h: "Jordan Lee", d: "Primary · Intermediate · Class 3", color: COLORS.green },
    ],
    caption: "Primary teaches · Secondary gets the same alerts.",
  },
  {
    kind: "list", frames: 692, audio: A("classes"),
    label: "Part 04 · Classes",
    title: "Your schedule, your view.",
    url: "deckademics.app/instructor/classes",
    items: [
      { h: "Week (default)", d: "This week's classes in day order." },
      { h: "Day", d: "Zoom in on today only." },
      { h: "Month", d: "Plan ahead across the whole month." },
      { h: "Only yours", d: "No clutter from other instructors' slots." },
    ],
    caption: "The same schedule drives your push reminders.",
  },
  {
    kind: "phone", frames: 683, audio: A("attendance"),
    label: "Part 05 · Attendance",
    title: "Swipe. Present. Absent. Done.",
    phoneTitle: "Class 2 · 6:00 PM",
    rows: [
      { h: "Maya Chen", d: "Present", color: COLORS.green },
      { h: "Devon Ross", d: "Present", color: COLORS.green },
      { h: "Jordan Lee", d: "Absent", color: "#ef4444" },
      { h: "Sam Kim", d: "Present", color: COLORS.green },
    ],
    caption: "Pushed 15 min after class starts · saves automatically.",
  },
  {
    kind: "list", frames: 716, audio: A("skills"),
    label: "Part 06 · Skills",
    title: "Grade the 32 skills.",
    url: "deckademics.app/instructor/students/maya/skills",
    items: [
      { h: "Beatmatching", d: "0 – 100 · slider · green bar fills up." },
      { h: "EQ Control", d: "Adjust the slider · saves instantly." },
      { h: "Mixing", d: "Student sees the change in real time." },
      { h: "Level rolls up", d: "Novice → Amateur → Intermediate → Advanced." },
    ],
    caption: "Your grades update the student's proficiency automatically.",
  },
  {
    kind: "cards", frames: 838, audio: A("notes"),
    label: "Part 07 · Notes & Messages",
    title: "Two tools · one goal.",
    cards: [
      { tag: "Notes", h: "About the student", d: "Private observations · saved to their unified feed." },
      { tag: "Messages", h: "Direct chat", d: "Text · links · images · reply window 7 days." },
      { tag: "Quiet", h: "No 3am replies", d: "Thread auto-pauses after 7 days of silence." },
    ],
    caption: "Notes remember · Messages communicate.",
  },
  {
    kind: "steps", frames: 731, audio: A("alerts"),
    label: "Part 08 · Automated Alerts",
    title: "The app pushes what matters.",
    steps: [
      { n: "01", t: "Running Late", d: "Instant push to primary + secondary." },
      { n: "02", t: "Student Absent", d: "Automatic notification when marked out." },
      { n: "03", t: "Class Notes Nudge", d: "15 min before end · log observations." },
      { n: "04", t: "Attendance Nudge", d: "15 min after start · take attendance." },
    ],
    caption: "You never have to check manually.",
  },
  {
    kind: "list", frames: 656, audio: A("payment"),
    label: "Part 09 · My Payment",
    title: "Your personal ledger.",
    url: "deckademics.app/instructor/payment",
    items: [
      { h: "Per-class pay", d: "Every session the school paid for." },
      { h: "Extra Pay", d: "Covers · gigs · bonuses show up here." },
      { h: "Batched by admin", d: "Payroll runs group your pay into batches." },
      { h: "Once paid, locked", d: "See something off? Message the admin — never edit." },
    ],
    caption: "Transparent · itemized · locked once paid.",
  },
  {
    kind: "close", frames: 283, audio: A("close"),
    label: "That's your complete tour.",
    title: "Let's",
    accent: "teach.",
    sub: "Deckademics · Instructor Walkthrough · v1",
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
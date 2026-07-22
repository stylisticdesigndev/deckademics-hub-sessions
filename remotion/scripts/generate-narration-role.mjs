import { writeFileSync, mkdirSync } from "node:fs";

const KEY = process.env.LOVABLE_API_KEY;
if (!KEY) throw new Error("LOVABLE_API_KEY missing");

const ROLE = process.argv[2];
if (!ROLE || !["instructor", "student"].includes(ROLE)) {
  throw new Error("usage: node generate-narration-role.mjs <instructor|student>");
}

const INSTRUCTOR_SCENES = [
  { id: "intro", text: "Welcome to Deckademics. You're an instructor, which means students are counting on you to guide their progress. This walkthrough covers every part of the app you'll actually use, from your first login to running your day to day class. Give me about five minutes, and by the end you'll know exactly where everything lives." },
  { id: "profile", text: "First, your profile. When your account is approved, the app asks for your DJ Name. This matters — students see your DJ Name everywhere, not your legal name. If you leave it blank, we fall back to your first and last name, but the DJ Name is what makes you recognizable. Add a clear photo of your face too. Both are required before you can reach your dashboard." },
  { id: "dashboard", text: "Your dashboard is your morning check in. Three stat cards up top show today's classes, average student progress, and your total student count. Below that, the Today's Attendance section lists everyone scheduled for today, and your Student Table gives you the full roster with progress bars. Tap any student to open their detail view. It's meant to be glanceable — one look and you know what your day looks like." },
  { id: "students", text: "The Students page shows the students assigned to you. Tap any name to open the detail dialog, where you'll find their skills, notes, tasks, and history. Each student has a primary instructor and, optionally, a secondary instructor. Think of secondary as a backup — the primary teaches and gets reminders, but the secondary can still see the student and mark attendance if they cover the class. Both of you can grade." },
  { id: "classes", text: "The Classes page is your class schedule. It's grouped by day of the week — Monday through Sunday — with every student assigned to you on that day, their time slot, and their current level. There's a search box at the top so you can jump to a specific student, day, or time. This same schedule is what drives the attendance reminders that show up on your phone." },
  { id: "attendance", text: "Attendance is one of the most important things you do. Fifteen minutes after each class starts, you'll get a push notification reminding you to take attendance. Open it and you land on a full screen Quick Attendance page built for your phone — you swipe or tap each student, green for Present, red for Absent. It saves automatically. If you forget, we'll nudge you again after class ends until it's logged." },
  { id: "skills", text: "Skills is where you grade progress. Open any student and you'll see their skills organized by level. Each one is rated on a three tier scale — Needs Work, Proficient, or Mastered. Skills marked Critical Core must be fully Mastered before a student can move up a level; the rest only need to reach Proficient. Your grades update the student's overall level — Novice, Amateur, Intermediate, or Advanced — automatically." },
  { id: "notes", text: "Notes and Messages work together. Notes live inside each student's detail dialog — private observations you write about them, things to remember, follow ups. Messages are your direct chat. You can send text, links, and images. Students can reply for seven days after your most recent message, then the thread pauses until you message them again — so no one messages you at midnight three months later." },
  { id: "alerts", text: "The app pushes what matters straight to your phone. If a student taps Running Late, you get an instant push. If a student marks themselves Absent, you're notified the same way. Fifteen minutes after class starts, you're reminded to take attendance. Fifteen minutes before class ends, you're nudged to log class notes — and only for students who actually showed up, so absent students never clutter that list." },
  { id: "payment", text: "Finally, My Payment. This is your personal ledger, and it's simple — you earn a flat fee for every class session you teach, once per scheduled time slot, regardless of how many students show up. Up top you'll see your Unpaid Balance, Unpaid Sessions, and Lifetime Paid. Below that, every session is listed with a Paid, Unpaid, or Void status. Covers, gigs, and bonuses show up separately under Extra Pay. If something looks off, message the admin — never edit it yourself." },
  { id: "close", text: "That's your complete tour. Log in, take attendance, grade skills, message your students, get paid. You're ready. Let's teach." },
];

const STUDENT_SCENES = [
  { id: "intro", text: "Welcome to Deckademics. You're here because you want to learn to DJ, and this app is going to be your daily companion — your schedule, your progress tracker, your line to your instructor. In the next few minutes, I'll walk you through every part of the app so you know exactly what to tap and where to find things. No experience needed. Let's dive in." },
  { id: "signup", text: "First, signing up. Choose Student when you create your account, enter your email, and set a password. Your account starts as Pending — that's normal. An administrator at the school reviews new students and approves you, usually within a day. Until then, you can't reach the dashboard. Once you're approved, log back in and you're ready to set up your profile." },
  { id: "profile", text: "Now your profile. Fill in your name, and then upload a clear photo of your face. The photo is required — the app will not let you into your dashboard without it. This helps your instructor recognize you in class. If the upload fails, don't worry, it retries automatically. Once your photo appears, you're in." },
  { id: "install", text: "Before you go further, install the app on your phone. It works like any other app — from your browser, tap Share, then Add to Home Screen on iPhone, or Install app on Android. This makes push notifications work properly so you never miss a class reminder, a message from your instructor, or an announcement from the school." },
  { id: "dashboard", text: "Your dashboard is your home screen. Next Class shows you when and where your next session is. Skills at a glance shows how you're progressing. Every card is a shortcut — tap it to open the full section. This is the first screen you'll see every time you open the app, so glance at it in the morning and you'll always know what's happening." },
  { id: "skills", text: "Skills is where you see your progress. Instead of a raw percentage, your overall level is shown as one of four words: Novice, Amateur, Intermediate, or Advanced. Below that, you see your individual skills — beatmatching, mixing, EQ control, and so on. Each one has a green progress bar. The fuller the bar, the more you've mastered that skill. Your instructor updates these after class." },
  { id: "curriculum", text: "Curriculum shows you what you'll learn at every level, from Novice up through Advanced. If you're curious what's coming next, or you want to review something you covered weeks ago, open Curriculum and browse the levels. Think of it as the roadmap for your entire journey through the school." },
  { id: "classes", text: "Classes is your schedule. You'll see every upcoming session with its day, time, and classroom. Two important buttons live here. If you can't make a class, tap Mark Absence — your instructor is notified automatically, and you can cancel it later if your plans change. If you're on your way but behind schedule, tap Running Late. It sends an instant alert so your instructor knows to expect you." },
  { id: "notes", text: "Notes is your private notebook inside the app. Tap Add Note, write anything you want to remember, and save. Your instructor can't see these — they're just for you. Even better, if your instructor sends you a message or image that's useful, tap Save to Notes on that message and it lands in your notebook so you can find it later without scrolling through chat." },
  { id: "messages", text: "Messages is your direct chat with your instructor. Open it, read what they've sent, and reply. Two things to know. You can send text, links, and images. And you can reply for up to seven days after your instructor's most recent message. After that, wait for them to reach out again — this keeps everyone's inbox sane. Announcements from the school also appear in your notifications." },
  { id: "settings", text: "In your profile, you'll find Notification Preferences. Turn email, text, and push notifications on or off — you're in control. If something in the app breaks or feels wrong, use Report a Bug from the menu and describe what happened. The school gets notified and can fix it fast. There's also a Sunday Practice link with extra resources for you to work on outside of class." },
  { id: "close", text: "That's it. Sign in, check your dashboard, watch your skills grow, message your instructor when you need to. Show up, put in the work, and we'll see you in class." },
];

const SCENES = ROLE === "instructor" ? INSTRUCTOR_SCENES : STUDENT_SCENES;

async function tts(text) {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/audio/speech", {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "openai/gpt-4o-mini-tts",
      input: text,
      voice: "nova",
      instructions: "Speak in a warm, clear, professional female voice with confident, friendly pacing. Slightly slower than normal for clarity.",
      response_format: "mp3",
    }),
  });
  if (!res.ok) throw new Error(`TTS ${res.status}: ${await res.text()}`);
  return Buffer.from(await res.arrayBuffer());
}

const outDir = `remotion/public/audio-${ROLE}`;
mkdirSync(outDir, { recursive: true });
const manifest = [];
for (const s of SCENES) {
  process.stdout.write(`[${ROLE}] gen ${s.id}... `);
  const buf = await tts(s.text);
  const path = `${outDir}/${s.id}.mp3`;
  writeFileSync(path, buf);
  manifest.push({ id: s.id, path: `audio-${ROLE}/${s.id}.mp3`, bytes: buf.length, text: s.text });
  console.log(`${buf.length} bytes`);
}
writeFileSync(`${outDir}/manifest.json`, JSON.stringify(manifest, null, 2));
console.log(`[${ROLE}] done`);
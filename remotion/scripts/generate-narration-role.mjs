import { writeFileSync, mkdirSync } from "node:fs";

const KEY = process.env.LOVABLE_API_KEY;
if (!KEY) throw new Error("LOVABLE_API_KEY missing");

const ROLE = process.argv[2];
if (!ROLE || !["instructor", "student"].includes(ROLE)) {
  throw new Error("usage: node generate-narration-role.mjs <instructor|student>");
}

const INSTRUCTOR_SCENES = [
  { id: "intro", text: "Welcome to Deckademics. You're an instructor, which means students are counting on you to guide their progress. This walkthrough will show you every part of the app you'll use, from your first login to running your day-to-day class. Take about five minutes with me, and by the end you'll know exactly how everything fits together." },
  { id: "profile", text: "First, your profile. When your account is approved, the app asks for your DJ Name. This is important — students see your DJ Name everywhere in the app, not your legal name. If you leave it blank, we'll fall back to your first and last name, but the DJ Name is what makes you recognizable. Add a clear photo of your face too. Both are required before you can reach your dashboard." },
  { id: "dashboard", text: "Your dashboard is your morning check-in. At a glance, you see today's classes, your student roster count, and anything that needs attention — an unread message, an unlogged class, a student who marked themselves absent. Every card is a shortcut. Tap it and you jump straight to that section. If nothing is highlighted, you're caught up." },
  { id: "students", text: "The Students page shows the students assigned to you. Tap any name to open their detail view, where you'll find their skills, notes, and history. Each student has a primary instructor and, optionally, a secondary instructor. Think of secondary as a backup — if the primary is out, the secondary receives the same alerts, so no student ever falls through the cracks. Both of you can see and grade the student." },
  { id: "classes", text: "The Classes page is your schedule. Your classes are listed in order by day, filtered by week by default. You can switch to Day view to focus on today, or Month view to plan ahead. Only the class slots explicitly assigned to you appear — no clutter from other instructors. This same schedule powers the reminders you'll get on your phone." },
  { id: "attendance", text: "Attendance is one of the most important things you do. Fifteen minutes after each class starts, you'll get a push notification reminding you to take attendance. Open the reminder and you land on a mobile-friendly page where you swipe through each student — green for Present, red for Absent. It saves automatically. If you forget, we'll nudge you again after class ends until it's logged." },
  { id: "skills", text: "Skills is where you grade progress. Every student has thirty-two individual skills — things like beatmatching, mixing, EQ control. Each one is scored zero to one hundred using a slider. As you raise a score, the green bar fills in. Your grades feed the student's overall proficiency level — Novice, Amateur, Intermediate, or Advanced — which updates for them automatically." },
  { id: "notes", text: "Notes and Messages work together. Notes are what you write about a student — observations, things to remember, follow-ups. They appear in that student's unified notes feed. Messages are your direct chat with them. You can send text, links, and images. Students can reply within seven days of your last message — after that, the thread pauses until you message them again, so no one messages you at midnight three months later." },
  { id: "alerts", text: "You'll get automated alerts for two things. First, if a student taps Running Late, both you and any secondary instructor get an instant push. Second, if a student marks themselves absent, you're notified the same way. You don't have to check anything manually — the app pushes what matters straight to your phone. Fifteen minutes before class ends, you'll also get a nudge to log class notes for students who showed up." },
  { id: "payment", text: "Finally, My Payment. This is your personal ledger. It shows every class the school paid you for, plus any Extra Pay for covers, gigs, or bonuses. Payments are batched by the admin during payroll runs. Once a batch is marked Paid, it's locked and shows in your history. If you ever see something that looks wrong, message the admin — never edit it yourself." },
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
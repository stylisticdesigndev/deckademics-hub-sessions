import { writeFileSync } from "node:fs";

const KEY = process.env.LOVABLE_API_KEY;
if (!KEY) throw new Error("LOVABLE_API_KEY missing");

const scenes = [
  { id: "intro",     text: "Welcome to the Deckademics admin console. This is where you run the school, and where you run payroll. In the next three minutes, I'll walk you through everything you need to feel at home here. Let's start with the dashboard." },
  { id: "dashboard", text: "When you sign in, the dashboard opens with three cards up top — total students, total instructors, and payment status showing overdue versus upcoming amounts. Below that, you'll see the Pending Approvals list — new student and instructor signups waiting for a quick review. That's the whole dashboard, and it's exactly what you want first thing in the morning." },
  { id: "instructors", text: "The Instructors page has three tabs — Active, Pending, and Inactive. New signups land in Pending, ready for you to approve. Each instructor has a class rate, and that's the number that drives payroll, so set it carefully. Deactivating an instructor is safe — their assigned students automatically get flagged for reassignment, so nobody falls through the cracks." },
  { id: "students",  text: "Students work the same way — Active, Pending, and Inactive tabs. Approve new signups from Pending. Each student gets a primary instructor, and optionally secondary instructors as backup. Their proficiency level — Novice, Amateur, Intermediate, or Advanced — updates automatically as instructors grade their skills over time." },
  { id: "curriculum", text: "Two pages that sound similar but do different jobs. Curriculum is the syllabus — modules and lessons organized across four levels: Novice, Amateur, Intermediate, and Advanced. Skills is what actually gets graded — individual techniques, each scored zero to one hundred. Instructors grade the Skills. Students see both." },
  { id: "attendance", text: "Attendance gives you the school-wide view — which students showed up, which classrooms ran, and which instructors were covering. Announcements let you push messages to everyone, or just to students, or just to instructors, with categories so nothing important gets buried." },
  { id: "model",     text: "Now the important part: payroll. The mental model is one line — weekly classes, times the instructor's class rate. That's it. If an instructor teaches four classes a week at fifty dollars each, they earn two hundred dollars that week. Everything else in the payroll screen exists to help you get that number right." },
  { id: "flow",      text: "The workflow lives on the Instructor Payroll tab and has five steps. First, Generate — pick a date range, usually the last two weeks. Second, Preview — the system shows you classes times rate for every instructor. Take a moment to eyeball it. Third, Confirm — this creates pending payments the instructor can see. Fourth, Extra Pay — this is where you add cover sessions, gigs, or bonuses, and where you edit anything before money moves. Fifth, Mark as Paid — this is final. It locks the payment in and the instructor sees it clear on their ledger." },
  { id: "edge",      text: "A few common situations. Sick day — mark the class absent, no pay for that slot. Someone covered a class — add it as Extra Pay on the covering instructor's row. Made a mistake before Mark as Paid — just edit or void the row. Made a mistake after — void the payment and issue a new one. Never delete." },
  { id: "close",     text: "That's the whole system. You're ready. Ship it." },
];

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

const manifest = [];
for (const s of scenes) {
  process.stdout.write(`gen ${s.id}... `);
  const buf = await tts(s.text);
  const path = `remotion/public/audio/${s.id}.mp3`;
  writeFileSync(path, buf);
  manifest.push({ id: s.id, path: `audio/${s.id}.mp3`, bytes: buf.length });
  console.log(`${buf.length} bytes`);
}
writeFileSync("remotion/public/audio/manifest.json", JSON.stringify(manifest, null, 2));
console.log("done");

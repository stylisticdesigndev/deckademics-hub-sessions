import { writeFileSync } from "node:fs";

const KEY = process.env.LOVABLE_API_KEY;
if (!KEY) throw new Error("LOVABLE_API_KEY missing");

const scenes = [
  { id: "intro",     text: "Welcome to the Deckademics admin console. This is where you run the school, and where you run payroll. In the next three minutes, I'll walk you through everything you need to feel at home here. Let's start with the dashboard." },
  { id: "dashboard", text: "When you sign in, the dashboard shows you exactly what needs your attention. Anything in red is waiting on you — new student signups, overdue payments, unresolved bug reports. Green means you're caught up. That's the whole idea: if nothing's red, you can close the tab." },
  { id: "instructors", text: "The Instructors page is where you manage your teaching staff. Approve new instructors when they sign up. Set their class rate — this is the number that drives payroll, so double-check it. Deactivating an instructor is safe: their assigned students automatically get flagged for reassignment, so nobody falls through the cracks." },
  { id: "students",  text: "Students work the same way. New signups land in the Pending tab — approve them to move them to Active. Each student gets a primary instructor, and optionally secondary instructors. Their proficiency level updates automatically based on graded skills, from Novice all the way to Advanced. You'll always see who's assigned to whom." },
  { id: "curriculum", text: "Two things that sound similar but do different jobs. Curriculum is the syllabus — what gets taught each week. Skills is what gets graded — thirty-two individual techniques, each scored zero to one hundred. Instructors grade Skills. Students see Skills. Curriculum is the reference." },
  { id: "attendance", text: "Attendance gives you the school-wide view: which students showed up, which classrooms ran, and which instructors were covering. And Announcements let you push messages to everyone, or just to students, or just to instructors, with categories so nothing gets buried." },
  { id: "model",     text: "Now the important part: payroll. The mental model is one line — weekly classes, times the instructor's class rate. That's it. If an instructor teaches four classes a week at fifty dollars each, they earn two hundred dollars that week. Everything else in the payroll screen exists to help you get that number right." },
  { id: "flow",      text: "The workflow has five steps. First, generate — pick a date range, usually the last two weeks. Second, preview — the system shows you classes times rate for every instructor. Take a moment to eyeball it. Third, confirm — this creates pending payments that instructors can see. Fourth, adjust — this is where you add Extra Pay for cover sessions, gigs, or bonuses, and where you edit any mistakes before money moves. Fifth, mark as paid — this is final. It moves the batch to Payroll History and locks it in." },
  { id: "edge",      text: "A few common situations. Sick day — mark the class absent, no pay for that slot. Someone covered a class — add it as Extra Pay on the covering instructor's row. Made a mistake before marking paid — just edit or void. Mistake after paid — void the payment and issue a new one. Never delete." },
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

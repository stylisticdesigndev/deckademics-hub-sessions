// Mux per-scene MP3s onto rendered silent video using ffmpeg.
// Usage: node mux-audio.mjs <role> <videoIn> <videoOut>
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const role = process.argv[2];
const videoIn = process.argv[3];
const videoOut = process.argv[4];

// Load durations (frames) from the composition data by re-declaring.
const SCENES_BY_ROLE = {
  admin: [
    { id: "intro", frames: 414 },
    { id: "dashboard", frames: 722 },
    { id: "instructors", frames: 704 },
    { id: "students", frames: 657 },
    { id: "curriculum", frames: 866 },
    { id: "attendance", frames: 540 },
    { id: "model", frames: 574 },
    { id: "flow", frames: 1071 },
    { id: "edge", frames: 572 },
    { id: "close", frames: 138 },
  ],
  instructor: [
    { id: "intro", frames: 619 },
    { id: "profile", frames: 689 },
    { id: "dashboard", frames: 653 },
    { id: "students", frames: 818 },
    { id: "classes", frames: 704 },
    { id: "attendance", frames: 695 },
    { id: "skills", frames: 728 },
    { id: "notes", frames: 850 },
    { id: "alerts", frames: 743 },
    { id: "payment", frames: 668 },
    { id: "close", frames: 295 },
  ],
  student: [
    { id: "intro", frames: 593 },
    { id: "signup", frames: 684 },
    { id: "profile", frames: 598 },
    { id: "install", frames: 622 },
    { id: "dashboard", frames: 598 },
    { id: "skills", frames: 758 },
    { id: "curriculum", frames: 506 },
    { id: "classes", frames: 754 },
    { id: "notes", frames: 670 },
    { id: "messages", frames: 670 },
    { id: "settings", frames: 706 },
    { id: "close", frames: 322 },
  ],
};

const scenes = SCENES_BY_ROLE[role];
if (!scenes) throw new Error(`unknown role ${role}`);

const audioDir = role === "admin" ? "remotion/public/audio" : `remotion/public/audio-${role}`;

// Build ffmpeg command with per-scene inputs.
const inputs = ["-i", videoIn];
scenes.forEach((s) => inputs.push("-i", `${audioDir}/${s.id}.mp3`));

// Filter: pad each audio to its scene duration (seconds), then concat.
const filterParts = [];
scenes.forEach((s, i) => {
  const secs = (s.frames / 30).toFixed(3);
  // input index is i+1 (0 is video)
  filterParts.push(`[${i + 1}:a]apad=whole_dur=${secs},atrim=0:${secs},asetpts=PTS-STARTPTS[a${i}]`);
});
const concatInputs = scenes.map((_, i) => `[a${i}]`).join("");
filterParts.push(`${concatInputs}concat=n=${scenes.length}:v=0:a=1[outa]`);

const args = [
  "-y",
  ...inputs,
  "-filter_complex", filterParts.join(";"),
  "-map", "0:v",
  "-map", "[outa]",
  "-c:v", "copy",
  "-c:a", "aac",
  "-b:a", "192k",
  "-shortest",
  videoOut,
];

console.log("ffmpeg", args.join(" "));
execFileSync("ffmpeg", args, { stdio: "inherit" });
console.log(`done: ${videoOut}`);
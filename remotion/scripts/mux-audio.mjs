// Mux per-scene MP3s onto rendered silent video using ffmpeg.
// Usage: node mux-audio.mjs <role> <videoIn> <videoOut>
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const role = process.argv[2];
const videoIn = process.argv[3];
const videoOut = process.argv[4];

// Load durations (frames) from the composition data by re-declaring.
const SCENES_BY_ROLE = {
  instructor: [
    { id: "intro", frames: 607 },
    { id: "profile", frames: 677 },
    { id: "dashboard", frames: 641 },
    { id: "students", frames: 806 },
    { id: "classes", frames: 692 },
    { id: "attendance", frames: 683 },
    { id: "skills", frames: 716 },
    { id: "notes", frames: 838 },
    { id: "alerts", frames: 731 },
    { id: "payment", frames: 656 },
    { id: "close", frames: 283 },
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

// Build ffmpeg command with per-scene inputs.
const inputs = ["-i", videoIn];
scenes.forEach((s) => inputs.push("-i", `remotion/public/audio-${role}/${s.id}.mp3`));

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
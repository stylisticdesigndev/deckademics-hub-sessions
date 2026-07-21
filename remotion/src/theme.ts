export const COLORS = {
  bg: "#0b1210",
  ink: "#f5f7f4",
  mute: "#8a9691",
  green: "#40a647",
  greenDark: "#307834",
  accent: "#e8ff5a",
  card: "#131b18",
  border: "rgba(255,255,255,0.08)",
};

import { loadFont as loadDisplay } from "@remotion/google-fonts/SpaceGrotesk";
import { loadFont as loadBody } from "@remotion/google-fonts/Inter";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

export const display = loadDisplay("normal", { weights: ["500", "700"], subsets: ["latin"] }).fontFamily;
export const body = loadBody("normal", { weights: ["400", "500", "600"], subsets: ["latin"] }).fontFamily;
export const mono = loadMono("normal", { weights: ["500", "700"], subsets: ["latin"] }).fontFamily;
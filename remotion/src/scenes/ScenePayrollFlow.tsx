import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { COLORS, display, body, mono } from "../theme";

const STEPS = [
  { n: "01", t: "Generate Payroll", d: "Pick a date range." },
  { n: "02", t: "Preview", d: "classes × rate for each instructor." },
  { n: "03", t: "Confirm", d: "Creates pending payments." },
  { n: "04", t: "Adjust", d: "Edit classes · add Extra Pay · void." },
  { n: "05", t: "Mark as Paid", d: "Moves to Payroll History. Final." },
];

export const ScenePayrollFlow: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const header = spring({ frame: frame - 4, fps, config: { damping: 200 } });
  return (
    <AbsoluteFill style={{ padding: "80px 120px", fontFamily: body, color: COLORS.ink }}>
      <div style={{ opacity: header, marginBottom: 40 }}>
        <div style={{ fontFamily: mono, fontSize: 20, letterSpacing: 4, color: COLORS.green, textTransform: "uppercase" }}>
          The five-step flow
        </div>
        <div style={{ fontFamily: display, fontWeight: 700, fontSize: 100, letterSpacing: -3, marginTop: 12 }}>
          Generate → Preview → Pay.
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: 30 }}>
        {STEPS.map((s, i) => {
          const p = spring({ frame: frame - 20 - i * 14, fps, config: { damping: 22, stiffness: 130 } });
          const x = interpolate(p, [0, 1], [-60, 0]);
          const bar = interpolate(p, [0, 1], [0, 1]);
          return (
            <div
              key={s.n}
              style={{
                opacity: p,
                transform: `translateX(${x}px)`,
                display: "flex",
                alignItems: "center",
                gap: 32,
                padding: "24px 32px",
                background: COLORS.card,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 6,
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 6, background: COLORS.green, transform: `scaleY(${bar})`, transformOrigin: "top" }} />
              <div style={{ fontFamily: mono, color: COLORS.green, fontSize: 30, minWidth: 70 }}>{s.n}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: display, fontWeight: 700, fontSize: 44, letterSpacing: -1 }}>{s.t}</div>
                <div style={{ color: COLORS.mute, fontSize: 24, marginTop: 4 }}>{s.d}</div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
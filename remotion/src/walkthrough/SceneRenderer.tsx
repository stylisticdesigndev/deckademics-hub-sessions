import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { COLORS, display, body, mono } from "../theme";
import { BrowserFrame } from "../components/BrowserFrame";
import { SceneKicker, CaptionBar } from "../components/CaptionBar";

export type SceneSpec =
  | { kind: "title"; audio: string; label: string; titleTop: string; titleAccent: string; sub: string; captionAtEnd?: string }
  | { kind: "close"; audio: string; label: string; title: string; accent: string; sub: string }
  | { kind: "list"; audio: string; label: string; title: string; url?: string; items: { h: string; d: string }[]; caption: string }
  | { kind: "cards"; audio: string; label: string; title: string; url?: string; cards: { tag: string; h: string; d: string; color?: string }[]; caption: string }
  | { kind: "steps"; audio: string; label: string; title: string; steps: { n: string; t: string; d: string }[]; caption: string }
  | { kind: "phone"; audio: string; label: string; title: string; phoneTitle: string; rows: { h: string; d: string; color?: string }[]; caption: string };

const springIn = (frame: number, fps: number, delay = 0) =>
  spring({ frame: frame - delay, fps, config: { damping: 20 } });

// ---------- Title / Close ----------
const TitleScene: React.FC<{ s: Extract<SceneSpec, { kind: "title" }> }> = ({ s }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const barW = interpolate(springIn(frame, fps), [0, 1], [0, 240]);
  const titleY = interpolate(springIn(frame, fps, 8), [0, 1], [40, 0]);
  const titleOp = interpolate(frame, [8, 25], [0, 1], { extrapolateRight: "clamp" });
  const subOp = interpolate(frame, [40, 60], [0, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ padding: 140, justifyContent: "center" }}>
      <Audio src={staticFile(s.audio)} />
      <div style={{ height: 4, width: barW, background: COLORS.green, marginBottom: 32 }} />
      <div style={{ color: COLORS.green, fontFamily: mono, fontSize: 20, letterSpacing: 4, textTransform: "uppercase", marginBottom: 24, opacity: subOp }}>{s.label}</div>
      <div style={{ color: COLORS.ink, fontFamily: display, fontSize: 160, fontWeight: 700, lineHeight: 0.95, letterSpacing: -4, transform: `translateY(${titleY}px)`, opacity: titleOp }}>
        {s.titleTop}
        <br />
        <span style={{ color: COLORS.green }}>{s.titleAccent}</span>
      </div>
      <div style={{ color: COLORS.mute, fontFamily: body, fontSize: 28, marginTop: 32, opacity: subOp }}>{s.sub}</div>
      {s.captionAtEnd && <CaptionBar text={s.captionAtEnd} />}
    </AbsoluteFill>
  );
};

const CloseScene: React.FC<{ s: Extract<SceneSpec, { kind: "close" }> }> = ({ s }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sp = springIn(frame, fps);
  const barW = interpolate(springIn(frame, fps, 20), [0, 1], [0, 300]);
  return (
    <AbsoluteFill style={{ padding: 140, justifyContent: "center", alignItems: "center", textAlign: "center" }}>
      <Audio src={staticFile(s.audio)} />
      <div style={{ color: COLORS.green, fontFamily: mono, fontSize: 18, letterSpacing: 4, textTransform: "uppercase", opacity: sp }}>{s.label}</div>
      <div style={{ height: 4, width: barW, background: COLORS.green, marginTop: 24, marginBottom: 24 }} />
      <div style={{ color: COLORS.ink, fontFamily: display, fontSize: 200, fontWeight: 700, lineHeight: 0.95, letterSpacing: -6, transform: `scale(${0.9 + 0.1 * sp})`, opacity: sp }}>
        {s.title} <span style={{ color: COLORS.green }}>{s.accent}</span>
      </div>
      <div style={{ color: COLORS.mute, fontFamily: body, fontSize: 26, marginTop: 30, opacity: sp }}>{s.sub}</div>
    </AbsoluteFill>
  );
};

// ---------- List ----------
const ListScene: React.FC<{ s: Extract<SceneSpec, { kind: "list" }> }> = ({ s }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const body_ = (
    <div style={{ padding: 40, display: "flex", flexDirection: "column", gap: 18 }}>
      {s.items.map((it, i) => {
        const e = springIn(frame, fps, 25 + i * 22);
        return (
          <div key={i} style={{
            display: "grid", gridTemplateColumns: "60px 1fr", gap: 20, alignItems: "start",
            padding: "18px 22px", background: "rgba(255,255,255,0.02)",
            border: `1px solid ${COLORS.border}`, borderLeft: `4px solid ${COLORS.green}`,
            borderRadius: 12, opacity: e, transform: `translateX(${(1 - e) * -30}px)`,
          }}>
            <div style={{ color: COLORS.green, fontFamily: mono, fontSize: 26, fontWeight: 700 }}>{String(i + 1).padStart(2, "0")}</div>
            <div>
              <div style={{ color: COLORS.ink, fontFamily: display, fontSize: 30, fontWeight: 700 }}>{it.h}</div>
              <div style={{ color: COLORS.mute, fontFamily: body, fontSize: 20, marginTop: 4 }}>{it.d}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
  return (
    <AbsoluteFill style={{ padding: "60px 120px", justifyContent: "flex-start" }}>
      <Audio src={staticFile(s.audio)} />
      <SceneKicker label={s.label} title={s.title} />
      <div style={{ marginTop: 40 }}>
        {s.url ? <BrowserFrame url={s.url}>{body_}</BrowserFrame> : body_}
      </div>
      <CaptionBar text={s.caption} />
    </AbsoluteFill>
  );
};

// ---------- Cards ----------
const CardsScene: React.FC<{ s: Extract<SceneSpec, { kind: "cards" }> }> = ({ s }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inner = (
    <div style={{ padding: 40, display: "grid", gridTemplateColumns: `repeat(${Math.min(s.cards.length, 3)}, 1fr)`, gap: 20 }}>
      {s.cards.map((c, i) => {
        const e = springIn(frame, fps, 25 + i * 18);
        const col = c.color ?? COLORS.green;
        return (
          <div key={i} style={{
            background: COLORS.card, border: `1px solid ${COLORS.border}`,
            borderTop: `4px solid ${col}`, borderRadius: 14, padding: 26,
            opacity: e, transform: `translateY(${(1 - e) * 24}px)`,
          }}>
            <div style={{ color: col, fontFamily: mono, fontSize: 13, letterSpacing: 2, textTransform: "uppercase" }}>{c.tag}</div>
            <div style={{ color: COLORS.ink, fontFamily: display, fontSize: 34, fontWeight: 700, marginTop: 10, lineHeight: 1.1 }}>{c.h}</div>
            <div style={{ color: COLORS.mute, fontFamily: body, fontSize: 20, marginTop: 12, lineHeight: 1.4 }}>{c.d}</div>
          </div>
        );
      })}
    </div>
  );
  return (
    <AbsoluteFill style={{ padding: "60px 120px", justifyContent: "flex-start" }}>
      <Audio src={staticFile(s.audio)} />
      <SceneKicker label={s.label} title={s.title} />
      <div style={{ marginTop: 50 }}>{s.url ? <BrowserFrame url={s.url}>{inner}</BrowserFrame> : inner}</div>
      <CaptionBar text={s.caption} />
    </AbsoluteFill>
  );
};

// ---------- Steps ----------
const StepsScene: React.FC<{ s: Extract<SceneSpec, { kind: "steps" }> }> = ({ s }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ padding: "60px 120px", justifyContent: "flex-start" }}>
      <Audio src={staticFile(s.audio)} />
      <SceneKicker label={s.label} title={s.title} />
      <div style={{ marginTop: 40, display: "flex", flexDirection: "column", gap: 14 }}>
        {s.steps.map((st, i) => {
          const e = springIn(frame, fps, 30 + i * 30);
          return (
            <div key={i} style={{
              display: "grid", gridTemplateColumns: "80px 260px 1fr", alignItems: "center", gap: 24,
              background: COLORS.card, border: `1px solid ${COLORS.border}`,
              borderLeft: `4px solid ${COLORS.green}`, borderRadius: 14, padding: "22px 28px",
              opacity: e, transform: `translateX(${(1 - e) * -40}px)`,
            }}>
              <div style={{ color: COLORS.green, fontFamily: mono, fontSize: 22 }}>{st.n}</div>
              <div style={{ color: COLORS.ink, fontFamily: display, fontSize: 38, fontWeight: 700 }}>{st.t}</div>
              <div style={{ color: COLORS.mute, fontFamily: body, fontSize: 20 }}>{st.d}</div>
            </div>
          );
        })}
      </div>
      <CaptionBar text={s.caption} />
    </AbsoluteFill>
  );
};

// ---------- Phone mock (mobile UI) ----------
const PhoneScene: React.FC<{ s: Extract<SceneSpec, { kind: "phone" }> }> = ({ s }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ padding: "60px 120px", display: "flex", flexDirection: "row", gap: 60, alignItems: "center" }}>
      <Audio src={staticFile(s.audio)} />
      <div style={{ flex: 1 }}>
        <SceneKicker label={s.label} title={s.title} />
        <div style={{ marginTop: 30, color: COLORS.mute, fontFamily: body, fontSize: 22, maxWidth: 560, lineHeight: 1.5 }}>
          {s.rows.map((r, i) => {
            const e = springIn(frame, fps, 40 + i * 20);
            return (
              <div key={i} style={{ marginTop: 14, opacity: e, transform: `translateY(${(1 - e) * 10}px)` }}>
                <span style={{ color: r.color ?? COLORS.green, fontFamily: mono, fontSize: 14, letterSpacing: 2, textTransform: "uppercase", marginRight: 14 }}>—</span>
                <span style={{ color: COLORS.ink, fontWeight: 600 }}>{r.h}</span>
                <span style={{ color: COLORS.mute }}> · {r.d}</span>
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ flex: "0 0 auto", display: "flex", justifyContent: "center" }}>
        <div style={{ width: 420, height: 820, borderRadius: 52, padding: 14, background: "#1a2320", border: `2px solid ${COLORS.border}`, boxShadow: "0 40px 100px rgba(0,0,0,0.5)" }}>
          <div style={{ width: "100%", height: "100%", borderRadius: 40, background: "#0b1210", overflow: "hidden", position: "relative", padding: 24 }}>
            <div style={{ color: COLORS.mute, fontFamily: mono, fontSize: 12, letterSpacing: 2, textTransform: "uppercase" }}>Deckademics</div>
            <div style={{ color: COLORS.ink, fontFamily: display, fontSize: 32, fontWeight: 700, marginTop: 6 }}>{s.phoneTitle}</div>
            <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 12 }}>
              {s.rows.map((r, i) => {
                const e = springIn(frame, fps, 60 + i * 25);
                const col = r.color ?? COLORS.green;
                return (
                  <div key={i} style={{
                    background: "rgba(255,255,255,0.03)", border: `1px solid ${COLORS.border}`,
                    borderLeft: `3px solid ${col}`, borderRadius: 12, padding: "14px 16px",
                    opacity: e, transform: `translateX(${(1 - e) * -20}px)`,
                  }}>
                    <div style={{ color: COLORS.ink, fontFamily: body, fontSize: 17, fontWeight: 600 }}>{r.h}</div>
                    <div style={{ color: COLORS.mute, fontFamily: body, fontSize: 14, marginTop: 4 }}>{r.d}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      <CaptionBar text={s.caption} />
    </AbsoluteFill>
  );
};

export const SceneRenderer: React.FC<{ s: SceneSpec }> = ({ s }) => {
  switch (s.kind) {
    case "title": return <TitleScene s={s} />;
    case "close": return <CloseScene s={s} />;
    case "list":  return <ListScene s={s} />;
    case "cards": return <CardsScene s={s} />;
    case "steps": return <StepsScene s={s} />;
    case "phone": return <PhoneScene s={s} />;
  }
};
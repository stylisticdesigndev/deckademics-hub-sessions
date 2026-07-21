import React from "react";
import { COLORS } from "../theme";

export const BrowserFrame: React.FC<{
  url?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ url = "deckademics.app/admin", children, style }) => (
  <div
    style={{
      background: COLORS.card,
      border: `1px solid ${COLORS.border}`,
      borderRadius: 18,
      overflow: "hidden",
      boxShadow:
        "0 40px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(64,166,71,0.15), 0 0 60px rgba(64,166,71,0.12)",
      ...style,
    }}
  >
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "14px 18px",
        borderBottom: `1px solid ${COLORS.border}`,
        background: "rgba(0,0,0,0.25)",
      }}
    >
      <div style={{ display: "flex", gap: 8 }}>
        {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
          <div
            key={c}
            style={{ width: 12, height: 12, borderRadius: 999, background: c, opacity: 0.9 }}
          />
        ))}
      </div>
      <div
        style={{
          flex: 1,
          background: "rgba(255,255,255,0.04)",
          borderRadius: 8,
          padding: "6px 14px",
          color: COLORS.mute,
          fontFamily: "monospace",
          fontSize: 14,
          textAlign: "center",
          border: `1px solid ${COLORS.border}`,
        }}
      >
        {url}
      </div>
      <div style={{ width: 40 }} />
    </div>
    <div style={{ padding: 0 }}>{children}</div>
  </div>
);
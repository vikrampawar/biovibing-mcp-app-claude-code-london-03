// Shared UI components for all widgets
import { useState } from "react";

const insightColors: Record<string, string> = { good: "#10b981", warn: "#f59e0b", neutral: "#60a5fa" };

export function InsightsPanel({ insights }: { insights: string[] }) {
  if (!insights || insights.length === 0) return null;

  const getType = (text: string) => {
    if (text.includes("Great") || text.includes("Excellent") || text.includes("improving") || text.includes("surplus")) return "good";
    if (text.includes("Low") || text.includes("declining") || text.includes("erratic") || text.includes("jumped") || text.includes("debt")) return "warn";
    return "neutral";
  };

  return (
    <div style={{ background: "#1a1d2e", borderRadius: 10, padding: "0.875rem", border: "1px solid rgba(139,92,246,0.2)" }}>
      <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#94a3b8", marginBottom: "0.75rem" }}>Coach Insights</div>
      {insights.map((insight, i) => {
        const type = getType(insight);
        return (
          <div key={i} style={{
            padding: "0.5rem 0.75rem",
            fontSize: "0.8rem",
            color: "#cbd5e1",
            lineHeight: 1.5,
            borderLeft: `3px solid ${insightColors[type]}`,
            marginBottom: i < insights.length - 1 ? "0.375rem" : 0,
            borderRadius: "0 4px 4px 0",
            background: "rgba(15,17,23,0.5)",
          }}>
            {insight}
          </div>
        );
      })}
    </div>
  );
}

export function ActionButtons({ onAsk }: { onAsk: (msg: string) => void }) {
  const [sent, setSent] = useState<string | null>(null);

  const actions = [
    { label: "Explain my data", message: "Explain my health data in detail — what should I pay attention to and why?" },
    { label: "Sleep tips", message: "Based on my sleep data, give me specific actionable tips to improve my sleep quality." },
    { label: "Compare months", message: "Show me my health dashboard for the last 90 days so I can see monthly trends." },
    { label: "Am I ready to train?", message: "Based on my readiness and recovery data, should I train hard today or take it easy?" },
  ];

  const btnBase: React.CSSProperties = {
    background: "#1a1d2e",
    border: "1px solid #2a2d3e",
    borderRadius: 999,
    color: "#94a3b8",
    fontSize: "0.75rem",
    fontFamily: "'Inter', sans-serif",
    padding: "0.375rem 0.875rem",
    cursor: "pointer",
    transition: "all 0.2s ease",
  };

  return (
    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
      {actions.map((a, i) => {
        const isSent = sent === a.label;
        const isDisabled = sent !== null && !isSent;
        return (
          <button
            key={i}
            disabled={sent !== null}
            style={{
              ...btnBase,
              ...(isSent ? { background: "#252840", borderColor: "#10b981", color: "#10b981" } : {}),
              ...(isDisabled ? { opacity: 0.4, cursor: "not-allowed" } : {}),
            }}
            onClick={() => { setSent(a.label); onAsk(a.message); }}
          >
            {isSent ? `${a.label} ✓` : a.label}
          </button>
        );
      })}
    </div>
  );
}

export function ScoreRing({ score, label, color, size = 100 }: { score: number; label: string; color: string; size?: number }) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div style={{ flexShrink: 0 }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#2a2a3a" strokeWidth="8" />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 0.8s ease" }} />
        <text x={size / 2} y={size / 2 - 4} textAnchor="middle" fill="white" fontSize="22" fontWeight="bold">{score}</text>
        <text x={size / 2} y={size / 2 + 14} textAnchor="middle" fill="#888" fontSize="10">{label}</text>
      </svg>
    </div>
  );
}

export function MetricCard({ value, label }: { value: string | number; label: string }) {
  return (
    <div style={{ background: "#1a1d2e", borderRadius: 8, padding: "0.5rem 0.75rem", textAlign: "center" }}>
      <div style={{ fontSize: "1.125rem", fontWeight: 700, color: "#f1f5f9" }}>{value}</div>
      <div style={{ fontSize: "0.625rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "0.125rem" }}>{label}</div>
    </div>
  );
}

// Aggregate daily data into buckets (weekly or monthly) for readable charts
function aggregateData(data: { day: string; value: number }[]): { day: string; value: number; label: string }[] {
  const count = data.length;

  // <= 14 days: show daily
  if (count <= 14) {
    return data.map(d => ({ ...d, label: d.day.slice(5) }));
  }

  // <= 90 days: show weekly averages
  if (count <= 90) {
    const weeks: { day: string; values: number[]; label: string }[] = [];
    for (let i = 0; i < count; i += 7) {
      const chunk = data.slice(i, Math.min(i + 7, count));
      const startDay = chunk[0].day.slice(5);
      weeks.push({
        day: chunk[0].day,
        values: chunk.map(c => c.value),
        label: `${startDay}`,
      });
    }
    return weeks.map(w => ({
      day: w.day,
      value: Math.round((w.values.reduce((a, b) => a + b, 0) / w.values.length) * 10) / 10,
      label: w.label,
    }));
  }

  // > 90 days: show monthly averages
  const months: Map<string, { values: number[]; key: string }> = new Map();
  for (const d of data) {
    const monthKey = d.day.slice(0, 7); // YYYY-MM
    if (!months.has(monthKey)) {
      months.set(monthKey, { values: [], key: monthKey });
    }
    months.get(monthKey)!.values.push(d.value);
  }
  return Array.from(months.values()).map(m => ({
    day: m.key,
    value: Math.round((m.values.reduce((a, b) => a + b, 0) / m.values.length) * 10) / 10,
    label: m.key.slice(2), // YY-MM
  }));
}

export function BarChart({ data, label, color, unit }: { data: { day: string; value: number }[]; label: string; color: string; unit: string }) {
  const aggregated = aggregateData(data);
  const max = Math.max(...aggregated.map(d => d.value), 1);
  const bucketLabel = data.length <= 14 ? "daily" : data.length <= 90 ? "weekly avg" : "monthly avg";

  return (
    <div style={{ background: "#1a1d2e", borderRadius: 10, padding: "0.875rem" }}>
      <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#94a3b8", marginBottom: "0.75rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        {label}
        <span style={{ fontSize: "0.625rem", fontWeight: 400, color: "#475569" }}>{data.length}d · {bucketLabel}</span>
      </div>
      <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 100 }}>
        {aggregated.map(d => (
          <div key={d.day} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{ fontSize: "0.6rem", color: "#94a3b8" }}>{d.value}{unit}</div>
            <div style={{ width: "100%", height: 70, background: "#0f1117", borderRadius: 4, display: "flex", alignItems: "flex-end", overflow: "hidden" }}>
              <div style={{ width: "100%", height: `${(d.value / max) * 100}%`, backgroundColor: color, borderRadius: "4px 4px 0 0", transition: "height 0.5s ease", minHeight: 2 }} />
            </div>
            <div style={{ fontSize: "0.6rem", color: "#475569" }}>{d.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SleepStages({ deep, rem, light, awake }: { deep: number; rem: number; light: number; awake: number }) {
  const total = deep + rem + light + awake;
  const toH = (s: number) => (s / 3600).toFixed(1);
  const toPct = (s: number) => ((s / total) * 100).toFixed(0);

  const stages = [
    { label: "Deep", value: deep, color: "#6366f1" },
    { label: "REM", value: rem, color: "#8b5cf6" },
    { label: "Light", value: light, color: "#60a5fa" },
    { label: "Awake", value: awake, color: "#f87171" },
  ];

  return (
    <div style={{ background: "#1a1d2e", borderRadius: 10, padding: "0.875rem" }}>
      <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#94a3b8", marginBottom: "0.75rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>Sleep Stages (last night)</div>
      <div style={{ display: "flex", height: 20, borderRadius: 6, overflow: "hidden", gap: 2 }}>
        {stages.map(s => (
          <div key={s.label} style={{ width: `${toPct(s.value)}%`, backgroundColor: s.color, transition: "width 0.5s ease", minWidth: 4 }} title={`${s.label}: ${toH(s.value)}h`} />
        ))}
      </div>
      <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
        {stages.map(s => (
          <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.7rem", color: "#94a3b8" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, backgroundColor: s.color }} />
            <span>{s.label} {toH(s.value)}h</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function aggregateDebtData(data: { day: string; sleptHours: number; debtHours: number }[]): { day: string; sleptHours: number; debtHours: number; label: string }[] {
  if (data.length <= 14) {
    return data.map(d => ({ ...d, label: d.day.slice(5) }));
  }

  // Aggregate into weekly averages
  const result: { day: string; sleptHours: number; debtHours: number; label: string }[] = [];
  const chunkSize = data.length <= 90 ? 7 : 30;
  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, Math.min(i + chunkSize, data.length));
    const avgSlept = Math.round((chunk.reduce((s, d) => s + d.sleptHours, 0) / chunk.length) * 10) / 10;
    const avgDebt = Math.round((chunk.reduce((s, d) => s + d.debtHours, 0) / chunk.length) * 10) / 10;
    const label = data.length <= 90 ? chunk[0].day.slice(5) : chunk[0].day.slice(2, 7);
    result.push({ day: chunk[0].day, sleptHours: avgSlept, debtHours: avgDebt, label });
  }
  return result;
}

export function SleepDebtChart({ data, cumulative }: { data: { day: string; sleptHours: number; debtHours: number }[]; cumulative: number }) {
  const statusColor = cumulative > 7 ? "#ef4444" : cumulative > 3 ? "#f59e0b" : cumulative <= 0 ? "#10b981" : "#60a5fa";
  const aggregated = aggregateDebtData(data);
  const bucketLabel = data.length <= 14 ? "daily" : data.length <= 90 ? "weekly avg" : "monthly avg";

  return (
    <div style={{ background: "#1a1d2e", borderRadius: 10, padding: "0.875rem" }}>
      <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#94a3b8", marginBottom: "0.75rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        Sleep Debt
        <span style={{ fontWeight: 700, fontSize: "0.75rem", color: statusColor }}>
          {cumulative > 0 ? `${Math.round(cumulative)}h debt` : `${Math.abs(Math.round(cumulative))}h surplus`}
          <span style={{ fontSize: "0.625rem", fontWeight: 400, color: "#475569", marginLeft: "0.5rem" }}>{bucketLabel}</span>
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {aggregated.map(d => (
          <div key={d.day} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "0.65rem", color: "#64748b", width: "2.5rem", textAlign: "right" }}>{d.label}</span>
            <div style={{ flex: 1, height: 14, background: "#0f1117", borderRadius: 4, position: "relative", overflow: "hidden" }}>
              <div style={{
                height: "100%",
                borderRadius: 4,
                transition: "width 0.5s ease",
                width: `${Math.min((d.sleptHours / 10) * 100, 100)}%`,
                backgroundColor: d.sleptHours >= 7.5 ? "#10b981" : d.sleptHours >= 6 ? "#f59e0b" : "#ef4444",
              }} />
              <div style={{ position: "absolute", top: 0, bottom: 0, width: 2, background: "rgba(255,255,255,0.3)", left: "75%" }} />
            </div>
            <span style={{ fontSize: "0.65rem", color: "#94a3b8", width: "2.5rem" }}>{d.sleptHours}h</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ComparisonRow({ label, thisWeek, lastWeek, unit, higherIsBetter = true }: { label: string; thisWeek: number; lastWeek: number; unit: string; higherIsBetter?: boolean }) {
  const diff = thisWeek - lastWeek;
  const pct = lastWeek !== 0 ? ((diff / Math.abs(lastWeek)) * 100).toFixed(1) : "0";
  const isGood = higherIsBetter ? diff >= 0 : diff <= 0;

  return (
    <div style={{ display: "flex", alignItems: "center", padding: "0.375rem 0", borderBottom: "1px solid #1e2030", fontSize: "0.75rem" }}>
      <span style={{ flex: 1, color: "#94a3b8" }}>{label}</span>
      <span style={{ color: "#cbd5e1", marginRight: "0.75rem" }}>{lastWeek}{unit} → {thisWeek}{unit}</span>
      <span style={{ fontWeight: 600, minWidth: "3.5rem", textAlign: "right", color: isGood ? "#10b981" : "#ef4444" }}>{diff >= 0 ? "+" : ""}{pct}%</span>
    </div>
  );
}

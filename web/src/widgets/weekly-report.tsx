import { mountWidget } from "skybridge/web";
import { useToolInfo, useSendFollowUpMessage } from "../helpers.js";
import { ComparisonRow, BarChart, InsightsPanel, ActionButtons } from "../components.js";

const dashboardStyle: React.CSSProperties = {
  fontFamily: "'Inter', sans-serif", color: "#e2e8f0", background: "#0f1117",
  padding: "1.25rem", minHeight: "100%", display: "flex", flexDirection: "column", gap: "1rem", margin: 0, boxSizing: "border-box",
};
const headerStyle: React.CSSProperties = { display: "flex", alignItems: "baseline", gap: "0.75rem" };
const chartCardStyle: React.CSSProperties = { background: "#1a1d2e", borderRadius: 10, padding: "0.875rem" };
const chartLabelStyle: React.CSSProperties = { fontSize: "0.8rem", fontWeight: 600, color: "#94a3b8", marginBottom: "0.75rem", display: "flex", justifyContent: "space-between", alignItems: "center" };

function WeeklyReport() {
  const { output } = useToolInfo<"weekly-report">();
  const sendFollowUp = useSendFollowUpMessage();

  if (!output) {
    return <div style={{ ...dashboardStyle, alignItems: "center", justifyContent: "center" }}><div style={{ color: "#64748b", fontSize: "0.875rem" }}>Generating report...</div></div>;
  }

  const c = output.comparison;

  const metrics = [
    { label: "Sleep Score", ...c.sleepScore, higherIsBetter: true },
    { label: "Readiness", ...c.readiness, higherIsBetter: true },
    { label: "HRV", ...c.hrv, higherIsBetter: true },
    { label: "Resting HR", ...c.restingHr, higherIsBetter: false },
    { label: "Steps", ...c.steps, higherIsBetter: true },
  ];
  const wins = metrics.filter(m => m.higherIsBetter ? m.thisWeek > m.lastWeek : m.thisWeek < m.lastWeek);
  const concerns = metrics.filter(m => m.higherIsBetter ? m.thisWeek < m.lastWeek : m.thisWeek > m.lastWeek);

  return (
    <div style={dashboardStyle}>
      <div style={headerStyle}>
        <h1 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#f1f5f9", margin: 0 }}>Weekly Report</h1>
        <span style={{ fontSize: "0.75rem", color: "#64748b" }}>This week vs last week</span>
      </div>

      <InsightsPanel insights={(output as any).insights} />
      <ActionButtons onAsk={(msg) => sendFollowUp(msg)} />

      {wins.length > 0 && (
        <div style={chartCardStyle}>
          <div style={{ ...chartLabelStyle, color: "#10b981" }}>Wins</div>
          {wins.map(w => (
            <div key={w.label} style={{ fontSize: "0.8rem", color: "#10b981", padding: "0.25rem 0" }}>{w.label}: {w.lastWeek} → {w.thisWeek}</div>
          ))}
        </div>
      )}

      {concerns.length > 0 && (
        <div style={chartCardStyle}>
          <div style={{ ...chartLabelStyle, color: "#f59e0b" }}>Watch</div>
          {concerns.map(w => (
            <div key={w.label} style={{ fontSize: "0.8rem", color: "#f59e0b", padding: "0.25rem 0" }}>{w.label}: {w.lastWeek} → {w.thisWeek}</div>
          ))}
        </div>
      )}

      <div style={chartCardStyle}>
        <div style={chartLabelStyle}>Detailed Comparison</div>
        <ComparisonRow label="Sleep Score" thisWeek={c.sleepScore.thisWeek} lastWeek={c.sleepScore.lastWeek} unit="" />
        <ComparisonRow label="Readiness" thisWeek={c.readiness.thisWeek} lastWeek={c.readiness.lastWeek} unit="" />
        <ComparisonRow label="HRV" thisWeek={c.hrv.thisWeek} lastWeek={c.hrv.lastWeek} unit="ms" />
        <ComparisonRow label="Resting HR" thisWeek={c.restingHr.thisWeek} lastWeek={c.restingHr.lastWeek} unit="bpm" higherIsBetter={false} />
        <ComparisonRow label="Steps" thisWeek={c.steps.thisWeek} lastWeek={c.steps.lastWeek} unit="" />
        <ComparisonRow label="Calories" thisWeek={c.calories.thisWeek} lastWeek={c.calories.lastWeek} unit="" />
        <ComparisonRow label="Stress (min)" thisWeek={c.stress.thisWeek} lastWeek={c.stress.lastWeek} unit="" higherIsBetter={false} />
      </div>

      <BarChart
        data={[
          ...output.lastWeek.map(d => ({ day: d.day, value: d.sleep.score })),
          ...output.thisWeek.map(d => ({ day: d.day, value: d.sleep.score })),
        ]}
        label="Sleep Score (2 weeks)" color="#8b5cf6" unit=""
      />

      <BarChart
        data={[
          ...output.lastWeek.map(d => ({ day: d.day, value: d.sleep.avgHrvMs })),
          ...output.thisWeek.map(d => ({ day: d.day, value: d.sleep.avgHrvMs })),
        ]}
        label="HRV (2 weeks)" color="#60a5fa" unit="ms"
      />
    </div>
  );
}

export default WeeklyReport;
mountWidget(<WeeklyReport />);

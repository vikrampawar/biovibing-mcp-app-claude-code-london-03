import { mountWidget } from "skybridge/web";
import { useToolInfo, useSendFollowUpMessage } from "../helpers.js";
import { BarChart, MetricCard, InsightsPanel, ActionButtons } from "../components.js";

const dashboardStyle: React.CSSProperties = {
  fontFamily: "'Inter', sans-serif", color: "#e2e8f0", background: "#0f1117",
  padding: "1.25rem", minHeight: "100%", display: "flex", flexDirection: "column", gap: "1rem", margin: 0, boxSizing: "border-box",
};
const headerStyle: React.CSSProperties = { display: "flex", alignItems: "baseline", gap: "0.75rem" };
const chartCardStyle: React.CSSProperties = { background: "#1a1d2e", borderRadius: 10, padding: "0.875rem" };
const chartLabelStyle: React.CSSProperties = { fontSize: "0.8rem", fontWeight: 600, color: "#94a3b8", marginBottom: "0.75rem", display: "flex", justifyContent: "space-between", alignItems: "center" };

function StressBar({ high, recovery }: { high: number; recovery: number }) {
  const total = high + recovery;
  const highPct = total > 0 ? ((high / total) * 100).toFixed(0) : "50";
  const recPct = total > 0 ? ((recovery / total) * 100).toFixed(0) : "50";

  return (
    <div style={chartCardStyle}>
      <div style={chartLabelStyle}>Stress vs Recovery</div>
      <div style={{ display: "flex", height: 20, borderRadius: 6, overflow: "hidden", gap: 2 }}>
        <div style={{ width: `${highPct}%`, backgroundColor: "#ef4444", transition: "width 0.5s ease", minWidth: 4 }} title={`Stress: ${high} min`} />
        <div style={{ width: `${recPct}%`, backgroundColor: "#10b981", transition: "width 0.5s ease", minWidth: 4 }} title={`Recovery: ${recovery} min`} />
      </div>
      <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.7rem", color: "#94a3b8" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, backgroundColor: "#ef4444" }} />
          <span>Stress {high} min</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.7rem", color: "#94a3b8" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, backgroundColor: "#10b981" }} />
          <span>Recovery {recovery} min</span>
        </div>
      </div>
    </div>
  );
}

function ActivityTracker() {
  const { output } = useToolInfo<"activity-tracker">();
  const sendFollowUp = useSendFollowUpMessage();

  if (!output) {
    return <div style={{ ...dashboardStyle, alignItems: "center", justifyContent: "center" }}><div style={{ color: "#64748b", fontSize: "0.875rem" }}>Loading activity...</div></div>;
  }

  const days = output.days;
  const today = days[days.length - 1];
  const totalSteps = days.reduce((s, d) => s + d.activity.steps, 0);
  const avgSteps = Math.round(totalSteps / days.length);
  const totalCal = days.reduce((s, d) => s + d.activity.totalCalories, 0);
  const bestDay = days.reduce((best, d) => d.activity.steps > best.activity.steps ? d : best, days[0]);

  return (
    <div style={dashboardStyle}>
      <div style={headerStyle}>
        <h1 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#f1f5f9", margin: 0 }}>Activity Tracker</h1>
        <span style={{ fontSize: "0.75rem", color: "#64748b" }}>{days.length} days</span>
      </div>

      <InsightsPanel insights={(output as any).insights} />
      <ActionButtons onAsk={(msg) => sendFollowUp(msg)} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
        <MetricCard value={today.activity.steps.toLocaleString()} label="Today's Steps" />
        <MetricCard value={avgSteps.toLocaleString()} label="Daily Average" />
        <MetricCard value={totalSteps.toLocaleString()} label="Total Steps" />
        <MetricCard value={today.activity.totalCalories.toLocaleString()} label="Today's Cal" />
        <MetricCard value={totalCal.toLocaleString()} label="Total Cal" />
        <MetricCard value={`${bestDay.day.slice(5)} (${bestDay.activity.steps.toLocaleString()})`} label="Best Day" />
      </div>

      <BarChart data={days.map(d => ({ day: d.day, value: d.activity.steps }))} label="Daily Steps" color="#10b981" unit="" />
      <BarChart data={days.map(d => ({ day: d.day, value: d.activity.totalCalories }))} label="Calories Burned" color="#f59e0b" unit="" />
      <StressBar high={today.stress.highMinutes} recovery={today.stress.recoveryMinutes} />
      <BarChart data={days.map(d => ({ day: d.day, value: d.stress.highMinutes }))} label="Stress Minutes" color="#ef4444" unit="m" />
    </div>
  );
}

export default ActivityTracker;
mountWidget(<ActivityTracker />);

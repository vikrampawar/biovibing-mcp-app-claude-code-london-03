import "@/index.css";
import { mountWidget } from "skybridge/web";
import { useToolInfo, useSendFollowUpMessage } from "../helpers.js";
import { BarChart, MetricCard, InsightsPanel, ActionButtons } from "../components.js";

function StressBar({ high, recovery }: { high: number; recovery: number }) {
  const total = high + recovery;
  const highPct = total > 0 ? ((high / total) * 100).toFixed(0) : "50";
  const recPct = total > 0 ? ((recovery / total) * 100).toFixed(0) : "50";

  return (
    <div className="chart-card">
      <div className="chart-label">Stress vs Recovery</div>
      <div className="stages-bar">
        <div className="stage-segment" style={{ width: `${highPct}%`, backgroundColor: "#ef4444" }} title={`Stress: ${high} min`} />
        <div className="stage-segment" style={{ width: `${recPct}%`, backgroundColor: "#10b981" }} title={`Recovery: ${recovery} min`} />
      </div>
      <div className="stages-legend">
        <div className="legend-item">
          <span className="legend-dot" style={{ backgroundColor: "#ef4444" }} />
          <span>Stress {high} min</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ backgroundColor: "#10b981" }} />
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
    return <div className="dashboard loading"><div className="loading-text">Loading activity...</div></div>;
  }

  const days = output.days;
  const today = days[days.length - 1];
  const totalSteps = days.reduce((s, d) => s + d.activity.steps, 0);
  const avgSteps = Math.round(totalSteps / days.length);
  const totalCal = days.reduce((s, d) => s + d.activity.totalCalories, 0);
  const bestDay = days.reduce((best, d) => d.activity.steps > best.activity.steps ? d : best, days[0]);

  return (
    <div className="dashboard">
      <div className="header">
        <h1>Activity Tracker</h1>
        <span className="subtitle">{days.length} days</span>
      </div>

      <InsightsPanel insights={(output as any).insights} />
      <ActionButtons onAsk={(msg) => sendFollowUp(msg)} />

      <div className="metric-cards" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
        <MetricCard value={today.activity.steps.toLocaleString()} label="Today's Steps" />
        <MetricCard value={avgSteps.toLocaleString()} label="Daily Average" />
        <MetricCard value={totalSteps.toLocaleString()} label="Total Steps" />
        <MetricCard value={today.activity.totalCalories.toLocaleString()} label="Today's Cal" />
        <MetricCard value={totalCal.toLocaleString()} label="Total Cal" />
        <MetricCard value={`${bestDay.day.slice(5)} (${bestDay.activity.steps.toLocaleString()})`} label="Best Day" />
      </div>

      <BarChart
        data={days.map(d => ({ day: d.day, value: d.activity.steps }))}
        label="Daily Steps"
        color="#10b981"
        unit=""
      />

      <BarChart
        data={days.map(d => ({ day: d.day, value: d.activity.totalCalories }))}
        label="Calories Burned"
        color="#f59e0b"
        unit=""
      />

      <StressBar high={today.stress.highMinutes} recovery={today.stress.recoveryMinutes} />

      <BarChart
        data={days.map(d => ({ day: d.day, value: d.stress.highMinutes }))}
        label="Stress Minutes"
        color="#ef4444"
        unit="m"
      />
    </div>
  );
}

export default ActivityTracker;
mountWidget(<ActivityTracker />);

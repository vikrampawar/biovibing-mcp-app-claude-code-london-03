import "@/index.css";
import { mountWidget } from "skybridge/web";
import { useToolInfo, useSendFollowUpMessage } from "../helpers.js";
import { ComparisonRow, BarChart, InsightsPanel, ActionButtons } from "../components.js";

function WeeklyReport() {
  const { output } = useToolInfo<"weekly-report">();
  const sendFollowUp = useSendFollowUpMessage();

  if (!output) {
    return <div className="dashboard loading"><div className="loading-text">Generating report...</div></div>;
  }

  const c = output.comparison;

  // Determine wins and concerns
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
    <div className="dashboard">
      <div className="header">
        <h1>Weekly Report</h1>
        <span className="subtitle">This week vs last week</span>
      </div>

      <InsightsPanel insights={(output as any).insights} />
      <ActionButtons onAsk={(msg) => sendFollowUp(msg)} />

      {wins.length > 0 && (
        <div className="chart-card">
          <div className="chart-label" style={{ color: "#10b981" }}>Wins</div>
          {wins.map(w => (
            <div key={w.label} className="win-item">{w.label}: {w.lastWeek} → {w.thisWeek}</div>
          ))}
        </div>
      )}

      {concerns.length > 0 && (
        <div className="chart-card">
          <div className="chart-label" style={{ color: "#f59e0b" }}>Watch</div>
          {concerns.map(w => (
            <div key={w.label} className="concern-item">{w.label}: {w.lastWeek} → {w.thisWeek}</div>
          ))}
        </div>
      )}

      <div className="chart-card">
        <div className="chart-label">Detailed Comparison</div>
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
        label="Sleep Score (2 weeks)"
        color="#8b5cf6"
        unit=""
      />

      <BarChart
        data={[
          ...output.lastWeek.map(d => ({ day: d.day, value: d.sleep.avgHrvMs })),
          ...output.thisWeek.map(d => ({ day: d.day, value: d.sleep.avgHrvMs })),
        ]}
        label="HRV (2 weeks)"
        color="#60a5fa"
        unit="ms"
      />
    </div>
  );
}

export default WeeklyReport;
mountWidget(<WeeklyReport />);

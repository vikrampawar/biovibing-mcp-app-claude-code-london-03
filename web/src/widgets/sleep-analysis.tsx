import { mountWidget } from "skybridge/web";
import { useToolInfo, useSendFollowUpMessage } from "../helpers.js";
import { ScoreRing, BarChart, SleepStages, SleepDebtChart, InsightsPanel, ActionButtons } from "../components.js";

const dashboardStyle: React.CSSProperties = {
  fontFamily: "'Inter', sans-serif", color: "#e2e8f0", background: "#0f1117",
  padding: "1.25rem", minHeight: "100%", display: "flex", flexDirection: "column", gap: "1rem", margin: 0, boxSizing: "border-box",
};
const headerStyle: React.CSSProperties = { display: "flex", alignItems: "baseline", gap: "0.75rem" };
const scoresRowStyle: React.CSSProperties = { display: "flex", alignItems: "center", gap: "1rem" };
const metricCardsStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", flex: 1 };
const metricCardStyle: React.CSSProperties = { background: "#1a1d2e", borderRadius: 8, padding: "0.5rem 0.75rem", textAlign: "center" };
const metricValueStyle: React.CSSProperties = { fontSize: "1.125rem", fontWeight: 700, color: "#f1f5f9" };
const metricLabelStyle: React.CSSProperties = { fontSize: "0.625rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "0.125rem" };

function SleepAnalysis() {
  const { output } = useToolInfo<"sleep-analysis">();
  const sendFollowUp = useSendFollowUpMessage();

  if (!output) {
    return <div style={{ ...dashboardStyle, alignItems: "center", justifyContent: "center" }}><div style={{ color: "#64748b", fontSize: "0.875rem" }}>Analysing sleep...</div></div>;
  }

  const today = output.days[output.days.length - 1];

  return (
    <div style={dashboardStyle}>
      <div style={headerStyle}>
        <h1 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#f1f5f9", margin: 0 }}>Sleep Analysis</h1>
        <span style={{ fontSize: "0.75rem", color: "#64748b" }}>{output.days.length} days · Best: {output.bestNight.day} ({output.bestNight.score})</span>
      </div>

      <InsightsPanel insights={(output as any).insights} />
      <ActionButtons onAsk={(msg) => sendFollowUp(msg)} />

      <div style={scoresRowStyle}>
        <ScoreRing score={today.sleep.score} label="Tonight" color="#8b5cf6" />
        <ScoreRing score={Math.round(output.days.reduce((s, d) => s + d.sleep.score, 0) / output.days.length)} label="Average" color="#6366f1" size={80} />
        <div style={metricCardsStyle}>
          <div style={metricCardStyle}>
            <div style={metricValueStyle}>{(today.sleep.totalSleepSeconds / 3600).toFixed(1)}h</div>
            <div style={metricLabelStyle}>Total Sleep</div>
          </div>
          <div style={metricCardStyle}>
            <div style={metricValueStyle}>{today.sleep.efficiency}%</div>
            <div style={metricLabelStyle}>Efficiency</div>
          </div>
          <div style={{ ...metricCardStyle, border: "1px solid rgba(16,185,129,0.3)" }}>
            <div style={metricValueStyle}>{output.bestNight.score}</div>
            <div style={metricLabelStyle}>Best Night</div>
          </div>
          <div style={{ ...metricCardStyle, border: "1px solid rgba(239,68,68,0.3)" }}>
            <div style={metricValueStyle}>{output.worstNight.score}</div>
            <div style={metricLabelStyle}>Worst Night</div>
          </div>
        </div>
      </div>

      <SleepStages
        deep={today.sleep.deepSleepSeconds}
        rem={today.sleep.remSleepSeconds}
        light={today.sleep.lightSleepSeconds}
        awake={today.sleep.awakeSeconds}
      />

      <BarChart data={output.days.map(d => ({ day: d.day, value: d.sleep.score }))} label="Sleep Score Trend" color="#8b5cf6" unit="" />
      <BarChart data={output.days.map(d => ({ day: d.day, value: Math.round(d.sleep.totalSleepSeconds / 36) / 100 }))} label="Total Sleep (hours)" color="#60a5fa" unit="h" />
      <BarChart data={output.days.map(d => ({ day: d.day, value: d.sleep.avgHrvMs }))} label="HRV Trend" color="#10b981" unit="ms" />
      <SleepDebtChart data={output.sleepDebt} cumulative={output.cumulativeDebt} />
    </div>
  );
}

export default SleepAnalysis;
mountWidget(<SleepAnalysis />);

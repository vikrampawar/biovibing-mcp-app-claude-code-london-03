import { mountWidget } from "skybridge/web";
import { useToolInfo, useSendFollowUpMessage } from "../helpers.js";
import { ScoreRing, BarChart, InsightsPanel, ActionButtons } from "../components.js";

const dashboardStyle: React.CSSProperties = {
  fontFamily: "'Inter', sans-serif", color: "#e2e8f0", background: "#0f1117",
  padding: "1.25rem", minHeight: "100%", display: "flex", flexDirection: "column", gap: "1rem", margin: 0, boxSizing: "border-box",
};
const headerStyle: React.CSSProperties = { display: "flex", alignItems: "baseline", gap: "0.75rem" };
const chartCardStyle: React.CSSProperties = { background: "#1a1d2e", borderRadius: 10, padding: "0.875rem" };
const chartLabelStyle: React.CSSProperties = { fontSize: "0.8rem", fontWeight: 600, color: "#94a3b8", marginBottom: "0.75rem", display: "flex", justifyContent: "space-between", alignItems: "center" };

function FactorBar({ label, score, color }: { label: string; score: number; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.375rem 0" }}>
      <span style={{ fontSize: "0.75rem", color: "#94a3b8", width: "6rem" }}>{label}</span>
      <div style={{ flex: 1, height: 12, background: "#0f1117", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ height: "100%", borderRadius: 4, transition: "width 0.5s ease", width: `${score}%`, backgroundColor: color }} />
      </div>
      <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#cbd5e1", width: "2rem", textAlign: "right" }}>{score}</span>
    </div>
  );
}

function ReadinessCheck() {
  const { output } = useToolInfo<"readiness-check">();
  const sendFollowUp = useSendFollowUpMessage();

  if (!output) {
    return <div style={{ ...dashboardStyle, alignItems: "center", justifyContent: "center" }}><div style={{ color: "#64748b", fontSize: "0.875rem" }}>Checking readiness...</div></div>;
  }

  const today = output.days[output.days.length - 1];
  const r = today.readiness;
  const scoreColor = r.score >= 75 ? "#10b981" : r.score >= 50 ? "#f59e0b" : "#ef4444";
  const advice = r.score >= 75 ? "Good to go — your body is recovered" : r.score >= 50 ? "Take it easy — moderate activity recommended" : "Rest day — your body needs recovery";

  return (
    <div style={dashboardStyle}>
      <InsightsPanel insights={(output as any).insights} />
      <ActionButtons onAsk={(msg) => sendFollowUp(msg)} />
      <div style={headerStyle}>
        <h1 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#f1f5f9", margin: 0 }}>Readiness & Recovery</h1>
        <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Oura Ring · {today.day}</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "1rem", justifyContent: "center" }}>
        <ScoreRing score={r.score} label="Readiness" color={scoreColor} size={120} />
      </div>

      <div style={chartCardStyle}>
        <div style={{ fontSize: "0.875rem", fontWeight: 600, textAlign: "center", padding: "0.5rem", color: scoreColor }}>{advice}</div>
      </div>

      <div style={chartCardStyle}>
        <div style={chartLabelStyle}>Contributing Factors</div>
        <FactorBar label="HRV Balance" score={r.hrvBalanceScore} color="#8b5cf6" />
        <FactorBar label="Resting HR" score={r.restingHrScore} color="#ef4444" />
        <FactorBar label="Sleep Balance" score={r.sleepBalanceScore} color="#60a5fa" />
        <FactorBar label="Activity Balance" score={r.activityBalanceScore} color="#10b981" />
      </div>

      <div style={chartCardStyle}>
        <div style={chartLabelStyle}>Temperature</div>
        <div style={{ textAlign: "center", padding: "0.5rem" }}>
          <span style={{ fontSize: "2rem", fontWeight: 700, color: Math.abs(r.tempDeviationC) > 0.5 ? "#f59e0b" : "#94a3b8" }}>
            {r.tempDeviationC > 0 ? "+" : ""}{r.tempDeviationC}&deg;C
          </span>
          <span style={{ display: "block", fontSize: "0.7rem", color: "#64748b", marginTop: "0.25rem" }}>deviation from baseline</span>
        </div>
      </div>

      <BarChart data={output.days.map(d => ({ day: d.day, value: d.readiness.score }))} label="Readiness Trend" color="#10b981" unit="" />
      <BarChart data={output.days.map(d => ({ day: d.day, value: d.readiness.tempDeviationC }))} label="Temperature Deviation" color="#f59e0b" unit="°" />
    </div>
  );
}

export default ReadinessCheck;
mountWidget(<ReadinessCheck />);

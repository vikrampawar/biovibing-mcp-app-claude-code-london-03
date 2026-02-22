import "@/index.css";
import { mountWidget } from "skybridge/web";
import { useToolInfo, useSendFollowUpMessage } from "../helpers.js";
import { ScoreRing, BarChart, InsightsPanel, ActionButtons } from "../components.js";

function FactorBar({ label, score, color }: { label: string; score: number; color: string }) {
  return (
    <div className="factor-row">
      <span className="factor-label">{label}</span>
      <div className="factor-track">
        <div className="factor-fill" style={{ width: `${score}%`, backgroundColor: color }} />
      </div>
      <span className="factor-score">{score}</span>
    </div>
  );
}

function ReadinessCheck() {
  const { output } = useToolInfo<"readiness-check">();
  const sendFollowUp = useSendFollowUpMessage();

  if (!output) {
    return <div className="dashboard loading"><div className="loading-text">Checking readiness...</div></div>;
  }

  const today = output.days[output.days.length - 1];
  const r = today.readiness;
  const scoreColor = r.score >= 75 ? "#10b981" : r.score >= 50 ? "#f59e0b" : "#ef4444";
  const advice = r.score >= 75 ? "Good to go — your body is recovered" : r.score >= 50 ? "Take it easy — moderate activity recommended" : "Rest day — your body needs recovery";

  return (
    <div className="dashboard">
      <InsightsPanel insights={(output as any).insights} />
      <ActionButtons onAsk={(msg) => sendFollowUp(msg)} />
      <div className="header">
        <h1>Readiness & Recovery</h1>
        <span className="subtitle">Oura Ring · {today.day}</span>
      </div>

      <div className="scores-row" style={{ justifyContent: "center" }}>
        <ScoreRing score={r.score} label="Readiness" color={scoreColor} size={120} />
      </div>

      <div className="chart-card">
        <div className="advice-text" style={{ color: scoreColor }}>{advice}</div>
      </div>

      <div className="chart-card">
        <div className="chart-label">Contributing Factors</div>
        <FactorBar label="HRV Balance" score={r.hrvBalanceScore} color="#8b5cf6" />
        <FactorBar label="Resting HR" score={r.restingHrScore} color="#ef4444" />
        <FactorBar label="Sleep Balance" score={r.sleepBalanceScore} color="#60a5fa" />
        <FactorBar label="Activity Balance" score={r.activityBalanceScore} color="#10b981" />
      </div>

      <div className="chart-card">
        <div className="chart-label">Temperature</div>
        <div className="temp-display">
          <span className="temp-value" style={{ color: Math.abs(r.tempDeviationC) > 0.5 ? "#f59e0b" : "#94a3b8" }}>
            {r.tempDeviationC > 0 ? "+" : ""}{r.tempDeviationC}&deg;C
          </span>
          <span className="temp-note">deviation from baseline</span>
        </div>
      </div>

      <BarChart
        data={output.days.map(d => ({ day: d.day, value: d.readiness.score }))}
        label="Readiness Trend"
        color="#10b981"
        unit=""
      />

      <BarChart
        data={output.days.map(d => ({ day: d.day, value: d.readiness.tempDeviationC }))}
        label="Temperature Deviation"
        color="#f59e0b"
        unit="°"
      />
    </div>
  );
}

export default ReadinessCheck;
mountWidget(<ReadinessCheck />);

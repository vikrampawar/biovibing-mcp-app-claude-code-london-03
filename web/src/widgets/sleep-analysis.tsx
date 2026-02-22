import "@/index.css";
import { mountWidget } from "skybridge/web";
import { useToolInfo, useSendFollowUpMessage } from "../helpers.js";
import { ScoreRing, BarChart, SleepStages, SleepDebtChart, InsightsPanel, ActionButtons } from "../components.js";

function SleepAnalysis() {
  const { output } = useToolInfo<"sleep-analysis">();
  const sendFollowUp = useSendFollowUpMessage();

  if (!output) {
    return <div className="dashboard loading"><div className="loading-text">Analysing sleep...</div></div>;
  }

  const today = output.days[output.days.length - 1];

  return (
    <div className="dashboard">
      <div className="header">
        <h1>Sleep Analysis</h1>
        <span className="subtitle">{output.days.length} days · Best: {output.bestNight.day} ({output.bestNight.score})</span>
      </div>

      <InsightsPanel insights={(output as any).insights} />
      <ActionButtons onAsk={(msg) => sendFollowUp(msg)} />

      <div className="scores-row">
        <ScoreRing score={today.sleep.score} label="Tonight" color="#8b5cf6" />
        <ScoreRing score={Math.round(output.days.reduce((s, d) => s + d.sleep.score, 0) / output.days.length)} label="Average" color="#6366f1" size={80} />
        <div className="metric-cards">
          <div className="metric-card">
            <div className="metric-value">{(today.sleep.totalSleepSeconds / 3600).toFixed(1)}h</div>
            <div className="metric-label">Total Sleep</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">{today.sleep.efficiency}%</div>
            <div className="metric-label">Efficiency</div>
          </div>
          <div className="metric-card highlight-good">
            <div className="metric-value">{output.bestNight.score}</div>
            <div className="metric-label">Best Night</div>
          </div>
          <div className="metric-card highlight-bad">
            <div className="metric-value">{output.worstNight.score}</div>
            <div className="metric-label">Worst Night</div>
          </div>
        </div>
      </div>

      <SleepStages
        deep={today.sleep.deepSleepSeconds}
        rem={today.sleep.remSleepSeconds}
        light={today.sleep.lightSleepSeconds}
        awake={today.sleep.awakeSeconds}
      />

      <BarChart
        data={output.days.map(d => ({ day: d.day, value: d.sleep.score }))}
        label="Sleep Score Trend"
        color="#8b5cf6"
        unit=""
      />

      <BarChart
        data={output.days.map(d => ({ day: d.day, value: Math.round(d.sleep.totalSleepSeconds / 36) / 100 }))}
        label="Total Sleep (hours)"
        color="#60a5fa"
        unit="h"
      />

      <BarChart
        data={output.days.map(d => ({ day: d.day, value: d.sleep.avgHrvMs }))}
        label="HRV Trend"
        color="#10b981"
        unit="ms"
      />

      <SleepDebtChart data={output.sleepDebt} cumulative={output.cumulativeDebt} />
    </div>
  );
}

export default SleepAnalysis;
mountWidget(<SleepAnalysis />);

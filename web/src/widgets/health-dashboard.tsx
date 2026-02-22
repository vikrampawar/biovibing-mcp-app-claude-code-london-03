import "@/index.css";
import { mountWidget } from "skybridge/web";
import { useToolInfo, useSendFollowUpMessage } from "../helpers.js";
import { ScoreRing, SleepStages, SleepDebtChart, MetricCard, BarChart, InsightsPanel, ActionButtons } from "../components.js";

function avg(arr: number[]) {
  return arr.length ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : 0;
}

function HealthDashboard() {
  const { output } = useToolInfo<"health-dashboard">();
  const sendFollowUp = useSendFollowUpMessage();

  if (!output) {
    return <div className="dashboard loading"><div className="loading-text">Loading...</div></div>;
  }

  const days = output.days as any[];
  const numDays = output.numDays as number;
  const today = days[days.length - 1];
  const yesterday = days.length > 1 ? days[days.length - 2] : null;
  const insights = (output as any).insights as string[];

  const periodAvg = {
    sleepScore: avg(days.map(d => d.sleep.score)),
    readinessScore: avg(days.map(d => d.readiness.score)),
    hrv: avg(days.map(d => d.sleep.avgHrvMs)),
    rhr: avg(days.map(d => d.sleep.avgRestingHrBpm)),
    steps: Math.round(avg(days.map(d => d.activity.steps))),
    temp: avg(days.map(d => d.readiness.tempDeviationC)),
  };

  return (
    <div className="dashboard">
      <div className="header">
        <h1>Health Overview</h1>
        <span className="subtitle">Oura Ring · {numDays} days</span>
      </div>

      <InsightsPanel insights={insights} />

      <ActionButtons onAsk={(msg) => sendFollowUp(msg)} />

      {/* Today */}
      <div className="section-label">Today · {today.day}</div>
      <div className="scores-row">
        <ScoreRing score={today.sleep.score} label="Sleep" color="#8b5cf6" />
        <ScoreRing score={today.readiness.score} label="Readiness" color="#10b981" />
        <div className="metric-cards">
          <MetricCard value={today.sleep.avgHrvMs} label="HRV (ms)" />
          <MetricCard value={today.sleep.avgRestingHrBpm} label="RHR (bpm)" />
          <MetricCard value={today.activity.steps.toLocaleString()} label="Steps" />
          <MetricCard value={`${today.readiness.tempDeviationC > 0 ? "+" : ""}${today.readiness.tempDeviationC}\u00B0`} label="Temp" />
        </div>
      </div>

      <SleepStages
        deep={today.sleep.deepSleepSeconds}
        rem={today.sleep.remSleepSeconds}
        light={today.sleep.lightSleepSeconds}
        awake={today.sleep.awakeSeconds}
      />

      {/* Yesterday */}
      {yesterday && (
        <>
          <div className="section-label">Yesterday · {yesterday.day}</div>
          <div className="scores-row">
            <ScoreRing score={yesterday.sleep.score} label="Sleep" color="#7c3aed" size={80} />
            <ScoreRing score={yesterday.readiness.score} label="Readiness" color="#059669" size={80} />
            <div className="metric-cards">
              <MetricCard value={yesterday.sleep.avgHrvMs} label="HRV" />
              <MetricCard value={yesterday.sleep.avgRestingHrBpm} label="RHR" />
              <MetricCard value={yesterday.activity.steps.toLocaleString()} label="Steps" />
              <MetricCard value={`${yesterday.readiness.tempDeviationC > 0 ? "+" : ""}${yesterday.readiness.tempDeviationC}\u00B0`} label="Temp" />
            </div>
          </div>
        </>
      )}

      {/* Period average */}
      {numDays > 2 && (
        <>
          <div className="section-label">{numDays}-Day Average</div>
          <div className="scores-row">
            <ScoreRing score={Math.round(periodAvg.sleepScore)} label="Sleep" color="#a78bfa" size={80} />
            <ScoreRing score={Math.round(periodAvg.readinessScore)} label="Readiness" color="#34d399" size={80} />
            <div className="metric-cards">
              <MetricCard value={periodAvg.hrv} label="HRV" />
              <MetricCard value={periodAvg.rhr} label="RHR" />
              <MetricCard value={periodAvg.steps.toLocaleString()} label="Steps" />
              <MetricCard value={`${periodAvg.temp > 0 ? "+" : ""}${periodAvg.temp}\u00B0`} label="Temp" />
            </div>
          </div>
        </>
      )}

      <SleepDebtChart data={output.sleepDebt} cumulative={output.cumulativeDebt} />

      <BarChart data={days.map((d: any) => ({ day: d.day, value: d.sleep.score }))} label="Sleep Score" color="#8b5cf6" unit="" />
      <BarChart data={days.map((d: any) => ({ day: d.day, value: d.readiness.score }))} label="Readiness" color="#10b981" unit="" />
      <BarChart data={days.map((d: any) => ({ day: d.day, value: d.sleep.avgHrvMs }))} label="HRV" color="#60a5fa" unit="ms" />
    </div>
  );
}

export default HealthDashboard;
mountWidget(<HealthDashboard />);

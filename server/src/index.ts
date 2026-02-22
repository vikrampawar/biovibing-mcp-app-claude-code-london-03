import { McpServer } from "skybridge/server";
import { z } from "zod";

// --- Mock Oura data generator ---

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

function generateDayData(dateStr: string) {
  // Seed from date string so same date always gives same data
  const seed = dateStr.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) * 31;
  const rng = seededRandom(seed);
  const r = (min: number, max: number) => Math.round((rng() * (max - min) + min) * 10) / 10;

  const deepSleep = r(3600, 7200);
  const remSleep = r(3600, 7200);
  const lightSleep = r(7200, 14400);
  const awakeSleep = r(600, 3600);
  const totalSleep = deepSleep + remSleep + lightSleep;
  const efficiency = r(75, 98);
  const sleepScore = Math.round(r(55, 95));
  const readinessScore = Math.round(r(50, 95));
  const hrv = r(20, 80);
  const restingHr = r(48, 72);
  const steps = Math.round(r(3000, 15000));
  const calories = Math.round(r(1800, 3200));
  const tempDeviation = r(-0.5, 0.8);
  const spo2 = r(95, 99);
  const breathingDisturbance = r(0, 3);
  const stressHigh = Math.round(r(10, 120));
  const recoveryHigh = Math.round(r(60, 300));

  return {
    day: dateStr,
    sleep: {
      score: sleepScore,
      deepSleepSeconds: Math.round(deepSleep),
      remSleepSeconds: Math.round(remSleep),
      lightSleepSeconds: Math.round(lightSleep),
      awakeSeconds: Math.round(awakeSleep),
      totalSleepSeconds: Math.round(totalSleep),
      efficiency,
      avgHrvMs: hrv,
      avgRestingHrBpm: restingHr,
    },
    readiness: {
      score: readinessScore,
      tempDeviationC: tempDeviation,
      hrvBalanceScore: Math.round(r(60, 95)),
      restingHrScore: Math.round(r(60, 95)),
      sleepBalanceScore: Math.round(r(60, 95)),
      activityBalanceScore: Math.round(r(60, 95)),
    },
    activity: {
      steps,
      totalCalories: calories,
    },
    spo2: {
      avgPct: spo2,
      breathingDisturbanceIndex: breathingDisturbance,
    },
    stress: {
      highMinutes: stressHigh,
      recoveryMinutes: recoveryHigh,
    },
  };
}

function generateDaysData(numDays: number, endDate: Date = new Date()) {
  const days = [];
  for (let i = numDays - 1; i >= 0; i--) {
    const d = new Date(endDate);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    days.push(generateDayData(dateStr));
  }
  return days;
}

function computeSleepDebt(
  days: ReturnType<typeof generateDayData>[],
  targetHours = 7.5,
) {
  return days.map((d) => {
    const sleptHours = d.sleep.totalSleepSeconds / 3600;
    return {
      day: d.day,
      sleptHours: Math.round(sleptHours * 10) / 10,
      debtHours: Math.round((targetHours - sleptHours) * 10) / 10,
    };
  });
}

const avg = (arr: number[]) =>
  arr.length ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : 0;

// --- Insights engine ---

type DayData = ReturnType<typeof generateDayData>;

function generateInsights(days: DayData[]): string[] {
  const insights: string[] = [];
  if (days.length < 2) return insights;

  const recent = days.slice(-7);
  const today = days[days.length - 1];
  const yesterday = days.length > 1 ? days[days.length - 2] : null;

  // Sleep debt
  const weekDebt = recent.reduce((sum, d) => sum + (7.5 - d.sleep.totalSleepSeconds / 3600), 0);
  if (weekDebt > 5) {
    insights.push(`You've accumulated ${Math.round(weekDebt)}h of sleep debt this week. Prioritise an early bedtime tonight.`);
  } else if (weekDebt < -2) {
    insights.push(`Great sleep surplus of ${Math.abs(Math.round(weekDebt))}h this week. Your body is well-rested.`);
  }

  // HRV trend (last 5 days)
  if (days.length >= 5) {
    const last5 = days.slice(-5).map(d => d.sleep.avgHrvMs);
    const trending = last5.every((v, i) => i === 0 || v <= last5[i - 1]);
    const trendingUp = last5.every((v, i) => i === 0 || v >= last5[i - 1]);
    if (trending && last5[4] < last5[0] - 5) {
      insights.push(`HRV has been declining for 5 days (${last5[0]}→${last5[4]}ms). Consider a rest day or lighter training.`);
    }
    if (trendingUp && last5[4] > last5[0] + 5) {
      insights.push(`HRV trending up for 5 days (${last5[0]}→${last5[4]}ms). Your recovery is improving.`);
    }
  }

  // Readiness
  if (today.readiness.score < 60) {
    insights.push(`Low readiness today (${today.readiness.score}). Your body is signalling it needs recovery — go easy.`);
  } else if (today.readiness.score >= 85) {
    insights.push(`Excellent readiness (${today.readiness.score}). Great day for a challenging workout.`);
  }

  // Temperature
  if (Math.abs(today.readiness.tempDeviationC) > 0.5) {
    insights.push(`Body temperature is ${today.readiness.tempDeviationC > 0 ? "elevated" : "low"} (${today.readiness.tempDeviationC > 0 ? "+" : ""}${today.readiness.tempDeviationC}°C). Monitor for illness or overtraining.`);
  }

  // Sleep consistency
  if (recent.length >= 5) {
    const sleepHours = recent.map(d => d.sleep.totalSleepSeconds / 3600);
    const mean = sleepHours.reduce((a, b) => a + b, 0) / sleepHours.length;
    const variance = sleepHours.reduce((sum, h) => sum + Math.pow(h - mean, 2), 0) / sleepHours.length;
    const sd = Math.sqrt(variance);
    if (sd > 1.5) {
      insights.push(`Your sleep schedule is erratic (±${sd.toFixed(1)}h variation). Consistency matters more than one good night.`);
    }
  }

  // Resting HR spike
  if (yesterday && today.sleep.avgRestingHrBpm > yesterday.sleep.avgRestingHrBpm + 5) {
    insights.push(`Resting HR jumped +${(today.sleep.avgRestingHrBpm - yesterday.sleep.avgRestingHrBpm).toFixed(0)}bpm from yesterday. Could indicate stress, alcohol, or coming illness.`);
  }

  // Deep sleep
  const deepPct = today.sleep.deepSleepSeconds / today.sleep.totalSleepSeconds * 100;
  if (deepPct < 15) {
    insights.push(`Low deep sleep (${deepPct.toFixed(0)}% of total). Try avoiding screens and caffeine before bed.`);
  } else if (deepPct > 25) {
    insights.push(`Great deep sleep ratio (${deepPct.toFixed(0)}%). This is where physical recovery happens.`);
  }

  // Steps
  const avgSteps = avg(recent.map(d => d.activity.steps));
  if (avgSteps < 5000) {
    insights.push(`Averaging only ${Math.round(avgSteps).toLocaleString()} steps/day. Try to hit 7,000+ for cardiovascular health.`);
  }

  // Stress balance
  if (today.stress.highMinutes > today.stress.recoveryMinutes) {
    insights.push(`More stress than recovery today (${today.stress.highMinutes}min vs ${today.stress.recoveryMinutes}min). Find time to wind down.`);
  }

  return insights.slice(0, 4); // max 4 insights
}

// --- MCP Server ---

const server = new McpServer(
  { name: "bio-dashboard", version: "1.0.0" },
  { capabilities: {} },
)

  // --- Tool 1: Overview dashboard ---
  .registerWidget(
    "health-dashboard",
    { description: "Health Overview Dashboard" },
    {
      description:
        "Shows a visual health overview with today's scores and key metrics. Use when the user asks about their overall health, general status, or wants a summary.",
      inputSchema: {
        days: z.number().optional().describe("Number of days to show (default 7, max 365)"),
      },
    },
    async ({ days }) => {
      const numDays = Math.min(days ?? 7, 365);
      const data = generateDaysData(numDays);
      const today = data[data.length - 1];
      const sleepDebt = computeSleepDebt(data);
      const cumulativeDebt = sleepDebt.reduce((sum, d) => sum + d.debtHours, 0);

      return {
        content: [{ type: "text", text: `Today: Sleep ${today.sleep.score}/100, Readiness ${today.readiness.score}/100, HRV ${today.sleep.avgHrvMs}ms, RHR ${today.sleep.avgRestingHrBpm}bpm, Steps ${today.activity.steps}, Sleep debt ${Math.round(cumulativeDebt * 10) / 10}h (${numDays} days)` }],
        structuredContent: { today, days: data, sleepDebt, cumulativeDebt: Math.round(cumulativeDebt * 10) / 10, numDays, insights: generateInsights(data) },
        isError: false,
      };
    },
  )

  // --- Tool 2: Sleep analysis ---
  .registerWidget(
    "sleep-analysis",
    { description: "Sleep Analysis" },
    {
      description:
        "Shows detailed sleep analysis: stages breakdown, sleep score trends, efficiency, HRV and resting HR over time. Use when the user asks about sleep, sleep quality, sleep stages, deep sleep, REM, or how they slept.",
      inputSchema: {
        days: z.number().optional().describe("Number of days to analyse (default 7, max 365)"),
      },
    },
    async ({ days }) => {
      const numDays = Math.min(days ?? 7, 365);
      const data = generateDaysData(numDays);
      const sleepDebt = computeSleepDebt(data);
      const cumulativeDebt = sleepDebt.reduce((sum, d) => sum + d.debtHours, 0);

      const bestNight = data.reduce((best, d) => d.sleep.score > best.sleep.score ? d : best, data[0]);
      const worstNight = data.reduce((worst, d) => d.sleep.score < worst.sleep.score ? d : worst, data[0]);

      return {
        content: [{ type: "text", text: `Sleep analysis (${numDays} days): Avg score ${avg(data.map(d => d.sleep.score))}, Best ${bestNight.day} (${bestNight.sleep.score}), Worst ${worstNight.day} (${worstNight.sleep.score}), Debt ${Math.round(cumulativeDebt * 10) / 10}h` }],
        structuredContent: {
          days: data,
          sleepDebt,
          cumulativeDebt: Math.round(cumulativeDebt * 10) / 10,
          bestNight: { day: bestNight.day, score: bestNight.sleep.score },
          worstNight: { day: worstNight.day, score: worstNight.sleep.score },
          insights: generateInsights(data),
        },
        isError: false,
      };
    },
  )

  // --- Tool 3: Readiness & Recovery ---
  .registerWidget(
    "readiness-check",
    { description: "Readiness & Recovery" },
    {
      description:
        "Shows readiness score breakdown with contributing factors: HRV balance, resting HR, sleep balance, activity balance, and temperature deviation. Use when the user asks about readiness, recovery, whether they should train, or body temperature.",
      inputSchema: {
        days: z.number().optional().describe("Number of days to show (default 7, max 365)"),
      },
    },
    async ({ days }) => {
      const numDays = Math.min(days ?? 7, 365);
      const data = generateDaysData(numDays);
      const today = data[data.length - 1];

      return {
        content: [{ type: "text", text: `Readiness: ${today.readiness.score}/100. HRV balance ${today.readiness.hrvBalanceScore}, RHR score ${today.readiness.restingHrScore}, Sleep balance ${today.readiness.sleepBalanceScore}, Activity balance ${today.readiness.activityBalanceScore}, Temp ${today.readiness.tempDeviationC > 0 ? "+" : ""}${today.readiness.tempDeviationC}°C` }],
        structuredContent: { days: data, insights: generateInsights(data) },
        isError: false,
      };
    },
  )

  // --- Tool 4: Weekly report ---
  .registerWidget(
    "weekly-report",
    { description: "Weekly Comparison Report" },
    {
      description:
        "Compares this week vs last week across all metrics: sleep, readiness, HRV, resting HR, steps, and calories. Use when the user asks for a weekly report, week-over-week comparison, trends, or progress.",
      inputSchema: {},
    },
    async () => {
      const thisWeek = generateDaysData(7);
      const lastWeekEnd = new Date();
      lastWeekEnd.setDate(lastWeekEnd.getDate() - 7);
      const lastWeek = generateDaysData(7, lastWeekEnd);

      const comparison = {
        sleepScore: { thisWeek: avg(thisWeek.map(d => d.sleep.score)), lastWeek: avg(lastWeek.map(d => d.sleep.score)) },
        readiness: { thisWeek: avg(thisWeek.map(d => d.readiness.score)), lastWeek: avg(lastWeek.map(d => d.readiness.score)) },
        hrv: { thisWeek: avg(thisWeek.map(d => d.sleep.avgHrvMs)), lastWeek: avg(lastWeek.map(d => d.sleep.avgHrvMs)) },
        restingHr: { thisWeek: avg(thisWeek.map(d => d.sleep.avgRestingHrBpm)), lastWeek: avg(lastWeek.map(d => d.sleep.avgRestingHrBpm)) },
        steps: { thisWeek: avg(thisWeek.map(d => d.activity.steps)), lastWeek: avg(lastWeek.map(d => d.activity.steps)) },
        calories: { thisWeek: avg(thisWeek.map(d => d.activity.totalCalories)), lastWeek: avg(lastWeek.map(d => d.activity.totalCalories)) },
        stress: { thisWeek: avg(thisWeek.map(d => d.stress.highMinutes)), lastWeek: avg(lastWeek.map(d => d.stress.highMinutes)) },
      };

      return {
        content: [{ type: "text", text: `Weekly comparison: Sleep ${comparison.sleepScore.lastWeek} → ${comparison.sleepScore.thisWeek}, Readiness ${comparison.readiness.lastWeek} → ${comparison.readiness.thisWeek}, HRV ${comparison.hrv.lastWeek} → ${comparison.hrv.thisWeek}ms` }],
        structuredContent: { thisWeek, lastWeek, comparison, insights: generateInsights([...lastWeek, ...thisWeek]) },
        isError: false,
      };
    },
  )

  // --- Tool 5: Activity & Steps ---
  .registerWidget(
    "activity-tracker",
    { description: "Activity & Steps Tracker" },
    {
      description:
        "Shows activity data: daily steps, calories burned, and stress vs recovery balance. Use when the user asks about steps, activity, calories, exercise, stress levels, or how active they have been.",
      inputSchema: {
        days: z.number().optional().describe("Number of days to show (default 7, max 365)"),
      },
    },
    async ({ days }) => {
      const numDays = Math.min(days ?? 7, 365);
      const data = generateDaysData(numDays);
      const totalSteps = data.reduce((sum, d) => sum + d.activity.steps, 0);
      const totalCal = data.reduce((sum, d) => sum + d.activity.totalCalories, 0);

      return {
        content: [{ type: "text", text: `Activity (${numDays} days): Total steps ${totalSteps.toLocaleString()}, Avg ${avg(data.map(d => d.activity.steps)).toLocaleString()}/day, Total calories ${totalCal.toLocaleString()}` }],
        structuredContent: { days: data, insights: generateInsights(data) },
        isError: false,
      };
    },
  );

server.run();

export type AppType = typeof server;

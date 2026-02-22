# BioVibing - MCP Health Dashboard

## Architecture

This is a Skybridge MCP App with a server (tools + data) and web (React widgets).

### Server (`server/src/index.ts`)
- 5 registered widgets, each with a tool handler that generates mock Oura Ring data
- `generateDayData(dateStr)` — deterministic data seeded by date string
- `generateInsights(days)` — analyses data for coach-style observations
- All tools accept a `days` parameter (1-365) except `weekly-report` which always uses 14 days

### Web (`web/src/`)
- `components.tsx` — shared components with inline styles for Claude.ai iframe compatibility
- `helpers.ts` — typed Skybridge hooks (`useToolInfo`, `useSendFollowUpMessage`)
- Each widget file in `widgets/` must match the tool name in kebab-case

### Key patterns
- Use inline styles for any styling that must render in Claude.ai's widget iframe
- CSS classes work in Skybridge DevTools but may be stripped in Claude.ai
- Charts auto-aggregate: daily ≤14d, weekly avg 15-90d, monthly avg 91-365d

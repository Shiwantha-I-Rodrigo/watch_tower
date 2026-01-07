export interface EventTrendPoint {
  time: string;
  events: number;
}

export interface SeverityCount {
  [key: string]: string | number;
  name: string;
  value: number;
}

export interface SourceCount {
  source: string;
  count: number;
}

export interface Alert {
  id: number;
  timestamp: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  source: string;
  message: string;
}

export const eventTrend: EventTrendPoint[] = [
  { time: "10:00", events: 120 },
  { time: "11:00", events: 300 },
  { time: "12:00", events: 180 },
  { time: "13:00", events: 420 },
  { time: "14:00", events: 260 },
];

export const severityData: SeverityCount[] = [
  { name: "Low", value: 400 },
  { name: "Medium", value: 300 },
  { name: "High", value: 180 },
  { name: "Critical", value: 40 },
];

export const topSources: SourceCount[] = [
  { source: "Firewall", count: 520 },
  { source: "EDR", count: 410 },
  { source: "IAM", count: 260 },
  { source: "Web Proxy", count: 190 },
];

export const alerts: Alert[] = [
  {
    id: 1,
    timestamp: "2026-01-07 14:22",
    severity: "Critical",
    source: "Firewall",
    message: "Multiple blocked outbound connections",
  },
  {
    id: 2,
    timestamp: "2026-01-07 14:20",
    severity: "High",
    source: "EDR",
    message: "Suspicious PowerShell execution",
  },
];

import { useQuery } from "@tanstack/react-query";

const PAGE_LIMIT = 8;

type RuleCondition = {
    id: number;
    rule_id: number;
    field: string;
    operator: string;
    value: string;
};

type Rule = {
    id: number;
    name: string;
    description: string;
    severity: string;
    enabled: boolean;
    conditions: RuleCondition[];
};

type Asset = {
    id: number;
    name: string;
    asset_type: string;
    ip_address: string;
    hostname: string;
    environment: string;
};

type Event = {
    id: number;
    event_type: string;
    severity: string;
    message: string;
    timestamp: string;
    asset: Asset;
};

type Alert = {
    id: number;
    severity: string;
    status: string;
    created_at: string;
    rule?: Rule | null;
    event?: Event | null;
};

// fetch alerts
export function AlertTable() {
  const { data: alerts = [], isLoading, error } = useQuery<Alert[]>({
    queryKey: ["alerts"],
    queryFn: async () => {
      const res = await fetch(
        `http://127.0.0.1:8000/alerts/?skip=0&limit=${PAGE_LIMIT}`
      );
      if (!res.ok) throw new Error("Failed to fetch alerts");
      return res.json();
    },
    refetchInterval: 10000,
    refetchIntervalInBackground: true,
    staleTime: 0,
  });

  if (isLoading) return <div>Loading…</div>;
  if (error) return <div>Error loading alerts</div>;

  return <AlertsTable alerts={alerts} />;
}

const severityRowStyle = (severity: string): React.CSSProperties => {
  switch (severity.toLowerCase()) {
    case "critical":
      return { color: "#b91c1c", fontWeight: "600" };
    case "high":
      return { color: "#dc2626" };
    case "medium":
      return { color: "#d97706" };
    case "low":
      return { color: "#F2F7FA" };
    default:
      return { color: "#F2F7FA" };
  }
};

export const AlertsTable = ({ alerts }: { alerts: Alert[] }) => (
  <table style={{ width: "100%", borderCollapse: "collapse" }}>
    <thead>
      <tr>
        <th>Time</th>
        <th>Severity</th>
        <th>Status</th>
        <th>Source</th>
        <th>Message</th>
      </tr>
    </thead>
    <tbody>
      {alerts.map(alert => (
        <tr key={alert.id} style={severityRowStyle(alert.severity)}>
          <td>{alert.created_at}</td>
          <td>{alert.severity}</td>
          <td>{alert.status}</td>
          <td>{alert.event?.asset.hostname} - {alert.event?.asset.ip_address}</td>
          <td>{alert.event?.message}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

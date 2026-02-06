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

type Incident = {
    id: number;
    title: string;
    description: string;
    status: string;
    severity: string;
    created_at: string;
    alerts: Alert[];
};

// fetch incidents
export function IncidentsTable() {
  const { data: incidents = [], isLoading, error } = useQuery<Incident[]>({
    queryKey: ["incidents"],
    queryFn: async () => {
      const res = await fetch(
        `http://127.0.0.1:8000/incidents/?skip=0&limit=${PAGE_LIMIT}`
      );
      if (!res.ok) throw new Error("Failed to fetch incidents");
      return res.json();
    },
    refetchInterval: 10000,
    refetchIntervalInBackground: true,
    staleTime: 0,
  });

  if (isLoading) return <div>Loading…</div>;
  if (error) return <div>Error loading incidents</div>;

  return <IncidentTable incidents={incidents} />;
}

const severityRowStyle = (severity: string): React.CSSProperties => {
  switch (severity.toLowerCase()) {
    case "1":
      return { color: "#ff0000ff", fontWeight: "600" };
    case "2":
      return { color: "#e62323ff", fontWeight: "600"  };
    case "3":
      return { color: "#fc9d59ff" };
    case "4":
      return { color: "#f5ce59ff" };
    case "5":
      return { color: "#f7f3eaff" };
    default:
      return { color: "#ffffffff" };
  }
};

export const IncidentTable = ({ incidents }: { incidents: Incident[] }) => (
  <table style={{ width: "100%", borderCollapse: "collapse" }}>
    <thead>
      <tr>
        <th>Time</th>
        <th>Rule</th>
        <th>Severity</th>
        <th>Status</th>
        <th>Alerts</th>
      </tr>
    </thead>
    <tbody>
      {incidents.map(incident => (
        <tr key={incident.id} style={severityRowStyle(incident.severity)}>
          <td>{incident.created_at}</td>
          <td>{incident.title}</td>
          <td>{incident.severity}</td>
          <td>{incident.status}</td>
          <td>{incident.alerts?.length ?? 0}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Label } from "recharts";
import { useQuery } from "@tanstack/react-query";

export interface AlertSeverityCountInterface {
  [key: string]: string | number;
  name: string;
  value: number;
}

type AlertSeverityCount = {
  name: string;
  value: number;
};

// fetch severities
export function AlertPie() {
  const { data: severities = [], isLoading, error } = useQuery<AlertSeverityCount[]>({
    queryKey: ["alert-severity"],
    queryFn: async () => {
      const res = await fetch(
        `http://127.0.0.1:8000/alerts/severity-count`
      );
      if (!res.ok) throw new Error("Failed to fetch severity");
      return res.json();
    },
    refetchInterval: 10000,
    refetchIntervalInBackground: true,
    staleTime: 0,
  });

  if (isLoading) return <div>Loading…</div>;
  if (error) return <div>Error loading severities</div>;

  return <AlertSeverityPie data={severities} />;
}

const SEVERITY_META: Record<string,{ label: string; color: string }> = {
  "1": { label: "1-Critical", color: "#771111ff" },
  "2": { label: "2-Severe",   color: "#ad2424ff" },
  "3": { label: "3-High",     color: "#ad4e0aff" },
  "4": { label: "4-Medium",   color: "#9b7505ff" },
  "5": { label: "5-Low",      color: "#0e6b30ff" },
  "6": { label: "6-Info",     color: "#173e7eff" },
};

export const AlertSeverityPie = ({data,}: {data: AlertSeverityCountInterface[];}) => (
    <ResponsiveContainer width="100%" height={250}>
        <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" outerRadius={90} stroke="none" labelLine={false}>
                <Label value="Alert Severity" position="center" fill="#F2F7FA" style={{ fontWeight: 600 }}/>
                {data.map((entry, index) => (
                    <Cell key={index} fill={SEVERITY_META[entry.name]?.color ?? "#64748B"}/>
                ))}
            </Pie>
            <Legend layout="vertical" align="right" verticalAlign="middle" formatter={(value, entry: any) => {
                const label = SEVERITY_META[value]?.label ?? value;
                return `${label}: ${entry.payload.value}`;
            }}/>
        </PieChart>
    </ResponsiveContainer>
);

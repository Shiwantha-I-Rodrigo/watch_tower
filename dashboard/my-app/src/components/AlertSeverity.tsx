import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, Label } from "recharts";
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

const COLORS = ["#dc2626", "#d97706", "#04548c", "#F2F7FA"];

export const AlertSeverityPie = ({ data }: { data: AlertSeverityCountInterface[] }) => (
  <ResponsiveContainer width="100%" height={250}>
    <PieChart>
      <Label value="Alert Severity" position="top" fill="#F2F7FA" style={{ fontWeight: 600 }}/>
      <Pie data={data} dataKey="value" nameKey="name" outerRadius={90} stroke="none">
        {data.map((_, index) => (
          <Cell key={index} fill={COLORS[index]}/>
        ))}
      </Pie>
      <Tooltip />
      <Legend layout="vertical" align="right" verticalAlign="middle" formatter={(value, entry: any) => {const { payload } = entry;return `${value}: ${payload.value}`;}}/>
    </PieChart>
  </ResponsiveContainer>
);

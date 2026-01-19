import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useQuery } from "@tanstack/react-query";

export interface EventSeverityCountInterface {
  [key: string]: string | number;
  name: string;
  value: number;
}

type EventSeverityCount = {
  name: string;
  value: number;
};

// fetch severities
export function EventPie() {
  const { data: severities = [], isLoading, error } = useQuery<EventSeverityCount[]>({
    queryKey: ["event-severity"],
    queryFn: async () => {
      const res = await fetch(
        `http://127.0.0.1:8000/events/severity-count`
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

  return <EventSeverityPie data={severities} />;
}

const COLORS = ["#4caf50", "#ff9800", "#f44336", "#9c27b0"];

export const EventSeverityPie = ({ data }: { data: EventSeverityCountInterface[] }) => (
  <ResponsiveContainer width="100%" height={250}>
    <PieChart>
      <Pie data={data} dataKey="value" nameKey="name" outerRadius={90}>
        {data.map((_, index) => (
          <Cell key={index} fill={COLORS[index]} />
        ))}
      </Pie>
      <Tooltip />
      <Legend layout="vertical" align="right" verticalAlign="middle"/>
    </PieChart>
  </ResponsiveContainer>
);

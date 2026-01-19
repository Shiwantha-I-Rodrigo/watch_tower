import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useQuery } from "@tanstack/react-query";

export interface EventGraph {
  time: string;
  events: number;
}

interface Props {
  data: EventGraph[];
}

// fetch events
export function EventGraphs() {
  const { data: events = [], isLoading, error } = useQuery<EventGraph[]>({
    queryKey: ["events"],
    queryFn: async () => {
      const res = await fetch(
        `http://127.0.0.1:8000/events/event-count`
      );
      if (!res.ok) throw new Error("Failed to fetch events");
      return res.json();
    },
    refetchInterval: 10000,
    refetchIntervalInBackground: true,
    staleTime: 0,
  });

  if (isLoading) return <div>Loading…</div>;
  if (error) return <div>Error loading events</div>;

  return <EventTrend data={events} />;
}

export const EventTrend = ({ data }: Props) => (
  <ResponsiveContainer width="100%" height={250}>
    <LineChart data={data}>
      <XAxis dataKey="time" />
      <YAxis />
      <Tooltip />
      <Line type="monotone" dataKey="events" stroke="#00bcd4" strokeWidth={2} />
    </LineChart>
  </ResponsiveContainer>
);

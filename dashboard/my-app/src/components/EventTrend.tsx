import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import type { EventTrendPoint } from "../data/mockData";

interface Props {
  data: EventTrendPoint[];
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

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import type { SourceCount } from "../data/mockData";

export const TopSources = ({ data }: { data: SourceCount[] }) => (
  <ResponsiveContainer width="100%" height={250}>
    <BarChart data={data}>
      <XAxis dataKey="source" />
      <YAxis />
      <Tooltip />
      <Bar dataKey="count" fill="#2196f3" />
    </BarChart>
  </ResponsiveContainer>
);

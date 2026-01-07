import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import type { SeverityCount } from "../data/mockData";

const COLORS = ["#4caf50", "#ff9800", "#f44336", "#9c27b0"];

export const SeverityPie = ({ data }: { data: SeverityCount[] }) => (
  <ResponsiveContainer width="100%" height={250}>
    <PieChart>
      <Pie data={data} dataKey="value" nameKey="name" outerRadius={90}>
        {data.map((_, index) => (
          <Cell key={index} fill={COLORS[index]} />
        ))}
      </Pie>
      <Tooltip />
    </PieChart>
  </ResponsiveContainer>
);

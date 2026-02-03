import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useQuery } from "@tanstack/react-query";

export interface SourceCount {
  source: string;
  count: number;
}

// fetch sources
export function AssetChart() {
  const { data: sources = [], isLoading, error } = useQuery<SourceCount[]>({
    queryKey: ["sources"],
    queryFn: async () => {
      const res = await fetch(
        `http://127.0.0.1:8000/events/source-count`
      );
      if (!res.ok) throw new Error("Failed to fetch sources");
      return res.json();
    },
    refetchInterval: 10000,
    refetchIntervalInBackground: true,
    staleTime: 0,
  });

  if (isLoading) return <div>Loading…</div>;
  if (error) return <div>Error loading sources</div>;

  return <TopSources data={sources} />;
}

export const TopSources = ({ data }: { data: SourceCount[] }) => (
  <ResponsiveContainer width="100%" height={250}>
    <BarChart data={data}>
      <XAxis dataKey="source" stroke="#04548c" tick={{ fill: "#04548c" }}/>
      <YAxis stroke="#04548c" tick={{ fill: "#04548c" }}/>
      <Tooltip />
      <Bar dataKey="count" fill="#021024" stroke="#04548c" strokeWidth={2}/>
    </BarChart>
  </ResponsiveContainer>
);

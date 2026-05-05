import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer
} from 'recharts';

export default function GdpChart({ dataMap }) {

  const data = Object.entries(dataMap || {}).map(([year, value]) => ({
    year,
    value
  }));

  return (
    <div style={{ width: '100%', height: 250 }}>
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis dataKey="year" />
          <YAxis tickFormatter={(v) => `${v}%`} />

          <Tooltip formatter={(v) => `${v.toFixed(2)} %`} />

          <Line
            type="monotone"
            dataKey="value"
            stroke="#2ca02c"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
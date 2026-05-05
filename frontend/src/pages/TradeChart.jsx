import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend
} from 'recharts';

export default function TradeChart({ exportsData, importsData }) {

  // Merge both datasets into one array
  const years = Array.from(
    new Set([
      ...Object.keys(exportsData || {}),
      ...Object.keys(importsData || {})
    ])
  ).sort();

  const data = years.map(year => ({
    year,
    imports: (importsData?.[year] || 0) / 1e9,
    exports: (exportsData?.[year] || 0) / 1e9, // convert to billions
  }));

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis dataKey="year" />
          <YAxis
            tickFormatter={(v) => `${Math.round(v)}B`}
          />

          <Tooltip
            formatter={(value) => `${value.toFixed(2)} B USD`}
          />

          <Legend />

          <Line
            type="monotone"
            dataKey="exports"
            stroke="#1f77b4"
            strokeWidth={2}
            dot={false}
          />

          <Line
            type="monotone"
            dataKey="imports"
            stroke="#ff7f0e"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
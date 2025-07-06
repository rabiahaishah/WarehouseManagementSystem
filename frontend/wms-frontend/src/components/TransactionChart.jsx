import React from "react";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

function TransactionChart({ data }) {
  // Merge inbound + outbound by date
  const merged = {};
  data.inbound.forEach((d) => {
    merged[d.date] = { date: d.date, inbound: d.total, outbound: 0 };
  });
  data.outbound.forEach((d) => {
    if (!merged[d.date]) merged[d.date] = { date: d.date, inbound: 0 };
    merged[d.date].outbound = d.total;
  });

  const chartData = Object.values(merged).sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <div className="bg-white p-4 rounded shadow">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid stroke="#eee" strokeDasharray="5 5" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="inbound" stroke="#10b981" name="Inbound" />
          <Line type="monotone" dataKey="outbound" stroke="#ef4444" name="Outbound" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default TransactionChart;
import React, { useEffect, useState } from "react";
import TransactionChart from "../components/TransactionChart";
import { useNavigate } from "react-router-dom";
import { hasPermission } from "../utils/permission";


function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [chartData, setChartData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/dashboard-summary/")
      .then((res) => res.json())
      .then((data) => setSummary(data));

    fetch("http://127.0.0.1:8000/api/daily-transactions/")
      .then((res) => res.json())
      .then((data) => setChartData(data));
  }, []);

  if (!summary || !chartData) return <div className="p-4 text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300 p-6">
      <h1 className="text-5xl font-extrabold text-center text-blue-900 mb-10">
        Dashboard & Insights
      </h1>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Metrics Card */}
        <div className="bg-white shadow-lg rounded-xl p-6">
          <h2 className="text-xl font-semibold text-blue-800 mb-4">Key Insights</h2>
          <div className="grid grid-cols-2 gap-6">
            <Metric title="Total Products" value={summary.total_products} />
            <Metric title="Inbound Today" value={summary.inbound_today} />
            <Metric title="Outbound Today" value={summary.outbound_today} />
            <Metric title="Low Stock Alerts" value={summary.low_stock_alerts} />
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white shadow-lg rounded-xl p-6">
          <h2 className="text-xl font-semibold text-blue-800 mb-4">Recent Activities</h2>
          <ul className="space-y-2 text-sm text-gray-700 max-h-[300px] overflow-y-auto pr-2">
            {summary.recent_activities.map((a, i) => (
              <li key={i}>
                <span role="img" aria-label="clock">🕒</span>{" "}
                <strong>{a.performed_by}</strong>{" "}
                <span className="capitalize">{a.action}</span>{" "}
                <em>{a.product}</em> at{" "}
                {new Date(a.timestamp).toLocaleString()}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white shadow-lg rounded-xl p-6">
        <h2 className="text-2xl font-semibold text-blue-800 mb-4">Daily Transactions</h2>
        <TransactionChart data={chartData} />
      </div>

      {/* Back to Home Button */}
      <div className="mt-6 text-right">
        <button
          onClick={() => navigate("/home")}
          className="text-sm bg-gray-100 hover:bg-gray-200 text-blue-700 px-4 py-2 rounded"
        >
          ← Back to Home
        </button>
      </div>
    </div>
  );
}

function Metric({ title, value }) {
  return (
    <div className="text-center">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-3xl font-bold text-blue-800">{value}</div>
    </div>
  );
}

export default Dashboard;

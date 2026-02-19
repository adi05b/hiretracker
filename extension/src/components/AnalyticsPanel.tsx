import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { analytics } from "../api";

const STATUS_COLORS: Record<string, string> = {
  wishlist: "#9ca3af",
  applied: "#3b82f6",
  oa: "#a855f7",
  interview: "#eab308",
  offer: "#22c55e",
  rejected: "#ef4444",
};

const PIE_COLORS = ["#4f46e5", "#3b82f6", "#22c55e", "#eab308", "#ef4444", "#a855f7"];

export default function AnalyticsPanel() {
  const [summary, setSummary] = useState<{
    total: number;
    response_rate: number;
    by_status: Record<string, number>;
    by_source: Record<string, number>;
  } | null>(null);

  const [funnel, setFunnel] = useState<{ stage: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [s, f] = await Promise.all([analytics.summary(), analytics.funnel()]);
        setSummary(s);
        setFunnel(f);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="text-center text-gray-400 py-12">Loading analytics...</div>;
  if (error) return <div className="text-center text-red-500 py-12">{error}</div>;
  if (!summary || summary.total === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 text-lg">No applications yet</p>
        <p className="text-gray-300 text-sm mt-1">Start tracking jobs to see your analytics!</p>
      </div>
    );
  }

  const sourceData = Object.entries(summary.by_source).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
          <p className="text-3xl font-bold text-indigo-600">{summary.total}</p>
          <p className="text-sm text-gray-500 mt-1">Total Applications</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
          <p className="text-3xl font-bold text-green-600">{summary.response_rate}%</p>
          <p className="text-sm text-gray-500 mt-1">Response Rate</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
          <p className="text-3xl font-bold text-yellow-600">{summary.by_status["offer"] || 0}</p>
          <p className="text-sm text-gray-500 mt-1">Offers</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-6">
        {/* Funnel Bar Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Application Funnel</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={funnel} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="stage" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {funnel.map((entry) => (
                  <Cell key={entry.stage} fill={STATUS_COLORS[entry.stage] || "#6b7280"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Source Pie Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Applications by Source</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={sourceData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={3}
                dataKey="value"
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              >
                {sourceData.map((_entry, index) => (
                  <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Status Breakdown</h3>
        <div className="flex gap-3 flex-wrap">
          {Object.entries(summary.by_status).map(([status, count]) => (
            <div key={status} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: STATUS_COLORS[status] || "#6b7280" }} />
              <span className="text-sm text-gray-600 capitalize">{status}</span>
              <span className="text-sm font-semibold text-gray-900">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
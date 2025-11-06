interface KpiCardProps {
  title: string;
  value: string;
  trend: string;
  bgColor?: string;
}

export function DashboardCard({ title, value, trend, bgColor }: KpiCardProps) {
  const textColor = bgColor === "bg-white" ? "text-black" : "text-white";
  const trendColor = bgColor === "bg-white" ? "text-green-500" : "text-white";

  return (
    <div className={`${bgColor || "bg-white dark:bg-gray-800"} p-6 rounded-2xl shadow-sm ${textColor}`}>
      <p className="text-sm font-medium mb-1">{title}</p>
      <h2 className="text-3xl font-bold">{value}</h2>
      <span className={`text-xs ${trendColor}`}>{trend} vs last month</span>
    </div>
  );
}

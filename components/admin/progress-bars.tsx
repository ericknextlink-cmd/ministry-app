const ProgressBar = ({ title, value, color }: { title: string; value: number; color: string }) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center text-sm">
      <span className={`font-medium text-${color}-500`}>{title}</span>
      <span className="text-gray-500 dark:text-gray-400">{value}%</span>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
      <div className={`bg-${color}-500 h-2.5 rounded-full`} style={{ width: `${value}%` }}></div>
    </div>
  </div>
);

export function ProgressBars({ data }: { data: any[] }) {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm h-full">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white border-b pb-3 mb-4">Certificate Status</h3>
      <div className="space-y-4">
        {data.map((item, index) => (
          <ProgressBar key={index} title={item.title} value={item.value} color={item.color} />
        ))}
      </div>
    </div>
  );
}

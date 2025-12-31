import { format } from "date-fns";
import Link from "next/link"; // Import Link component

export function RecentApplicationsTable({ data }: { data: any[] }) {
  const getStatusColor = (status: string) => {
      switch (status) {
          case "approved": return "bg-green-100 text-green-800";
          case "rejected": return "bg-red-100 text-red-800";
          case "submitted": return "bg-blue-100 text-blue-800";
          case "in_review": return "bg-yellow-100 text-yellow-800";
          case "pending_payment": return "bg-orange-100 text-orange-800"; // Added
          case "draft": return "bg-gray-100 text-gray-800"; // Added
          default: return "bg-gray-100 text-gray-800";
      }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm overflow-x-auto">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Recent Applications</h3>
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead>
          <tr>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">ID</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">Company</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">Email</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">Certificate Type</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">Status</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">Created On</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
          {data.length === 0 ? (
              <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">No applications found.</td>
              </tr>
          ) : (
            data.map((app, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-150">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">#{app.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{app.company_name || "-"}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{app.user_email || "-"}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 capitalize">{app.certificate_type}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                    <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(app.status)}`}
                    >
                    {app.status.replace("_", " ")}
                    </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {app.created_at ? format(new Date(app.created_at), "MMM d, yyyy") : "N/A"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link href={`/admin/applications/${app.id}`} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-200">View</Link>
                </td>
                </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

import KanbanBoard from "../components/KanbanBoard";

export default function DashboardApp() {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">
            <span className="text-indigo-600">Hire</span>Track
            <span className="text-sm font-normal text-gray-400 ml-2">
              Dashboard
            </span>
          </h1>
          <p className="text-sm text-gray-400">
            Drag cards between columns to update status
          </p>
        </div>
      </header>

      <div className="max-w-screen-2xl mx-auto">
        <KanbanBoard />
      </div>
    </div>
  );
}
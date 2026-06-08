export default function DashboardLoading() {
  return (
    <div className="min-h-dvh bg-gradient-to-b from-felt-800 via-felt-900 to-felt-800 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 animate-pulse">
        <div className="w-10 h-10 border-2 border-accent-gold/30 border-t-accent-gold rounded-full animate-spin" />
        <div className="text-sm text-gray-500">Загрузка...</div>
      </div>
    </div>
  );
}

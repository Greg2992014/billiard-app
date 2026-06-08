export default function GameLoading() {
  return (
    <div className="flex items-center justify-center min-h-dvh bg-felt-900">
      <div className="text-center animate-pulse">
        <div className="mb-3 flex justify-center">
          <div className="w-12 h-12 border-2 border-accent-gold/30 border-t-accent-gold rounded-full animate-spin" />
        </div>
        <div className="text-gray-400">Загрузка игры...</div>
      </div>
    </div>
  );
}

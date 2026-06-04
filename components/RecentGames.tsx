import { GAME_TYPE_NAMES } from '@/lib/constants';
import type { RecentGame } from '@/lib/types';

interface RecentGamesProps {
  games: RecentGame[];
}

export function RecentGames({ games }: RecentGamesProps) {
  return (
    <div className="glass rounded-2xl p-4 animate-fade-in">
      <h2 className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider">
        Последние игры
      </h2>
      <div className="space-y-2">
        {games.map((g) => {
          const isActive = g.status === 'active';
          return (
            <div key={g.room_id} className="flex items-center justify-between p-2 bg-white/5 rounded-xl">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white font-medium truncate">
                    {g.left_login} vs {g.right_login}
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    isActive ? 'bg-accent-gold/15 text-accent-gold' : 'bg-white/5 text-gray-500'
                  }`}>
                    {isActive ? 'Идёт' : 'Завершена'}
                  </span>
                </div>
                <div className="text-[10px] text-gray-500 mt-0.5">
                  {GAME_TYPE_NAMES[g.game_type] || g.game_type} • {g.total_shots_left}:{g.total_shots_right} • {new Date(g.game_started_at).toLocaleDateString()}
                </div>
              </div>
              {isActive && (
                <a
                  href={`/game/${g.room_id}`}
                  className="ml-3 px-3 py-1.5 bg-accent-emerald/15 text-accent-emerald border border-accent-emerald/30 rounded-lg text-[10px] font-bold whitespace-nowrap active:scale-95 transition-all"
                >
                  Вернуться
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

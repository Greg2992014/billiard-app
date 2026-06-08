import { COLOR_NAMES_RU } from '@/lib/constants';
import { BallImage } from '@/components/BallImage';
import { IconImage } from '@/components/IconImage';
import type { HistoryLogMove as Move } from '@/lib/types';

interface HistoryLogProps {
  moves: Move[];
  players: { left: { id: number; login: string }; right: { id: number; login: string } };
}

export function HistoryLog({ moves, players }: HistoryLogProps) {
  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffSec < 60) return `${diffSec}с`;
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}м`;
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  };

  const getPlayerLogin = (playerId: number) => {
    if (playerId === players.left.id) return players.left.login;
    if (playerId === players.right.id) return players.right.login;
    return '?';
  };

  const getPlayerColor = (playerId: number) => {
    if (playerId === players.left.id) return 'text-accent-sapphire';
    if (playerId === players.right.id) return 'text-accent-ruby';
    return 'text-gray-400';
  };

  // Check for cancelled moves
  const hasCancelled = moves.some((m) => m.cancelled === 1);

  return (
    <div className="glass rounded-2xl p-3 max-h-40 overflow-y-auto no-scrollbar">
      <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-2 flex items-center gap-2">
        <span>История ходов</span>
        {hasCancelled && (
          <span className="text-amber-400/50 text-[9px]">(есть отменённые)</span>
        )}
      </div>
      {moves.length === 0 && (
        <div className="text-xs text-gray-600 text-center py-2">Пока нет ходов</div>
      )}
      {moves.slice(-15).reverse().map((move) => {
        const isCancelled = move.cancelled === 1;
        const isShot = move.move_type === 'shot';
        const isFoul = move.move_type === 'foul';
        const isDurak = move.move_type === 'durak';

        const ballColorNames = COLOR_NAMES_RU;
        const ballLabel = move.ball_color ? (ballColorNames[move.ball_color] ?? move.ball_color) : '';
        const ballColorKey = move.ball_color || '';

        // Points display
        const pointsVal = move.points ?? 0;
        const pointsStr = pointsVal > 0
          ? (isFoul ? ` +${pointsVal} сопернику` : ` +${pointsVal}`)
          : '';

        const msg = isShot
          ? `забил ${ballLabel}${pointsStr}`
          : isFoul
          ? (move.move_message || `фол${pointsStr}`)
          : isDurak
          ? `дурак${pointsStr}`
          : 'сменил ход';

        return (
          <div
            key={move.id}
            className={`flex items-center gap-2 py-1 border-b border-white/5 last:border-0 ${
              isCancelled ? 'opacity-40 line-through' : ''
            }`}
          >
            <span className={`text-xs font-semibold min-w-0 truncate ${getPlayerColor(move.player_id)}`}>
              {getPlayerLogin(move.player_id)}
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-gray-300 flex-1 truncate">
              {isShot && ballColorKey && (
                <BallImage color={ballColorKey} size={14} />
              )}
              {isFoul && ballColorKey && (
                <BallImage color={ballColorKey} size={14} />
              )}
              {isDurak && (
                <IconImage name="fool" size={14} />
              )}
              {isDurak && ballColorKey && (
                <BallImage color={ballColorKey} size={14} />
              )}
              <span className="truncate">{msg}</span>
            </span>
            {isCancelled && (
              <span className="text-[9px] text-amber-400/60 whitespace-nowrap mr-1">отменён</span>
            )}
            <span className="text-[10px] text-gray-600 whitespace-nowrap tabular-nums">
              {formatRelativeTime(move.created_at)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

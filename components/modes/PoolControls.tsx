import { BallImage } from '@/components/BallImage';
import { IconImage } from '@/components/IconImage';

interface PoolControlsProps {
  onShot: (shotType: 'solid' | 'stripe' | 'black') => void;
  onOpponentBall: () => void;
  onDurak: () => void;
  onEarlyBlack: () => void;
  disabled: boolean;
  isEightAllowed: boolean;
  myGroup: 'solid' | 'stripe' | null;
  myPocketed: number;
}

export function PoolControls({
  onShot, onOpponentBall, onDurak, onEarlyBlack, disabled,
  isEightAllowed, myGroup, myPocketed
}: PoolControlsProps) {
  const allMyBallsDone = myGroup !== null && myPocketed >= 7;
  const opponentGroup = myGroup === 'solid' ? 'stripe' : myGroup === 'stripe' ? 'solid' : null;

  return (
    <div className="space-y-3 w-full">
      {/* Group status text */}
      {myGroup && (
        <div className="text-center text-xs sm:text-sm text-gray-400">
          Забито: <span className="font-bold text-white">{myPocketed}</span>/7
          {isEightAllowed && <span className="ml-1.5 text-accent-gold animate-pulse">можно бить чёрный</span>}
        </div>
      )}

      {/* Main shot area */}
      {myGroup === null ? (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onShot('solid')}
            disabled={disabled}
            className="py-4 bg-accent-sapphire/20 border-2 border-accent-sapphire/30 rounded-2xl text-accent-sapphire text-base font-extrabold active:scale-95 disabled:opacity-30 transition-all min-h-[52px]"
          >
            <span className="inline-flex items-center gap-2">
              <BallImage color="solid" size={22} />
              <span>Сплошные</span>
            </span>
          </button>
          <button
            onClick={() => onShot('stripe')}
            disabled={disabled}
            className="py-4 bg-accent-ruby/20 border-2 border-accent-ruby/30 rounded-2xl text-accent-ruby text-base font-extrabold active:scale-95 disabled:opacity-30 transition-all min-h-[52px]"
          >
            <span className="inline-flex items-center gap-2">
              <BallImage color="stripe" size={22} />
              <span>Полосатые</span>
            </span>
          </button>
        </div>
      ) : !allMyBallsDone ? (
        <button
          onClick={() => onShot(myGroup)}
          disabled={disabled}
          className="w-full py-4 bg-accent-emerald/15 border-2 border-accent-emerald/30 rounded-2xl text-accent-emerald text-base sm:text-lg font-extrabold active:scale-95 disabled:opacity-30 transition-all min-h-[52px] sm:min-h-[56px]"
        >
          <span className="inline-flex items-center gap-2">
            <BallImage color={myGroup} size={22} />
            <span>Забил свой ({myGroup === 'solid' ? 'сплошной' : 'полосатый'})</span>
          </span>
        </button>
      ) : (
        <div className="text-center text-sm text-accent-gold py-2 font-bold">
          Все свои забиты — бей чёрный!
        </div>
      )}

      {/* Black ball button */}
      {isEightAllowed && (
        <button
          onClick={() => onShot('black')}
          disabled={disabled}
          className="w-full py-4 bg-black/40 border-2 border-white/20 rounded-2xl text-white text-base sm:text-lg font-extrabold active:scale-95 disabled:opacity-30 transition-all min-h-[52px] sm:min-h-[56px] shadow-inner"
        >
          <span className="inline-flex items-center gap-2">
            <BallImage color="black" size={22} />
            <span>Чёрный шар (победа)</span>
          </span>
        </button>
      )}

      {/* Early black button */}
      {myGroup && !isEightAllowed && (
        <button
          onClick={onEarlyBlack}
          disabled={disabled}
          className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-400 font-medium active:scale-95 disabled:opacity-30 transition-all min-h-[44px]"
        >
          <span className="inline-flex items-center gap-2">
            <BallImage color="black" size={18} />
            <span>Чёрный досрочно (поражение)</span>
          </span>
        </button>
      )}

      {/* Opponent ball / durak row */}
      {myGroup !== null && (
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button
            onClick={onOpponentBall}
            disabled={disabled || allMyBallsDone}
            className="flex-1 py-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-sm text-purple-400 font-semibold active:scale-95 disabled:opacity-30 transition-all min-h-[44px]"
          >
            <span className="inline-flex items-center gap-1.5">
              {opponentGroup && <BallImage color={opponentGroup} size={18} />}
              <span>Чужой шар (фол)</span>
            </span>
          </button>
          <button
            onClick={onDurak}
            disabled={disabled || allMyBallsDone}
            className="flex-1 py-3 bg-accent-gold/10 border border-accent-gold/20 rounded-xl text-sm text-accent-gold font-bold active:scale-95 disabled:opacity-30 transition-all min-h-[44px]"
          >
            <span className="inline-flex items-center gap-1.5">
              <IconImage name="fool" size={18} />
              <span>Дурак</span>
            </span>
          </button>
        </div>
      )}
      {/* Hint when durak/foul are blocked */}
      {myGroup !== null && allMyBallsDone && (
        <div className="text-center text-[10px] text-gray-600">
          Шары своей группы забиты — бей чёрный
        </div>
      )}

      {myGroup === null && (
        <button
          onClick={onDurak}
          disabled={disabled}
          className="w-full py-3 bg-accent-gold/10 border border-accent-gold/20 rounded-xl text-sm text-accent-gold font-bold active:scale-95 disabled:opacity-30 transition-all min-h-[44px]"
        >
          <span className="inline-flex items-center gap-1.5">
            <IconImage name="fool" size={18} />
            <span>Дурак</span>
          </span>
        </button>
      )}
    </div>
  );
}

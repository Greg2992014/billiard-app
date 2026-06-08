'use client';
import { BallImage } from '@/components/BallImage';
import { IconImage } from '@/components/IconImage';

interface PoolControlsProps {
  onShot: (shotType: 'solid' | 'stripe' | 'black') => void;
  onOpponentBall: () => void;
  onDurak: () => void;
  onDurakBlack: () => void;
  onEarlyBlack: () => void;
  disabled: boolean;
  isEightAllowed: boolean;
  myGroup: 'solid' | 'stripe' | null;
  myPocketed: number;
}

export function PoolControls({
  onShot, onOpponentBall, onDurak, onDurakBlack, onEarlyBlack, disabled,
  isEightAllowed, myGroup, myPocketed
}: PoolControlsProps) {
  const allMyBallsDone = myGroup !== null && myPocketed >= 7;
  const opponentGroup = myGroup === 'solid' ? 'stripe' : myGroup === 'stripe' ? 'solid' : null;

  return (
    <div className="space-y-3 w-full">
      {/* Hint badge */}
      {myGroup === null && (
        <div className="flex items-center gap-2 px-3 py-2.5 bg-white/10 border border-white/15 rounded-xl text-sm text-gray-200 font-semibold text-center">
          <span className="mx-auto">Выбери группу — забитый шар определяет её</span>
        </div>
      )}
      {myGroup !== null && !allMyBallsDone && (
        <div className="flex items-center gap-2 px-3 py-2.5 bg-accent-emerald/10 border border-accent-emerald/20 rounded-xl text-sm text-accent-emerald font-semibold">
          <BallImage color={myGroup} size={18} />
          <span>Твои: {myGroup === 'solid' ? 'сплошные' : 'полосатые'}</span>
          <span className="ml-auto text-xs opacity-70 tabular-nums">Забито {myPocketed}/7</span>
        </div>
      )}
      {allMyBallsDone && (
        <div className="flex items-center gap-2 px-3 py-2.5 bg-accent-gold/10 border border-accent-gold/20 rounded-xl text-sm text-accent-gold font-semibold text-center">
          <span className="mx-auto">Все свои забиты — бей чёрный!</span>
        </div>
      )}

      {/* Main shot area */}
      {myGroup === null ? (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onShot('solid')}
            disabled={disabled}
            className="py-4 bg-accent-sapphire/20 border-2 border-accent-sapphire/30 rounded-2xl text-accent-sapphire text-base font-extrabold active:scale-95 disabled:opacity-30 transition-all min-h-[56px]"
          >
            <span className="inline-flex items-center gap-2">
              <BallImage color="solid" size={28} />
              <span>Сплошные</span>
            </span>
          </button>
          <button
            onClick={() => onShot('stripe')}
            disabled={disabled}
            className="py-4 bg-accent-ruby/20 border-2 border-accent-ruby/30 rounded-2xl text-accent-ruby text-base font-extrabold active:scale-95 disabled:opacity-30 transition-all min-h-[56px]"
          >
            <span className="inline-flex items-center gap-2">
              <BallImage color="stripe" size={28} />
              <span>Полосатые</span>
            </span>
          </button>
        </div>
      ) : !allMyBallsDone ? (
        <button
          onClick={() => onShot(myGroup)}
          disabled={disabled}
          className="w-full py-4 bg-accent-emerald/15 border-2 border-accent-emerald/30 rounded-2xl text-accent-emerald text-base sm:text-lg font-extrabold active:scale-95 disabled:opacity-30 transition-all min-h-[56px]"
        >
          <span className="inline-flex items-center gap-2">
            <BallImage color={myGroup} size={28} />
            <span>Забил свой ({myGroup === 'solid' ? 'сплошной' : 'полосатый'})</span>
          </span>
        </button>
      ) : null}

      {/* Bottom row: Чужой / Дурак / Чёрный */}
      <div className="flex gap-4 justify-center pt-1">
        {/* Чужой шар — работает и в концовке (фол — забил соперника вместо чёрного) */}
        {myGroup !== null && (
          <button
            onClick={onOpponentBall}
            disabled={disabled}
            className="flex flex-col items-center gap-1 group"
          >
            <span className="w-16 h-16 rounded-full bg-purple-500/15 border-2 border-purple-500/30 flex items-center justify-center group-active:scale-90 transition-all disabled:opacity-30">
              {opponentGroup ? <BallImage color={opponentGroup} size={26} /> : <IconImage name="wrong" size={26} />}
            </span>
            <span className="text-[10px] text-purple-500/60 font-medium">Чужой</span>
          </button>
        )}

        {/* Дурак: до 7 = случайно свой, после 7 = случайно чёрный (победа) */}
        <button
          onClick={allMyBallsDone ? onDurakBlack : onDurak}
          disabled={disabled}
          className="flex flex-col items-center gap-1 group"
        >
          <span className={`w-16 h-16 rounded-full border-2 flex items-center justify-center group-active:scale-90 transition-all disabled:opacity-30 ${
            allMyBallsDone
              ? 'bg-accent-gold/15 border-accent-gold/30'
              : 'bg-accent-gold/15 border-accent-gold/30'
          }`}>
            <IconImage name="fool" size={26} />
          </span>
          <span className={`text-[10px] font-medium ${
            allMyBallsDone ? 'text-accent-gold/60' : 'text-accent-gold/60'
          }`}>
            {allMyBallsDone ? 'Дурак (победа)' : 'Дурак'}
          </span>
        </button>

        {/* Чёрный (победа) */}
        {isEightAllowed && (
          <button
            onClick={() => onShot('black')}
            disabled={disabled}
            className="flex flex-col items-center gap-1 group"
          >
            <span className="w-16 h-16 rounded-full bg-black/40 border-2 border-white/20 flex items-center justify-center group-active:scale-90 transition-all disabled:opacity-30 shadow-inner">
              <BallImage color="black" size={26} />
            </span>
            <span className="text-[10px] text-gray-400 font-medium">Чёрный</span>
          </button>
        )}
      </div>

      {/* Early black button — only when NOT allowed */}
      {myGroup && !isEightAllowed && (
        <button
          onClick={onEarlyBlack}
          disabled={disabled}
          className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-400 font-medium active:scale-95 disabled:opacity-30 transition-all"
        >
          <span className="inline-flex items-center gap-2">
            <BallImage color="black" size={18} />
            <span>Чёрный досрочно (поражение)</span>
          </span>
        </button>
      )}
    </div>
  );
}

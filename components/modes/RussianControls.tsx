'use client';
import { BallImage } from '@/components/BallImage';
import { IconImage } from '@/components/IconImage';

interface RussianControlsProps {
  onShot: () => void;
  onDurak: () => void;
  disabled: boolean;
  ballsPocketed: number;
  target: number;
}

export function RussianControls({ onShot, onDurak, disabled, ballsPocketed, target }: RussianControlsProps) {
  const remaining = target - ballsPocketed;

  return (
    <div className="space-y-3 w-full">
      {/* Hint badge */}
      {remaining > 0 && (
        <div className="flex items-center gap-2 px-3 py-2.5 bg-accent-emerald/10 border border-accent-emerald/20 rounded-xl text-sm text-accent-emerald font-semibold">
          <span>Твой ход</span>
          <span className="ml-auto text-xs opacity-70 tabular-nums">Ост. {remaining}/{target}</span>
        </div>
      )}

      {/* Balls progress */}
      <div className="flex justify-center gap-1 flex-wrap mb-1">
        {Array.from({ length: target }).map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full transition-all ${
              i < ballsPocketed
                ? 'bg-accent-gold shadow-sm shadow-accent-gold/50'
                : 'bg-white/10'
            }`}
          />
        ))}
      </div>
      <div className="text-center text-xs sm:text-sm text-gray-400">
        {ballsPocketed}/{target}
        {remaining === 0
          ? <span className="ml-1"><IconImage name="award" size={16} /></span>
          : ` — осталось ${remaining}`}
      </div>

      {/* Shot button */}
      <button
        onClick={onShot}
        disabled={disabled}
        className="w-full py-4 bg-accent-gold/20 border-2 border-accent-gold/30 rounded-2xl text-accent-gold text-base sm:text-lg font-extrabold active:scale-95 disabled:opacity-30 disabled:active:scale-100 transition-all min-h-[56px]"
      >
        <span className="inline-flex items-center gap-2">
          <BallImage color="white" size={28} />
          <span>Забил</span>
        </span>
      </button>

      {/* Дурак — centre */}
      <div className="flex justify-center pt-1">
        <button
          onClick={onDurak}
          disabled={disabled}
          className="flex flex-col items-center gap-1 group"
        >
          <span className="w-16 h-16 rounded-full bg-accent-gold/15 border-2 border-accent-gold/30 flex items-center justify-center group-active:scale-90 transition-all disabled:opacity-30">
            <IconImage name="fool" size={26} />
          </span>
          <span className="text-[10px] text-accent-gold/60 font-medium">Дурак</span>
        </button>
      </div>
    </div>
  );
}

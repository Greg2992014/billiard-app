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
      {/* Balls progress */}
      <div className="flex justify-center gap-0.5 flex-wrap mb-1">
        {Array.from({ length: target }).map((_, i) => (
          <div
            key={i}
            className={`w-2.5 h-2.5 rounded-full transition-all ${
              i < ballsPocketed
                ? 'bg-accent-gold shadow-sm shadow-accent-gold/50'
                : 'bg-white/10'
            }`}
          />
        ))}
      </div>
      <div className="text-center text-xs sm:text-sm text-gray-400">
        {ballsPocketed}/{target}{remaining === 0 ? <span> <IconImage name="award" size={16} /></span> : ` — осталось ${remaining}`}
      </div>

      <button
        onClick={onShot}
        disabled={disabled}
        className="w-full py-4 bg-accent-gold/20 border-2 border-accent-gold/30 rounded-2xl text-accent-gold text-base sm:text-lg font-extrabold active:scale-95 disabled:opacity-30 disabled:active:scale-100 transition-all min-h-[52px] sm:min-h-[56px]"
      >
        <span className="inline-flex items-center gap-2">
          <BallImage color="white" size={22} />
          <span>Забил</span>
        </span>
      </button>

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
    </div>
  );
}

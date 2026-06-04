import { IconImage } from '@/components/IconImage';

const GAME_MODES = [
  { value: 'pool' as const, label: 'Пул', iconKey: 'pool_mode' as const, desc: '8-ball' },
  { value: 'russian' as const, label: 'Русский', iconKey: 'piramid' as const, desc: 'Пирамида' },
  { value: 'snooker' as const, label: 'Снукер', iconKey: 'start' as const, desc: '15 красных + цвета' },
];

const MODE_ICON_SIZE = 32;

interface GameTypeSelectorProps {
  gameType: 'pool' | 'russian' | 'snooker';
  onSelect: (type: 'pool' | 'russian' | 'snooker') => void;
}

export function GameTypeSelector({ gameType, onSelect }: GameTypeSelectorProps) {
  return (
    <div className="glass rounded-2xl p-4 animate-fade-in">
      <label className="block text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider">
        Режим игры
      </label>
      <div className="grid grid-cols-3 gap-2">
        {GAME_MODES.map((mode) => (
          <button
            key={mode.value}
            type="button"
            onClick={() => onSelect(mode.value)}
            className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all active:scale-95 ${
              gameType === mode.value
                ? 'bg-accent-emerald/15 border-accent-emerald text-white shadow-lg shadow-accent-emerald/10'
                : 'bg-white/5 border-white/5 text-gray-300 hover:border-white/15'
            }`}
          >
            <IconImage name={mode.iconKey} size={MODE_ICON_SIZE} />
            <span className="text-xs font-bold">{mode.label}</span>
            <span className="text-[10px] text-gray-500">{mode.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

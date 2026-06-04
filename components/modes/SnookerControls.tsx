'use client';
import { useState } from 'react';
import { COLOR_ORDER, BALL_DEFS, COLOR_NAMES_RU } from '@/lib/constants';
import { BallImage } from '@/components/BallImage';
import { IconImage } from '@/components/IconImage';

interface SnookerControlsProps {
  onShot: (color: string) => void;
  onFoul: (points: number) => void;
  onDurak: (color: string) => void;
  disabled: boolean;
  requiredBallType: 'red' | 'color' | null;
  reds: number;
  phase: 'normal' | 'colors';
  availableColors: Record<string, number>;
}

export function SnookerControls({
  onShot, onFoul, onDurak, disabled,
  requiredBallType, reds, phase, availableColors
}: SnookerControlsProps) {

  const [showFoulPicker, setShowFoulPicker] = useState(false);
  const [showDurakPicker, setShowDurakPicker] = useState(false);

  const nextInOrder = phase === 'colors'
    ? COLOR_ORDER.find(c => availableColors[c] === 1) ?? null
    : null;

  const hint = () => {
    if (phase === 'normal') {
      if (requiredBallType === 'red') return (
        <span className="inline-flex items-center gap-1">
          <BallImage color="red" size={16} />
          <span>Красный (+1) — на столе: {reds}</span>
        </span>
      );
      if (requiredBallType === 'color') return <span className="inline-flex items-center gap-1"><IconImage name="info" size={16} />Любой цветной (выставится)</span>;
    }
    if (phase === 'colors' && nextInOrder) {
      const pts: Record<string, number> = { yellow: 2, green: 3, brown: 4, blue: 5, pink: 6, black: 7 };
      const def = BALL_DEFS.find(b => b.name === nextInOrder);
      return (
        <span className="inline-flex items-center gap-1">
          {def && <BallImage color={def.ballColor} size={16} />}
          <span>Бей {COLOR_NAMES_RU[nextInOrder]} (+{pts[nextInOrder]})</span>
        </span>
      );
    }
    return '';
  };

  const isColorEnabled = (name: string) => {
    if (requiredBallType !== 'color') return false;
    if (phase === 'normal') return true;
    return nextInOrder === name;
  };

  const activeColors = BALL_DEFS.filter(b => b.name !== 'red' && availableColors[b.name] > 0);
  const allColorsDone = phase === 'colors' && activeColors.length === 0;

  return (
    <div className="space-y-3 w-full">
      {/* Hint */}
      <div className="text-center text-xs sm:text-sm bg-white/5 rounded-xl px-3 py-2 text-gray-300 leading-snug font-medium">
        {allColorsDone ? <span className="inline-flex items-center gap-1"><IconImage name="award" size={16} />Все цвета забиты!</span> : hint()}
      </div>

      {/* Red ball button */}
      {phase === 'normal' && reds > 0 && (
        <button
          onClick={() => onShot('red')}
          disabled={disabled || requiredBallType !== 'red'}
          className={`w-full py-4 sm:py-4 rounded-2xl text-base sm:text-lg font-extrabold transition-all active:scale-95 min-h-[52px] sm:min-h-[56px] ${
            requiredBallType === 'red' && !disabled
              ? 'bg-accent-ruby/20 border-2 border-accent-ruby/30 text-accent-ruby'
              : 'bg-white/5 text-gray-600 border border-white/5'
          }`}
        >
          <span className="inline-flex items-center gap-1.5">
            <BallImage color="red" size={22} />
            <span>Красный (+1) — {reds} на столе</span>
          </span>
        </button>
      )}

      {/* Color balls grid */}
      {!allColorsDone && (
        <div className="grid grid-cols-3 gap-2 sm:gap-2">
          {BALL_DEFS.filter(b => b.name !== 'red').map((b) => {
            if (availableColors[b.name] === 0) return null;
            const enabled = isColorEnabled(b.name);
            return (
              <button
                key={b.name}
                onClick={() => onShot(b.name)}
                disabled={disabled || !enabled}
                className={`py-3 sm:py-3 rounded-2xl font-bold transition-all active:scale-90 min-h-[48px] sm:min-h-[52px] ${
                  enabled && !disabled
                    ? 'bg-white/10 border-2 border-white/15 hover:bg-white/15'
                    : 'bg-white/5 text-gray-700 border border-white/5'
                }`}
              >
                <BallImage color={b.ballColor} size={26} />
              </button>
            );
          })}
        </div>
      )}

      {/* Foul + Durak row */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        {showFoulPicker ? (
          <div className="flex-1 p-3 sm:p-3 bg-white/5 rounded-2xl border border-accent-ruby/20 space-y-2">
            <div className="text-center text-xs text-gray-400">Выбери очки фола:</div>
            <div className="flex gap-2 sm:gap-2 justify-center">
              {[4, 5, 6, 7].map((pts) => (
                <button
                  key={pts}
                  onClick={() => { onFoul(pts); setShowFoulPicker(false); }}
                  disabled={disabled}
                  className="w-14 h-14 sm:w-12 sm:h-12 rounded-xl bg-accent-ruby/15 border-2 border-accent-ruby/30 text-accent-ruby text-lg sm:text-lg font-bold active:scale-90 disabled:opacity-30 transition-all"
                >
                  +{pts}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowFoulPicker(false)}
              className="w-full py-2 bg-white/5 rounded-xl text-xs text-gray-500 active:scale-95 transition-all"
            >
              Отмена
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowFoulPicker(true)}
            disabled={disabled}
            className="flex-1 py-3 sm:py-3 bg-accent-ruby/10 border border-accent-ruby/20 rounded-xl text-sm sm:text-sm text-accent-ruby font-bold active:scale-95 disabled:opacity-30 transition-all min-h-[44px]"
          >
            <span className="inline-flex items-center gap-1.5">
              <IconImage name="fail" size={18} />
              <span>Фол</span>
            </span>
          </button>
        )}

        {showDurakPicker ? (
          <div className="flex-1 p-3 sm:p-3 bg-white/5 rounded-2xl border border-accent-gold/20 space-y-2">
            <div className="text-center text-xs text-gray-400">Дурак — какой шар?</div>
            {/* Responsive grid: 2 cols on mobile, 4 cols on sm+ */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {phase === 'normal' && (
                <button
                  onClick={() => { onDurak('red'); setShowDurakPicker(false); }}
                  disabled={disabled}
                  className={`py-3 rounded-xl font-bold active:scale-90 transition-all min-h-[48px] ${
                    !disabled ? 'bg-accent-ruby/15 border-2 border-accent-ruby/20 text-accent-ruby' : 'bg-white/5 text-gray-600'
                  }`}
                >
                  <span className="inline-flex items-center gap-1">
                    <BallImage color="red" size={20} />
                    <span className="text-xs">Красный</span>
                  </span>
                </button>
              )}
              {BALL_DEFS.filter(b => b.name !== 'red' && availableColors[b.name] > 0).map((b) => (
                <button
                  key={b.name}
                  onClick={() => { onDurak(b.name); setShowDurakPicker(false); }}
                  disabled={disabled}
                  className={`py-3 rounded-xl font-bold active:scale-90 transition-all min-h-[48px] ${
                    !disabled ? 'bg-white/10 border-2 border-white/15' : 'bg-white/5 text-gray-600'
                  }`}
                >
                  <span className="inline-flex items-center gap-1">
                    <BallImage color={b.ballColor} size={20} />
                    <span className="text-xs text-gray-400">{COLOR_NAMES_RU[b.name]}</span>
                  </span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowDurakPicker(false)}
              className="w-full py-2 bg-white/5 rounded-xl text-xs text-gray-500 active:scale-95 transition-all"
            >
              Отмена
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowDurakPicker(true)}
            disabled={disabled}
            className="flex-1 py-3 sm:py-3 bg-accent-gold/10 border border-accent-gold/20 rounded-xl text-sm sm:text-sm text-accent-gold font-bold active:scale-95 disabled:opacity-30 transition-all min-h-[44px]"
          >
            <span className="inline-flex items-center gap-1.5">
              <IconImage name="fool" size={18} />
              <span>Дурак</span>
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

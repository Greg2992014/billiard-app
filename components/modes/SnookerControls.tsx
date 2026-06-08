'use client';
import { useState } from 'react';
import { COLOR_ORDER, BALL_DEFS, COLOR_NAMES_RU } from '@/lib/constants';
import { BallImage } from '@/components/BallImage';
import { IconImage } from '@/components/IconImage';

interface SnookerControlsProps {
  onShot: (color: string) => void;
  onFoul: (points: number) => void;
  onFoulBall: (color: string) => void;
  onDurak: (color: string) => void;
  disabled: boolean;
  requiredBallType: 'red' | 'color' | null;
  reds: number;
  phase: 'normal' | 'colors';
  availableColors: Record<string, number>;
}

export function SnookerControls({
  onShot, onFoul, onFoulBall, onDurak, disabled,
  requiredBallType, reds, phase, availableColors
}: SnookerControlsProps) {

  const [showFoulPicker, setShowFoulPicker] = useState(false);
  const [showDurakPicker, setShowDurakPicker] = useState(false);

  const nextInOrder = phase === 'colors'
    ? COLOR_ORDER.find(c => availableColors[c] === 1) ?? null
    : null;

  const allColorsDone = phase === 'colors' && BALL_DEFS.filter(b => b.name !== 'red' && availableColors[b.name] > 0).length === 0;

  const foulBallColors = BALL_DEFS.filter(b =>
    (b.name === 'red' && reds > 0) || (b.name !== 'red' && availableColors[b.name] > 0)
  );

  const handleDurakClick = () => {
    if (requiredBallType === 'red' && phase === 'normal' && reds > 0) {
      onDurak('red');
      return;
    }
    if (requiredBallType === 'color' && phase === 'colors' && nextInOrder) {
      onDurak(nextInOrder);
      return;
    }
    setShowDurakPicker(true);
  };

  return (
    <div className="space-y-3 w-full">
      {/* Hint badge — какой шар бить */}
      {requiredBallType === 'red' && reds > 0 && (
        <div className="flex items-center gap-2 px-3 py-2.5 bg-accent-ruby/10 border border-accent-ruby/20 rounded-xl text-sm text-accent-ruby font-semibold">
          <BallImage color="red" size={18} />
          <span>Бей красный</span>
          <span className="ml-auto text-xs opacity-70 tabular-nums">Ост. {reds}/15</span>
        </div>
      )}
      {requiredBallType === 'color' && phase === 'normal' && !allColorsDone && (
        <div className="flex items-center gap-2 px-3 py-2.5 bg-white/10 border border-white/15 rounded-xl text-sm text-gray-200 font-semibold">
          <span>Бей цветной</span>
          <span className="ml-auto text-xs text-gray-500">на выбор</span>
        </div>
      )}
      {requiredBallType === 'color' && phase === 'colors' && nextInOrder && (() => {
        const def = BALL_DEFS.find(b => b.name === nextInOrder);
        if (!def) return null;
        return (
          <div className="flex items-center gap-2 px-3 py-2.5 bg-white/10 border border-white/15 rounded-xl text-sm text-gray-200 font-semibold">
            <span>Бей по порядку:</span>
            <BallImage color={def.ballColor} size={18} />
            <span>{COLOR_NAMES_RU[nextInOrder]}</span>
          </div>
        );
      })()}

      {/* Red ball button — only when required */}
      {requiredBallType === 'red' && reds > 0 && (
        <button
          onClick={() => onShot('red')}
          disabled={disabled}
          className="w-full py-4 sm:py-4 rounded-2xl text-base sm:text-lg font-extrabold transition-all active:scale-95 min-h-[52px] sm:min-h-[56px] bg-accent-ruby/20 border-2 border-accent-ruby/30 text-accent-ruby"
        >
          <BallImage color="red" size={28} />
        </button>
      )}

      {/* Color balls — only when required */}
      {requiredBallType === 'color' && !allColorsDone && (
        phase === 'normal' ? (
          <div className="grid grid-cols-3 gap-2 sm:gap-2">
            {BALL_DEFS.filter(b => b.name !== 'red' && availableColors[b.name] > 0).map((b) => (
              <button
                key={b.name}
                onClick={() => onShot(b.name)}
                disabled={disabled}
                className="py-3 sm:py-3 rounded-2xl font-bold transition-all active:scale-90 min-h-[48px] sm:min-h-[52px] bg-white/10 border-2 border-white/15 hover:bg-white/15"
              >
                <BallImage color={b.ballColor} size={30} />
              </button>
            ))}
          </div>
        ) : (
          nextInOrder && (
            <button
              onClick={() => onShot(nextInOrder)}
              disabled={disabled}
              className="w-full py-4 sm:py-4 rounded-2xl font-bold transition-all active:scale-90 min-h-[52px] sm:min-h-[56px] bg-white/10 border-2 border-white/15 hover:bg-white/15"
            >
              <BallImage color={BALL_DEFS.find(b => b.name === nextInOrder)?.ballColor ?? nextInOrder} size={30} />
            </button>
          )
        )
      )}

      {/* Foul + Durak — small round icon-only, at bottom */}
      <div className="flex justify-center gap-4 pt-2">
        {showFoulPicker ? (
          <div className="p-3 bg-white/5 rounded-2xl border border-accent-ruby/20 space-y-2 w-full max-w-xs">
            <div className="text-center text-xs text-gray-400">Фол — выбери забитый шар:</div>
            {foulBallColors.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {foulBallColors.map((b) => (
                  <button
                    key={b.name}
                    onClick={() => { onFoulBall(b.name); setShowFoulPicker(false); }}
                    disabled={disabled}
                    className={`py-3 rounded-xl font-bold active:scale-90 transition-all min-h-[48px] ${
                      !disabled ? 'bg-accent-ruby/15 border-2 border-accent-ruby/20 text-accent-ruby' : 'bg-white/5 text-gray-600'
                    }`}
                  >
                    <BallImage color={b.ballColor} size={24} />
                  </button>
                ))}
              </div>
            )}
            <div className="border-t border-white/10 pt-2 space-y-1">
              <div className="text-center text-[10px] text-gray-500">Просто фол (без забитого шара):</div>
              <div className="flex gap-2 justify-center">
                {[4, 5, 6, 7].map((pts) => (
                  <button
                    key={pts}
                    onClick={() => { onFoul(pts); setShowFoulPicker(false); }}
                    disabled={disabled}
                    className="w-14 h-14 rounded-xl bg-accent-ruby/10 border border-accent-ruby/20 text-accent-ruby text-lg font-bold active:scale-90 disabled:opacity-30 transition-all"
                  >
                    +{pts}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={() => setShowFoulPicker(false)}
              className="w-full py-2 bg-white/5 rounded-xl text-xs text-gray-500 active:scale-95 transition-all"
            >
              Отмена
            </button>
          </div>
        ) : showDurakPicker ? (
          <div className="p-3 bg-white/5 rounded-2xl border border-accent-gold/20 space-y-2 w-full max-w-xs">
            <div className="text-center text-xs text-gray-400">Дурак — какой шар?</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {requiredBallType === 'red' && phase === 'normal' && (
                <button
                  onClick={() => { onDurak('red'); setShowDurakPicker(false); }}
                  disabled={disabled}
                  className={`py-3 rounded-xl font-bold active:scale-90 transition-all min-h-[48px] ${
                    !disabled ? 'bg-accent-ruby/15 border-2 border-accent-ruby/20 text-accent-ruby' : 'bg-white/5 text-gray-600'
                  }`}
                >
                  <BallImage color="red" size={24} />
                </button>
              )}
              {requiredBallType === 'color' && phase === 'normal' && BALL_DEFS.filter(b => b.name !== 'red' && availableColors[b.name] > 0).map((b) => (
                <button
                  key={b.name}
                  onClick={() => { onDurak(b.name); setShowDurakPicker(false); }}
                  disabled={disabled}
                  className="py-3 rounded-xl font-bold active:scale-90 transition-all min-h-[48px] bg-white/10 border-2 border-white/15"
                >
                  <BallImage color={b.ballColor} size={24} />
                </button>
              ))}
              {requiredBallType === 'color' && phase === 'colors' && nextInOrder && (() => {
                const def = BALL_DEFS.find(b => b.name === nextInOrder);
                if (!def) return null;
                return (
                  <button
                    onClick={() => { onDurak(nextInOrder); setShowDurakPicker(false); }}
                    disabled={disabled}
                    className="py-3 rounded-xl font-bold active:scale-90 transition-all min-h-[48px] bg-white/10 border-2 border-white/15"
                  >
                    <BallImage color={def.ballColor} size={24} />
                  </button>
                );
              })()}
            </div>
            <button
              onClick={() => setShowDurakPicker(false)}
              className="w-full py-2 bg-white/5 rounded-xl text-xs text-gray-500 active:scale-95 transition-all"
            >
              Отмена
            </button>
          </div>
        ) : (
          <div className="flex gap-5 justify-center pt-2">
            {/* Фол */}
            <button
              onClick={() => { setShowFoulPicker(true); setShowDurakPicker(false); }}
              disabled={disabled}
              className="flex flex-col items-center gap-1 group"
            >
              <span className="w-16 h-16 rounded-full bg-accent-ruby/15 border-2 border-accent-ruby/30 text-accent-ruby font-bold active:scale-90 disabled:opacity-30 transition-all flex items-center justify-center group-active:scale-90">
                <IconImage name="fail" size={26} />
              </span>
              <span className="text-[10px] text-accent-ruby/60 font-medium">Фол</span>
            </button>
            {/* Дурак */}
            <button
              onClick={handleDurakClick}
              disabled={disabled}
              className="flex flex-col items-center gap-1 group"
            >
              <span className="w-16 h-16 rounded-full bg-accent-gold/15 border-2 border-accent-gold/30 text-accent-gold font-bold active:scale-90 disabled:opacity-30 transition-all flex items-center justify-center group-active:scale-90">
                <IconImage name="fool" size={26} />
              </span>
              <span className="text-[10px] text-accent-gold/60 font-medium">Дурак</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

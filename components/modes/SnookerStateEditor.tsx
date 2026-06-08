'use client';
import { useState } from 'react';
import { BALL_DEFS, COLOR_NAMES_RU } from '@/lib/constants';
import { BallImage } from '@/components/BallImage';
import { IconImage } from '@/components/IconImage';

interface SnookerStateEditorProps {
  reds: number;
  colors: Record<string, number>;
  phase: 'normal' | 'colors';
  scoreLeft: number;
  scoreRight: number;
  onApply: (reds: number, colors: Record<string, number>, scoreLeft: number, scoreRight: number) => void;
  onClose: () => void;
  disabled: boolean;
}

export function SnookerStateEditor({
  reds: initialReds,
  colors: initialColors,
  phase,
  scoreLeft: initialScoreLeft,
  scoreRight: initialScoreRight,
  onApply,
  onClose,
  disabled,
}: SnookerStateEditorProps) {
  const [reds, setReds] = useState(initialReds);
  const [colors, setColors] = useState({ ...initialColors });
  const [scoreLeft, setScoreLeft] = useState(initialScoreLeft);
  const [scoreRight, setScoreRight] = useState(initialScoreRight);

  const toggleColor = (name: string) => {
    setColors((prev) => ({ ...prev, [name]: prev[name] === 1 ? 0 : 1 }));
  };

  const colorDefs = BALL_DEFS.filter((b) => b.name !== 'red');

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full sm:max-w-sm bg-felt-800 rounded-t-2xl sm:rounded-2xl border border-white/10 p-5 space-y-4 animate-slide-up max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <IconImage name="sections" size={18} />
            Ручная настройка
          </h3>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-gray-400 active:scale-90 transition-all"
          >
            <IconImage name="cancel" size={12} />
          </button>
        </div>

        {/* Reds */}
        <div className="bg-white/5 rounded-xl p-3 flex items-center justify-between">
          <span className="inline-flex items-center gap-2">
            <BallImage color="red" size={20} />
            <span className="text-sm text-gray-300">Красные</span>
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setReds(Math.max(0, reds - 1))}
              disabled={disabled || reds <= 0}
              className="w-8 h-8 rounded-full bg-white/10 border border-white/15 text-white font-bold active:scale-90 disabled:opacity-30 transition-all"
            >
              −
            </button>
            <span className="text-lg font-bold text-white w-8 text-center tabular-nums">{reds}</span>
            <button
              onClick={() => setReds(Math.min(15, reds + 1))}
              disabled={disabled || reds >= 15}
              className="w-8 h-8 rounded-full bg-white/10 border border-white/15 text-white font-bold active:scale-90 disabled:opacity-30 transition-all"
            >
              +
            </button>
          </div>
        </div>

        {/* Colors */}
        <div className="space-y-2">
          <div className="text-xs text-gray-500">Цветные на столе:</div>
          {colorDefs.map((def) => (
            <button
              key={def.name}
              onClick={() => toggleColor(def.name)}
              disabled={disabled}
              className={`w-full flex items-center justify-between py-2.5 px-3 rounded-xl transition-all active:scale-[0.98] ${
                colors[def.name] === 1
                  ? 'bg-white/10 border border-white/15'
                  : 'bg-white/5 border border-white/5 opacity-50'
              }`}
            >
              <span className="inline-flex items-center gap-2">
                <BallImage color={def.ballColor} size={18} />
                <span className="text-sm text-gray-300">{COLOR_NAMES_RU[def.name]}</span>
              </span>
              <span className={`text-xs font-medium ${colors[def.name] === 1 ? 'text-accent-emerald' : 'text-gray-600'}`}>
                {colors[def.name] === 1 ? 'на столе' : 'забит'}
              </span>
            </button>
          ))}
        </div>

        {/* Scores */}
        <div className="space-y-2">
          <div className="text-xs text-gray-500">Счёт игроков:</div>
          <div className="bg-white/5 rounded-xl p-3 flex items-center justify-between">
            <span className="text-sm text-accent-sapphire font-medium">Левый</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setScoreLeft(Math.max(0, scoreLeft - 1))}
                disabled={disabled || scoreLeft <= 0}
                className="w-8 h-8 rounded-full bg-white/10 border border-white/15 text-white font-bold active:scale-90 disabled:opacity-30 transition-all"
              >−</button>
              <span className="text-lg font-bold text-white w-12 text-center tabular-nums">{scoreLeft}</span>
              <button
                onClick={() => setScoreLeft(scoreLeft + 1)}
                disabled={disabled}
                className="w-8 h-8 rounded-full bg-white/10 border border-white/15 text-white font-bold active:scale-90 disabled:opacity-30 transition-all"
              >+</button>
            </div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 flex items-center justify-between">
            <span className="text-sm text-accent-ruby font-medium">Правый</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setScoreRight(Math.max(0, scoreRight - 1))}
                disabled={disabled || scoreRight <= 0}
                className="w-8 h-8 rounded-full bg-white/10 border border-white/15 text-white font-bold active:scale-90 disabled:opacity-30 transition-all"
              >−</button>
              <span className="text-lg font-bold text-white w-12 text-center tabular-nums">{scoreRight}</span>
              <button
                onClick={() => setScoreRight(scoreRight + 1)}
                disabled={disabled}
                className="w-8 h-8 rounded-full bg-white/10 border border-white/15 text-white font-bold active:scale-90 disabled:opacity-30 transition-all"
              >+</button>
            </div>
          </div>
        </div>

        {/* Phase info */}
        <div className="text-center text-xs text-gray-500">
          Фаза: {phase === 'normal' ? 'нормальная' : 'цветная'}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            disabled={disabled}
            className="flex-1 py-2.5 bg-white/5 rounded-xl text-sm text-gray-400 font-medium active:scale-95 disabled:opacity-30 transition-all"
          >
            Отмена
          </button>
          <button
            onClick={() => onApply(reds, colors, scoreLeft, scoreRight)}
            disabled={disabled}
            className="flex-1 py-2.5 bg-accent-emerald/20 border border-accent-emerald/30 rounded-xl text-sm text-accent-emerald font-bold active:scale-95 disabled:opacity-30 transition-all"
          >
            Применить
          </button>
        </div>
      </div>
    </div>
  );
}

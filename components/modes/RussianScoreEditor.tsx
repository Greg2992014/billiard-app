'use client';
import { useState } from 'react';
import { IconImage } from '@/components/IconImage';

interface RussianScoreEditorProps {
  scoreLeft: number;
  scoreRight: number;
  ballsLeft: number;
  ballsRight: number;
  target: number;
  onApply: (scoreLeft: number, scoreRight: number, ballsLeft: number, ballsRight: number, target: number) => void;
  onClose: () => void;
  disabled: boolean;
}

const TARGET_PRESETS = [6, 8, 10, 12, 16];

export function RussianScoreEditor({
  scoreLeft: initialLeft,
  scoreRight: initialRight,
  ballsLeft: initialBallsLeft,
  ballsRight: initialBallsRight,
  target: initialTarget,
  onApply,
  onClose,
  disabled,
}: RussianScoreEditorProps) {
  const [scoreLeft, setScoreLeft] = useState(initialLeft);
  const [scoreRight, setScoreRight] = useState(initialRight);
  const [ballsLeft, setBallsLeft] = useState(initialBallsLeft);
  const [ballsRight, setBallsRight] = useState(initialBallsRight);
  const [target, setTarget] = useState(initialTarget);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full sm:max-w-sm bg-felt-800 rounded-t-2xl sm:rounded-2xl border border-white/10 p-5 space-y-4 animate-slide-up max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <IconImage name="sections" size={18} />
            Настройка (Русский)
          </h3>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-gray-400 active:scale-90 transition-all"
          >
            <IconImage name="cancel" size={12} />
          </button>
        </div>

        {/* Balls pocketed */}
        <div className="space-y-2">
          <div className="text-xs text-gray-500">Забито шаров:</div>
          <div className="bg-white/5 rounded-xl p-3 flex items-center justify-between">
            <span className="text-sm text-accent-sapphire font-medium">Левый</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setBallsLeft(Math.max(0, ballsLeft - 1))}
                disabled={disabled || ballsLeft <= 0}
                className="w-8 h-8 rounded-full bg-white/10 border border-white/15 text-white font-bold active:scale-90 disabled:opacity-30 transition-all"
              >−</button>
              <span className="text-lg font-bold text-white w-12 text-center tabular-nums">{ballsLeft}</span>
              <button
                onClick={() => setBallsLeft(ballsLeft + 1)}
                disabled={disabled}
                className="w-8 h-8 rounded-full bg-white/10 border border-white/15 text-white font-bold active:scale-90 disabled:opacity-30 transition-all"
              >+</button>
            </div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 flex items-center justify-between">
            <span className="text-sm text-accent-ruby font-medium">Правый</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setBallsRight(Math.max(0, ballsRight - 1))}
                disabled={disabled || ballsRight <= 0}
                className="w-8 h-8 rounded-full bg-white/10 border border-white/15 text-white font-bold active:scale-90 disabled:opacity-30 transition-all"
              >−</button>
              <span className="text-lg font-bold text-white w-12 text-center tabular-nums">{ballsRight}</span>
              <button
                onClick={() => setBallsRight(ballsRight + 1)}
                disabled={disabled}
                className="w-8 h-8 rounded-full bg-white/10 border border-white/15 text-white font-bold active:scale-90 disabled:opacity-30 transition-all"
              >+</button>
            </div>
          </div>
        </div>

        {/* Target */}
        <div className="space-y-2">
          <div className="text-xs text-gray-500">Цель (до скольких):</div>
          <div className="flex gap-2 flex-wrap">
            {TARGET_PRESETS.map((t) => (
              <button
                key={t}
                onClick={() => setTarget(t)}
                disabled={disabled}
                className={`flex-1 min-w-[40px] py-2 rounded-xl text-sm font-bold active:scale-90 disabled:opacity-30 transition-all ${
                  target === t
                    ? 'bg-accent-emerald/20 border border-accent-emerald/30 text-accent-emerald'
                    : 'bg-white/5 border border-white/10 text-gray-400'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Scores */}
        <div className="space-y-2">
          <div className="text-xs text-gray-500">Счёт:</div>
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
            onClick={() => onApply(scoreLeft, scoreRight, ballsLeft, ballsRight, target)}
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

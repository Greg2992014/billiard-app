'use client';
import { useState } from 'react';
import { IconImage } from '@/components/IconImage';

interface PoolScoreEditorProps {
  scoreLeft: number;
  scoreRight: number;
  pocketedSolids: number;
  pocketedStripes: number;
  onApply: (scoreLeft: number, scoreRight: number, pocketedSolids: number, pocketedStripes: number) => void;
  onClose: () => void;
  disabled: boolean;
}

export function PoolScoreEditor({
  scoreLeft: initialLeft,
  scoreRight: initialRight,
  pocketedSolids: initialSolids,
  pocketedStripes: initialStripes,
  onApply,
  onClose,
  disabled,
}: PoolScoreEditorProps) {
  const [scoreLeft, setScoreLeft] = useState(initialLeft);
  const [scoreRight, setScoreRight] = useState(initialRight);
  const [pocketedSolids, setPocketedSolids] = useState(initialSolids);
  const [pocketedStripes, setPocketedStripes] = useState(initialStripes);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full sm:max-w-sm bg-felt-800 rounded-t-2xl sm:rounded-2xl border border-white/10 p-5 space-y-4 animate-slide-up max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <IconImage name="sections" size={18} />
            Настройка (Пул)
          </h3>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-gray-400 active:scale-90 transition-all"
          >
            <IconImage name="cancel" size={12} />
          </button>
        </div>

        {/* Pocketed balls */}
        <div className="space-y-2">
          <div className="text-xs text-gray-500">Забито шаров:</div>
          <div className="bg-white/5 rounded-xl p-3 flex items-center justify-between">
            <span className="text-sm text-accent-sapphire font-medium">Сплошные</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setPocketedSolids(Math.max(0, pocketedSolids - 1))}
                disabled={disabled || pocketedSolids <= 0}
                className="w-8 h-8 rounded-full bg-white/10 border border-white/15 text-white font-bold active:scale-90 disabled:opacity-30 transition-all"
              >−</button>
              <span className="text-lg font-bold text-white w-12 text-center tabular-nums">{pocketedSolids}</span>
              <button
                onClick={() => setPocketedSolids(Math.min(7, pocketedSolids + 1))}
                disabled={disabled || pocketedSolids >= 7}
                className="w-8 h-8 rounded-full bg-white/10 border border-white/15 text-white font-bold active:scale-90 disabled:opacity-30 transition-all"
              >+</button>
            </div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 flex items-center justify-between">
            <span className="text-sm text-accent-ruby font-medium">Полосатые</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setPocketedStripes(Math.max(0, pocketedStripes - 1))}
                disabled={disabled || pocketedStripes <= 0}
                className="w-8 h-8 rounded-full bg-white/10 border border-white/15 text-white font-bold active:scale-90 disabled:opacity-30 transition-all"
              >−</button>
              <span className="text-lg font-bold text-white w-12 text-center tabular-nums">{pocketedStripes}</span>
              <button
                onClick={() => setPocketedStripes(Math.min(7, pocketedStripes + 1))}
                disabled={disabled || pocketedStripes >= 7}
                className="w-8 h-8 rounded-full bg-white/10 border border-white/15 text-white font-bold active:scale-90 disabled:opacity-30 transition-all"
              >+</button>
            </div>
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
            onClick={() => onApply(scoreLeft, scoreRight, pocketedSolids, pocketedStripes)}
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

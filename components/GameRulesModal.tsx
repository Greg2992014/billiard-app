'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { GAME_RULES_DATA, type GameRules } from '@/components/GameRulesData';
import { BallImage } from '@/components/BallImage';
import { IconImage } from '@/components/IconImage';

/**
 * Parses rules text containing `<ball:COLOR>` and `<icon:NAME>` tokens,
 * rendering them as inline BallImage / IconImage components.
 */
function renderRulesText(text: string): React.ReactNode {
  const parts = text.split(/(<ball:\w+>|<icon:\w+>)/g);
  return parts.map((part, i) => {
    const ballMatch = part.match(/^<ball:(\w+)>$/);
    if (ballMatch) return <BallImage key={i} color={ballMatch[1]} size={16} />;
    const iconMatch = part.match(/^<icon:(\w+)>$/);
    if (iconMatch) return <IconImage key={i} name={iconMatch[1] as any} size={16} />;
    return part;
  });
}

function RulesIcon({ gameType }: { gameType: 'pool' | 'russian' | 'snooker' }) {
  if (gameType === 'pool') return <IconImage name="pool_mode" size={36} />;
  if (gameType === 'russian') return <IconImage name="piramid" size={36} />;
  return <IconImage name="start" size={36} />;
}

interface GameRulesModalProps {
  /** Режим игры, для которого показывать правила */
  gameType: 'pool' | 'russian' | 'snooker';
  /** Управление видимостью */
  isOpen: boolean;
  /** Закрыть модалку */
  onClose: () => void;
}

export function GameRulesModal({ gameType, isOpen, onClose }: GameRulesModalProps) {
  const rules: GameRules | undefined = GAME_RULES_DATA.find((r) => r.id === gameType);
  const panelRef = useRef<HTMLDivElement>(null);
  const prevFocusRef = useRef<HTMLElement | null>(null);

  // Запоминаем сфокусированный элемент перед открытием / восстанавливаем после закрытия
  useEffect(() => {
    if (isOpen) {
      prevFocusRef.current = document.activeElement as HTMLElement;
      setTimeout(() => panelRef.current?.focus(), 50);
    } else if (prevFocusRef.current) {
      prevFocusRef.current.focus();
      prevFocusRef.current = null;
    }
  }, [isOpen]);

  // Закрытие по Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Блокировка скролла body при открытой модалке
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  if (!isOpen || !rules) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label={`Правила: ${rules.label}`}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        className="relative w-full max-w-lg mx-auto max-h-[85dvh] bg-felt-900 rounded-t-3xl border-t border-white/10 shadow-2xl flex flex-col outline-none animate-slide-up"
      >
        {/* ————— Драг-хендл ————— */}
        <div className="flex justify-center pt-2 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* ————— Шапка ————— */}
        <div className="flex items-center justify-between px-6 pb-3 shrink-0">
          <div className="flex items-center gap-3">
            <RulesIcon gameType={rules.id} />
            <div>
              <h2 className="text-lg font-extrabold text-white">{rules.label}</h2>
              <p className="text-[11px] text-gray-400 leading-tight">{rules.summary}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 active:scale-90 transition-all shrink-0"
            aria-label="Закрыть"
          >
            <IconImage name="wrong" size={16} />
          </button>
        </div>

        {/* ————— Секции правил (скролл) ————— */}
        <div className="overflow-y-auto px-6 pb-6 space-y-5 no-scrollbar">
          {rules.sections.map((section, idx) => (
            <div key={idx} className="space-y-2">
              <h3 className="text-sm font-bold text-accent-gold">{section.title}</h3>
              <ul className="space-y-1.5">
                {section.items.map((item, i) => {
                  const isSubItem = item.startsWith('•') || item.startsWith('   ');
                  return (
                    <li
                      key={i}
                      className={`text-sm leading-relaxed ${
                        isSubItem ? 'text-gray-400 pl-4' : 'text-gray-200'
                      }`}
                    >
                      {renderRulesText(item)}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          {/* ————— Футер-предупреждение для Пула ————— */}
          {gameType === 'pool' && (
            <div className="mt-2 p-3 bg-accent-ruby/10 border border-accent-ruby/20 rounded-xl">
              <p className="text-[11px] text-accent-ruby/80 font-medium">
                <span className="inline-flex items-center gap-1"><IconImage name="fail" size={14} />Внимание:</span> преждевременное забитие чёрного шара (№8) ведёт к
                мгновенному поражению. Убедитесь, что все 7 шаров вашей группы забиты!
              </p>
            </div>
          )}

          {/* ————— Футер-подсказка для Снукера ————— */}
          {gameType === 'snooker' && (
            <div className="mt-2 p-3 bg-accent-sapphire/10 border border-accent-sapphire/20 rounded-xl">
              <p className="text-[11px] text-accent-sapphire/80 font-medium">
                <span className="inline-flex items-center gap-1"><IconImage name="info" size={14} />Помните:</span> в нормальной фазе цветные шары выставляются обратно на
                стол. В фазе цветных шары остаются забитыми — порядок строгий!
              </p>
            </div>
          )}

          <div className="h-2" />
        </div>
      </div>
    </div>
  );
}

/**
 * Кнопка-триггер для открытия правил из любого места интерфейса.
 */
interface RulesButtonProps {
  gameType: 'pool' | 'russian' | 'snooker';
  /** Необязательный класс для кастомизации */
  className?: string;
}

export function RulesButton({ gameType, className = '' }: RulesButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] text-gray-400 font-medium hover:text-white hover:border-white/20 active:scale-95 transition-all ${className}`}
        aria-label="Правила игры"
      >
        <IconImage name="info" size={14} />
        Правила
      </button>
      <GameRulesModal gameType={gameType} isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
}

'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { BallImage } from '@/components/BallImage';
import { IconImage } from '@/components/IconImage';
import { GameTimer } from '@/components/GameTimer';
import { HistoryLog } from '@/components/HistoryLog';
import { RulesButton } from '@/components/GameRulesModal';
import { RussianControls } from '@/components/modes/RussianControls';
import { PoolControls } from '@/components/modes/PoolControls';
import { SnookerControls } from '@/components/modes/SnookerControls';
import type { SnookerState, PoolState, RussianState } from '@/lib/gameLogic';
import { POLL_INTERVAL_MS } from '@/lib/constants';
import type { HistoryLogMove } from '@/lib/types';

type GameStateUnion = SnookerState | PoolState | RussianState;

interface ApiGameState {
  roomId: string;
  gameType: string;
  status: string;
  currentTurn: 'left' | 'right';
  winnerId?: number;
  players: {
    left: { id: number; login: string; score: number };
    right: { id: number; login: string; score: number };
  };
  moves: Record<string, unknown>[];
  gameState?: GameStateUnion;
  turn_started_at?: string;
  game_started_at?: string;
}

const CONFETTI_COLORS = ['#f0b90b', '#ef4444', '#3b82f6', '#10b981', '#a855f7', '#f97316', '#ec4899', '#14b8a6'];

function fireConfetti() {
  for (let i = 0; i < 50; i++) {
    setTimeout(() => {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.left = Math.random() * 100 + '%';
      piece.style.backgroundColor = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
      piece.style.width = (6 + Math.random() * 8) + 'px';
      piece.style.height = (6 + Math.random() * 8) + 'px';
      piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
      piece.style.animationDuration = (2 + Math.random() * 3) + 's';
      piece.style.animationDelay = Math.random() * 0.5 + 's';
      document.body.appendChild(piece);
      setTimeout(() => piece.remove(), 4000);
    }, i * 40);
  }
}

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;
  const [gameState, setGameState] = useState<ApiGameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [gameStartTime, setGameStartTime] = useState<number>(Date.now());
  const [turnStartTime, setTurnStartTime] = useState<number>(Date.now());
  const [showHistory, setShowHistory] = useState(false);
  const [scoreAnimLeft, setScoreAnimLeft] = useState(false);
  const [scoreAnimRight, setScoreAnimRight] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const prevScoreLeft = useRef(0);
  const prevScoreRight = useRef(0);
  const processingRef = useRef(false);
  const confettiFired = useRef(false);

  const fetchGameState = useCallback(async () => {
    try {
      const res = await fetch(`/api/game/${roomId}`);
      const data = await res.json();
      if (!res.ok) return;
      setGameState((prev) => {
        if (prev) {
          const leftScore = data.players?.left?.score ?? 0;
          const rightScore = data.players?.right?.score ?? 0;
          if (leftScore > prevScoreLeft.current) setScoreAnimLeft(true);
          if (rightScore > prevScoreRight.current) setScoreAnimRight(true);
          prevScoreLeft.current = leftScore;
          prevScoreRight.current = rightScore;
        }
        return data;
      });
      if (data.game_started_at) setGameStartTime(new Date(data.game_started_at).getTime());
      if (data.turn_started_at) setTurnStartTime(new Date(data.turn_started_at).getTime());
    } catch (_) { /* polling silence */ }
    finally {
      if (loading) setLoading(false);
    }
  }, [roomId, loading]);

  useEffect(() => {
    if (scoreAnimLeft) { const t = setTimeout(() => setScoreAnimLeft(false), 400); return () => clearTimeout(t); }
  }, [scoreAnimLeft]);
  useEffect(() => {
    if (scoreAnimRight) { const t = setTimeout(() => setScoreAnimRight(false), 400); return () => clearTimeout(t); }
  }, [scoreAnimRight]);

  useEffect(() => {
    if (!roomId) return;
    if (gameState?.status === 'finished') return;
    fetchGameState();
    const interval = setInterval(fetchGameState, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [roomId, fetchGameState, gameState?.status]);

  useEffect(() => {
    if (gameState?.status === 'finished' && !confettiFired.current) {
      confettiFired.current = true;
      fireConfetti();
    }
  }, [gameState?.status]);

  const handleMove = async (payload: Record<string, unknown>) => {
    if (processingRef.current) return;
    processingRef.current = true;
    setProcessing(true);
    try {
      const res = await fetch(`/api/game/${roomId}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        const ns = data.newState;
        setGameState((prev) => prev ? {
          ...prev,
          status: ns.status,
          currentTurn: ns.currentTurn,
          winnerId: ns.winnerId,
          gameState: ns.gameState,
          players: {
            left: { ...prev.players.left, score: ns.totalShotsLeft },
            right: { ...prev.players.right, score: ns.totalShotsRight },
          },
        } : prev);
      } else {
        setErrorMsg(data.error);
      }
    } catch (_) {
      setErrorMsg('Ошибка сети. Попробуйте ещё раз.');
    } finally {
      processingRef.current = false;
      setProcessing(false);
    }
  };

  const getPlayerId = (p: 'left' | 'right') =>
    p === 'left' ? gameState!.players.left.id : gameState!.players.right.id;

  const ct = gameState?.currentTurn ?? 'left';
  const opp = ct === 'left' ? 'right' : 'left';

  const handleShot = (shotType?: string, ballColor?: string) =>
    handleMove({
      playerId: getPlayerId(ct),
      moveType: 'shot',
      ...(gameState?.gameType === 'pool' ? { shotType } : {}),
      ...(gameState?.gameType === 'snooker' ? { ballColor } : {}),
    });

  const handleSwitchTurn = () =>
    handleMove({ playerId: getPlayerId(ct), moveType: 'turn_switch' });

  const handleFoul = (foulPoints?: number) =>
    handleMove({ playerId: getPlayerId(ct), moveType: 'foul', foulPoints });

  const handleDurak = (ballColor?: string) =>
    handleMove({ playerId: getPlayerId(ct), moveType: 'durak', ballColor });

  const handleOpponentBall = () => {
    if (gameState!.gameState?.type !== 'pool') return;
    const poolState = gameState!.gameState as PoolState;
    const oppGroup = poolState.playerGroup[opp];
    if (oppGroup === null) return;
    handleMove({ playerId: getPlayerId(ct), moveType: 'shot', shotType: oppGroup });
  };

  const handleUndo = async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    setProcessing(true);
    try {
      const res = await fetch(`/api/game/${roomId}/undo`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setGameState((prev) => prev ? {
          ...prev,
          status: data.status,
          currentTurn: data.currentTurn,
          winnerId: data.winnerId,
          gameState: data.gameState,
          players: data.players,
          moves: data.moves,
          turn_started_at: data.turn_started_at,
        } : prev);
      } else {
        setErrorMsg(data.error);
      }
    } catch (_) {
      setErrorMsg('Ошибка сети. Попробуйте ещё раз.');
    } finally {
      processingRef.current = false;
      setProcessing(false);
    }
  };

  const handlePlayAgain = async () => {
    const gt = gameState!.gameType;
    const leftLogin = gameState!.players.left.login;
    const rightLogin = gameState!.players.right.login;
    const res = await fetch('/api/game/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameType: gt, playerLeftLogin: leftLogin, playerRightLogin: rightLogin }),
    });
    const data = await res.json();
    if (res.ok) {
      router.push(`/game/${data.roomId}`);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-dvh bg-felt-900">
      <div className="text-center animate-pulse">
        <div className="mb-3 flex justify-center"><IconImage name="loading" size={48} /></div>
        <div className="text-gray-400">Загрузка игры...</div>
      </div>
    </div>
  );
  if (!gameState) return (
    <div className="flex items-center justify-center min-h-dvh bg-felt-900">
      <div className="text-center">
        <div className="mb-3 flex justify-center"><IconImage name="not_found" size={40} /></div>
        <div className="text-gray-400">Игра не найдена</div>
        <Link href="/dashboard" className="mt-4 inline-flex items-center gap-1 text-accent-emerald text-sm"><IconImage name="back" size={14} />В меню</Link>
      </div>
    </div>
  );

  const { gameType, currentTurn, status } = gameState;
  const players = gameState.players;
  if (!players) return null;
  const modeState = gameState.gameState;

  const snookerState = modeState?.type === 'snooker' ? modeState as SnookerState : null;
  const poolState = modeState?.type === 'pool' ? modeState as PoolState : null;
  const russianState = modeState?.type === 'russian' ? modeState as RussianState : null;

  // ========== Player Info — responsive: compact row on mobile, full column on desktop ==========
  const PlayerInfo = ({ side }: { side: 'left' | 'right' }) => {
    const player = players[side];
    const isActive = currentTurn === side && status === 'active';
    const scoreAnim = side === 'left' ? scoreAnimLeft : scoreAnimRight;

    return (
      <div className="flex sm:flex-col items-center gap-2 sm:gap-0 sm:px-2 sm:py-4">
        {/* Avatar */}
        <div className={`w-9 h-9 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-sm sm:text-xl font-bold shrink-0 transition-all duration-500 ${
          isActive
            ? 'bg-accent-gold/20 text-accent-gold ring-2 ring-accent-gold/50 turn-indicator'
            : 'bg-white/5 text-gray-400'
        }`}>
          {player.login.charAt(0).toUpperCase()}
        </div>

        {/* Name + Score — stacked vertically on desktop, inline on mobile */}
        <div className="flex sm:flex-col items-center gap-1.5 sm:gap-0 min-w-0">
          <div className={`text-xs sm:text-sm font-semibold truncate max-w-[60px] sm:max-w-[80px] text-center transition-colors ${
            isActive ? 'text-white' : 'text-gray-400'
          }`}>
            {player.login}
          </div>
          <div className={`text-lg sm:text-4xl font-extrabold transition-all duration-300 leading-none ${
            isActive ? 'text-white' : 'text-gray-500'
          } ${scoreAnim ? 'animate-score-pop text-accent-gold' : ''}`}>
            {player.score}
          </div>
        </div>

        {/* Desktop-only label */}
        <div className="hidden sm:block text-[10px] text-gray-500 mt-0.5 uppercase tracking-wider">
          {gameType === 'snooker' ? 'очки' : 'забито'}
        </div>

        {/* Desktop-only mode-specific info */}
        <div className="hidden sm:block mt-3 w-full">
          {gameType === 'russian' && (
            <div className="space-y-1">
              <div className="flex justify-center gap-0.5 flex-wrap">
                {Array.from({ length: russianState?.target ?? 8 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-all ${
                      i < (side === 'left' ? (russianState?.ballsLeft ?? 0) : (russianState?.ballsRight ?? 0))
                        ? 'bg-accent-gold shadow-sm shadow-accent-gold/50'
                        : 'bg-white/10'
                    }`}
                  />
                ))}
              </div>
              <div className="text-center text-[9px] text-gray-500">
                {side === 'left' ? russianState?.ballsLeft ?? 0 : russianState?.ballsRight ?? 0}/{russianState?.target ?? 8}
              </div>
            </div>
          )}

          {gameType === 'pool' && (() => {
            const leftGroup = poolState?.playerGroup.left ?? null;
            const rightGroup = poolState?.playerGroup.right ?? null;
            const myGroup = side === 'left' ? leftGroup : rightGroup;
            const myPocketed = (() => {
              if (myGroup === 'solid') return poolState?.pocketedSolids ?? 0;
              if (myGroup === 'stripe') return poolState?.pocketedStripes ?? 0;
              return 0;
            })();

            if (!myGroup) return null;
            return (
              <div className="text-center">
                <div className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold ${
                  myGroup === 'solid' ? 'bg-accent-sapphire/20 text-accent-sapphire' : 'bg-accent-ruby/20 text-accent-ruby'
                }`}>
                  {myGroup === 'solid' ? 'Сплошные' : 'Полосатые'}
                </div>
                <div className="text-[10px] text-gray-400 mt-1">
                  Забито: <span className="font-bold text-white">{myPocketed}</span>/7
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    );
  };

  // ========== Finished Screen ==========
  if (status === 'finished') {
    const winner = gameState.winnerId === players.left.id ? players.left : (gameState.winnerId === players.right.id ? players.right : null);
    return (
      <div className="flex flex-col min-h-dvh bg-gradient-to-b from-felt-800 via-felt-900 to-felt-800 items-center justify-center px-4 safe-bottom">
        <div className="text-center animate-bounce-once">
          <div className="mb-4 flex justify-center"><IconImage name="award" size={64} /></div>
          <div className="text-xs text-accent-gold uppercase tracking-[0.2em] mb-2 font-bold">Победитель</div>
          <h1 className="text-3xl font-extrabold text-white mb-4">{winner?.login ?? 'Ничья'}</h1>
          <div className="flex items-center justify-center gap-6 mb-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-white">{players.left.score}</div>
              <div className="text-[10px] text-gray-400">{players.left.login}</div>
            </div>
            <div className="text-gray-600 font-bold">:</div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">{players.right.score}</div>
              <div className="text-[10px] text-gray-400">{players.right.login}</div>
            </div>
          </div>
          <div className="text-xs text-gray-500 mb-6">
            {gameType === 'snooker' ? 'Снукер' : gameType === 'russian' ? 'Русский бильярд' : 'Пул'}
          </div>
          <div className="flex flex-col gap-3">
            <button
              onClick={handlePlayAgain}
              className="px-8 py-3 bg-accent-emerald hover:bg-emerald-600 active:scale-95 rounded-2xl text-white font-bold text-base transition-all shadow-lg shadow-accent-emerald/20"
            >
              <span className="inline-flex items-center gap-2">
                <IconImage name="repeat" size={20} />
                <span>Сыграть ещё раз</span>
              </span>
            </button>
            <Link
              href="/dashboard"
              className="inline-block px-8 py-3 bg-white/5 border border-white/10 hover:bg-white/10 active:scale-95 rounded-2xl text-gray-300 font-bold text-base transition-all"
            >
              В меню
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ========================
  // Pool/Snooker data computation (shared between layout sections)
  // ========================
  const poolData = gameType === 'pool' ? (() => {
    const leftGroup = poolState?.playerGroup.left ?? null;
    const rightGroup = poolState?.playerGroup.right ?? null;
    const myGroup = currentTurn === 'left' ? leftGroup : rightGroup;
    const myPocketed = (() => {
      if (myGroup === 'solid') return poolState?.pocketedSolids ?? 0;
      if (myGroup === 'stripe') return poolState?.pocketedStripes ?? 0;
      return 0;
    })();
    return { leftGroup, rightGroup, myGroup, myPocketed, isBlackAllowed: myGroup !== null && myPocketed >= 7 };
  })() : null;

  const snookerData = gameType === 'snooker' ? {
    requiredBallType: snookerState?.requiredBallType ?? null,
    reds: snookerState?.reds ?? 15,
    phase: snookerState?.phase ?? 'normal',
    availableColors: snookerState?.colors ?? {
      yellow: 1, green: 1, brown: 1, blue: 1, pink: 1, black: 1
    },
  } : null;

  const russianData = gameType === 'russian' ? {
    ballsPocketed: currentTurn === 'left' ? (russianState?.ballsLeft ?? 0) : (russianState?.ballsRight ?? 0),
    target: russianState?.target ?? 8,
  } : null;

  // Shared controls rendering
  const renderControls = () => (
    <>
      {gameType === 'russian' && russianData && (
        <RussianControls
          onShot={() => handleShot()}
          onDurak={() => handleDurak()}
          disabled={processing}
          ballsPocketed={russianData.ballsPocketed}
          target={russianData.target}
        />
      )}

      {gameType === 'pool' && poolData && (
        <PoolControls
          onShot={(st) => handleShot(st)}
          onOpponentBall={handleOpponentBall}
          onDurak={() => handleDurak()}
          onEarlyBlack={() => handleShot('black')}
          disabled={processing}
          isEightAllowed={poolData.isBlackAllowed}
          myGroup={poolData.myGroup}
          myPocketed={poolData.myPocketed}
        />
      )}

      {gameType === 'snooker' && snookerData && (
        <SnookerControls
          onShot={(color) => handleShot(undefined, color)}
          onFoul={(pts) => handleFoul(pts)}
          onDurak={(color) => handleDurak(color)}
          disabled={processing}
          requiredBallType={snookerData.requiredBallType}
          reds={snookerData.reds}
          phase={snookerData.phase}
          availableColors={snookerData.availableColors}
        />
      )}
    </>
  );

  // ========== Main Layout ==========
  return (
    <div className="flex flex-col min-h-dvh bg-felt-900">
      {/* Top bar: timers */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-2 bg-black/20 border-b border-white/5 safe-top shrink-0">
        <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-gray-500">
          <IconImage name="clock" size={14} />
          <GameTimer startTime={gameStartTime} isActive={status === 'active'} />
        </div>
        <div className="flex items-center gap-2">
          <div className="text-[10px] text-gray-600 font-medium uppercase tracking-wider">
            {gameType === 'snooker' ? 'Снукер' : gameType === 'russian' ? 'Пирамида' : 'Пул'}
          </div>
          <RulesButton gameType={gameType as 'pool' | 'russian' | 'snooker'} />
        </div>
        <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-gray-500">
          <IconImage name="clock_v2" size={14} />
          <GameTimer startTime={turnStartTime} isActive={status === 'active'} />
        </div>
      </div>

      {/* Main content: responsive — stacked on mobile, 3-column on desktop */}
      <div className="flex-1 flex flex-col sm:flex-row min-h-0">

        {/* ---- MOBILE: Player info row (hidden on sm+) ---- */}
        <div className="sm:hidden shrink-0">
          <div className="flex border-b border-white/5 bg-black/10">
            <div className={`flex-1 flex justify-center py-2 transition-all duration-500 ${
              currentTurn === 'left' ? 'bg-accent-sapphire/10' : ''
            }`}>
              <PlayerInfo side="left" />
            </div>
            <div className="w-px bg-white/5" />
            <div className={`flex-1 flex justify-center py-2 transition-all duration-500 ${
              currentTurn === 'right' ? 'bg-accent-ruby/10' : ''
            }`}>
              <PlayerInfo side="right" />
            </div>
          </div>

          {/* Active turn indicator */}
          <div className="text-center py-2 bg-black/5">
            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold ${
              currentTurn === 'left' ? 'bg-accent-sapphire/10 text-accent-sapphire' : 'bg-accent-ruby/10 text-accent-ruby'
            }`}>
              <span className={`w-2.5 h-2.5 rounded-full ${
                currentTurn === 'left' ? 'bg-accent-sapphire' : 'bg-accent-ruby'
              } animate-pulse`} />
              Ход: {players[currentTurn].login}
            </div>
          </div>
        </div>

        {/* ---- DESKTOP: Left player panel (hidden below sm) ---- */}
        <div className={`hidden sm:flex sm:w-[25%] flex-col justify-start pt-8 transition-all duration-500 ${
          currentTurn === 'left'
            ? 'bg-gradient-to-b from-accent-sapphire/10 to-transparent'
            : ''
        }`}>
          <PlayerInfo side="left" />
        </div>

        {/* ---- Controls: shared between mobile (full-width) and desktop (center column) ---- */}
        <div className="flex-1 flex flex-col items-center min-w-0">
          {/* Desktop turn indicator */}
          <div className="hidden sm:block pt-3 pb-2 text-center shrink-0">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold ${
              currentTurn === 'left' ? 'bg-accent-sapphire/10 text-accent-sapphire' : 'bg-accent-ruby/10 text-accent-ruby'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                currentTurn === 'left' ? 'bg-accent-sapphire' : 'bg-accent-ruby'
              } animate-pulse`} />
              {players[currentTurn].login}
            </div>
          </div>

          {/* Scrollable controls area */}
          <div className="flex-1 overflow-y-auto px-3 sm:px-3 pb-2 w-full flex flex-col items-center justify-center gap-3">
            {/* Mode-specific controls */}
            <div className="w-full sm:max-w-sm">
              {renderControls()}
            </div>

            {/* Turn Switch */}
            <div className="w-full sm:max-w-sm pt-2">
              <button
                onClick={handleSwitchTurn}
                disabled={processing || status !== 'active'}
                className="w-full py-5 sm:py-6 bg-accent-gold/15 border-2 border-accent-gold/40 rounded-2xl flex items-center justify-center gap-3 text-accent-gold active:scale-95 disabled:opacity-30 disabled:active:scale-100 transition-all min-h-[64px] sm:min-h-[72px] hover:bg-accent-gold/20 shadow-lg shadow-accent-gold/5"
              >
                <span className="inline-flex items-center gap-2">
                  <IconImage name="repeat" size={24} />
                  <span>Смена хода</span>
                </span>
              </button>
              <div className="text-center mt-1.5">
                <span className="text-[10px] text-gray-600">Промах / передача хода</span>
              </div>
            </div>
          </div>
        </div>

        {/* ---- DESKTOP: Right player panel (hidden below sm) ---- */}
        <div className={`hidden sm:flex sm:w-[25%] flex-col justify-start pt-8 transition-all duration-500 ${
          currentTurn === 'right'
            ? 'bg-gradient-to-b from-accent-ruby/10 to-transparent'
            : ''
        }`}>
          <PlayerInfo side="right" />
        </div>
      </div>

      {/* Bottom utility bar */}
      <div className="px-2 sm:px-4 py-2 border-t border-white/5 bg-black/20 flex items-center justify-center gap-2 sm:gap-3 shrink-0">
        <button
          onClick={handleUndo}
          disabled={processing || status !== 'active' || !(gameState.moves && gameState.moves.length > 0)}
          className="px-3 sm:px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs text-amber-400/70 font-medium active:scale-95 disabled:opacity-30 transition-all hover:text-amber-300"
        >
          <span className="inline-flex items-center gap-1">
            <IconImage name="cancel" size={14} />
            <span>Отмена</span>
          </span>
        </button>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="px-3 sm:px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs text-gray-400 font-medium active:scale-95 transition-all"
        >
          {showHistory ? 'Скрыть историю' : <span className="inline-flex items-center gap-1"><IconImage name="history" size={14} /><span>История</span></span>}
        </button>
        <Link
          href="/dashboard"
          className="px-3 sm:px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs text-gray-400 font-medium active:scale-95 transition-all hover:text-white hover:border-white/20"
        >
          <span className="inline-flex items-center gap-1">
            <IconImage name="exit" size={14} />
            <span>Выйти</span>
          </span>
        </Link>
      </div>

      {showHistory && (
        <div className="px-3 pb-3 safe-bottom animate-slide-up bg-black/10">
          <HistoryLog
            moves={gameState.moves as unknown as HistoryLogMove[]}
            players={players}
          />
        </div>
      )}

      {errorMsg && (
        <div
          className="fixed bottom-20 left-4 right-4 p-3 bg-red-500/90 rounded-xl text-white text-sm text-center animate-slide-up z-50"
          onClick={() => setErrorMsg(null)}
        >
          {errorMsg}
        </div>
      )}
    </div>
  );
}

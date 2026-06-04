'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { User, RecentGame } from '@/lib/types';
import { IconImage } from '@/components/IconImage';
import { GameTypeSelector } from '@/components/GameTypeSelector';
import { PlayerCreator } from '@/components/PlayerCreator';
import { RecentGames } from '@/components/RecentGames';

export default function DashboardPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [userLogin, setUserLogin] = useState<string>('');
  const [gameType, setGameType] = useState<'pool' | 'russian' | 'snooker'>('pool');
  const [rightLogin, setRightLogin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [newPlayerLogin, setNewPlayerLogin] = useState('');
  const [recentGames, setRecentGames] = useState<RecentGame[]>([]);

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    const storedLogin = localStorage.getItem('login');
    if (!storedUserId) {
      router.push('/login');
    } else {
      setUserId(storedUserId);
      setUserLogin(storedLogin ?? '');
    }
  }, [router]);

  useEffect(() => {
    fetch('/api/game/users')
      .then((r) => r.json())
      .then((data) => {
        if (data.users) setUsers(data.users);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!userId) return;
    fetch(`/api/game/recent?userId=${userId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.games) setRecentGames(data.games.slice(0, 5));
      })
      .catch(() => {});
  }, [userId]);

  const handleCreatePlayer = async () => {
    const login = newPlayerLogin.trim();
    if (!login) return;
    setError('');
    const res = await fetch('/api/game/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login }),
    });
    const data = await res.json();
    if (res.ok && data.user) {
      setUsers((prev) => [...prev, data.user]);
      setRightLogin(data.user.login);
      setNewPlayerLogin('');
    } else {
      setError(data.error || 'Ошибка создания игрока');
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await fetch('/api/game/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gameType,
        playerLeftLogin: userLogin,
        playerRightLogin: rightLogin,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      router.push(`/game/${data.roomId}`);
    } else {
      setError(data.error || 'Ошибка создания комнаты');
    }
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('login');
    router.push('/login');
  };

  if (!userId) return null;

  return (
    <div className="min-h-dvh bg-gradient-to-b from-felt-800 via-felt-900 to-felt-800 px-4 py-6">
      <div className="max-w-md mx-auto space-y-4">
        <div className="flex items-center justify-between mb-2 animate-slide-down">
          <div />
          <div className="text-center">
            <div className="mb-1 flex justify-center"><IconImage name="pool_mode" size={40} /></div>
            <h1 className="text-xl font-bold text-white">Новая игра</h1>
            <p className="text-sm text-gray-400">{userLogin}, выбери режим и соперника</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
          >
            Выйти
          </button>
        </div>

        <GameTypeSelector gameType={gameType} onSelect={setGameType} />

        <form onSubmit={handleCreateRoom} className="space-y-4">
          <div className="glass rounded-2xl p-4 animate-fade-in">
            <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">
              Левый игрок
            </label>
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
              <div className="w-8 h-8 rounded-full bg-accent-sapphire/20 flex items-center justify-center text-accent-sapphire font-bold text-sm">
                L
              </div>
              <div>
                <div className="text-sm font-bold text-white">{userLogin}</div>
                <div className="text-xs text-gray-400">Это вы</div>
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl p-4 animate-fade-in">
            <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">
              Правый игрок
            </label>
            <select
              value={rightLogin}
              onChange={(e) => setRightLogin(e.target.value)}
              className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-accent-emerald transition-all appearance-none"
              required
            >
              <option value="">— Выберите соперника —</option>
              {users
                .filter((u) => u.login !== userLogin)
                .map((u) => (
                  <option key={u.id} value={u.login}>
                    {u.login}
                  </option>
                ))}
            </select>
          </div>

          <PlayerCreator
            login={newPlayerLogin}
            onLoginChange={setNewPlayerLogin}
            onCreate={handleCreatePlayer}
          />

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !rightLogin}
            className="w-full py-4 bg-accent-emerald hover:bg-emerald-600 active:scale-[0.98] rounded-2xl text-white font-bold text-lg disabled:opacity-40 disabled:active:scale-100 transition-all shadow-lg shadow-accent-emerald/20"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Создание...
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                <IconImage name="start" size={20} />
                <span>Начать игру</span>
              </span>
            )}
          </button>
        </form>

        {recentGames.length > 0 && <RecentGames games={recentGames} />}
      </div>
    </div>
  );
}

'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { IconImage } from '@/components/IconImage';

export default function RegisterPage() {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, password }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('userId', data.userId);
        localStorage.setItem('login', data.login);
        router.push('/dashboard');
      } else {
        setError(data.error || 'Ошибка регистрации');
      }
    } catch {
      setError('Сервер недоступен. Попробуйте позже.');
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-gradient-to-b from-felt-800 via-felt-900 to-felt-800 px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm glass rounded-2xl p-6 animate-scale-in">
        <div className="text-center mb-6">
          <div className="mb-2 flex justify-center"><IconImage name="create" size={48} /></div>
          <h1 className="text-2xl font-bold text-white">Создать аккаунт</h1>
          <p className="text-sm text-gray-400 mt-1">Присоединяйся к игре</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <input
          type="text"
          placeholder="Логин"
          value={login}
          onChange={(e) => setLogin(e.target.value)}
          className="w-full p-3 bg-white/5 border border-white/10 rounded-xl mb-3 text-white placeholder-gray-500 focus:outline-none focus:border-accent-emerald focus:ring-1 focus:ring-accent-emerald/30 transition-all"
          autoComplete="username"
          required
        />
        <input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 bg-white/5 border border-white/10 rounded-xl mb-5 text-white placeholder-gray-500 focus:outline-none focus:border-accent-emerald focus:ring-1 focus:ring-accent-emerald/30 transition-all"
          autoComplete="new-password"
          required
        />

        <button
          type="submit"
          className="w-full py-3 bg-accent-emerald hover:bg-emerald-600 active:scale-[0.98] rounded-xl text-white font-bold text-lg transition-all"
        >
          Зарегистрироваться
        </button>

        <p className="mt-4 text-center text-sm text-gray-400">
          Уже есть аккаунт?{' '}
          <a href="/login" className="text-accent-sapphire font-medium hover:underline">
            Войти
          </a>
        </p>
      </form>
    </div>
  );
}

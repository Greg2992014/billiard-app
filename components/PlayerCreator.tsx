interface PlayerCreatorProps {
  login: string;
  onLoginChange: (value: string) => void;
  onCreate: () => void;
}

export function PlayerCreator({ login, onLoginChange, onCreate }: PlayerCreatorProps) {
  return (
    <div className="glass rounded-2xl p-4 animate-fade-in">
      <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
        Или создай нового игрока
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          value={login}
          onChange={(e) => onLoginChange(e.target.value)}
          placeholder="Логин нового игрока"
          className="flex-1 p-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-accent-emerald transition-all"
        />
        <button
          type="button"
          onClick={onCreate}
          disabled={!login.trim()}
          className="px-5 py-3 bg-accent-gold/20 text-accent-gold border border-accent-gold/30 rounded-xl text-sm font-bold hover:bg-accent-gold/30 active:scale-95 disabled:opacity-30 transition-all"
        >
          Создать
        </button>
      </div>
      <p className="text-[10px] text-gray-500 mt-2">Пароль: 1234 (можно будет войти потом)</p>
    </div>
  );
}

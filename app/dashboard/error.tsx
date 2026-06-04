'use client';

import { IconImage } from '@/components/IconImage';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-felt-900 safe-top safe-bottom px-4">
      <div className="text-center glass rounded-2xl p-8 max-w-sm w-full">
        <div className="mb-4 flex justify-center"><IconImage name="not_found" size={48} /></div>
        <h2 className="text-white text-lg font-semibold mb-2">
          Что-то пошло не так
        </h2>
        <p className="text-gray-400 text-sm mb-6">
          Произошла ошибка при загрузке дашборда. Попробуйте обновить страницу.
        </p>
        <button
          onClick={() => reset()}
          className="px-6 py-3 bg-accent-emerald/15 text-accent-emerald border border-accent-emerald/30 rounded-xl text-sm font-bold active:scale-95 transition-transform"
        >
          Попробовать снова
        </button>
      </div>
    </div>
  );
}

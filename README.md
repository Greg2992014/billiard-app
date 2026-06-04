# Billiard Score Tracker

> Multiplayer-приложение для подсчёта очков в бильярд (Пул, Русская пирамида, Снукер).  
> React 19 + Next.js 15 (App Router) + Turso (libSQL) — single-player-режим на одном устройстве, с обновлением в реальном времени через polling.

---

## 1. Общее описание проекта

### Назначение

Billiard Score Tracker — это веб-приложение для **двух игроков на одном устройстве**, которые по очереди вводят свои ходы в бильярдной партии. Приложение подсчитывает очки, отслеживает правила каждого режима, фиксирует историю ходов и объявляет победителя.

Приложение не эмулирует физику бильярда — игроки вводят результаты **уже совершённых ударов**.

### Основные функции

- **Три режима игры:**
  - **Пул (8-ball):** игроки забивают сплошные/полосатые, затем чёрный шар. Автоматическое распределение групп.
  - **Русская пирамида:** 8 шаров до победы. Простой счётчик.
  - **Снукер:** 15 красных + 6 цветных шаров. Правильная очерёдность «красный → цветной → красный → …», финальная фаза цветных шаров по возрастанию стоимости.
- **Ходы:** «Забил», «Фол», «Дурак», «Принудительная смена хода».
- **История ходов** с временными метками и длительностью хода.
- **Таймеры:** общий таймер партии и таймер текущего хода.
- **Confetti-анимация** при завершении игры.
- **Keep-alive** каждые 2.5 минуты для предотвращения засыпания free-tier Turso.
- **Авторизация:** простая (логин + пароль, localStorage-токен).

### Пользовательский сценарий

1. Пользователь открывает `/` → редирект на `/login`.
2. Регистрируется (`/register`) или входит (`/login`).
3. На `/dashboard` выбирает режим игры и соперника (из существующих пользователей или создаёт нового).
4. Перенаправляется в комнату `/game/[roomId]`.
5. Игроки по очереди нажимают кнопки («Забил красный», «Фол 4», «Дурак» и т.д.).
6. После каждого хода состояние обновляется через API + polling.
7. При победе отображается экран с результатом, confetti, кнопка «Сыграть ещё раз».
8. Незавершённые игры отображаются в списке «Последние игры» на дашборде.

### Ключевые модули

| Модуль | Назначение |
|--------|------------|
| `lib/gameLogic.ts` | **Чистые функции** для обработки ударов (snooker, pool, russian). Без сайд-эффектов. |
| `lib/gameService.ts` | **Сервисный слой** — связывает gameLogic с БД: получает игру, парсит state, вызывает processXxxShot, записывает ход + обновление транзакцией. |
| `lib/db.ts` | **Клиент Turso** с timeout + retry (Proxy-паттерн). Борется с холодным стартом free-tier БД. |
| `components/*` | **UI-компоненты:** GameTimer, HistoryLog, PoolControls, SnookerControls, RussianControls, KeepAlive. |
| `app/api/*` | **Next.js Route Handlers** — REST API (health, auth, game CRUD, moves). |
| `e2e/*` | **Playwright E2E-тесты** для всех трёх режимов. |

---

## 2. Полная структура проекта

```
billiard_app/
│
├── .env.local                    # Локальные переменные окружения (Turso URL + токен)
├── .gitignore                    # Игнорируемые файлы
├── next-env.d.ts                 # Сгенерированные типы Next.js
├── next.config.js                # Конфигурация Next.js
├── package.json                  # Зависимости и скрипты
├── package-lock.json             # Lock-файл npm
├── playwright.config.ts          # Конфигурация Playwright
├── postcss.config.js             # PostCSS (Tailwind + autoprefixer)
├── tailwind.config.js            # Tailwind CSS — кастомные цвета, анимации
├── tsconfig.json                 # Конфигурация TypeScript
│
├── instrumentation.ts            # Next.js instrumentation — прогрев Turso при старте
│
├── db/
│   ├── schema.sql                # DDL для users, games, moves + индексы
│   └── migrate_v2.sql            # Миграция v2 (объединение колонок, winner_id и т.д.)
│
├── lib/
│   ├── constants.ts              # Общие константы: COLOR_ORDER, BALL_DEFS, COLOR_POINTS, GAME_TYPE_NAMES, POLL_INTERVAL_MS
│   ├── db.ts                     # Turso-клиент с retry/timeout через Proxy
│   ├── gameLogic.ts              # Чистая игровая логика (initialState, processXxxShot)
│   ├── gameService.ts            # Сервис: createGame, processMove (бизнес-логика + БД)
│   ├── validation.ts             # Zod-схемы: createGameSchema, moveSchema, createUserSchema
│   └── types.ts                  # (отсутствует — типы размазаны по файлам)
│
├── app/
│   ├── globals.css               # Глобальные стили: safe-area, анимации, glass-карты, scrollbar
│   ├── layout.tsx                # Root layout: метаданные, viewport, KeepAlive, safe-areas
│   ├── page.tsx                  # Корневая страница: редирект / → /login
│   │
│   ├── login/
│   │   └── page.tsx              # Страница входа (login + password → POST /api/auth/login)
│   │
│   ├── register/
│   │   └── page.tsx              # Страница регистрации (login + password → POST /api/auth/register)
│   │
│   ├── dashboard/
│   │   └── page.tsx              # Дашборд: выбор режима, соперника, создание игрока, последние игры
│   │
│   ├── game/
│   │   └── [roomId]/
│   │       └── page.tsx          # Игровая комната: два PlayerPanel, таймеры, кнопки ходов, история, confetti
│   │
│   └── api/
│       ├── health/
│       │   └── route.ts          # GET → SELECT 1 (keep-alive)
│       │
│       ├── auth/
│       │   ├── login/route.ts    # POST → проверка логин+пароль → { userId, login }
│       │   └── register/route.ts # POST → создание пользователя → { userId, login }
│       │
│       └── game/
│           ├── create/route.ts   # POST → создание игры (валидация, upsert пользователей, nanoid-комната)
│           ├── recent/route.ts   # GET ?userId= → последние 10 игр пользователя
│           ├── users/route.ts    # GET → все пользователи / POST → создать пользователя
│           │
│           └── [roomId]/
│               ├── route.ts      # GET → полное состояние игры + ходы
│               └── move/
│                   └── route.ts  # POST → обработка хода (shot / turn_switch / foul / durak)
│
├── components/
│   ├── KeepAlive.tsx             # Client component: каждые 2.5 мин пингует /api/health
│   ├── GameTimer.tsx             # Client component: таймер с format mm:ss
│   ├── HistoryLog.tsx            # Client component: история ходов (последние 15)
│   │
│   └── modes/
│       ├── PoolControls.tsx      # Кнопки для Пула (сплошные, полосатые, чёрный, чужой шар, дурак)
│       ├── SnookerControls.tsx   # Кнопки для Снукера (красный, сетка цветов, фол-пикер, дурак-пикер)
│       └── RussianControls.tsx   # Кнопки для Русской пирамиды (индикатор шаров, забил, дурак)
│
├── e2e/
│   ├── helpers.ts               # Тестовые хелперы: registerUser, createGame, postMove, fetchGameState, уникальные имена
│   ├── pool.spec.ts             # E2E-тесты для Пула (10 тестов)
│   ├── russian.spec.ts          # E2E-тесты для Русской пирамиды (6 тестов)
│   └── snooker.spec.ts          # E2E-тесты для Снукера (8 тестов)
│
├── test-results/                 # Результаты Playwright-тестов (генерируются)
│
└── .kilo/                        # Конфигурация Kilo Code (агента)
    ├── AGENTS.md
    ├── kilo.jsonc
    └── rules/
```

### Назначение ключевых файлов

| Файл | Роль |
|------|------|
| `lib/constants.ts` | Единый источник истины для: порядка цветов, очков за шары, русских названий, названий режимов, интервала опроса. |
| `lib/gameLogic.ts` | Чистые функции `initialSnookerState`, `initialPoolState`, `initialRussianState`, `processSnookerShot`, `processPoolShot`, `processRussianShot`. Иммутабельно возвращают новое состояние. |
| `lib/gameService.ts` | Функция `processMove` (объединяет gameLogic + БД), `createGame` (upsert пользователей). Содержит `GameError`-класс. |
| `lib/db.ts` | `createClient` из `@libsql/client`, обёрнутый в Proxy с `withTimeoutRetry`. Экспортирует `batchWrite` и `isTimeoutError`. |
| `lib/validation.ts` | Zod-схемы для валидации входных данных API. |
| `app/layout.tsx` | Root layout: подключает `globals.css`, `KeepAlive`, устанавливает `safe-area` классы на body. |
| `app/game/[roomId]/page.tsx` | Самый большой компонент (~450 строк): polling, обработка ходов, PlayerPanel (inline-компонент), экран победы, confetti. |

---

## 3. Используемые инструменты и технологии

### 3.1. Основной стек

| Технология | Версия | Назначение |
|------------|--------|------------|
| **Next.js** | ^15.3.6 | React-фреймворк с App Router, серверными компонентами и Route Handlers |
| **React** | ^19.1.0 | UI-библиотека |
| **React DOM** | ^19.1.0 | Рендеринг в браузере |
| **TypeScript** | ^5.8.3 | Статическая типизация |
| **Tailwind CSS** | ^3.4.19 | Utility-first CSS |
| **PostCSS** | ^8.5.3 | Обработчик CSS (Tailwind + autoprefixer) |
| **Autoprefixer** | ^10.4.21 | Автоматические CSS-префиксы |
| **@libsql/client** | ^0.15.0 | Клиент для Turso (libSQL) — база данных |
| **nanoid** | ^5.1.11 | Генерация коротких ID комнат |
| **zod** | ^4.4.3 | Валидация схем на серверной стороне |
| **@playwright/test** | ^1.60.0 | E2E-тестирование |

### 3.2. TypeScript (tsconfig.json)

```json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "module": "esnext",
    "moduleResolution": "bundler",
    "jsx": "preserve",
    "strict": false,
    "baseUrl": ".",
    "paths": { "@/*": ["./*"] },
    "incremental": true,
    "allowJs": true,
    "skipLibCheck": true,
    "noEmit": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "isolatedModules": true
  }
}
```

**Ключевые настройки:**
- `"strict": false` — строгая типизация отключена (упрощает разработку, но снижает безопасность типов)
- `"paths": { "@/*": ["./*"] }` — алиас `@/lib/db` → `lib/db`
- `"moduleResolution": "bundler"` — современное разрешение модулей для Next.js
- `"jsx": "preserve"` — Next.js сам обрабатывает JSX

### 3.3. Next.js (next.config.js)

```js
const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ['192.168.0.121', '172.20.10.2', 'localhost'],
};
```

- `reactStrictMode: true` — двойной рендер в dev для выявления побочных эффектов
- `allowedDevOrigins` — список IP для доступа к dev-серверу с других устройств в локальной сети

### 3.4. Tailwind CSS (tailwind.config.js)

- **Кастомные цвета:** `felt` (4 оттенка зелёного бильярдного сукна), `accent` (gold, emerald, ruby, sapphire)
- **Кастомные анимации:** `pulse-glow`, `slide-up`, `slide-down`, `scale-in`, `bounce-once`, `confetti`, `fade-in`
- **Content paths:** `./app/**/*.{js,ts,jsx,tsx}`, `./components/**/*.{js,ts,jsx,tsx}`

### 3.5. База данных (Turso / libSQL)

- **Хостинг:** Turso (https://turso.tech) — serverless SQLite на базе libSQL
- **Клиент:** `@libsql/client` — HTTP/WebSocket клиент с TLS
- **Retry-стратегия:** 3 попытки с таймаутом 15 секунд на запрос (для борьбы с холодным стартом free-tier)
- **Схема:** 3 таблицы — `users`, `games`, `moves` (см. `db/schema.sql`)

### 3.6. Сборка и запуск

| Команда | Назначение |
|---------|------------|
| `npm run dev` | Запуск dev-сервера (Next.js, localhost:3000) |
| `npm run build` | Production-сборка |
| `npm run start` | Запуск production-сервера |

Линтеры и форматеры отсутствуют (ESLint, Prettier не установлены).

### 3.7. Тестирование (Playwright)

- **Фреймворк:** `@playwright/test`
- **Браузер:** Chromium (Desktop Chrome)
- **Конфигурация:** `playwright.config.ts` — одновременный запуск dev-сервера, 1 worker, timeout 60s
- **Тесты:** 24 E2E-теста (10 pool + 6 russian + 8 snooker), покрывающие API-логику и базовый UI
- **Запуск:** `npx playwright test`

---

## 4. Инструкция по деплою на GitHub + Vercel

### 4.1. Предварительные требования

- Аккаунт на [GitHub](https://github.com)
- Аккаунт на [Vercel](https://vercel.com) (через GitHub — самый простой способ)
- Аккаунт на [Turso](https://turso.tech) (если не создан) и существующая база данных
- Node.js 18+ и npm на локальной машине

### 4.2. Инициализация Git и публикация на GitHub

```bash
# Перейти в корень проекта
cd /Users/mikhailshvartser/vscode_projects/billiard_app

# Инициализировать Git (если ещё не инициализирован)
git init

# Создать .gitignore (уже есть — проверить содержимое)
# Файл .gitignore уже содержит: node_modules, .next, .env.local, .DS_Store, *.log

# Добавить все файлы в staging
git add .

# Создать первый коммит
git commit -m "Initial commit: Billiard Score Tracker (Next.js 15, Turso, Tailwind)"

# Создать репозиторий на GitHub через CLI (или вручную на github.com)
# Вариант A — через gh CLI:
gh repo create billiard-app --public --source=. --push

# Вариант B — вручную:
# 1. Зайти на github.com → New repository → имя billiard-app
# 2. НЕ ставить галочку "Initialize with README" (уже есть)
# 3. Выполнить:
git remote add origin https://github.com/YOUR_USERNAME/billiard-app.git
git branch -M main
git push -u origin main
```

### 4.3. Настройка переменных окружения на Vercel

Перед деплоем нужно добавить переменные из `.env.local` в Vercel:

```
TURSO_DATABASE_URL=libsql://billiard-greg2992014.aws-eu-west-1.turso.io
TURSO_AUTH_TOKEN=<ваш-токен>
```

**Как получить токен Turso:**
```bash
# Установить Turso CLI
curl -sSf https://get.turso.tech | sh

# Войти
turso auth login

# Посмотреть список баз
turso db list

# Получить токен для конкретной базы
turso db tokens create billiard  # создаст токен
```

**Как настроить на Vercel:**
1. В дашборде Vercel → проект → **Settings** → **Environment Variables**
2. Добавить `TURSO_DATABASE_URL` и `TURSO_AUTH_TOKEN` со значениями
3. Выбрать окружения: **Production**, **Preview**, **Development**
4. Нажать **Save**

### 4.4. Деплой через веб-интерфейс Vercel

1. Зайти на https://vercel.com → **Add New** → **Project**
2. Выбрать GitHub-репозиторий `billiard-app`
3. Настройки проекта (Vercel определит их автоматически):
   - **Framework Preset:** Next.js (выбирается автоматически)
   - **Root Directory:** `./` (по умолчанию)
   - **Build Command:** `npm run build` (по умолчанию)
   - **Output Directory:** `.next` (Next.js)
   - **Install Command:** `npm install` (по умолчанию)
4. **Environment Variables:** добавить `TURSO_DATABASE_URL` и `TURSO_AUTH_TOKEN`
5. Нажать **Deploy**

### 4.5. Деплой через Vercel CLI

```bash
# Установить Vercel CLI
npm install -g vercel

# Войти в аккаунт Vercel
vercel login

# Деплой (interactive — ответить на вопросы)
vercel

# После успешного деплоя — привязать переменные окружения
vercel env add TURSO_DATABASE_URL
vercel env add TURSO_AUTH_TOKEN

# Прод (после настройки env)
vercel --prod
```

### 4.6. Команды сборки (Next.js)

Vercel использует команды из `package.json`:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start"
}
```

- **Build:** `next build` — создаёт production-бандл в папке `.next`
- **Start:** `next start` — запускает production-сервер (используется Vercel только для preview)

Vercel автоматически запускает `npm install` и `npm run build`.

### 4.7. Проверка деплоя

После деплоя:

1. **URL:** `https://billiard-app.vercel.app` (или кастомный домен)
2. **Health-check:** `GET https://billiard-app.vercel.app/api/health` → `{ "ok": true }`
3. **Пользовательский сценарий:** открыть URL → редирект на `/login` → зарегистрироваться → создать игру
4. **Логи:** Vercel Dashboard → Project → **Functions** → **Logs** (проверить ошибки подключения к Turso)
5. **Production domains:** в настройках проекта Vercel → **Domains** → добавить кастомный домен (опционально)

### 4.8. Возможные проблемы и их решение

| Проблема | Решение |
|----------|---------|
| Turso connection timeout | Проверить `TURSO_DATABASE_URL` и `TURSO_AUTH_TOKEN` в Vercel Env Vars. База может просыпаться 10-25 секунд — retry-логика справляется, но первый запрос может быть медленным. |
| Build fails на Vercel | Проверить `npm install` локально. Убедиться, что нет ошибок TypeScript при `npm run build`. |
| `@libsql/client` требует нативные модули | Если используется serverless функция, Turso работает через HTTP — нативные модули не нужны. |
| 404 после деплоя | Убедиться, что `next.config.js` имеет корректные настройки. Проверить, что роуты App Router корректно собрались. |

### 4.9. Желательные улучшения перед деплоем

Перед публикацией рекомендуется применить критические изменения из предыдущего анализа:
1. **Хеширование паролей** — иначе пароли в открытом виде в production-БД
2. **Обновление Turso-токена** — текущий может быть скомпрометирован
3. **Проверка `strict: true`** в tsconfig — предупредит runtime-ошибки на production

---

## Приложение A: Структура базы данных

```sql
-- users — зарегистрированные игроки
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  login TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,          -- ⚠️ хранится в открытом виде
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- games — партии
CREATE TABLE games (
  room_id TEXT PRIMARY KEY,         -- nanoid(8)
  game_type TEXT NOT NULL,          -- 'snooker' | 'pool' | 'russian'
  player_left_id INTEGER NOT NULL,
  player_right_id INTEGER NOT NULL,
  total_shots_left INTEGER DEFAULT 0,  -- счёт левого игрока
  total_shots_right INTEGER DEFAULT 0,
  current_turn TEXT NOT NULL,           -- 'left' | 'right'
  status TEXT DEFAULT 'active',         -- 'active' | 'finished'
  winner_id INTEGER,
  game_state TEXT NOT NULL,             -- JSON: SnookerState | PoolState | RussianState
  game_started_at DATETIME,
  last_updated_at DATETIME,
  turn_started_at DATETIME,
  game_time_ms INTEGER,
  FOREIGN KEY (player_left_id) REFERENCES users(id),
  FOREIGN KEY (player_right_id) REFERENCES users(id),
  FOREIGN KEY (winner_id) REFERENCES users(id)
);

-- moves — история ходов
CREATE TABLE moves (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  room_id TEXT NOT NULL,
  move_type TEXT NOT NULL,          -- 'shot' | 'turn_switch' | 'foul' | 'durak'
  player_id INTEGER NOT NULL,
  ball_color TEXT,                  -- 'red' | 'yellow' | ... | null
  points INTEGER DEFAULT 0,
  turn_duration_ms INTEGER,
  move_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (room_id) REFERENCES games(room_id),
  FOREIGN KEY (player_id) REFERENCES users(id)
);
```

## Приложение B: API-эндпоинты

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/health` | Проверка соединения с БД |
| POST | `/api/auth/register` | Регистрация: `{ login, password }` → `{ userId, login }` |
| POST | `/api/auth/login` | Вход: `{ login, password }` → `{ userId, login }` |
| GET | `/api/game/users` | Список всех пользователей |
| POST | `/api/game/users` | Создать пользователя (пароль `1234`): `{ login }` |
| POST | `/api/game/create` | Создать игру: `{ gameType, playerLeftLogin, playerRightLogin }` → `{ roomId }` |
| GET | `/api/game/recent?userId=N` | Последние 10 игр пользователя |
| GET | `/api/game/[roomId]` | Полное состояние игры + история ходов |
| POST | `/api/game/[roomId]/move` | Ход: `{ playerId, moveType, shotType?, ballColor?, foulPoints? }` |

## Приложение C: Игровые состояния (JSON в game_state)

```typescript
// Snooker
{ type: 'snooker', reds: 15, colors: { yellow: 1, green: 1, brown: 1, blue: 1, pink: 1, black: 1 },
  requiredBallType: 'red' | 'color', phase: 'normal' | 'colors' }

// Pool
{ type: 'pool', playerGroup: { left: 'solid'|'stripe'|null, right: 'solid'|'stripe'|null },
  pocketedSolids: 0, pocketedStripes: 0, blackPocketed: false }

// Russian
{ type: 'russian', ballsLeft: 0, ballsRight: 0, target: 8 }
```

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
- **Редактирование состояния игры** (админ-режим): ручная корректировка счёта и игрового состояния для каждого режима.
- **Отмена последнего хода** с восстановлением предыдущего состояния.
- **История ходов** с временными метками и длительностью хода.
- **Таймеры:** общий таймер партии и таймер текущего хода.
- **Confetti-анимация** при завершении игры.
- **Keep-alive** каждые 60 секунд для предотвращения засыпания free-tier Turso.
- **Авторизация:** простая (логин + пароль, localStorage-токен).

### Пользовательский сценарий

1. Пользователь открывает `/` → редирект на `/login`.
2. Регистрируется (`/register`) или входит (`/login`).
3. На `/dashboard` выбирает режим игры и соперника (из существующих пользователей или создаёт нового).
4. Перенаправляется в комнату `/game/[roomId]`.
5. Игроки по очереди нажимают кнопки («Забил красный», «Фол 4», «Дурак» и т.д.).
6. После каждого хода состояние обновляется через API + polling.
7. При победе отображается экран с результатом, confetti, кнопка «Сыграть ещё раз».
8. Незавершённые игры отображаются в списке «Последние игры» на дашборде с возможностью закрытия.

### Ключевые модули

| Модуль | Назначение |
|--------|------------|
| `lib/gameLogic.ts` | **Чистые функции** для обработки ударов (snooker, pool, russian). Без сайд-эффектов. 272 строки. |
| `lib/gameService.ts` | **Сервисный слой** — связывает gameLogic с БД: получает игру, парсит state, вызывает обработчики ходов, записывает ход + обновление транзакцией. |
| `lib/move/` | **Диспетчер ходов** — каждый тип хода (`snookerShot`, `durakSnooker`, `foul`, `turnSwitch` и т.д.) вынесен в отдельный файл. 10 файлов, ~720 строк. |
| `lib/db.ts` | **Клиент Turso** с timeout + retry (Proxy-паттерн). Борется с холодным стартом free-tier БД. |
| `components/*` | **UI-компоненты:** GameTimer, HistoryLog, PoolControls, SnookerControls, RussianControls, KeepAlive, GameRulesModal, BallImage, IconImage, а также административные редакторы состояний (PoolScoreEditor, RussianScoreEditor, SnookerStateEditor). |
| `app/api/*` | **Next.js Route Handlers** — 15 REST-эндпоинтов (health, auth, game CRUD, moves, adjust-state, undo, close). |

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
│   ├── migrate_v2.sql            # Миграция v2 (объединение колонок, winner_id и т.д.)
│   └── migrate_v3.sql            # Миграция v3 (добавление колонки closed)
│
├── lib/
│   ├── constants.ts              # Общие константы: COLOR_ORDER, BALL_DEFS, COLOR_POINTS, GAME_TYPE_NAMES, POLL_INTERVAL_MS
│   ├── db.ts                     # Turso-клиент с retry/timeout через Proxy
│   ├── gameLogic.ts              # Чистая игровая логика (initialState, processXxxShot) для всех трёх режимов
│   ├── gameService.ts            # Сервис: createGame, processMove (бизнес-логика + БД)
│   ├── types.ts                  # Общие типы: HistoryLogMove, User, RecentGame
│   ├── validation.ts             # Zod-схемы: createGameSchema, moveSchema, createUserSchema
│   ├── mappers.ts                # Маппинг сырых строк БД → типизированные объекты
│   ├── api-helpers.ts            # Хелпер для унифицированной обработки ошибок БД в API-роутах
│   └── move/
│       ├── types.ts              # MoveContext, MoveParams, MoveEffect, MoveResult, MoveHandler
│       ├── index.ts              # Диспетчер: привязывает gameType + moveType → обработчик
│       ├── snookerShot.ts        # Забитие шара в снукере
│       ├── poolShot.ts           # Забитие шара в пуле
│       ├── russianShot.ts        # Забитие шара в русской пирамиде
│       ├── durakSnooker.ts       # «Дурак» в снукере
│       ├── durakPool.ts          # «Дурак» в пуле
│       ├── durakRussian.ts       # «Дурак» в русской пирамиде
│       ├── foul.ts               # Универсальный обработчик фола
│       └── turnSwitch.ts         # Принудительная смена хода
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
│   │       └── page.tsx          # Игровая комната: PlayerPanel, таймеры, кнопки ходов, история, confetti, административные редакторы (857 строк)
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
│           ├── recent/route.ts   # GET ?userId= → последние игры пользователя
│           ├── users/route.ts    # GET → все пользователи / POST → создать пользователя
│           ├── last-opponent/route.ts  # GET → последний соперник пользователя
│           │
│           └── [roomId]/
│               ├── route.ts              # GET → полное состояние игры + ходы
│               ├── move/route.ts         # POST → обработка хода (shot / turn_switch / foul / durak)
│               ├── close/route.ts        # POST → принудительное закрытие незавершённой игры
│               ├── undo/route.ts         # POST → отмена последнего хода
│               ├── adjust-score/route.ts       # PUT → корректировка общего счёта
│               ├── adjust-state/route.ts       # PUT → корректировка игрового состояния (снукер)
│               ├── adjust-pool-state/route.ts  # PUT → корректировка состояния пула
│               └── adjust-russian-state/route.ts # PUT → корректировка состояния пирамиды
│
├── components/
│   ├── BallImage.tsx              # SVG-рендеринг бильярдных шаров
│   ├── IconImage.tsx              # SVG-рендеринг иконок (режимы игры, статус)
│   ├── KeepAlive.tsx              # Client component: каждые 60s пингует /api/health (первый пинг через 10s)
│   ├── GameTimer.tsx              # Client component: таймер с форматом mm:ss
│   ├── HistoryLog.tsx             # Client component: история ходов (последние 15)
│   ├── GameTypeSelector.tsx       # Выбор режима игры (Пул / Пирамида / Снукер)
│   ├── PlayerCreator.tsx          # Форма создания нового игрока
│   ├── RecentGames.tsx            # Список последних игр с кнопкой закрытия
│   ├── GameRulesData.ts           # Данные правил для каждого режима
│   ├── GameRulesModal.tsx         # Модальное окно с правилами игры
│   │
│   └── modes/
│       ├── PoolControls.tsx       # Кнопки для Пула (сплошные, полосатые, чёрный, чужой шар, дурак)
│       ├── PoolScoreEditor.tsx    # Административный редактор состояния пула
│       ├── SnookerControls.tsx    # Кнопки для Снукера (красный, сетка цветов, фол-пикер, дурак-пикер)
│       ├── SnookerStateEditor.tsx # Административный редактор состояния снукера
│       ├── RussianControls.tsx    # Кнопки для Русской пирамиды (индикатор шаров, забил, дурак)
│       └── RussianScoreEditor.tsx # Административный редактор счёта пирамиды
│
├── e2e/
│   ├── helpers.ts               # Тестовые хелперы: registerUser, createGame, postMove, fetchGameState, уникальные имена
│   ├── pool.spec.ts             # E2E-тесты для Пула (7 тестов)
│   ├── russian.spec.ts          # E2E-тесты для Русской пирамиды (6 тестов)
│   └── snooker.spec.ts          # E2E-тесты для Снукера (28 тестов)
│
└── test-results/                 # Результаты Playwright-тестов (генерируются)
```

### Назначение ключевых файлов

| Файл | Роль |
|------|------|
| `lib/constants.ts` | Единый источник истины для: порядка цветов, очков за шары, русских названий, названий режимов, интервала опроса. |
| `lib/gameLogic.ts` | Чистые функции `initialSnookerState`, `initialPoolState`, `initialRussianState`, `processSnookerShot`, `processPoolShot`, `processRussianShot`. Иммутабельно возвращают новое состояние. |
| `lib/move/index.ts` | Диспетчер ходов: принимает `gameType` + `moveType`, вызывает соответствующий обработчик (`snookerShot`, `poolShot`, `durakSnooker` и т.д.). |
| `lib/move/types.ts` | Типы для системы ходов: `MoveContext`, `MoveParams`, `MoveEffect`, `MoveResult`, `MoveHandler`. |
| `lib/gameService.ts` | Функция `processMove` (объединяет gameLogic/move + БД), `createGame` (upsert пользователей). Содержит `GameError`-класс. |
| `lib/db.ts` | `createClient` из `@libsql/client`, обёрнутый в Proxy с `withTimeoutRetry`. Экспортирует `batchWrite` и `isTimeoutError`. |
| `lib/validation.ts` | Zod-схемы для валидации входных данных API. |
| `app/layout.tsx` | Root layout: подключает `globals.css`, `KeepAlive`, устанавливает `safe-area` классы на body. |
| `app/game/[roomId]/page.tsx` | Самый большой компонент (857 строк): polling, обработка ходов, PlayerPanel, экран победы, confetti, административные редакторы состояний. |

---

## 3. Используемые инструменты и технологии

### 3.1. Основной стек

| Технология | Версия | Назначение |
|------------|--------|------------|
| **Next.js** | ^15.3.6 (lock: 15.5.18) | React-фреймворк с App Router, серверными компонентами и Route Handlers |
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
- **Keep-alive:** компонент `KeepAlive` каждые 60 секунд пингует `/api/health` (первый пинг через 10 секунд для предотвращения конкуренции с первым запросом пользователя к холодной БД)

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
- **Тесты:** 41 E2E-тест (7 pool + 6 russian + 28 snooker), покрывающие API-логику и базовый UI
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
cd /Users/mikhailshvartser/vscode_projects/billiard_app

git init

# Файл .gitignore уже содержит: node_modules, .next, .env.local, .DS_Store, *.log

git add .
git commit -m "Initial commit: Billiard Score Tracker (Next.js 15, Turso, Tailwind)"

# Через gh CLI:
gh repo create billiard-app --public --source=. --push

# Или вручную:
# 1. github.com → New repository → имя billiard-app
# 2. НЕ ставить галочку "Initialize with README" (уже есть)
# 3. Выполнить:
git remote add origin https://github.com/YOUR_USERNAME/billiard-app.git
git branch -M main
git push -u origin main
```

### 4.3. Настройка переменных окружения на Vercel

Перед деплоем нужно добавить переменные из `.env.local` в Vercel:

```
TURSO_DATABASE_URL=libsql://<ваша-база>.aws-eu-west-1.turso.io
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
turso db tokens create <имя-базы>
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
   - **Framework Preset:** Next.js
   - **Root Directory:** `./`
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`
   - **Install Command:** `npm install`
4. **Environment Variables:** добавить `TURSO_DATABASE_URL` и `TURSO_AUTH_TOKEN`
5. Нажать **Deploy**

### 4.5. Деплой через Vercel CLI

```bash
npm install -g vercel

vercel login

vercel

vercel env add TURSO_DATABASE_URL
vercel env add TURSO_AUTH_TOKEN

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

---

## Приложение A: Структура базы данных

```sql
-- users — зарегистрированные игроки
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  login TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- games — партии
CREATE TABLE games (
  room_id TEXT PRIMARY KEY,         -- nanoid(8)
  game_type TEXT NOT NULL,          -- 'snooker' | 'pool' | 'russian'
  player_left_id INTEGER NOT NULL,
  player_right_id INTEGER NOT NULL,
  total_shots_left INTEGER DEFAULT 0,
  total_shots_right INTEGER DEFAULT 0,
  current_turn TEXT NOT NULL,       -- 'left' | 'right'
  status TEXT DEFAULT 'active',     -- 'active' | 'finished'
  winner_id INTEGER,
  game_state TEXT NOT NULL,         -- JSON: SnookerState | PoolState | RussianState
  game_started_at DATETIME,
  last_updated_at DATETIME,
  turn_started_at DATETIME,
  game_time_ms INTEGER,
  closed INTEGER DEFAULT 0,        -- флаг принудительного закрытия
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
  cancelled INTEGER DEFAULT 0,     -- флаг отмены хода при undo
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
| POST | `/api/game/users` | Создать пользователя: `{ login }` |
| POST | `/api/game/create` | Создать игру: `{ gameType, playerLeftLogin, playerRightLogin }` → `{ roomId }` |
| GET | `/api/game/recent?userId=N` | Последние игры пользователя |
| GET | `/api/game/last-opponent?userId=N` | Последний соперник пользователя |
| GET | `/api/game/[roomId]` | Полное состояние игры + история ходов |
| POST | `/api/game/[roomId]/move` | Ход: `{ playerId, moveType, shotType?, ballColor?, foulPoints? }` |
| POST | `/api/game/[roomId]/undo` | Отмена последнего хода |
| POST | `/api/game/[roomId]/close` | Принудительное закрытие незавершённой игры |
| PUT | `/api/game/[roomId]/adjust-score` | Корректировка общего счёта (totalShots) |
| PUT | `/api/game/[roomId]/adjust-state` | Корректировка игрового состояния снукера |
| PUT | `/api/game/[roomId]/adjust-pool-state` | Корректировка состояния пула |
| PUT | `/api/game/[roomId]/adjust-russian-state` | Корректировка состояния пирамиды |

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

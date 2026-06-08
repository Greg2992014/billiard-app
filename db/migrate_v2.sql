-- Миграция базы данных для Billiard Score Tracker v2
-- Сначала добавим новые колонки, перенесём данные, затем удалим старые

-- =============== games ===============

-- 1. Переименовываем score → total_shots
ALTER TABLE games ADD COLUMN total_shots_left INTEGER DEFAULT 0;
ALTER TABLE games ADD COLUMN total_shots_right INTEGER DEFAULT 0;
UPDATE games SET total_shots_left = COALESCE(score_left, 0);
UPDATE games SET total_shots_right = COALESCE(score_right, 0);

-- 2. Объединяем три state-колонки в одну game_state
ALTER TABLE games ADD COLUMN game_state TEXT;
UPDATE games SET game_state = snooker_state WHERE snooker_state IS NOT NULL;
UPDATE games SET game_state = pool_state WHERE pool_state IS NOT NULL;
UPDATE games SET game_state = russian_state WHERE russian_state IS NOT NULL;

-- 3. Заменяем winner (TEXT) на winner_id (INTEGER) + FK
ALTER TABLE games ADD COLUMN winner_id INTEGER;
UPDATE games SET winner_id = player_left_id WHERE winner = 'left';
UPDATE games SET winner_id = player_right_id WHERE winner = 'right';

-- 4. Добавляем turn_started_at и game_time_ms
ALTER TABLE games ADD COLUMN turn_started_at DATETIME;
ALTER TABLE games ADD COLUMN game_time_ms INTEGER;

-- 5. Удаляем старые колонки games
ALTER TABLE games DROP COLUMN score_left;
ALTER TABLE games DROP COLUMN score_right;
ALTER TABLE games DROP COLUMN balls_left;
ALTER TABLE games DROP COLUMN balls_right;
ALTER TABLE games DROP COLUMN winner;
ALTER TABLE games DROP COLUMN snooker_state;
ALTER TABLE games DROP COLUMN pool_state;
ALTER TABLE games DROP COLUMN russian_state;

-- =============== moves ===============

-- 6. Добавляем player_id (INTEGER) и переносим данные из player/user_id
ALTER TABLE moves ADD COLUMN player_id_new INTEGER;
UPDATE moves SET player_id_new = user_id WHERE user_id IS NOT NULL;
UPDATE moves SET player_id_new = (
  SELECT player_left_id FROM games WHERE games.room_id = moves.room_id
) WHERE player = 'left' AND player_id_new IS NULL;
UPDATE moves SET player_id_new = (
  SELECT player_right_id FROM games WHERE games.room_id = moves.room_id
) WHERE player = 'right' AND player_id_new IS NULL;

-- 7. Удаляем старые колонки moves
ALTER TABLE moves DROP COLUMN player;
ALTER TABLE moves DROP COLUMN user_id;
ALTER TABLE moves DROP COLUMN ball_number;
ALTER TABLE moves DROP COLUMN game_time_ms;

-- 8. Переименовываем временную колонку
ALTER TABLE moves RENAME COLUMN player_id_new TO player_id;

-- Миграция v3: поддержка отмены хода (undo) и улучшенная история
-- Добавляет cancelled (флаг отменённого хода) и prev_game_snapshot (снимок состояния до хода)

ALTER TABLE moves ADD COLUMN cancelled INTEGER DEFAULT 0;
ALTER TABLE moves ADD COLUMN prev_game_snapshot TEXT;

-- Миграция v3: добавляет closed для принудительного закрытия незавершённых игр
ALTER TABLE games ADD COLUMN closed INTEGER DEFAULT 0;

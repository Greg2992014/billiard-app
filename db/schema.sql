PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  login TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS games (
  room_id TEXT PRIMARY KEY,
  game_type TEXT NOT NULL,
  player_left_id INTEGER NOT NULL,
  player_right_id INTEGER NOT NULL,
  total_shots_left INTEGER DEFAULT 0,
  total_shots_right INTEGER DEFAULT 0,
  current_turn TEXT NOT NULL,
  game_started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  turn_started_at DATETIME,
  game_time_ms INTEGER,
  status TEXT DEFAULT 'active',
  winner_id INTEGER,
  game_state TEXT NOT NULL,
  FOREIGN KEY (player_left_id) REFERENCES users(id),
  FOREIGN KEY (player_right_id) REFERENCES users(id),
  FOREIGN KEY (winner_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS moves (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  room_id TEXT NOT NULL,
  move_type TEXT NOT NULL,
  player_id INTEGER NOT NULL,
  ball_color TEXT,
  points INTEGER DEFAULT 0,
  turn_duration_ms INTEGER,
  move_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (room_id) REFERENCES games(room_id),
  FOREIGN KEY (player_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_moves_room ON moves(room_id);
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
CREATE INDEX IF NOT EXISTS idx_games_player_left ON games(player_left_id);
CREATE INDEX IF NOT EXISTS idx_games_player_right ON games(player_right_id);

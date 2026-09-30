CREATE TABLE IF NOT EXISTS cook_tally (
  id INT PRIMARY KEY DEFAULT 1,
  count BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT single_row CHECK (id = 1)
);

-- Seed the single row if not exists
INSERT IGNORE INTO cook_tally (id, count) VALUES (1, 0);

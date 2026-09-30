CREATE TABLE IF NOT EXISTS saved_cooks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL DEFAULT NULL,
  session_id VARCHAR(255) NOT NULL,
  method VARCHAR(50) NOT NULL,
  meat_category VARCHAR(100) NOT NULL,
  cut VARCHAR(100) NOT NULL,
  weight_kg DECIMAL(5,2) NOT NULL,
  result_json TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_session (session_id)
);

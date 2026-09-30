CREATE TABLE IF NOT EXISTS subscribers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  cut VARCHAR(100),
  method VARCHAR(100),
  weight_kg DECIMAL(5,2),
  cook_time_minutes INT,
  appliance_temp_c INT,
  internal_temp_c INT,
  unsubscribe_token VARCHAR(64) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  unsubscribed_at TIMESTAMP NULL DEFAULT NULL,
  UNIQUE KEY unique_email (email),
  UNIQUE KEY unique_token (unsubscribe_token)
);

CREATE TABLE IF NOT EXISTS gear (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  slug            VARCHAR(100) NOT NULL UNIQUE,
  name            VARCHAR(200) NOT NULL,
  category        VARCHAR(100) NOT NULL,
  affiliate_url   VARCHAR(500) NOT NULL DEFAULT '#',
  image_url       VARCHAR(500),
  description     TEXT,
  recommended_for VARCHAR(500) COMMENT 'Comma-separated method names e.g. Smoker,Kamado,all',
  sort_order      INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS gear_clicks (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  gear_slug  VARCHAR(100) NOT NULL,
  clicked_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_slug (gear_slug)
);

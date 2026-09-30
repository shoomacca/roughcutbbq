CREATE TABLE IF NOT EXISTS gallery_posts (
  id          VARCHAR(21)  NOT NULL PRIMARY KEY,
  before_url  VARCHAR(500) NOT NULL,
  after_url   VARCHAR(500) NOT NULL,
  name        VARCHAR(100),
  cut         VARCHAR(100) NOT NULL,
  method      VARCHAR(100) NOT NULL,
  gear_used   TEXT,
  report_count INT          NOT NULL DEFAULT 0,
  reported    TINYINT(1)   NOT NULL DEFAULT 0,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

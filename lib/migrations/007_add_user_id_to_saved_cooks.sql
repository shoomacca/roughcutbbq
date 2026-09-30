-- Alter saved_cooks to include user_id. This will log a duplicate column warning/error if it already exists, which is ignored by runMigrations.
ALTER TABLE saved_cooks ADD COLUMN user_id INT NULL DEFAULT NULL;

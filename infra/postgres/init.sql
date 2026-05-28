-- Bootstrap для swipet PostgreSQL інстансу.
--
-- В docker-compose POSTGRES_DB / POSTGRES_USER / POSTGRES_PASSWORD створює
-- базовий superuser/db, тому тут робимо лише операції, які потрібні поверх:
--   * створюємо окремого read-only user-а для майбутньої аналітики
--   * вмикаємо потрібні extension-и
--
-- Файл монтується у /docker-entrypoint-initdb.d/, виконується one-shot
-- при першому старті порожнього volume.

\connect :"POSTGRES_DB" :"POSTGRES_USER";

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Read-only роль для майбутніх аналітичних/BI ETL-ів.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'swipet_readonly') THEN
        CREATE ROLE swipet_readonly LOGIN PASSWORD 'changeme_readonly';
    END IF;
END $$;

GRANT CONNECT ON DATABASE :"POSTGRES_DB" TO swipet_readonly;
GRANT USAGE ON SCHEMA public TO swipet_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT ON TABLES TO swipet_readonly;

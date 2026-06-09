-- Bootstrap для swipet PostgreSQL інстансу.
--
-- В docker-compose POSTGRES_DB / POSTGRES_USER / POSTGRES_PASSWORD створює
-- базовий superuser/db. Цей скрипт entrypoint виконує ОДНОРАЗОВО при першому
-- старті порожнього volume, УЖЕ підключеним до $POSTGRES_DB як $POSTGRES_USER.
--
-- ВАЖЛИВО: psql-змінні :"POSTGRES_DB" / :"POSTGRES_USER" тут НЕдоступні
-- (entrypoint їх не передає), тому окремий \connect не потрібен, а ім'я БД
-- для GRANT беремо через current_database().

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Read-only роль для майбутніх аналітичних/BI ETL-ів.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'swipet_readonly') THEN
        CREATE ROLE swipet_readonly LOGIN PASSWORD 'changeme_readonly';
    END IF;
END $$;

-- GRANT CONNECT потребує літерального імені БД → підставляємо поточну динамічно.
DO $$
BEGIN
    EXECUTE format('GRANT CONNECT ON DATABASE %I TO swipet_readonly', current_database());
END $$;

GRANT USAGE ON SCHEMA public TO swipet_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT ON TABLES TO swipet_readonly;

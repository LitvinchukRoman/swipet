CREATE TYPE user_role AS ENUM ('USER', 'SHELTER_ADMIN', 'ADMIN');

CREATE TABLE users (
                       id BIGSERIAL PRIMARY KEY,
                       email VARCHAR(255) UNIQUE NOT NULL,
                       password_hash VARCHAR(255) NOT NULL,
                       full_name VARCHAR(100) NOT NULL,
                       phone VARCHAR(20),
                       avatar_url TEXT,
                       role user_role NOT NULL,
                       is_email_verified BOOLEAN DEFAULT false,
                       location_lat DECIMAL(9,6),
                       location_lng DECIMAL(9,6),
                       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
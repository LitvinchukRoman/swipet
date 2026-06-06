CREATE TABLE shelters (
                          id BIGSERIAL PRIMARY KEY,
                          admin_user_id BIGINT NOT NULL,
                          name VARCHAR(200) NOT NULL,
                          description TEXT,
                          logo_url TEXT,
                          address TEXT NOT NULL,
                          city VARCHAR(100) NOT NULL,
                          location_lat DOUBLE PRECISION NOT NULL,
                          location_lng DOUBLE PRECISION NOT NULL,
                          phone VARCHAR(20),
                          website_url TEXT,
                          is_verified BOOLEAN DEFAULT false,
                          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                          CONSTRAINT fk_shelters_admin FOREIGN KEY (admin_user_id) REFERENCES users (id) ON DELETE RESTRICT
);
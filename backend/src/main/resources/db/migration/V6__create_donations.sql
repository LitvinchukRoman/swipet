CREATE TYPE donation_type AS ENUM ('ONE_TIME', 'SUBSCRIPTION');
CREATE TYPE donation_status AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

CREATE TABLE donations (
                           id BIGSERIAL PRIMARY KEY,
                           user_id BIGINT NOT NULL,
                           shelter_id BIGINT NOT NULL,
                           animal_id BIGINT,
                           amount DECIMAL(10,2) NOT NULL,
                           type donation_type NOT NULL,
                           status donation_status NOT NULL,
                           external_tx_id VARCHAR(255),
                           created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                           CONSTRAINT fk_donation_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE RESTRICT,
                           CONSTRAINT fk_donation_shelter FOREIGN KEY (shelter_id) REFERENCES shelters (id) ON DELETE RESTRICT,
                           CONSTRAINT fk_donation_animal FOREIGN KEY (animal_id) REFERENCES animals (id) ON DELETE SET NULL
);

CREATE TABLE virtual_guardianships (
                                       id BIGSERIAL PRIMARY KEY,
                                       user_id BIGINT NOT NULL,
                                       animal_id BIGINT NOT NULL,
                                       monthly_amount DECIMAL(10,2) NOT NULL,
                                       is_active BOOLEAN DEFAULT true,
                                       started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                       next_billing_at TIMESTAMP NOT NULL,
                                       CONSTRAINT fk_vg_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE RESTRICT,
                                       CONSTRAINT fk_vg_animal FOREIGN KEY (animal_id) REFERENCES animals (id) ON DELETE CASCADE
);
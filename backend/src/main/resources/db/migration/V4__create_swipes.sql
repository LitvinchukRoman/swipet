CREATE TYPE swipe_direction AS ENUM ('LEFT', 'RIGHT');

CREATE TABLE swipes (
                        id BIGSERIAL PRIMARY KEY,
                        user_id BIGINT NOT NULL,
                        animal_id BIGINT NOT NULL,
                        direction swipe_direction NOT NULL,
                        swiped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        CONSTRAINT fk_swipes_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
                        CONSTRAINT fk_swipes_animal FOREIGN KEY (animal_id) REFERENCES animals (id) ON DELETE CASCADE,
                        CONSTRAINT uq_user_animal_swipe UNIQUE (user_id, animal_id)
);
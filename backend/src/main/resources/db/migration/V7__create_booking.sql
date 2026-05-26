CREATE TYPE booking_status AS ENUM ('AVAILABLE', 'BOOKED', 'CANCELLED');

CREATE TABLE booking_slots (
                               id BIGSERIAL PRIMARY KEY,
                               shelter_id BIGINT NOT NULL,
                               user_id BIGINT,
                               starts_at TIMESTAMP NOT NULL,
                               ends_at TIMESTAMP NOT NULL,
                               status booking_status NOT NULL,
                               notes TEXT,
                               CONSTRAINT fk_booking_shelter FOREIGN KEY (shelter_id) REFERENCES shelters (id) ON DELETE CASCADE,
                               CONSTRAINT fk_booking_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
);
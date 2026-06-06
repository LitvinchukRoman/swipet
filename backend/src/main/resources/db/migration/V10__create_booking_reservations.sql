CREATE TYPE reservation_status AS ENUM ('ACTIVE', 'CANCELLED', 'COMPLETED');

CREATE TABLE booking_reservations (
                                      id          BIGSERIAL PRIMARY KEY,
                                      slot_id     BIGINT NOT NULL,
                                      user_id     BIGINT NOT NULL,
                                      notes       TEXT,
                                      status      reservation_status NOT NULL DEFAULT 'ACTIVE',
                                      created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
                                      CONSTRAINT fk_reservation_slot FOREIGN KEY (slot_id) REFERENCES booking_slots (id) ON DELETE CASCADE,
                                      CONSTRAINT fk_reservation_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);
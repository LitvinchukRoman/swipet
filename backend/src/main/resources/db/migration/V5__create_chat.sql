CREATE TABLE chat_rooms (
                            id BIGSERIAL PRIMARY KEY,
                            user_id BIGINT NOT NULL,
                            shelter_id BIGINT NOT NULL,
                            animal_id BIGINT NOT NULL,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            last_message_at TIMESTAMP,
                            CONSTRAINT fk_chat_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
                            CONSTRAINT fk_chat_shelter FOREIGN KEY (shelter_id) REFERENCES shelters (id) ON DELETE CASCADE,
                            CONSTRAINT fk_chat_animal FOREIGN KEY (animal_id) REFERENCES animals (id) ON DELETE CASCADE
);

CREATE TABLE chat_messages (
                               id BIGSERIAL PRIMARY KEY,
                               room_id BIGINT NOT NULL,
                               sender_id BIGINT NOT NULL,
                               content TEXT NOT NULL,
                               is_read BOOLEAN DEFAULT false,
                               sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                               CONSTRAINT fk_message_room FOREIGN KEY (room_id) REFERENCES chat_rooms (id) ON DELETE CASCADE,
                               CONSTRAINT fk_message_sender FOREIGN KEY (sender_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX idx_chat_messages_room_id ON chat_messages (room_id);
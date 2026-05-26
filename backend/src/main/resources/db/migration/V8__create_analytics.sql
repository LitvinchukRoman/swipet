CREATE TABLE animal_analytics (
                                  animal_id BIGINT NOT NULL,
                                  date DATE NOT NULL,
                                  views_count INT DEFAULT 0,
                                  swipes_right INT DEFAULT 0,
                                  swipes_left INT DEFAULT 0,
                                  chat_opens INT DEFAULT 0,
                                  PRIMARY KEY (animal_id, date),
                                  CONSTRAINT fk_analytics_animal FOREIGN KEY (animal_id) REFERENCES animals (id) ON DELETE CASCADE
);

CREATE INDEX idx_animals_feed ON animals (shelter_id, status, species);
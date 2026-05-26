CREATE TYPE animal_species AS ENUM ('DOG', 'CAT', 'RABBIT', 'OTHER');
CREATE TYPE animal_size AS ENUM ('SMALL', 'MEDIUM', 'LARGE');
CREATE TYPE animal_gender AS ENUM ('MALE', 'FEMALE');
CREATE TYPE animal_status AS ENUM ('AVAILABLE', 'RESERVED', 'ADOPTED');

CREATE TABLE animals (
                         id BIGSERIAL PRIMARY KEY,
                         shelter_id BIGINT NOT NULL,
                         name VARCHAR(100) NOT NULL,
                         species animal_species NOT NULL,
                         breed VARCHAR(100),
                         age_months INT NOT NULL,
                         size animal_size NOT NULL,
                         gender animal_gender NOT NULL,
                         description TEXT,
                         is_vaccinated BOOLEAN DEFAULT false,
                         is_sterilized BOOLEAN DEFAULT false,
                         status animal_status NOT NULL,
                         primary_photo_url TEXT,
                         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                         CONSTRAINT fk_animals_shelter FOREIGN KEY (shelter_id) REFERENCES shelters (id) ON DELETE CASCADE
);

CREATE TABLE animal_photos (
                               id BIGSERIAL PRIMARY KEY,
                               animal_id BIGINT NOT NULL,
                               url TEXT NOT NULL,
                               sort_order INT DEFAULT 0,
                               created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                               CONSTRAINT fk_photos_animal FOREIGN KEY (animal_id) REFERENCES animals (id) ON DELETE CASCADE
);
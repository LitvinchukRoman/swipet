-- Test data for integration tests
-- @Sql runs this before every test method, so reset the affected tables first
-- to keep the script idempotent across methods (no rollback between them).
TRUNCATE TABLE users, shelters, animals, booking_slots, virtual_guardianships, donations RESTART IDENTITY CASCADE;

-- Insert test user
INSERT INTO users (id, email, password_hash, full_name, role) VALUES 
(1, 'user@example.com', '$2a$10$encodedPassword', 'Test User', 'USER'),
(2, 'admin@example.com', '$2a$10$encodedPassword', 'Test Admin', 'ADMIN'),
(3, 'shelter@example.com', '$2a$10$encodedPassword', 'Test Shelter Admin', 'SHELTER_ADMIN');

-- Insert test shelters: #1 owned by shelter-admin (user 3), #2 owned by platform admin (user 2)
INSERT INTO shelters (id, admin_user_id, name, description, logo_url, address, city, location_lat, location_lng, phone, website_url, is_verified, created_at) VALUES 
(1, 3, 'Test Shelter', 'A test shelter', NULL, '123 Test St', 'Test City', 50.4501, 30.5234, NULL, NULL, true, CURRENT_TIMESTAMP),
(2, 2, 'Other Shelter', 'A different shelter', NULL, '456 Other St', 'Other City', 49.8397, 24.0297, NULL, NULL, true, CURRENT_TIMESTAMP);

-- Insert test animal
INSERT INTO animals (id, shelter_id, name, species, age_months, size, gender, description, status, primary_photo_url, created_at) VALUES 
(1, 1, 'Test Animal', 'DOG', 36, 'MEDIUM', 'MALE', 'A test animal', 'AVAILABLE', NULL, CURRENT_TIMESTAMP);

-- Insert test booking slot
INSERT INTO booking_slots (id, shelter_id, user_id, starts_at, ends_at, max_guests, status, notes, version) VALUES 
(1, 1, NULL, CURRENT_TIMESTAMP + INTERVAL '1 day', CURRENT_TIMESTAMP + INTERVAL '1 day 2 hours', 5, 'AVAILABLE', NULL, 0);

-- Insert test guardianship
INSERT INTO virtual_guardianships (id, user_id, animal_id, monthly_amount, is_active, started_at, next_billing_at) VALUES 
(1, 1, 1, 50.00, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '1 month');

-- Insert test donation (used by verify-session test): PENDING, owned by user 1
INSERT INTO donations (id, user_id, shelter_id, animal_id, amount, type, status, external_tx_id, created_at) VALUES 
(1, 1, 1, 1, 50.00, 'ONE_TIME', 'PENDING', 'test_session_123', CURRENT_TIMESTAMP);

-- Explicit-id inserts don't advance BIGSERIAL sequences; sync them so app-side
-- inserts (e.g. createSlot) don't collide with seeded ids.
SELECT setval(pg_get_serial_sequence('users', 'id'), (SELECT MAX(id) FROM users));
SELECT setval(pg_get_serial_sequence('shelters', 'id'), (SELECT MAX(id) FROM shelters));
SELECT setval(pg_get_serial_sequence('animals', 'id'), (SELECT MAX(id) FROM animals));
SELECT setval(pg_get_serial_sequence('booking_slots', 'id'), (SELECT MAX(id) FROM booking_slots));
SELECT setval(pg_get_serial_sequence('virtual_guardianships', 'id'), (SELECT MAX(id) FROM virtual_guardianships));
SELECT setval(pg_get_serial_sequence('donations', 'id'), (SELECT MAX(id) FROM donations));

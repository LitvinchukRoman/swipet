-- Test data for integration tests

-- Insert test user
INSERT INTO users (id, email, password_hash, full_name, role) VALUES 
(1, 'user@example.com', '$2a$10$encodedPassword', 'Test User', 'USER'),
(2, 'admin@example.com', '$2a$10$encodedPassword', 'Test Admin', 'ADMIN'),
(3, 'shelter@example.com', '$2a$10$encodedPassword', 'Test Shelter Admin', 'SHELTER_ADMIN');

-- Insert test shelter
INSERT INTO shelters (id, admin_user_id, name, description, logo_url, address, city, location_lat, location_lng, phone, website_url, is_verified, created_at) VALUES 
(1, 3, 'Test Shelter', 'A test shelter', NULL, '123 Test St', 'Test City', 50.4501, 30.5234, NULL, NULL, true, CURRENT_TIMESTAMP);

-- Insert test animal
INSERT INTO animals (id, shelter_id, name, species, age, size, gender, description, photo_url, is_available, created_at) VALUES 
(1, 1, 'Test Animal', 'Dog', 3, 'Medium', 'Male', 'A test animal', NULL, true, CURRENT_TIMESTAMP);

-- Insert test booking slot
INSERT INTO booking_slots (id, shelter_id, user_id, starts_at, ends_at, max_guests, status, notes, version) VALUES 
(1, 1, NULL, CURRENT_TIMESTAMP + INTERVAL '1 day', CURRENT_TIMESTAMP + INTERVAL '1 day 2 hours', 5, 'AVAILABLE', NULL, 0);

-- Insert test guardianship
INSERT INTO virtual_guardianships (id, user_id, animal_id, amount, is_active, created_at) VALUES 
(1, 1, 1, 50.00, true, CURRENT_TIMESTAMP);

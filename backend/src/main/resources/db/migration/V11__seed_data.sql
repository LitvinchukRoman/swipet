-- Seed data for Swipet development
-- This migration creates test users, shelters, and animals

-- Insert admin user (password: password)
INSERT INTO users (email, password_hash, full_name, role) VALUES 
('admin@swipet.com', '$2a$12$uMKrn2yMknSez2BCOsHt1e0Vw.pNwhL0TgwJ1nNCAjXZRELy8a7VO', 'Swipet Admin', 'ADMIN')
ON CONFLICT (email) DO NOTHING;

-- Insert shelter admin users (password: password)
INSERT INTO users (email, password_hash, full_name, role) VALUES 
('shelter_kyiv@swipet.com', '$2a$12$uMKrn2yMknSez2BCOsHt1e0Vw.pNwhL0TgwJ1nNCAjXZRELy8a7VO', 'Kyiv Shelter Admin', 'SHELTER_ADMIN'),
('shelter_kozelets@swipet.com', '$2a$12$uMKrn2yMknSez2BCOsHt1e0Vw.pNwhL0TgwJ1nNCAjXZRELy8a7VO', 'Kozelets Shelter Admin', 'SHELTER_ADMIN'),
('shelter_chernihiv@swipet.com', '$2a$12$uMKrn2yMknSez2BCOsHt1e0Vw.pNwhL0TgwJ1nNCAjXZRELy8a7VO', 'Chernihiv Shelter Admin', 'SHELTER_ADMIN')
ON CONFLICT (email) DO NOTHING;

-- Get user IDs for shelters
DO $$
DECLARE
    kyiv_shelter_id INT;
    kozelets_shelter_id INT;
    chernihiv_shelter_id INT;
    kyiv_admin_id INT;
    kozelets_admin_id INT;
    chernihiv_admin_id INT;
BEGIN
    SELECT id INTO kyiv_admin_id FROM users WHERE email = 'shelter_kyiv@swipet.com';
    SELECT id INTO kozelets_admin_id FROM users WHERE email = 'shelter_kozelets@swipet.com';
    SELECT id INTO chernihiv_admin_id FROM users WHERE email = 'shelter_chernihiv@swipet.com';

    -- Insert shelters in different cities
    INSERT INTO shelters (admin_user_id, name, description, address, city, location_lat, location_lng, phone, website_url, is_verified) VALUES 
    (kyiv_admin_id, 'Happy Paws Kyiv', 'We rescue and care for abandoned dogs and cats in Kyiv.', '15 Shevchenko Ave', 'Kyiv', 50.4501, 30.5234, '+380441234567', 'https://happypaws.kyiv', true),
    (kozelets_admin_id, 'Kozelets Animal Rescue', 'Dedicated to saving animals in Kozelets region.', '10 Central St', 'Kozelets', 50.9167, 31.0833, '+380456789012', 'https://kozeletsrescue.ua', true),
    (chernihiv_admin_id, 'Chernihiv Paws of Hope', 'A no-kill shelter focused on rehabilitation in Chernihiv.', '8 Soborna St', 'Chernihiv', 51.4982, 31.2893, '+380463456789', 'https://chernihivpaws.ua', true)
    ON CONFLICT DO NOTHING;

    SELECT id INTO kyiv_shelter_id FROM shelters WHERE name = 'Happy Paws Kyiv';
    SELECT id INTO kozelets_shelter_id FROM shelters WHERE name = 'Kozelets Animal Rescue';
    SELECT id INTO chernihiv_shelter_id FROM shelters WHERE name = 'Chernihiv Paws of Hope';

    -- Insert animals - 10 per shelter (equal distribution)
    INSERT INTO animals (shelter_id, name, species, age_months, size, gender, description, status, primary_photo_url) VALUES 
    -- Kyiv animals
    (kyiv_shelter_id, 'Buddy', 'DOG', 24, 'MEDIUM', 'MALE', 'Friendly and energetic Labrador mix, great with kids', 'AVAILABLE', 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400'),
    (kyiv_shelter_id, 'Luna', 'DOG', 18, 'SMALL', 'FEMALE', 'Sweet Chihuahua mix, loves cuddles', 'AVAILABLE', 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400'),
    (kyiv_shelter_id, 'Max', 'DOG', 36, 'LARGE', 'MALE', 'Gentle German Shepherd, well-trained', 'AVAILABLE', 'https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?w=400'),
    (kyiv_shelter_id, 'Mittens', 'CAT', 12, 'SMALL', 'FEMALE', 'Playful tabby cat, loves toys', 'AVAILABLE', 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400'),
    (kyiv_shelter_id, 'Rocky', 'DOG', 48, 'MEDIUM', 'MALE', 'Calm Bulldog mix, perfect for apartment living', 'AVAILABLE', 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400'),
    (kyiv_shelter_id, 'Charlie', 'DOG', 30, 'LARGE', 'MALE', 'Golden Retriever, very friendly and loyal', 'AVAILABLE', 'https://images.unsplash.com/photo-1558788353-f76d92427f16?w=400'),
    (kyiv_shelter_id, 'Bella', 'DOG', 15, 'MEDIUM', 'FEMALE', 'Beagle mix, curious and playful', 'AVAILABLE', 'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?w=400'),
    (kyiv_shelter_id, 'Oliver', 'CAT', 8, 'SMALL', 'MALE', 'Orange tabby kitten, very affectionate', 'AVAILABLE', 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=400'),
    (kyiv_shelter_id, 'Daisy', 'DOG', 42, 'MEDIUM', 'FEMALE', 'Husky mix, needs active family', 'AVAILABLE', 'https://images.unsplash.com/photo-1560743641-3914f2c8f9a8?w=400'),
    (kyiv_shelter_id, 'Simba', 'CAT', 24, 'MEDIUM', 'MALE', 'Maine Coon mix, majestic and calm', 'AVAILABLE', 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=400'),
    
    -- Kozelets animals
    (kozelets_shelter_id, 'Cooper', 'DOG', 60, 'LARGE', 'MALE', 'Older Labrador, gentle soul looking for retirement home', 'AVAILABLE', 'https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?w=400'),
    (kozelets_shelter_id, 'Sadie', 'DOG', 9, 'SMALL', 'FEMALE', 'Poodle mix, hypoallergenic and smart', 'AVAILABLE', 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400'),
    (kozelets_shelter_id, 'Jack', 'DOG', 20, 'MEDIUM', 'MALE', 'Terrier mix, energetic and fun', 'AVAILABLE', 'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=400'),
    (kozelets_shelter_id, 'Lily', 'CAT', 6, 'SMALL', 'FEMALE', 'Siamese mix, vocal and loving', 'AVAILABLE', 'https://images.unsplash.com/photo-1513245543132-31f507417b26?w=400'),
    (kozelets_shelter_id, 'Duke', 'DOG', 36, 'LARGE', 'MALE', 'Rottweiler mix, protective but gentle', 'AVAILABLE', 'https://images.unsplash.com/photo-1561037404-61cd46aa615b?w=400'),
    (kozelets_shelter_id, 'Chloe', 'CAT', 18, 'MEDIUM', 'FEMALE', 'Persian mix, calm and beautiful', 'AVAILABLE', 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400'),
    (kozelets_shelter_id, 'Bear', 'DOG', 54, 'LARGE', 'MALE', 'Newfoundland mix, great with children', 'AVAILABLE', 'https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?w=400'),
    (kozelets_shelter_id, 'Zoe', 'DOG', 12, 'SMALL', 'FEMALE', 'Yorkshire Terrier, spunky and cute', 'AVAILABLE', 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400'),
    (kozelets_shelter_id, 'Oscar', 'CAT', 36, 'MEDIUM', 'MALE', 'British Shorthair, independent but loving', 'AVAILABLE', 'https://images.unsplash.com/photo-1495360010541-f48722b34f7d?w=400'),
    (kozelets_shelter_id, 'Molly', 'DOG', 28, 'MEDIUM', 'FEMALE', 'Australian Shepherd mix, smart and active', 'AVAILABLE', 'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?w=400'),
    
    -- Chernihiv animals
    (chernihiv_shelter_id, 'Toby', 'DOG', 22, 'MEDIUM', 'MALE', 'Friendly Spaniel mix, great with families', 'AVAILABLE', 'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=400'),
    (chernihiv_shelter_id, 'Cleo', 'CAT', 10, 'SMALL', 'FEMALE', 'Elegant Siamese, loves attention', 'AVAILABLE', 'https://images.unsplash.com/photo-1513245543132-31f507417b26?w=400'),
    (chernihiv_shelter_id, 'Bruno', 'DOG', 40, 'LARGE', 'MALE', 'Boxer mix, playful and loyal', 'AVAILABLE', 'https://images.unsplash.com/photo-1561037404-61cd46aa615b?w=400'),
    (chernihiv_shelter_id, 'Willow', 'CAT', 14, 'MEDIUM', 'FEMALE', 'Calico cat, independent but affectionate', 'AVAILABLE', 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400'),
    (chernihiv_shelter_id, 'Hank', 'DOG', 55, 'LARGE', 'MALE', 'Saint Bernard mix, gentle giant', 'AVAILABLE', 'https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?w=400'),
    (chernihiv_shelter_id, 'Ginger', 'CAT', 7, 'SMALL', 'FEMALE', 'Orange tabby, full of energy', 'AVAILABLE', 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400'),
    (chernihiv_shelter_id, 'Otis', 'DOG', 33, 'MEDIUM', 'MALE', 'Bulldog mix, calm and loving', 'AVAILABLE', 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400'),
    (chernihiv_shelter_id, 'Izzy', 'CAT', 20, 'MEDIUM', 'FEMALE', 'Tortoiseshell, quiet and sweet', 'AVAILABLE', 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400'),
    (chernihiv_shelter_id, 'Rex', 'DOG', 45, 'LARGE', 'MALE', 'Doberman mix, protective and smart', 'AVAILABLE', 'https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?w=400'),
    (chernihiv_shelter_id, 'Nala', 'CAT', 16, 'SMALL', 'FEMALE', 'Ragdoll mix, loves being held', 'AVAILABLE', 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=400')
    ON CONFLICT DO NOTHING;
END $$;

-- Sync sequences
SELECT setval(pg_get_serial_sequence('users', 'id'), (SELECT MAX(id) FROM users));
SELECT setval(pg_get_serial_sequence('shelters', 'id'), (SELECT MAX(id) FROM shelters));
SELECT setval(pg_get_serial_sequence('animals', 'id'), (SELECT MAX(id) FROM animals));

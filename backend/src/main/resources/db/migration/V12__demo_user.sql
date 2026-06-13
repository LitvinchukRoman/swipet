-- Demo end-user account for the "Try a demo" button on the login screen.
-- Password: "password" (same bcrypt hash as the other seeded accounts in V11).
-- Role USER so the demo lands in the main swiping app.
INSERT INTO users (email, password_hash, full_name, role) VALUES
('demo@swipet.com', '$2a$12$uMKrn2yMknSez2BCOsHt1e0Vw.pNwhL0TgwJ1nNCAjXZRELy8a7VO', 'Demo User', 'USER')
ON CONFLICT (email) DO NOTHING;

SELECT setval(pg_get_serial_sequence('users', 'id'), (SELECT MAX(id) FROM users));

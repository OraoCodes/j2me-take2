-- Insert initial categories
INSERT INTO categories (name, description) VALUES
    ('Games', 'Entertainment and gaming applications'),
    ('Utilities', 'Practical tools and utilities'),
    ('Social', 'Social networking and communication apps'),
    ('Media', 'Music, video, and multimedia applications'),
    ('Productivity', 'Business and productivity tools'),
    ('Education', 'Learning and educational applications'),
    ('Sports', 'Sports-related applications and tools'),
    ('Travel', 'Travel and navigation applications');

-- Insert a test user (this will be replaced by actual user registration)
INSERT INTO users (id, email) VALUES
    ('00000000-0000-0000-0000-000000000000', 'test@example.com');

-- Insert a test profile
INSERT INTO profiles (id, full_name, avatar_url) VALUES
    ('00000000-0000-0000-0000-000000000000', 'Test User', 'https://avatars.githubusercontent.com/u/1234567');

-- Insert a test J2ME app
INSERT INTO j2me_apps (id, title, description, version, file_url, icon_url, created_by) VALUES
    ('11111111-1111-1111-1111-111111111111', 
     'Tetris J2ME', 
     'Classic Tetris game for J2ME devices', 
     '1.0.0', 
     'https://example.com/apps/tetris.jar', 
     'https://example.com/apps/tetris-icon.png',
     '00000000-0000-0000-0000-000000000000');

-- Link the test app to categories
INSERT INTO app_categories (app_id, category_id) 
SELECT 
    '11111111-1111-1111-1111-111111111111',
    id
FROM categories 
WHERE name = 'Games';

-- Insert a test download
INSERT INTO downloads (app_id, user_id) VALUES
    ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000');

-- Insert a test rating
INSERT INTO ratings (app_id, user_id, rating, comment) VALUES
    ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 5, 'Great game! Works well on my device.'); 
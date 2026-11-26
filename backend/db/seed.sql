-- NGO Donation & Inventory Management System
-- Sample Seed Data (MySQL 8.0)

USE ngo_inventory_db;

INSERT INTO categories (name, description) VALUES
  ('Food & Grains', 'Staple grains, pulses, cooking oil, and dry food rations'),
  ('Clothing & Blankets', 'Warm blankets, seasonal garments, and winter essentials'),
  ('Medicines & First Aid', 'OTC medicines, bandages, ORS packets, and first-aid kits'),
  ('Books & Education', 'School notebooks, textbooks, and classroom stationery sets'),
  ('Hygiene & Sanitation', 'Soap bars, sanitary kits, and clean drinking water filters');

INSERT INTO donors (name, contact_info) VALUES
  ('Sunrise Community Foundation', 'contact@sunrisefoundation.org'),
  ('Ananya Sharma & Family', 'ananya.sharma@example.org'),
  ('Metro Pharmacy Collective', 'donations@metropharmacy.org'),
  ('Greenfield Rotary Club', 'service@greenfieldrotary.org'),
  ('City Book Trust', 'outreach@citybooktrust.org');

INSERT INTO items (name, category_id, unit, min_threshold) VALUES
  ('Basmati Rice Bags', 1, 'kg', 100),
  ('Lentil & Dal Packs', 1, 'kg', 60),
  ('Woolen Blankets', 2, 'pieces', 40),
  ('Children Winter Jackets', 2, 'pieces', 25),
  ('First-Aid Medical Kits', 3, 'kits', 20),
  ('Oral Rehydration Salts (ORS)', 3, 'boxes', 30),
  ('School Notebook Bundles', 4, 'packs', 50),
  ('Primary Science Textbooks', 4, 'copies', 30),
  ('Family Hygiene Kits', 5, 'kits', 25);

INSERT INTO donations (donor_id, item_id, quantity, unit, donation_date, notes) VALUES
  (1, 1, 350, 'kg', '2026-11-05', 'Monthly staple grain drive delivery'),
  (1, 2, 180, 'kg', '2026-11-08', 'Assorted red and yellow lentils'),
  (4, 3, 120, 'pieces', '2026-11-10', 'Pre-winter shelter relief consignment'),
  (2, 4, 45, 'pieces', '2026-11-12', 'New insulated jackets ages 6-12'),
  (3, 5, 50, 'kits', '2026-11-14', 'Standard 24-item trauma and bandage kits'),
  (3, 6, 40, 'boxes', '2026-11-16', '50 sachets per box, expiry 2028'),
  (5, 7, 220, 'packs', '2026-11-18', 'Pack of 6 ruled notebooks each'),
  (5, 8, 60, 'copies', '2026-11-20', 'Grade 4 to Grade 6 curriculum editions'),
  (4, 9, 80, 'kits', '2026-11-21', 'Soap, toothpaste, towels, and sanitizer');

INSERT INTO distributions (item_id, quantity, unit, beneficiary_location, distribution_date, notes) VALUES
  (1, 140, 'kg', 'Eastward Community Kitchen', '2026-11-11', 'Weekly meal prep allocation'),
  (2, 135, 'kg', 'Riverfront Shelter Home', '2026-11-15', 'Dry ration packs for 45 families'),
  (3, 92, 'pieces', 'North Station Night Shelter', '2026-11-17', 'Cold wave distribution drive'),
  (4, 45, 'pieces', 'Hillside Youth Center', '2026-11-19', 'Complete batch issued to students'),
  (5, 36, 'kits', 'Rural Mobile Health Camp - Zone B', '2026-11-21', 'Issued to volunteer nursing team'),
  (6, 12, 'boxes', 'West Ward Primary Clinic', '2026-11-22', 'Pediatric ward replenishment'),
  (7, 95, 'packs', 'Vidya Community Learning Center', '2026-11-23', 'Semester notebook distribution'),
  (9, 42, 'kits', 'South Colony Relief Camp', '2026-11-24', 'Household sanitation kits');

INSERT INTO inventory (item_id, total_received, total_distributed, current_stock) VALUES
  (1, 350, 140, 210),
  (2, 180, 135, 45),
  (3, 120, 92, 28),
  (4, 45, 45, 0),
  (5, 50, 36, 14),
  (6, 40, 12, 28),
  (7, 220, 95, 125),
  (8, 60, 0, 60),
  (9, 80, 42, 38);

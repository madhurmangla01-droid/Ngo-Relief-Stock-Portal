-- NGO Donation & Inventory Management System
-- MySQL 8.0 Database Schema (Immutable Ledger & Authorized NGO Access)

CREATE DATABASE IF NOT EXISTS ngo_inventory_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE ngo_inventory_db;

-- 1. Authorized NGOs
CREATE TABLE IF NOT EXISTS ngos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  registration_number VARCHAR(80) NOT NULL UNIQUE,
  city_state VARCHAR(120) NOT NULL,
  focus_area VARCHAR(100) NOT NULL DEFAULT 'Community Relief',
  official_phone VARCHAR(40) NOT NULL,
  is_authorized TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Authorized NGO Users
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ngo_id INT NOT NULL,
  display_name VARCHAR(120) NOT NULL,
  email VARCHAR(180) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(60) NOT NULL DEFAULT 'Authorized Coordinator',
  avatar_url MEDIUMTEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_ngo FOREIGN KEY (ngo_id) REFERENCES ngos(id) ON DELETE RESTRICT
);

-- 3. Donors
CREATE TABLE IF NOT EXISTS donors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL UNIQUE,
  contact_info VARCHAR(180) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Categories
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. Items
CREATE TABLE IF NOT EXISTS items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  category_id INT NOT NULL,
  unit VARCHAR(40) NOT NULL DEFAULT 'units',
  min_threshold DECIMAL(12, 2) NOT NULL DEFAULT 10,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_item_name_category (name, category_id),
  CONSTRAINT fk_items_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
);

-- 6. Inventory / Current Stock
CREATE TABLE IF NOT EXISTS inventory (
  id INT AUTO_INCREMENT PRIMARY KEY,
  item_id INT NOT NULL UNIQUE,
  total_received DECIMAL(12, 2) NOT NULL DEFAULT 0,
  total_distributed DECIMAL(12, 2) NOT NULL DEFAULT 0,
  current_stock DECIMAL(12, 2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_inventory_item FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE RESTRICT,
  CONSTRAINT chk_inventory_non_negative CHECK (current_stock >= 0)
);

-- 7. Donations (Goods-In — Immutable Append-Only Ledger)
CREATE TABLE IF NOT EXISTS donations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  donor_id INT NOT NULL,
  item_id INT NOT NULL,
  quantity DECIMAL(12, 2) NOT NULL,
  unit VARCHAR(40) NOT NULL,
  donation_date DATE NOT NULL,
  notes TEXT NULL,
  recorded_by INT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_donations_donor FOREIGN KEY (donor_id) REFERENCES donors(id) ON DELETE RESTRICT,
  CONSTRAINT fk_donations_item FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE RESTRICT,
  CONSTRAINT fk_donations_user FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT chk_donations_qty CHECK (quantity > 0)
);

-- 8. Distributions (Goods-Out — Immutable Append-Only Ledger)
CREATE TABLE IF NOT EXISTS distributions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  item_id INT NOT NULL,
  quantity DECIMAL(12, 2) NOT NULL,
  unit VARCHAR(40) NOT NULL,
  beneficiary_location VARCHAR(200) NOT NULL,
  distribution_date DATE NOT NULL,
  notes TEXT NULL,
  recorded_by INT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_distributions_item FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE RESTRICT,
  CONSTRAINT fk_distributions_user FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT chk_distributions_qty CHECK (quantity > 0)
);

-- Immutability Triggers: Prevent deletion of transaction and audit records
DELIMITER //
CREATE TRIGGER prevent_delete_donations
BEFORE DELETE ON donations
FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Donation records are permanent and cannot be deleted.';
END//

CREATE TRIGGER prevent_delete_distributions
BEFORE DELETE ON distributions
FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Distribution records are permanent and cannot be deleted.';
END//
DELIMITER ;

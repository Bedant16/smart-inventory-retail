-- Smart Retail Inventory Monitoring System: schema (MySQL 8 / MariaDB 10.5+)
-- Re-running this file resets the database.
CREATE DATABASE IF NOT EXISTS retail_inventory CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE retail_inventory;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS alerts, inventory_transactions, purchase_order_items, purchase_orders,
                     sales, products, suppliers, categories, users;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(100) NOT NULL,
  role ENUM('ADMIN','MANAGER','STAFF') NOT NULL DEFAULT 'STAFF',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE categories (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE suppliers (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  contact_person VARCHAR(100),
  email VARCHAR(150),
  phone VARCHAR(30),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE products (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  sku VARCHAR(40) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  category_id INT UNSIGNED NOT NULL,
  supplier_id INT UNSIGNED NULL,
  price DECIMAL(10,2) NOT NULL,
  cost_price DECIMAL(10,2) NOT NULL,
  current_stock INT NOT NULL DEFAULT 0,
  minimum_stock INT NOT NULL DEFAULT 0,
  reorder_level INT NOT NULL DEFAULT 0,
  unit VARCHAR(20) NOT NULL DEFAULT 'unit',
  status ENUM('ACTIVE','DISCONTINUED') NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id),
  CONSTRAINT fk_products_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
  CONSTRAINT chk_products_stock CHECK (current_stock >= 0 AND minimum_stock >= 0 AND reorder_level >= minimum_stock),
  CONSTRAINT chk_products_price CHECK (price >= 0 AND cost_price >= 0),
  INDEX idx_products_name (name),
  INDEX idx_products_category (category_id),
  INDEX idx_products_supplier (supplier_id)
) ENGINE=InnoDB;

CREATE TABLE sales (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id INT UNSIGNED NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  sold_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  sold_by INT UNSIGNED NULL,
  CONSTRAINT fk_sales_product FOREIGN KEY (product_id) REFERENCES products(id),
  CONSTRAINT fk_sales_user FOREIGN KEY (sold_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT chk_sales_qty CHECK (quantity > 0),
  INDEX idx_sales_sold_at (sold_at),
  INDEX idx_sales_product_date (product_id, sold_at)
) ENGINE=InnoDB;

CREATE TABLE purchase_orders (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  supplier_id INT UNSIGNED NOT NULL,
  status ENUM('DRAFT','ORDERED','RECEIVED','CANCELLED') NOT NULL DEFAULT 'DRAFT',
  order_date DATE NOT NULL,
  expected_date DATE NULL,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  CONSTRAINT fk_po_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
  INDEX idx_po_supplier_status (supplier_id, status)
) ENGINE=InnoDB;

CREATE TABLE purchase_order_items (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  purchase_order_id INT UNSIGNED NOT NULL,
  product_id INT UNSIGNED NOT NULL,
  quantity INT NOT NULL,
  unit_cost DECIMAL(10,2) NOT NULL,
  CONSTRAINT fk_poi_order FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_poi_product FOREIGN KEY (product_id) REFERENCES products(id),
  INDEX idx_poi_product (product_id)
) ENGINE=InnoDB;

CREATE TABLE inventory_transactions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id INT UNSIGNED NOT NULL,
  transaction_type ENUM('SALE','PURCHASE','RETURN','ADJUSTMENT') NOT NULL,
  quantity INT NOT NULL COMMENT 'signed change in stock',
  previous_stock INT NOT NULL,
  new_stock INT NOT NULL,
  reference_id INT UNSIGNED NULL COMMENT 'sales.id for SALE, purchase_orders.id for PURCHASE',
  transaction_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  notes VARCHAR(255) NULL,
  created_by INT UNSIGNED NULL,
  CONSTRAINT fk_it_product FOREIGN KEY (product_id) REFERENCES products(id),
  CONSTRAINT fk_it_user FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_it_date (transaction_date),
  INDEX idx_it_product_date (product_id, transaction_date)
) ENGINE=InnoDB;

CREATE TABLE alerts (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id INT UNSIGNED NOT NULL,
  alert_type ENUM('CRITICAL_STOCK','LOW_STOCK','STOCKOUT_RISK') NOT NULL,
  message VARCHAR(255) NOT NULL,
  severity ENUM('CRITICAL','WARNING') NOT NULL,
  is_resolved TINYINT(1) NOT NULL DEFAULT 0,
  resolution ENUM('MANUAL','AUTO') NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP NULL,
  CONSTRAINT fk_alerts_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_alerts_product_state (product_id, is_resolved),
  INDEX idx_alerts_state_created (is_resolved, created_at)
) ENGINE=InnoDB;

# Smart Retail Inventory Monitoring System

An internal tool for a store manager to track products, stock levels, sales, suppliers and low-stock risk.
React + Express + a locally installed MySQL database. Nothing runs in the cloud.

"Smart" here means **rule-based inventory analytics** (sales velocity and days-to-stockout). There is no machine learning.

## Features

- Dashboard: inventory value, low and critical counts, today / week / month sales, 30-day sales trend, stock value by category, top sellers, open alerts
- Products: search, category and stock-status filters, sorting, add / edit / delete, detail page with velocity, days left and recent history
- Inventory: full stock ledger (previous and new stock per movement), manual purchase / return / adjustment entries
- Sales: record a sale in one database transaction (sale row, stock decrease, ledger entry, alert refresh)
- Suppliers: add / edit, products supplied, open purchase orders
- Alerts: generated from real stock and sales data, cleared automatically when stock recovers, or resolved by hand
- Login with hashed passwords (bcrypt) and roles: **ADMIN** and **MANAGER** can change inventory; **STAFF** can view and record sales

## How the stock rules work

```
average_daily_sales = units sold in the last 14 days / 14
days_until_stockout = current_stock / average_daily_sales

current_stock <= minimum_stock                  -> CRITICAL
else current_stock <= reorder_level             -> LOW STOCK
else days_until_stockout <= 3                   -> STOCKOUT RISK
otherwise                                       -> HEALTHY
```

Alerts include a reorder suggestion (enough for twice the reorder level or two weeks of sales, whichever is larger).
The 14-day window and 3-day risk threshold are set in `backend/.env` (`VELOCITY_WINDOW_DAYS`, `STOCKOUT_RISK_DAYS`).
Alerts are recalculated on server start and after every sale, stock movement and product edit.
An alert you resolve by hand is not raised again unless it escalates (for example Low to Critical) or the stock recovers first.

## Setup

Requirements: Node.js 18+, MySQL 8 (MariaDB 10.5+ also works), Python 3 only if you want to regenerate the seed data.

1. **Install MySQL** and make sure it is running.
2. **Create the database and tables** (this also creates the `retail_inventory` database; re-running it resets everything):
   ```
   mysql -u root -p < database/schema.sql
   ```
3. **Load the sample data** (39 products, 6 suppliers, 30 days of sales):
   ```
   mysql -u root -p < database/seed.sql
   ```
4. **Configure the backend**: copy `backend/.env.example` to `backend/.env` and set `DB_PASSWORD` and `JWT_SECRET`.
5. **Install dependencies** (installs root, backend and frontend):
   ```
   npm install
   ```
6. **Run both servers**:
   ```
   npm run dev
   ```
   Open http://localhost:5173. The API runs on http://localhost:4000 (health check: `/api/health`).

### Demo accounts

| Role    | Email               | Password   |
|---------|---------------------|------------|
| Admin   | admin@store.local   | admin123   |
| Manager | manager@store.local | manager123 |
| Staff   | staff@store.local   | staff123   |

Change these from Settings before using the system for anything real.

## Project structure

```
retail-inventory/
  database/    schema.sql, seed.sql, generate_seed.py
  backend/src/ config/ routes/ controllers/ services/ repositories/ middleware/ utils/
  frontend/src/ components/ pages/ layouts/ services/ hooks/ utils/
```

Requests flow `route -> controller -> service -> repository -> MySQL`. SQL lives only in `repositories/`, always parameterised.
Business rules (stock analysis, alerts, transactional sales) live in `services/`.

## About the database driver

The backend uses `mysql2`, the standard Node.js MySQL client, with a connection pool and explicit transactions.
It is the Node equivalent of MySQL Connector/J: Connector/J is a Java (JDBC) driver and cannot be used from Node.
If your submission must use JDBC specifically, the schema and SQL here carry over unchanged to a Java backend.

## API summary

All routes except login need `Authorization: Bearer <token>`. Write routes need ADMIN or MANAGER, except `POST /api/sales`.

```
POST /api/auth/login            GET  /api/auth/me          PUT /api/auth/password
GET  /api/products              GET  /api/products/:id     POST /api/products     PUT /api/products/:id     DELETE /api/products/:id
GET  /api/inventory             GET  /api/inventory/low-stock                       POST /api/inventory/transaction
GET  /api/sales                 POST /api/sales
GET  /api/suppliers             POST /api/suppliers        PUT /api/suppliers/:id
GET  /api/alerts                PUT  /api/alerts/:id/resolve
GET  /api/dashboard/summary     /sales    /stock    /top-products
GET  /api/categories
```

## Behaviour worth knowing

- Stock changes only through sales and stock movements, never by editing a product, so the ledger always adds up.
- Deleting a product that has sales or stock history marks it **discontinued** instead, so past records stay intact.
- Sales lock the product row, so two simultaneous sales cannot oversell.
- Seed dates are relative to the moment you run `seed.sql`, so the dashboard always shows recent activity.
# smart-inventory-retail

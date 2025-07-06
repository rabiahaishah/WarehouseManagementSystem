# Warehouse Management System (WMS)

A full-featured, containerized Warehouse Management System (WMS) built using **Django REST Framework**, **React**, **Tailwind CSS**, and **PostgreSQL**, designed for managing inventory, inbound/outbound stock, forecasting, barcode scanning, and role-based access control.

## Tech Stack

| Layer         | Technology                                 |
|---------------|--------------------------------------------|
| Backend       | Django REST Framework                      |
| Frontend      | React + Tailwind CSS                       |
| Database      | PostgreSQL                                 |
| Container     | Docker + Docker Compose                    |
| Deployment    | AWS EC2 + Nginx + Gunicorn + HTTPS         |

## Features Overview

### Inventory Management
- Add, update, delete, archive products
- Search by name, SKU, tag, or category
- Low stock alerts with thresholds
- Audit logs per product
- Bulk upload via CSV

### Inbound Management
- Log incoming stock: product, quantity, supplier, invoice
- File attachment support (e.g., delivery orders)
- CSV bulk upload
- Auto-update product inventory
- Scan barcode to auto-select product

### Outbound Management
- Record outbound stock dispatch
- CSV bulk upload
- Attach signed delivery orders
- Prevent negative stock transactions
- Real-time stock deduction

### User & Role Management
- JWT-based authentication
- Roles: Admin, Manager, Operator
- Per-role access control (read/write/delete/module)
- Audit logging (who did what, when, on what)

### Dashboard & Insights
- Total stock, today’s inbound/outbound
- Low stock alerts
- Recent activity stream
- Daily transaction chart

### Cycle Count & Reconciliation
- Manual stock count input
- Real-time discrepancy calculation
- Log adjustment reason

### Barcode / QR Code Integration
- Generate barcode and QR per SKU
- Scan barcode to auto-fill inbound/outbound forms

### Stock Forecasting
- Predict when items will run out using historical data
- Estimate days left based on outbound average
- Visual forecast insights per product


## User Roles

| Role     | Access Level                                                    |
|----------|------------------------------------------------------------------|
| **Admin**    | Full access, including deletion and bulk imports             |
| **Manager**  | Moderate control (no delete, no bulk imports)                |
| **Operator** | Day-to-day operations (view, add, scan, etc.)  

## Installation & Setup

### Prerequisites

- [Docker](https://www.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)

### 1. Clone the repository

```bash
git clone https://github.com/rabiahaishah/WarehouseManagementSystem.git
cd wms-artiselite
```

### 2. Run the app
```
docker-compose up --build
```
Then open:
- Frontend: http://localhost:5173/login
- Backend API: http://localhost:8000/api/

# Warehouse Management System (WMS)

A full-featured, containerized Warehouse Management System (WMS) built using **Django REST Framework**, **React**, **Tailwind CSS**, and **PostgreSQL**, designed for managing inventory, inbound/outbound stock, forecasting, barcode scanning, and role-based access control.

## Tech Stack

| Layer         | Technology                                 |
|---------------|--------------------------------------------|
| Backend       | Django REST Framework                      |
| Frontend      | Vite + React + Tailwind CSS                       |
| Database      | PostgreSQL                                 |
| Container     | Docker + Docker Compose                    |

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
- Scan barcode to automatically select the product

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


## User & Role Access

| Role     | Access Level                                                    |
|----------|------------------------------------------------------------------|
| **Admin**    | Full access, including deletion and bulk imports             |
| **Manager**  | Moderate control (no delete, no bulk imports)                |
| **Operator** | Day-to-day operations (view, add, scan, etc.)  

## Installation & Setup

### Prerequisites

Before setting up the project locally, ensure the following tools are installed on your system:

- **Python 3.9 or later** – for the Django backend  
- **Node.js v16 or later** – required for the React frontend  
- **npm** – comes bundled with Node.js
- **PostgreSQL** – used as the database engine  
- **Git** – to clone the repository  
- **Docker**  
- **Docker Compose**  

### Backend Setup 

**1. Clone the repository:**
```bash
git clone https://github.com/rabiahaishah/WarehouseManagementSystem.git
cd backend
```

**2. Create virtual environment & install dependencies:**
```bash
python -m venv venv
source venv/bin/activate      # Mac/Linux
venv\Scripts\activate         # Windows

pip install -r requirements.txt
```

**3. Apply database migrations:**
```
python manage.py migrate
```

**4. Create a superuser:**
```
python manage.py createsuperuser
```

**5. Run the backend server:**
```
python manage.py runserver
```

The API will be available at: http://127.0.0.1:8000/

### Frontend Setup 

**1. Go to frontend folder:**
```
cd frontend/wms-frontend
```

**2. Install dependencies:**
```
npm install
```

**3. Run the dev server:**
```
npm run dev
```

The frontend will be available at: http://localhost:5173/

## User Guide

### 1. Login
- Navigate to: `http://localhost:5173/login`
- Enter your credentials.
- Roles: `admin`, `manager`, `operator`

Login generates a secure JWT token used for protected routes.

### 2. Inventory Management
- Navigate to: `/inventory`
- View list of products
- Use search by keyword, SKU, tag, or category
- Click “Add Product” to create a new item
- Click “Edit” or “Delete” to manage existing entries
- Click “Archive” to hide products from daily operations
- Upload CSV to bulk import products
- Click “Barcode” to view SKU barcodes/QRs
- Click "Logs" to view audit log.

### 3. Inbound Management
- Navigate to: `/inbound`
- Fill in product, supplier, quantity, invoice number, and upload document
- Click “Scan Barcode to Select Product” to auto-select product
- Upload CSV to bulk import inbound stock
- All inbound entries will auto-update product quantity

### 4. Outbound Management
- Navigate to: `/outbound`
- Record customer dispatch: product, quantity, SO reference, file attachment
- Scan/upload barcode to select product 
- Prevents negative stock automatically
- Bulk outbound via CSV also supported

### 5. Dashboard Insights
- Navigate to: `/dashboard`
- View:
  - Total inventory value
  - Daily inbound/outbound activity
  - Low stock alerts
  - Recent activities stream
  - Daily transactions

### 6. Cycle Count & Reconciliation
- Navigate to: `/cycle-count`
- Select a product
- Enter your physically counted quantity
- System will:
  - Show current system quantity
  - Calculate discrepancy
  - Prompt reason for adjustment
  - View historical counts & adjustments

### 7. Stock Forecasting
- Navigate to: `/forecast`
- Select a product (by SKU)
- System displays:
  - Current quantity
  - Average daily outbound usage
  - Predicted days remaining until stock runs out

### 8. Barcode / QR Scanning
- In Inbound/Outbound pages, click “Scan Barcode”
- Use your webcam to scan SKU barcode / upload an image of barcode
- Product auto-fills in the form
- Click “Barcode” in inventory to preview SKU barcodes and QR codes

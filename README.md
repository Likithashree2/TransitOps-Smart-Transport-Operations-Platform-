# 🚍 TransitOps — Smart Transport Operations Platform

> An intelligent fleet management and transport operations platform designed to centralize vehicle management, driver safety, trip dispatching, maintenance tracking, fuel monitoring, operational expenses, analytics, and AI-assisted operational intelligence.

---

# 📌 Overview

TransitOps is a full-stack smart transport operations management platform that enables fleet operators to manage their complete transportation ecosystem through a centralized digital dashboard.

The platform replaces manual fleet management workflows with an integrated system for:

- Vehicle lifecycle management
- Driver safety and compliance monitoring
- Smart trip dispatching
- Maintenance scheduling
- Fuel consumption tracking
- Expense management
- Operational analytics
- AI-powered fleet insights

TransitOps combines a modern React frontend with a FastAPI backend and PostgreSQL database to provide reliable data management, business-rule validation, and intelligent operational decision support.

---

# 🎯 Problem Statement

Traditional transport operations often rely on spreadsheets and manual coordination for:

- Vehicle allocation
- Driver assignment
- Trip monitoring
- Maintenance tracking
- Fuel management
- Expense reporting

This creates challenges such as:

- Inefficient fleet utilization
- Increased operational costs
- Delayed maintenance decisions
- Compliance risks
- Lack of real-time operational visibility

TransitOps solves these challenges by providing a centralized intelligent fleet management platform.

---

# ✨ Features

## 🔐 Authentication & Role-Based Access Control

Secure authentication system with role-based permissions.

Supported roles:

- Fleet Manager
- Dispatcher
- Safety Officer
- Financial Analyst

Features:

- JWT-based authentication
- Protected application routes
- Role-specific module access
- Account security and lockout protection

---

# 📊 Operations Dashboard

A centralized operational dashboard providing:

- Fleet KPI monitoring
- Active trip tracking
- Available vehicle count
- Maintenance alerts
- Driver availability
- Fleet utilization percentage
- Vehicle status distribution
- Recent trip activity

The dashboard provides quick visibility into current fleet performance.

---

# 🚚 Vehicle Registry

Complete fleet lifecycle management.

Capabilities:

- Register vehicles
- Track vehicle models
- Manage vehicle capacity
- Monitor odometer readings
- Track acquisition cost
- Manage vehicle regions
- Update operational status

Vehicle statuses:

```
Available
On Trip
In Shop
Retired
```

---

# 👨‍✈️ Drivers & Safety Profiles

Manage driver information and compliance.

Features:

- Driver profile management
- License tracking
- License expiry monitoring
- Safety score tracking
- Trip completion percentage
- Driver availability monitoring

Driver statuses:

```
Available
On Trip
Off Duty
Suspended
```

---

# 🗺️ Smart Trip Dispatcher

TransitOps provides a complete trip lifecycle management system.

Trip workflow:

```
Draft → Dispatched → Completed
                   ↘ Cancelled
```

Dispatcher capabilities:

- Create trips
- Assign vehicles
- Assign drivers
- Define cargo weight
- Record planned distance
- Dispatch trips
- Complete trips
- Cancel trips

---

# 🛡️ Dispatch Safety Rules

Before dispatching a trip, TransitOps validates operational rules.

A trip cannot be dispatched when:

- Vehicle is unavailable
- Vehicle is already assigned to another active trip
- Vehicle is under maintenance
- Vehicle is retired
- Driver is unavailable
- Driver is already assigned
- Driver is suspended
- Driver license has expired
- Cargo exceeds vehicle capacity

Example:

```
Vehicle Capacity: 500 kg
Cargo Weight: 700 kg

Result:
Dispatch Blocked —
Capacity exceeded by 200 kg.
```

All dispatch operations update:

- Trip status
- Vehicle status
- Driver status

inside a single database transaction.

---

# 🔧 Maintenance Management

Track complete vehicle maintenance workflows.

Features:

- Create maintenance records
- Track service details
- Record maintenance costs
- Move vehicles into maintenance
- Complete repair activities
- Restore vehicle availability

When maintenance begins:

```
Vehicle → In Shop
```

Vehicles under maintenance cannot be dispatched.

---

# ⛽ Fuel Management

Monitor fleet fuel operations.

Features:

- Record fuel usage
- Track fuel quantity
- Track fuel cost
- Associate fuel logs with trips
- Analyze fuel efficiency

---

# 💰 Expense Management

Track operational expenses.

Features:

- Record expenses
- Associate costs with vehicles
- Associate expenses with trips
- Categorize operational spending
- Monitor fleet expenditure

---

# 📈 Reports & Analytics

TransitOps calculates operational insights directly from PostgreSQL data.

Analytics include:

### Fuel Efficiency

Measures vehicle fuel performance.

### Fleet Utilization

Analyzes vehicle usage and availability.

### Operational Cost

Calculated using:

```
Fuel Cost + Maintenance Cost + Expenses
```

### Vehicle ROI

Calculated using:

```
(Revenue - Fuel - Maintenance - Expenses)
------------------------------------------------ × 100
              Acquisition Cost
```

### Reports

Includes:

- Monthly revenue analysis
- Costliest vehicles
- Fleet performance reports
- CSV export support

---

# 🤖 Smart Operational Intelligence

TransitOps includes AI-assisted operational features.

## AI Dispatch Copilot

Supports natural language operational requests.

Example:

```
Send the nearest available van to Ahmedabad Hub with 400kg cargo.
```

The system provides operational suggestions while final dispatch validation remains controlled by business rules.

---

## Maintenance Risk Analysis

Analyzes:

- Vehicle odometer
- Maintenance history
- Repair frequency
- Maintenance cost

Generates maintenance risk insights.

---

## Fuel Anomaly Detection

Identifies unusual fuel behaviour by comparing:

- Historical efficiency
- Recent consumption
- Cost patterns

---

## License Expiry Alerts

Detects:

- Expired licenses
- Licenses approaching expiry

Helping fleet teams maintain compliance.

---

# 🏗️ System Architecture

```
                 React + TypeScript Frontend
                            |
                            |
                    Axios / API Layer
                            |
                            |
                    FastAPI Backend
                            |
          --------------------------------
          |                              |
   Business Rules                  AI Services
          |
          |
      SQLAlchemy ORM
          |
          |
      PostgreSQL Database
```

---

# 🛠️ Technology Stack

## Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- Zustand
- Axios
- TanStack React Query
- React Router

## Backend

- Python
- FastAPI
- SQLAlchemy 2.0
- Pydantic
- JWT Authentication
- Passlib / bcrypt
- Alembic

## Database

- PostgreSQL

## AI & Analytics

- Python-based operational scoring
- Maintenance risk analysis
- Fuel anomaly detection
- AI Dispatch Copilot

---

# 🗄️ Database Design

TransitOps uses a relational PostgreSQL database.

Core tables:

```
roles
users
vehicles
drivers
trips
maintenance_logs
fuel_logs
expenses
settings
vehicle_status_history
driver_status_history
trip_status_history
ai_insights
```

Status history tables maintain audit tracking for operational changes.

Dashboard and analytics metrics are dynamically calculated from operational data.

---

# 📂 Project Structure

```
TransitOps/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── features/
│   │   ├── store/
│   │   └── lib/
│   │
│   └── package.json
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── database/
│   │   ├── models/
│   │   ├── rules/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── main.py
│   │
│   ├── scripts/
│   │   └── seed.py
│   │
│   └── requirements.txt
│
├── screenshots/
│   ├── dashboard.png
│   ├── vehicles.png
│   ├── drivers.png
│   ├── trips.png
│   ├── maintenance.png
│   ├── fuel-expenses.png
│   ├── analytics.png
│   └── settings.png
│
└── README.md
```

---

# ⚙️ Installation & Setup

## Prerequisites

Install:

- Python 3.10+
- Node.js
- npm
- PostgreSQL
- Git

---

# Backend Setup

Navigate:

```bash
cd backend
```

Create environment:

```bash
python -m venv .venv
```

Activate:

Windows:

```bash
.venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

---

## Configure Environment

Create `.env`:

```env
DATABASE_URL=postgresql+psycopg://postgres:PASSWORD@localhost:5432/transitops_db

JWT_SECRET_KEY=YOUR_SECRET_KEY

GEMINI_API_KEY=YOUR_API_KEY

ENVIRONMENT=development
```

---

## Database Setup

Create database:

```sql
CREATE DATABASE transitops_db;
```

Run seed:

```bash
python scripts/seed.py
```

---

## Start Backend

```bash
uvicorn app.main:app --reload
```

Backend:

```
http://localhost:8000
```

API Docs:

```
http://localhost:8000/docs
```

---

# Frontend Setup

Navigate:

```bash
cd frontend
```

Install packages:

```bash
npm install
```

Create `.env`:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1

VITE_SOCKET_URL=http://localhost:8000

VITE_USE_DEMO_DATA=false
```

Run:

```bash
npm run dev
```

Frontend:

```
http://localhost:5173
```

---

# 🔐 Demo Credentials

Password for all accounts:

```
demo1234
```

| Role | Email |
|---|---|
| Fleet Manager | fleet@transitops.in |
| Dispatcher | dispatcher@transitops.in |
| Safety Officer | safety@transitops.in |
| Financial Analyst | finance@transitops.in |

---

# 📸 Application Screenshots

## 📊 Dashboard

<img src="screenshots/dashboard.jpeg" width="900"/>

---

## 🚚 Vehicle Registry

<img src="screenshots/vehicles.jpeg" width="900"/>

---

## 👨‍✈️ Drivers & Safety Profiles

<img src="screenshots/drivers.jpeg" width="900"/>

---

## 🗺️ Trip Dispatcher

<img src="screenshots/trips.jpeg" width="900"/>

---

## 🔧 Maintenance Management

<img src="screenshots/maintenance.jpeg" width="900"/>

---

## ⛽ Fuel & Expense Management

<img src="screenshots/fuel-expenses.jpeg" width="900"/>

---

## 📈 Analytics Dashboard

<img src="screenshots/analytics.jpeg" width="900"/>

---

## ⚙️ Settings & RBAC

<img src="screenshots/settings.jpeg" width="900"/>

---

# 🔒 Security

Implemented security measures:

- JWT authentication
- Role-based authorization
- Password hashing using bcrypt
- Account lockout protection
- Environment-based credentials
- Transaction-based state updates
- Backend business-rule validation

---

# 🚀 Future Enhancements

Planned improvements:

- Real-time GPS vehicle tracking
- Mobile driver application
- Route optimization
- WebSocket live operational events
- IoT sensor integration
- Advanced predictive maintenance models
- Cloud deployment
- Automated compliance notifications

---

# 🏆 Hackathon Project

Developed for:

**Odoo Hackathon 2026**

Project:

**TransitOps — Smart Transport Operations Platform**

---

# 👥 Team

| Name |
|---|
| Anushka |
| Divyashree |
| Likitha Shree |
| Pallavi K P |

---

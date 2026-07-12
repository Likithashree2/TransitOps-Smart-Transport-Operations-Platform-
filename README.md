# 🚍 TransitOps — Smart Transport Operations Platform

> An intelligent fleet management and transport operations platform designed to streamline vehicle management, trip dispatching, driver safety, maintenance tracking, fuel monitoring, analytics, and AI-assisted decision making.

---

## 📌 Overview

TransitOps is a full-stack smart transport operations platform that enables fleet operators to manage their entire transportation ecosystem from a centralized dashboard.

The platform replaces manual fleet management processes with a digital workflow for:

- Vehicle lifecycle management
- Driver management and safety monitoring
- Smart trip dispatching
- Maintenance scheduling
- Fuel and expense tracking
- Operational analytics
- AI-powered insights

TransitOps provides real-time operational visibility and helps organizations reduce costs, improve fleet utilization, and make data-driven decisions.

---

# 🎯 Problem Statement

Traditional transport operations often depend on spreadsheets and manual coordination for:

- Assigning vehicles and drivers
- Tracking trip status
- Monitoring maintenance schedules
- Managing fuel expenses
- Generating reports

These processes lead to:

- Inefficient resource utilization
- Increased operational costs
- Delayed maintenance decisions
- Lack of real-time fleet visibility
- Difficulty in identifying risks

TransitOps solves these challenges by providing an integrated intelligent fleet management system.

---

# ✨ Key Features

## 🔐 Authentication & Role-Based Access Control

Secure authentication system with role-based permissions.

Supported user roles:

- Dispatcher
- Fleet Manager
- Safety Officer
- Financial Analyst

Features:

- Secure login
- JWT-based authentication
- Role-specific access control
- Protected application routes

---

# 📊 Operations Dashboard

A centralized dashboard providing fleet insights:

- Total vehicles
- Active trips
- Vehicle availability
- Driver availability
- Maintenance alerts
- Operational KPIs

The dashboard helps managers quickly understand the current state of transport operations.

---

# 🚚 Vehicle Registry

Complete vehicle lifecycle management.

Capabilities:

- Add new vehicles
- Update vehicle details
- Track vehicle status
- Monitor utilization
- Maintain vehicle records

Vehicle states:

- Available
- On Trip
- In Shop
- Retired

---

# 👨‍✈️ Driver Safety Management

Manage driver profiles and compliance information.

Features:

- Driver profiles
- License tracking
- Safety scores
- Trip performance monitoring
- Driver availability management

Helps improve driver safety and operational reliability.

---

# 🗺️ Smart Trip Dispatcher

A rule-aware trip management system.

Features:

- Create trips
- Assign vehicles
- Assign drivers
- Dispatch trips
- Complete trips
- Cancel trips
- Track trip lifecycle

Business rules implemented:

- Prevent vehicle double booking
- Prevent driver conflicts
- Validate assignments
- Maintain consistent vehicle and driver states

---

# 🔧 Maintenance Management

Track vehicle maintenance activities.

Features:

- Schedule maintenance
- Monitor active repairs
- Track service history
- Manage maintenance costs

Benefits:

- Reduced vehicle downtime
- Better preventive maintenance planning
- Improved fleet reliability

---

# ⛽ Fuel & Expense Management

Monitor operational spending.

Features:

- Fuel log management
- Expense tracking
- Vehicle-wise cost analysis
- Operational expense monitoring

Helps identify cost optimization opportunities.

---

# 📈 Analytics & Reporting

Provides operational intelligence through:

- Fleet performance analysis
- Revenue tracking
- Cost analysis
- Vehicle ROI insights
- CSV report generation

---

# 🤖 AI-Powered Intelligence

TransitOps integrates AI capabilities to assist operational decision making.

## AI Operations Copilot

Provides intelligent assistance for:

- Dispatch recommendations
- Operational suggestions
- Decision support

## Predictive Insights

AI modules help identify:

- Maintenance risks
- Fuel anomalies
- Operational improvement opportunities

---

# 🏗️ System Architecture

```
                    React Frontend
                         |
                         |
                    REST API Layer
                         |
                         |
                    FastAPI Backend
                         |
          --------------------------------
          |                              |
     PostgreSQL Database            AI Services
          |
     SQLAlchemy ORM
```

---

# 🛠️ Tech Stack

## Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- Zustand
- Axios
- React Router
- Recharts

## Backend

- Python
- FastAPI
- SQLAlchemy
- Alembic
- PostgreSQL
- Pydantic
- JWT Authentication
- Psycopg

## AI

- Gemini API
- AI Copilot Services
- Predictive Analytics

## Development Tools

- Git
- GitHub
- VS Code
- PostgreSQL

---

# 📂 Project Structure

```
TransitOps/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── database/
│   │
│   ├── alembic/
│   ├── scripts/
│   └── requirements.txt
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
└── README.md
```

---

# ⚙️ Installation & Setup

## Clone Repository

```bash
git clone <repository-url>

cd TransitOps
```

---

# Backend Setup

Navigate to backend:

```bash
cd backend
```

Create virtual environment:

```bash
python -m venv venv
```

Activate environment:

Windows:

```bash
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

---

## Environment Configuration

Create a `.env` file inside the backend folder:

```
DATABASE_URL=postgresql+psycopg://username:password@localhost:5432/transitops_db

JWT_SECRET_KEY=your_secret_key

GEMINI_API_KEY=your_gemini_api_key

ENVIRONMENT=development
```

---

## Database Setup

Run migrations:

```bash
alembic upgrade head
```

Load demo data:

```bash
python scripts/seed.py
```

---

## Start Backend Server

```bash
uvicorn app.main:app --reload
```

Backend URL:

```
http://localhost:8000
```

API Documentation:

```
http://localhost:8000/docs
```

---

# Frontend Setup

Navigate:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Create `.env` file:

```
VITE_API_BASE_URL=http://localhost:8000/api/v1

VITE_USE_DEMO_DATA=false
```

Start frontend:

```bash
npm run dev
```

Frontend URL:

```
http://localhost:5173
```

---

# 🔑 Demo Credentials

## Dispatcher

Email:

```
dispatcher@transitops.in
```

Password:

```
demo1234
```

---

## Fleet Manager

Email:

```
fleet@transitops.in
```

Password:

```
demo1234
```

---

## Safety Officer

Email:

```
safety@transitops.in
```

Password:

```
demo1234
```

---

## Financial Analyst

Email:

```
finance@transitops.in
```

Password:

```
demo1234
```

---



# 🚀 Future Enhancements

Planned improvements:

- Real-time GPS vehicle tracking
- Mobile driver application
- Advanced route optimization
- IoT sensor integration
- Cloud deployment
- Machine learning based demand forecasting
- Automated maintenance prediction

---

# 🏆 Hackathon Project

Developed for:

**Odoo Hackathon 2026**

Project:

**TransitOps — Smart Transport Operations Platform**

---

# 👥 Team

Built by:

| Name | 
|------|
| Anushka | 
| Divyashree | 
| Likitha Shree | 
| Pallavi K P | 

---


# 🚨 AI-Based Smart Evacuation & Crowd Control System (Backend)

A modular monolithic backend built using FastAPI for real-time crowd monitoring, stampede risk prediction, and intelligent evacuation planning.

---

## 🧠 Overview

This backend powers an AI-driven system that:

* Detects and counts people using computer vision
* Estimates crowd density across building zones
* Predicts stampede risk using ML models
* Optimizes evacuation routes dynamically
* Provides APIs for frontend dashboard visualization

---

## 🏗️ Project Structure

```
backend/
│
├── main.py
│
├── routes/
│   ├── layout.py
│   ├── analysis.py
│
├── services/
│   ├── layout_service.py
│   ├── risk_service.py
│   ├── graph_service.py
│
├── models/
│   ├── layout.py
│
├── schemas/
│   ├── layout_schema.py
│
├── database/
│   ├── db.py
│
├── ai/
│   ├── yolo.py
│   ├── density.py
│   ├── lstm_model.py
│
├── utils/
│   ├── helpers.py
```

---

## 📁 Directory Explanation

### 🔹 `main.py`

Entry point of the application.

* Initializes FastAPI app
* Registers all API routes
* Starts the server

---

### 🔹 `routes/` (API Layer)

Defines all endpoints used by the frontend.

* `layout.py` → Save & fetch building layouts
* `analysis.py` → AI predictions (crowd, risk)

Handles:

* Request/response
* Input validation
* Calling services

---

### 🔹 `services/` (Business Logic)

Core logic of the system.

* `layout_service.py` → layout processing
* `risk_service.py` → risk calculation
* `graph_service.py` → graph operations

Responsibilities:

* Data processing
* AI integration
* Decision-making logic

---

### 🔹 `models/` (Database Models)

Defines database tables using SQLAlchemy.

Example:

* Layout storage (graph JSON)

---

### 🔹 `schemas/` (Validation Layer)

Defines request/response formats using Pydantic.

Example:

* Layout schema (nodes + edges)

---

### 🔹 `database/` (DB Configuration)

Handles PostgreSQL connection.

* Engine setup
* Session management

---

### 🔹 `ai/` (AI / ML Modules)

Contains all machine learning components.

* `yolo.py` → person detection
* `density.py` → density calculation
* `lstm_model.py` → risk prediction

---

### 🔹 `utils/` (Helpers)

Reusable utility functions.

* Data formatting
* Constants
* Common helpers

---

## 🔄 System Flow

```
Frontend (React)
        ↓
API Routes
        ↓
Services (Logic)
        ↓
AI Models / Database
        ↓
Response → Frontend
```

---

## 🚀 Getting Started

### 1️⃣ Clone Repository

```
git clone <your-repo-url>
cd backend
```

---

### 2️⃣ Create Virtual Environment

```
python -m venv venv
```

Activate:

* Windows:

```
venv\Scripts\activate
```

* Mac/Linux:

```
source venv/bin/activate
```

---

### 3️⃣ Install Dependencies

```
pip install fastapi uvicorn sqlalchemy psycopg2-binary python-multipart
```

---

### 4️⃣ Run Server

```
uvicorn main:app --reload
```

---

### 5️⃣ Open API Docs

```
http://127.0.0.1:8000/docs
```

---

## 📌 Key Features

* 📹 Real-time crowd detection (YOLO)
* 📊 Density estimation per zone
* ⚠️ Stampede risk prediction
* 🚪 Smart evacuation routing
* 📡 REST APIs for frontend

---

## 🧪 Example APIs

### Save Layout

```
POST /save-layout
```

### Get Layout

```
GET /get-layout
```

### Analyze Crowd

```
POST /analyze
```

---

## ⚙️ Tech Stack

* Backend: FastAPI
* Database: PostgreSQL
* AI/ML: PyTorch, OpenCV
* Detection: YOLOv8

---

## 🧭 Design Approach

This project follows a **modular monolithic architecture**:

* Separation of concerns
* Scalable structure
* Clean code organization

---

## 🎯 Future Improvements

* Real-time streaming (WebSockets)
* Reinforcement learning for evacuation
* IoT integration (sensors)
* Multi-camera fusion

---

## 🧑‍💻 Author

AMOGH

---

## ⭐ Note

This project is designed for real-world safety applications in:

* Malls
* Temples
* Stadiums
* Metro stations

---

> “Predictive safety is better than reactive control.”

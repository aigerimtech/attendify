# 🎓 Attendify

Attendify is a QR and Face Recognition-based Attendance Management System developed as a senior-level full-stack university project.

The system automates classroom attendance using secure QR tokens and machine learning-based face verification.

---

## 🏗 System Architecture

Attendify follows a multi-tier client–server architecture:

Frontend (React)
→ Backend API (Python – FastAPI/Django)
→ ML Service (Face Recognition)
→ PostgreSQL Database

All layers are separated for modularity, scalability, and maintainability.

---

## 👥 User Roles

The system supports role-based access:

### 👨‍🎓 Student
- Login
- Scan QR code
- Capture face image
- Submit attendance
- View attendance status

### 👩‍🏫 Instructor (Advisor)
- Login
- Create attendance sessions
- Generate QR codes
- View real-time attendance list
- Export attendance reports

Role-based routing ensures users only see functionalities assigned to their role.

---

## 📁 Repository Structure
attendify/
├── frontend/      # React Web Application (Role-based UI)
├── backend/       # Python REST API
├── ml-service/    # Face Recognition Service
├── database/      # SQL Schema & Migrations
├── docs/          # SDD and Diagrams
└── README.md      # Project Overview and Documentation

---

## 🚀 Development Workflow

We follow a branch-based development strategy.

Main branches:

- main → Stable production version
- develop → Integration branch

Feature branches:

- feature/frontend-*
- feature/backend-*
- feature/ml-*
- feature/database-*

No direct commits to main.

All changes must go through Pull Requests and review by at least one teammate.

---

## 🔁 Weekly Workflow

1. Create feature branch
2. Implement feature
3. Push branch
4. Create Pull Request to `develop`
5. Review by teammate
6. Merge after approval

---

## ⚙️ Tech Stack

Frontend:
- React
- Axios
- React Router

Backend:
- Python (FastAPI or Django REST)
- JWT Authentication

Database:
- PostgreSQL

ML:
- OpenCV
- Face Embedding Comparison

---

## 🔒 Security Features

- JWT Authentication
- Role-Based Access Control
- Time-limited QR tokens
- Face verification for identity validation
- Encrypted API communication (HTTPS in deployment)

---

## 📌 Project Status

Currently in: Initial Development Phase

Modules under implementation:
- Authentication
- Session & QR Management
- Face Recognition
- Attendance Processing

---

## 📞 Team Coordination

Project Management:
- Jira for sprint tracking
- GitHub for version control
- Weekly sprint review meetings

All team members are responsible for:
- Writing clean code
- Respecting module boundaries
- Reviewing pull requests
- Testing before merging

---

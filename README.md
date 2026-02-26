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

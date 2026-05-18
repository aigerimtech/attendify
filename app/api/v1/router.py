from __future__ import annotations
from fastapi import APIRouter
from app.api.v1.endpoints import admin, attendance, auth, courses, face, sessions, pending, settings, students

api_router = APIRouter()
api_router.include_router(auth.router,       prefix="/auth",       tags=["Auth"])
api_router.include_router(courses.router,    prefix="/courses",    tags=["Courses"])
api_router.include_router(sessions.router,   prefix="/sessions",   tags=["Sessions"])
api_router.include_router(attendance.router, prefix="/attendance", tags=["Attendance"])
api_router.include_router(face.router,       prefix="/face",       tags=["Face Enrollment"])
api_router.include_router(admin.router,      prefix="/admin",      tags=["Admin"])
api_router.include_router(pending.router,    prefix="/attendance", tags=["Pending Attendance"])
api_router.include_router(settings.router,   prefix="/settings",   tags=["Settings"])
api_router.include_router(students.router,   prefix="/students",   tags=["Students"])
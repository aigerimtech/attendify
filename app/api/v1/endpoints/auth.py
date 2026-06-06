from __future__ import annotations
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
import random
import string
from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.core.deps import get_current_user
from app.core.security import create_access_token, get_password_hash, verify_password
from app.db.session import get_db
from app.models.models import Instructor, PasswordResetToken, Student, User, UserRole
from app.schemas.schemas import (
    ChangePasswordPayload, ForgotPasswordPayload, MessageResponse,
    ResetPasswordPayload, StudentCreate, InstructorCreate,
    Token, UpdateProfilePayload, UserOut,
)

router = APIRouter()

def _student_number(user: User, db: Session) -> Optional[str]:
    if user.role == UserRole.student:
        s = db.query(Student).filter(Student.user_id == user.id).first()
        return s.student_number if s else None
    return None

def _face_enrolled(user: User, db: Session) -> Optional[bool]:
    if user.role == UserRole.student:
        s = db.query(Student).filter(Student.user_id == user.id).first()
        return s.face_enrolled if s else False
    return None

def _department(user: User, db: Session) -> Optional[str]:
    if user.role == UserRole.student:
        s = db.query(Student).filter(Student.user_id == user.id).first()
        return s.department if s else None
    if user.role == UserRole.instructor:
        i = db.query(Instructor).filter(Instructor.user_id == user.id).first()
        return i.department if i else None
    return None

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)) -> Token:
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password", headers={"WWW-Authenticate": "Bearer"})
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Account is inactive")
    access_token = create_access_token(data={"sub": str(user.id), "role": user.role})
    return Token(
        access_token=access_token, token_type="bearer",
        role=user.role, user_id=user.id, full_name=user.full_name,
        student_number=_student_number(user, db),
        face_enrolled=_face_enrolled(user, db),
        department=_department(user, db),
    )

@router.post("/register/student", response_model=UserOut, status_code=201)
def register_student(payload: StudentCreate, db: Session = Depends(get_db)) -> UserOut:
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    # Auto-generate student_number if not provided
    if payload.student_number:
        student_number = payload.student_number
        if db.query(Student).filter(Student.student_number == student_number).first():
            raise HTTPException(status_code=400, detail="Student number already registered")
    else:
        from datetime import datetime
        year = datetime.now().year
        # Find the highest auto-generated number for this year
        prefix = f"STU-{year}-"
        existing = (
            db.query(Student.student_number)
            .filter(Student.student_number.like(f"{prefix}%"))
            .all()
        )
        nums = []
        for (sn,) in existing:
            try:
                nums.append(int(sn.replace(prefix, "")))
            except ValueError:
                pass
        next_num = (max(nums) + 1) if nums else 1
        student_number = f"{prefix}{next_num:03d}"

    user = User(email=payload.email, hashed_password=get_password_hash(payload.password),
        first_name=payload.first_name, last_name=payload.last_name, role=UserRole.student)
    db.add(user)
    db.flush()
    db.add(Student(user_id=user.id, student_number=student_number, department=payload.department))
    db.commit()
    db.refresh(user)
    out = UserOut.model_validate(user)
    out.student_number = student_number
    out.face_enrolled = False
    out.department = payload.department
    return out

@router.post("/register/instructor", response_model=UserOut, status_code=201)
def register_instructor(payload: InstructorCreate, db: Session = Depends(get_db)) -> UserOut:
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(email=payload.email, hashed_password=get_password_hash(payload.password),
        first_name=payload.first_name, last_name=payload.last_name, role=UserRole.instructor)
    db.add(user)
    db.flush()
    db.add(Instructor(user_id=user.id, department=payload.department, title=payload.title))
    db.commit()
    db.refresh(user)
    return user  # type: ignore[return-value]

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> UserOut:
    out = UserOut.model_validate(current_user)
    out.student_number = _student_number(current_user, db)
    out.face_enrolled = _face_enrolled(current_user, db)
    out.department = _department(current_user, db)
    return out

@router.patch("/me", response_model=UserOut)
def update_profile(payload: UpdateProfilePayload, current_user: User = Depends(get_current_user),
                   db: Session = Depends(get_db)) -> UserOut:
    if payload.first_name: current_user.first_name = payload.first_name
    if payload.last_name: current_user.last_name = payload.last_name
    if payload.department:
        if current_user.role == UserRole.student:
            s = db.query(Student).filter(Student.user_id == current_user.id).first()
            if s: s.department = payload.department
        elif current_user.role == UserRole.instructor:
            i = db.query(Instructor).filter(Instructor.user_id == current_user.id).first()
            if i:
                i.department = payload.department
                if payload.title: i.title = payload.title
    db.commit()
    db.refresh(current_user)
    out = UserOut.model_validate(current_user)
    out.student_number = _student_number(current_user, db)
    out.face_enrolled = _face_enrolled(current_user, db)
    out.department = _department(current_user, db)
    return out

@router.post("/change-password", response_model=MessageResponse)
def change_password(payload: ChangePasswordPayload, current_user: User = Depends(get_current_user),
                    db: Session = Depends(get_db)) -> MessageResponse:
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if payload.new_password != payload.confirm_password:
        raise HTTPException(status_code=422, detail="Passwords do not match")
    current_user.hashed_password = get_password_hash(payload.new_password)
    db.commit()
    return MessageResponse(message="Password updated successfully")

@router.post("/forgot-password", response_model=MessageResponse)
def forgot_password(payload: ForgotPasswordPayload, db: Session = Depends(get_db)) -> MessageResponse:
    user = db.query(User).filter(User.email == payload.email).first()
    if user:
        db.query(PasswordResetToken).filter(PasswordResetToken.email == payload.email).delete()
        code = "".join(random.choices(string.digits, k=6))
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)
        db.add(PasswordResetToken(user_id=user.id, email=payload.email, code=code, expires_at=expires_at))
        db.commit()
        try:
            from app.core.config import settings
            from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
            conf = ConnectionConfig(
                MAIL_USERNAME=settings.MAIL_USERNAME,
                MAIL_PASSWORD=settings.MAIL_PASSWORD,
                MAIL_FROM=settings.MAIL_FROM,
                MAIL_PORT=settings.MAIL_PORT,
                MAIL_SERVER=settings.MAIL_SERVER,
                MAIL_STARTTLS=settings.MAIL_TLS,
                MAIL_SSL_TLS=settings.MAIL_SSL,
                USE_CREDENTIALS=True,
            )
            message = MessageSchema(
                subject="Attendify - Password Reset Code",
                recipients=[payload.email],
                body=f"Your password reset code is: {code}\n\nThis code expires in 15 minutes.",
                subtype=MessageType.plain,
            )
            fm = FastMail(conf)
            import threading
            def send():
                import asyncio
                asyncio.run(fm.send_message(message))
            threading.Thread(target=send, daemon=True).start()
        except Exception as e:
            print(f"[ATTENDIFY] Email send failed: {e}")
            print(f"[ATTENDIFY] RESET CODE for {payload.email}: {code}")
    return MessageResponse(message="If this email exists, a reset code was sent.")

@router.post("/reset-password", response_model=MessageResponse)
def reset_password(payload: ResetPasswordPayload, db: Session = Depends(get_db)) -> MessageResponse:
    token = db.query(PasswordResetToken).filter(
        PasswordResetToken.email == payload.email,
        PasswordResetToken.code == payload.code,
        PasswordResetToken.used_at == None,
    ).first()
    if not token:
        raise HTTPException(status_code=400, detail="Invalid or expired code")
    now = datetime.now(timezone.utc)
    exp = token.expires_at
    if exp.tzinfo is None:
        exp = exp.replace(tzinfo=timezone.utc)
    if now > exp:
        raise HTTPException(status_code=400, detail="Invalid or expired code")
    user = db.query(User).filter(User.id == token.user_id).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired code")
    user.hashed_password = get_password_hash(payload.new_password)
    token.used_at = now
    db.commit()
    return MessageResponse(message="Password reset successfully")

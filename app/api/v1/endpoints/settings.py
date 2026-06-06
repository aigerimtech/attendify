from __future__ import annotations
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.models import NotificationPreference, SystemConfig, User
from app.schemas.schemas import (
    NotificationPreferenceOut, NotificationPreferenceUpdate,
    SystemConfigOut, SystemConfigUpdate,
)

router = APIRouter()

def _get_or_create_notif(user: User, db: Session) -> NotificationPreference:
    prefs = db.query(NotificationPreference).filter(NotificationPreference.user_id == user.id).first()
    if not prefs:
        prefs = NotificationPreference(user_id=user.id)
        db.add(prefs)
        db.commit()
        db.refresh(prefs)
    return prefs

def _get_or_create_config(user: User, db: Session) -> SystemConfig:
    config = db.query(SystemConfig).filter(SystemConfig.user_id == user.id).first()
    if not config:
        config = SystemConfig(user_id=user.id)
        db.add(config)
        db.commit()
        db.refresh(config)
    return config

@router.get("/notifications", response_model=NotificationPreferenceOut)
def get_notification_preferences(current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)) -> NotificationPreferenceOut:
    prefs = _get_or_create_notif(current_user, db)
    return NotificationPreferenceOut.model_validate(prefs)

@router.patch("/notifications", response_model=NotificationPreferenceOut)
def update_notification_preferences(payload: NotificationPreferenceUpdate,
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> NotificationPreferenceOut:
    prefs = _get_or_create_notif(current_user, db)
    if payload.email_alerts is not None: prefs.email_alerts = payload.email_alerts
    if payload.attendance_confirmation is not None: prefs.attendance_confirmation = payload.attendance_confirmation
    if payload.low_attendance_warning is not None: prefs.low_attendance_warning = payload.low_attendance_warning
    if payload.session_start_reminder is not None: prefs.session_start_reminder = payload.session_start_reminder
    if payload.weekly_summary_report is not None: prefs.weekly_summary_report = payload.weekly_summary_report
    if payload.at_risk_student_alert is not None: prefs.at_risk_student_alert = payload.at_risk_student_alert
    db.commit()
    db.refresh(prefs)
    return NotificationPreferenceOut.model_validate(prefs)

@router.get("/system-config", response_model=SystemConfigOut)
def get_system_config(current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)) -> SystemConfigOut:
    config = _get_or_create_config(current_user, db)
    return SystemConfigOut.model_validate(config)

@router.patch("/system-config", response_model=SystemConfigOut)
def update_system_config(payload: SystemConfigUpdate,
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> SystemConfigOut:
    config = _get_or_create_config(current_user, db)
    if payload.geo_fencing_radius is not None: config.geo_fencing_radius = payload.geo_fencing_radius
    if payload.absence_threshold is not None: config.absence_threshold = payload.absence_threshold
    if payload.qr_refresh_interval is not None: config.qr_refresh_interval = payload.qr_refresh_interval
    if payload.face_verification_required is not None: config.face_verification_required = payload.face_verification_required
    db.commit()
    db.refresh(config)
    return SystemConfigOut.model_validate(config)

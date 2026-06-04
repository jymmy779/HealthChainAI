import uuid
from datetime import datetime, timedelta
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, auth

router = APIRouter()


def parse_device_label(user_agent: str) -> str:
    """Tóm tắt user-agent thành chuỗi dễ đọc."""
    ua = user_agent.lower()
    # Browser
    if "edg/" in ua:       browser = "Edge"
    elif "chrome" in ua:   browser = "Chrome"
    elif "safari" in ua:   browser = "Safari"
    elif "firefox" in ua:  browser = "Firefox"
    else:                  browser = "Trình duyệt"
    # OS
    if "windows" in ua:    os_name = "Windows"
    elif "iphone" in ua:   os_name = "iPhone"
    elif "ipad" in ua:     os_name = "iPad"
    elif "android" in ua:  os_name = "Android"
    elif "mac" in ua:      os_name = "macOS"
    elif "linux" in ua:    os_name = "Linux"
    else:                  os_name = "Thiết bị khác"
    return f"{browser} trên {os_name}"


def create_session(
    db: Session,
    user: models.User,
    request: Request,
) -> models.UserSession:
    """Tạo session mới khi user đăng nhập. Phát hiện thiết bị lạ và tạo notification."""
    ip = request.client.host if request.client else None
    ua = request.headers.get("user-agent", "")[:512]
    device_label = parse_device_label(ua)

    # Kiểm tra xem có session active nào từ IP/UA khác không
    existing = db.query(models.UserSession).filter(
        models.UserSession.user_id == user.id,
        models.UserSession.is_active == True,
    ).first()

    is_new_device = existing is not None and (
        existing.ip_address != ip or existing.user_agent[:100] != ua[:100]
    )

    # Tạo session mới
    session = models.UserSession(
        user_id=user.id,
        ip_address=ip,
        user_agent=ua,
        device_label=device_label,
        is_active=True,
    )
    db.add(session)

    # Nếu phát hiện thiết bị lạ → tạo notification cảnh báo
    if is_new_device:
        notif = models.Notification(
            user_id=user.id,
            type="security_alert",
            title="⚠️ Đăng nhập từ thiết bị mới",
            message=(
                f"Phát hiện đăng nhập từ {device_label} "
                f"(IP: {ip or 'không rõ'}). "
                "Nếu không phải bạn, hãy đổi mật khẩu ngay."
            ),
            icon="shield",
            color="warning",
            link="/dashboard/settings/security",
        )
        db.add(notif)

    db.commit()
    db.refresh(session)
    return session


@router.get("", response_model=List[dict])
def list_sessions(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    """Trả về danh sách tất cả phiên đang active của user hiện tại."""
    sessions = (
        db.query(models.UserSession)
        .filter(
            models.UserSession.user_id == current_user.id,
            models.UserSession.is_active == True,
        )
        .order_by(models.UserSession.last_active.desc())
        .all()
    )
    return [
        {
            "id": str(s.id),
            "ip_address": s.ip_address,
            "device_label": s.device_label or "Thiết bị không xác định",
            "user_agent": s.user_agent,
            "created_at": s.created_at.isoformat() if s.created_at else None,
            "last_active": s.last_active.isoformat() if s.last_active else None,
        }
        for s in sessions
    ]


@router.delete("/{session_id}")
def revoke_session(
    session_id: str,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    """Thu hồi / đăng xuất một phiên cụ thể (đăng xuất từ xa)."""
    session = db.query(models.UserSession).filter(
        models.UserSession.id == session_id,
        models.UserSession.user_id == current_user.id,
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Không tìm thấy phiên đăng nhập.")

    session.is_active = False
    db.commit()
    return {"message": "Phiên đăng nhập đã được thu hồi."}

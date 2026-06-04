import uuid
from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas, auth

router = APIRouter()


def require_verified_doctor(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
) -> models.Profile:
    """Dependency: yêu cầu user phải là bác sĩ đã được xác minh."""
    profile = db.query(models.Profile).filter(models.Profile.id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Không tìm thấy hồ sơ.")
    if profile.role != "doctor":
        raise HTTPException(status_code=403, detail="Chỉ bác sĩ mới có quyền truy cập.")
    if not profile.is_verified:
        raise HTTPException(status_code=403, detail="Tài khoản bác sĩ chưa được xác minh.")
    return profile


@router.get("/patients", response_model=List[schemas.AccessPermissionResponse])
def get_my_patients(
    doctor: models.Profile = Depends(require_verified_doctor),
    db: Session = Depends(get_db)
):
    """Lấy danh sách bệnh nhân đã cấp quyền cho bác sĩ này."""
    permissions = db.query(models.AccessPermission).filter(
        models.AccessPermission.doctor_id == doctor.id,
        models.AccessPermission.status == "active"
    ).order_by(models.AccessPermission.created_at.desc()).all()
    return permissions


@router.get("/patients/{patient_id}/records", response_model=List[schemas.HealthRecordResponse])
def get_patient_records(
    patient_id: uuid.UUID,
    request: Request,
    doctor: models.Profile = Depends(require_verified_doctor),
    db: Session = Depends(get_db)
):
    """Lấy danh sách hồ sơ của bệnh nhân (nếu có quyền truy cập hợp lệ)."""
    # Kiểm tra permission còn hiệu lực
    permission = db.query(models.AccessPermission).filter(
        models.AccessPermission.doctor_id == doctor.id,
        models.AccessPermission.patient_id == patient_id,
        models.AccessPermission.status == "active"
    ).first()

    if not permission:
        raise HTTPException(
            status_code=403,
            detail="Bệnh nhân chưa cấp quyền truy cập cho bạn hoặc quyền đã hết hạn."
        )

    # Kiểm tra ngày hết hạn
    from datetime import date
    if permission.expiry_date < date.today():
        permission.status = "expired"
        db.commit()
        raise HTTPException(status_code=403, detail="Quyền truy cập đã hết hạn.")

    # Lấy records tùy access_level
    if permission.access_level == "all":
        records = db.query(models.HealthRecord).filter(
            models.HealthRecord.user_id == patient_id
        ).order_by(models.HealthRecord.created_at.desc()).all()

    elif permission.access_level == "limited" and permission.limited_records:
        records = db.query(models.HealthRecord).filter(
            models.HealthRecord.id.in_(permission.limited_records)
        ).all()

    elif permission.access_level == "single" and permission.single_record:
        record = db.query(models.HealthRecord).filter(
            models.HealthRecord.id == permission.single_record
        ).first()
        records = [record] if record else []

    else:
        records = []

    # Ghi access log (luôn ghi để audit đầy đủ)
    device_info = request.headers.get("user-agent", "")[:200]
    ip_address = request.client.host if request.client else None

    log = models.AccessLog(
        permission_id=permission.id,
        doctor_id=doctor.id,
        patient_id=patient_id,
        action="viewed_records",
        ip_address=ip_address,
        device_info=device_info,
    )
    db.add(log)

    # Tăng total_accesses theo "phiên" — chỉ tính nếu cách lần trước > 30 phút
    # Tránh tình huống bác sĩ vào xem rồi quay lại ngay bị tính thêm 1 lần
    COOLDOWN_MINUTES = 30
    now = datetime.utcnow()
    last = permission.last_access
    is_new_session = (
        last is None or
        (now - last).total_seconds() > COOLDOWN_MINUTES * 60
    )

    if is_new_session:
        permission.total_accesses += 1

    permission.last_access = now
    db.commit()

    return records


@router.get("/patients/{patient_id}/profile", response_model=schemas.ProfileResponse)
def get_patient_profile(
    patient_id: uuid.UUID,
    doctor: models.Profile = Depends(require_verified_doctor),
    db: Session = Depends(get_db)
):
    """Lấy thông tin hồ sơ của bệnh nhân (nếu có quyền)."""
    permission = db.query(models.AccessPermission).filter(
        models.AccessPermission.doctor_id == doctor.id,
        models.AccessPermission.patient_id == patient_id,
        models.AccessPermission.status == "active"
    ).first()

    if not permission:
        raise HTTPException(status_code=403, detail="Không có quyền truy cập hồ sơ bệnh nhân này.")

    patient = db.query(models.Profile).filter(models.Profile.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Không tìm thấy bệnh nhân.")

    return patient


@router.get("/patients/{patient_id}/records/{record_id}/file")
def get_patient_record_file(
    patient_id: uuid.UUID,
    record_id: uuid.UUID,
    download: bool = False,
    doctor: models.Profile = Depends(require_verified_doctor),
    db: Session = Depends(get_db)
):
    """Bác sĩ xem file của một record bệnh nhân (nếu có quyền)."""
    import os
    from fastapi.responses import FileResponse

    # Kiểm tra permission
    permission = db.query(models.AccessPermission).filter(
        models.AccessPermission.doctor_id == doctor.id,
        models.AccessPermission.patient_id == patient_id,
        models.AccessPermission.status == "active"
    ).first()

    if not permission:
        raise HTTPException(status_code=403, detail="Không có quyền truy cập hồ sơ bệnh nhân này.")

    # Kiểm tra record thuộc bệnh nhân và có trong phạm vi quyền
    record = db.query(models.HealthRecord).filter(
        models.HealthRecord.id == record_id,
        models.HealthRecord.user_id == patient_id
    ).first()

    if not record:
        raise HTTPException(status_code=404, detail="Không tìm thấy hồ sơ.")

    # Kiểm tra access_level
    if permission.access_level == "single":
        if str(permission.single_record) != str(record_id):
            raise HTTPException(status_code=403, detail="Quyền truy cập chỉ giới hạn cho một hồ sơ khác.")
    elif permission.access_level == "limited":
        allowed = [str(r) for r in (permission.limited_records or [])]
        if str(record_id) not in allowed:
            raise HTTPException(status_code=403, detail="Hồ sơ này không nằm trong phạm vi quyền truy cập.")

    # Tìm file trong uploads
    UPLOAD_DIR = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads"
    )
    file_path = os.path.join(UPLOAD_DIR, f"{record_id}.pdf")

    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=404,
            detail="File hồ sơ không tồn tại trên server. Tài liệu có thể chỉ lưu trên IPFS."
        )

    media_type = "application/pdf"
    if record.type == "hinh-anh":
        media_type = "image/jpeg"

    from fastapi.responses import FileResponse
    safe_name = record.name.replace('"', '')
    disposition = f'attachment; filename="{safe_name}.pdf"' if download else f'inline; filename="{safe_name}.pdf"'

    return FileResponse(
        file_path,
        media_type=media_type,
        headers={"Content-Disposition": disposition}
    )

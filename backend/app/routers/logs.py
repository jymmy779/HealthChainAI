import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from ..database import get_db
from .. import models, schemas, auth

router = APIRouter()

@router.get("", response_model=List[schemas.AccessLogResponse])
def get_logs(
    limit: int = 50,
    offset: int = 0,
    current_user: models.User = Depends(auth.require_patient),
    db: Session = Depends(get_db)
):
    # Retrieve access logs where current user is the patient
    logs = db.query(models.AccessLog).filter(
        models.AccessLog.patient_id == current_user.id
    ).options(joinedload(models.AccessLog.doctor)).order_by(
        models.AccessLog.accessed_at.desc()
    ).limit(limit).offset(offset).all()
    
    return logs

import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas, auth

router = APIRouter()

@router.get("", response_model=List[schemas.AccessLogResponse])
def get_logs(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # Retrieve access logs where current user is the patient
    logs = db.query(models.AccessLog).filter(
        models.AccessLog.patient_id == current_user.id
    ).order_by(models.AccessLog.accessed_at.desc()).all()
    
    return logs

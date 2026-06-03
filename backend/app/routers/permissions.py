import uuid
from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas, auth

router = APIRouter()

@router.get("", response_model=List[schemas.AccessPermissionResponse])
def get_permissions(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # Retrieve permissions where current user is the patient
    permissions = db.query(models.AccessPermission).filter(
        models.AccessPermission.patient_id == current_user.id
    ).order_by(models.AccessPermission.created_at.desc()).all()
    
    return permissions

@router.post("", response_model=schemas.AccessPermissionResponse)
def grant_permission(
    permission: schemas.AccessPermissionCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # Verify doctor exists
    doctor = db.query(models.Profile).filter(
        models.Profile.id == permission.doctor_id,
        models.Profile.role == "doctor"
    ).first()
    
    if not doctor:
        raise HTTPException(
            status_code=404,
            detail="Doctor not found"
        )
        
    # Check if a permission already exists between patient and doctor
    existing_permission = db.query(models.AccessPermission).filter(
        models.AccessPermission.patient_id == current_user.id,
        models.AccessPermission.doctor_id == permission.doctor_id,
        models.AccessPermission.status == "active"
    ).first()
    
    if existing_permission:
        # Update existing permission
        existing_permission.expiry_date = permission.expiry_date
        existing_permission.access_level = permission.access_level
        existing_permission.limited_records = permission.limited_records
        db.commit()
        db.refresh(existing_permission)
        return existing_permission

    new_permission = models.AccessPermission(
        patient_id=current_user.id,
        doctor_id=permission.doctor_id,
        expiry_date=permission.expiry_date,
        access_level=permission.access_level,
        limited_records=permission.limited_records,
        status="active",
        total_accesses=0
    )
    
    db.add(new_permission)
    db.commit()
    db.refresh(new_permission)
    return new_permission

@router.put("/{permission_id}/revoke", response_model=schemas.AccessPermissionResponse)
def revoke_permission(
    permission_id: uuid.UUID,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    permission = db.query(models.AccessPermission).filter(
        models.AccessPermission.id == permission_id,
        models.AccessPermission.patient_id == current_user.id
    ).first()
    
    if not permission:
        raise HTTPException(status_code=404, detail="Permission not found")
        
    permission.status = "revoked"
    db.commit()
    db.refresh(permission)
    return permission

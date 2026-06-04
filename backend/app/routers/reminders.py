import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas, auth

router = APIRouter()

@router.get("", response_model=List[schemas.ReminderResponse])
def get_reminders(
    current_user: models.User = Depends(auth.require_patient),
    db: Session = Depends(get_db)
):
    reminders = db.query(models.Reminder).filter(
        models.Reminder.user_id == current_user.id
    ).order_by(models.Reminder.time.asc()).all()
    return reminders

@router.post("", response_model=schemas.ReminderResponse)
def create_reminder(
    reminder: schemas.ReminderCreate,
    current_user: models.User = Depends(auth.require_patient),
    db: Session = Depends(get_db)
):
    new_reminder = models.Reminder(
        user_id=current_user.id,
        title=reminder.title,
        description=reminder.description,
        type=reminder.type,
        time=reminder.time,
        date=reminder.date,
        is_active=reminder.is_active
    )
    db.add(new_reminder)
    db.commit()
    db.refresh(new_reminder)
    return new_reminder

@router.put("/{reminder_id}", response_model=schemas.ReminderResponse)
def update_reminder(
    reminder_id: uuid.UUID,
    updates: dict,
    current_user: models.User = Depends(auth.require_patient),
    db: Session = Depends(get_db)
):
    reminder = db.query(models.Reminder).filter(
        models.Reminder.id == reminder_id,
        models.Reminder.user_id == current_user.id
    ).first()
    
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
        
    for key, value in updates.items():
        if hasattr(reminder, key):
            setattr(reminder, key, value)
            
    db.commit()
    db.refresh(reminder)
    return reminder

@router.delete("/{reminder_id}")
def delete_reminder(
    reminder_id: uuid.UUID,
    current_user: models.User = Depends(auth.require_patient),
    db: Session = Depends(get_db)
):
    reminder = db.query(models.Reminder).filter(
        models.Reminder.id == reminder_id,
        models.Reminder.user_id == current_user.id
    ).first()
    
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
        
    db.delete(reminder)
    db.commit()
    return {"message": "Reminder deleted successfully"}

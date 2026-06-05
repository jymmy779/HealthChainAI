from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import date, datetime
from uuid import UUID

# Token
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    user_id: Optional[UUID] = None

# Auth
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    fullName: str
    role: str = "patient" # "patient" or "doctor"
    phone: Optional[str] = None
    dateOfBirth: Optional[date] = None
    gender: Optional[str] = None
    specialty: Optional[str] = None
    hospital: Optional[str] = None
    license_number: Optional[str] = None  # Số chứng chỉ hành nghề

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class PasswordUpdate(BaseModel):
    new_password: str

# Profile
class ProfileResponse(BaseModel):
    id: UUID
    full_name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    allergies: List[str] = []
    chronic_diseases: List[str] = []
    emergency_contact: Optional[Dict[str, Any]] = None
    insurance_number: Optional[str] = None
    avatar_url: Optional[str] = None
    role: str
    specialty: Optional[str] = None
    hospital: Optional[str] = None
    license_number: Optional[str] = None
    is_verified: bool = False
    certificate_url: Optional[str] = None
    certificate_name: Optional[str] = None
    verification_status: Optional[str] = "unverified"
    verification_feedback: Optional[str] = None
    two_factor_enabled: bool
    passkey_enabled: bool
    language: str
    notifications_enabled: bool
    created_at: datetime

    class Config:
        from_attributes = True

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    allergies: Optional[List[str]] = None
    chronic_diseases: Optional[List[str]] = None
    emergency_contact: Optional[Dict[str, Any]] = None
    insurance_number: Optional[str] = None
    avatar_url: Optional[str] = None
    specialty: Optional[str] = None
    hospital: Optional[str] = None
    license_number: Optional[str] = None

# Health Metric
class HealthMetricCreate(BaseModel):
    date: date
    bmi: Optional[float] = None
    systolic: Optional[int] = None
    diastolic: Optional[int] = None
    blood_sugar: Optional[float] = None
    heart_rate: Optional[int] = None
    weight: Optional[float] = None

class HealthMetricResponse(BaseModel):
    id: UUID
    user_id: UUID
    date: date
    bmi: Optional[float] = None
    systolic: Optional[int] = None
    diastolic: Optional[int] = None
    blood_sugar: Optional[float] = None
    heart_rate: Optional[int] = None
    weight: Optional[float] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Health Record
class HealthRecordCreate(BaseModel):
    name: str
    type: str
    type_label: str
    description: Optional[str] = None
    file_url: Optional[str] = None
    file_size: Optional[str] = None
    date: date
    hospital: Optional[str] = None
    doctor: Optional[str] = None
    transaction_hash: Optional[str] = None
    ipfs_hash: Optional[str] = None

class HealthRecordResponse(BaseModel):
    id: UUID
    user_id: UUID
    name: str
    type: str
    type_label: str
    description: Optional[str] = None
    file_url: Optional[str] = None
    file_size: Optional[str] = None
    date: date
    hospital: Optional[str] = None
    doctor: Optional[str] = None
    transaction_hash: Optional[str] = None
    ipfs_hash: Optional[str] = None
    blockchain_status: str
    metric_id: Optional[UUID] = None
    metric: Optional[HealthMetricResponse] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Access Permission
class AccessPermissionCreate(BaseModel):
    doctor_id: UUID
    expiry_date: date
    access_level: str = "all" # "all", "limited", "single"
    limited_records: Optional[List[UUID]] = None

class AccessPermissionResponse(BaseModel):
    id: UUID
    patient_id: UUID
    doctor_id: UUID
    granted_date: date
    expiry_date: date
    status: str
    access_level: str
    limited_records: Optional[List[UUID]] = None
    total_accesses: int
    last_access: Optional[datetime] = None
    created_at: datetime
    doctor: Optional[ProfileResponse] = None
    patient: Optional[ProfileResponse] = None
    accessible_records_count: int = 0

    class Config:
        from_attributes = True

# Access Log
class AccessLogResponse(BaseModel):
    id: UUID
    permission_id: Optional[UUID] = None
    doctor_id: UUID
    patient_id: UUID
    record_id: Optional[UUID] = None
    record_name: Optional[str] = None
    action: str
    ip_address: Optional[str] = None
    device_info: Optional[str] = None
    accessed_at: datetime
    doctor: Optional[ProfileResponse] = None

    class Config:
        from_attributes = True

# Notification
class NotificationResponse(BaseModel):
    id: UUID
    user_id: UUID
    type: str
    title: str
    message: str
    is_read: bool
    icon: Optional[str] = None
    color: Optional[str] = None
    link: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Reminder
class ReminderCreate(BaseModel):
    title: str
    description: Optional[str] = None
    type: str = "daily"
    time: str
    date: Optional[date] = None
    is_active: bool = True

class ReminderResponse(BaseModel):
    id: UUID
    user_id: UUID
    title: str
    description: Optional[str] = None
    type: str
    time: str
    date: Optional[date] = None
    is_active: bool
    last_notified: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


# Chatbot
class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str

class RecordChatRequest(BaseModel):
    question: str
    history: Optional[List[ChatMessage]] = []

class RecordChatResponse(BaseModel):
    answer: str


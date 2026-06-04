import uuid
import json
from sqlalchemy import Column, String, Integer, Numeric, Date, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from sqlalchemy.types import TypeDecorator, String as SQLString, Text as SQLText
from .database import Base

# ============================================================
# SQLAlchemy SQLite / PostgreSQL Compatibility Types
# ============================================================

class UUIDCompatible(TypeDecorator):
    impl = SQLString
    cache_ok = True
    
    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
            from sqlalchemy.dialects.postgresql import UUID
            return dialect.type_descriptor(UUID(as_uuid=True))
        else:
            return dialect.type_descriptor(SQLString(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        if isinstance(value, uuid.UUID):
            return value
        return uuid.UUID(value)

class JSONCompatible(TypeDecorator):
    impl = SQLText
    cache_ok = True
    
    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
            from sqlalchemy.dialects.postgresql import JSONB
            return dialect.type_descriptor(JSONB())
        else:
            return dialect.type_descriptor(SQLText())

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        if dialect.name == 'postgresql':
            return value
        return json.dumps(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        if dialect.name == 'postgresql':
            return value
        try:
            return json.loads(value)
        except Exception:
            return value

class ArrayCompatible(TypeDecorator):
    impl = SQLText
    cache_ok = True
    
    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
            from sqlalchemy.dialects.postgresql import ARRAY
            return dialect.type_descriptor(ARRAY(SQLString))
        else:
            return dialect.type_descriptor(SQLText())

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        if dialect.name == 'postgresql':
            return value
        return json.dumps(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return []
        if dialect.name == 'postgresql':
            return value
        try:
            val = json.loads(value)
            return val if isinstance(val, list) else []
        except Exception:
            return []

# ============================================================
# SQLAlchemy Models
# ============================================================

class User(Base):
    __tablename__ = "users"
    id = Column(UUIDCompatible, primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    profile = relationship("Profile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    passkeys = relationship("PasskeyCredential", back_populates="user", cascade="all, delete-orphan")

class Profile(Base):
    __tablename__ = "profiles"
    id = Column(UUIDCompatible, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    full_name = Column(String, nullable=False, default="")
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    date_of_birth = Column(Date, nullable=True)
    gender = Column(String, nullable=True)
    blood_group = Column(String, nullable=True)
    height = Column(Numeric, nullable=True)
    weight = Column(Numeric, nullable=True)
    allergies = Column(ArrayCompatible, default=[])
    chronic_diseases = Column(ArrayCompatible, default=[])
    emergency_contact = Column(JSONCompatible, nullable=True)
    insurance_number = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    role = Column(String, nullable=False, default="patient") # 'patient' or 'doctor' or 'admin'
    specialty = Column(String, nullable=True)
    hospital = Column(String, nullable=True)
    license_number = Column(String, nullable=True)  # Số chứng chỉ hành nghề
    is_verified = Column(Boolean, default=False)     # Bác sĩ đã được xác minh chưa
    two_factor_enabled = Column(Boolean, default=False)
    passkey_enabled = Column(Boolean, default=False)
    language = Column(String, default="vi")
    notifications_enabled = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="profile")

class HealthMetric(Base):
    __tablename__ = "health_metrics"
    id = Column(UUIDCompatible, primary_key=True, default=uuid.uuid4)
    user_id = Column(UUIDCompatible, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    date = Column(Date, nullable=False)
    bmi = Column(Numeric, nullable=True)
    systolic = Column(Integer, nullable=True)
    diastolic = Column(Integer, nullable=True)
    blood_sugar = Column(Numeric, nullable=True)
    heart_rate = Column(Integer, nullable=True)
    weight = Column(Numeric, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class HealthRecord(Base):
    __tablename__ = "health_records"
    id = Column(UUIDCompatible, primary_key=True, default=uuid.uuid4)
    user_id = Column(UUIDCompatible, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)
    type_label = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    file_url = Column(String, nullable=True)
    file_size = Column(String, nullable=True)
    date = Column(Date, nullable=False)
    hospital = Column(String, nullable=True)
    doctor = Column(String, nullable=True)
    transaction_hash = Column(String, nullable=True)
    ipfs_hash = Column(String, nullable=True)
    blockchain_status = Column(String, default="confirmed")
    metric_id = Column(UUIDCompatible, ForeignKey("health_metrics.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    metric = relationship("HealthMetric", foreign_keys=[metric_id])

class AccessPermission(Base):
    __tablename__ = "access_permissions"
    id = Column(UUIDCompatible, primary_key=True, default=uuid.uuid4)
    patient_id = Column(UUIDCompatible, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    doctor_id = Column(UUIDCompatible, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    granted_date = Column(Date, nullable=False, server_default=func.current_date())
    expiry_date = Column(Date, nullable=False)
    status = Column(String, nullable=False, default="active") # 'active', 'expired', 'revoked'
    access_level = Column(String, nullable=False, default="all") # 'all', 'limited', 'single'
    limited_records = Column(ArrayCompatible, nullable=True)
    single_record = Column(UUIDCompatible, nullable=True)
    total_accesses = Column(Integer, default=0)
    last_access = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    doctor = relationship("Profile", foreign_keys=[doctor_id])
    patient = relationship("Profile", foreign_keys=[patient_id])

    @property
    def accessible_records_count(self) -> int:
        from sqlalchemy.orm import object_session
        session = object_session(self)
        if session is None:
            return 0
        if self.access_level == "all":
            return session.query(HealthRecord).filter(HealthRecord.user_id == self.patient_id).count()
        elif self.access_level == "limited" and self.limited_records:
            return len(self.limited_records)
        elif self.access_level == "single" and self.single_record:
            return 1
        return 0

class AccessLog(Base):
    __tablename__ = "access_logs"
    id = Column(UUIDCompatible, primary_key=True, default=uuid.uuid4)
    permission_id = Column(UUIDCompatible, ForeignKey("access_permissions.id", ondelete="SET NULL"), nullable=True)
    doctor_id = Column(UUIDCompatible, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    patient_id = Column(UUIDCompatible, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    record_id = Column(UUIDCompatible, ForeignKey("health_records.id", ondelete="SET NULL"), nullable=True)
    record_name = Column(String, nullable=True)
    action = Column(String, nullable=False, default="viewed")
    ip_address = Column(String, nullable=True)
    device_info = Column(String, nullable=True)
    accessed_at = Column(DateTime(timezone=True), server_default=func.now())

    doctor = relationship("Profile", foreign_keys=[doctor_id])

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(UUIDCompatible, primary_key=True, default=uuid.uuid4)
    user_id = Column(UUIDCompatible, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    type = Column(String, nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    icon = Column(String, nullable=True)
    color = Column(String, nullable=True)
    link = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Reminder(Base):
    __tablename__ = "reminders"
    id = Column(UUIDCompatible, primary_key=True, default=uuid.uuid4)
    user_id = Column(UUIDCompatible, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    type = Column(String, nullable=False, default="daily")
    time = Column(String, nullable=False)
    date = Column(Date, nullable=True)
    is_active = Column(Boolean, default=True)
    last_notified = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class PasskeyCredential(Base):
    __tablename__ = "passkey_credentials"
    id = Column(UUIDCompatible, primary_key=True, default=uuid.uuid4)
    user_id = Column(UUIDCompatible, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    credential_id = Column(String, unique=True, nullable=False)
    public_key = Column(String, nullable=False)
    counter = Column(Integer, default=0)
    device_type = Column(String, nullable=True)
    backed_up = Column(Boolean, default=False)
    transports = Column(ArrayCompatible, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="passkeys")

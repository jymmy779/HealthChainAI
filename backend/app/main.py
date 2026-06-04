from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .config import settings
from .routers import auth, records, metrics, permissions, logs, notifications, reminders, doctor

# Initialize database tables
Base.metadata.create_all(bind=engine)

# Custom schema migration for metric_id in health_records table
try:
    from sqlalchemy import inspect, text
    inspector = inspect(engine)
    if 'health_records' in inspector.get_table_names():
        columns = [col['name'] for col in inspector.get_columns('health_records')]
        if 'metric_id' not in columns:
            print("Adding metric_id column to health_records table...")
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE health_records ADD COLUMN metric_id VARCHAR(36)"))
            print("Successfully added metric_id column to health_records")
    # Migration cho profile: is_verified, license_number
    if 'profiles' in inspector.get_table_names():
        profile_cols = [col['name'] for col in inspector.get_columns('profiles')]
        with engine.begin() as conn:
            if 'is_verified' not in profile_cols:
                print("Adding is_verified column to profiles table...")
                conn.execute(text("ALTER TABLE profiles ADD COLUMN is_verified BOOLEAN DEFAULT FALSE"))
                # Bác sĩ hiện có: auto-verified
                conn.execute(text("UPDATE profiles SET is_verified = TRUE WHERE role = 'doctor'"))
                print("is_verified added and doctors auto-verified.")
            if 'license_number' not in profile_cols:
                print("Adding license_number column to profiles table...")
                conn.execute(text("ALTER TABLE profiles ADD COLUMN license_number VARCHAR(100)"))
                print("license_number added.")
except Exception as e:
    print(f"Error during schema migration: {e}")

app = FastAPI(
    title="HealthChainAI API",
    description="Custom FastAPI backend for HealthChainAI",
    version="1.0.0"
)

# CORS configuration
origins = [
    settings.NEXT_PUBLIC_APP_URL,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to HealthChainAI API"}

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(records.router, prefix="/api/records", tags=["records"])
app.include_router(metrics.router, prefix="/api/metrics", tags=["metrics"])
app.include_router(permissions.router, prefix="/api/permissions", tags=["permissions"])
app.include_router(logs.router, prefix="/api/logs", tags=["logs"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["notifications"])
app.include_router(reminders.router, prefix="/api/reminders", tags=["reminders"])
app.include_router(doctor.router, prefix="/api/doctor", tags=["doctor"])

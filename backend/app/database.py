import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from .config import settings

db_url = settings.DATABASE_URL
engine_args = {}

if db_url.startswith("sqlite"):
    engine_args["connect_args"] = {"check_same_thread": False}

try:
    # Quick connectivity check
    temp_engine = create_engine(db_url, **engine_args)
    with temp_engine.connect() as conn:
        pass
    engine = temp_engine
    print(f"Connected to database successfully: {db_url}")
except Exception as e:
    print(f"Failed to connect to database at {db_url}: {e}")
    # Fallback to local SQLite database in backend folder
    fallback_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "healthchain.db")
    db_url = f"sqlite:///{fallback_path}"
    engine_args["connect_args"] = {"check_same_thread": False}
    engine = create_engine(db_url, **engine_args)
    print(f"FALLBACK: Using SQLite local database at {fallback_path}")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

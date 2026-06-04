from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    PINATA_API_KEY: str = ""
    PINATA_SECRET_API_KEY: str = ""
    NEXT_PUBLIC_APP_DOMAIN: str = "localhost"
    NEXT_PUBLIC_APP_URL: str = "http://localhost:3000"
    
    # Blockchain settings
    BLOCKCHAIN_RPC_URL: str = "http://localhost:8545"
    BLOCKCHAIN_PRIVATE_KEY: str = ""
    CONTRACT_ADDRESS: str = "0x5FbDB2315678afecb367f032d93F642f64180aa3"

    # AI settings
    GROQ_API_KEY: str = ""

    # Cloudinary settings
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()

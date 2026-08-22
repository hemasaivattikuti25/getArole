import os
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "Hircur — Enterprise AI Screening & Job Discovery Platform"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Storage paths
    BASE_DIR: str = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
    DATA_DIR: str = os.path.join(BASE_DIR, "data")
    SAVED_JOBS_FILE: str = os.path.join(DATA_DIR, "jobs.json")
    DEFAULT_RESUME_PATH: str = os.path.join(BASE_DIR, "sairesume.pdf")
    
    # Model configuration
    EMBEDDING_MODEL_NAME: str = "BAAI/bge-small-en-v1.5"
    
    # AI Providers
    NVIDIA_NIM_API_KEY: str = os.getenv("NVIDIA_NIM_API_KEY", "")
    NVIDIA_NIM_BASE_URL: str = "https://integrate.api.nvidia.com/v1"
    NVIDIA_DEFAULT_MODEL: str = "meta/llama-3.1-70b-instruct"
    
    # CORS
    CORS_ORIGINS: List[str] = ["*"]
    
    class Config:
        case_sensitive = True

settings = Settings()

# Ensure data directory exists
os.makedirs(settings.DATA_DIR, exist_ok=True)

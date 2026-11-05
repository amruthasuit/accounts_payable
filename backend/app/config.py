import os
from pydantic_settings import BaseSettings

is_vercel = os.getenv("VERCEL") == "1" or os.getenv("NOW_REGION") is not None

class Settings(BaseSettings):
    PROJECT_NAME: str = "AP Automation Platform"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Base Directory
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    # Database
    # On Vercel serverless, root directory is read-only. We default SQLite to /tmp if not using Postgres
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "sqlite:////tmp/ap_automation.db" if is_vercel else "sqlite:///./ap_automation.db"
    )
    
    # Upload Directories (Writable in /tmp on Vercel)
    UPLOAD_DIR: str = "/tmp/uploads" if is_vercel else os.path.join(BASE_DIR, "uploads")
    INVOICE_UPLOAD_DIR: str = os.path.join(UPLOAD_DIR, "invoices")
    PAYMENT_ADVICE_DIR: str = os.path.join(UPLOAD_DIR, "payment_advices")
    
    # Matching Tolerances
    PRICE_TOLERANCE_PERCENT: float = 2.0  # +/- 2%
    QTY_TOLERANCE_PERCENT: float = 0.0    # Exact qty
    
    # Business Rules
    COMPANY_GSTIN: str = "29AAACT9876Q1Z2"  # Karnataka, India
    COMPANY_NAME: str = "Templegate Enterprise Solutions Ltd."
    COMPANY_STATE: str = "Karnataka"
    COMPANY_STATE_CODE: str = "29"
    
    # Approval Thresholds (INR)
    AUTO_APPROVE_LIMIT: float = 10000.0
    MANAGER_APPROVE_LIMIT: float = 100000.0
    DIRECTOR_APPROVE_LIMIT: float = 500000.0
    
    class Config:
        case_sensitive = True

settings = Settings()

# Ensure directories exist
try:
    os.makedirs(settings.INVOICE_UPLOAD_DIR, exist_ok=True)
    os.makedirs(settings.PAYMENT_ADVICE_DIR, exist_ok=True)
except Exception:
    pass

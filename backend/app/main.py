from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from backend.app.config import settings
from backend.app.db.session import engine, Base, SessionLocal, ensure_schema_migrations
from backend.app.db.models import Product
from backend.app.data.seed_data import seed_database
from backend.app.api.router import api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables
    Base.metadata.create_all(bind=engine)
    ensure_schema_migrations(engine)

    # Seed initial benchmark data if database is empty
    db = SessionLocal()
    try:
        count = db.query(Product).count()
        if count == 0:
            print("[Mercato AI] Fresh database detected. Initializing with benchmark retail dataset...")
            seed_database(db, num_days=180)
            print("[Mercato AI] Benchmark dataset loaded successfully.")
    except Exception as e:
        print(f"[Mercato AI] DB init error: {e}")
    finally:
        db.close()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Intelligent sales forecasting and inventory analytics platform for retail businesses.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for dev/production API clients
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "project": "Mercato AI",
        "description": "Sales Forecasting and Inventory Intelligence Platform",
        "docs_url": "/docs",
        "api_v1": settings.API_V1_STR,
        "status": "operational"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "Mercato AI Backend"}

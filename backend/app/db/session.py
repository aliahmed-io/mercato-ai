from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from backend.app.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def ensure_schema_migrations(target_engine):
    """Adds newly introduced columns to existing tables for SQLite without losing data."""
    from sqlalchemy import text
    try:
        with target_engine.connect() as conn:
            res = conn.execute(text("PRAGMA table_info(inventory_items)")).fetchall()
            existing_cols = {row[1] for row in res}
            if existing_cols:
                if "lead_time_std_days" not in existing_cols:
                    conn.execute(text("ALTER TABLE inventory_items ADD COLUMN lead_time_std_days FLOAT DEFAULT 2.5"))
                if "on_time_delivery_rate" not in existing_cols:
                    conn.execute(text("ALTER TABLE inventory_items ADD COLUMN on_time_delivery_rate FLOAT DEFAULT 0.92"))
                if "supplier_name" not in existing_cols:
                    conn.execute(text("ALTER TABLE inventory_items ADD COLUMN supplier_name VARCHAR(200) DEFAULT 'Premier Wholesale Corp'"))
                if "supplier_email" not in existing_cols:
                    conn.execute(text("ALTER TABLE inventory_items ADD COLUMN supplier_email VARCHAR(200) DEFAULT 'procurement@premierwholesale.com'"))
                conn.commit()
    except Exception:
        pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


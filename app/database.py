from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import declarative_base, sessionmaker

from app.config import ensure_data_paths, settings

ensure_data_paths()

engine = create_engine(
    settings.db_url,
    connect_args={"check_same_thread": False} if settings.db_url.startswith("sqlite") else {},
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()


def apply_runtime_schema_patches() -> None:
    inspector = inspect(engine)
    if "users" not in inspector.get_table_names():
        return

    columns = {column["name"] for column in inspector.get_columns("users")}

    with engine.begin() as connection:
        if "must_change_password" not in columns:
            connection.execute(text("ALTER TABLE users ADD COLUMN must_change_password BOOLEAN NOT NULL DEFAULT 0"))
        if "password_changed_at" not in columns:
            connection.execute(text("ALTER TABLE users ADD COLUMN password_changed_at DATETIME"))


def get_db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

"""
Database engine and session management.

Provides:
- `engine`: the SQLAlchemy engine bound to PostgreSQL via psycopg3.
- `SessionLocal`: a session factory.
- `get_db`: a FastAPI dependency that yields a session per-request and
  guarantees it is closed afterwards.

The Trip Dispatcher business rules (status transitions, capacity checks,
double-booking checks) are executed inside a single transaction using
this session so that a Trip/Vehicle/Driver status update either all
commit together or all roll back together.
"""

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.config import get_settings

settings = get_settings()

# pool_pre_ping avoids "server closed the connection unexpectedly" errors
# on long-idle hackathon demo sessions.
engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
    future=True,
)

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
    expire_on_commit=False,
    future=True,
)


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency yielding a transactional session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

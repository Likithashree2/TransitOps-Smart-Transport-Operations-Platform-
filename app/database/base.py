"""
Shared SQLAlchemy declarative base.

All model files import Base from this module ONLY. This avoids circular
imports between model files (e.g. vehicle.py importing trip.py and
trip.py importing vehicle.py) because every model attaches itself to the
same Base.metadata without needing to import each other's classes for
table creation -- relationships use string class names instead.
"""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Base class for all ORM models in the TransitOps schema."""
    pass

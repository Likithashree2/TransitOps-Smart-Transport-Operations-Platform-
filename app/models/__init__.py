"""
Import every model here so that a single `import app.models` (as done in
alembic/env.py) registers all tables on Base.metadata. This is what
makes `alembic revision --autogenerate` see the complete schema.
"""

from app.database.base import Base  # noqa: F401

from app.models.role import Role  # noqa: F401
from app.models.user import User  # noqa: F401
from app.models.vehicle import Vehicle  # noqa: F401
from app.models.driver import Driver  # noqa: F401
from app.models.trip import Trip  # noqa: F401
from app.models.maintenance import MaintenanceLog  # noqa: F401
from app.models.fuel_log import FuelLog  # noqa: F401
from app.models.expense import Expense  # noqa: F401
from app.models.setting import Setting  # noqa: F401
from app.models.status_history import (  # noqa: F401
    VehicleStatusHistory,
    DriverStatusHistory,
    TripStatusHistory,
)
from app.models.ai_insight import AIInsight  # noqa: F401

__all__ = [
    "Base",
    "Role",
    "User",
    "Vehicle",
    "Driver",
    "Trip",
    "MaintenanceLog",
    "FuelLog",
    "Expense",
    "Setting",
    "VehicleStatusHistory",
    "DriverStatusHistory",
    "TripStatusHistory",
    "AIInsight",
]

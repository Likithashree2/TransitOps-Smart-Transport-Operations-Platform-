"""
Enumerations shared across models.

Each Python Enum below is rendered as a native PostgreSQL ENUM type by
SQLAlchemy. We give every one of them an explicit `name=` when used in a
`sa.Enum(...)` column (see individual model files) so that Alembic
autogenerate produces stable, predictable `CREATE TYPE` statements
instead of guessing names from the Python class. Values are UPPER_SNAKE
in Python but stored as the literal strings below (matched 1:1 to the
UI labels) so API responses do not need translation.
"""

import enum


class RoleName(str, enum.Enum):
    FLEET_MANAGER = "fleet_manager"
    DISPATCHER = "dispatcher"
    SAFETY_OFFICER = "safety_officer"
    FINANCIAL_ANALYST = "financial_analyst"


class VehicleType(str, enum.Enum):
    VAN = "Van"
    TRUCK = "Truck"
    MINI = "Mini"
    TRAILER = "Trailer"


class VehicleStatus(str, enum.Enum):
    AVAILABLE = "Available"
    ON_TRIP = "On Trip"
    IN_SHOP = "In Shop"
    RETIRED = "Retired"


class DriverStatus(str, enum.Enum):
    AVAILABLE = "Available"
    ON_TRIP = "On Trip"
    OFF_DUTY = "Off Duty"
    SUSPENDED = "Suspended"


class TripStatus(str, enum.Enum):
    DRAFT = "Draft"
    DISPATCHED = "Dispatched"
    COMPLETED = "Completed"
    CANCELLED = "Cancelled"


class MaintenanceStatus(str, enum.Enum):
    ACTIVE = "Active"
    COMPLETED = "Completed"


class ExpenseCategory(str, enum.Enum):
    TOLL = "Toll"
    MISC = "Misc"
    PARKING = "Parking"
    PERMIT = "Permit"
    OTHER = "Other"

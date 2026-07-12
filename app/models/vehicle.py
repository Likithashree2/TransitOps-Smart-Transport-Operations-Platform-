from datetime import date, datetime

from sqlalchemy import CheckConstraint, Date, Numeric, String, func
from sqlalchemy import Enum as PgEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base
from app.models.enums import VehicleStatus, VehicleType


class Vehicle(Base):
    """
    Fleet registry. A vehicle's `status` is the single source of truth
    for trip-dispatch eligibility: only VehicleStatus.AVAILABLE vehicles
    may be dispatched (enforced in the service layer, not here, so that
    validation error messages like the capacity-exceeded example in the
    spec can be composed with business context).
    """

    __tablename__ = "vehicles"
    __table_args__ = (
        CheckConstraint("max_load_capacity_kg > 0", name="ck_vehicle_capacity_positive"),
        CheckConstraint("odometer_km >= 0", name="ck_vehicle_odometer_nonneg"),
        CheckConstraint("acquisition_cost >= 0", name="ck_vehicle_cost_nonneg"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    registration_no: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    name_model: Mapped[str] = mapped_column(String(100), nullable=False)

    vehicle_type: Mapped[VehicleType] = mapped_column(
        PgEnum(VehicleType, name="vehicle_type_enum", values_callable=lambda e: [i.value for i in e]),
        nullable=False,
    )

    max_load_capacity_kg: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    odometer_km: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    acquisition_cost: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)

    status: Mapped[VehicleStatus] = mapped_column(
        PgEnum(VehicleStatus, name="vehicle_status_enum", values_callable=lambda e: [i.value for i in e]),
        nullable=False,
        default=VehicleStatus.AVAILABLE,
        index=True,
    )

    region: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    purchase_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    created_at: Mapped[datetime] = mapped_column(server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        server_default=func.now(), onupdate=func.now(), nullable=False
    )

    trips: Mapped[list["Trip"]] = relationship(back_populates="vehicle")
    maintenance_logs: Mapped[list["MaintenanceLog"]] = relationship(back_populates="vehicle")
    fuel_logs: Mapped[list["FuelLog"]] = relationship(back_populates="vehicle")
    expenses: Mapped[list["Expense"]] = relationship(back_populates="vehicle")
    status_history: Mapped[list["VehicleStatusHistory"]] = relationship(back_populates="vehicle")

    def __repr__(self) -> str:
        return f"<Vehicle id={self.id} reg={self.registration_no} status={self.status}>"

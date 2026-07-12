from datetime import date, datetime

from sqlalchemy import CheckConstraint, Date, ForeignKey, Numeric, String, Text, func
from sqlalchemy import Enum as PgEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base
from app.models.enums import MaintenanceStatus


class MaintenanceLog(Base):
    """
    Service history for a vehicle. Creating a row with status=ACTIVE
    flips vehicle.status -> IN_SHOP; completing it flips vehicle.status
    -> AVAILABLE UNLESS the vehicle is RETIRED, in which case it stays
    RETIRED. That transition logic lives in the service layer so it can
    also write a VehicleStatusHistory row in the same transaction.
    """

    __tablename__ = "maintenance_logs"
    __table_args__ = (
        CheckConstraint("cost >= 0", name="ck_maintenance_cost_nonneg"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    # RESTRICT, not CASCADE: this is a historical ERP record. Vehicles are
    # not expected to be physically deleted in normal operation (retire
    # them instead), and if one ever is, its service history must not be
    # silently destroyed with it. See README section 1 for the full
    # rationale shared across maintenance_logs / fuel_logs / expenses.
    vehicle_id: Mapped[int] = mapped_column(
        ForeignKey("vehicles.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    service_type: Mapped[str] = mapped_column(String(100), nullable=False)
    cost: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    service_date: Mapped[date] = mapped_column(Date, nullable=False)

    status: Mapped[MaintenanceStatus] = mapped_column(
        PgEnum(
            MaintenanceStatus,
            name="maintenance_status_enum",
            values_callable=lambda e: [i.value for i in e],
        ),
        nullable=False,
        default=MaintenanceStatus.ACTIVE,
        index=True,
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        server_default=func.now(), onupdate=func.now(), nullable=False
    )

    vehicle: Mapped["Vehicle"] = relationship(back_populates="maintenance_logs")

    def __repr__(self) -> str:
        return f"<MaintenanceLog id={self.id} vehicle_id={self.vehicle_id} status={self.status}>"

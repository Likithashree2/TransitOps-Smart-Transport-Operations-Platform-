from datetime import date, datetime

from sqlalchemy import CheckConstraint, Date, ForeignKey, Numeric, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class FuelLog(Base):
    """
    Per-fill fuel record. `trip_id` is nullable because refuelling can
    happen outside an active trip (e.g. topping off between trips).

    Deliberately NOT stored: liters_per_km, cost_per_liter. Both are
    cheaply derivable at query time:
        cost_per_liter   = cost / liters
        liters_per_km     = liters / distance travelled
    and storing them would risk them drifting out of sync with the raw
    liters/cost/odometer values -- exactly the kind of duplicate
    calculated data the spec says to avoid. The future AI anomaly
    detector should compute these ratios on read.
    """

    __tablename__ = "fuel_logs"
    __table_args__ = (
        CheckConstraint("liters > 0", name="ck_fuel_liters_positive"),
        CheckConstraint("cost >= 0", name="ck_fuel_cost_nonneg"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    # RESTRICT, not CASCADE: this is a historical ERP/financial record
    # (see README section 1 for the shared rationale across
    # maintenance_logs / fuel_logs / expenses).
    vehicle_id: Mapped[int] = mapped_column(
        ForeignKey("vehicles.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    trip_id: Mapped[int | None] = mapped_column(
        ForeignKey("trips.id", ondelete="SET NULL"), nullable=True, index=True
    )

    liters: Mapped[float] = mapped_column(Numeric(8, 2), nullable=False)
    cost: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    log_date: Mapped[date] = mapped_column(Date, nullable=False)
    odometer_km: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)

    created_at: Mapped[datetime] = mapped_column(server_default=func.now(), nullable=False)
    # The Fuel & Expense UI allows operational record correction, so we
    # track when a fuel log row was last edited (not just when created).
    updated_at: Mapped[datetime] = mapped_column(
        server_default=func.now(), onupdate=func.now(), nullable=False
    )

    vehicle: Mapped["Vehicle"] = relationship(back_populates="fuel_logs")
    trip: Mapped["Trip | None"] = relationship(back_populates="fuel_logs")

    def __repr__(self) -> str:
        return f"<FuelLog id={self.id} vehicle_id={self.vehicle_id} liters={self.liters}>"

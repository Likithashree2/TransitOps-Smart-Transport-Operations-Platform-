from datetime import datetime

from sqlalchemy import ForeignKey, String, Text, func
from sqlalchemy import DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class VehicleStatusHistory(Base):
    """
    Audit trail row written every time vehicles.status changes, whether
    triggered by dispatch, trip completion/cancellation, or maintenance.
    `changed_by` is nullable for system-generated transitions (e.g. an
    automatic status flip performed by the service layer without a
    specific acting user, such as a scheduled job).
    """

    __tablename__ = "vehicle_status_history"

    id: Mapped[int] = mapped_column(primary_key=True)
    vehicle_id: Mapped[int] = mapped_column(
        ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False, index=True
    )
    old_status: Mapped[str | None] = mapped_column(String(30), nullable=True)
    new_status: Mapped[str] = mapped_column(String(30), nullable=False)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    changed_by: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    changed_at: Mapped[datetime] = mapped_column(server_default=func.now(), nullable=False, index=True)

    vehicle: Mapped["Vehicle"] = relationship(back_populates="status_history")

    def __repr__(self) -> str:
        return f"<VehicleStatusHistory vehicle_id={self.vehicle_id} {self.old_status}->{self.new_status}>"


class DriverStatusHistory(Base):
    """Audit trail row written every time drivers.status changes."""

    __tablename__ = "driver_status_history"

    id: Mapped[int] = mapped_column(primary_key=True)
    driver_id: Mapped[int] = mapped_column(
        ForeignKey("drivers.id", ondelete="CASCADE"), nullable=False, index=True
    )
    old_status: Mapped[str | None] = mapped_column(String(30), nullable=True)
    new_status: Mapped[str] = mapped_column(String(30), nullable=False)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    changed_by: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    changed_at: Mapped[datetime] = mapped_column(server_default=func.now(), nullable=False, index=True)

    driver: Mapped["Driver"] = relationship(back_populates="status_history")

    def __repr__(self) -> str:
        return f"<DriverStatusHistory driver_id={self.driver_id} {self.old_status}->{self.new_status}>"


class TripStatusHistory(Base):
    """Audit trail row written every time trips.status changes."""

    __tablename__ = "trip_status_history"

    id: Mapped[int] = mapped_column(primary_key=True)
    trip_id: Mapped[int] = mapped_column(
        ForeignKey("trips.id", ondelete="CASCADE"), nullable=False, index=True
    )
    old_status: Mapped[str | None] = mapped_column(String(30), nullable=True)
    new_status: Mapped[str] = mapped_column(String(30), nullable=False)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    changed_by: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    changed_at: Mapped[datetime] = mapped_column(server_default=func.now(), nullable=False, index=True)

    trip: Mapped["Trip"] = relationship(back_populates="status_history")

    def __repr__(self) -> str:
        return f"<TripStatusHistory trip_id={self.trip_id} {self.old_status}->{self.new_status}>"

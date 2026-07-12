from datetime import datetime

from sqlalchemy import CheckConstraint, ForeignKey, Index, Integer, Numeric, String, func, text
from sqlalchemy import DateTime
from sqlalchemy import Enum as PgEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base
from app.models.enums import TripStatus


class Trip(Base):
    """
    Core dispatch lifecycle table: Draft -> Dispatched -> Completed, with
    a Dispatched -> Cancelled branch. All status transitions AND the
    linked Vehicle/Driver status flips are performed together inside one
    DB transaction by the service layer (see TripService in the business
    layer, not shown here) -- this model only defines structure and
    column-level constraints, not the transition rules themselves.

    `vehicle_id` / `driver_id` are nullable: a Draft trip may be created
    with either or both unassigned (e.g. "Awaiting driver", or fully
    unassigned) to match the Trip Dispatcher UI. The `ck_trip_dispatch_requires_assignment`
    CHECK constraint is the one hard DB-level guarantee that a trip can
    never be persisted as Dispatched/Completed without both a
    vehicle and a driver -- everything else about the transition (status
    flips on the linked Vehicle/Driver rows, double-booking checks) still
    lives in the service layer since it spans multiple tables.

    `revenue_amount` implements Option A of the revenue design decision
    (see chat explanation): revenue is 1:1 with a completed trip, so it
    lives directly on the trip row instead of a separate table.
    """

    __tablename__ = "trips"
    __table_args__ = (
        CheckConstraint("cargo_weight_kg >= 0", name="ck_trip_cargo_weight_nonneg"),
        CheckConstraint("planned_distance_km >= 0", name="ck_trip_planned_distance_nonneg"),
        CheckConstraint(
            "final_odometer_km IS NULL OR final_odometer_km >= 0",
            name="ck_trip_final_odometer_nonneg",
        ),
        CheckConstraint(
            "fuel_consumed_l IS NULL OR fuel_consumed_l > 0",
            name="ck_trip_fuel_consumed_positive",
        ),
        CheckConstraint(
            "estimated_eta_minutes IS NULL OR estimated_eta_minutes >= 0",
            name="ck_trip_eta_nonneg",
        ),
        CheckConstraint(
            "revenue_amount IS NULL OR revenue_amount >= 0",
            name="ck_trip_revenue_nonneg",
        ),
        # Dispatched and Completed trips require both assignments. Draft and
        # Cancelled may be unassigned so an unassigned Draft can be cancelled
        # without inventing a vehicle or driver assignment.
        CheckConstraint(
            "status IN ('Draft', 'Cancelled') OR (vehicle_id IS NOT NULL AND driver_id IS NOT NULL)",
            name="ck_trip_dispatch_requires_assignment",
        ),
        # A vehicle/driver must not be double-booked across two
        # simultaneously Dispatched trips. Partial unique indexes enforce
        # this at the DB layer as a backstop to the service-layer check.
        Index(
            "uq_trip_vehicle_active_dispatch",
            "vehicle_id",
            unique=True,
            postgresql_where=text("status = 'Dispatched'"),
        ),
        Index(
            "uq_trip_driver_active_dispatch",
            "driver_id",
            unique=True,
            postgresql_where=text("status = 'Dispatched'"),
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    trip_code: Mapped[str] = mapped_column(String(30), unique=True, nullable=False, index=True)
    source: Mapped[str] = mapped_column(String(150), nullable=False)
    destination: Mapped[str] = mapped_column(String(150), nullable=False)

    # Nullable: Draft trips may be created before a vehicle/driver is
    # assigned ("Awaiting driver" or fully unassigned). Must be non-NULL
    # by the time a trip transitions to Dispatched -- enforced by
    # ck_trip_dispatch_requires_assignment above.
    vehicle_id: Mapped[int | None] = mapped_column(
        ForeignKey("vehicles.id", ondelete="RESTRICT"), nullable=True, index=True
    )
    driver_id: Mapped[int | None] = mapped_column(
        ForeignKey("drivers.id", ondelete="RESTRICT"), nullable=True, index=True
    )

    cargo_weight_kg: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    planned_distance_km: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    final_odometer_km: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    fuel_consumed_l: Mapped[float | None] = mapped_column(Numeric(8, 2), nullable=True)
    estimated_eta_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Revenue design choice A: nullable, populated when trip is Completed.
    revenue_amount: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)

    status: Mapped[TripStatus] = mapped_column(
        PgEnum(TripStatus, name="trip_status_enum", values_callable=lambda e: [i.value for i in e]),
        nullable=False,
        default=TripStatus.DRAFT,
        index=True,
    )

    dispatched_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    cancelled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    created_by: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        server_default=func.now(), onupdate=func.now(), nullable=False
    )

    vehicle: Mapped["Vehicle | None"] = relationship(back_populates="trips")
    driver: Mapped["Driver | None"] = relationship(back_populates="trips")
    creator: Mapped["User | None"] = relationship()

    fuel_logs: Mapped[list["FuelLog"]] = relationship(back_populates="trip")
    expenses: Mapped[list["Expense"]] = relationship(back_populates="trip")
    status_history: Mapped[list["TripStatusHistory"]] = relationship(back_populates="trip")

    def __repr__(self) -> str:
        return f"<Trip id={self.id} code={self.trip_code} status={self.status}>"

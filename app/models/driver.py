from datetime import date, datetime

from sqlalchemy import CheckConstraint, Date, Numeric, String, func
from sqlalchemy import Enum as PgEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base
from app.models.enums import DriverStatus


class Driver(Base):
    """
    Driver safety/compliance profile. `license_expiry` is compared
    against the current date in the service layer to block dispatch of
    drivers with an expired license (the UI simply highlights this by
    reading `license_expiry < today` -- no stored boolean flag needed).
    """

    __tablename__ = "drivers"
    __table_args__ = (
        CheckConstraint(
            "safety_score >= 0 AND safety_score <= 100", name="ck_driver_safety_score_range"
        ),
        CheckConstraint(
            "trip_completion_percentage >= 0 AND trip_completion_percentage <= 100",
            name="ck_driver_trip_completion_range",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    license_no: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    license_category: Mapped[str] = mapped_column(String(20), nullable=False)
    license_expiry: Mapped[date] = mapped_column(Date, nullable=False)
    contact_number: Mapped[str] = mapped_column(String(20), nullable=False)

    trip_completion_percentage: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False, default=0)
    safety_score: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False, default=100)

    status: Mapped[DriverStatus] = mapped_column(
        PgEnum(DriverStatus, name="driver_status_enum", values_callable=lambda e: [i.value for i in e]),
        nullable=False,
        default=DriverStatus.AVAILABLE,
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        server_default=func.now(), onupdate=func.now(), nullable=False
    )

    trips: Mapped[list["Trip"]] = relationship(back_populates="driver")
    status_history: Mapped[list["DriverStatusHistory"]] = relationship(back_populates="driver")

    def __repr__(self) -> str:
        return f"<Driver id={self.id} name={self.full_name} status={self.status}>"

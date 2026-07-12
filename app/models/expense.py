from datetime import date, datetime

from sqlalchemy import CheckConstraint, Date, ForeignKey, Numeric, String, func
from sqlalchemy import Enum as PgEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base
from app.models.enums import ExpenseCategory


class Expense(Base):
    """
    Non-fuel operational costs (toll, parking, permits, misc). `trip_id`
    is nullable so depot-level expenses not tied to a specific trip can
    still be recorded and rolled into Operational Cost / Vehicle ROI.
    """

    __tablename__ = "expenses"
    __table_args__ = (
        CheckConstraint("amount >= 0", name="ck_expense_amount_nonneg"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    trip_id: Mapped[int | None] = mapped_column(
        ForeignKey("trips.id", ondelete="SET NULL"), nullable=True, index=True
    )
    # RESTRICT, not CASCADE: this is a historical ERP/financial record
    # (see README section 1 for the shared rationale across
    # maintenance_logs / fuel_logs / expenses).
    vehicle_id: Mapped[int] = mapped_column(
        ForeignKey("vehicles.id", ondelete="RESTRICT"), nullable=False, index=True
    )

    category: Mapped[ExpenseCategory] = mapped_column(
        PgEnum(
            ExpenseCategory,
            name="expense_category_enum",
            values_callable=lambda e: [i.value for i in e],
        ),
        nullable=False,
    )
    amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    description: Mapped[str | None] = mapped_column(String(255), nullable=True)
    expense_date: Mapped[date] = mapped_column(Date, nullable=False)

    created_at: Mapped[datetime] = mapped_column(server_default=func.now(), nullable=False)
    # The Fuel & Expense UI allows operational record correction, so we
    # track when an expense row was last edited (not just when created).
    updated_at: Mapped[datetime] = mapped_column(
        server_default=func.now(), onupdate=func.now(), nullable=False
    )

    trip: Mapped["Trip | None"] = relationship(back_populates="expenses")
    vehicle: Mapped["Vehicle"] = relationship(back_populates="expenses")

    def __repr__(self) -> str:
        return f"<Expense id={self.id} category={self.category} amount={self.amount}>"

from datetime import datetime

from sqlalchemy import String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class Setting(Base):
    """
    Depot-level configuration shown on the Settings screen. Modeled as a
    normal table (not a key-value store) since the UI only ever needs
    one row of fixed fields. The service layer should always read/write
    the row with the lowest `id` (seeded once); a single-row convention
    is enough for a hackathon and avoids a premature multi-tenant design.
    """

    __tablename__ = "settings"

    id: Mapped[int] = mapped_column(primary_key=True)
    depot_name: Mapped[str] = mapped_column(String(150), nullable=False, default="Gandhinagar Depot, GJ")
    currency: Mapped[str] = mapped_column(String(10), nullable=False, default="INR")
    distance_unit: Mapped[str] = mapped_column(String(20), nullable=False, default="Kilometers")

    created_at: Mapped[datetime] = mapped_column(server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        server_default=func.now(), onupdate=func.now(), nullable=False
    )

    def __repr__(self) -> str:
        return f"<Setting id={self.id} depot={self.depot_name}>"

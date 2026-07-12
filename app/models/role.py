from datetime import datetime

from sqlalchemy import Enum as PgEnum
from sqlalchemy import func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base
from app.models.enums import RoleName


class Role(Base):
    """
    Fixed RBAC role catalogue. Seeded once (see scripts/seed.py) with the
    four hackathon roles. Not editable from the UI -- permissions per
    role are enforced in the FastAPI service layer / route dependencies,
    not in the database, per the "fixed seed data" requirement.
    """

    __tablename__ = "roles"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[RoleName] = mapped_column(
        PgEnum(RoleName, name="role_name_enum", values_callable=lambda e: [i.value for i in e]),
        unique=True,
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(server_default=func.now(), nullable=False)

    users: Mapped[list["User"]] = relationship(back_populates="role")

    def __repr__(self) -> str:
        return f"<Role id={self.id} name={self.name}>"

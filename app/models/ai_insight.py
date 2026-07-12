from datetime import datetime

from sqlalchemy import Integer, Numeric, String, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class AIInsight(Base):
    """
    Generic, polymorphic store for future AI-generated signals
    (predictive maintenance risk, fuel anomaly detection, license expiry
    alerts). `entity_type` + `entity_id` point at the source row (e.g.
    "vehicle" + 7) without a hard foreign key, since a single table
    needs to reference several different parent tables. `payload` holds
    whatever unstructured detail the specific insight type produces
    (feature values, thresholds, explanation text) so the schema never
    needs to change as new insight types are added. No LLM/Gemini call
    is wired up yet -- this table only persists results once one is.
    """

    __tablename__ = "ai_insights"

    id: Mapped[int] = mapped_column(primary_key=True)
    entity_type: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    entity_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    insight_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    score: Mapped[float | None] = mapped_column(Numeric(6, 2), nullable=True)
    payload: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)

    created_at: Mapped[datetime] = mapped_column(server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        server_default=func.now(), onupdate=func.now(), nullable=False
    )

    def __repr__(self) -> str:
        return f"<AIInsight id={self.id} {self.entity_type}:{self.entity_id} {self.insight_type}>"

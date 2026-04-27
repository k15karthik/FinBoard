from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base


class Session(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    question = Column(Text, nullable=False)
    final_verdict = Column(Text, nullable=True)
    overall_risk_level = Column(String(16), nullable=True)

    agent_outputs = relationship("AgentOutput", back_populates="session", cascade="all, delete-orphan")


class AgentOutput(Base):
    __tablename__ = "agent_outputs"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("sessions.id"), nullable=False)
    agent_name = Column(String(64), nullable=False)
    output_text = Column(Text, nullable=True)
    trace_text = Column(Text, nullable=True)
    revision_number = Column(Integer, default=0, nullable=False)

    session = relationship("Session", back_populates="agent_outputs")

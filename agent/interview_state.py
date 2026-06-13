from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Literal, List


InterviewStage = Literal["intro", "experience", "completed"]


@dataclass
class InterviewState:
    current_stage: InterviewStage = "intro"

    intro_started_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    experience_started_at: datetime | None = None

    intro_answer: str = ""
    experience_answer: str = ""

    intro_completed: bool = False
    experience_completed: bool = False

    fallback_used: bool = False

    event_log: List[str] = field(default_factory=list)

    def log(self, message: str) -> None:
        timestamp = datetime.now(timezone.utc).isoformat()
        line = f"[{timestamp}] {message}"
        self.event_log.append(line)
        print(line)

    def seconds_in_current_stage(self) -> float:
        now = datetime.now(timezone.utc)

        if self.current_stage == "intro":
            return (now - self.intro_started_at).total_seconds()

        if self.current_stage == "experience" and self.experience_started_at:
            return (now - self.experience_started_at).total_seconds()

        return 0.0

    def move_to_experience(self, reason: str) -> None:
        self.current_stage = "experience"
        self.intro_completed = True
        self.experience_started_at = datetime.now(timezone.utc)
        self.log(f"Stage changed: intro -> experience. Reason: {reason}")

    def complete_interview(self, reason: str) -> None:
        self.current_stage = "completed"
        self.experience_completed = True
        self.log(f"Stage changed: experience -> completed. Reason: {reason}")
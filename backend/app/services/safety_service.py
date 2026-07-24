import re
from enum import StrEnum


class SafetyDisposition(StrEnum):
    NORMAL = "normal"
    EMERGENCY = "emergency"
    MEDICATION_CHANGE = "medication_change"


EMERGENCY_PATTERNS = (
    r"\b(can(?:not|'t) breathe|difficulty breathing|chest pain)\b",
    r"\b(unconscious|not waking up|severe bleeding|overdose)\b",
    r"\b(kill myself|suicide|suicidal)\b",
)
MEDICATION_CHANGE_PATTERNS = (
    r"\b(stop|quit|reduce|increase|double)\b.{0,30}\b(medication|medicine|dose|dosage|prescription)\b",
    r"\bhow much\b.{0,25}\b(should i take|dose)\b",
)


def classify_message(message: str) -> SafetyDisposition:
    normalized = " ".join(message.lower().split())
    if any(re.search(pattern, normalized) for pattern in EMERGENCY_PATTERNS):
        return SafetyDisposition.EMERGENCY
    if any(re.search(pattern, normalized) for pattern in MEDICATION_CHANGE_PATTERNS):
        return SafetyDisposition.MEDICATION_CHANGE
    return SafetyDisposition.NORMAL


def emergency_response() -> str:
    return (
        "This may need immediate help. Contact your local emergency services now or seek urgent "
        "in-person medical attention. If possible, tell a nearby trusted person who can assist you. "
        "AI Med cannot diagnose or manage an emergency."
    )


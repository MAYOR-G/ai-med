from app.services.safety_service import SafetyDisposition, classify_message


def test_emergency_language_short_circuits_normal_chat():
    assert classify_message("I have chest pain and can't breathe") is SafetyDisposition.EMERGENCY


def test_medication_change_request_is_flagged():
    assert classify_message("Should I increase my medication dose?") is SafetyDisposition.MEDICATION_CHANGE


def test_record_question_remains_normal():
    assert classify_message("Which medication was named in my discharge note?") is SafetyDisposition.NORMAL


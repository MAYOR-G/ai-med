from uuid import uuid4

from fastapi.testclient import TestClient

from app.api.routes import conversations as conversation_routes
from app.main import app


def test_health_endpoint():
    with TestClient(app) as client:
        response = client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_account_document_and_grounded_chat_are_connected_end_to_end(monkeypatch):
    email = f"tester-{uuid4()}@example.com"
    with TestClient(app) as client:
        registration = client.post(
            "/api/v1/auth/register",
            json={
                "name": "Synthetic Patient",
                "email": email,
                "password": "safe-test-password",
                "privacy_consent": True,
            },
        )
        assert registration.status_code == 201

        upload = client.post(
            "/api/v1/documents",
            files={"file": ("sample-note.txt", b"Synthetic medical note for testing.", "text/plain")},
            data={"category": "Doctor's Note"},
        )
        assert upload.status_code == 201
        assert upload.json()["original_filename"] == "sample-note.txt"
        assert upload.json()["processing_status"] == "READY"

        documents = client.get("/api/v1/documents")
        assert documents.status_code == 200
        assert [item["id"] for item in documents.json()] == [upload.json()["id"]]

        original = client.get(f"/api/v1/documents/{upload.json()['id']}/file")
        assert original.status_code == 200
        assert original.content == b"Synthetic medical note for testing."

        extracted = client.get(f"/api/v1/documents/{upload.json()['id']}/text")
        assert extracted.status_code == 200
        assert extracted.json()["pages"][0]["text"] == "Synthetic medical note for testing."

        conversation = client.post("/api/v1/conversations", json={})
        assert conversation.status_code == 201
        emergency = client.post(
            f"/api/v1/conversations/{conversation.json()['id']}/messages",
            json={"content": "I have chest pain and can't breathe"},
        )
        assert emergency.status_code == 200
        assert "emergency services" in emergency.json()["assistant_message"]["content"]

        monkeypatch.setattr(
            conversation_routes,
            "generate_answer",
            lambda question, context: "The synthetic note is available in your record [1].",
        )
        grounded = client.post(
            f"/api/v1/conversations/{conversation.json()['id']}/messages",
            json={"content": "What does my synthetic medical note contain?"},
        )
        assert grounded.status_code == 200
        assert grounded.json()["assistant_message"]["citations"][0]["document_id"] == upload.json()["id"]

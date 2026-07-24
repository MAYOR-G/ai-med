import type { ChatMessage, ChatResponse, Conversation, DocumentText, MedicalDocument, Session, User } from "./types";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("aimed_token");
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({ detail: "Something went wrong" }));
    throw new Error(payload.detail ?? "Something went wrong");
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const api = {
  register: (payload: { name: string; email: string; password: string; privacy_consent: boolean }) =>
    request<Session>("/auth/register", { method: "POST", body: JSON.stringify(payload) }),
  login: (payload: { email: string; password: string }) =>
    request<Session>("/auth/login", { method: "POST", body: JSON.stringify(payload) }),
  me: () => request<User>("/auth/me"),
  logout: () => request<void>("/auth/logout", { method: "POST" }),
  documents: () => request<MedicalDocument[]>("/documents"),
  documentText: (documentId: string) => request<DocumentText>(`/documents/${documentId}/text`),
  reprocess: (documentId: string) => request<MedicalDocument>(`/documents/${documentId}/reprocess`, { method: "POST" }),
  documentFileUrl: (documentId: string) => `${API_BASE}/documents/${documentId}/file`,
  upload: (file: File, category: string) => {
    const body = new FormData();
    body.append("file", file);
    body.append("category", category);
    return request<MedicalDocument>("/documents", { method: "POST", body });
  },
  conversations: () => request<Conversation[]>("/conversations"),
  createConversation: (scope_document_id: string | null) => request<Conversation>("/conversations", {
    method: "POST",
    body: JSON.stringify({ scope_document_id }),
  }),
  messages: (conversationId: string) => request<ChatMessage[]>(`/conversations/${conversationId}/messages`),
  sendMessage: (conversationId: string, content: string) => request<ChatResponse>(`/conversations/${conversationId}/messages`, {
    method: "POST",
    body: JSON.stringify({ content }),
  }),
};

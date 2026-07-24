export type User = { id: string; name: string; email: string };

export type Session = {
  user: User;
  access_token: string;
  token_type: string;
};

export type MedicalDocument = {
  id: string;
  title: string;
  original_filename: string;
  mime_type: string;
  file_size: number;
  category: string;
  document_date: string | null;
  page_count: number | null;
  summary: string | null;
  processing_status: string;
  processing_error: string | null;
  created_at: string;
};

export type DocumentText = {
  document_id: string;
  status: string;
  error: string | null;
  pages: { page_number: number; text: string }[];
};

export type Conversation = {
  id: string;
  title: string;
  scope_document_id: string | null;
  created_at: string;
  updated_at: string;
};

export type Citation = {
  citation_id: number;
  document_id: string;
  document_title: string;
  page_number: number;
  excerpt: string;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations: Citation[];
  status: string;
  created_at: string;
};

export type ChatResponse = {
  user_message: ChatMessage;
  assistant_message: ChatMessage;
};

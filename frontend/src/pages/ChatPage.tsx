import { FormEvent, useEffect, useRef, useState } from "react";
import { ArrowUp, Bot, FileText, Plus, UserRound } from "lucide-react";
import { api } from "../api";
import type { ChatMessage, Conversation, MedicalDocument } from "../types";

const starters = ["Summarize my latest record", "Which medications are mentioned?", "What questions should I ask my doctor?"];

export function ChatPage({ documents, initialDocument, existingConversation, onOpenDocument, onConversationCreated }: {
  documents: MedicalDocument[];
  initialDocument: MedicalDocument | null;
  existingConversation: Conversation | null;
  onOpenDocument: (documentId: string) => void;
  onConversationCreated: () => void;
}) {
  const [scope, setScope] = useState(initialDocument?.id ?? existingConversation?.scope_document_id ?? "all");
  const [conversationId, setConversationId] = useState<string | null>(existingConversation?.id ?? null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (existingConversation) api.messages(existingConversation.id).then(setMessages).catch((caught) => setError(caught.message));
  }, [existingConversation]);
  useEffect(() => { bottom.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, sending]);

  function newConversation() { setConversationId(null); setMessages([]); setError(""); }
  async function submit(event?: FormEvent) {
    event?.preventDefault();
    const question = input.trim();
    if (!question || sending) return;
    setSending(true); setError(""); setInput("");
    try {
      let id = conversationId;
      if (!id) {
        const conversation = await api.createConversation(scope === "all" ? null : scope);
        id = conversation.id; setConversationId(id); onConversationCreated();
      }
      const response = await api.sendMessage(id, question);
      setMessages((current) => [...current, response.user_message, response.assistant_message]);
    } catch (caught) {
      setInput(question);
      setError(caught instanceof Error ? caught.message : "Unable to send your question");
    } finally { setSending(false); }
  }

  return (
    <div className="chat-page">
      <header className="chat-header">
        <div><p className="eyebrow">Educational record assistant</p><h1>{existingConversation?.title ?? "Ask AI Med"}</h1></div>
        <button className="button button--outline" onClick={newConversation}><Plus size={16} /> New conversation</button>
      </header>
      <div className="scope-bar"><span>Searching</span><select value={scope} onChange={(event) => { setScope(event.target.value); newConversation(); }}><option value="all">All medical records</option>{documents.map((document) => <option value={document.id} key={document.id}>{document.title}</option>)}</select></div>
      <section className="chat-thread" aria-live="polite">
        {messages.length === 0 && (
          <div className="chat-welcome"><span className="ask-orb"><Bot size={24} /></span><h2>Ask a question about your records</h2><p>AI Med will search the selected records and show the passages used in its answer.</p><div className="chat-starters">{starters.map((starter) => <button key={starter} onClick={() => setInput(starter)}>{starter}</button>)}</div></div>
        )}
        {messages.map((message) => (
          <article className={`chat-message chat-message--${message.role}`} key={message.id}>
            <span className="message-avatar">{message.role === "assistant" ? <Bot size={17} /> : <UserRound size={17} />}</span>
            <div><strong>{message.role === "assistant" ? "AI Med" : "You"}</strong><p>{message.content}</p>{message.citations.length > 0 && <div className="citation-list">{message.citations.map((citation) => <button key={citation.citation_id} onClick={() => onOpenDocument(citation.document_id)}><FileText size={14} /><span>[{citation.citation_id}] {citation.document_title}, page {citation.page_number}</span></button>)}</div>}</div>
          </article>
        ))}
        {sending && <article className="chat-message chat-message--assistant"><span className="message-avatar"><Bot size={17} /></span><div><strong>AI Med</strong><div className="typing-dots"><i /><i /><i /></div></div></article>}
        <div ref={bottom} />
      </section>
      {error && <div className="chat-error" role="alert"><strong>AI Med could not answer</strong><span>{error}</span>{error.includes("GEMINI_API_KEY") && <code>Add GEMINI_API_KEY=your-key to backend/.env, then restart uvicorn.</code>}</div>}
      <form className="chat-composer" onSubmit={submit}><textarea value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask about your medical records…" rows={2} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); submit(); } }} /><button className="send-button" disabled={!input.trim() || sending} aria-label="Send question"><ArrowUp size={19} /></button></form>
      <p className="composer-disclaimer">AI Med provides educational information—not diagnosis, treatment, or emergency care.</p>
    </div>
  );
}

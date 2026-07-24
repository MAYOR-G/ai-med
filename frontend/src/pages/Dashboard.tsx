import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Bot, ChevronRight, Clock3, FileCheck2, FileText, FolderOpen, MessageCircle, Plus, Search, Settings, Upload, UserRound } from "lucide-react";
import { api } from "../api";
import type { Conversation, MedicalDocument, User } from "../types";
import { Brand } from "../components/Brand";
import { UploadDialog } from "../components/UploadDialog";
import { ChatPage } from "./ChatPage";
import { ConversationsPage } from "./ConversationsPage";
import { DocumentsPage } from "./DocumentsPage";
import { DocumentViewer } from "./DocumentViewer";

type View = "Overview" | "Medical history" | "Ask AI Med" | "Conversations" | "Document";
const nav = [["Overview", FolderOpen], ["Medical history", FileText], ["Ask AI Med", Bot], ["Conversations", MessageCircle]] as const;

function formatBytes(value: number) { return value < 1024 * 1024 ? `${Math.round(value / 1024)} KB` : `${(value / 1024 / 1024).toFixed(1)} MB`; }

export function Dashboard({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [documents, setDocuments] = useState<MedicalDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [active, setActive] = useState<View>("Overview");
  const [selectedDocument, setSelectedDocument] = useState<MedicalDocument | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [conversationRefresh, setConversationRefresh] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => { api.documents().then(setDocuments).catch((caught) => setError(caught.message)).finally(() => setLoading(false)); }, []);
  const ready = useMemo(() => documents.filter((document) => document.processing_status === "READY").length, [documents]);

  function navigate(view: View) {
    setActive(view);
    setSelectedConversation(null);
    if (view === "Ask AI Med") setSelectedDocument(null);
  }
  function openDocument(document: MedicalDocument) { setSelectedDocument(document); setActive("Document"); }
  function openDocumentById(id: string) { const document = documents.find((item) => item.id === id); if (document) openDocument(document); }
  function askDocument(document: MedicalDocument) { setSelectedDocument(document); setSelectedConversation(null); setActive("Ask AI Med"); }
  async function reprocess(document: MedicalDocument) { const updated = await api.reprocess(document.id); setDocuments((current) => current.map((item) => item.id === updated.id ? updated : item)); }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Brand dark />
        <nav aria-label="Main navigation">{nav.map(([label, Icon]) => <button key={label} className={active === label || (active === "Document" && label === "Medical history") ? "active" : ""} onClick={() => navigate(label)}><Icon size={18} /><span>{label}</span>{label === "Ask AI Med" && <i>AI</i>}</button>)}</nav>
        <div className="sidebar__bottom"><button><Settings size={18} /><span>Settings</span></button><button className="profile-button" onClick={onLogout} title="Sign out"><span className="avatar">{user.name.slice(0, 2).toUpperCase()}</span><span><strong>{user.name}</strong><small>{user.email}</small></span><ChevronRight size={16} /></button></div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="mobile-brand"><Brand /></div>
          <label className="search-box"><Search size={18} /><input placeholder="Search your medical history" aria-label="Search your medical history" /></label>
          <button className="button button--primary" onClick={() => setShowUpload(true)}><Plus size={17} /> Upload record</button>
          <button className="icon-button user-mobile"><UserRound size={19} /></button>
        </header>

        {active === "Overview" && <Overview user={user} documents={documents} ready={ready} loading={loading} error={error} onUpload={() => setShowUpload(true)} onNavigate={navigate} onOpen={openDocument} onAsk={askDocument} />}
        {active === "Medical history" && <DocumentsPage documents={documents} onOpen={openDocument} onAsk={askDocument} onUpload={() => setShowUpload(true)} onReprocess={reprocess} />}
        {active === "Document" && selectedDocument && <DocumentViewer document={selectedDocument} onBack={() => setActive("Medical history")} onAsk={() => askDocument(selectedDocument)} />}
        {active === "Ask AI Med" && <ChatPage key={`${selectedConversation?.id ?? "new"}-${selectedDocument?.id ?? "all"}`} documents={documents} initialDocument={selectedConversation ? null : selectedDocument} existingConversation={selectedConversation} onOpenDocument={openDocumentById} onConversationCreated={() => setConversationRefresh((value) => value + 1)} />}
        {active === "Conversations" && <ConversationsPage refreshKey={conversationRefresh} onNew={() => { setSelectedDocument(null); setSelectedConversation(null); setActive("Ask AI Med"); }} onOpen={(conversation) => { setSelectedConversation(conversation); setSelectedDocument(null); setActive("Ask AI Med"); }} />}
      </main>
      {showUpload && <UploadDialog onClose={() => setShowUpload(false)} onUploaded={(document) => setDocuments((current) => [document, ...current])} />}
    </div>
  );
}

function Overview({ user, documents, ready, loading, error, onUpload, onNavigate, onOpen, onAsk }: { user: User; documents: MedicalDocument[]; ready: number; loading: boolean; error: string; onUpload: () => void; onNavigate: (view: View) => void; onOpen: (document: MedicalDocument) => void; onAsk: (document: MedicalDocument) => void }) {
  const firstName = user.name.split(" ")[0];
  return <div className="dashboard">
    <section className="welcome-row"><div><p className="date-label">Your private health workspace</p><h1>Good morning, {firstName}.</h1><p>Your records are organized and ready when you need them.</p></div><button className="button button--outline" onClick={() => onNavigate("Ask AI Med")}><Bot size={17} /> Ask AI Med</button></section>
    <section className="metric-grid" aria-label="Document summary"><article className="metric-card"><span className="metric-icon metric-icon--ink"><FileText size={20} /></span><div><strong>{loading ? "—" : documents.length}</strong><span>Total records</span></div><small>All uploaded files</small></article><article className="metric-card"><span className="metric-icon metric-icon--green"><FileCheck2 size={20} /></span><div><strong>{loading ? "—" : ready}</strong><span>Ready to search</span></div><small>{documents.length - ready} being prepared</small></article><article className="metric-card"><span className="metric-icon metric-icon--sand"><Clock3 size={20} /></span><div><strong>AI</strong><span>Record assistant</span></div><small>Grounded in your documents</small></article></section>
    <section className="content-grid"><div className="panel records-panel"><div className="panel__heading"><div><p className="eyebrow">Medical history</p><h2>Recent records</h2></div><button className="text-link" onClick={() => onNavigate("Medical history")}>View all <ArrowUpRight size={15} /></button></div>{error && <p className="form-error">{error}</p>}{!loading && documents.length === 0 ? <div className="empty-state"><span><Upload size={25} /></span><h3>Your history starts here</h3><p>Upload a report, result, or note. AI Med will keep the original and prepare its text for search.</p><button className="button button--outline" onClick={onUpload}>Choose a document</button></div> : <div className="record-list">{documents.slice(0, 4).map((document) => <article className="record-row" key={document.id}><span className="file-badge"><FileText size={20} /></span><button className="record-main record-main--button" onClick={() => onOpen(document)}><strong>{document.title}</strong><span>{document.category} · {formatBytes(document.file_size)}</span></button><span className={`status status--${document.processing_status.toLowerCase()}`}>{document.processing_status.replace("_", " ")}</span><button className="icon-button" aria-label={`Open ${document.title}`} onClick={() => onOpen(document)}><ChevronRight size={18} /></button></article>)}</div>}</div>
      <aside className="panel ask-panel"><div className="ask-orb"><Bot size={24} /></div><p className="eyebrow">Understand your records</p><h2>What would you like to know?</h2><p>Ask about a result, find a medication mention, or prepare questions for your doctor.</p><div className="starter-list"><button onClick={() => onNavigate("Ask AI Med")}>Summarize my latest report <ChevronRight size={15} /></button><button onClick={() => onNavigate("Ask AI Med")}>Which medications are mentioned? <ChevronRight size={15} /></button><button onClick={() => onNavigate("Ask AI Med")}>Help me prepare for my next visit <ChevronRight size={15} /></button></div><button className="button button--light button--wide" onClick={() => onNavigate("Ask AI Med")}>Start a conversation <ArrowUpRight size={16} /></button></aside></section>
    <footer className="medical-disclaimer"><span>i</span><p><strong>For education, not diagnosis.</strong> AI Med can summarize your uploaded records and provide general information. It does not provide treatment or emergency medical care.</p></footer>
  </div>;
}

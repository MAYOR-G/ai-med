import { useEffect, useState } from "react";
import { ArrowLeft, Download, FileText, MessageCircle } from "lucide-react";
import { api } from "../api";
import type { DocumentText, MedicalDocument } from "../types";

export function DocumentViewer({ document, onBack, onAsk }: { document: MedicalDocument; onBack: () => void; onAsk: () => void }) {
  const [text, setText] = useState<DocumentText | null>(null);
  const [error, setError] = useState("");
  const fileUrl = api.documentFileUrl(document.id);
  const embeddable = document.mime_type === "application/pdf" || document.mime_type === "text/plain";

  useEffect(() => { api.documentText(document.id).then(setText).catch((caught) => setError(caught.message)); }, [document.id]);

  return (
    <div className="viewer-page">
      <header className="viewer-header">
        <button className="icon-button" onClick={onBack} aria-label="Back to medical history"><ArrowLeft size={20} /></button>
        <div><p className="eyebrow">{document.category}</p><h1>{document.title}</h1><p>{document.original_filename}</p></div>
        <div className="viewer-actions"><a className="button button--outline" href={fileUrl} target="_blank" rel="noreferrer"><Download size={16} /> Open original</a><button className="button button--primary" onClick={onAsk}><MessageCircle size={16} /> Ask about this</button></div>
      </header>
      <div className="viewer-layout">
        <section className="original-viewer panel">
          <div className="viewer-label"><span>Original file</span><small>Preserved exactly as uploaded</small></div>
          {embeddable ? <iframe src={fileUrl} title={`Original document: ${document.title}`} /> : <div className="unsupported-preview"><FileText size={36} /><h2>DOCX preview</h2><p>Your original Word document is preserved. Open it in a compatible application, or review the extracted text alongside it.</p><a className="button button--outline" href={fileUrl}>Download original</a></div>}
        </section>
        <aside className="text-panel panel">
          <div className="viewer-label"><span>Extracted text</span><small>Used for record search and AI answers</small></div>
          {error && <p className="form-error">{error}</p>}
          {!text && !error && <div className="text-loading">Extracting document text…</div>}
          {text?.error && <p className="form-error">{text.error}</p>}
          {text?.pages.map((page) => <article className="extracted-page" key={page.page_number}><strong>Page {page.page_number}</strong><p>{page.text}</p></article>)}
        </aside>
      </div>
    </div>
  );
}

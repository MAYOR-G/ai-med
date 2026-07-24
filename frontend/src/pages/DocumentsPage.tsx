import { FileText, MessageCircle, RefreshCw, Search } from "lucide-react";
import type { MedicalDocument } from "../types";

function formatBytes(value: number) {
  return value < 1024 * 1024 ? `${Math.round(value / 1024)} KB` : `${(value / 1024 / 1024).toFixed(1)} MB`;
}

export function DocumentsPage({
  documents,
  onOpen,
  onAsk,
  onUpload,
  onReprocess,
}: {
  documents: MedicalDocument[];
  onOpen: (document: MedicalDocument) => void;
  onAsk: (document: MedicalDocument) => void;
  onUpload: () => void;
  onReprocess: (document: MedicalDocument) => void;
}) {
  return (
    <div className="page-view">
      <header className="page-heading">
        <div><p className="eyebrow">Your records</p><h1>Medical history</h1><p>Original files and extracted text, kept together.</p></div>
        <button className="button button--primary" onClick={onUpload}>Upload record</button>
      </header>
      <label className="library-search"><Search size={17} /><input placeholder="Search by document title" /></label>
      {documents.length === 0 ? (
        <div className="panel library-empty"><FileText size={30} /><h2>No records yet</h2><p>Upload your first PDF, DOCX, or TXT document.</p></div>
      ) : (
        <div className="document-grid">
          {documents.map((document) => (
            <article className="document-card" key={document.id}>
              <div className="document-card__top"><span className="file-badge"><FileText size={21} /></span><span className={`status status--${document.processing_status.toLowerCase()}`}>{document.processing_status.replace("_", " ")}</span></div>
              <p className="document-card__category">{document.category}</p>
              <h2>{document.title}</h2>
              <p className="document-card__meta">{document.original_filename} · {formatBytes(document.file_size)}</p>
              <p className="document-card__summary">{document.summary || (document.processing_status === "OCR_REQUIRED" ? "This document needs OCR before its text can be searched." : "Open the record to view the original and extracted text.")}</p>
              <div className="document-card__actions">
                <button className="button button--outline" onClick={() => onOpen(document)}>View original</button>
                <button className="icon-button" title="Ask about this record" onClick={() => onAsk(document)}><MessageCircle size={17} /></button>
                {document.processing_status !== "READY" && <button className="icon-button" title="Process again" onClick={() => onReprocess(document)}><RefreshCw size={17} /></button>}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

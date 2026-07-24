import { ChangeEvent, useRef, useState } from "react";
import { FileText, Upload, X } from "lucide-react";
import { api } from "../api";
import type { MedicalDocument } from "../types";

const categories = ["Laboratory Result", "Prescription", "Medical Report", "Discharge Summary", "Imaging Report", "Vaccination Record", "Doctor’s Note", "Referral", "Insurance Document", "Other"];

export function UploadDialog({ onClose, onUploaded }: { onClose: () => void; onUploaded: (document: MedicalDocument) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState(categories[0]);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function choose(event: ChangeEvent<HTMLInputElement>) { setFile(event.target.files?.[0] ?? null); setError(""); }
  async function upload() {
    if (!file) return;
    setLoading(true); setError("");
    try { onUploaded(await api.upload(file, category)); onClose(); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Upload failed"); }
    finally { setLoading(false); }
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="upload-title" onMouseDown={(event) => event.stopPropagation()}>
        <button className="icon-button modal__close" onClick={onClose} aria-label="Close"><X size={19} /></button>
        <p className="eyebrow">Add to your history</p>
        <h2 id="upload-title">Upload a medical record</h2>
        <p className="muted">PDF, DOCX, or TXT · maximum 20 MB</p>
        <div
          className={`drop-zone ${dragging ? "drop-zone--active" : ""}`}
          onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => { event.preventDefault(); setDragging(false); setFile(event.dataTransfer.files[0] ?? null); }}
          onClick={() => input.current?.click()}
        >
          <input ref={input} hidden type="file" accept=".pdf,.docx,.txt" onChange={choose} />
          {file ? <><FileText size={28} /><strong>{file.name}</strong><span>{(file.size / 1024 / 1024).toFixed(2)} MB</span></> : <><Upload size={28} /><strong>Drop a document here</strong><span>or choose from your computer</span></>}
        </div>
        <label>Document category<select value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
        <div className="privacy-callout"><strong>Before you upload</strong><span>Use synthetic or anonymized records during development. AI features transmit extracted text to Gemini.</span></div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="modal__actions"><button className="button button--ghost" onClick={onClose}>Cancel</button><button className="button button--primary" onClick={upload} disabled={!file || loading}>{loading ? "Uploading…" : "Upload record"}</button></div>
      </section>
    </div>
  );
}


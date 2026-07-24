import { Sparkles } from "lucide-react";

export function Brand({ dark = false }: { dark?: boolean }) {
  return (
    <div className={`brand ${dark ? "brand--dark" : ""}`} aria-label="AI Med">
      <span className="brand__mark"><Sparkles size={16} strokeWidth={1.8} /></span>
      <span>AI Med</span>
    </div>
  );
}


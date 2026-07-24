import { useEffect, useState } from "react";
import { ChevronRight, MessageCircle, Plus } from "lucide-react";
import { api } from "../api";
import type { Conversation } from "../types";

export function ConversationsPage({ refreshKey, onOpen, onNew }: { refreshKey: number; onOpen: (conversation: Conversation) => void; onNew: () => void }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  useEffect(() => { api.conversations().then(setConversations); }, [refreshKey]);
  return <div className="page-view"><header className="page-heading"><div><p className="eyebrow">Saved locally</p><h1>Conversations</h1><p>Return to earlier questions and their cited record context.</p></div><button className="button button--primary" onClick={onNew}><Plus size={16} /> New conversation</button></header><div className="conversation-list panel">{conversations.length === 0 ? <div className="library-empty"><MessageCircle size={30} /><h2>No conversations yet</h2><p>Ask AI Med your first question to begin.</p></div> : conversations.map((conversation) => <button key={conversation.id} onClick={() => onOpen(conversation)}><span className="file-badge"><MessageCircle size={18} /></span><span><strong>{conversation.title}</strong><small>{new Date(conversation.updated_at).toLocaleString()}</small></span><ChevronRight size={18} /></button>)}</div></div>;
}

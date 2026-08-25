import React, { useState } from "react";
import { ChatSession, ModelInfo } from "../types";
import {
  Plus,
  MessageSquare,
  Search,
  Trash2,
  Lock,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Check,
} from "lucide-react";

interface ChatListSidebarProps {
  sessions: ChatSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
  onRenameSession: (id: string, newTitle: string) => void;
  models: ModelInfo[];
  isOpen: boolean;
  onToggleOpen: () => void;
}

export const ChatListSidebar: React.FC<ChatListSidebarProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onRenameSession,
  models,
  isOpen,
  onToggleOpen,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const startRename = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(session.id);
    setEditTitle(session.title);
  };

  const saveRename = (id: string, e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onRenameSession(id, editTitle.trim());
    }
    setEditingId(null);
  };

  if (!isOpen) {
    return (
      <button
        id="btn-open-chat-list"
        onClick={onToggleOpen}
        className="fixed left-0 top-20 bg-neutral-900 hover:bg-neutral-800 border-r border-t border-b border-neutral-700 text-neutral-300 p-2 rounded-r-lg shadow-lg z-20 transition"
        title="Ouvrir l'historique des discussions"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    );
  }

  return (
    <aside
      id="chat-list-sidebar"
      className="w-64 border-r border-neutral-800 bg-neutral-950 flex flex-col h-full shrink-0 select-none z-10 text-neutral-200 text-xs"
    >
      <div className="p-3 border-b border-neutral-800 flex items-center justify-between">
        <button
          id="btn-new-chat-session"
          onClick={onNewSession}
          className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 px-3 rounded-lg shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle Discussion</span>
        </button>
        <button
          id="btn-collapse-chat-list"
          onClick={onToggleOpen}
          className="ml-2 p-2 rounded-lg hover:bg-neutral-850 text-neutral-400 hover:text-neutral-200"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      <div className="p-2.5 border-b border-neutral-850">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-neutral-500" />
          <input
            id="input-search-sessions"
            type="text"
            placeholder="Rechercher une discussion..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filteredSessions.length === 0 ? (
          <div className="text-center py-8 text-neutral-500 text-xs">
            Aucune discussion trouvée.
          </div>
        ) : (
          filteredSessions.map((session) => {
            const model = models.find((m) => m.id === session.modelId);
            const isSelected = session.id === activeSessionId;

            return (
              <div
                key={session.id}
                onClick={() => onSelectSession(session.id)}
                className={`group relative p-2.5 rounded-xl cursor-pointer transition border ${
                  isSelected
                    ? "bg-neutral-900 border-neutral-700 text-neutral-100 shadow-sm"
                    : "border-transparent hover:bg-neutral-900/60 hover:border-neutral-850 text-neutral-400 hover:text-neutral-200"
                }`}
              >
                {editingId === session.id ? (
                  <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && saveRename(session.id, e)}
                      autoFocus
                      className="w-full bg-neutral-950 border border-blue-500 rounded px-1.5 py-0.5 text-xs text-white"
                    />
                    <button
                      onClick={(e) => saveRename(session.id, e)}
                      className="p-1 text-emerald-400 hover:text-emerald-300"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium truncate text-xs flex items-center space-x-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <span className="truncate">{session.title}</span>
                      </span>
                      {session.isEncrypted && (
                        <span className="shrink-0 ml-1" title="Chiffré AES-GCM">
                          <Lock className="w-3 h-3 text-emerald-400" />
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-neutral-500 mt-1.5">
                      <span className="truncate font-mono text-neutral-400">
                        {model?.name?.split(" ")[0] || "DeepSeek"}
                      </span>
                      <span>
                        {new Date(session.updatedAt).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </div>
                  </div>
                )}

                <div className="absolute right-2 top-2 hidden group-hover:flex items-center space-x-1 bg-neutral-900/90 p-0.5 rounded shadow">
                  <button
                    onClick={(e) => startRename(session, e)}
                    className="p-1 hover:text-blue-400 text-neutral-400"
                    title="Renommer"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  {sessions.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSession(session.id);
                      }}
                      className="p-1 hover:text-rose-400 text-neutral-400"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="p-3 border-t border-neutral-850 bg-neutral-950/80 text-[10px] text-neutral-500 flex items-center justify-between">
        <span>Stockage Local Chiffré</span>
        <span className="font-mono text-emerald-400">100% Hors-Ligne</span>
      </div>
    </aside>
  );
};
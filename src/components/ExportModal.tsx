import React from "react";
import { ChatSession, ProjectItem } from "../types";
import { exportChatToPDF, exportToCSV } from "../utils/export";
import { Download, FileText, Table, FileCode, CheckCircle2 } from "lucide-react";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: ChatSession;
  modelName: string;
  projects: ProjectItem[];
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  session,
  modelName,
  projects,
}) => {
  if (!isOpen) return null;

  const handleExportMarkdown = () => {
    let md = `# Local AI Studio Session: ${session.title}\n\n`;
    md += `**Date**: ${new Date(session.updatedAt).toLocaleString()}\n`;
    md += `**Model**: ${modelName} (${session.modelId})\n\n`;

    if (session.systemInstruction) {
      md += `### System Instructions\n> ${session.systemInstruction}\n\n`;
    }

    md += `---\n\n`;

    session.messages.forEach((msg) => {
      md += `### ${msg.role === "user" ? "👤 User" : `🤖 Assistant (${msg.modelUsed || modelName})`}\n`;
      md += `${msg.content}\n\n`;
    });

    const blob = new Blob([md], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${session.title.replace(/[^a-z0-9_-]/gi, "_")}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onClose();
  };

  const handleExportCSV = () => {
    const rows = session.messages.map((m) => ({
      sessionTitle: session.title,
      role: m.role,
      content: m.content,
      modelUsed: m.modelUsed || modelName,
      timestamp: m.timestamp,
      tokens: m.tokens || 0,
      latencyMs: m.latencyMs || 0,
    }));
    exportToCSV(`session_${session.title.replace(/[^a-z0-9_-]/gi, "_")}`, rows);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-950 border border-neutral-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-neutral-200 text-xs">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center space-x-2">
            <Download className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-sm font-bold text-neutral-100">Exporter les Données</h2>
              <p className="text-[11px] text-neutral-400">Exportez votre session ou vos projets sans trace en ligne.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-300">
            ✕
          </button>
        </div>

        <div className="space-y-2.5">
          {/* PDF Option */}
          <button
            onClick={() => {
              exportChatToPDF(session, modelName);
              onClose();
            }}
            className="w-full p-3 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-left flex items-center space-x-3 transition hover:border-neutral-700"
          >
            <div className="w-9 h-9 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-neutral-100">Document PDF Formaté</div>
              <div className="text-[11px] text-neutral-400">Rapport complet avec métadonnées et horodatage</div>
            </div>
          </button>

          {/* CSV Option */}
          <button
            onClick={handleExportCSV}
            className="w-full p-3 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-left flex items-center space-x-3 transition hover:border-neutral-700"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Table className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-neutral-100">Tableur CSV</div>
              <div className="text-[11px] text-neutral-400">Pour analyse dans Excel, Google Sheets ou BI</div>
            </div>
          </button>

          {/* Markdown Option */}
          <button
            onClick={handleExportMarkdown}
            className="w-full p-3 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-left flex items-center space-x-3 transition hover:border-neutral-700"
          >
            <div className="w-9 h-9 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-neutral-100">Fichier Markdown (.md)</div>
              <div className="text-[11px] text-neutral-400">Compatible GitHub, Obsidian, Notion</div>
            </div>
          </button>
        </div>

        <div className="pt-2 border-t border-neutral-800 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-850 text-neutral-300">
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
};

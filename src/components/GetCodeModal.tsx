import React, { useState } from "react";
import { generateCodeSnippet } from "../utils/export";
import { ModelParameters } from "../types";
import { Code2, Copy, Check, Terminal, ExternalLink } from "lucide-react";

interface GetCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  modelId: string;
  systemInstruction: string;
  prompt: string;
  parameters: ModelParameters;
  host: string;
}

export const GetCodeModal: React.FC<GetCodeModalProps> = ({
  isOpen,
  onClose,
  modelId,
  systemInstruction,
  prompt,
  parameters,
  host,
}) => {
  const [lang, setLang] = useState<"python" | "typescript" | "curl" | "ollama_cli" | "openai_format">("python");
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const code = generateCodeSnippet(lang, modelId, systemInstruction, prompt, parameters, host);

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-950 border border-neutral-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl text-neutral-200 text-xs">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center space-x-2">
            <Code2 className="w-5 h-5 text-blue-400" />
            <div>
              <h2 className="text-sm font-bold text-neutral-100">Obtenir le Code (Get Code)</h2>
              <p className="text-[11px] text-neutral-400">Intégrez ce prompt dans vos applications sans frais d'API.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-300">
            ✕
          </button>
        </div>

        {/* Language Tabs */}
        <div className="flex flex-wrap gap-1.5 bg-neutral-900 p-1.5 rounded-xl border border-neutral-800">
          {(
            [
              { id: "python", label: "Python (Ollama / Requests)" },
              { id: "typescript", label: "Node.js / TypeScript" },
              { id: "curl", label: "cURL" },
              { id: "ollama_cli", label: "CLI Ollama" },
              { id: "openai_format", label: "OpenAI SDK Compatible" },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              onClick={() => setLang(item.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                lang === item.id
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Code View */}
        <div className="relative rounded-xl overflow-hidden border border-neutral-800 bg-neutral-900/90 font-mono text-xs shadow-inner">
          <button
            onClick={copyCode}
            className="absolute right-3 top-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-3 py-1.5 rounded-lg flex items-center space-x-1.5 border border-neutral-700 shadow transition"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-sans">Copié</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span className="font-sans">Copier</span>
              </>
            )}
          </button>
          <pre className="p-4 max-h-80 overflow-y-auto text-neutral-200 leading-relaxed font-mono whitespace-pre-wrap">
            <code>{code}</code>
          </pre>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-neutral-800 text-[11px] text-neutral-500">
          <span>Hôte configuré : <code className="text-blue-400 font-mono">{host}</code></span>
          <button onClick={onClose} className="px-4 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-850 text-neutral-300">
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

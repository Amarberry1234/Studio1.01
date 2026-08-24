import React, { useState, useRef, useEffect } from "react";
import {
  ChatMessage,
  ChatSession,
  ModelInfo,
  ModelParameters,
  ProjectItem,
} from "../types";
import {
  Send,
  Square,
  Sparkles,
  User,
  Bot,
  Copy,
  Check,
  RefreshCw,
  Paperclip,
  Trash2,
  BrainCircuit,
  Zap,
  Code2,
  Clock,
  Play,
  Share2,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Kanban,
  FileText,
  Terminal,
  Globe2,
  Users,
} from "lucide-react";
import { PromptOptimizerModal } from "./PromptOptimizerModal";

interface ChatPlaygroundProps {
  session: ChatSession;
  onUpdateSession: (updated: ChatSession) => void;
  models: ModelInfo[];
  selectedModel: ModelInfo;
  isStreaming: boolean;
  onSendMessage: (text: string, attachments?: any[]) => void;
  onStopStreaming: () => void;
  onRegenerate: (messageIndex: number) => void;
  projects: ProjectItem[];
  onLinkToProject?: (sessionId: string, projectId: string) => void;
  onOpenExternalResearch?: (query?: string) => void;
  onOpenAgentsCoWork?: () => void;
}

export const ChatPlayground: React.FC<ChatPlaygroundProps> = ({
  session,
  onUpdateSession,
  models,
  selectedModel,
  isStreaming,
  onSendMessage,
  onStopStreaming,
  onRegenerate,
  projects,
  onOpenExternalResearch,
  onOpenAgentsCoWork,
}) => {
  const [inputText, setInputText] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [openThinkId, setOpenThinkId] = useState<Record<string, boolean>>({});
  const [attachments, setAttachments] = useState<any[]>([]);
  const [showSysBanner, setShowSysBanner] = useState(false);
  const [sandboxOutput, setSandboxOutput] = useState<{ [key: string]: string }>({});
  const [isOptimizerOpen, setIsOptimizerOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll on new tokens
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session.messages, isStreaming]);

  const handleSend = () => {
    if ((!inputText.trim() && attachments.length === 0) || isStreaming) return;
    onSendMessage(inputText, attachments);
    setInputText("");
    setAttachments([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !files.length) return;
    const file = files[0];
    const reader = new FileReader();

    if (file.type.startsWith("image/")) {
      reader.onload = (event) => {
        setAttachments((prev) => [
          ...prev,
          { name: file.name, type: file.type, url: event.target?.result as string },
        ]);
      };
      reader.readAsDataURL(file);
    } else {
      reader.onload = (event) => {
        setAttachments((prev) => [
          ...prev,
          { name: file.name, type: file.type, content: event.target?.result as string },
        ]);
      };
      reader.readAsText(file);
    }
  };

  const executeCodeInSandbox = (code: string, blockId: string) => {
    try {
      // Safe sandbox console capture
      let logs: string[] = [];
      const customConsole = {
        log: (...args: any[]) => logs.push(args.map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" ")),
        error: (...args: any[]) => logs.push("[ERROR] " + args.join(" ")),
        warn: (...args: any[]) => logs.push("[WARN] " + args.join(" ")),
      };

      const runner = new Function("console", `"use strict";\n${code}`);
      runner(customConsole);
      setSandboxOutput((prev) => ({
        ...prev,
        [blockId]: logs.length > 0 ? logs.join("\n") : "Execution completed successfully (no console output).",
      }));
    } catch (err: any) {
      setSandboxOutput((prev) => ({
        ...prev,
        [blockId]: `Runtime Error: ${err.message}`,
      }));
    }
  };

  const toggleThinking = (msgId: string) => {
    setOpenThinkId((prev) => ({
      ...prev,
      [msgId]: prev[msgId] === undefined ? false : !prev[msgId],
    }));
  };

  // Helper to render markdown and code blocks
  const renderMessageContent = (content: string, msgId: string) => {
    // Check for DeepSeek <think> reasoning tags
    let reasoningText = "";
    let mainContent = content;

    const thinkMatch = content.match(/<think>([\s\S]*?)<\/think>/);
    if (thinkMatch) {
      reasoningText = thinkMatch[1].trim();
      mainContent = content.replace(/<think>[\s\S]*?<\/think>/, "").trim();
    }

    const isThinkExpanded = openThinkId[msgId] ?? true;

    // Split by code blocks ```lang ... ```
    const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;
    let blockCount = 0;

    while ((match = codeBlockRegex.exec(mainContent)) !== null) {
      const textBefore = mainContent.substring(lastIndex, match.index);
      if (textBefore) {
        parts.push(
          <div key={`text-${lastIndex}`} className="whitespace-pre-wrap leading-relaxed">
            {textBefore}
          </div>
        );
      }

      const lang = match[1] || "text";
      const code = match[2];
      const blockId = `${msgId}-code-${blockCount++}`;

      parts.push(
        <div
          key={blockId}
          className="my-3 rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950 font-mono text-xs shadow-lg"
        >
          <div className="bg-neutral-900 px-3.5 py-1.5 border-b border-neutral-800 flex items-center justify-between text-neutral-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-400">
              {lang}
            </span>
            <div className="flex items-center space-x-2">
              {(lang === "javascript" || lang === "js" || lang === "typescript" || lang === "ts") && (
                <button
                  onClick={() => executeCodeInSandbox(code, blockId)}
                  className="flex items-center space-x-1 hover:text-emerald-400 text-neutral-400 text-[10px] px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-750 transition"
                  title="Exécuter dans le bac à sable local"
                >
                  <Play className="w-3 h-3 text-emerald-400" />
                  <span>Run Sandbox</span>
                </button>
              )}
              <button
                onClick={() => copyToClipboard(code, blockId)}
                className="flex items-center space-x-1 hover:text-neutral-200 text-neutral-400 text-[10px] px-2 py-0.5 rounded hover:bg-neutral-800 transition"
              >
                {copiedId === blockId ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Copié</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copier</span>
                  </>
                )}
              </button>
            </div>
          </div>
          <pre className="p-3.5 overflow-x-auto text-neutral-200 leading-relaxed font-mono">
            <code>{code}</code>
          </pre>
          {sandboxOutput[blockId] && (
            <div className="p-3 border-t border-neutral-800 bg-neutral-900/90 text-neutral-300 font-mono text-[11px]">
              <div className="flex items-center space-x-1.5 text-emerald-400 font-bold text-[10px] mb-1">
                <Terminal className="w-3 h-3" />
                <span>Résultat d'exécution (Bac à sable local) :</span>
              </div>
              <pre className="whitespace-pre-wrap">{sandboxOutput[blockId]}</pre>
            </div>
          )}
        </div>
      );

      lastIndex = match.index + match[0].length;
    }

    const remainingText = mainContent.substring(lastIndex);
    if (remainingText) {
      parts.push(
        <div key={`text-${lastIndex}`} className="whitespace-pre-wrap leading-relaxed">
          {remainingText}
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {/* Reasoning thought chain */}
        {reasoningText && (
          <div className="mb-3 rounded-xl border border-purple-500/20 bg-purple-950/20 text-purple-200 text-xs overflow-hidden">
            <button
              onClick={() => toggleThinking(msgId)}
              className="w-full px-3 py-2 flex items-center justify-between bg-purple-900/30 text-purple-300 font-medium hover:bg-purple-900/40 transition"
            >
              <div className="flex items-center space-x-2">
                <BrainCircuit className="w-4 h-4 text-purple-400" />
                <span className="font-semibold text-xs">
                  Processus de Réflexion (DeepSeek-R1 Chain-of-Thought)
                </span>
              </div>
              {isThinkExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            {isThinkExpanded && (
              <div className="p-3 font-mono text-[11px] leading-relaxed whitespace-pre-wrap text-purple-300/90 bg-black/20 border-t border-purple-500/10">
                {reasoningText}
              </div>
            )}
          </div>
        )}

        {parts}
      </div>
    );
  };

  return (
    <div id="chat-playground" className="flex-1 flex flex-col h-full bg-neutral-900/50 overflow-hidden relative">
      {/* System Instruction Banner */}
      {session.systemInstruction && (
        <div className="bg-neutral-950/90 border-b border-neutral-800 px-4 py-2 text-xs flex items-center justify-between text-neutral-300">
          <div className="flex items-center space-x-2 truncate">
            <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="font-medium text-neutral-400 shrink-0">System :</span>
            <span className="truncate italic text-neutral-300">"{session.systemInstruction}"</span>
          </div>
          <span className="text-[10px] text-emerald-400 font-mono shrink-0 ml-2 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            0$ Coût / Local
          </span>
        </div>
      )}

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
        {session.messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4 max-w-lg mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-emerald-500 flex items-center justify-center shadow-xl shadow-blue-500/20 text-white">
              <Bot className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-neutral-100">
                Google AI Studio Local • {selectedModel.name}
              </h2>
              <p className="text-xs text-neutral-400 mt-1.5 leading-relaxed">
                Exécutez vos prompts sans limite de crédits, sans compte payant et avec une
                confidentialité absolue grâce au moteur d'inférence open-source local.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full pt-2 text-left text-xs">
              <button
                onClick={() =>
                  setInputText(
                    "Écris un module TypeScript complet pour gérer une file d'attente asynchrone avec retry exponentiel."
                  )
                }
                className="p-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-neutral-300 transition hover:border-neutral-700"
              >
                <div className="font-medium text-blue-400">⚡ Code & Architecture</div>
                <div className="text-[11px] text-neutral-400 truncate">Queue asynchrone & Retry</div>
              </button>
              <button
                onClick={() =>
                  setInputText(
                    "Agis comme un expert sécurité et audite un système d'authentification sans mot de passe."
                  )
                }
                className="p-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-neutral-300 transition hover:border-neutral-700"
              >
                <div className="font-medium text-purple-400">🛡️ Audit Sécurité</div>
                <div className="text-[11px] text-neutral-400 truncate">Analyse de vulnérabilités</div>
              </button>
            </div>
          </div>
        ) : (
          session.messages.map((msg, index) => {
            const isUser = msg.role === "user";

            return (
              <div
                key={msg.id}
                className={`flex gap-3 text-xs md:text-sm ${
                  isUser ? "justify-end" : "justify-start"
                }`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] md:max-w-[78%] rounded-2xl p-4 shadow-sm relative group ${
                    isUser
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "bg-neutral-950 border border-neutral-800 text-neutral-200 rounded-bl-none"
                  }`}
                >
                  {/* Attachments preview */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-2">
                      {msg.attachments.map((att, i) => (
                        <div
                          key={i}
                          className="flex items-center space-x-1.5 px-2 py-1 rounded bg-black/30 text-[11px]"
                        >
                          <Paperclip className="w-3 h-3" />
                          <span className="truncate max-w-xs">{att.name}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Message Body */}
                  {isUser ? (
                    <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                  ) : (
                    renderMessageContent(msg.content, msg.id)
                  )}

                  {/* Metadata & Actions Footer */}
                  {!isUser && (
                    <div className="mt-3 pt-2 border-t border-neutral-850 flex flex-wrap items-center justify-between text-[10px] text-neutral-500 gap-2">
                      <div className="flex items-center space-x-3">
                        <span className="font-mono text-neutral-400">
                          {msg.modelUsed || selectedModel.name}
                        </span>
                        {msg.latencyMs && (
                          <span className="flex items-center space-x-1 text-neutral-400">
                            <Clock className="w-3 h-3 text-neutral-500" />
                            <span>{msg.latencyMs} ms</span>
                          </span>
                        )}
                        {msg.tokens && (
                          <span className="flex items-center space-x-1 text-emerald-400 font-mono">
                            <Zap className="w-3 h-3" />
                            <span>{msg.tokens} tokens (0.00$)</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => copyToClipboard(msg.content, msg.id)}
                          className="p-1 rounded hover:bg-neutral-800 hover:text-neutral-200 transition"
                          title="Copier la réponse"
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => onRegenerate(index)}
                          className="p-1 rounded hover:bg-neutral-800 hover:text-neutral-200 transition"
                          title="Régénérer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-300 shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Prompt Box */}
      <div className="p-3 md:p-4 bg-neutral-950 border-t border-neutral-800 select-none">
        <div className="max-w-4xl mx-auto space-y-2">
          {/* Active Attachments Preview */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 pb-1">
              {attachments.map((att, i) => (
                <div
                  key={i}
                  className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-neutral-300"
                >
                  <Paperclip className="w-3.5 h-3.5 text-blue-400" />
                  <span className="truncate max-w-xs">{att.name}</span>
                  <button
                    onClick={() => setAttachments(attachments.filter((_, idx) => idx !== i))}
                    className="hover:text-rose-400 text-neutral-500 ml-1"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Quick Action Toolbar */}
          <div className="flex items-center justify-between pb-1 px-1">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setIsOptimizerOpen(true)}
                className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[11px] font-medium transition"
                title="Transformer ce prompt brut en un Master Prompt hautement efficace"
              >
                <Sparkles className="w-3 h-3 text-purple-400" />
                <span>🪄 Optimiser ce Prompt</span>
              </button>

              {onOpenAgentsCoWork && (
                <button
                  type="button"
                  onClick={onOpenAgentsCoWork}
                  className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-blue-600/20 via-indigo-600/20 to-emerald-600/20 hover:from-blue-600/30 hover:to-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-medium transition"
                  title="Superviser le code avec les 4 agents autonomes et reformuler les phrases floues"
                >
                  <Users className="w-3 h-3 text-emerald-400" />
                  <span>👥 Agents CoWork & Code</span>
                </button>
              )}

              {onOpenExternalResearch && (
                <button
                  type="button"
                  onClick={() => onOpenExternalResearch(inputText)}
                  className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[11px] font-medium transition"
                  title="Interroger l'IA externe avec recherche web et sources"
                >
                  <Globe2 className="w-3 h-3 text-blue-400" />
                  <span>Consulter l'IA Externe</span>
                </button>
              )}
            </div>

            <span className="text-[10px] text-neutral-500 hidden sm:inline">
              Shift+Entrée = Saut de ligne
            </span>
          </div>

          <div className="relative flex items-end bg-neutral-900 border border-neutral-800 focus-within:border-blue-500 rounded-2xl p-2 shadow-inner transition">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              multiple
            />
            <button
              id="btn-attach-file"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-xl transition shrink-0"
              title="Joindre un fichier de code, image ou document"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <textarea
              id="input-chat-prompt"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={Math.min(5, Math.max(1, inputText.split("\n").length))}
              placeholder={`Demandez à ${selectedModel.name} (Modèle local, 0$ de crédit)... [Shift+Entrée pour saut de ligne]`}
              className="flex-1 bg-transparent border-0 px-3 py-1.5 text-xs md:text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none resize-none leading-relaxed"
            />

            {isStreaming ? (
              <button
                id="btn-stop-streaming"
                onClick={onStopStreaming}
                className="p-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium shadow-md transition shrink-0 animate-pulse"
                title="Arrêter la génération"
              >
                <Square className="w-4 h-4" />
              </button>
            ) : (
              <button
                id="btn-send-message"
                onClick={handleSend}
                disabled={!inputText.trim() && attachments.length === 0}
                className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white font-medium shadow-md shadow-blue-600/20 transition shrink-0"
                title="Envoyer le prompt"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] text-neutral-500 px-1">
            <span className="flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Inférence Open-Source Locale 100% Illimitée</span>
            </span>
            <span className="font-mono text-neutral-400">
              {session.messages.length} messages dans le contexte
            </span>
          </div>
        </div>
      </div>

      {/* Prompt Optimizer Modal */}
      <PromptOptimizerModal
        isOpen={isOptimizerOpen}
        onClose={() => setIsOptimizerOpen(false)}
        initialPrompt={inputText}
        onApplyPrompt={(optimized) => setInputText(optimized)}
      />
    </div>
  );
};

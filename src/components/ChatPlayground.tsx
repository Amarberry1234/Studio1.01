import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ChatSession,
  ModelInfo,
  ProjectItem,
} from "../types";
import {
  ArrowUp,
  Check,
  Copy,
  FileText,
  Paperclip,
  Plus,
  RefreshCw,
  Square,
  X,
} from "lucide-react";

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

function stripReasoning(content: string) {
  let value = String(content || "").replace(/<think>[\s\S]*?<\/think>/gi, "").trimStart();
  const openThink = value.toLowerCase().indexOf("<think>");
  if (openThink >= 0) {
    return {
      text: value.slice(0, openThink).trim(),
      thinking: true,
    };
  }
  value = value.replace(/<\/?think>/gi, "").trim();
  return { text: value, thinking: false };
}

const CodeBlock: React.FC<{ language: string; code: string }> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="my-5 overflow-hidden rounded-xl border border-neutral-800 bg-[#0d0d0d] shadow-sm">
      <div className="flex h-10 items-center justify-between border-b border-neutral-800 bg-neutral-900/80 px-4">
        <span className="text-xs text-neutral-400">{language || "code"}</span>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-neutral-400 transition hover:bg-neutral-800 hover:text-neutral-100"
          type="button"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copié" : "Copier"}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-[13px] leading-6 text-neutral-200">
        <code>{code}</code>
      </pre>
    </div>
  );
};

const MarkdownMessage: React.FC<{ content: string }> = ({ content }) => {
  const { text, thinking } = stripReasoning(content);

  if (!text && thinking) {
    return (
      <div className="flex items-center gap-2 py-1 text-[15px] text-neutral-400">
        <span className="h-2 w-2 animate-pulse rounded-full bg-neutral-500" />
        Réflexion en cours…
      </div>
    );
  }

  return (
    <div className="text-[16px] leading-7 text-neutral-200">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h1 className="mb-4 mt-7 text-2xl font-semibold tracking-tight text-white first:mt-0">{children}</h1>,
          h2: ({ children }) => <h2 className="mb-3 mt-7 text-xl font-semibold tracking-tight text-white first:mt-0">{children}</h2>,
          h3: ({ children }) => <h3 className="mb-2 mt-6 text-lg font-semibold text-white first:mt-0">{children}</h3>,
          h4: ({ children }) => <h4 className="mb-2 mt-5 font-semibold text-white">{children}</h4>,
          p: ({ children }) => <p className="my-3 first:mt-0 last:mb-0">{children}</p>,
          strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
          em: ({ children }) => <em className="text-neutral-200">{children}</em>,
          ul: ({ children }) => <ul className="my-4 list-disc space-y-2 pl-6 marker:text-neutral-500">{children}</ul>,
          ol: ({ children }) => <ol className="my-4 list-decimal space-y-2 pl-6 marker:text-neutral-500">{children}</ol>,
          li: ({ children }) => <li className="pl-1">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="my-5 border-l-2 border-neutral-600 pl-4 text-neutral-400">{children}</blockquote>
          ),
          hr: () => <hr className="my-7 border-neutral-800" />,
          a: ({ children, href }) => (
            <a href={href} target="_blank" rel="noreferrer" className="text-blue-400 underline decoration-blue-400/40 underline-offset-2 hover:text-blue-300">
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="my-5 overflow-x-auto rounded-xl border border-neutral-800">
              <table className="w-full border-collapse text-sm">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-neutral-900 text-neutral-200">{children}</thead>,
          th: ({ children }) => <th className="border-b border-neutral-800 px-4 py-2.5 text-left font-medium">{children}</th>,
          td: ({ children }) => <td className="border-b border-neutral-900 px-4 py-2.5 align-top text-neutral-300">{children}</td>,
          code: ({ className, children, ...props }) => {
            const language = /language-([^\s]+)/.exec(className || "")?.[1];
            if (language) {
              return <code className={className} {...props}>{children}</code>;
            }
            return (
              <code className="rounded-md bg-neutral-800/90 px-1.5 py-0.5 font-mono text-[0.9em] text-neutral-100" {...props}>
                {children}
              </code>
            );
          },
          pre: ({ children }) => {
            const child = React.Children.only(children) as React.ReactElement<any>;
            const className = child?.props?.className || "";
            const language = /language-([^\s]+)/.exec(className)?.[1] || "code";
            const code = String(child?.props?.children ?? "").replace(/\n$/, "");
            return <CodeBlock language={language} code={code} />;
          },
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
};

export const ChatPlayground: React.FC<ChatPlaygroundProps> = ({
  session,
  selectedModel,
  isStreaming,
  onSendMessage,
  onStopStreaming,
  onRegenerate,
}) => {
  const [inputText, setInputText] = useState("");
  const [attachments, setAttachments] = useState<any[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: isStreaming ? "auto" : "smooth" });
  }, [session.messages, isStreaming]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(Math.max(el.scrollHeight, 48), 180)}px`;
  }, [inputText]);

  const send = () => {
    const text = inputText.trim();
    if ((!text && !attachments.length) || isStreaming) return;
    onSendMessage(text, attachments);
    setInputText("");
    setAttachments([]);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      send();
    }
  };

  const copy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    window.setTimeout(() => setCopiedId(null), 1600);
  };

  const handleFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files || []);
    if (!selected.length) return;

    selected.slice(0, 5).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setAttachments((prev) => [
          ...prev,
          file.type.startsWith("image/")
            ? { name: file.name, type: file.type, url: e.target?.result as string }
            : { name: file.name, type: file.type, content: e.target?.result as string },
        ].slice(0, 5));
      };
      if (file.type.startsWith("image/")) reader.readAsDataURL(file);
      else reader.readAsText(file);
    });
    event.target.value = "";
  };

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-neutral-950 text-neutral-100">
      <div className="flex-1 overflow-y-auto">
        {session.messages.length === 0 ? (
          <div className="mx-auto flex min-h-full max-w-3xl flex-col items-center justify-center px-6 pb-28 text-center">
            <div className="mb-3 text-3xl font-semibold tracking-tight text-white">Comment puis-je t’aider ?</div>
            <div className="mb-8 text-sm text-neutral-500">{selectedModel.name} · local</div>
            <div className="grid w-full max-w-2xl grid-cols-1 gap-2 sm:grid-cols-2">
              {[
                "Explique-moi ce code simplement",
                "Aide-moi à corriger un bug",
                "Écris une fonction propre et testable",
                "Résume-moi ce que je dois faire",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setInputText(suggestion)}
                  className="rounded-2xl border border-neutral-800 bg-neutral-900/40 px-4 py-3 text-left text-sm text-neutral-300 transition hover:bg-neutral-900 hover:text-white"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto w-full max-w-4xl px-4 pb-36 pt-7 sm:px-6">
            {session.messages.map((msg, index) => {
              const isUser = msg.role === "user";
              return (
                <div key={msg.id} className={`mb-8 flex w-full ${isUser ? "justify-end" : "justify-start"}`}>
                  {isUser ? (
                    <div className="max-w-[82%] sm:max-w-[72%]">
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mb-2 flex flex-wrap justify-end gap-2">
                          {msg.attachments.map((att: any, i: number) => (
                            <div key={`${msg.id}-att-${i}`} className="flex items-center gap-1.5 rounded-xl border border-neutral-700 bg-neutral-800 px-2.5 py-1.5 text-xs text-neutral-300">
                              <FileText className="h-3.5 w-3.5" />
                              <span className="max-w-52 truncate">{att.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="rounded-[22px] bg-neutral-800 px-4 py-2.5 text-[15px] leading-6 text-neutral-100 shadow-sm">
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="group w-full max-w-3xl">
                      <MarkdownMessage content={msg.content} />
                      {!isStreaming || index !== session.messages.length - 1 ? (
                        <div className="mt-3 flex items-center gap-1 text-neutral-500 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
                          <button
                            type="button"
                            onClick={() => copy(msg.content, msg.id)}
                            className="rounded-lg p-2 transition hover:bg-neutral-900 hover:text-neutral-200"
                            title="Copier"
                          >
                            {copiedId === msg.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => onRegenerate(index)}
                            className="rounded-lg p-2 transition hover:bg-neutral-900 hover:text-neutral-200"
                            title="Régénérer"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </button>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-neutral-950 via-neutral-950/95 to-transparent px-3 pb-4 pt-12 sm:px-6">
        <div className="pointer-events-auto mx-auto max-w-3xl">
          {attachments.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2 px-2">
              {attachments.map((att, index) => (
                <div key={`${att.name}-${index}`} className="flex items-center gap-2 rounded-xl border border-neutral-700 bg-neutral-900 px-3 py-2 text-xs text-neutral-300 shadow-lg">
                  <Paperclip className="h-3.5 w-3.5" />
                  <span className="max-w-48 truncate">{att.name}</span>
                  <button
                    type="button"
                    onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== index))}
                    className="text-neutral-500 hover:text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="rounded-[28px] border border-neutral-700/80 bg-neutral-900 p-2 shadow-2xl shadow-black/30 focus-within:border-neutral-600">
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(event) => setInputText(event.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Pose une question à Nova"
              rows={1}
              className="block min-h-12 w-full resize-none bg-transparent px-3 py-2.5 text-[16px] leading-6 text-neutral-100 outline-none placeholder:text-neutral-500"
            />

            <div className="flex items-center justify-between px-1 pb-1">
              <div className="flex items-center gap-1">
                <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFiles} />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-400 transition hover:bg-neutral-800 hover:text-white"
                  title="Joindre un fichier"
                >
                  <Plus className="h-5 w-5" />
                </button>
                <span className="hidden text-xs text-neutral-600 sm:inline">Entrée pour envoyer · Maj+Entrée pour une nouvelle ligne</span>
              </div>

              {isStreaming ? (
                <button
                  type="button"
                  onClick={onStopStreaming}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-black transition hover:bg-neutral-200"
                  title="Arrêter"
                >
                  <Square className="h-3.5 w-3.5 fill-current" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={send}
                  disabled={!inputText.trim() && attachments.length === 0}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-black transition hover:bg-neutral-200 disabled:bg-neutral-700 disabled:text-neutral-500"
                  title="Envoyer"
                >
                  <ArrowUp className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
          <div className="mt-2 text-center text-[11px] text-neutral-600">Nova peut faire des erreurs. Vérifie les informations importantes.</div>
        </div>
      </div>
    </div>
  );
};

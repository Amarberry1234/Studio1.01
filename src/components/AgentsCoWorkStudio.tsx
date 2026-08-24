import React, { useState } from "react";
import {
  Code2,
  Play,
  Loader2,
  CheckCircle2,
  Circle,
  Copy,
  Check,
  ChevronDown,
  Terminal,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { CoWorkSession } from "../types";

function cleanReadable(text: string): string[] {
  return String(text || "")
    .replace(/\r/g, "")
    .split("\n")
    .map((line) =>
      line
        .replace(/^#{1,6}\s+/, "")
        .replace(/\*\*(.*?)\*\*/g, "$1")
        .replace(/__(.*?)__/g, "$1")
        .replace(/^[-*_]{3,}\s*$/, "")
        .trimEnd()
    )
    .filter((line, index, arr) => line.trim() || (index > 0 && arr[index - 1]?.trim()));
}

const ReadableText: React.FC<{ text: string }> = ({ text }) => {
  const lines = cleanReadable(text);
  if (!lines.length) return <p className="text-neutral-500">Aucun détail.</p>;

  return (
    <div className="space-y-3 text-[15px] leading-7 text-neutral-200">
      {lines.map((line, index) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={index} className="h-1" />;
        const bullet = /^[-•]\s+/.test(trimmed);
        const numbered = /^\d+[.)]\s+/.test(trimmed);
        if (bullet || numbered) {
          return (
            <div key={index} className="flex gap-3 pl-1">
              <span className="text-neutral-500 shrink-0">{bullet ? "•" : trimmed.match(/^\d+[.)]/)?.[0]}</span>
              <span>{trimmed.replace(/^[-•]\s+/, "").replace(/^\d+[.)]\s+/, "")}</span>
            </div>
          );
        }
        return <p key={index}>{trimmed.replace(/`([^`]+)`/g, "$1")}</p>;
      })}
    </div>
  );
};

export const AgentsCoWorkStudio: React.FC = () => {
  const [userPrompt, setUserPrompt] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [activeSession, setActiveSession] = useState<CoWorkSession | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const run = async () => {
    const prompt = userPrompt.trim();
    if (!prompt || isExecuting) return;

    setIsExecuting(true);
    setError("");
    setActiveSession(null);

    try {
      const res = await fetch("/api/agents/cowork/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userPrompt: prompt }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Nova Code n'a pas répondu.");

      setActiveSession({
        id: data.sessionId,
        userRawPrompt: prompt,
        title: data.title || prompt.slice(0, 80),
        clarifiedSpecification: data.steps?.[0]?.summary || "",
        createdAt: new Date().toISOString(),
        status: "completed",
        steps: data.steps || [],
        finalDeliverable: data.finalDeliverable,
      });
    } catch (err: any) {
      setError(err?.message || "Erreur inconnue.");
    } finally {
      setIsExecuting(false);
    }
  };

  const code = activeSession?.finalDeliverable?.files?.[0]?.code || "";
  const review = activeSession?.finalDeliverable?.explanation || activeSession?.steps?.[3]?.detailedOutput || "";
  const plan = activeSession?.finalDeliverable?.architectureSummary || activeSession?.steps?.[1]?.detailedOutput || "";

  const copyCode = async () => {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const phases = [
    { label: "Comprendre", done: !!activeSession || isExecuting },
    { label: "Planifier", done: !!activeSession },
    { label: "Coder", done: !!activeSession },
    { label: "Vérifier", done: !!activeSession },
  ];

  return (
    <div className="flex-1 h-full overflow-y-auto bg-neutral-950 text-neutral-100">
      <main className="max-w-5xl mx-auto px-6 py-8 md:py-10">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-600/15 border border-blue-500/20 flex items-center justify-center">
              <Code2 className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white">Nova Code</h1>
              <p className="text-sm text-neutral-500">Décris ce que tu veux construire ou corriger.</p>
            </div>
          </div>
        </div>

        <section className="rounded-2xl border border-neutral-800 bg-neutral-900/55 p-4 md:p-5 shadow-xl shadow-black/10">
          <textarea
            value={userPrompt}
            onChange={(e) => setUserPrompt(e.target.value)}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === "Enter") run();
            }}
            placeholder="Ex: Corrige la connexion Ollama, simplifie l'interface et vérifie que le build fonctionne..."
            className="w-full min-h-36 resize-y bg-transparent text-[16px] leading-7 text-neutral-100 placeholder-neutral-600 outline-none"
          />

          <div className="mt-4 pt-4 border-t border-neutral-800 flex items-center justify-between gap-3">
            <span className="text-xs text-neutral-600">Ctrl + Entrée pour lancer</span>
            <button
              onClick={run}
              disabled={!userPrompt.trim() || isExecuting}
              className="h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white font-medium text-sm flex items-center gap-2 transition"
            >
              {isExecuting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              <span>{isExecuting ? "Nova travaille..." : "Exécuter"}</span>
            </button>
          </div>
        </section>

        {(isExecuting || activeSession) && (
          <section className="mt-5 rounded-2xl border border-neutral-800 bg-neutral-900/35 px-5 py-4">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              {phases.map((phase, index) => (
                <div key={phase.label} className="flex items-center gap-2 text-sm">
                  {phase.done ? (
                    isExecuting && index === 0 && !activeSession ? (
                      <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    )
                  ) : (
                    <Circle className="w-4 h-4 text-neutral-700" />
                  )}
                  <span className={phase.done ? "text-neutral-300" : "text-neutral-600"}>{phase.label}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {error && (
          <section className="mt-5 rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 flex gap-3 text-sm text-rose-200">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <div className="font-medium">Nova Code a rencontré un problème</div>
              <div className="mt-1 text-rose-300/80">{error}</div>
            </div>
          </section>
        )}

        {activeSession && (
          <div className="mt-8 space-y-5">
            <section className="max-w-4xl rounded-2xl border border-neutral-800 bg-neutral-900/45 p-6 md:p-7">
              <div className="flex items-center gap-2 mb-5">
                <Sparkles className="w-4 h-4 text-violet-400" />
                <h2 className="text-base font-semibold text-white">Résultat</h2>
              </div>
              <ReadableText text={review || "Travail terminé."} />
            </section>

            <details className="group max-w-4xl rounded-2xl border border-neutral-800 bg-neutral-900/30 overflow-hidden">
              <summary className="cursor-pointer list-none px-5 py-4 flex items-center justify-between text-sm font-medium text-neutral-300 hover:bg-neutral-900/60">
                <span>Voir le plan détaillé</span>
                <ChevronDown className="w-4 h-4 text-neutral-500 group-open:rotate-180 transition-transform" />
              </summary>
              <div className="border-t border-neutral-800 p-6">
                <ReadableText text={plan} />
              </div>
            </details>

            {code && (
              <details className="group max-w-5xl rounded-2xl border border-neutral-800 bg-neutral-900/30 overflow-hidden">
                <summary className="cursor-pointer list-none px-5 py-4 flex items-center justify-between text-sm font-medium text-neutral-300 hover:bg-neutral-900/60">
                  <span className="flex items-center gap-2"><Terminal className="w-4 h-4 text-emerald-400" /> Voir le code généré</span>
                  <ChevronDown className="w-4 h-4 text-neutral-500 group-open:rotate-180 transition-transform" />
                </summary>
                <div className="border-t border-neutral-800">
                  <div className="px-4 py-2 border-b border-neutral-800 flex justify-end">
                    <button onClick={copyCode} className="text-xs text-neutral-400 hover:text-white flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-neutral-800">
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? "Copié" : "Copier"}
                    </button>
                  </div>
                  <pre className="p-5 overflow-x-auto whitespace-pre-wrap break-words text-[13px] leading-6 text-neutral-300 font-mono bg-black/20">{code}</pre>
                </div>
              </details>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

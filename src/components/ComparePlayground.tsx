import React, { useState } from "react";
import { ModelInfo, ModelParameters } from "../types";
import {
  Columns2,
  Play,
  Square,
  Sparkles,
  Zap,
  Clock,
  Check,
  ThumbsUp,
  BrainCircuit,
  Bot,
  Copy,
} from "lucide-react";

interface ComparePlaygroundProps {
  models: ModelInfo[];
  parameters: ModelParameters;
  systemInstruction: string;
}

interface CompareResult {
  modelId: string;
  output: string;
  isStreaming: boolean;
  latencyMs: number;
  tokens: number;
  tokensPerSec: number;
}

export const ComparePlayground: React.FC<ComparePlaygroundProps> = ({
  models,
  parameters,
  systemInstruction,
}) => {
  const [modelAId, setModelAId] = useState<string>("deepseek-r1:7b");
  const [modelBId, setModelBId] = useState<string>("llama3.2:3b");
  const [prompt, setPrompt] = useState(
    "Explique la différence entre la programmation asynchrone et le multi-threading avec un exemple concis."
  );
  const [results, setResults] = useState<{ [key: string]: CompareResult }>({
    "deepseek-r1:7b": {
      modelId: "deepseek-r1:7b",
      output: "",
      isStreaming: false,
      latencyMs: 0,
      tokens: 0,
      tokensPerSec: 0,
    },
    "llama3.2:3b": {
      modelId: "llama3.2:3b",
      output: "",
      isStreaming: false,
      latencyMs: 0,
      tokens: 0,
      tokensPerSec: 0,
    },
  });
  const [isComparing, setIsComparing] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);

  const modelA = models.find((m) => m.id === modelAId) || models[0];
  const modelB = models.find((m) => m.id === modelBId) || models[1] || models[0];

  const runComparison = async () => {
    if (!prompt.trim() || isComparing) return;
    setIsComparing(true);
    setWinner(null);

    const modelsToRun = [modelAId, modelBId];

    // Initialize state
    const initial: { [key: string]: CompareResult } = {};
    modelsToRun.forEach((mId) => {
      initial[mId] = {
        modelId: mId,
        output: "",
        isStreaming: true,
        latencyMs: 0,
        tokens: 0,
        tokensPerSec: 0,
      };
    });
    setResults(initial);

    // Run both models concurrently
    await Promise.all(
      modelsToRun.map(async (mId) => {
        const start = performance.now();
        try {
          const response = await fetch("/api/ollama/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              model: mId,
              messages: [
                { role: "system", content: systemInstruction || "Tu es un expert concis et précis." },
                { role: "user", content: prompt },
              ],
              options: parameters,
            }),
          });

          if (response.body) {
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let accumulated = "";
            let tokenCount = 0;

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              const text = decoder.decode(value);
              const lines = text.split("\n\n");
              for (const line of lines) {
                if (line.startsWith("data: ") && !line.includes("[DONE]")) {
                  try {
                    const parsed = JSON.parse(line.replace("data: ", ""));
                    if (parsed.message?.content) {
                      accumulated += parsed.message.content;
                      tokenCount++;
                      const currentLatency = Math.round(performance.now() - start);
                      const tps = currentLatency > 0 ? (tokenCount / (currentLatency / 1000)).toFixed(1) : "0";

                      setResults((prev) => ({
                        ...prev,
                        [mId]: {
                          modelId: mId,
                          output: accumulated,
                          isStreaming: true,
                          latencyMs: currentLatency,
                          tokens: tokenCount,
                          tokensPerSec: parseFloat(tps),
                        },
                      }));
                    }
                  } catch (_e) {}
                }
              }
            }

            const totalLatency = Math.round(performance.now() - start);
            const finalTps = totalLatency > 0 ? (tokenCount / (totalLatency / 1000)).toFixed(1) : "0";

            setResults((prev) => ({
              ...prev,
              [mId]: {
                ...prev[mId],
                isStreaming: false,
                latencyMs: totalLatency,
                tokensPerSec: parseFloat(finalTps),
              },
            }));
          }
        } catch (_err) {
          setResults((prev) => ({
            ...prev,
            [mId]: {
              ...prev[mId],
              output: prev[mId].output || "Erreur de connexion locale au modèle.",
              isStreaming: false,
            },
          }));
        }
      })
    );

    setIsComparing(false);
  };

  return (
    <div id="compare-playground" className="flex-1 flex flex-col h-full bg-neutral-900/50 overflow-y-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-neutral-800">
        <div>
          <h1 className="text-base font-bold text-neutral-100 flex items-center space-x-2">
            <Columns2 className="w-5 h-5 text-blue-400" />
            <span>Mode Comparaison de Modèles (Side-by-Side Arena)</span>
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Évaluez instantanément la vitesse, le raisonnement et la pertinence de deux modèles sur le même prompt.
          </p>
        </div>

        <button
          id="btn-run-compare-battle"
          onClick={runComparison}
          disabled={isComparing || !prompt.trim()}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-semibold px-5 py-2 rounded-xl text-xs shadow-lg shadow-blue-600/20 transition"
        >
          {isComparing ? (
            <>
              <Square className="w-3.5 h-3.5 animate-spin" />
              <span>Comparaison en cours...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Lancer le Comparatif (Run Both)</span>
            </>
          )}
        </button>
      </div>

      {/* Shared Prompt Input */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 space-y-2">
        <label className="text-xs font-semibold text-neutral-300 flex items-center justify-between">
          <span>Prompt Commun de Test</span>
          <span className="text-[10px] text-neutral-500 font-mono">0$ Total / Inférence locale</span>
        </label>
        <textarea
          id="input-compare-prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          placeholder="Entrez un prompt complexe pour comparer les réponses..."
          className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-3 text-xs text-neutral-200 focus:outline-none focus:border-blue-500 font-mono resize-y"
        />
      </div>

      {/* Two Column Side-by-Side Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
        {/* Model A Container */}
        <div className="flex flex-col bg-neutral-950 border border-neutral-800 rounded-2xl p-4 space-y-3 shadow-md">
          <div className="flex items-center justify-between border-b border-neutral-850 pb-2.5">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-lg bg-purple-600/20 text-purple-400 flex items-center justify-center font-bold text-xs">
                A
              </span>
              <select
                value={modelAId}
                onChange={(e) => setModelAId(e.target.value)}
                className="bg-neutral-900 border border-neutral-800 text-neutral-200 text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
              >
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.params})
                  </option>
                ))}
              </select>
            </div>

            {winner === modelAId ? (
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                ★ Gagnant choisi
              </span>
            ) : (
              <button
                onClick={() => setWinner(modelAId)}
                className="text-[10px] text-neutral-400 hover:text-emerald-400 flex items-center space-x-1"
                title="Voter pour ce modèle"
              >
                <ThumbsUp className="w-3 h-3" />
                <span>Préféré</span>
              </button>
            )}
          </div>

          {/* Model Output Canvas */}
          <div className="flex-1 min-h-[300px] bg-neutral-900/60 rounded-xl p-3.5 text-xs text-neutral-200 font-mono overflow-y-auto leading-relaxed border border-neutral-850">
            {results[modelAId]?.output ? (
              <pre className="whitespace-pre-wrap">{results[modelAId].output}</pre>
            ) : (
              <div className="h-full flex items-center justify-center text-neutral-600 text-xs">
                En attente du lancement...
              </div>
            )}
          </div>

          {/* Performance Card */}
          <div className="grid grid-cols-3 gap-2 text-[10px] text-neutral-400 pt-1">
            <div className="bg-neutral-900 p-2 rounded-lg border border-neutral-850 flex flex-col">
              <span className="text-neutral-500">Latence</span>
              <span className="font-mono text-neutral-200 font-semibold">
                {results[modelAId]?.latencyMs || 0} ms
              </span>
            </div>
            <div className="bg-neutral-900 p-2 rounded-lg border border-neutral-850 flex flex-col">
              <span className="text-neutral-500">Débit Vitesse</span>
              <span className="font-mono text-blue-400 font-semibold">
                {results[modelAId]?.tokensPerSec || 0} t/s
              </span>
            </div>
            <div className="bg-neutral-900 p-2 rounded-lg border border-neutral-850 flex flex-col">
              <span className="text-neutral-500">Coût API</span>
              <span className="font-mono text-emerald-400 font-bold">0.00 $</span>
            </div>
          </div>
        </div>

        {/* Model B Container */}
        <div className="flex flex-col bg-neutral-950 border border-neutral-800 rounded-2xl p-4 space-y-3 shadow-md">
          <div className="flex items-center justify-between border-b border-neutral-850 pb-2.5">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                B
              </span>
              <select
                value={modelBId}
                onChange={(e) => setModelBId(e.target.value)}
                className="bg-neutral-900 border border-neutral-800 text-neutral-200 text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
              >
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.params})
                  </option>
                ))}
              </select>
            </div>

            {winner === modelBId ? (
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                ★ Gagnant choisi
              </span>
            ) : (
              <button
                onClick={() => setWinner(modelBId)}
                className="text-[10px] text-neutral-400 hover:text-emerald-400 flex items-center space-x-1"
                title="Voter pour ce modèle"
              >
                <ThumbsUp className="w-3 h-3" />
                <span>Préféré</span>
              </button>
            )}
          </div>

          {/* Model Output Canvas */}
          <div className="flex-1 min-h-[300px] bg-neutral-900/60 rounded-xl p-3.5 text-xs text-neutral-200 font-mono overflow-y-auto leading-relaxed border border-neutral-850">
            {results[modelBId]?.output ? (
              <pre className="whitespace-pre-wrap">{results[modelBId].output}</pre>
            ) : (
              <div className="h-full flex items-center justify-center text-neutral-600 text-xs">
                En attente du lancement...
              </div>
            )}
          </div>

          {/* Performance Card */}
          <div className="grid grid-cols-3 gap-2 text-[10px] text-neutral-400 pt-1">
            <div className="bg-neutral-900 p-2 rounded-lg border border-neutral-850 flex flex-col">
              <span className="text-neutral-500">Latence</span>
              <span className="font-mono text-neutral-200 font-semibold">
                {results[modelBId]?.latencyMs || 0} ms
              </span>
            </div>
            <div className="bg-neutral-900 p-2 rounded-lg border border-neutral-850 flex flex-col">
              <span className="text-neutral-500">Débit Vitesse</span>
              <span className="font-mono text-blue-400 font-semibold">
                {results[modelBId]?.tokensPerSec || 0} t/s
              </span>
            </div>
            <div className="bg-neutral-900 p-2 rounded-lg border border-neutral-850 flex flex-col">
              <span className="text-neutral-500">Coût API</span>
              <span className="font-mono text-emerald-400 font-bold">0.00 $</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

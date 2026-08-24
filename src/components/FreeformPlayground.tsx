import React, { useState } from "react";
import { FreeformPrompt, ModelInfo, ModelParameters } from "../types";
import {
  Play,
  Square,
  Plus,
  Trash2,
  Copy,
  Check,
  Sparkles,
  FileCode,
  Layers,
  Zap,
  Clock,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";

interface FreeformPlaygroundProps {
  promptData: FreeformPrompt;
  onChangePromptData: (data: FreeformPrompt) => void;
  models: ModelInfo[];
  selectedModel: ModelInfo;
  isStreaming: boolean;
  onRunPrompt: () => void;
  onStopPrompt: () => void;
}

export const FreeformPlayground: React.FC<FreeformPlaygroundProps> = ({
  promptData,
  onChangePromptData,
  models,
  selectedModel,
  isStreaming,
  onRunPrompt,
  onStopPrompt,
}) => {
  const [copied, setCopied] = useState(false);

  const handleAddExample = () => {
    const newEx = {
      id: `ex-${Date.now()}`,
      input: "Exemple d'entrée...",
      output: "Exemple de sortie attendue...",
    };
    onChangePromptData({
      ...promptData,
      examples: [...promptData.examples, newEx],
    });
  };

  const handleUpdateExample = (id: string, field: "input" | "output", value: string) => {
    onChangePromptData({
      ...promptData,
      examples: promptData.examples.map((ex) =>
        ex.id === id ? { ...ex, [field]: value } : ex
      ),
    });
  };

  const handleDeleteExample = (id: string) => {
    onChangePromptData({
      ...promptData,
      examples: promptData.examples.filter((ex) => ex.id !== id),
    });
  };

  const copyOutput = () => {
    navigator.clipboard.writeText(promptData.output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="freeform-playground" className="flex-1 flex flex-col h-full bg-neutral-900/50 overflow-y-auto p-4 md:p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-neutral-800">
        <div>
          <h1 className="text-base font-bold text-neutral-100 flex items-center space-x-2">
            <Layers className="w-5 h-5 text-blue-400" />
            <span>Structured Prompt Playground (Google AI Studio)</span>
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Testez vos prompts Few-Shot, vos contraintes système et vos sorties JSON sans frais d'API.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {isStreaming ? (
            <button
              id="btn-stop-freeform"
              onClick={onStopPrompt}
              className="flex items-center space-x-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold px-4 py-2 rounded-xl text-xs shadow-md transition animate-pulse"
            >
              <Square className="w-3.5 h-3.5" />
              <span>Arrêter le Run</span>
            </button>
          ) : (
            <button
              id="btn-run-freeform"
              onClick={onRunPrompt}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-5 py-2 rounded-xl text-xs shadow-lg shadow-blue-600/20 transition"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Exécuter (Run)</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Prompt Definition & Few-Shot Examples */}
        <div className="space-y-5">
          {/* Prompt Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-300">Titre du Template</label>
            <input
              type="text"
              value={promptData.title}
              onChange={(e) => onChangePromptData({ ...promptData, title: e.target.value })}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-xs text-neutral-100 focus:outline-none focus:border-blue-500 font-medium"
            />
          </div>

          {/* Few-Shot Examples Builder */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-neutral-300 flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>Exemples Few-Shot ({promptData.examples.length})</span>
              </label>
              <button
                id="btn-add-few-shot-example"
                onClick={handleAddExample}
                className="flex items-center space-x-1 text-xs text-blue-400 hover:text-blue-300 font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter un exemple</span>
              </button>
            </div>

            {promptData.examples.map((ex, idx) => (
              <div
                key={ex.id}
                className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2 relative group"
              >
                <div className="flex items-center justify-between text-[11px] text-neutral-400 font-semibold">
                  <span>Exemple #{idx + 1}</span>
                  <button
                    onClick={() => handleDeleteExample(ex.id)}
                    className="text-neutral-500 hover:text-rose-400 transition"
                    title="Supprimer cet exemple"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-neutral-500 font-medium block">Entrée (Input) :</span>
                  <textarea
                    value={ex.input}
                    onChange={(e) => handleUpdateExample(ex.id, "input", e.target.value)}
                    rows={2}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-xs text-neutral-200 focus:outline-none focus:border-blue-500 font-mono resize-y"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-neutral-500 font-medium block">Sortie Attendue (Output) :</span>
                  <textarea
                    value={ex.output}
                    onChange={(e) => handleUpdateExample(ex.id, "output", e.target.value)}
                    rows={3}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-xs text-neutral-200 focus:outline-none focus:border-blue-500 font-mono resize-y"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* User Test Prompt */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-300 block">Prompt Utilisateur à Tester</label>
            <textarea
              id="input-freeform-user-prompt"
              value={promptData.userPrompt}
              onChange={(e) => onChangePromptData({ ...promptData, userPrompt: e.target.value })}
              rows={4}
              placeholder="Entrez vos données de test..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-neutral-200 focus:outline-none focus:border-blue-500 font-mono leading-relaxed resize-y"
            />
          </div>
        </div>

        {/* Right Column: Model Output & Evaluation */}
        <div className="space-y-4 flex flex-col">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-neutral-300">Sortie Générée du Modèle</span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                {selectedModel.name}
              </span>
            </div>

            <button
              onClick={copyOutput}
              disabled={!promptData.output}
              className="flex items-center space-x-1.5 text-xs text-neutral-400 hover:text-neutral-200 disabled:opacity-30 transition"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copié</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copier</span>
                </>
              )}
            </button>
          </div>

          {/* Output Display Canvas */}
          <div className="flex-1 min-h-[360px] bg-neutral-950 border border-neutral-800 rounded-xl p-4 font-mono text-xs text-neutral-200 overflow-y-auto leading-relaxed shadow-inner">
            {promptData.output ? (
              <pre className="whitespace-pre-wrap">{promptData.output}</pre>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-neutral-600 text-center space-y-2 py-16">
                <Play className="w-8 h-8 opacity-40" />
                <p>Cliquez sur "Exécuter (Run)" pour générer le résultat avec {selectedModel.name}.</p>
              </div>
            )}
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-3 gap-2 text-[11px] text-neutral-400">
            <div className="p-2 rounded-lg bg-neutral-950 border border-neutral-850 flex items-center justify-between">
              <span className="text-neutral-500">Coût estimé :</span>
              <span className="font-mono text-emerald-400 font-bold">0.00 $ (Gratuit)</span>
            </div>
            <div className="p-2 rounded-lg bg-neutral-950 border border-neutral-850 flex items-center justify-between">
              <span className="text-neutral-500">Mode Sortie :</span>
              <span className="font-mono text-purple-400">{promptData.parameters.responseFormat === "json" ? "JSON" : "Texte"}</span>
            </div>
            <div className="p-2 rounded-lg bg-neutral-950 border border-neutral-850 flex items-center justify-between">
              <span className="text-neutral-500">Format :</span>
              <span className="font-mono text-neutral-300">Few-Shot Structured</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

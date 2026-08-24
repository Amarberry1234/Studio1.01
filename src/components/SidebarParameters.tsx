import React, { useState } from "react";
import { ModelInfo, ModelParameters } from "../types";
import {
  Sliders,
  ChevronRight,
  ChevronLeft,
  Info,
  RefreshCw,
  FileCode,
  Sparkles,
  Zap,
  Cpu,
  Layers,
  Check,
} from "lucide-react";

interface SidebarParametersProps {
  parameters: ModelParameters;
  onChangeParameters: (params: ModelParameters) => void;
  systemInstruction: string;
  onChangeSystemInstruction: (instruction: string) => void;
  models: ModelInfo[];
  selectedModelId: string;
  onModelSelect: (modelId: string) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
}

export const SidebarParameters: React.FC<SidebarParametersProps> = ({
  parameters,
  onChangeParameters,
  systemInstruction,
  onChangeSystemInstruction,
  models,
  selectedModelId,
  onModelSelect,
  isOpen,
  onToggleOpen,
}) => {
  const [newStopSeq, setNewStopSeq] = useState("");
  const activeModel = models.find((m) => m.id === selectedModelId) || models[0];

  const handleParamChange = (field: keyof ModelParameters, value: any) => {
    onChangeParameters({
      ...parameters,
      [field]: value,
    });
  };

  const addStopSequence = () => {
    if (!newStopSeq.trim()) return;
    if (parameters.stopSequences.includes(newStopSeq.trim())) return;
    handleParamChange("stopSequences", [...parameters.stopSequences, newStopSeq.trim()]);
    setNewStopSeq("");
  };

  const removeStopSequence = (seq: string) => {
    handleParamChange(
      "stopSequences",
      parameters.stopSequences.filter((s) => s !== seq)
    );
  };

  if (!isOpen) {
    return (
      <button
        id="btn-open-params-drawer"
        onClick={onToggleOpen}
        className="fixed right-0 top-20 bg-neutral-900 hover:bg-neutral-800 border-l border-t border-b border-neutral-700 text-neutral-300 p-2 rounded-l-lg shadow-lg z-20 transition"
        title="Ouvrir les paramètres du modèle"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
    );
  }

  return (
    <aside
      id="sidebar-parameters"
      className="w-80 border-l border-neutral-800 bg-neutral-950 flex flex-col h-full overflow-y-auto shrink-0 select-none text-neutral-200 z-10 text-xs"
    >
      {/* Header */}
      <div className="p-3 border-b border-neutral-800 flex items-center justify-between sticky top-0 bg-neutral-950 z-10">
        <div className="flex items-center space-x-2 font-semibold text-neutral-200">
          <Sliders className="w-4 h-4 text-blue-400" />
          <span>Paramètres de Run</span>
        </div>
        <button
          id="btn-close-params-drawer"
          onClick={onToggleOpen}
          className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-6 flex-1">
        {/* Model Card Info */}
        <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-neutral-100 flex items-center space-x-1">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              <span>{activeModel?.name}</span>
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
              Gratuit
            </span>
          </div>
          <p className="text-[11px] text-neutral-400 leading-relaxed">
            {activeModel?.description}
          </p>
          <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px] text-neutral-400">
            <div className="bg-neutral-950 p-1.5 rounded border border-neutral-850">
              <span className="text-neutral-500 block">Taille :</span>
              <span className="font-mono text-neutral-200">{activeModel?.size}</span>
            </div>
            <div className="bg-neutral-950 p-1.5 rounded border border-neutral-850">
              <span className="text-neutral-500 block">VRAM Estimée :</span>
              <span className="font-mono text-neutral-200">{activeModel?.vramEstimate}</span>
            </div>
          </div>
        </div>

        {/* System Instructions */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-neutral-300 font-medium">
            <label className="flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Instructions Système</span>
            </label>
            <span className="text-[10px] text-neutral-500">System Prompt</span>
          </div>
          <textarea
            id="input-system-instruction"
            value={systemInstruction}
            onChange={(e) => onChangeSystemInstruction(e.target.value)}
            rows={4}
            placeholder="Ex : Tu es un ingénieur logiciel senior, réponds de façon concise et fournis du code TypeScript propre."
            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2.5 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-y font-mono leading-relaxed"
          />
        </div>

        {/* Temperature Slider */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-neutral-300">
            <label className="font-medium">Température</label>
            <span className="font-mono text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">
              {parameters.temperature}
            </span>
          </div>
          <input
            id="slider-temperature"
            type="range"
            min="0.0"
            max="2.0"
            step="0.05"
            value={parameters.temperature}
            onChange={(e) => handleParamChange("temperature", parseFloat(e.target.value))}
            className="w-full accent-blue-500 bg-neutral-800 h-1.5 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-neutral-500">
            <span>Précis (0.0)</span>
            <span>Équilibré (0.7)</span>
            <span>Créatif (2.0)</span>
          </div>
        </div>

        {/* Top P Slider */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-neutral-300">
            <label className="font-medium">Top P (Nucleus Sampling)</label>
            <span className="font-mono text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">
              {parameters.topP}
            </span>
          </div>
          <input
            id="slider-top-p"
            type="range"
            min="0.0"
            max="1.0"
            step="0.05"
            value={parameters.topP}
            onChange={(e) => handleParamChange("topP", parseFloat(e.target.value))}
            className="w-full accent-blue-500 bg-neutral-800 h-1.5 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Top K Slider */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-neutral-300">
            <label className="font-medium">Top K</label>
            <span className="font-mono text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">
              {parameters.topK}
            </span>
          </div>
          <input
            id="slider-top-k"
            type="range"
            min="1"
            max="100"
            step="1"
            value={parameters.topK}
            onChange={(e) => handleParamChange("topK", parseInt(e.target.value, 10))}
            className="w-full accent-blue-500 bg-neutral-800 h-1.5 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Max Output Tokens */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-neutral-300">
            <label className="font-medium">Max Output Tokens</label>
            <span className="font-mono text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">
              {parameters.maxOutputTokens}
            </span>
          </div>
          <input
            id="slider-max-tokens"
            type="range"
            min="128"
            max="16384"
            step="128"
            value={parameters.maxOutputTokens}
            onChange={(e) => handleParamChange("maxOutputTokens", parseInt(e.target.value, 10))}
            className="w-full accent-blue-500 bg-neutral-800 h-1.5 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Repeat Penalty */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-neutral-300">
            <label className="font-medium">Pénalité de Répétition</label>
            <span className="font-mono text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">
              {parameters.repeatPenalty}
            </span>
          </div>
          <input
            id="slider-repeat-penalty"
            type="range"
            min="1.0"
            max="2.0"
            step="0.05"
            value={parameters.repeatPenalty}
            onChange={(e) => handleParamChange("repeatPenalty", parseFloat(e.target.value))}
            className="w-full accent-blue-500 bg-neutral-800 h-1.5 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Structured Output / JSON Mode */}
        <div className="space-y-2 pt-2 border-t border-neutral-850">
          <div className="flex items-center justify-between">
            <label className="font-medium text-neutral-200 flex items-center space-x-1.5">
              <FileCode className="w-3.5 h-3.5 text-purple-400" />
              <span>Format de Sortie JSON</span>
            </label>
            <button
              id="btn-toggle-json-mode"
              onClick={() =>
                handleParamChange(
                  "responseFormat",
                  parameters.responseFormat === "json" ? "text" : "json"
                )
              }
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                parameters.responseFormat === "json"
                  ? "bg-purple-600 text-white font-bold"
                  : "bg-neutral-800 text-neutral-400 hover:text-neutral-200"
              }`}
            >
              {parameters.responseFormat === "json" ? "JSON Forcé" : "Texte Libre"}
            </button>
          </div>
          {parameters.responseFormat === "json" && (
            <div className="p-2.5 rounded-lg bg-purple-950/20 border border-purple-500/30 space-y-1.5 text-[11px]">
              <span className="text-purple-300 font-mono block">Schéma JSON Schema (Optionnel) :</span>
              <textarea
                value={parameters.jsonSchema || ""}
                onChange={(e) => handleParamChange("jsonSchema", e.target.value)}
                placeholder='{"type": "object", "properties": {"title": {"type": "string"}}}'
                rows={3}
                className="w-full bg-neutral-900 border border-neutral-800 rounded p-1.5 font-mono text-[10px] text-neutral-300 focus:outline-none focus:border-purple-500"
              />
            </div>
          )}
        </div>

        {/* Stop Sequences */}
        <div className="space-y-2 pt-2 border-t border-neutral-850">
          <label className="font-medium text-neutral-200 block">Séquences d'Arrêt (Stop)</label>
          <div className="flex space-x-1.5">
            <input
              id="input-stop-sequence"
              type="text"
              placeholder="Ex: <|end_of_text|>"
              value={newStopSeq}
              onChange={(e) => setNewStopSeq(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addStopSequence()}
              className="flex-1 bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-xs text-neutral-200 font-mono focus:outline-none focus:border-blue-500"
            />
            <button
              id="btn-add-stop-seq"
              onClick={addStopSequence}
              className="bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-2.5 py-1 rounded font-medium text-xs"
            >
              +
            </button>
          </div>
          <div className="flex flex-wrap gap-1">
            {parameters.stopSequences.map((seq) => (
              <span
                key={seq}
                className="bg-neutral-850 border border-neutral-700 text-neutral-300 px-2 py-0.5 rounded text-[10px] font-mono flex items-center space-x-1"
              >
                <span>{seq}</span>
                <button
                  onClick={() => removeStopSequence(seq)}
                  className="hover:text-rose-400 text-neutral-500 ml-1"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
};

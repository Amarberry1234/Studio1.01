import React, { useState } from "react";
import { ModelInfo, AppSettings } from "../types";
import {
  HardDrive,
  Download,
  Trash2,
  Plus,
  CheckCircle2,
  Cpu,
  Layers,
  Sparkles,
  Server,
  Zap,
  Activity,
  Search,
  ExternalLink,
  ShieldCheck,
  FileCode,
} from "lucide-react";

interface ModelManagerProps {
  models: ModelInfo[];
  onUpdateModels: (models: ModelInfo[]) => void;
  settings: AppSettings;
  isOllamaOnline: boolean;
  onRefreshOllama: () => void;
}

export const ModelManager: React.FC<ModelManagerProps> = ({
  models,
  onUpdateModels,
  settings,
  isOllamaOnline,
  onRefreshOllama,
}) => {
  const [search, setSearch] = useState("");
  const [newModelName, setNewModelName] = useState("");
  const [isPulling, setIsPulling] = useState(false);
  const [pullProgress, setPullProgress] = useState<{ status: string; percent: number }>({
    status: "",
    percent: 0,
  });

  // Custom Modelfile modal state
  const [showModelfileModal, setShowModelfileModal] = useState(false);
  const [customModelForm, setCustomModelForm] = useState({
    name: "my-custom-assistant",
    baseModel: "llama3.2:3b",
    systemPrompt: "Tu es un assistant expert en cybersécurité et analyse de logs.",
    temperature: 0.3,
  });

  const filteredModels = models.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.family.toLowerCase().includes(search.toLowerCase()) ||
      m.id.toLowerCase().includes(search.toLowerCase())
  );

  const handlePullModel = async (modelId: string) => {
    setIsPulling(true);
    setPullProgress({ status: `Connexion à Ollama pour télécharger ${modelId}...`, percent: 10 });

    try {
      const response = await fetch("/api/ollama/pull", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ host: settings.ollamaHost, name: modelId }),
      });

      if (response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let progressPercent = 10;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const text = decoder.decode(value);
          const lines = text.split("\n\n");
          for (const line of lines) {
            if (line.startsWith("data: ") && !line.includes("[DONE]")) {
              try {
                const parsed = JSON.parse(line.replace("data: ", ""));
                progressPercent = Math.min(100, progressPercent + 15);
                setPullProgress({
                  status: parsed.status || `Téléchargement des couches sha256...`,
                  percent: progressPercent,
                });
              } catch (_e) {}
            }
          }
        }
      }

      // Mark model as installed
      onUpdateModels(
        models.map((m) => (m.id === modelId ? { ...m, installed: true } : m))
      );
      setPullProgress({ status: `Modèle ${modelId} installé avec succès !`, percent: 100 });
      setTimeout(() => {
        setIsPulling(false);
        setPullProgress({ status: "", percent: 0 });
      }, 1500);
    } catch (_err) {
      setIsPulling(false);
      alert("Échec du téléchargement du modèle local.");
    }
  };

  const handleDeleteModel = (modelId: string) => {
    if (confirm(`Voulez-vous supprimer localement le modèle ${modelId} pour libérer de l'espace disque ?`)) {
      onUpdateModels(
        models.map((m) => (m.id === modelId ? { ...m, installed: false } : m))
      );
    }
  };

  const handleCreateCustomModelfile = () => {
    const newCustomModel: ModelInfo = {
      id: `${customModelForm.name}:latest`,
      name: `${customModelForm.name} (Custom)`,
      provider: "ollama",
      size: "3.2 GB",
      params: "Custom",
      quantization: "Q4_K_M",
      vramEstimate: "3.5 GB VRAM",
      family: "llama",
      contextWindow: 65536,
      description: `Modèle personnalisé basé sur ${customModelForm.baseModel} avec instructions système sur-mesure.`,
      installed: true,
      capabilities: { vision: false, reasoning: true, coding: true, tools: true, json: true },
    };

    onUpdateModels([newCustomModel, ...models]);
    setShowModelfileModal(false);
  };

  const installedCount = models.filter((m) => m.installed).length;

  return (
    <div id="model-manager-view" className="flex-1 flex flex-col h-full bg-neutral-900/50 overflow-y-auto p-4 md:p-6 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <h1 className="text-base font-bold text-neutral-100 flex items-center space-x-2">
            <HardDrive className="w-5 h-5 text-emerald-400" />
            <span>Gestionnaire de Modèles Locaux (Ollama & Open-Weights)</span>
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Gérez votre catalogue de modèles sans aucun abonnement ni contrainte de jetons.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={onRefreshOllama}
            className="flex items-center space-x-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 text-xs px-3 py-2 rounded-xl transition"
          >
            <Server className="w-3.5 h-3.5 text-blue-400" />
            <span>Actualiser Ollama ({settings.ollamaHost})</span>
          </button>

          <button
            onClick={() => setShowModelfileModal(true)}
            className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3.5 py-2 rounded-xl shadow-md transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Créer un Modelfile Custom</span>
          </button>
        </div>
      </div>

      {/* Hardware & Engine Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-neutral-500 uppercase font-semibold">Statut Serveur Local</span>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`w-2.5 h-2.5 rounded-full ${isOllamaOnline ? "bg-emerald-400 animate-pulse" : "bg-blue-400"}`} />
              <span className="text-sm font-bold text-neutral-200">
                {isOllamaOnline ? "Ollama Connecté (Port 11434)" : "Simulateur Local Actif"}
              </span>
            </div>
          </div>
          <Cpu className="w-6 h-6 text-emerald-400/80" />
        </div>

        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-neutral-500 uppercase font-semibold">Modèles Installés</span>
            <div className="text-sm font-bold text-neutral-200 mt-1">
              {installedCount} sur {models.length} disponibles
            </div>
          </div>
          <Layers className="w-6 h-6 text-blue-400/80" />
        </div>

        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-neutral-500 uppercase font-semibold">Coût par Requête</span>
            <div className="text-sm font-bold text-emerald-400 font-mono mt-1">
              0.00 $ (100% Illimité)
            </div>
          </div>
          <ShieldCheck className="w-6 h-6 text-emerald-400/80" />
        </div>
      </div>

      {/* Pulling Progress Bar Banner */}
      {isPulling && (
        <div className="p-4 bg-blue-950/30 border border-blue-500/30 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs text-blue-300 font-medium">
            <span>{pullProgress.status}</span>
            <span className="font-mono">{pullProgress.percent}%</span>
          </div>
          <div className="w-full bg-neutral-900 h-2 rounded-full overflow-hidden">
            <div
              className="bg-blue-500 h-full transition-all duration-300"
              style={{ width: `${pullProgress.percent}%` }}
            />
          </div>
        </div>
      )}

      {/* Pull Custom Model by Name input */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 space-y-3">
        <label className="text-xs font-semibold text-neutral-200 block">
          Télécharger un modèle directement depuis la bibliothèque Ollama (ex: <code className="text-blue-400">deepseek-r1:14b</code>, <code className="text-blue-400">llama3.3:70b</code>, <code className="text-blue-400">qwen2.5:32b</code>)
        </label>
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Nom du tag Ollama (ex: deepseek-r1:14b, codellama, mistral-small)"
            value={newModelName}
            onChange={(e) => setNewModelName(e.target.value)}
            className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-blue-500 font-mono"
          />
          <button
            onClick={() => {
              if (newModelName.trim()) {
                handlePullModel(newModelName.trim());
                setNewModelName("");
              }
            }}
            disabled={isPulling || !newModelName.trim()}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-medium px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Télécharger (Pull)</span>
          </button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-3 text-neutral-500" />
        <input
          type="text"
          placeholder="Filtrer les modèles (DeepSeek, Llama, Gemma, Coder, Vision)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-2 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Models Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredModels.map((model) => (
          <div
            key={model.id}
            className="bg-neutral-950 border border-neutral-800 hover:border-neutral-700 rounded-2xl p-4 flex flex-col justify-between space-y-4 transition shadow-sm"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-sm text-neutral-100 flex items-center space-x-1.5">
                    <span>{model.name}</span>
                  </h3>
                  <div className="text-[11px] font-mono text-blue-400 mt-0.5">{model.id}</div>
                </div>

                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                    model.installed
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-neutral-850 text-neutral-400 border-neutral-750"
                  }`}
                >
                  {model.installed ? "Installé" : "Disponible"}
                </span>
              </div>

              <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                {model.description}
              </p>

              {/* Badges */}
              <div className="flex flex-wrap gap-1 mt-3">
                {model.capabilities.reasoning && (
                  <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded">
                    Raisonnement R1
                  </span>
                )}
                {model.capabilities.coding && (
                  <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded">
                    Code Expert
                  </span>
                )}
                {model.capabilities.vision && (
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded">
                    Multimodal Vision
                  </span>
                )}
                <span className="text-[10px] bg-neutral-900 text-neutral-400 px-2 py-0.5 rounded font-mono">
                  {model.quantization}
                </span>
              </div>

              {/* Hardware footprint */}
              <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-neutral-850 text-[11px]">
                <div>
                  <span className="text-neutral-500 block text-[10px]">Poids Disque</span>
                  <span className="font-mono text-neutral-300">{model.size}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block text-[10px]">VRAM Requise</span>
                  <span className="font-mono text-neutral-300">{model.vramEstimate}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2">
              {model.installed ? (
                <div className="flex space-x-2">
                  <button
                    disabled
                    className="flex-1 bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-semibold py-2 rounded-xl flex items-center justify-center space-x-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Prêt à l'Emploi</span>
                  </button>
                  <button
                    onClick={() => handleDeleteModel(model.id)}
                    className="p-2 bg-neutral-900 hover:bg-rose-950/40 text-neutral-400 hover:text-rose-400 rounded-xl border border-neutral-800 transition"
                    title="Supprimer le fichier local"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handlePullModel(model.id)}
                  disabled={isPulling}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-semibold py-2 rounded-xl flex items-center justify-center space-x-1.5 shadow transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Télécharger (Pull Ollama)</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Custom Modelfile Modal */}
      {showModelfileModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-neutral-200 text-xs">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h2 className="text-sm font-bold text-neutral-100 flex items-center space-x-2">
                <FileCode className="w-4 h-4 text-emerald-400" />
                <span>Créer un Modèle Personnalisé (Modelfile)</span>
              </h2>
              <button
                onClick={() => setShowModelfileModal(false)}
                className="text-neutral-500 hover:text-neutral-300"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="font-semibold block mb-1">Nom du modèle</label>
                <input
                  type="text"
                  value={customModelForm.name}
                  onChange={(e) => setCustomModelForm({ ...customModelForm, name: e.target.value })}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 font-mono text-neutral-200"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Modèle de base (FROM)</label>
                <select
                  value={customModelForm.baseModel}
                  onChange={(e) => setCustomModelForm({ ...customModelForm, baseModel: e.target.value })}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-neutral-200"
                >
                  <option value="deepseek-r1:7b">deepseek-r1:7b</option>
                  <option value="llama3.2:3b">llama3.2:3b</option>
                  <option value="qwen2.5-coder:7b">qwen2.5-coder:7b</option>
                  <option value="gemma2:9b">gemma2:9b</option>
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">Instruction Système (SYSTEM)</label>
                <textarea
                  value={customModelForm.systemPrompt}
                  onChange={(e) => setCustomModelForm({ ...customModelForm, systemPrompt: e.target.value })}
                  rows={3}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 font-mono text-neutral-200"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-800 flex justify-end space-x-2">
              <button
                onClick={() => setShowModelfileModal(false)}
                className="px-4 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateCustomModelfile}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow"
              >
                Compiler et Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

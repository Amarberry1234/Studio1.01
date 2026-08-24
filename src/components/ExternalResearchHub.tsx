import React, { useState, useRef, useEffect } from "react";
import {
  ExternalConsultation,
  PromptEngineeringStrategy,
  GroundingSource,
  ProjectItem,
  ChatSession,
} from "../types";
import {
  Globe2,
  Sparkles,
  Send,
  Search,
  ExternalLink,
  Copy,
  Check,
  Brain,
  Zap,
  Code2,
  BarChart3,
  Compass,
  FileCheck,
  ArrowRight,
  Plus,
  RefreshCw,
  Clock,
  Layers,
  HelpCircle,
  FolderPlus,
  Kanban,
  FileDown,
  MessageSquare,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface ExternalResearchHubProps {
  onTransferToChat: (prompt: string, answer: string) => void;
  onAddProjectTask: (task: Omit<ProjectItem, "id" | "createdAt">) => void;
  activeSessionTitle?: string;
}

const STRATEGIES: {
  id: PromptEngineeringStrategy;
  label: string;
  shortDesc: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
}[] = [
  {
    id: "deep_research",
    label: "Deep Research & Synthèse d'Élite",
    shortDesc: "État de l'art, mécanismes approfondis, avantages/limites et cas pratiques",
    icon: Compass,
    accentColor: "from-blue-500 to-indigo-600",
  },
  {
    id: "expert_cot",
    label: "Raisonnement Socratique & CoT",
    shortDesc: "Décomposition en principes premiers, analyse des cas limites et déductions",
    icon: Brain,
    accentColor: "from-purple-500 to-pink-600",
  },
  {
    id: "benchmark_facts",
    label: "Benchmarks & Données Chiffrées",
    shortDesc: "Tableaux comparatifs, métriques réelles, coûts et performances vérifiées",
    icon: BarChart3,
    accentColor: "from-amber-500 to-orange-600",
  },
  {
    id: "code_architect",
    label: "Architecte Logiciel Production",
    shortDesc: "Code TypeScript/Rust 100% typé, zéro-défaut, O(n) et patterns résilients",
    icon: Code2,
    accentColor: "from-cyan-500 to-blue-600",
  },
  {
    id: "executive_roadmap",
    label: "Roadmap Stratégique Exécutive",
    shortDesc: "Briefing décisionnel, matrice SWOT, jalons 30/60/90j et actions immédiates",
    icon: FileCheck,
    accentColor: "from-emerald-500 to-teal-600",
  },
  {
    id: "auto_optimizer",
    label: "Meta-Prompting Auto-Optimisé",
    shortDesc: "Formulation chirurgicale autonome pour extraire le maximum d'intelligence",
    icon: Sparkles,
    accentColor: "from-violet-500 to-purple-600",
  },
];

const SUGGESTED_QUERIES = [
  "Quelles sont les meilleures pratiques 2025/2026 pour orchestrer un RAG local sans latence ?",
  "Comparatif technique : Llama 3.3 70B vs DeepSeek-R1 vs Qwen 2.5 Coder pour le développement",
  "Comment implémenter un chiffrement AES-GCM 256-bit avec dérivation PBKDF2 en TypeScript ?",
  "Quelles sont les techniques de prompt engineering qui augmentent le plus la précision d'un LLM ?",
];

export const ExternalResearchHub: React.FC<ExternalResearchHubProps> = ({
  onTransferToChat,
  onAddProjectTask,
  activeSessionTitle,
}) => {
  const [query, setQuery] = useState("");
  const [strategy, setStrategy] = useState<PromptEngineeringStrategy>("deep_research");
  const [depth, setDepth] = useState<"standard" | "deep" | "exhaustive">("deep");
  const [includeWebSearch, setIncludeWebSearch] = useState(true);
  const [customConstraints, setCustomConstraints] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [activeConsultation, setActiveConsultation] = useState<ExternalConsultation | null>(null);
  const [history, setHistory] = useState<ExternalConsultation[]>(() => {
    try {
      const saved = localStorage.getItem("local_ai_studio_ext_consultations");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [showPromptInspector, setShowPromptInspector] = useState(true);
  const [searchHistoryFilter, setSearchHistoryFilter] = useState("");

  const responseTopRef = useRef<HTMLDivElement>(null);

  // Save history
  useEffect(() => {
    try {
      localStorage.setItem("local_ai_studio_ext_consultations", JSON.stringify(history));
    } catch (_e) {}
  }, [history]);

  const handleConsult = async (targetQuery?: string) => {
    const q = (targetQuery || query).trim();
    if (!q || isLoading) return;

    setIsLoading(true);
    const startTime = performance.now();

    try {
      const res = await fetch("/api/external-ai/consult", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: q,
          strategy,
          depth,
          includeWebSearch,
          customInstructions: customConstraints,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const data: ExternalConsultation = await res.json();
      setActiveConsultation(data);
      setHistory((prev) => [data, ...prev.filter((item) => item.id !== data.id)].slice(0, 30));

      setTimeout(() => {
        responseTopRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err: any) {
      alert(`Erreur lors de la consultation externe : ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const copyText = (text: string, sectionKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionKey);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const activeStrategyObj = STRATEGIES.find((s) => s.id === strategy) || STRATEGIES[0];

  const filteredHistory = history.filter(
    (h) =>
      h.query.toLowerCase().includes(searchHistoryFilter.toLowerCase()) ||
      h.response.toLowerCase().includes(searchHistoryFilter.toLowerCase())
  );

  return (
    <div
      id="external-research-hub"
      className="flex-1 flex flex-col h-full bg-neutral-950 text-neutral-200 overflow-hidden select-none"
    >
      {/* Top Banner & Header */}
      <div className="border-b border-neutral-800 bg-neutral-900/90 px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <Globe2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-sm font-bold text-white tracking-tight">
                Intelligence Externe & Recherche Web
              </h1>
              <span className="text-[10px] bg-blue-500/20 text-blue-300 font-semibold px-2 py-0.5 rounded border border-blue-500/30 flex items-center space-x-1">
                <Sparkles className="w-3 h-3 text-blue-400" />
                <span>Moteur de Prompts d'Élite</span>
              </span>
            </div>
            <p className="text-[11px] text-neutral-400">
              Interrogez une IA externe avec des prompts perfectionnés pour obtenir le maximum
              d'informations et de données vérifiées.
            </p>
          </div>
        </div>

        {/* Quick info badges */}
        <div className="flex items-center space-x-2 text-xs">
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-neutral-800/80 border border-neutral-750 text-neutral-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px]">Validation Anti-Hallucination</span>
          </div>
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-medium">Google Search Grounding Actif</span>
          </div>
        </div>
      </div>

      {/* Main Container Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Control & Input Stage */}
        <div className="w-full lg:w-[480px] xl:w-[520px] border-r border-neutral-800/80 flex flex-col overflow-y-auto p-4 space-y-4 bg-neutral-925 shrink-0">
          {/* Query Formulation Input Box */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3.5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-neutral-300 flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>Votre Thématique ou Question</span>
              </label>
              <span className="text-[10px] text-neutral-500">Formulation naturelle acceptée</span>
            </div>

            <div className="relative">
              <textarea
                id="external-query-input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    handleConsult();
                  }
                }}
                rows={3}
                placeholder="Ex: Quelles sont les meilleures pratiques pour sécuriser et déployer un pipeline de modèles locaux en entreprise ?"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs md:text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-blue-500 transition resize-none leading-relaxed"
              />
            </div>

            {/* Quick Inspiration Queries */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                Suggestions & Sujets Clés :
              </div>
              <div className="space-y-1">
                {SUGGESTED_QUERIES.map((sq, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setQuery(sq);
                      handleConsult(sq);
                    }}
                    className="w-full text-left p-1.5 rounded-lg bg-neutral-850 hover:bg-neutral-800 text-[11px] text-neutral-300 hover:text-white transition truncate flex items-center space-x-1.5 border border-neutral-800/60"
                  >
                    <ArrowRight className="w-3 h-3 text-blue-400 shrink-0" />
                    <span className="truncate">{sq}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Strategy Selector (Architecte de Prompt) */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3.5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-neutral-300 flex items-center space-x-1.5">
                <Brain className="w-3.5 h-3.5 text-purple-400" />
                <span>Stratégie d'Ingénierie de Prompt</span>
              </label>
              <span className="text-[10px] text-purple-400 font-medium">Master Frameworks</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {STRATEGIES.map((s) => {
                const IconComponent = s.icon;
                const isSelected = strategy === s.id;

                return (
                  <button
                    key={s.id}
                    onClick={() => setStrategy(s.id)}
                    className={`p-2.5 rounded-xl text-left border transition relative flex flex-col justify-between ${
                      isSelected
                        ? "bg-neutral-850 border-blue-500 shadow-md shadow-blue-500/10 text-white"
                        : "bg-neutral-950 border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-neutral-200"
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      <div
                        className={`w-6 h-6 rounded-lg bg-gradient-to-tr ${s.accentColor} flex items-center justify-center text-white text-xs`}
                      >
                        <IconComponent className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-semibold leading-tight">{s.label}</span>
                    </div>
                    <p className="text-[10px] text-neutral-400 line-clamp-2 leading-relaxed">
                      {s.shortDesc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Depth & Search Options */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3.5 shadow-sm space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-neutral-300">Paramètres de Rigueur</span>
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-[11px] text-blue-400 hover:underline flex items-center space-x-1"
              >
                <span>{showAdvanced ? "Moins d'options" : "Contraintes personnalisées"}</span>
                {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>

            {/* Depth Selector */}
            <div>
              <div className="text-[11px] text-neutral-400 mb-1.5">Profondeur de la réponse :</div>
              <div className="grid grid-cols-3 gap-1.5">
                {(
                  [
                    { id: "standard", label: "Standard (Rapide)" },
                    { id: "deep", label: "Approfondie" },
                    { id: "exhaustive", label: "Exhaustive (Max)" },
                  ] as const
                ).map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setDepth(d.id)}
                    className={`py-1.5 px-2 rounded-lg font-medium text-[11px] border transition ${
                      depth === d.id
                        ? "bg-blue-600 text-white border-blue-500"
                        : "bg-neutral-950 text-neutral-400 border-neutral-800 hover:bg-neutral-850"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Web Grounding Toggle */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-neutral-950 border border-neutral-800">
              <div className="flex items-center space-x-2">
                <Globe2 className="w-4 h-4 text-emerald-400" />
                <div>
                  <div className="font-medium text-neutral-200 text-xs">
                    Google Search Grounding (Web Direct)
                  </div>
                  <div className="text-[10px] text-neutral-400">
                    Interroge le web en temps réel pour des faits 2025/2026
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={includeWebSearch}
                onChange={(e) => setIncludeWebSearch(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 bg-neutral-800 border-neutral-700 cursor-pointer"
              />
            </div>

            {/* Advanced Custom Instructions */}
            {showAdvanced && (
              <div className="space-y-1.5 pt-2 border-t border-neutral-800">
                <label className="text-[11px] text-neutral-400">
                  Directives ou contraintes spécifiques :
                </label>
                <input
                  type="text"
                  value={customConstraints}
                  onChange={(e) => setCustomConstraints(e.target.value)}
                  placeholder="Ex: Citer les benchmarks FP16, donner des exemples en TypeScript..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-blue-500"
                />
              </div>
            )}
          </div>

          {/* Action Trigger Button */}
          <button
            id="btn-execute-external-consult"
            onClick={() => handleConsult()}
            disabled={!query.trim() || isLoading}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-xs md:text-sm shadow-xl shadow-blue-500/20 disabled:opacity-50 transition flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Ingénierie du Prompt & Consultation en cours...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Optimiser le Prompt & Consulter l'IA Externe</span>
              </>
            )}
          </button>

          {/* History of Consultations */}
          {history.length > 0 && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-300 flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Historique des Recherches ({history.length})</span>
                </span>
                <input
                  type="text"
                  value={searchHistoryFilter}
                  onChange={(e) => setSearchHistoryFilter(e.target.value)}
                  placeholder="Filtrer..."
                  className="bg-neutral-950 border border-neutral-800 rounded px-2 py-0.5 text-[10px] text-neutral-300 w-24"
                />
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {filteredHistory.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveConsultation(item)}
                    className={`w-full text-left p-2 rounded-lg text-xs transition border flex items-center justify-between ${
                      activeConsultation?.id === item.id
                        ? "bg-blue-600/20 border-blue-500/40 text-blue-300"
                        : "bg-neutral-950 border-neutral-800/80 hover:bg-neutral-850 text-neutral-300"
                    }`}
                  >
                    <div className="truncate pr-2">
                      <div className="font-medium truncate">{item.query}</div>
                      <div className="text-[10px] text-neutral-500">
                        {item.strategy} • {item.groundingSources.length} sources
                      </div>
                    </div>
                    <span className="text-[10px] text-neutral-500 shrink-0 font-mono">
                      {new Date(item.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Response & Master Prompt Output Canvas */}
        <div className="flex-1 flex flex-col overflow-y-auto bg-neutral-950 p-4 md:p-6 space-y-5">
          <div ref={responseTopRef} />

          {!activeConsultation && !isLoading ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 max-w-xl mx-auto space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-2xl shadow-blue-500/20">
                <Globe2 className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">
                  Consultation IA Externe & Prompt Optimizer
                </h2>
                <p className="text-xs text-neutral-400 mt-1.5 leading-relaxed">
                  Renseignez-vous auprès d'une IA externe (comme ChatGPT ou Gemini) pour obtenir les
                  dernières informations et actualités du web. Le système applique automatiquement
                  les **meilleures formulations de prompts possibles** (rôles d'expert,
                  décompositions socratiques, contraintes anti-hallucinations et vérification de
                  sources) pour vous garantir des résultats de très haut niveau.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full pt-3 text-left">
                <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-xs">
                  <div className="font-semibold text-blue-400 flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Prompt Perfectionné</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-1">
                    Formulation automatique des directives les plus efficaces du marché.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-xs">
                  <div className="font-semibold text-emerald-400 flex items-center space-x-1.5">
                    <Globe2 className="w-3.5 h-3.5" />
                    <span>Sources & Grounding Web</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-1">
                    Faits vérifiés et liens réels indexés via Google Search.
                  </p>
                </div>
              </div>
            </div>
          ) : isLoading ? (
            <div className="h-full flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 animate-pulse">
                <RefreshCw className="w-6 h-6 animate-spin" />
              </div>
              <div className="text-center">
                <div className="text-sm font-bold text-white">
                  Ingénierie du Master Prompt en cours...
                </div>
                <div className="text-xs text-neutral-400 mt-1">
                  Application du framework « {activeStrategyObj.label} » & interrogation de l'IA
                  externe.
                </div>
              </div>
            </div>
          ) : activeConsultation ? (
            <div className="space-y-5 max-w-4xl mx-auto w-full">
              {/* Consultation Title & Metadata Bar */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                    {activeConsultation.strategy} • {activeConsultation.depth}
                  </span>
                  <h2 className="text-base font-bold text-white mt-1">
                    {activeConsultation.query}
                  </h2>
                </div>

                {/* Transfer / Export Buttons */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() =>
                      onTransferToChat(
                        `[Recherche IA Externe - ${activeConsultation.query}]\n\nSynthèse :\n${activeConsultation.response}`,
                        activeConsultation.response
                      )
                    }
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition"
                    title="Injecter ces informations dans votre session de chat local active"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Transférer au Chat Local</span>
                  </button>

                  <button
                    onClick={() =>
                      onAddProjectTask({
                        title: `Recherche : ${activeConsultation.query.slice(0, 40)}...`,
                        description: activeConsultation.response.slice(0, 300) + "...",
                        deadline: new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0],
                        status: "todo",
                        priority: "medium",
                        tags: ["Recherche Externe", "IA", activeConsultation.strategy],
                      })
                    }
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border border-neutral-700 text-xs font-medium transition"
                    title="Ajouter comme tâche dans le tableau Kanban de gestion de projet"
                  >
                    <Kanban className="w-3.5 h-3.5 text-purple-400" />
                    <span>Créer Tâche Projet</span>
                  </button>
                </div>
              </div>

              {/* Master Prompt Inspector (Shows the engineered prompt that produced this high-level answer) */}
              <div className="bg-neutral-900 border border-purple-500/30 rounded-2xl overflow-hidden shadow-md">
                <button
                  onClick={() => setShowPromptInspector(!showPromptInspector)}
                  className="w-full px-4 py-2.5 bg-purple-950/30 border-b border-purple-500/20 flex items-center justify-between text-left hover:bg-purple-950/40 transition"
                >
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-bold text-purple-200">
                      🪄 Master Prompt Ingénieré Utilisé pour cette Recherche
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] text-purple-400 bg-purple-500/20 px-2 py-0.5 rounded font-mono">
                      Formulation Optimale
                    </span>
                    {showPromptInspector ? (
                      <ChevronUp className="w-3.5 h-3.5 text-purple-400" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-purple-400" />
                    )}
                  </div>
                </button>

                {showPromptInspector && (
                  <div className="p-4 bg-neutral-950/90 text-neutral-300 text-xs font-mono leading-relaxed space-y-3">
                    <div className="flex items-center justify-between text-[11px] text-neutral-400 pb-2 border-b border-neutral-850">
                      <span>Directives d'excellence injectées à l'IA externe :</span>
                      <button
                        onClick={() => copyText(activeConsultation.engineeredPrompt, "master_prompt")}
                        className="flex items-center space-x-1 text-purple-300 hover:text-white px-2 py-0.5 rounded bg-purple-900/40 transition"
                      >
                        {copiedSection === "master_prompt" ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copié</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copier le Master Prompt</span>
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="whitespace-pre-wrap font-mono text-[11px] text-purple-200/90 max-h-60 overflow-y-auto">
                      {activeConsultation.engineeredPrompt}
                    </pre>
                  </div>
                )}
              </div>

              {/* Main In-Depth Response Body */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                  <div className="flex items-center space-x-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-bold text-white">
                      Synthèse d'Expertise & Données Recueillies
                    </span>
                  </div>

                  <button
                    onClick={() => copyText(activeConsultation.response, "main_response")}
                    className="flex items-center space-x-1 text-neutral-400 hover:text-white text-xs px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-750 transition"
                  >
                    {copiedSection === "main_response" ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copié</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copier la Réponse</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Formatted Content */}
                <div className="text-xs md:text-sm text-neutral-200 leading-relaxed whitespace-pre-wrap font-sans space-y-3">
                  {activeConsultation.response}
                </div>

                {/* Grounding Sources & Web Citations */}
                {activeConsultation.groundingSources &&
                  activeConsultation.groundingSources.length > 0 && (
                    <div className="pt-4 border-t border-neutral-800 space-y-2">
                      <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-400">
                        <Globe2 className="w-3.5 h-3.5" />
                        <span>
                          Sources & Références Indexées (Google Search Grounding) :
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {activeConsultation.groundingSources.map((source, idx) => (
                          <a
                            key={idx}
                            href={source.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2.5 rounded-xl bg-neutral-950 hover:bg-neutral-850 border border-neutral-800 hover:border-emerald-500/40 text-neutral-300 transition flex items-start justify-between group"
                          >
                            <div className="truncate pr-2">
                              <div className="text-xs font-medium text-emerald-300 group-hover:underline truncate">
                                {source.title}
                              </div>
                              <div className="text-[10px] text-neutral-500 truncate mt-0.5">
                                {source.uri}
                              </div>
                            </div>
                            <ExternalLink className="w-3.5 h-3.5 text-neutral-500 group-hover:text-emerald-400 shrink-0 mt-0.5" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Suggested Follow-Ups */}
                {activeConsultation.suggestedFollowUps &&
                  activeConsultation.suggestedFollowUps.length > 0 && (
                    <div className="pt-4 border-t border-neutral-800 space-y-2">
                      <div className="text-xs font-bold text-neutral-300 flex items-center space-x-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                        <span>Questions de Relance Suggérées pour Approfondir :</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {activeConsultation.suggestedFollowUps.map((fu, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setQuery(fu);
                              handleConsult(fu);
                            }}
                            className="text-left text-xs p-2 rounded-xl bg-neutral-950 hover:bg-blue-600/20 border border-neutral-800 hover:border-blue-500/40 text-neutral-300 hover:text-blue-200 transition flex items-center space-x-1.5"
                          >
                            <ArrowRight className="w-3 h-3 text-blue-400 shrink-0" />
                            <span>{fu}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

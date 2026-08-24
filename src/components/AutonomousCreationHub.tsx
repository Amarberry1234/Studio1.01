import React, { useState, useEffect } from "react";
import {
  Sparkles,
  TrendingUp,
  Search,
  Zap,
  DollarSign,
  Copy,
  Check,
  Download,
  Play,
  Pause,
  FolderPlus,
  RefreshCw,
  Code2,
  Share2,
  Award,
  Layers,
  ArrowRight,
  Filter,
} from "lucide-react";
import { MarketOpportunity, ProjectItem } from "../types";

interface AutonomousCreationHubProps {
  onAddProjectTask?: (taskData: Omit<ProjectItem, "id" | "createdAt">) => void;
  onTransferToChat?: (prompt: string, answer: string) => void;
}

export const AutonomousCreationHub: React.FC<AutonomousCreationHubProps> = ({
  onAddProjectTask,
  onTransferToChat,
}) => {
  const [opportunities, setOpportunities] = useState<MarketOpportunity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOpp, setSelectedOpp] = useState<MarketOpportunity | null>(null);
  const [selectedNiche, setSelectedNiche] = useState<string>("all");
  const [customDemandQuery, setCustomDemandQuery] = useState("");
  const [isAutoPulseActive, setIsAutoPulseActive] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [autoTimerSeconds, setAutoTimerSeconds] = useState(15);

  const fetchOpportunities = async (customFocus = "") => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/autonomous/discover-opportunities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          niche: selectedNiche,
          customFocus: customFocus || customDemandQuery,
        }),
      });
      const data = await res.json();
      if (data.opportunities) {
        setOpportunities(data.opportunities);
        if (!selectedOpp && data.opportunities.length > 0) {
          setSelectedOpp(data.opportunities[0]);
        }
      }
    } catch (err) {
      console.error("Erreur lors de la récupération des opportunités:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunities();
  }, [selectedNiche]);

  // Auto Pulse Loop
  useEffect(() => {
    let interval: any = null;
    if (isAutoPulseActive) {
      interval = setInterval(() => {
        setAutoTimerSeconds((prev) => {
          if (prev <= 1) {
            fetchOpportunities();
            return 15;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setAutoTimerSeconds(15);
    }
    return () => clearInterval(interval);
  }, [isAutoPulseActive]);

  const handleCopyCode = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateKanbanTask = (opp: MarketOpportunity) => {
    if (onAddProjectTask) {
      onAddProjectTask({
        title: `Lancement: ${opp.proposedProductTitle}`,
        description: `${opp.valueProposition}\n\nPrix conseillé: $${opp.targetPriceUsd}\nNiche: ${opp.niche}\nVolume: ${opp.searchVolumeEstimate}`,
        deadline: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
        status: "in_progress",
        priority: opp.trendStatus === "exploding" ? "urgent" : "high",
        tags: opp.tags,
      });
      alert(`✅ Tâche de projet créée avec succès pour "${opp.proposedProductTitle}" !`);
    }
  };

  const handleDownloadSpec = (opp: MarketOpportunity) => {
    const fullContent = `# OFFRE COMMERCIALE CLÉ EN MAIN
Titre : ${opp.proposedProductTitle}
Niche : ${opp.niche}
Volume Estimé : ${opp.searchVolumeEstimate}
Statut : ${opp.trendStatus.toUpperCase()}
Prix Cible : $${opp.targetPriceUsd} USD

## PROBLÈME UTILISATEUR RÉSOLU
${opp.userPainPoint}

## PROPOSITION DE VALEUR
${opp.valueProposition}

## ACCROCHE COMMERCIALE
${opp.salesPitchHeadline}

## TEXTE DE VENTE & MARKETING COPY
${opp.marketingCopy}

## LIVRABLE TECHNIQUE / CODE / SPEC
\`\`\`
${opp.fullDeliverableCodeOrSpec}
\`\`\`

Généré en mode 100% libre de droit par Nova Local Core.
`;

    const blob = new Blob([fullContent], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `offre-${opp.proposedProductTitle.toLowerCase().replace(/[^a-z0-9]/g, "-")}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredOpps =
    selectedNiche === "all"
      ? opportunities
      : opportunities.filter((o) => o.niche === selectedNiche);

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-950 text-neutral-100 overflow-hidden">
      {/* Header Bar */}
      <div className="border-b border-neutral-800 bg-neutral-900/80 backdrop-blur-md px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <TrendingUp className="w-5 h-5 text-neutral-950 font-bold" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold text-white tracking-tight">
                Générateur Autonome d'Offres & Détection de Demande
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                100% AUTONOME
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              Scanne automatiquement les recherches web et conçoit des produits, codes et offres prêtes à vendre
            </p>
          </div>
        </div>

        {/* Auto-Pulse Trigger */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsAutoPulseActive(!isAutoPulseActive)}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition shadow-sm ${
              isAutoPulseActive
                ? "bg-amber-500/20 border-amber-500/50 text-amber-300 animate-pulse"
                : "bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-300"
            }`}
          >
            {isAutoPulseActive ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Mode Auto Actif ({autoTimerSeconds}s)</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-amber-400" />
                <span>Activer Création Autonome Continue</span>
              </>
            )}
          </button>

          <button
            onClick={() => fetchOpportunities()}
            disabled={isLoading}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Actualiser</span>
          </button>
        </div>
      </div>

      {/* Main Content Split Grid */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Side: Trends & Demand Feed */}
        <div className="w-full md:w-5/12 border-r border-neutral-800 flex flex-col h-full bg-neutral-900/30">
          {/* Search & Niche Filter */}
          <div className="p-4 border-b border-neutral-800 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Explorer un secteur spécifique (ex: T-shirt streetwear, SaaS local, jeu retro)..."
                value={customDemandQuery}
                onChange={(e) => setCustomDemandQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchOpportunities()}
                className="w-full pl-9 pr-20 py-2 bg-neutral-900 border border-neutral-800 focus:border-amber-500 rounded-xl text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none transition"
              />
              <button
                onClick={() => fetchOpportunities()}
                className="absolute right-1.5 top-1.5 px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-lg text-[10px] font-medium transition"
              >
                Générer
              </button>
            </div>

            {/* Niche Pills */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-none">
              {[
                { id: "all", label: "Toutes Demandes" },
                { id: "saas_tool", label: "💻 Micro-SaaS" },
                { id: "tshirt_merch", label: "👕 T-Shirts & Merch" },
                { id: "game_template", label: "🎮 Jeux Vidéo" },
                { id: "ai_prompt_pack", label: "🪄 Packs Prompts" },
              ].map((n) => (
                <button
                  key={n.id}
                  onClick={() => setSelectedNiche(n.id)}
                  className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition font-medium ${
                    selectedNiche === n.id
                      ? "bg-amber-500 text-neutral-950 font-bold"
                      : "bg-neutral-800 text-neutral-400 hover:text-neutral-200"
                  }`}
                >
                  {n.label}
                </button>
              ))}
            </div>
          </div>

          {/* Opportunities Cards List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {isLoading && opportunities.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-neutral-500 space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
                <span className="text-xs">Détection des opportunités en direct...</span>
              </div>
            ) : filteredOpps.length === 0 ? (
              <div className="text-center py-12 text-neutral-500 text-xs">
                Aucune opportunité trouvée pour ce critère.
              </div>
            ) : (
              filteredOpps.map((opp) => {
                const isSelected = selectedOpp?.id === opp.id;
                return (
                  <div
                    key={opp.id}
                    onClick={() => setSelectedOpp(opp)}
                    className={`p-3.5 rounded-2xl border transition cursor-pointer text-left ${
                      isSelected
                        ? "bg-amber-500/10 border-amber-500/50 shadow-md shadow-amber-500/5"
                        : "bg-neutral-900/60 border-neutral-800/80 hover:border-neutral-700 hover:bg-neutral-900"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${
                          opp.trendStatus === "exploding"
                            ? "bg-red-500/20 text-red-300 border border-red-500/30"
                            : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        }`}
                      >
                        {opp.trendStatus === "exploding" ? "🔥 Forte Explosion" : "📈 Forte Demande"}
                      </span>
                      <span className="text-[11px] font-bold text-amber-400">
                        ${opp.targetPriceUsd} USD
                      </span>
                    </div>

                    <h3 className="text-sm font-semibold text-neutral-100 line-clamp-1 mb-1">
                      {opp.proposedProductTitle}
                    </h3>
                    <p className="text-xs text-neutral-400 line-clamp-2 mb-2.5">
                      {opp.valueProposition}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-2 border-t border-neutral-800/60">
                      <span>{opp.searchVolumeEstimate}</span>
                      <div className="flex items-center space-x-1 text-amber-400/90 font-medium">
                        <span>Voir l'offre complète</span>
                        <ArrowRight className="w-3 h-3" />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Turnkey Deliverable Showcase */}
        <div className="w-full md:w-7/12 flex flex-col h-full bg-neutral-950 overflow-y-auto">
          {selectedOpp ? (
            <div className="p-6 space-y-6">
              {/* Product Header */}
              <div className="bg-gradient-to-b from-neutral-900 to-neutral-900/50 border border-neutral-800 rounded-2xl p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Niche : {selectedOpp.niche.replace("_", " ").toUpperCase()}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Prix Recommandé : ${selectedOpp.targetPriceUsd}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleDownloadSpec(selectedOpp)}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 text-xs font-medium transition"
                      title="Télécharger l'offre en Markdown"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Exporter Offre</span>
                    </button>

                    <button
                      onClick={() => handleCreateKanbanTask(selectedOpp)}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition shadow-md shadow-amber-500/20"
                    >
                      <FolderPlus className="w-3.5 h-3.5" />
                      <span>Ajouter au Projet</span>
                    </button>
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-bold text-white mb-1">
                    {selectedOpp.proposedProductTitle}
                  </h2>
                  <p className="text-sm text-neutral-300">
                    {selectedOpp.salesPitchHeadline}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                  <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800">
                    <span className="text-neutral-500 block mb-1">Problème résolu</span>
                    <p className="text-neutral-300">{selectedOpp.userPainPoint}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800">
                    <span className="text-neutral-500 block mb-1">Volume de recherche</span>
                    <p className="text-neutral-300 font-medium">{selectedOpp.searchVolumeEstimate}</p>
                  </div>
                </div>
              </div>

              {/* Marketing Copy Section */}
              <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Award className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-bold text-neutral-200">
                      Texte de Vente & Script Commercial (Prêt à l'Emploi)
                    </h3>
                  </div>
                  <button
                    onClick={() => handleCopyCode(selectedOpp.marketingCopy, "copy-marketing")}
                    className="flex items-center space-x-1 text-xs text-neutral-400 hover:text-white transition"
                  >
                    {copiedId === "copy-marketing" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedId === "copy-marketing" ? "Copié !" : "Copier"}</span>
                  </button>
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed bg-neutral-950 p-3.5 rounded-xl border border-neutral-800/80 font-mono">
                  {selectedOpp.marketingCopy}
                </p>
              </div>

              {/* Functional Deliverable / Code Spec */}
              <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Code2 className="w-4 h-4 text-blue-400" />
                    <h3 className="text-sm font-bold text-neutral-200">
                      Livrable Technique / Code Source / Spécification
                    </h3>
                  </div>
                  <button
                    onClick={() =>
                      handleCopyCode(selectedOpp.fullDeliverableCodeOrSpec, "copy-code")
                    }
                    className="flex items-center space-x-1 text-xs text-neutral-400 hover:text-white transition"
                  >
                    {copiedId === "copy-code" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedId === "copy-code" ? "Code Copié !" : "Copier le Code"}</span>
                  </button>
                </div>

                <pre className="text-xs text-amber-200/90 font-mono bg-neutral-950 p-4 rounded-xl border border-neutral-800 overflow-x-auto max-h-72">
                  {selectedOpp.fullDeliverableCodeOrSpec}
                </pre>
              </div>

              {/* Tags and Royalty-Free Guarantee */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-neutral-500">
                <div className="flex items-center space-x-1.5 flex-wrap gap-1">
                  {selectedOpp.tags.map((t, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-neutral-900 border border-neutral-800 rounded-md text-[11px] text-neutral-400"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
                <span className="text-[11px] text-emerald-400 font-medium">
                  🛡️ 100% Libre de Droit & Prêt pour Commercialisation
                </span>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-neutral-500 space-y-2 p-8">
              <Layers className="w-12 h-12 text-neutral-700" />
              <p className="text-sm">Sélectionnez une opportunité pour voir l'offre complète</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

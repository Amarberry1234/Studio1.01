import React, { useState, useEffect } from "react";
import {
  Users,
  Bot,
  Sparkles,
  ShieldCheck,
  Code2,
  Terminal,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Copy,
  Check,
  Layers,
  FileCode,
  Sliders,
  Play,
  RotateCcw,
  Zap,
  Lock,
  Search,
  MessageSquare,
  HelpCircle,
  FolderPlus,
  Send,
  Workflow,
  Sparkle,
  SlidersHorizontal,
  Package,
  Lightbulb,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Percent,
  Power,
  Cpu,
  Activity,
  Filter,
  CheckSquare,
  Square,
  ChevronRight,
  Flame,
  LayoutGrid,
  Calculator,
  Compass,
  Download,
} from "lucide-react";
import confetti from "canvas-confetti";
import {
  AgentProfile,
  CoWorkSession,
  CoWorkStep,
  CodeGuardrailRule,
  SquadPreset,
  ProfitCalculationResult,
} from "../types";

import { BusinessEcomAgentsStudio } from "./BusinessEcomAgentsStudio";
import { ProgramDownloaderModal } from "./ProgramDownloaderModal";

export const AgentsCoWorkStudio: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    "hub_overview" | "business_ecom" | "workspace" | "margin_calc" | "reformulator" | "guardrails" | "team"
  >("hub_overview");
  const [agents, setAgents] = useState<AgentProfile[]>([]);
  const [rules, setRules] = useState<CodeGuardrailRule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPreset, setCurrentPreset] = useState<SquadPreset>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showDownloaderModal, setShowDownloaderModal] = useState(false);

  // CoWork Pipeline State
  const [userPrompt, setUserPrompt] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [activeSession, setActiveSession] = useState<CoWorkSession | null>(null);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  // Quick Prompt Reformulator State
  const [rawPromptInput, setRawPromptInput] = useState("");
  const [isRephrasing, setIsRephrasing] = useState(false);
  const [reformulationResult, setReformulationResult] = useState<{
    originalPrompt: string;
    clarityScore: number;
    ambiguityScore: number;
    detectedGoal: string;
    rephrasedOptions: string[];
    clarificationQuestions: string[];
    recommendedStrategy: string;
  } | null>(null);

  // Interactive Live Margin Calculator State
  const [calcCost, setCalcCost] = useState<number>(6.5);
  const [calcPrice, setCalcPrice] = useState<number>(34.99);
  const [calcShipping, setCalcShipping] = useState<number>(0);
  const [calcCpa, setCalcCpa] = useState<number>(9.5);
  const [calcFeePercent, setCalcFeePercent] = useState<number>(3.0);
  const [calcResult, setCalcResult] = useState<ProfitCalculationResult | null>(null);
  const [isLoadingCalc, setIsLoadingCalc] = useState(false);

  // Fetch initial data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [resAgents, resRules] = await Promise.all([
        fetch("/api/agents/profiles"),
        fetch("/api/agents/rules"),
      ]);
      const dataAgents = await resAgents.json();
      const dataRules = await resRules.json();

      if (dataAgents.agents) setAgents(dataAgents.agents);
      if (dataRules.rules) setRules(dataRules.rules);
    } catch (err) {
      console.error("Erreur chargement agents:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    runLiveCalculation(calcCost, calcPrice, calcShipping, calcCpa, calcFeePercent);
  }, []);

  // Toggle individual agent
  const handleToggleAgent = async (agentId: string, currentStatus: boolean) => {
    try {
      const res = await fetch("/api/agents/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId, isActive: !currentStatus }),
      });
      const data = await res.json();
      if (data.success && data.agents) {
        setAgents(data.agents);
      }
    } catch (err) {
      console.error("Erreur toggle agent:", err);
    }
  };

  // Apply preset squad
  const handleApplyPreset = async (preset: SquadPreset) => {
    setCurrentPreset(preset);
    try {
      const res = await fetch("/api/agents/preset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preset }),
      });
      const data = await res.json();
      if (data.success && data.agents) {
        setAgents(data.agents);
        confetti({
          particleCount: 50,
          spread: 50,
          origin: { y: 0.6 },
          colors: ["#3B82F6", "#10B981", "#F59E0B"],
        });
      }
    } catch (err) {
      console.error("Erreur preset:", err);
    }
  };

  // Run Live Calculator
  const runLiveCalculation = async (
    cost: number,
    price: number,
    shipping: number,
    cpa: number,
    fee: number
  ) => {
    setIsLoadingCalc(true);
    try {
      const res = await fetch("/api/agents/calculator/margin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          costOfGoods: cost,
          sellingPrice: price,
          shippingCost: shipping,
          adCostPerAcquisition: cpa,
          platformFeePercent: fee,
        }),
      });
      const data = await res.json();
      if (data.success && data.calculation) {
        setCalcResult(data.calculation);
      }
    } catch (err) {
      console.error("Erreur calcul marge:", err);
    } finally {
      setIsLoadingCalc(false);
    }
  };

  // Run Prompt Reformulation
  const handleRephrase = async (textToRephrase?: string) => {
    const text = textToRephrase || rawPromptInput;
    if (!text.trim()) return;

    setIsRephrasing(true);
    try {
      const res = await fetch("/api/agents/rephrase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawPrompt: text }),
      });
      const data = await res.json();
      if (data.success && data.spec) {
        setReformulationResult(data.spec);
      }
    } catch (err) {
      console.error("Erreur reformulation:", err);
    } finally {
      setIsRephrasing(false);
    }
  };

  // Run Multi-Agent CoWork Pipeline
  const handleRunCoWork = async (customPrompt?: string) => {
    const promptToUse = customPrompt || userPrompt;
    if (!promptToUse.trim()) return;

    setIsExecuting(true);
    setCurrentStepIndex(0);
    setActiveSession(null);

    try {
      const res = await fetch("/api/agents/cowork/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userPrompt: promptToUse }),
      });

      const data = await res.json();

      if (data.success && data.steps) {
        const session: CoWorkSession = {
          id: data.sessionId,
          userRawPrompt: promptToUse,
          title: data.title,
          clarifiedSpecification: data.steps[0]?.summary || "",
          createdAt: new Date().toISOString(),
          status: "completed",
          steps: data.steps,
          finalDeliverable: data.finalDeliverable,
        };

        let step = 0;
        const interval = setInterval(() => {
          step++;
          if (step <= data.steps.length) {
            setCurrentStepIndex(step);
          } else {
            clearInterval(interval);
            setActiveSession(session);
            setIsExecuting(false);

            confetti({
              particleCount: 80,
              spread: 70,
              origin: { y: 0.6 },
              colors: ["#3B82F6", "#10B981", "#F59E0B", "#8B5CF6"],
            });
          }
        }, 500);
      }
    } catch (err) {
      console.error("Erreur exécution CoWork:", err);
      setIsExecuting(false);
    }
  };

  // Toggle Rule
  const handleToggleRule = async (ruleId: string, currentStatus: boolean) => {
    try {
      const res = await fetch("/api/agents/rules/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ruleId, enabled: !currentStatus }),
      });
      const data = await res.json();
      if (data.success && data.rules) {
        setRules(data.rules);
      }
    } catch (err) {
      console.error("Erreur toggle règle:", err);
    }
  };

  // Copy Code Helper
  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2500);
  };

  const getAgentTheme = (role: string) => {
    switch (role) {
      case "reformulator":
        return {
          bg: "bg-amber-500/10",
          border: "border-amber-500/30",
          text: "text-amber-400",
          badge: "bg-amber-500/20 text-amber-300 border-amber-500/40",
          icon: "🎯",
        };
      case "architect":
        return {
          bg: "bg-blue-500/10",
          border: "border-blue-500/30",
          text: "text-blue-400",
          badge: "bg-blue-500/20 text-blue-300 border-blue-500/40",
          icon: "🏛️",
        };
      case "coder":
        return {
          bg: "bg-emerald-500/10",
          border: "border-emerald-500/30",
          text: "text-emerald-400",
          badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
          icon: "⚡",
        };
      case "sentinel":
        return {
          bg: "bg-purple-500/10",
          border: "border-purple-500/30",
          text: "text-purple-400",
          badge: "bg-purple-500/20 text-purple-300 border-purple-500/40",
          icon: "🛡️",
        };
      case "creative_ideator":
        return {
          bg: "bg-amber-500/10",
          border: "border-amber-500/30",
          text: "text-amber-400",
          badge: "bg-amber-500/20 text-amber-300 border-amber-500/40",
          icon: "💡",
        };
      case "dropshipping_scout":
        return {
          bg: "bg-indigo-500/10",
          border: "border-indigo-500/30",
          text: "text-indigo-400",
          badge: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40",
          icon: "📦",
        };
      case "marketplace_arb":
        return {
          bg: "bg-cyan-500/10",
          border: "border-cyan-500/30",
          text: "text-cyan-400",
          badge: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
          icon: "🛒",
        };
      case "pricing_deal_hunter":
        return {
          bg: "bg-emerald-500/10",
          border: "border-emerald-500/30",
          text: "text-emerald-400",
          badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
          icon: "📈",
        };
      case "promo_marketer":
        return {
          bg: "bg-rose-500/10",
          border: "border-rose-500/30",
          text: "text-rose-400",
          badge: "bg-rose-500/20 text-rose-300 border-rose-500/40",
          icon: "🚀",
        };
      default:
        return {
          bg: "bg-neutral-800/40",
          border: "border-neutral-700",
          text: "text-neutral-300",
          badge: "bg-neutral-800 text-neutral-300 border-neutral-700",
          icon: "🤖",
        };
    }
  };

  const activeCount = agents.filter((a) => a.isActive).length;
  const powerPercentage = agents.length > 0 ? Math.round((activeCount / agents.length) * 100) : 100;

  // Filtered agents list for search
  const filteredAgents = agents.filter((ag) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      ag.name.toLowerCase().includes(q) ||
      ag.description.toLowerCase().includes(q) ||
      ag.badge.toLowerCase().includes(q) ||
      ag.role.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-950 text-neutral-100 overflow-y-auto">
      {/* ======================================================================
          TOP COMMAND CENTER BAR & SWARM POWER MONITOR
      ====================================================================== */}
      <div className="border-b border-neutral-800 bg-neutral-900/90 backdrop-blur-md px-6 py-4 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-amber-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
              <Users className="w-5 h-5 text-white font-bold" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold text-white tracking-tight">
                  Hub de Commandement & Agents IA CoWork
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  SWARM MULTI-RÔLE & E-COMMERCE
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Supervisez vos 9 Agents IA en direct. Activez ou désactivez n'importe quel agent pour moduler la puissance et éviter tout goulot d'étranglement.
              </p>
            </div>
          </div>

          {/* Real-Time Power & Swarm Throttle Widget */}
          <div className="flex flex-wrap items-center gap-3 bg-neutral-950/80 p-2.5 rounded-2xl border border-neutral-800 shadow-inner">
            <div className="flex items-center space-x-2.5 px-2">
              <div className="relative flex items-center justify-center">
                <Cpu className={`w-5 h-5 ${powerPercentage >= 80 ? "text-emerald-400" : powerPercentage >= 40 ? "text-amber-400" : "text-blue-400"}`} />
              </div>
              <div>
                <div className="text-[10px] text-neutral-400 uppercase font-semibold tracking-wider flex items-center space-x-1">
                  <span>Puissance Swarm</span>
                  <span className="font-bold text-white">({activeCount}/{agents.length} Actifs)</span>
                </div>
                <div className="flex items-center space-x-2 mt-0.5">
                  <div className="w-24 h-2 bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        powerPercentage >= 80
                          ? "bg-emerald-500"
                          : powerPercentage >= 40
                          ? "bg-amber-500"
                          : "bg-blue-500"
                      }`}
                      style={{ width: `${powerPercentage}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-400">{powerPercentage}%</span>
                </div>
              </div>
            </div>

            {/* Quick Preset Selector */}
            <div className="flex items-center space-x-1 border-l border-neutral-800 pl-2">
              <button
                id="preset-all"
                onClick={() => handleApplyPreset("all")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center space-x-1 ${
                  currentPreset === "all"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60"
                }`}
                title="Activer tous les 9 agents (Puissance Maximale)"
              >
                <Zap className="w-3 h-3 text-emerald-300" />
                <span>Tous (9)</span>
              </button>

              <button
                id="preset-dev"
                onClick={() => handleApplyPreset("dev_only")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center space-x-1 ${
                  currentPreset === "dev_only"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60"
                }`}
                title="Seulement l'équipe Code & Architecture"
              >
                <Code2 className="w-3 h-3 text-blue-300" />
                <span>Code (4)</span>
              </button>

              <button
                id="preset-ecom"
                onClick={() => handleApplyPreset("ecom_only")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center space-x-1 ${
                  currentPreset === "ecom_only"
                    ? "bg-amber-600 text-white shadow-sm"
                    : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60"
                }`}
                title="Seulement l'équipe Business & E-commerce"
              >
                <Package className="w-3 h-3 text-amber-300" />
                <span>E-com (5)</span>
              </button>

              <button
                id="preset-lean"
                onClick={() => handleApplyPreset("lean_duo")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center space-x-1 ${
                  currentPreset === "lean_duo"
                    ? "bg-purple-600 text-white shadow-sm"
                    : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60"
                }`}
                title="Économie d'énergie / Vitesse maximale (2 agents clés)"
              >
                <Activity className="w-3 h-3 text-purple-300" />
                <span>Duo Éco (2)</span>
              </button>

              <button
                id="btn-quick-download-studio"
                onClick={() => setShowDownloaderModal(true)}
                className="px-3 py-1 rounded-lg text-[11px] font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-600/30 flex items-center space-x-1.5 transition ml-1"
                title="Télécharger le package PC autonome (.ZIP / .BAT)"
              >
                <Download className="w-3 h-3" />
                <span>Télécharger Pack PC</span>
              </button>
            </div>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex flex-wrap items-center gap-1.5 bg-neutral-900 p-1 rounded-xl border border-neutral-800">
            <button
              id="tab-hub-overview"
              onClick={() => setActiveTab("hub_overview")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                activeTab === "hub_overview"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>🧭 Hub & Matrice de Puissance</span>
            </button>

            <button
              id="tab-business-ecom"
              onClick={() => setActiveTab("business_ecom")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                activeTab === "business_ecom"
                  ? "bg-gradient-to-r from-amber-600 via-indigo-600 to-rose-600 text-white shadow-md"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              <Package className="w-3.5 h-3.5 text-amber-300" />
              <span>💎 Agents Business & E-com</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] bg-white/20">5 AGENTS</span>
            </button>

            <button
              id="tab-workspace"
              onClick={() => setActiveTab("workspace")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 ${
                activeTab === "workspace"
                  ? "bg-neutral-800 text-white shadow-sm font-bold"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              <Code2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>⚡ Atelier Code CoWork</span>
            </button>

            <button
              id="tab-margin-calc"
              onClick={() => setActiveTab("margin_calc")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 ${
                activeTab === "margin_calc"
                  ? "bg-neutral-800 text-white shadow-sm font-bold"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              <Calculator className="w-3.5 h-3.5 text-emerald-300" />
              <span>🧮 Simulateur Marges & ROAS</span>
            </button>

            <button
              id="tab-reformulator"
              onClick={() => setActiveTab("reformulator")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === "reformulator"
                  ? "bg-neutral-800 text-white shadow-sm font-bold"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              🎯 Reformulateur Express
            </button>

            <button
              id="tab-guardrails"
              onClick={() => setActiveTab("guardrails")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 ${
                activeTab === "guardrails"
                  ? "bg-neutral-800 text-white shadow-sm font-bold"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
              <span>🛡️ Garde-Fous ({rules.filter((r) => r.enabled).length}/{rules.length})</span>
            </button>

            <button
              id="tab-team"
              onClick={() => setActiveTab("team")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === "team"
                  ? "bg-neutral-800 text-white shadow-sm font-bold"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              👥 Fiches Détaillées ({agents.length})
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Chercher un agent, fonction..."
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Main Content View */}
      <div className="p-6 max-w-6xl mx-auto w-full space-y-6">
        {/* ======================================================================
            TAB 0: HUB OVERVIEW & AGENT POWER MATRIX (CONTROL ROOM)
        ====================================================================== */}
        {activeTab === "hub_overview" && (
          <div className="space-y-6">
            {/* Quick Action Launchpad */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center space-x-1.5">
                <Compass className="w-4 h-4 text-indigo-400" />
                <span>Lanceur Rapide des Modules IA</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Card 1: E-com Deals */}
                <div
                  onClick={() => setActiveTab("business_ecom")}
                  className="p-5 rounded-3xl bg-gradient-to-br from-neutral-900 via-neutral-900 to-indigo-950/30 border border-indigo-500/30 hover:border-indigo-500 transition cursor-pointer space-y-3 group shadow-lg"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                      <Package className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-indigo-400 group-hover:translate-x-1 transition flex items-center">
                      Ouvrir <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white">Chasseur Deals & Prix E-com</h4>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Radar offre/demande mondiale, calcul de marge nette (+75%) et détection d'écarts de prix gagnants.
                  </p>
                </div>

                {/* Card 2: AI Ideas */}
                <div
                  onClick={() => setActiveTab("business_ecom")}
                  className="p-5 rounded-3xl bg-gradient-to-br from-neutral-900 via-neutral-900 to-amber-950/30 border border-amber-500/30 hover:border-amber-500 transition cursor-pointer space-y-3 group shadow-lg"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                      <Lightbulb className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-amber-400 group-hover:translate-x-1 transition flex items-center">
                      Ouvrir <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white">Incubateur d'Idées IA Monétisables</h4>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Modèles de business IA prêts à encaisser (Micro-SaaS, Agences d'automatisation, UGC factory).
                  </p>
                </div>

                {/* Card 3: Code CoWork */}
                <div
                  onClick={() => setActiveTab("workspace")}
                  className="p-5 rounded-3xl bg-gradient-to-br from-neutral-900 via-neutral-900 to-emerald-950/30 border border-emerald-500/30 hover:border-emerald-500 transition cursor-pointer space-y-3 group shadow-lg"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                      <Code2 className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-emerald-400 group-hover:translate-x-1 transition flex items-center">
                      Ouvrir <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white">Atelier Code CoWork Multi-Agent</h4>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Pipeline 4 étapes autonome : Reformulation d'intentions floues, architecture anti-spaghetti et audit de sécurité.
                  </p>
                </div>

                {/* Card 4: Profit Calculator */}
                <div
                  onClick={() => setActiveTab("margin_calc")}
                  className="p-5 rounded-3xl bg-gradient-to-br from-neutral-900 via-neutral-900 to-cyan-950/30 border border-cyan-500/30 hover:border-cyan-500 transition cursor-pointer space-y-3 group shadow-lg"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
                      <Calculator className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-cyan-400 group-hover:translate-x-1 transition flex items-center">
                      Ouvrir <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white">Simulateur Marges & Break-Even ROAS</h4>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Calcul instantané de votre seuil de rentabilité pub, frais de plateforme et marge nette en direct.
                  </p>
                </div>

                {/* Card 5: Buy Box & Arbitrage */}
                <div
                  onClick={() => setActiveTab("business_ecom")}
                  className="p-5 rounded-3xl bg-gradient-to-br from-neutral-900 via-neutral-900 to-blue-950/30 border border-blue-500/30 hover:border-blue-500 transition cursor-pointer space-y-3 group shadow-lg"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
                      <ShoppingCart className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-blue-400 group-hover:translate-x-1 transition flex items-center">
                      Ouvrir <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white">Arbitrage Multi-Plateforme & Buy Box</h4>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Audit algorithmique Amazon, eBay, Shopify et Etsy pour rafler la Buy Box à coup sûr.
                  </p>
                </div>

                {/* Card 6: Promo UGC Machine */}
                <div
                  onClick={() => setActiveTab("business_ecom")}
                  className="p-5 rounded-3xl bg-gradient-to-br from-neutral-900 via-neutral-900 to-rose-950/30 border border-rose-500/30 hover:border-rose-500 transition cursor-pointer space-y-3 group shadow-lg"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-rose-400 group-hover:translate-x-1 transition flex items-center">
                      Ouvrir <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white">Machine Promotionnelle & UGC Ads</h4>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Générateur de hooks viraux 0-3s, scripts publicitaires 15s et offres groupées (bundles).
                  </p>
                </div>
              </div>
            </div>

            {/* Matrice de Gestion Individuelle des Agents */}
            <div className="bg-neutral-900/80 border border-neutral-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
                <div>
                  <div className="flex items-center space-x-2">
                    <Power className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      Matrice de Puissance & Interrupteurs Individuels
                    </h3>
                  </div>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Activez ou désactivez chaque agent pour économiser les ressources et cibler précisément vos besoins.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/20">
                    {activeCount} / {agents.length} AGENTS EN SERVICE
                  </span>
                </div>
              </div>

              {/* Grid of Agents with Toggle Switches */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                {filteredAgents.map((ag) => {
                  const theme = getAgentTheme(ag.role);
                  return (
                    <div
                      key={ag.id}
                      className={`p-4 rounded-2xl border transition flex flex-col justify-between space-y-3 ${
                        ag.isActive
                          ? `${theme.bg} ${theme.border} shadow-md`
                          : "bg-neutral-950/40 border-neutral-800/80 opacity-60 hover:opacity-100"
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center space-x-2.5">
                            <span className="text-xl p-1.5 rounded-xl bg-neutral-900/80 border border-neutral-800">
                              {ag.avatar}
                            </span>
                            <div>
                              <h4 className="text-xs font-bold text-white line-clamp-1">{ag.name}</h4>
                              <span className={`px-2 py-0.2 rounded-full text-[9px] font-bold border ${theme.badge}`}>
                                {ag.badge}
                              </span>
                            </div>
                          </div>

                          {/* Power Toggle Switch */}
                          <button
                            id={`toggle-${ag.id}`}
                            onClick={() => handleToggleAgent(ag.id, ag.isActive)}
                            className={`p-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1 ${
                              ag.isActive
                                ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-600/30"
                                : "bg-neutral-800 hover:bg-neutral-700 text-neutral-400 border border-neutral-700"
                            }`}
                            title={ag.isActive ? "Désactiver cet agent" : "Activer cet agent"}
                          >
                            <Power className={`w-3 h-3 ${ag.isActive ? "text-white" : "text-neutral-500"}`} />
                            <span className="text-[10px]">{ag.isActive ? "ON" : "OFF"}</span>
                          </button>
                        </div>

                        <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed">
                          {ag.description}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-neutral-800/60 flex items-center justify-between text-[10px] text-neutral-400">
                        <span>Statut : <strong className={ag.isActive ? "text-emerald-400" : "text-neutral-500"}>{ag.isActive ? "Actif & Prêt" : "En Veille"}</strong></span>
                        <span className="font-mono text-neutral-500">{ag.role}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================================
            TAB 1: BUSINESS, DROPSHIPPING & MONETIZATION AGENTS
        ====================================================================== */}
        {activeTab === "business_ecom" && (
          <BusinessEcomAgentsStudio />
        )}

        {/* ======================================================================
            TAB 2: ATELIER COWORK LIVE (MULTI-AGENT PIPELINE)
        ====================================================================== */}
        {activeTab === "workspace" && (
          <div className="space-y-6">
            {/* Input Prompt Box */}
            <div className="bg-neutral-900/70 border border-neutral-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Terminal className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-200">
                    Console de Commande CoWork Swarm
                  </h2>
                </div>
                <span className="text-xs text-neutral-400 flex items-center space-x-1">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Architecture & Anti-Suppression Actifs</span>
                </span>
              </div>

              <div className="space-y-2">
                <textarea
                  id="cowork-prompt-input"
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  placeholder="Décrivez votre idée ou votre besoin (ex: Crée un dashboard d'analyse financière avec graphiques temps réel et export CSV)..."
                  rows={3}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl p-4 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-indigo-500 transition resize-none"
                />

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-neutral-400">Exemples rapides :</span>
                    <button
                      onClick={() =>
                        setUserPrompt(
                          "Ajouter un widget de conversion de devises crypto avec graphique d'évolution en direct"
                        )
                      }
                      className="px-2.5 py-1 rounded-lg text-xs bg-neutral-800/80 hover:bg-neutral-800 text-neutral-300 transition border border-neutral-700/50"
                    >
                      🪙 Widget Crypto
                    </button>
                    <button
                      onClick={() =>
                        setUserPrompt(
                          "Créer un gestionnaire de formulaires dynamiques avec export JSON et validation stricte"
                        )
                      }
                      className="px-2.5 py-1 rounded-lg text-xs bg-neutral-800/80 hover:bg-neutral-800 text-neutral-300 transition border border-neutral-700/50"
                    >
                      📝 Formulaires Dynamiques
                    </button>
                  </div>

                  <button
                    id="btn-run-cowork"
                    onClick={() => handleRunCoWork()}
                    disabled={isExecuting || !userPrompt.trim()}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white font-bold text-xs flex items-center space-x-2 transition shadow-lg shadow-indigo-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isExecuting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Pipeline en cours...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-white" />
                        <span>Lancer la Co-Création Supervisée</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Pipeline Execution Display */}
            {isExecuting && (
              <div className="bg-neutral-900/60 border border-neutral-800 rounded-3xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <RefreshCw className="w-4 h-4 text-indigo-400 animate-spin" />
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                      Traitement Supervisé par le Swarm
                    </span>
                  </div>
                  <span className="text-xs text-neutral-400">
                    Étape {Math.min(currentStepIndex, 4)} sur 4
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  {[
                    { label: "1. Reformulation", desc: "Clarté de l'intention" },
                    { label: "2. Architecture", desc: "Verrouillage modulaire" },
                    { label: "3. Codage Coder", desc: "Composant TypeScript" },
                    { label: "4. Sentinelle", desc: "Audit anti-spaghetti" },
                  ].map((s, idx) => {
                    const isDone = currentStepIndex > idx + 1;
                    const isCurrent = currentStepIndex === idx + 1;
                    return (
                      <div
                        key={idx}
                        className={`p-3 rounded-2xl border text-center transition ${
                          isDone
                            ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300"
                            : isCurrent
                            ? "bg-indigo-500/20 border-indigo-500/60 text-white animate-pulse"
                            : "bg-neutral-950 border-neutral-800 text-neutral-500"
                        }`}
                      >
                        <div className="text-xs font-bold">{s.label}</div>
                        <div className="text-[10px] mt-0.5">{s.desc}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Completed Session Deliverables */}
            {activeSession && (
              <div className="space-y-6">
                {/* Summary Banner */}
                <div className="bg-gradient-to-r from-neutral-900 via-neutral-900 to-emerald-950/40 border border-emerald-500/40 rounded-3xl p-6 space-y-4 shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        <span className="text-xs uppercase font-bold tracking-wider text-emerald-400">
                          LIVRABLE COWORK VALIDÉ & CERTIFIÉ
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-white">{activeSession.title}</h3>
                      <p className="text-xs text-neutral-300 max-w-2xl">
                        {activeSession.finalDeliverable?.explanation}
                      </p>
                    </div>

                    <div className="flex items-center space-x-3 shrink-0">
                      <div className="text-right">
                        <div className="text-[10px] text-neutral-400 uppercase font-semibold">
                          Score Qualité Sentinelle
                        </div>
                        <div className="text-lg font-black text-emerald-400">
                          {activeSession.finalDeliverable?.qualityScore}%
                        </div>
                      </div>
                      <div className="px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center space-x-1">
                        <ShieldCheck className="w-4 h-4" />
                        <span>0 Spaghetti</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Steps Details Accordion/Cards */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                    Étapes de Supervision Détaillées
                  </h3>

                  <div className="grid grid-cols-1 gap-4">
                    {activeSession.steps.map((step) => {
                      const theme = getAgentTheme(step.agentRole);
                      return (
                        <div
                          key={step.id}
                          className={`p-5 rounded-3xl border ${theme.border} ${theme.bg} space-y-3 shadow-lg`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <span className="text-xl p-2 rounded-2xl bg-neutral-900/80 border border-neutral-800">
                                {theme.icon}
                              </span>
                              <div>
                                <h4 className="text-sm font-bold text-white">{step.title}</h4>
                                <div className="text-xs text-neutral-400">
                                  Supervisé par <strong className={theme.text}>{step.agentName}</strong>
                                </div>
                              </div>
                            </div>

                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${theme.badge}`}>
                              VALIDÉ
                            </span>
                          </div>

                          <p className="text-xs text-neutral-300 leading-relaxed bg-neutral-950/40 p-3.5 rounded-2xl border border-neutral-800/80">
                            {step.detailedOutput}
                          </p>

                          {/* Code Snippets if any */}
                          {step.codeSnippets && step.codeSnippets.length > 0 && (
                            <div className="space-y-2 pt-2">
                              {step.codeSnippets.map((snippet, sIdx) => (
                                <div
                                  key={sIdx}
                                  className="rounded-2xl bg-neutral-950 border border-neutral-800 overflow-hidden"
                                >
                                  <div className="px-4 py-2 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between">
                                    <span className="text-xs font-mono text-neutral-300">
                                      {snippet.filename || "Composant généré"}
                                    </span>
                                    <button
                                      onClick={() => handleCopyCode(snippet.code, `${step.id}-${sIdx}`)}
                                      className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-neutral-200 transition flex items-center space-x-1.5"
                                    >
                                      {copiedCodeId === `${step.id}-${sIdx}` ? (
                                        <>
                                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                                          <span>Copié !</span>
                                        </>
                                      ) : (
                                        <>
                                          <Copy className="w-3.5 h-3.5" />
                                          <span>Copier Code</span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                  <pre className="p-4 text-xs font-mono text-neutral-300 overflow-x-auto max-h-72">
                                    <code>{snippet.code}</code>
                                  </pre>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================================
            TAB 3: SIMULATEUR DE MARGES & BREAK-EVEN ROAS E-COMMERCE
        ====================================================================== */}
        {activeTab === "margin_calc" && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-neutral-900 via-neutral-900 to-cyan-950/40 border border-cyan-500/30 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Calculator className="w-5 h-5 text-cyan-400" />
                    <span className="text-xs uppercase font-bold tracking-widest text-cyan-400">
                      CALCULATEUR DE RENTABILITÉ & SEUIL DE PROFITABILITÉ
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-white">
                    Simulateur Interactif de Marges & ROAS Seuil (Break-Even)
                  </h2>
                  <p className="text-xs text-neutral-400 max-w-2xl">
                    Testez vos paramètres pour savoir immédiatement à partir de quel seuil publicitaire vous générez un profit pur et comment ajuster votre tarif.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Inputs Form */}
              <div className="lg:col-span-5 bg-neutral-900/80 border border-neutral-800 rounded-3xl p-6 space-y-4 shadow-xl">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center space-x-2">
                  <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
                  <span>Paramètres Économiques</span>
                </h3>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-neutral-400 mb-1 font-semibold">
                      Prix de Vente Conseillé (€) :
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={calcPrice}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setCalcPrice(val);
                        runLiveCalculation(calcCost, val, calcShipping, calcCpa, calcFeePercent);
                      }}
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2 text-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-400 mb-1 font-semibold">
                      Coût d'Achat Usine / Fournisseur (€) :
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={calcCost}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setCalcCost(val);
                        runLiveCalculation(val, calcPrice, calcShipping, calcCpa, calcFeePercent);
                      }}
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-400 mb-1 font-semibold">
                      Frais de Livraison / Port (€) :
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={calcShipping}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setCalcShipping(val);
                        runLiveCalculation(calcCost, calcPrice, val, calcCpa, calcFeePercent);
                      }}
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-400 mb-1 font-semibold">
                      Coût d'Acquisition Client Estimé / CPA Pub (€) :
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={calcCpa}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setCalcCpa(val);
                        runLiveCalculation(calcCost, calcPrice, calcShipping, val, calcFeePercent);
                      }}
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-400 mb-1 font-semibold">
                      Frais de Plateforme (Shopify, Stripe, Amazon %) :
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={calcFeePercent}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setCalcFeePercent(val);
                        runLiveCalculation(calcCost, calcPrice, calcShipping, calcCpa, val);
                      }}
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Live Results Panel */}
              <div className="lg:col-span-7 space-y-4">
                {calcResult ? (
                  <div className="bg-neutral-900/90 border border-neutral-800 rounded-3xl p-6 space-y-6 shadow-2xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs uppercase font-bold text-cyan-400">
                          VERDICT STRATÉGIQUE DE L'AGENT TARIFAIRE
                        </span>
                        <h3 className="text-lg font-bold text-white mt-1">
                          Rentabilité par Commande
                        </h3>
                      </div>

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                          calcResult.verdict === "excellent"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : calcResult.verdict === "bon"
                            ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                            : calcResult.verdict === "moyen"
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                        }`}
                      >
                        {calcResult.verdict.toUpperCase()}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800">
                        <div className="text-[10px] text-neutral-400">Bénéfice Net / Vente</div>
                        <div className="text-xl font-black text-emerald-400 mt-1">
                          +{calcResult.netProfit.toFixed(2)}€
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/50 shadow-inner">
                        <div className="text-[10px] text-cyan-300 font-bold">Marge Nette %</div>
                        <div className="text-2xl font-black text-white mt-1">
                          {calcResult.marginPercent}%
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800">
                        <div className="text-[10px] text-neutral-400">ROAS Minimum (BEP)</div>
                        <div className="text-xl font-bold text-amber-400 mt-1">
                          x{calcResult.breakEvenRoas}
                        </div>
                      </div>
                    </div>

                    {/* Scale Projections */}
                    <div className="p-4 rounded-2xl bg-neutral-950/80 border border-neutral-800 space-y-2">
                      <div className="text-xs font-bold text-neutral-300">
                        🚀 Projection à l'Échelle (100 et 500 Ventes) :
                      </div>
                      <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
                        <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800">
                          <div className="text-neutral-400 text-[10px]">100 Ventes :</div>
                          <div className="font-bold text-emerald-400">
                            +{(calcResult.netProfit * 100).toFixed(2)}€ de Bénéfice Net
                          </div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800">
                          <div className="text-neutral-400 text-[10px]">500 Ventes :</div>
                          <div className="font-bold text-emerald-400">
                            +{(calcResult.netProfit * 500).toFixed(2)}€ de Bénéfice Net
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Recommendation */}
                    <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-200 leading-relaxed">
                      <strong className="text-white block mb-1 font-bold">
                        🧠 Conseil de l'Agent Tarification :
                      </strong>
                      {calcResult.recommendation}
                    </div>
                  </div>
                ) : (
                  <div className="h-64 rounded-3xl border border-dashed border-neutral-800 flex items-center justify-center text-neutral-500 text-xs">
                    Calcul en cours...
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================================
            TAB 4: REFORMULATEUR EXPRESS
        ====================================================================== */}
        {activeTab === "reformulator" && (
          <div className="space-y-6">
            <div className="bg-neutral-900/70 border border-neutral-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <div className="flex items-start space-x-3">
                <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    Agent Reformulateur d'Intentions Floues
                  </h2>
                  <p className="text-xs text-neutral-400 mt-1 max-w-2xl leading-relaxed">
                    Transforme automatiquement vos idées vagues en spécifications ultra-précises, élimine toute ambiguïté et prépare le travail parfait pour l'Architecte et le Coder.
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <textarea
                  value={rawPromptInput}
                  onChange={(e) => setRawPromptInput(e.target.value)}
                  placeholder="Tapez votre demande brute (ex: 'fais-moi un truc pour gérer des abonnements vite fait')..."
                  rows={3}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl p-4 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition resize-none"
                />

                <div className="flex justify-end">
                  <button
                    onClick={() => handleRephrase()}
                    disabled={isRephrasing || !rawPromptInput.trim()}
                    className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center space-x-2 transition shadow-md shadow-amber-600/20 disabled:opacity-50"
                  >
                    {isRephrasing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Analyse en cours...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Clarifier & Structurer l'Intention</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Reformulation Results */}
            {reformulationResult && (
              <div className="bg-neutral-900/90 border border-amber-500/30 rounded-3xl p-6 space-y-6 shadow-2xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
                  <div>
                    <span className="text-xs uppercase font-bold text-amber-400">
                      RÉSULTAT DU CADRAGE D'INTENTION
                    </span>
                    <h3 className="text-base font-bold text-white mt-1">
                      {reformulationResult.detectedGoal}
                    </h3>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-[10px] text-neutral-400">Score de Clarté</div>
                      <div className="text-base font-black text-emerald-400">
                        {reformulationResult.clarityScore}%
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-neutral-400">Ambiguïté Éliminée</div>
                      <div className="text-base font-black text-amber-400">
                        -{reformulationResult.ambiguityScore}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3 Options Generated */}
                <div className="space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                    3 Spécifications Optimisées Prêtes à l'Emploi :
                  </span>

                  <div className="space-y-3">
                    {reformulationResult.rephrasedOptions.map((opt, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-amber-500/40 transition group"
                      >
                        <p className="text-xs text-neutral-200 leading-relaxed flex-1 font-mono">
                          {opt}
                        </p>
                        <div className="flex items-center space-x-2 shrink-0">
                          <button
                            onClick={() => {
                              setUserPrompt(opt);
                              setActiveTab("workspace");
                            }}
                            className="px-3 py-1.5 rounded-xl bg-amber-600/20 hover:bg-amber-600 hover:text-white text-amber-300 text-xs font-bold transition flex items-center space-x-1 border border-amber-500/30"
                          >
                            <span>Lancer en CoWork</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================================
            TAB 5: RÈGLES & GUARDRAILS
        ====================================================================== */}
        {activeTab === "guardrails" && (
          <div className="space-y-6">
            <div className="bg-neutral-900/70 border border-neutral-800 rounded-3xl p-6 space-y-4">
              <div className="flex items-start space-x-3">
                <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    Garde-Fous & Règles de Cadrage du Code
                  </h2>
                  <p className="text-xs text-neutral-400 mt-1 max-w-2xl leading-relaxed">
                    Ces règles sont imposées par le Grand Architecte pour interdire formellement le code désordonné, le code spaghetti et toute suppression accidentelle.
                  </p>
                </div>
              </div>

              {/* Rules List */}
              <div className="space-y-3 pt-2">
                {rules.map((r) => (
                  <div
                    key={r.id}
                    className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-white">{r.name}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            r.strictness === "blocking"
                              ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                              : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          }`}
                        >
                          {r.strictness === "blocking" ? "BLOQUANT STRICT" : "AVERTISSEMENT"}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400">{r.description}</p>
                    </div>

                    <button
                      onClick={() => handleToggleRule(r.id, r.enabled)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                        r.enabled
                          ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-600/20"
                          : "bg-neutral-800 hover:bg-neutral-700 text-neutral-400 border border-neutral-700"
                      }`}
                    >
                      {r.enabled ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Actif</span>
                        </>
                      ) : (
                        <span>Désactivé</span>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================================
            TAB 6: FICHES DÉTAILLÉES DES AGENTS DU SWARM
        ====================================================================== */}
        {activeTab === "team" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAgents.map((ag) => {
                const theme = getAgentTheme(ag.role);
                return (
                  <div
                    key={ag.id}
                    className={`p-5 rounded-3xl border ${theme.border} ${theme.bg} space-y-4 shadow-xl flex flex-col justify-between`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl p-2 rounded-2xl bg-neutral-900/60 border border-neutral-800">
                            {ag.avatar}
                          </span>
                          <div>
                            <h3 className="text-sm font-bold text-white">{ag.name}</h3>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${theme.badge}`}>
                              {ag.badge}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleToggleAgent(ag.id, ag.isActive)}
                          className={`px-2.5 py-1 rounded-xl text-xs font-bold transition flex items-center space-x-1 ${
                            ag.isActive
                              ? "bg-emerald-600 text-white shadow-sm"
                              : "bg-neutral-800 text-neutral-400 border border-neutral-700"
                          }`}
                        >
                          <Power className="w-3 h-3" />
                          <span>{ag.isActive ? "En Service" : "Désactivé"}</span>
                        </button>
                      </div>

                      <p className="text-xs text-neutral-300 leading-relaxed">{ag.description}</p>

                      <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                          Missions & Responsabilités :
                        </span>
                        <ul className="space-y-1 text-[11px] text-neutral-300">
                          {ag.responsibilities.map((resp, rIdx) => (
                            <li key={rIdx} className="flex items-center space-x-1.5">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                              <span>{resp}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-400">
                      <span>
                        Statut :{" "}
                        <strong className={ag.isActive ? "text-emerald-400" : "text-neutral-500"}>
                          {ag.isActive ? "Opérationnel" : "Désactivé"}
                        </strong>
                      </span>
                      <span className="font-mono text-[10px]">{ag.role}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <ProgramDownloaderModal
        isOpen={showDownloaderModal}
        onClose={() => setShowDownloaderModal(false)}
      />
    </div>
  );
};

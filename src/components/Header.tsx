import React, { useState } from "react";
import {
  ViewMode,
  ModelInfo,
  AppSettings,
  ProjectItem,
} from "../types";
import {
  Sparkles,
  MessageSquare,
  FileEdit,
  Columns2,
  HardDrive,
  Kanban,
  LineChart,
  Settings,
  Code2,
  Download,
  ShieldCheck,
  ShieldAlert,
  Sun,
  Moon,
  Bell,
  CheckCircle2,
  Server,
  CloudOff,
  ChevronDown,
  Lock,
  Unlock,
  TrendingUp,
  HeartPulse,
  Paintbrush,
  Gamepad2,
  FolderArchive,
  Wrench,
  Terminal,
  Users,
  Workflow,
} from "lucide-react";

interface HeaderProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  models: ModelInfo[];
  selectedModelId: string;
  onModelSelect: (modelId: string) => void;
  settings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => void;
  isOllamaOnline: boolean;
  onOpenGetCode: () => void;
  onOpenExport: () => void;
  onOpenVault: () => void;
  onOpenProgramDownloader: () => void;
  projects: ProjectItem[];
  unreadAlertCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onViewChange,
  models,
  selectedModelId,
  onModelSelect,
  settings,
  onUpdateSettings,
  isOllamaOnline,
  onOpenGetCode,
  onOpenExport,
  onOpenVault,
  onOpenProgramDownloader,
  projects,
  unreadAlertCount,
}) => {
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [alertsDropdownOpen, setAlertsDropdownOpen] = useState(false);

  const activeModel = models.find((m) => m.id === selectedModelId) || models[0];

  const urgentProjects = projects.filter(
    (p) => p.status !== "done" && (p.priority === "urgent" || p.priority === "high")
  );

  const toggleTheme = () => {
    const nextTheme = settings.theme === "dark" ? "light" : "dark";
    onUpdateSettings({ ...settings, theme: nextTheme });
  };

  return (
    <header
      id="app-main-header"
      className="h-14 border-b border-neutral-800 bg-neutral-950 px-4 flex items-center justify-between select-none z-30 shrink-0 text-neutral-200"
    >
      {/* Brand & Mode Navigation */}
      <div className="flex items-center space-x-3 overflow-x-auto scrollbar-none py-1">
        <div
          id="app-branding"
          className="flex items-center space-x-2.5 cursor-pointer shrink-0"
          onClick={() => onViewChange("chat")}
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 via-indigo-600 to-emerald-500 flex items-center justify-center shadow-md shadow-blue-500/20 text-white font-black text-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-sm tracking-tight text-white">
                Nova Local Core
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                100% Libre de Droit
              </span>
            </div>
            <p className="text-[10px] text-neutral-400 leading-none">
              Open Commercial • Zéro Télémétrie • Mode Autonome
            </p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <nav className="flex items-center space-x-1 bg-neutral-900/90 p-1 rounded-lg border border-neutral-800/80 shrink-0">
          <button
            id="tab-chat"
            onClick={() => onViewChange("chat")}
            className={`px-2.5 py-1 text-xs font-medium rounded-md flex items-center space-x-1.5 transition-colors ${
              currentView === "chat"
                ? "bg-neutral-800 text-blue-400 shadow-sm border border-neutral-700/60"
                : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Chat</span>
          </button>

          <button
            id="tab-agents-cowork"
            onClick={() => onViewChange("agents_cowork")}
            className={`px-2.5 py-1 text-xs font-medium rounded-md flex items-center space-x-1.5 transition-colors ${
              currentView === "agents_cowork"
                ? "bg-gradient-to-r from-blue-600/30 via-indigo-600/30 to-amber-600/30 text-amber-300 shadow-sm border border-amber-500/50 font-bold"
                : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40"
            }`}
          >
            <Users className="w-3.5 h-3.5 text-amber-400" />
            <span>Agents CoWork & Business E-com</span>
            <span className="px-1 py-0.2 rounded text-[9px] bg-amber-500/20 text-amber-300">9 AGENTS</span>
          </button>

          <button
            id="tab-autonomous"
            onClick={() => onViewChange("autonomous")}
            className={`px-2.5 py-1 text-xs font-medium rounded-md flex items-center space-x-1.5 transition-colors ${
              currentView === "autonomous"
                ? "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 shadow-sm border border-amber-500/40"
                : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
            <span>Offres Autonomes</span>
          </button>

          <button
            id="tab-doctor"
            onClick={() => onViewChange("doctor")}
            className={`px-2.5 py-1 text-xs font-medium rounded-md flex items-center space-x-1.5 transition-colors ${
              currentView === "doctor"
                ? "bg-emerald-500/20 text-emerald-300 shadow-sm border border-emerald-500/40"
                : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40"
            }`}
          >
            <HeartPulse className="w-3.5 h-3.5 text-emerald-400" />
            <span>Docteur PC</span>
          </button>

          <button
            id="tab-autopatch-deploy"
            onClick={() => onViewChange("autopatch_deploy")}
            className={`px-2.5 py-1 text-xs font-medium rounded-md flex items-center space-x-1.5 transition-colors ${
              currentView === "autopatch_deploy"
                ? "bg-gradient-to-r from-emerald-500/25 to-teal-500/25 text-emerald-300 shadow-sm border border-emerald-500/50"
                : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40"
            }`}
          >
            <Wrench className="w-3.5 h-3.5 text-emerald-400" />
            <span>Auto-Patch & .BAT/.EXE</span>
          </button>

          <button
            id="tab-canvas-studio"
            onClick={() => onViewChange("canvas_studio")}
            className={`px-2.5 py-1 text-xs font-medium rounded-md flex items-center space-x-1.5 transition-colors ${
              currentView === "canvas_studio"
                ? "bg-pink-500/20 text-pink-300 shadow-sm border border-pink-500/40"
                : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40"
            }`}
          >
            <Paintbrush className="w-3.5 h-3.5 text-pink-400" />
            <span>Canvas & Logos</span>
          </button>

          <button
            id="tab-game-lab"
            onClick={() => onViewChange("game_lab")}
            className={`px-2.5 py-1 text-xs font-medium rounded-md flex items-center space-x-1.5 transition-colors ${
              currentView === "game_lab"
                ? "bg-cyan-500/20 text-cyan-300 shadow-sm border border-cyan-500/40"
                : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40"
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Jeux Rétro</span>
          </button>

          <button
            id="tab-portfolio-dossier"
            onClick={() => onViewChange("portfolio_dossier")}
            className={`px-2.5 py-1 text-xs font-medium rounded-md flex items-center space-x-1.5 transition-colors ${
              currentView === "portfolio_dossier"
                ? "bg-amber-500/20 text-amber-300 shadow-sm border border-amber-500/40"
                : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40"
            }`}
          >
            <FolderArchive className="w-3.5 h-3.5 text-amber-400" />
            <span>Dossier Projets</span>
          </button>

          <button
            id="tab-external-ai"
            onClick={() => onViewChange("external_ai")}
            className={`px-2.5 py-1 text-xs font-medium rounded-md flex items-center space-x-1.5 transition-colors ${
              currentView === "external_ai"
                ? "bg-gradient-to-r from-blue-600/30 to-purple-600/30 text-blue-300 shadow-sm border border-blue-500/40"
                : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>IA Externe</span>
          </button>

          <button
            id="tab-freeform"
            onClick={() => onViewChange("freeform")}
            className={`px-2.5 py-1 text-xs font-medium rounded-md flex items-center space-x-1.5 transition-colors ${
              currentView === "freeform"
                ? "bg-neutral-800 text-blue-400 shadow-sm border border-neutral-700/60"
                : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40"
            }`}
          >
            <FileEdit className="w-3.5 h-3.5" />
            <span>Playground</span>
          </button>

          <button
            id="tab-compare"
            onClick={() => onViewChange("compare")}
            className={`px-2.5 py-1 text-xs font-medium rounded-md flex items-center space-x-1.5 transition-colors ${
              currentView === "compare"
                ? "bg-neutral-800 text-blue-400 shadow-sm border border-neutral-700/60"
                : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40"
            }`}
          >
            <Columns2 className="w-3.5 h-3.5" />
            <span>Compare</span>
          </button>

          <button
            id="tab-models"
            onClick={() => onViewChange("models")}
            className={`px-2.5 py-1 text-xs font-medium rounded-md flex items-center space-x-1.5 transition-colors ${
              currentView === "models"
                ? "bg-neutral-800 text-blue-400 shadow-sm border border-neutral-700/60"
                : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40"
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Modèles</span>
          </button>

          <button
            id="tab-projects"
            onClick={() => onViewChange("projects")}
            className={`px-2.5 py-1 text-xs font-medium rounded-md flex items-center space-x-1.5 transition-colors ${
              currentView === "projects"
                ? "bg-neutral-800 text-blue-400 shadow-sm border border-neutral-700/60"
                : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40"
            }`}
          >
            <Kanban className="w-3.5 h-3.5" />
            <span>Kanban</span>
            {urgentProjects.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-rose-500/20 text-rose-400 text-[10px] flex items-center justify-center font-bold">
                {urgentProjects.length}
              </span>
            )}
          </button>

          <button
            id="tab-analytics"
            onClick={() => onViewChange("analytics")}
            className={`px-2.5 py-1 text-xs font-medium rounded-md flex items-center space-x-1.5 transition-colors ${
              currentView === "analytics"
                ? "bg-neutral-800 text-blue-400 shadow-sm border border-neutral-700/60"
                : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40"
            }`}
          >
            <LineChart className="w-3.5 h-3.5" />
            <span>Stats</span>
          </button>
        </nav>
      </div>

      {/* Center/Right Controls: Model Selector & Quick Utilities */}
      <div className="flex items-center space-x-3">
        {/* Model Selector Dropdown */}
        <div className="relative">
          <button
            id="btn-model-dropdown"
            onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
            className="flex items-center space-x-2 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-neutral-200 px-3 py-1.5 rounded-lg text-xs font-medium transition"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold">{activeModel?.name || "Select Model"}</span>
            <span className="text-[10px] text-neutral-400 bg-neutral-800 px-1.5 py-0.5 rounded">
              {activeModel?.params || "Local"}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
          </button>

          {modelDropdownOpen && (
            <div
              id="model-dropdown-menu"
              className="absolute right-0 top-full mt-1.5 w-72 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl p-2 z-50 text-neutral-200"
            >
              <div className="px-2 py-1.5 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider border-b border-neutral-800 mb-1 flex justify-between items-center">
                <span>Modèles Open-Source Locaux</span>
                <span className="text-emerald-400 text-[10px]">0$ / Requête</span>
              </div>
              <div className="max-h-72 overflow-y-auto space-y-1">
                {models.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      onModelSelect(m.id);
                      setModelDropdownOpen(false);
                    }}
                    className={`w-full text-left p-2 rounded-lg text-xs transition flex items-start justify-between ${
                      m.id === selectedModelId
                        ? "bg-blue-600/20 text-blue-300 border border-blue-500/30"
                        : "hover:bg-neutral-800 text-neutral-300"
                    }`}
                  >
                    <div>
                      <div className="font-medium flex items-center space-x-1.5">
                        <span>{m.name}</span>
                        {m.capabilities.reasoning && (
                          <span className="text-[9px] bg-purple-500/20 text-purple-300 px-1 rounded">
                            R1 Think
                          </span>
                        )}
                        {m.capabilities.coding && (
                          <span className="text-[9px] bg-cyan-500/20 text-cyan-300 px-1 rounded">
                            Coder
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-neutral-400 mt-0.5">
                        {m.size} • {m.vramEstimate}
                      </div>
                    </div>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                        m.installed
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-neutral-800 text-neutral-400"
                      }`}
                    >
                      {m.installed ? "Installé" : "À télécharger"}
                    </span>
                  </button>
                ))}
              </div>
              <div className="pt-2 mt-1 border-t border-neutral-800 flex justify-between items-center px-1">
                <button
                  onClick={() => {
                    setModelDropdownOpen(false);
                    onViewChange("models");
                  }}
                  className="text-[11px] text-blue-400 hover:underline font-medium"
                >
                  + Télécharger d'autres modèles Ollama
                </button>
              </div>
            </div>
          )}
        </div>

        {/* E2E Vault Status Button */}
        <button
          id="btn-vault-status"
          onClick={onOpenVault}
          title={
            settings.security.e2eEncryptionEnabled
              ? "Chiffrement AES-GCM 256-bit Activé"
              : "Activer le Chiffrement E2E"
          }
          className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition ${
            settings.security.e2eEncryptionEnabled
              ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/50"
              : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200"
          }`}
        >
          {settings.security.e2eEncryptionEnabled ? (
            <>
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">E2E Chiffré</span>
            </>
          ) : (
            <>
              <Unlock className="w-3.5 h-3.5 text-neutral-400" />
              <span className="hidden sm:inline">Coffre Local</span>
            </>
          )}
        </button>

        {/* Deadline Smart Alert Bell */}
        <div className="relative">
          <button
            id="btn-alerts-bell"
            onClick={() => setAlertsDropdownOpen(!alertsDropdownOpen)}
            className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 relative transition"
            title="Alertes intelligentes & Deadlines"
          >
            <Bell className="w-4 h-4" />
            {urgentProjects.length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            )}
          </button>

          {alertsDropdownOpen && (
            <div
              id="alerts-dropdown-menu"
              className="absolute right-0 top-full mt-1.5 w-80 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl p-3 z-50 text-neutral-200"
            >
              <div className="flex items-center justify-between pb-2 border-b border-neutral-800 mb-2">
                <span className="text-xs font-semibold">Alertes Intelligentes & Deadlines</span>
                <span className="text-[10px] bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded">
                  {urgentProjects.length} urgentes
                </span>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {urgentProjects.length === 0 ? (
                  <p className="text-xs text-neutral-400 text-center py-3">
                    Aucune échéance critique en retard. Bravo !
                  </p>
                ) : (
                  urgentProjects.map((p) => (
                    <div
                      key={p.id}
                      className="p-2 rounded-lg bg-neutral-850 border border-neutral-800 text-xs hover:border-neutral-700 transition"
                    >
                      <div className="flex items-center justify-between font-medium">
                        <span className="truncate">{p.title}</span>
                        <span className="text-[10px] text-rose-400 font-bold uppercase">
                          {p.priority}
                        </span>
                      </div>
                      <div className="text-[10px] text-neutral-400 mt-1 flex items-center justify-between">
                        <span>Échéance : {p.deadline}</span>
                        <span>Jira : {p.jiraKey || "Non lié"}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="pt-2 mt-2 border-t border-neutral-800 flex justify-between items-center text-[11px]">
                <button
                  onClick={() => {
                    setAlertsDropdownOpen(false);
                    onViewChange("projects");
                  }}
                  className="text-blue-400 hover:underline"
                >
                  Voir tous les projets →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 🚀 Download Program Button */}
        <button
          id="btn-download-program"
          onClick={onOpenProgramDownloader}
          className="flex items-center space-x-1.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg shadow-emerald-600/30 transition transform active:scale-95 animate-pulse hover:animate-none"
          title="Télécharger le Programme Complet (Pack PC .ZIP / Lanceurs .BAT)"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Télécharger le Programme</span>
          <span className="px-1 py-0.2 rounded text-[9px] bg-white/20 uppercase font-black">PC</span>
        </button>

        {/* Auto-Patch & Desktop Quick Launch */}
        <button
          id="btn-autopatch-quick"
          onClick={() => onViewChange("autopatch_deploy")}
          className="flex items-center space-x-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-md shadow-emerald-600/20 transition"
          title="Auto-Patch, Réparateur et Lanceur .BAT / .EXE"
        >
          <Wrench className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">.BAT / .EXE</span>
        </button>

        {/* Get Code button (Google AI Studio feature) */}
        <button
          id="btn-get-code"
          onClick={onOpenGetCode}
          className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium shadow transition"
          title="Obtenir le code du prompt (Python, JS, cURL, Ollama CLI)"
        >
          <Code2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Get Code</span>
        </button>

        {/* Export Button */}
        <button
          id="btn-export-quick"
          onClick={onOpenExport}
          className="flex items-center space-x-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 px-3 py-1.5 rounded-lg text-xs font-medium transition"
          title="Exporter en PDF ou CSV"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Export</span>
        </button>

        {/* Settings Button */}
        <button
          id="btn-settings-view"
          onClick={() => onViewChange("settings")}
          className={`p-2 rounded-lg border transition ${
            currentView === "settings"
              ? "bg-blue-600/20 text-blue-400 border-blue-500/30"
              : "bg-neutral-900 hover:bg-neutral-800 border-neutral-800 text-neutral-300"
          }`}
          title="Paramètres & Intégrations (Slack, Jira, Ollama Host)"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

import React, { useState } from "react";
import { ViewMode, ModelInfo, AppSettings, ProjectItem } from "../types";
import {
  Sparkles,
  MessageSquare,
  Code2,
  Globe2,
  WandSparkles,
  Settings,
  ChevronDown,
  MoreHorizontal,
  HardDrive,
  Kanban,
  HeartPulse,
  Wrench,
  LineChart,
  Gamepad2,
  Download,
  CheckCircle2,
  CloudOff,
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
  isOllamaOnline,
  onOpenProgramDownloader,
}) => {
  const [modelOpen, setModelOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const activeModel = models.find((m) => m.id === selectedModelId) || models[0];

  const primary: Array<{ id: ViewMode; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: "chat", label: "Chat", icon: MessageSquare },
    { id: "agents_cowork", label: "Code", icon: Code2 },
    { id: "external_ai", label: "Web", icon: Globe2 },
    { id: "canvas_studio", label: "Créer", icon: WandSparkles },
  ];

  const secondary: Array<{ id: ViewMode; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: "game_lab", label: "Jeux", icon: Gamepad2 },
    { id: "models", label: "Modèles", icon: HardDrive },
    { id: "projects", label: "Projets", icon: Kanban },
    { id: "doctor", label: "Diagnostic", icon: HeartPulse },
    { id: "autopatch_deploy", label: "Outils Windows", icon: Wrench },
    { id: "analytics", label: "Statistiques", icon: LineChart },
    { id: "settings", label: "Paramètres", icon: Settings },
  ];

  return (
    <header className="h-16 shrink-0 border-b border-neutral-800 bg-neutral-950/95 px-5 flex items-center gap-4 z-40 text-neutral-200">
      <button
        onClick={() => onViewChange("chat")}
        className="flex items-center gap-2.5 shrink-0"
        title="Nova"
      >
        <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-950/30">
          <Sparkles className="w-4.5 h-4.5 text-white" />
        </span>
        <span className="hidden md:block text-left">
          <span className="block text-sm font-semibold text-white leading-tight">Nova</span>
          <span className="block text-[10px] text-neutral-500 leading-tight">Local Studio</span>
        </span>
      </button>

      <nav className="flex items-center gap-1 rounded-xl bg-neutral-900/70 p-1 border border-neutral-800">
        {primary.map(({ id, label, icon: Icon }) => {
          const active = currentView === id || (id === "canvas_studio" && currentView === "game_lab");
          return (
            <button
              key={id}
              onClick={() => onViewChange(id)}
              className={`h-9 px-3 rounded-lg flex items-center gap-2 text-sm transition ${
                active ? "bg-neutral-800 text-white" : "text-neutral-400 hover:text-white hover:bg-neutral-800/60"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>

      <div className="flex-1" />

      <div className="relative">
        <button
          onClick={() => setModelOpen((v) => !v)}
          className="h-9 max-w-[260px] px-3 rounded-lg border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 flex items-center gap-2 text-xs"
        >
          {isOllamaOnline ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          ) : (
            <CloudOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          )}
          <span className="truncate">{activeModel?.name || "Modèle local"}</span>
          <ChevronDown className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
        </button>

        {modelOpen && (
          <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-neutral-800 bg-neutral-900 shadow-2xl p-2 z-50">
            <div className="px-2 py-1.5 text-[11px] uppercase tracking-wide text-neutral-500">Modèle local</div>
            <div className="max-h-72 overflow-y-auto space-y-1">
              {models.map((model) => (
                <button
                  key={model.id}
                  onClick={() => {
                    onModelSelect(model.id);
                    setModelOpen(false);
                  }}
                  className={`w-full text-left rounded-lg px-3 py-2 transition ${
                    model.id === selectedModelId ? "bg-blue-500/15 text-blue-200" : "hover:bg-neutral-800 text-neutral-300"
                  }`}
                >
                  <div className="text-xs font-medium">{model.name}</div>
                  <div className="text-[10px] text-neutral-500 font-mono mt-0.5">{model.id}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="relative">
        <button
          onClick={() => setMoreOpen((v) => !v)}
          className="w-9 h-9 rounded-lg border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 flex items-center justify-center"
          title="Plus"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>

        {moreOpen && (
          <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-neutral-800 bg-neutral-900 shadow-2xl p-2 z-50">
            {secondary.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => {
                  onViewChange(id);
                  setMoreOpen(false);
                }}
                className={`w-full h-9 px-3 rounded-lg flex items-center gap-2 text-xs transition ${
                  currentView === id ? "bg-neutral-800 text-white" : "text-neutral-300 hover:bg-neutral-800"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
            <div className="my-2 border-t border-neutral-800" />
            <button
              onClick={() => {
                onOpenProgramDownloader();
                setMoreOpen(false);
              }}
              className="w-full h-9 px-3 rounded-lg flex items-center gap-2 text-xs text-neutral-300 hover:bg-neutral-800 transition"
            >
              <Download className="w-4 h-4" />
              <span>Installateur / export PC</span>
            </button>
          </div>
        )}
      </div>

      <button
        onClick={() => onViewChange("settings")}
        className={`w-9 h-9 rounded-lg border flex items-center justify-center transition ${
          currentView === "settings" ? "border-blue-500/50 bg-blue-500/10 text-blue-300" : "border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-400"
        }`}
        title="Paramètres"
      >
        <Settings className="w-4 h-4" />
      </button>
    </header>
  );
};

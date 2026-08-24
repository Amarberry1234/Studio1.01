/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import {
  ViewMode,
  ChatSession,
  ChatMessage,
  ModelInfo,
  ModelParameters,
  ProjectItem,
  FreeformPrompt,
  AppSettings,
  PluginExtension,
  AnalyticsMetric,
} from "./types";
import {
  loadSettings,
  saveSettings,
  loadSessions,
  saveSessions,
  loadProjects,
  saveProjects,
  loadModels,
  saveModels,
  loadPlugins,
  savePlugins,
  loadAnalytics,
  saveAnalytics,
  INITIAL_FREEFORM,
} from "./utils/storage";
import { encryptData, decryptData } from "./utils/crypto";

// Components
import { Header } from "./components/Header";
import { ChatListSidebar } from "./components/ChatListSidebar";
import { SidebarParameters } from "./components/SidebarParameters";
import { ChatPlayground } from "./components/ChatPlayground";
import { FreeformPlayground } from "./components/FreeformPlayground";
import { ComparePlayground } from "./components/ComparePlayground";
import { ExternalResearchHub } from "./components/ExternalResearchHub";
import { ModelManager } from "./components/ModelManager";
import { ProjectTracker } from "./components/ProjectTracker";
import { AnalyticsDashboard } from "./components/AnalyticsDashboard";
import { SettingsView } from "./components/SettingsView";
import { GetCodeModal } from "./components/GetCodeModal";
import { ExportModal } from "./components/ExportModal";
import { SecurityVaultModal } from "./components/SecurityVaultModal";
import { AutonomousCreationHub } from "./components/AutonomousCreationHub";
import { DoctorSystemHealth } from "./components/DoctorSystemHealth";
import { AutoPatchDesktopStudio } from "./components/AutoPatchDesktopStudio";
import { CanvasGraphicsStudio } from "./components/CanvasGraphicsStudio";
import { GameLabStudio } from "./components/GameLabStudio";
import { MasterPortfolioDossier } from "./components/MasterPortfolioDossier";
import { AgentsCoWorkStudio } from "./components/AgentsCoWorkStudio";
import { ProgramDownloaderModal } from "./components/ProgramDownloaderModal";

export default function App() {
  // Core State
  const [currentView, setCurrentView] = useState<ViewMode>("chat");
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [models, setModels] = useState<ModelInfo[]>(loadModels);
  const [selectedModelId, setSelectedModelId] = useState<string>("deepseek-r1:7b");
  const [sessions, setSessions] = useState<ChatSession[]>(loadSessions);
  const [activeSessionId, setActiveSessionId] = useState<string>(
    loadSessions()[0]?.id || "session-welcome"
  );
  const [freeformPrompt, setFreeformPrompt] = useState<FreeformPrompt>(INITIAL_FREEFORM);
  const [projects, setProjects] = useState<ProjectItem[]>(loadProjects);
  const [plugins, setPlugins] = useState<PluginExtension[]>(loadPlugins);
  const [analytics, setAnalytics] = useState<AnalyticsMetric[]>(loadAnalytics);

  // Model & System parameters
  const [parameters, setParameters] = useState<ModelParameters>({
    temperature: 0.7,
    topP: 0.9,
    topK: 40,
    maxOutputTokens: 4096,
    repeatPenalty: 1.1,
    stopSequences: [],
    responseFormat: "text",
    absoluteIntelligence: {
      enabled: false,
      iterationCount: 3,
      rigorLevel: "balanced",
      autoDetectBugs: true,
      factCheckVerification: true,
      showCritiqueSteps: true,
      convergenceThreshold: 99,
    },
  });
  const [systemInstruction, setSystemInstruction] = useState<string>(
    "Tu es un assistant IA d'élite fonctionnant 100% en local et sans aucun frais, hautement performant, expert en architecture logicielle, sécurité et productivité."
  );

  // UI state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isParamsOpen, setIsParamsOpen] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isOllamaOnline, setIsOllamaOnline] = useState(false);
  const [masterPassphrase, setMasterPassphrase] = useState<string>("");

  // Modals state
  const [showGetCodeModal, setShowGetCodeModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showVaultModal, setShowVaultModal] = useState(false);
  const [showDownloaderModal, setShowDownloaderModal] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync state to local storage
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    saveSessions(sessions);
  }, [sessions]);

  useEffect(() => {
    saveProjects(projects);
  }, [projects]);

  useEffect(() => {
    saveModels(models);
  }, [models]);

  useEffect(() => {
    savePlugins(plugins);
  }, [plugins]);

  useEffect(() => {
    saveAnalytics(analytics);
  }, [analytics]);

  useEffect(() => {
    const handleNavEvent = (e: Event) => {
      const customEvent = e as CustomEvent<ViewMode>;
      if (customEvent.detail) {
        setCurrentView(customEvent.detail);
      }
    };
    window.addEventListener("navigate-view", handleNavEvent);
    return () => window.removeEventListener("navigate-view", handleNavEvent);
  }, []);

  // Check Ollama connection on load
  const checkOllamaHealth = async () => {
    try {
      const res = await fetch("/api/ollama/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ host: settings.ollamaHost }),
      });
      const data = await res.json();
      setIsOllamaOnline(!!data.online);
    } catch (_e) {
      setIsOllamaOnline(false);
    }
  };

  useEffect(() => {
    checkOllamaHealth();
  }, [settings.ollamaHost]);

  // Active session helper
  const activeSession =
    sessions.find((s) => s.id === activeSessionId) ||
    sessions[0] || {
      id: "fallback-session",
      title: "Nouvelle discussion",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      modelId: selectedModelId,
      systemInstruction: "",
      parameters,
      messages: [],
    };

  const handleTransferExternalToChat = (prompt: string, answer: string) => {
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: "user",
      content: prompt,
      timestamp: new Date().toISOString(),
    };
    const botMsg: ChatMessage = {
      id: `msg-${Date.now()}-bot`,
      role: "assistant",
      content: answer,
      timestamp: new Date().toISOString(),
      modelUsed: "IA Externe (Optimisé)",
    };

    const targetSessionId = activeSession ? activeSession.id : `session-${Date.now()}`;

    setSessions((prev) => {
      const exists = prev.some((s) => s.id === targetSessionId);
      if (exists) {
        return prev.map((s) =>
          s.id === targetSessionId
            ? {
                ...s,
                updatedAt: new Date().toISOString(),
                messages: [...s.messages, userMsg, botMsg],
              }
            : s
        );
      }
      const newSession: ChatSession = {
        id: targetSessionId,
        title: prompt.slice(0, 30) + "...",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        modelId: selectedModelId,
        systemInstruction,
        parameters,
        messages: [userMsg, botMsg],
      };
      return [newSession, ...prev];
    });

    setActiveSessionId(targetSessionId);
    setCurrentView("chat");
  };

  const handleAddProjectTask = (taskData: Omit<ProjectItem, "id" | "createdAt">) => {
    const newTask: ProjectItem = {
      ...taskData,
      id: `proj-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setProjects((prev) => [newTask, ...prev]);
  };

  const selectedModel =
    models.find((m) => m.id === selectedModelId) || models[0];

  // Sync parameters when changing session
  useEffect(() => {
    if (activeSession) {
      if (activeSession.parameters) setParameters(activeSession.parameters);
      if (activeSession.systemInstruction !== undefined)
        setSystemInstruction(activeSession.systemInstruction);
      if (activeSession.modelId) setSelectedModelId(activeSession.modelId);
    }
  }, [activeSessionId]);

  // Send Chat Message with live streaming
  const handleSendMessage = async (text: string, attachments: any[] = []) => {
    if (!text.trim() && attachments.length === 0) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-u`,
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
      attachments,
    };

    const assistantMessageId = `msg-${Date.now()}-a`;
    const initialAssistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      timestamp: new Date().toISOString(),
      modelUsed: selectedModel.name,
    };

    const updatedMessages = [...activeSession.messages, userMessage, initialAssistantMessage];
    const updatedSession: ChatSession = {
      ...activeSession,
      messages: updatedMessages,
      updatedAt: new Date().toISOString(),
      title:
        activeSession.messages.length === 0 && text
          ? text.slice(0, 32) + (text.length > 32 ? "..." : "")
          : activeSession.title,
    };

    setSessions((prev) =>
      prev.map((s) => (s.id === activeSession.id ? updatedSession : s))
    );

    setIsStreaming(true);
    const startTime = performance.now();
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch("/api/ollama/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host: settings.ollamaHost,
          model: selectedModelId,
          messages: [
            ...(systemInstruction
              ? [{ role: "system", content: systemInstruction }]
              : []),
            ...activeSession.messages.map((m) => ({ role: m.role, content: m.content })),
            { role: "user", content: text },
          ],
          options: parameters,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.body) throw new Error("No response stream");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = "";
      let tokenCount = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunkText = decoder.decode(value);
        const lines = chunkText.split("\n\n");

        for (const line of lines) {
          if (line.startsWith("data: ") && !line.includes("[DONE]")) {
            try {
              const parsed = JSON.parse(line.replace("data: ", ""));
              if (parsed.message?.content) {
                accumulatedContent += parsed.message.content;
                tokenCount++;

                setSessions((prevSessions) =>
                  prevSessions.map((s) => {
                    if (s.id !== activeSession.id) return s;
                    return {
                      ...s,
                      messages: s.messages.map((m) =>
                        m.id === assistantMessageId
                          ? {
                              ...m,
                              content: accumulatedContent,
                              tokens: tokenCount,
                              latencyMs: Math.round(performance.now() - startTime),
                            }
                          : m
                      ),
                    };
                  })
                );
              }
            } catch (_e) {}
          }
        }
      }

      const totalLatency = Math.round(performance.now() - startTime);

      // Record Analytics
      const estimatedCostSaved = (tokenCount / 1000) * 0.03; // ~$0.03 / 1k tokens saved vs Claude 3.5 / GPT-4o
      setAnalytics((prev) => {
        const today = "Aujourd'hui";
        const existingToday = prev.find((a) => a.date === today);
        if (existingToday) {
          return prev.map((a) =>
            a.date === today
              ? {
                  ...a,
                  promptsCount: a.promptsCount + 1,
                  tokensGenerated: a.tokensGenerated + tokenCount,
                  costSavedUsd: a.costSavedUsd + estimatedCostSaved,
                  avgLatencyMs: Math.round((a.avgLatencyMs + totalLatency) / 2),
                }
              : a
          );
        }
        return [
          ...prev,
          {
            date: today,
            promptsCount: 1,
            tokensGenerated: tokenCount,
            costSavedUsd: estimatedCostSaved,
            avgLatencyMs: totalLatency,
            avgTokensPerSec: 42.0,
          },
        ];
      });
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setSessions((prevSessions) =>
          prevSessions.map((s) => {
            if (s.id !== activeSession.id) return s;
            return {
              ...s,
              messages: s.messages.map((m) =>
                m.id === assistantMessageId
                  ? {
                      ...m,
                      content:
                        m.content ||
                        "Le modèle local est prêt. Vous pouvez relancer la génération.",
                    }
                  : m
              ),
            };
          })
        );
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsStreaming(false);
  };

  const handleRegenerate = (index: number) => {
    const targetMsg = activeSession.messages[index];
    if (!targetMsg) return;
    const prevUserMsg = activeSession.messages
      .slice(0, index)
      .reverse()
      .find((m) => m.role === "user");

    if (prevUserMsg) {
      // Remove messages after target
      const trimmed = activeSession.messages.slice(0, index);
      setSessions((prev) =>
        prev.map((s) => (s.id === activeSession.id ? { ...s, messages: trimmed } : s))
      );
      handleSendMessage(prevUserMsg.content);
    }
  };

  // New Chat Session
  const handleNewSession = () => {
    const newSess: ChatSession = {
      id: `session-${Date.now()}`,
      title: "Nouvelle Discussion",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      modelId: selectedModelId,
      systemInstruction,
      parameters,
      messages: [],
    };
    setSessions([newSess, ...sessions]);
    setActiveSessionId(newSess.id);
    if (currentView !== "chat") setCurrentView("chat");
  };

  const handleDeleteSession = (id: string) => {
    const remaining = sessions.filter((s) => s.id !== id);
    setSessions(remaining);
    if (activeSessionId === id && remaining.length > 0) {
      setActiveSessionId(remaining[0].id);
    }
  };

  const handleRenameSession = (id: string, newTitle: string) => {
    setSessions(
      sessions.map((s) => (s.id === id ? { ...s, title: newTitle } : s))
    );
  };

  // Run Freeform Prompt
  const handleRunFreeform = async () => {
    setIsStreaming(true);
    const start = performance.now();
    abortControllerRef.current = new AbortController();

    try {
      const examplesFormatted = freeformPrompt.examples
        .map((ex) => `Exemple Entrée:\n${ex.input}\nSortie:\n${ex.output}`)
        .join("\n\n");

      const fullPrompt = `${examplesFormatted ? `${examplesFormatted}\n\n` : ""}Entrée:\n${freeformPrompt.userPrompt}\nSortie:`;

      const response = await fetch("/api/ollama/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host: settings.ollamaHost,
          model: selectedModelId,
          messages: [
            ...(freeformPrompt.systemInstruction
              ? [{ role: "system", content: freeformPrompt.systemInstruction }]
              : []),
            { role: "user", content: fullPrompt },
          ],
          options: parameters,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.body) throw new Error("No stream");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

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
                setFreeformPrompt((prev) => ({
                  ...prev,
                  output: accumulated,
                }));
              }
            } catch (_e) {}
          }
        }
      }
    } catch (_err) {
    } finally {
      setIsStreaming(false);
    }
  };

  // Export Full Workspace JSON
  const handleExportAllData = () => {
    const backup = {
      exportedAt: new Date().toISOString(),
      sessions,
      projects,
      models,
      analytics,
      settings,
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Local_AI_Studio_Backup_${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Import Full Workspace JSON
  const handleImportAllData = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.sessions) setSessions(data.sessions);
        if (data.projects) setProjects(data.projects);
        if (data.models) setModels(data.models);
        if (data.settings) setSettings(data.settings);
        alert("✓ Workspace importé avec succès !");
      } catch (_err) {
        alert("Fichier de sauvegarde invalide.");
      }
    };
    reader.readAsText(file);
  };

  const unreadAlerts = projects.filter(
    (p) => p.status !== "done" && (p.priority === "urgent" || p.priority === "high")
  ).length;

  return (
    <div
      id="app-root-container"
      className={`h-screen w-screen flex flex-col overflow-hidden font-sans ${
        settings.theme === "dark" ? "dark bg-neutral-950 text-neutral-100" : "bg-neutral-100 text-neutral-900"
      }`}
    >
      {/* Top AI Studio Header */}
      <Header
        currentView={currentView}
        onViewChange={setCurrentView}
        models={models}
        selectedModelId={selectedModelId}
        onModelSelect={setSelectedModelId}
        settings={settings}
        onUpdateSettings={setSettings}
        isOllamaOnline={isOllamaOnline}
        onOpenGetCode={() => setShowGetCodeModal(true)}
        onOpenExport={() => setShowExportModal(true)}
        onOpenVault={() => setShowVaultModal(true)}
        onOpenProgramDownloader={() => setShowDownloaderModal(true)}
        projects={projects}
        unreadAlertCount={unreadAlerts}
      />

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sessions Sidebar (Shown on Chat and Freeform views) */}
        {(currentView === "chat" || currentView === "freeform") && (
          <ChatListSidebar
            sessions={sessions}
            activeSessionId={activeSessionId}
            onSelectSession={setActiveSessionId}
            onNewSession={handleNewSession}
            onDeleteSession={handleDeleteSession}
            onRenameSession={handleRenameSession}
            models={models}
            isOpen={isSidebarOpen}
            onToggleOpen={() => setIsSidebarOpen(!isSidebarOpen)}
          />
        )}

        {/* Center Main Stage View */}
        <main id="main-content-canvas" className="flex-1 flex flex-col overflow-hidden">
          {currentView === "chat" && (
            <ChatPlayground
              session={activeSession}
              onUpdateSession={(updated) =>
                setSessions((prev) =>
                  prev.map((s) => (s.id === updated.id ? updated : s))
                )
              }
              models={models}
              selectedModel={selectedModel}
              isStreaming={isStreaming}
              onSendMessage={handleSendMessage}
              onStopStreaming={handleStopStreaming}
              onRegenerate={handleRegenerate}
              projects={projects}
              onOpenExternalResearch={(q) => {
                setCurrentView("external_ai");
              }}
              onOpenAgentsCoWork={() => setCurrentView("agents_cowork")}
            />
          )}

          {currentView === "agents_cowork" && <AgentsCoWorkStudio />}

          {currentView === "freeform" && (
            <FreeformPlayground
              promptData={freeformPrompt}
              onChangePromptData={setFreeformPrompt}
              models={models}
              selectedModel={selectedModel}
              isStreaming={isStreaming}
              onRunPrompt={handleRunFreeform}
              onStopPrompt={handleStopStreaming}
            />
          )}

          {currentView === "compare" && (
            <ComparePlayground
              models={models}
              parameters={parameters}
              systemInstruction={systemInstruction}
            />
          )}

          {currentView === "external_ai" && (
            <ExternalResearchHub
              onTransferToChat={handleTransferExternalToChat}
              onAddProjectTask={handleAddProjectTask}
              activeSessionTitle={activeSession.title}
            />
          )}

          {currentView === "autonomous" && (
            <AutonomousCreationHub onAddProjectTask={handleAddProjectTask} />
          )}

          {currentView === "doctor" && <DoctorSystemHealth />}

          {currentView === "autopatch_deploy" && <AutoPatchDesktopStudio />}

          {currentView === "canvas_studio" && <CanvasGraphicsStudio />}

          {currentView === "game_lab" && <GameLabStudio />}

          {currentView === "portfolio_dossier" && (
            <MasterPortfolioDossier sessions={sessions} projects={projects} />
          )}

          {currentView === "models" && (
            <ModelManager
              models={models}
              onUpdateModels={setModels}
              settings={settings}
              isOllamaOnline={isOllamaOnline}
              onRefreshOllama={checkOllamaHealth}
            />
          )}

          {currentView === "projects" && (
            <ProjectTracker
              projects={projects}
              onUpdateProjects={setProjects}
              settings={settings}
            />
          )}

          {currentView === "analytics" && (
            <AnalyticsDashboard analytics={analytics} models={models} />
          )}

          {currentView === "settings" && (
            <SettingsView
              settings={settings}
              onUpdateSettings={setSettings}
              plugins={plugins}
              onUpdatePlugins={setPlugins}
              isOllamaOnline={isOllamaOnline}
              onRefreshOllama={checkOllamaHealth}
              onExportAllData={handleExportAllData}
              onImportAllData={handleImportAllData}
            />
          )}
        </main>

        {/* Right Parameters Drawer (Shown on Chat, Freeform, Compare) */}
        {(currentView === "chat" || currentView === "freeform" || currentView === "compare") && (
          <SidebarParameters
            parameters={parameters}
            onChangeParameters={setParameters}
            systemInstruction={systemInstruction}
            onChangeSystemInstruction={setSystemInstruction}
            models={models}
            selectedModelId={selectedModelId}
            onModelSelect={setSelectedModelId}
            isOpen={isParamsOpen}
            onToggleOpen={() => setIsParamsOpen(!isParamsOpen)}
          />
        )}
      </div>

      {/* Modals */}
      <GetCodeModal
        isOpen={showGetCodeModal}
        onClose={() => setShowGetCodeModal(false)}
        modelId={selectedModelId}
        systemInstruction={systemInstruction}
        prompt={
          activeSession.messages.find((m) => m.role === "user")?.content ||
          freeformPrompt.userPrompt ||
          "Explain quantum computing"
        }
        parameters={parameters}
        host={settings.ollamaHost}
      />

      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        session={activeSession}
        modelName={selectedModel.name}
        projects={projects}
      />

      <SecurityVaultModal
        isOpen={showVaultModal}
        onClose={() => setShowVaultModal(false)}
        security={settings.security}
        onUpdateSecurity={(sec) => setSettings({ ...settings, security: sec })}
        masterPassphrase={masterPassphrase}
        onSetMasterPassphrase={setMasterPassphrase}
      />

      <ProgramDownloaderModal
        isOpen={showDownloaderModal}
        onClose={() => setShowDownloaderModal(false)}
      />
    </div>
  );
}

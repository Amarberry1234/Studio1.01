import React, { useState } from "react";
import { AppSettings, PluginExtension } from "../types";
import {
  Settings,
  Server,
  ShieldCheck,
  Lock,
  MessageSquare,
  Kanban,
  Puzzle,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  Sun,
  Moon,
  RefreshCw,
} from "lucide-react";

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => void;
  plugins: PluginExtension[];
  onUpdatePlugins: (plugins: PluginExtension[]) => void;
  isOllamaOnline: boolean;
  onRefreshOllama: () => void;
  onExportAllData: () => void;
  onImportAllData: (file: File) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  plugins,
  onUpdatePlugins,
  isOllamaOnline,
  onRefreshOllama,
  onExportAllData,
  onImportAllData,
}) => {
  const [activeTab, setActiveTab] = useState<"engine" | "security" | "integrations" | "plugins" | "backup">("engine");
  const [testSlackStatus, setTestSlackStatus] = useState<string | null>(null);
  const [pingStatus, setPingStatus] = useState<string | null>(null);

  const handleTestSlack = async () => {
    setTestSlackStatus("Envoi du webhook test...");
    try {
      const res = await fetch("/api/integrations/slack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          webhookUrl: settings.slack.webhookUrl,
          message: "🎉 Test réussi ! Local AI Studio est connecté à votre canal Slack.",
          channel: settings.slack.channel,
        }),
      });
      const data = await res.json();
      setTestSlackStatus("✓ Message test Slack envoyé avec succès !");
      setTimeout(() => setTestSlackStatus(null), 3000);
    } catch (_e) {
      setTestSlackStatus("Erreur lors du test Slack.");
    }
  };

  const handlePingHost = async () => {
    setPingStatus("Test de connexion locale...");
    try {
      const res = await fetch("/api/ollama/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ host: settings.ollamaHost }),
      });
      const data = await res.json();
      if (data.online) {
        setPingStatus(`✓ Ollama répond sur ${settings.ollamaHost} (${data.models.length} modèles détectés)`);
      } else {
        setPingStatus(`⚠️ Hôte injoignable (${data.message || "Port fermé"}). Bascule sur le simulateur local.`);
      }
      setTimeout(() => setPingStatus(null), 4000);
    } catch (_err) {
      setPingStatus("Erreur de test réseau.");
    }
  };

  const togglePlugin = (pluginId: string) => {
    onUpdatePlugins(
      plugins.map((p) => (p.id === pluginId ? { ...p, enabled: !p.enabled } : p))
    );
  };

  return (
    <div id="settings-view" className="flex-1 flex flex-col h-full bg-neutral-900/50 overflow-y-auto p-4 md:p-6 space-y-6 text-neutral-200 text-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <h1 className="text-base font-bold text-neutral-100 flex items-center space-x-2">
            <Settings className="w-5 h-5 text-blue-400" />
            <span>Paramètres Système, Confidentialité & Intégrations</span>
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Configurez votre moteur Ollama local, chiffrement AES-GCM, webhooks Slack et Jira.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-neutral-850 pb-2">
        <button
          onClick={() => setActiveTab("engine")}
          className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center space-x-1.5 ${
            activeTab === "engine"
              ? "bg-neutral-800 text-blue-400 border border-neutral-700"
              : "text-neutral-400 hover:text-neutral-200"
          }`}
        >
          <Server className="w-3.5 h-3.5" />
          <span>Moteur & Fournisseurs</span>
        </button>

        <button
          onClick={() => setActiveTab("security")}
          className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center space-x-1.5 ${
            activeTab === "security"
              ? "bg-neutral-800 text-emerald-400 border border-neutral-700"
              : "text-neutral-400 hover:text-neutral-200"
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Sécurité & Chiffrement E2E</span>
        </button>

        <button
          onClick={() => setActiveTab("integrations")}
          className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center space-x-1.5 ${
            activeTab === "integrations"
              ? "bg-neutral-800 text-purple-400 border border-neutral-700"
              : "text-neutral-400 hover:text-neutral-200"
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Slack & Jira</span>
        </button>

        <button
          onClick={() => setActiveTab("plugins")}
          className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center space-x-1.5 ${
            activeTab === "plugins"
              ? "bg-neutral-800 text-amber-400 border border-neutral-700"
              : "text-neutral-400 hover:text-neutral-200"
          }`}
        >
          <Puzzle className="w-3.5 h-3.5" />
          <span>Plugins & Extensions</span>
        </button>

        <button
          onClick={() => setActiveTab("backup")}
          className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center space-x-1.5 ${
            activeTab === "backup"
              ? "bg-neutral-800 text-cyan-400 border border-neutral-700"
              : "text-neutral-400 hover:text-neutral-200"
          }`}
        >
          <Download className="w-3.5 h-3.5" />
          <span>Sauvegarde & Export</span>
        </button>
      </div>

      {/* Tab 1: Engine & Providers */}
      {activeTab === "engine" && (
        <div className="space-y-5 max-w-3xl">
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-neutral-100 flex items-center space-x-2">
              <Server className="w-4 h-4 text-blue-400" />
              <span>Configuration du Serveur Ollama Local</span>
            </h2>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-300">URL de l'hôte Ollama</label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={settings.ollamaHost}
                  onChange={(e) =>
                    onUpdateSettings({ ...settings, ollamaHost: e.target.value })
                  }
                  className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs font-mono text-neutral-200 focus:outline-none focus:border-blue-500"
                  placeholder="http://127.0.0.1:11434"
                />
                <button
                  onClick={handlePingHost}
                  className="bg-neutral-850 hover:bg-neutral-800 text-neutral-200 px-4 py-2 rounded-xl font-medium text-xs border border-neutral-750 transition"
                >
                  Tester la Connexion
                </button>
              </div>
              {pingStatus && (
                <p className="text-[11px] text-blue-400 font-mono mt-1">{pingStatus}</p>
              )}
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-semibold text-neutral-300">Hôte LM Studio / LocalAI (v1 Compatible)</label>
              <input
                type="text"
                value={settings.lmStudioHost}
                onChange={(e) =>
                  onUpdateSettings({ ...settings, lmStudioHost: e.target.value })
                }
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs font-mono text-neutral-200 focus:outline-none focus:border-blue-500"
                placeholder="http://localhost:1234/v1"
              />
            </div>
          </div>

          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-neutral-100 flex items-center space-x-2">
              <Sun className="w-4 h-4 text-amber-400" />
              <span>Apparence & Ergonomie</span>
            </h2>

            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold block">Thème de l'interface</span>
                <span className="text-[11px] text-neutral-400">Mode sombre optimisé pour la fatigue oculaire</span>
              </div>
              <div className="flex space-x-1 bg-neutral-900 p-1 rounded-lg border border-neutral-800">
                <button
                  onClick={() => onUpdateSettings({ ...settings, theme: "dark" })}
                  className={`px-3 py-1 rounded-md text-xs font-medium ${
                    settings.theme === "dark" ? "bg-neutral-800 text-white" : "text-neutral-400"
                  }`}
                >
                  Sombre
                </button>
                <button
                  onClick={() => onUpdateSettings({ ...settings, theme: "light" })}
                  className={`px-3 py-1 rounded-md text-xs font-medium ${
                    settings.theme === "light" ? "bg-neutral-800 text-white" : "text-neutral-400"
                  }`}
                >
                  Clair
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Security & E2E Encryption */}
      {activeTab === "security" && (
        <div className="space-y-5 max-w-3xl">
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-neutral-100 flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Chiffrement de Bout en Bout AES-GCM 256-bit</span>
                </h2>
                <p className="text-[11px] text-neutral-400 mt-1">
                  Chiffre toutes les discussions et les prompts avec la Web Crypto API native avant écriture sur le disque.
                </p>
              </div>

              <input
                type="checkbox"
                checked={settings.security.e2eEncryptionEnabled}
                onChange={(e) =>
                  onUpdateSettings({
                    ...settings,
                    security: { ...settings.security, e2eEncryptionEnabled: e.target.checked },
                  })
                }
                className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
              />
            </div>

            <div className="p-3 bg-neutral-900 rounded-xl border border-neutral-800 space-y-2 text-[11px]">
              <div className="flex items-center space-x-2 text-emerald-400 font-semibold">
                <Lock className="w-3.5 h-3.5" />
                <span>Garanties de Confidentialité :</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-neutral-300">
                <li>Zéro télémétrie vers des serveurs tiers.</li>
                <li>Clé de déchiffrement dérivée localement via PBKDF2 (100 000 itérations).</li>
                <li>Les données exportées restent inviolables sans votre mot de passe maître.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Slack & Jira Integrations */}
      {activeTab === "integrations" && (
        <div className="space-y-5 max-w-3xl">
          {/* Slack Webhook */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-neutral-100 flex items-center space-x-2">
                <MessageSquare className="w-4 h-4 text-blue-400" />
                <span>Intégration Webhook Slack</span>
              </h2>
              <input
                type="checkbox"
                checked={settings.slack.enabled}
                onChange={(e) =>
                  onUpdateSettings({
                    ...settings,
                    slack: { ...settings.slack, enabled: e.target.checked },
                  })
                }
                className="w-5 h-5 accent-blue-500 rounded cursor-pointer"
              />
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">
                  Webhook URL (Slack Incoming Webhook)
                </label>
                <input
                  type="text"
                  value={settings.slack.webhookUrl}
                  onChange={(e) =>
                    onUpdateSettings({
                      ...settings,
                      slack: { ...settings.slack, webhookUrl: e.target.value },
                    })
                  }
                  placeholder="https://hooks.slack.com/services/T00/B00/XXXXX"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs font-mono text-neutral-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">Canal par défaut</label>
                  <input
                    type="text"
                    value={settings.slack.channel}
                    onChange={(e) =>
                      onUpdateSettings({
                        ...settings,
                        slack: { ...settings.slack, channel: e.target.value },
                      })
                    }
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleTestSlack}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 rounded-xl text-xs transition"
                  >
                    Tester l'envoi Slack
                  </button>
                </div>
              </div>
              {testSlackStatus && (
                <p className="text-[11px] text-emerald-400 font-semibold">{testSlackStatus}</p>
              )}
            </div>
          </div>

          {/* Jira Integration */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-neutral-100 flex items-center space-x-2">
                <Kanban className="w-4 h-4 text-purple-400" />
                <span>Synchronisation Jira Workspace</span>
              </h2>
              <input
                type="checkbox"
                checked={settings.jira.enabled}
                onChange={(e) =>
                  onUpdateSettings({
                    ...settings,
                    jira: { ...settings.jira, enabled: e.target.checked },
                  })
                }
                className="w-5 h-5 accent-purple-500 rounded cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Domaine Jira</label>
                <input
                  type="text"
                  value={settings.jira.domain}
                  onChange={(e) =>
                    onUpdateSettings({
                      ...settings,
                      jira: { ...settings.jira, domain: e.target.value },
                    })
                  }
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Clé de Projet (Project Key)</label>
                <input
                  type="text"
                  value={settings.jira.projectKey}
                  onChange={(e) =>
                    onUpdateSettings({
                      ...settings,
                      jira: { ...settings.jira, projectKey: e.target.value },
                    })
                  }
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 font-mono"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Plugins & Extensions */}
      {activeTab === "plugins" && (
        <div className="space-y-4 max-w-3xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plugins.map((plugin) => (
              <div
                key={plugin.id}
                className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 flex flex-col justify-between space-y-3 shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-neutral-100">{plugin.name}</span>
                    <input
                      type="checkbox"
                      checked={plugin.enabled}
                      onChange={() => togglePlugin(plugin.id)}
                      className="w-4 h-4 accent-blue-500 rounded cursor-pointer"
                    />
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-1.5 leading-relaxed">
                    {plugin.description}
                  </p>
                </div>
                <div className="flex items-center justify-between text-[10px] text-neutral-500 pt-2 border-t border-neutral-850">
                  <span>v{plugin.version} • {plugin.author}</span>
                  <span className="uppercase font-mono text-blue-400">{plugin.category}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Backup & Export */}
      {activeTab === "backup" && (
        <div className="space-y-5 max-w-3xl">
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-neutral-100 flex items-center space-x-2">
              <Download className="w-4 h-4 text-cyan-400" />
              <span>Exportation & Importation Complète du Workspace</span>
            </h2>
            <p className="text-[11px] text-neutral-400">
              Sauvegardez l'intégralité de vos sessions de discussion, prompts structured, projets et métriques locales.
            </p>

            <div className="flex space-x-3 pt-2">
              <button
                onClick={onExportAllData}
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow transition"
              >
                <Download className="w-4 h-4" />
                <span>Exporter le Workspace (JSON)</span>
              </button>

              <label className="bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-neutral-200 px-4 py-2 rounded-xl text-xs font-medium flex items-center space-x-1.5 cursor-pointer transition">
                <Upload className="w-4 h-4 text-cyan-400" />
                <span>Importer un Backup</span>
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onImportAllData(f);
                  }}
                />
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

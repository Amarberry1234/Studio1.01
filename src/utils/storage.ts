import {
  AppSettings,
  ChatSession,
  ModelInfo,
  ProjectItem,
  FreeformPrompt,
  AnalyticsMetric,
  PluginExtension,
} from "../types";
import { encryptData, decryptData } from "./crypto";

export const DEFAULT_MODELS: ModelInfo[] = [
  {
    id: "deepseek-r1:7b",
    name: "DeepSeek R1 (7B Reasoning)",
    provider: "ollama",
    size: "4.7 GB",
    params: "7.2B",
    quantization: "Q4_K_M",
    vramEstimate: "5.5 GB VRAM",
    family: "deepseek",
    contextWindow: 65536,
    description: "State-of-the-art open reasoning model with chain-of-thought `<think>` tags.",
    installed: true,
    capabilities: { vision: false, reasoning: true, coding: true, tools: true, json: true },
  },
  {
    id: "llama3.2:3b",
    name: "Llama 3.2 (3B Compact)",
    provider: "ollama",
    size: "2.0 GB",
    params: "3.2B",
    quantization: "Q4_K_M",
    vramEstimate: "2.8 GB VRAM",
    family: "llama",
    contextWindow: 131072,
    description: "Ultra-fast, lightweight Meta open model ideal for low RAM and CPU execution.",
    installed: true,
    capabilities: { vision: false, reasoning: false, coding: true, tools: true, json: true },
  },
  {
    id: "llama3.3:70b",
    name: "Llama 3.3 (70B Flagship)",
    provider: "ollama",
    size: "42.0 GB",
    params: "70B",
    quantization: "Q4_K_M",
    vramEstimate: "44 GB VRAM / Offload",
    family: "llama",
    contextWindow: 131072,
    description: "Meta's flagship open-weights frontier model matching GPT-4 class capabilities.",
    installed: false,
    capabilities: { vision: false, reasoning: true, coding: true, tools: true, json: true },
  },
  {
    id: "qwen2.5-coder:7b",
    name: "Qwen 2.5 Coder (7B)",
    provider: "ollama",
    size: "4.8 GB",
    params: "7.6B",
    quantization: "Q4_K_M",
    vramEstimate: "5.8 GB VRAM",
    family: "qwen",
    contextWindow: 32768,
    description: "Alibaba's benchmark-topping coding and architectural code generation model.",
    installed: true,
    capabilities: { vision: false, reasoning: false, coding: true, tools: true, json: true },
  },
  {
    id: "gemma2:9b",
    name: "Gemma 2 (9B Google Open)",
    provider: "ollama",
    size: "5.4 GB",
    params: "9.2B",
    quantization: "Q4_K_M",
    vramEstimate: "6.5 GB VRAM",
    family: "gemma",
    contextWindow: 8192,
    description: "Google's open-weights LLM architected with sliding window attention.",
    installed: true,
    capabilities: { vision: false, reasoning: false, coding: true, tools: true, json: true },
  },
  {
    id: "mistral-nemo:12b",
    name: "Mistral NeMo (12B)",
    provider: "ollama",
    size: "7.1 GB",
    params: "12.2B",
    quantization: "Q4_K_M",
    vramEstimate: "8.5 GB VRAM",
    family: "mistral",
    contextWindow: 128000,
    description: "Mistral & NVIDIA 128k context multilingual flagship model.",
    installed: false,
    capabilities: { vision: false, reasoning: false, coding: true, tools: true, json: true },
  },
  {
    id: "phi3.5:3.8b",
    name: "Phi 3.5 Mini (3.8B)",
    provider: "ollama",
    size: "2.2 GB",
    params: "3.8B",
    quantization: "Q4_K_M",
    vramEstimate: "3.0 GB VRAM",
    family: "phi",
    contextWindow: 128000,
    description: "Microsoft's high-efficiency lightweight model with huge context.",
    installed: false,
    capabilities: { vision: false, reasoning: true, coding: true, tools: false, json: true },
  },
  {
    id: "llava:7b",
    name: "LLaVA (7B Vision)",
    provider: "ollama",
    size: "4.5 GB",
    params: "7.0B",
    quantization: "Q4_K_M",
    vramEstimate: "5.5 GB VRAM",
    family: "llama",
    contextWindow: 4096,
    description: "Visual reasoning and image description multimodal local engine.",
    installed: false,
    capabilities: { vision: true, reasoning: false, coding: false, tools: false, json: false },
  },
];

export const DEFAULT_PLUGINS: PluginExtension[] = [
  {
    id: "plugin-slack",
    name: "Slack Automated Webhook",
    description: "Push critical deadline alerts, prompt outputs, and sync notices directly to your Slack channels.",
    icon: "MessageSquare",
    enabled: true,
    category: "productivity",
    author: "Local Studio Team",
    version: "1.2.0",
  },
  {
    id: "plugin-jira",
    name: "Jira Issue Sync & Formatter",
    description: "Automatically format user stories, acceptance criteria, and create formatted Jira tickets.",
    icon: "Kanban",
    enabled: true,
    category: "productivity",
    author: "Atlassian Open Tool",
    version: "2.0.4",
  },
  {
    id: "plugin-sandbox",
    name: "Client-Side Code Sandbox",
    description: "Execute JavaScript/TypeScript & Python snippets in a sandboxed WebAssembly/eval environment.",
    icon: "Terminal",
    enabled: true,
    category: "developer",
    author: "Wasm Engine",
    version: "1.0.1",
  },
  {
    id: "plugin-json-validator",
    name: "JSON Schema Validator & Enforcer",
    description: "Validate LLM JSON outputs against standard JSON schemas with instant syntax highlighting.",
    icon: "FileCode",
    enabled: true,
    category: "developer",
    author: "Schema Foundation",
    version: "1.1.0",
  },
  {
    id: "plugin-e2e-vault",
    name: "AES-GCM Zero-Knowledge Vault",
    description: "Hardens all stored chats with client-side Web Crypto AES-GCM 256-bit encryption.",
    icon: "ShieldCheck",
    enabled: true,
    category: "security",
    author: "Privacy Shield",
    version: "3.0.0",
  },
];

export const DEFAULT_SETTINGS: AppSettings = {
  ollamaHost: "http://127.0.0.1:11434",
  lmStudioHost: "http://localhost:1234/v1",
  activeProvider: "ollama",
  theme: "dark",
  accentColor: "blue",
  autoSave: true,
  offlineSync: true,
  density: "cozy",
  defaultSystemPrompt:
    "You are a helpful, private, zero-cost AI assistant running locally with complete privacy and zero data tracking.",
  security: {
    e2eEncryptionEnabled: false,
    isVaultLocked: false,
    autoLockMinutes: 15,
    localDataOnly: true,
    allowTelemetry: false,
  },
  slack: {
    enabled: true,
    webhookUrl: "",
    channel: "#local-ai-alerts",
    notifyOnDeadline: true,
    notifyOnExport: false,
  },
  jira: {
    enabled: true,
    domain: "your-workspace.atlassian.net",
    projectKey: "DEV",
    email: "amarberry1234@gmail.com",
    autoFormatMarkdown: true,
  },
  whiteLabel: {
    appName: "Nova Local Studio Core",
    tagline: "Plateforme IA Locale & Suite Autonome 100% Libre de Droit",
    authorOrOrg: "Open Community",
    license: "Royalty-Free Open Commercial",
    hideAllVendorWatermarks: true,
    zeroTelemetryGuaranteed: true,
  },
};

export const INITIAL_PROJECTS: ProjectItem[] = [
  {
    id: "proj-1",
    title: "Migration vers LLM Local 100% Gratuit",
    description: "Déploiement du cluster Ollama & DeepSeek-R1 pour supprimer tous les coûts d'API tiers.",
    deadline: new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0],
    status: "in_progress",
    priority: "urgent",
    assignedTo: "Amar",
    tags: ["LLM", "Ollama", "Infrastructure", "Finances"],
    jiraKey: "DEV-104",
    slackNotified: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "proj-2",
    title: "Chiffrement AES-GCM & Audit Sécurité",
    description: "Validation du chiffrement côté client pour assurer une confidentialité totale des données sensibles.",
    deadline: new Date(Date.now() + 86400000 * 5).toISOString().split("T")[0],
    status: "todo",
    priority: "high",
    assignedTo: "SecOps",
    tags: ["Sécurité", "E2E", "Chiffrement"],
    jiraKey: "SEC-88",
    slackNotified: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "proj-3",
    title: "Automatisation du Flux Jira & Slack",
    description: "Création des scripts de webhooks et d'export de synthèse automatique de réunions.",
    deadline: new Date(Date.now() + 86400000 * 8).toISOString().split("T")[0],
    status: "review",
    priority: "medium",
    assignedTo: "Amar",
    tags: ["Productivité", "Webhooks", "Jira"],
    jiraKey: "DEV-112",
    slackNotified: true,
    createdAt: new Date().toISOString(),
  },
];

export const INITIAL_ANALYTICS: AnalyticsMetric[] = [
  { date: "Lun", promptsCount: 42, tokensGenerated: 18450, costSavedUsd: 0.74, avgLatencyMs: 240, avgTokensPerSec: 38.5 },
  { date: "Mar", promptsCount: 68, tokensGenerated: 34100, costSavedUsd: 1.36, avgLatencyMs: 210, avgTokensPerSec: 41.2 },
  { date: "Mer", promptsCount: 54, tokensGenerated: 27900, costSavedUsd: 1.12, avgLatencyMs: 225, avgTokensPerSec: 39.8 },
  { date: "Jeu", promptsCount: 89, tokensGenerated: 51200, costSavedUsd: 2.05, avgLatencyMs: 195, avgTokensPerSec: 44.0 },
  { date: "Ven", promptsCount: 112, tokensGenerated: 64800, costSavedUsd: 2.59, avgLatencyMs: 180, avgTokensPerSec: 46.5 },
  { date: "Sam", promptsCount: 35, tokensGenerated: 15200, costSavedUsd: 0.61, avgLatencyMs: 190, avgTokensPerSec: 43.1 },
  { date: "Aujourd'hui", promptsCount: 76, tokensGenerated: 42300, costSavedUsd: 1.69, avgLatencyMs: 185, avgTokensPerSec: 45.0 },
];

export const INITIAL_FREEFORM: FreeformPrompt = {
  id: "freeform-1",
  title: "Extraction de Données Structurées JSON",
  systemInstruction:
    "Tu es un extracteur de données strict. Tu renvoies uniquement du JSON valide sans préambule ni explications.",
  userPrompt:
    "Client : Marie Dupont, email : marie.dupont@example.com, commande : 2x Ordinateurs Portables Pro à 1200€ pièce, livraison : 12 rue de la Paix, Paris.",
  examples: [
    {
      id: "ex-1",
      input: "Pierre Martin (pierre@test.com) a acheté 1 livre (20€).",
      output: '{\n  "client": "Pierre Martin",\n  "email": "pierre@test.com",\n  "items": [{"name": "Livre", "qty": 1, "price": 20}],\n  "total": 20\n}',
    },
  ],
  output: '{\n  "client": "Marie Dupont",\n  "email": "marie.dupont@example.com",\n  "address": "12 rue de la Paix, Paris",\n  "items": [\n    {\n      "name": "Ordinateur Portable Pro",\n      "qty": 2,\n      "unitPrice": 1200,\n      "total": 2400\n    }\n  ],\n  "total": 2400,\n  "currency": "EUR"\n}',
  parameters: {
    temperature: 0.2,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 2048,
    repeatPenalty: 1.1,
    stopSequences: [],
    responseFormat: "json",
  },
  modelId: "deepseek-r1:7b",
};

export const INITIAL_CHAT: ChatSession = {
  id: "session-welcome",
  title: "🚀 Bienvenue sur Local AI Studio",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  modelId: "deepseek-r1:7b",
  systemInstruction:
    "Tu es un assistant IA d'élite fonctionnant 100% en local et sans aucun frais, hautement performant, expert en architecture logicielle, sécurité et productivité.",
  parameters: {
    temperature: 0.7,
    topP: 0.9,
    topK: 40,
    maxOutputTokens: 4096,
    repeatPenalty: 1.1,
    stopSequences: [],
  },
  messages: [
    {
      id: "msg-1",
      role: "user",
      content:
        "Comment fonctionne ce Google AI Studio local sans aucun crédit payant ni restriction de jetons ?",
      timestamp: new Date(Date.now() - 120000).toISOString(),
    },
    {
      id: "msg-2",
      role: "assistant",
      reasoning:
        "Analyzing request for local zero-cost architecture explanation.\nTarget: Highlight Ollama integration, zero billing, privacy advantages, local memory efficiency, E2E encryption vault, project deadline manager, and multi-format exports.",
      content:
        "### Bienvenue dans votre **Google AI Studio Local** (100% Gratuit & Illimité)\n\nCette plateforme reproduit l'expérience avancée de Google AI Studio tout en éliminant les barrières financières et les fuites de données grâce aux modèles open-source exécutés sur votre machine ou en local :\n\n#### 💎 Vos fonctionnalités clés :\n1. **Zéro Crédit & Modèles Illimités :** Connecté directement à votre moteur **Ollama** (`http://127.0.0.1:11434`), LM Studio ou WebLLM pour faire tourner **DeepSeek-R1**, **Llama 3.3**, **Qwen 2.5 Coder**, **Gemma 2**, etc.\n2. **Confidentialité & Chiffrement E2E :** Toutes vos sessions peuvent être chiffrées en **AES-GCM 256-bit** avec votre mot de passe maître local. Zéro télémétrie.\n3. **Google AI Studio Workflow :**\n   - **Playground Chat & Freeform** avec instructions système, curseurs Temperature/Top-P/Top-K.\n   - **Mode Comparaison (Compare) :** Évaluez 2 modèles côte à côte sur le même prompt.\n   - **Générateur 'Get Code' :** Exportez vos prompts en Python, TypeScript, cURL, ou CLI Ollama.\n4. **Productivité & Intégrations :** Suivi de projets avec alertes de deadline, synchronisation Slack Webhook & Jira, et export instantané en **PDF / CSV / Markdown**.",
      timestamp: new Date(Date.now() - 60000).toISOString(),
      tokens: 312,
      latencyMs: 190,
      modelUsed: "deepseek-r1:7b",
    },
  ],
};

// Storage helper functions
export function loadSettings(): AppSettings {
  try {
    const saved = localStorage.getItem("local_ai_studio_settings");
    if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
  } catch (_e) {}
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: AppSettings) {
  try {
    localStorage.setItem("local_ai_studio_settings", JSON.stringify(settings));
  } catch (_e) {}
}

export function loadSessions(): ChatSession[] {
  try {
    const saved = localStorage.getItem("local_ai_studio_sessions");
    if (saved) return JSON.parse(saved);
  } catch (_e) {}
  return [INITIAL_CHAT];
}

export function saveSessions(sessions: ChatSession[]) {
  try {
    localStorage.setItem("local_ai_studio_sessions", JSON.stringify(sessions));
  } catch (_e) {}
}

export function loadProjects(): ProjectItem[] {
  try {
    const saved = localStorage.getItem("local_ai_studio_projects");
    if (saved) return JSON.parse(saved);
  } catch (_e) {}
  return INITIAL_PROJECTS;
}

export function saveProjects(projects: ProjectItem[]) {
  try {
    localStorage.setItem("local_ai_studio_projects", JSON.stringify(projects));
  } catch (_e) {}
}

export function loadModels(): ModelInfo[] {
  try {
    const saved = localStorage.getItem("local_ai_studio_models");
    if (saved) return JSON.parse(saved);
  } catch (_e) {}
  return DEFAULT_MODELS;
}

export function saveModels(models: ModelInfo[]) {
  try {
    localStorage.setItem("local_ai_studio_models", JSON.stringify(models));
  } catch (_e) {}
}

export function loadPlugins(): PluginExtension[] {
  try {
    const saved = localStorage.getItem("local_ai_studio_plugins");
    if (saved) return JSON.parse(saved);
  } catch (_e) {}
  return DEFAULT_PLUGINS;
}

export function savePlugins(plugins: PluginExtension[]) {
  try {
    localStorage.setItem("local_ai_studio_plugins", JSON.stringify(plugins));
  } catch (_e) {}
}

export function loadAnalytics(): AnalyticsMetric[] {
  try {
    const saved = localStorage.getItem("local_ai_studio_analytics");
    if (saved) return JSON.parse(saved);
  } catch (_e) {}
  return INITIAL_ANALYTICS;
}

export function saveAnalytics(analytics: AnalyticsMetric[]) {
  try {
    localStorage.setItem("local_ai_studio_analytics", JSON.stringify(analytics));
  } catch (_e) {}
}

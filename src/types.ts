export type ViewMode =
  | "chat"
  | "agents_cowork"
  | "freeform"
  | "compare"
  | "external_ai"
  | "autonomous"
  | "doctor"
  | "autopatch_deploy"
  | "canvas_studio"
  | "game_lab"
  | "portfolio_dossier"
  | "models"
  | "projects"
  | "analytics"
  | "settings";

export type LLMProvider = "ollama" | "lmstudio" | "webllm" | "custom_local" | "gemini_free";

export type PromptEngineeringStrategy =
  | "deep_research"
  | "expert_cot"
  | "benchmark_facts"
  | "code_architect"
  | "executive_roadmap"
  | "auto_optimizer";

export interface GroundingSource {
  title: string;
  uri: string;
  snippet?: string;
}

export interface ExternalConsultation {
  id: string;
  query: string;
  strategy: PromptEngineeringStrategy;
  depth: "standard" | "deep" | "exhaustive";
  webSearchEnabled: boolean;
  engineeredPrompt: string;
  response: string;
  groundingSources: GroundingSource[];
  keyTakeaways: string[];
  suggestedFollowUps: string[];
  timestamp: string;
  latencyMs: number;
}

export interface PromptOptimizationResult {
  originalPrompt: string;
  optimizedPrompt: string;
  strategyApplied: string;
  improvements: string[];
  qualityGainEstimate: string;
}

export interface SelfCorrectionStep {
  stepNumber: number;
  stageName: "draft" | "critique" | "refinement" | "verification";
  title: string;
  description: string;
  content: string;
  issuesDetected?: string[];
  correctionsApplied?: string[];
  qualityScore?: number; // e.g. 99.8%
  timestamp?: string;
}

export interface AbsoluteIntelligenceConfig {
  enabled: boolean;
  iterationCount: number; // 2 to 5 iterations
  rigorLevel: "balanced" | "extreme_code" | "math_logic" | "zero_hallucination" | "executive_editorial";
  autoDetectBugs: boolean;
  factCheckVerification: boolean;
  showCritiqueSteps: boolean;
  convergenceThreshold: number; // e.g. 99
}

export interface ModelInfo {
  id: string;
  name: string;
  provider: LLMProvider;
  size: string;
  params: string;
  quantization: string;
  vramEstimate: string;
  family: "llama" | "deepseek" | "qwen" | "gemma" | "mistral" | "phi" | "other";
  contextWindow: number;
  description: string;
  installed: boolean;
  downloadProgress?: number; // 0-100
  downloading?: boolean;
  capabilities: {
    vision: boolean;
    reasoning: boolean;
    coding: boolean;
    tools: boolean;
    json: boolean;
  };
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  reasoning?: string; // DeepSeek <think> reasoning
  timestamp: string;
  tokens?: number;
  latencyMs?: number;
  modelUsed?: string;
  attachments?: {
    name: string;
    type: string;
    url?: string;
    content?: string;
  }[];
  error?: string;
  // Absolute Intelligence & Self-Correction Metadata
  isAbsoluteIntelligence?: boolean;
  absoluteScore?: number;
  currentStepIndex?: number;
  totalSteps?: number;
  selfCorrectionSteps?: SelfCorrectionStep[];
  draftContent?: string;
  critiqueNotes?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  modelId: string;
  systemInstruction: string;
  parameters: ModelParameters;
  messages: ChatMessage[];
  folder?: string;
  isEncrypted?: boolean;
  projectId?: string;
}

export interface ModelParameters {
  temperature: number;
  topP: number;
  topK: number;
  maxOutputTokens: number;
  repeatPenalty: number;
  seed?: number;
  stopSequences: string[];
  responseFormat?: "text" | "json";
  jsonSchema?: string;
  absoluteIntelligence?: AbsoluteIntelligenceConfig;
}

export interface FewShotExample {
  id: string;
  input: string;
  output: string;
}

export interface FreeformPrompt {
  id: string;
  title: string;
  systemInstruction: string;
  userPrompt: string;
  examples: FewShotExample[];
  output: string;
  parameters: ModelParameters;
  modelId: string;
}

export interface ProjectItem {
  id: string;
  title: string;
  description: string;
  deadline: string;
  status: "todo" | "in_progress" | "review" | "done";
  priority: "low" | "medium" | "high" | "urgent";
  assignedTo?: string;
  tags: string[];
  linkedSessionId?: string;
  jiraKey?: string;
  slackNotified?: boolean;
  createdAt: string;
}

export interface SlackConfig {
  enabled: boolean;
  webhookUrl: string;
  channel: string;
  notifyOnDeadline: boolean;
  notifyOnExport: boolean;
}

export interface JiraConfig {
  enabled: boolean;
  domain: string;
  projectKey: string;
  email: string;
  autoFormatMarkdown: boolean;
}

export interface PluginExtension {
  id: string;
  name: string;
  description: string;
  icon: string;
  enabled: boolean;
  category: "productivity" | "developer" | "security" | "search";
  author: string;
  version: string;
}

export interface AnalyticsMetric {
  date: string;
  promptsCount: number;
  tokensGenerated: number;
  costSavedUsd: number;
  avgLatencyMs: number;
  avgTokensPerSec: number;
}

export interface SecuritySettings {
  e2eEncryptionEnabled: boolean;
  isVaultLocked: boolean;
  passphraseHash?: string;
  autoLockMinutes: number;
  localDataOnly: boolean;
  allowTelemetry: boolean;
  lastEncryptedBackup?: string;
}

export interface WhiteLabelConfig {
  appName: string;
  tagline: string;
  authorOrOrg: string;
  license: "MIT" | "Apache 2.0" | "Royalty-Free Open Commercial" | "CC-BY 4.0";
  hideAllVendorWatermarks: boolean;
  zeroTelemetryGuaranteed: boolean;
  customLogoSvg?: string;
}

export interface MarketOpportunity {
  id: string;
  searchTopic: string;
  niche: "saas_tool" | "tshirt_merch" | "game_template" | "ai_prompt_pack" | "automation_script" | "digital_guide";
  searchVolumeEstimate: string;
  trendStatus: "exploding" | "high_demand" | "steady" | "emerging";
  userPainPoint: string;
  proposedProductTitle: string;
  valueProposition: string;
  targetPriceUsd: number;
  fullDeliverableCodeOrSpec: string;
  marketingCopy: string;
  salesPitchHeadline: string;
  tags: string[];
  generatedAt: string;
  isPublishedLocally: boolean;
}

export interface DoctorSystemHealth {
  overallScore: number; // 0-100
  status: "optimal" | "degraded" | "critical";
  cpuUsagePct: number;
  ramUsageMb: number;
  ramTotalMb: number;
  gpuVramUsageMb: number;
  gpuVramTotalMb: number;
  zombieSocketsCleaned: number;
  cacheFragmentationPct: number;
  activeModelMemoryMb: number;
  securityLeakRisksCount: number;
  issuesDetected: {
    id: string;
    severity: "low" | "medium" | "high";
    category: "memory" | "vram" | "security" | "cache" | "threads";
    title: string;
    description: string;
    autoFixAvailable: boolean;
    fixed: boolean;
  }[];
  lastHealTimestamp?: string;
  healedItemsHistory: string[];
}

export interface CanvasGraphicAsset {
  id: string;
  title: string;
  category: "tshirt_logo" | "game_sprite" | "concept_art" | "texture_tile" | "ui_icon";
  prompt: string;
  svgContent?: string;
  pngDataUrl?: string;
  width: number;
  height: number;
  backgroundColor: string;
  tags: string[];
  createdAt: string;
  isVector: boolean;
}

export interface GameProjectConfig {
  id: string;
  gameType: "alien_swarm" | "gta2_city";
  title: string;
  highScore: number;
  customSettings: {
    difficulty: "easy" | "medium" | "hard" | "insane";
    playerSpeed: number;
    fireRate: number;
    spawnRate: number;
    soundEnabled: boolean;
    particlesDensity: number;
    flashlightConeSize?: number;
    trafficDensity?: number;
  };
  totalPlays: number;
  lastPlayedAt?: string;
}

export interface MasterPortfolioItem {
  id: string;
  type: "session" | "market_offer" | "game" | "graphic_asset" | "doctor_report" | "project_task";
  title: string;
  category: string;
  summary: string;
  content: string;
  date: string;
  tags: string[];
  metrics?: { [key: string]: string | number };
}

export interface AppSettings {
  ollamaHost: string;
  lmStudioHost: string;
  activeProvider: LLMProvider;
  theme: "dark" | "light" | "system";
  accentColor: "blue" | "emerald" | "violet" | "amber" | "rose";
  autoSave: boolean;
  offlineSync: boolean;
  density: "compact" | "cozy";
  defaultSystemPrompt: string;
  security: SecuritySettings;
  whiteLabel: WhiteLabelConfig;
  slack: SlackConfig;
  jira: JiraConfig;
}

export interface AutoPatchItem {
  id: string;
  title: string;
  targetComponent: string;
  severity: "critical" | "warning" | "optimal" | "fixed";
  status: "verified" | "patched" | "pending" | "scanning";
  description: string;
  fixApplied: string;
  timestamp: string;
}

export interface SystemIntegrityReport {
  score: number;
  isFullyIntact: boolean;
  totalChecks: number;
  passedChecks: number;
  autoPatchCount: number;
  lastPatchDate: string;
  modules: {
    name: string;
    status: "ok" | "patched" | "warning";
    details: string;
  }[];
  patches: AutoPatchItem[];
}

export interface DesktopInstallScript {
  fileName: string;
  extension: "bat" | "exe" | "sh" | "zip" | "vbs";
  type: "launcher" | "installer" | "uninstaller" | "autopatch" | "full_bundle";
  description: string;
  content: string;
  sizeKb: number;
}

export type AgentRole =
  | "reformulator"
  | "architect"
  | "coder"
  | "sentinel"
  | "orchestrator"
  | "creative_ideator"
  | "dropshipping_scout"
  | "marketplace_arb"
  | "promo_marketer"
  | "pricing_deal_hunter";

export interface AgentProfile {
  id: string;
  role: AgentRole;
  name: string;
  avatar: string;
  badge: string;
  color: string;
  description: string;
  responsibilities: string[];
  systemPrompt: string;
  guardrails: string[];
  isActive: boolean;
  category?: "dev" | "business" | "creative";
}

export interface DropshippingDeal {
  id: string;
  productTitle: string;
  niche: string;
  sourceSupplierPrice: number; // e.g. AliExpress / CJDropshipping
  recommendedSellPrice: number;
  competitorAveragePrice: number;
  competitorHighPrice: number;
  estimatedMarginPercent: number;
  estimatedNetProfit: number;
  demandScore: number; // 0 - 100
  competitionLevel: "faible" | "moyenne" | "haute" | "saturée";
  trendGrowth: string; // e.g. "+184% ce mois"
  whySellNow: string;
  supplierUrl: string;
  targetAudience: string;
  pricingStrategy: string;
  hookMarketing: string;
  adCopy: string;
  suggestedChannels: string[];
  viralTiktokVideoPrompt?: string;
  imageUrl?: string;
  searchGroundingSources?: { title: string; uri: string }[];
}

export interface MonetizableAIIdea {
  id: string;
  title: string;
  category: "micro_saas" | "ai_agency" | "content_machine" | "digital_product" | "ecommerce_bot";
  monthlyRevenuePotential: string;
  startupCost: string;
  timeToLaunch: string;
  difficulty: "facile" | "moyen" | "avancé";
  elevatorPitch: string;
  targetAudience: string;
  pricingTiers: { tier: string; price: string; description: string }[];
  unfairAdvantage: string;
  mvpTechStack: string[];
  acquisitionFunnel: string;
  monetizationPlan: string;
  validatedDealOpportunity?: string;
}

export interface MarketplaceListingAudit {
  id: string;
  platform: "amazon" | "ebay" | "shopify" | "vinted" | "etsy";
  productName: string;
  currentPrice: number;
  optimalPrice: number;
  priceDelta: number;
  priceDeltaPercent: number;
  buyBoxChance: number;
  demandVelocity: "forte" | "stable" | "en baisse";
  recommendation: string;
  marginAtOptimal: number;
  competitorOffers: { seller: string; price: number; rating: number; deliveryDays: number }[];
  promoTriggerDiscount?: number;
}

export interface CoWorkStep {
  id: string;
  agentRole: AgentRole;
  agentName: string;
  title: string;
  status: "pending" | "processing" | "completed" | "flagged";
  summary: string;
  detailedOutput: string;
  codeSnippets?: { language: string; filename?: string; code: string }[];
  clarificationQuestions?: string[];
  rephrasedOptions?: string[];
  guardrailScore?: number;
  timestamp: string;
}

export interface CoWorkSession {
  id: string;
  userRawPrompt: string;
  title: string;
  clarifiedSpecification: string;
  createdAt: string;
  status: "draft" | "running" | "completed" | "needs_user_input";
  steps: CoWorkStep[];
  finalDeliverable?: {
    explanation: string;
    architectureSummary: string;
    files: { path: string; code: string; language: string }[];
    qualityScore: number;
    antiSpaghettiCertified: boolean;
  };
}

export type SquadPreset = "all" | "dev_only" | "ecom_only" | "lean_duo";

export interface SwarmMetrics {
  totalAgents: number;
  activeAgents: number;
  powerPercentage: number;
  activeSquadPreset: SquadPreset;
  status: "optimal" | "balanced" | "eco";
  estimatedTokensPerSec: number;
  activeGuardrailsCount: number;
}

export interface CodeGuardrailRule {
  id: string;
  name: string;
  description: string;
  category: "architecture" | "anti_spaghetti" | "anti_deletion" | "typescript_rigor" | "clarification";
  enabled: boolean;
  strictness: "warning" | "blocking";
}

export interface ProfitCalculationResult {
  costOfGoods: number;
  sellingPrice: number;
  shippingCost: number;
  adCostPerAcquisition: number;
  platformFeePercent: number;
  platformFeeAmount: number;
  netProfit: number;
  marginPercent: number;
  breakEvenRoas: number;
  recommendation: string;
  verdict: "excellent" | "bon" | "moyen" | "dangereux";
}


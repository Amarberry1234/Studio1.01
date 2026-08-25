import express from "express";
import path from "path";
import os from "os";
import fs from "fs/promises";

const app = express();
const PORT = Number(process.env.NOVA_PORT || process.env.PORT || 3000);
const DEFAULT_OLLAMA = process.env.OLLAMA_HOST || "http://127.0.0.1:11434";
const DEFAULT_MODEL = process.env.NOVA_MODEL || "deepseek-r1:7b";

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

const cleanHost = (host?: string) => (host || DEFAULT_OLLAMA).replace(/\/+$/, "");
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const now = () => new Date().toISOString();

async function askOllama(
  messages: Array<{ role: string; content: string }>,
  options: { host?: string; model?: string; temperature?: number } = {}
): Promise<string> {
  const host = cleanHost(options.host);
  const model = options.model || DEFAULT_MODEL;
  const response = await fetch(`${host}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
      options: { temperature: options.temperature ?? 0.35 },
    }),
  });
  if (!response.ok) throw new Error(`Ollama ${response.status}: ${response.statusText}`);
  const data: any = await response.json();
  return data?.message?.content || data?.response || "";
}

function stripHtml(input: string): string {
  return input
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function unwrapDuckUrl(raw: string): string {
  try {
    const normalized = raw.startsWith("//") ? `https:${raw}` : raw;
    const url = new URL(normalized, "https://duckduckgo.com");
    const uddg = url.searchParams.get("uddg");
    return uddg ? decodeURIComponent(uddg) : url.toString();
  } catch {
    return raw;
  }
}

async function webSearch(query: string, maxResults = 8) {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 NovaLocalStudio/0.1",
      Accept: "text/html,application/xhtml+xml",
    },
  });
  if (!response.ok) throw new Error(`Web search ${response.status}`);
  const html = await response.text();
  const results: Array<{ title: string; uri: string; snippet: string }> = [];
  const re = /<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  for (const match of html.matchAll(re)) {
    const uri = unwrapDuckUrl(match[1]);
    if (!/^https?:\/\//i.test(uri)) continue;
    results.push({ title: stripHtml(match[2]), uri, snippet: "" });
    if (results.length >= maxResults) break;
  }
  return results;
}

async function fetchPageText(uri: string): Promise<string> {
  try {
    const response = await fetch(uri, {
      redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0 NovaLocalStudio/0.1" },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return "";
    const type = response.headers.get("content-type") || "";
    if (!type.includes("text/html") && !type.includes("text/plain")) return "";
    return stripHtml(await response.text()).slice(0, 12000);
  } catch {
    return "";
  }
}

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: now(),
    provider: "ollama",
    geminiConfigured: false,
    webResearch: true,
    desktop: process.env.NOVA_DESKTOP === "1",
  });
});

app.post("/api/ollama/tags", async (req, res) => {
  const host = cleanHost(req.body?.host);
  try {
    const response = await fetch(`${host}/api/tags`, { signal: AbortSignal.timeout(3000) });
    if (!response.ok) return res.json({ online: false, host, models: [], message: `HTTP ${response.status}` });
    const data: any = await response.json();
    res.json({ online: true, host, models: data.models || [] });
  } catch (err: any) {
    res.json({ online: false, host, models: [], message: err?.message || "Ollama inaccessible" });
  }
});

app.post("/api/ollama/chat", async (req, res) => {
  const { host, model, messages, options } = req.body || {};
  const target = cleanHost(host);
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const upstream = await fetch(`${target}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: model || DEFAULT_MODEL, messages: messages || [], options: options || {}, stream: true }),
    });
    if (!upstream.ok || !upstream.body) throw new Error(`Ollama ${upstream.status}: ${upstream.statusText}`);

    const reader = upstream.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed) res.write(`data: ${trimmed}\n\n`);
      }
    }
    if (buffer.trim()) res.write(`data: ${buffer.trim()}\n\n`);
    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err: any) {
    res.write(`data: ${JSON.stringify({ message: { role: "assistant", content: `Erreur Ollama: ${err?.message || "inconnue"}` }, done: true })}\n\n`);
    res.write("data: [DONE]\n\n");
    res.end();
  }
});

app.post("/api/ollama/pull", async (req, res) => {
  const host = cleanHost(req.body?.host);
  const name = req.body?.name;
  if (!name) return res.status(400).json({ error: "Nom de modèle requis" });
  res.setHeader("Content-Type", "text/event-stream");
  try {
    const upstream = await fetch(`${host}/api/pull`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, stream: true }),
    });
    if (!upstream.ok || !upstream.body) throw new Error(`Ollama ${upstream.status}`);
    const reader = upstream.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      for (const line of decoder.decode(value).split("\n")) {
        if (line.trim()) res.write(`data: ${line.trim()}\n\n`);
      }
    }
    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err: any) {
    res.write(`data: ${JSON.stringify({ status: "error", error: err?.message })}\n\n`);
    res.end();
  }
});

app.post("/api/external-ai/consult", async (req, res) => {
  const started = Date.now();
  const { query, strategy = "deep_research", depth = "deep", includeWebSearch = true, host, model } = req.body || {};
  if (!query?.trim()) return res.status(400).json({ error: "Question requise" });

  let sources: Array<{ title: string; uri: string; snippet: string }> = [];
  let researchBlock = "";
  if (includeWebSearch) {
    try {
      sources = await webSearch(query, depth === "exhaustive" ? 12 : depth === "deep" ? 8 : 5);
      const enriched = await Promise.all(sources.slice(0, 6).map(async (s, i) => ({ ...s, text: await fetchPageText(s.uri), n: i + 1 })));
      researchBlock = enriched.map((s) => `[${s.n}] ${s.title}\nURL: ${s.uri}\n${s.text || s.snippet}`).join("\n\n");
    } catch (err: any) {
      researchBlock = `Recherche web indisponible: ${err?.message || "erreur"}`;
    }
  }

  const engineeredPrompt = `Réponds en français à la demande suivante avec rigueur. Stratégie: ${strategy}. Profondeur: ${depth}.\n\nQUESTION:\n${query}\n\nSOURCES WEB:\n${researchBlock || "Aucune source web demandée."}\n\nRÈGLES: distingue les faits issus des sources de tes inférences. Quand tu utilises une source, cite [1], [2], etc. N'invente aucune source.`;

  try {
    const response = await askOllama([
      { role: "system", content: "Tu es Nova Research, un analyste local qui synthétise des sources web réelles sans inventer de citations." },
      { role: "user", content: engineeredPrompt },
    ], { host, model, temperature: 0.25 });

    res.json({
      id: `ext-${Date.now()}`,
      query,
      strategy,
      depth,
      webSearchEnabled: !!includeWebSearch,
      engineeredPrompt,
      response,
      groundingSources: sources,
      keyTakeaways: response.split(/\n+/).filter((x) => x.trim().length > 25).slice(0, 4),
      suggestedFollowUps: ["Comparer les sources contradictoires", "Chercher des données plus récentes", "Transformer cette analyse en plan d'action"],
      timestamp: now(),
      latencyMs: Date.now() - started,
    });
  } catch (err: any) {
    res.status(503).json({ error: `Le moteur local n'a pas répondu: ${err?.message || "Ollama hors ligne"}`, groundingSources: sources });
  }
});

app.post("/api/external-ai/optimize-prompt", async (req, res) => {
  const rawPrompt = String(req.body?.rawPrompt || "").trim();
  if (!rawPrompt) return res.status(400).json({ error: "Prompt requis" });
  try {
    const optimizedPrompt = await askOllama([
      { role: "system", content: "Réécris le prompt utilisateur en spécification claire, complète et directement exécutable. Retourne uniquement le prompt optimisé." },
      { role: "user", content: rawPrompt },
    ]);
    res.json({ originalPrompt: rawPrompt, optimizedPrompt, strategyApplied: "Nova Local Prompt Refiner", improvements: ["objectif clarifié", "contraintes explicites", "format de sortie défini"], qualityGainEstimate: "amélioration qualitative non chiffrée" });
  } catch (err: any) {
    res.status(503).json({ error: err?.message || "Ollama indisponible" });
  }
});

const AGENTS: any[] = [
  ["reformulator", "Clarifier & Prompt Reformulateur", "🎯", "INTERPRÈTE D'INTENTION", "amber"],
  ["architect", "Grand Architecte & Superviseur", "🏛️", "GARDE-FOU DU CODE", "blue"],
  ["coder", "Lead Full-Stack Implementer", "⚡", "DÉVELOPPEUR", "emerald"],
  ["sentinel", "Sentinelle Qualité", "🛡️", "AUDIT", "purple"],
  ["creative_ideator", "Agent Créatif", "💡", "IDÉATION", "amber"],
  ["dropshipping_scout", "Agent Dropshipping", "📦", "E-COMMERCE", "indigo"],
  ["marketplace_arb", "Agent Marketplace", "🛒", "ARBITRAGE", "blue"],
  ["pricing_deal_hunter", "Agent Prix", "📈", "PRICING", "emerald"],
  ["promo_marketer", "Agent Promotionnel", "🚀", "MARKETING", "rose"],
].map(([role, name, avatar, badge, color], i) => ({ id: `agent-${i + 1}`, role, name, avatar, badge, color, description: `${name} propulsé par le modèle Ollama local sélectionné.`, responsibilities: ["Analyser la demande", "Produire un résultat vérifiable"], systemPrompt: `Tu es ${name}.`, guardrails: ["Ne pas inventer de résultat d'exécution", "Signaler les limites"], isActive: i < 4 }));

let agentState = AGENTS.map((a) => ({ ...a }));
let rules = [
  { id: "rule-anti-spaghetti", name: "Anti-Spaghetti", description: "Favorise des modules petits et séparés.", category: "anti_spaghetti", enabled: true, strictness: "blocking" },
  { id: "rule-anti-deletion", name: "Anti-Suppression", description: "Ne supprime pas un fichier existant sans autorisation.", category: "anti_deletion", enabled: true, strictness: "blocking" },
  { id: "rule-typescript", name: "TypeScript strict", description: "Évite les any non justifiés.", category: "typescript_rigor", enabled: true, strictness: "warning" },
];

app.get("/api/agents/profiles", (_req, res) => res.json({ agents: agentState }));
app.get("/api/agents/rules", (_req, res) => res.json({ rules }));
app.post("/api/agents/toggle", (req, res) => {
  agentState = agentState.map((a) => a.id === req.body?.agentId ? { ...a, isActive: !!req.body?.isActive } : a);
  res.json({ success: true, agents: agentState });
});
app.post("/api/agents/preset", (req, res) => {
  const preset = req.body?.preset;
  agentState = agentState.map((a) => ({ ...a, isActive: preset === "all" ? true : preset === "dev_only" ? ["reformulator", "architect", "coder", "sentinel"].includes(a.role) : a.isActive }));
  res.json({ success: true, agents: agentState });
});
app.post("/api/agents/rules/toggle", (req, res) => {
  rules = rules.map((r) => r.id === req.body?.ruleId ? { ...r, enabled: !!req.body?.enabled } : r);
  res.json({ success: true, rules });
});

app.post("/api/agents/calculator/margin", (req, res) => {
  const cost = Number(req.body?.costOfGoods || 0);
  const price = Math.max(0.01, Number(req.body?.sellingPrice || 0.01));
  const shipping = Number(req.body?.shippingCost || 0);
  const cpa = Number(req.body?.adCostPerAcquisition || 0);
  const feePct = Number(req.body?.platformFeePercent || 0);
  const platformFeeAmount = Math.round(price * (feePct / 100) * 100) / 100;
  const netProfit = Math.round((price - cost - shipping - cpa - platformFeeAmount) * 100) / 100;
  const marginPercent = Math.round((netProfit / price) * 100);
  const gross = price - cost - shipping - platformFeeAmount;
  const breakEvenRoas = gross > 0 ? Math.round((price / gross) * 100) / 100 : 99;
  const verdict = marginPercent >= 50 ? "excellent" : marginPercent >= 25 ? "bon" : marginPercent > 0 ? "moyen" : "dangereux";
  res.json({ success: true, calculation: { costOfGoods: cost, sellingPrice: price, shippingCost: shipping, adCostPerAcquisition: cpa, platformFeePercent: feePct, platformFeeAmount, netProfit, marginPercent, breakEvenRoas, verdict, recommendation: marginPercent > 0 ? "Marge positive: valide ensuite avec les frais et données réelles de ta plateforme." : "Marge négative: revois prix, coût produit ou acquisition." } });
});

app.post("/api/agents/rephrase", async (req, res) => {
  const rawPrompt = String(req.body?.rawPrompt || "").trim();
  if (!rawPrompt) return res.status(400).json({ error: "Prompt vide" });
  try {
    const text = await askOllama([{ role: "system", content: "Clarifie la demande en une spécification concise, puis donne 3 formulations améliorées et 2 questions de cadrage." }, { role: "user", content: rawPrompt }]);
    res.json({ success: true, spec: { originalPrompt: rawPrompt, clarityScore: 80, ambiguityScore: 20, detectedGoal: text.split("\n")[0] || rawPrompt, rephrasedOptions: text.split("\n").filter(Boolean).slice(0, 3), clarificationQuestions: ["Quel résultat final doit être produit?", "Quelles contraintes sont obligatoires?"], recommendedStrategy: "Nova CoWork réel via Ollama" } });
  } catch (err: any) {
    res.status(503).json({ error: err?.message || "Ollama indisponible" });
  }
});

app.post("/api/agents/cowork/run", async (req, res) => {
  const userPrompt = String(req.body?.userPrompt || "").trim();
  if (!userPrompt) return res.status(400).json({ error: "Prompt requis" });
  const host = req.body?.host;
  const model = req.body?.model;
  try {
    const reformulated = await askOllama([{ role: "system", content: "Reformule cette demande en spécification technique claire. Ne prétends pas avoir exécuté de code." }, { role: "user", content: userPrompt }], { host, model });
    const architecture = await askOllama([{ role: "system", content: "Tu es architecte logiciel. À partir de la spécification, propose une architecture concrète, fichiers et tests." }, { role: "user", content: reformulated }], { host, model });
    const code = await askOllama([{ role: "system", content: "Tu es développeur senior. Produit le code complet demandé à partir de la spécification et de l'architecture. N'invente pas des tests exécutés." }, { role: "user", content: `${reformulated}\n\nARCHITECTURE:\n${architecture}` }], { host, model, temperature: 0.2 });
    const audit = await askOllama([{ role: "system", content: "Tu es relecteur qualité. Audite le code fourni. Liste les risques, erreurs probables et tests à exécuter. Ne donne aucun score inventé." }, { role: "user", content: code.slice(0, 24000) }], { host, model, temperature: 0.15 });
    const mkStep = (n: number, role: string, name: string, title: string, output: string) => ({ id: `step-${n}-${Date.now()}`, agentRole: role, agentName: name, title, status: "completed", summary: output.slice(0, 240), detailedOutput: output, timestamp: now() });
    const steps: any[] = [
      mkStep(1, "reformulator", "Clarifier", "1. Spécification", reformulated),
      mkStep(2, "architect", "Architecte", "2. Architecture", architecture),
      { ...mkStep(3, "coder", "Coder", "3. Code", code), codeSnippets: [{ language: "text", filename: "generated-output.txt", code }] },
      mkStep(4, "sentinel", "Sentinelle", "4. Audit", audit),
    ];
    res.json({ success: true, sessionId: `cowork-${Date.now()}`, title: userPrompt.slice(0, 80), steps, finalDeliverable: { explanation: audit, architectureSummary: architecture, files: [{ path: "generated-output.txt", code, language: "text" }], qualityScore: null, antiSpaghettiCertified: false } });
  } catch (err: any) {
    res.status(503).json({ error: err?.message || "Ollama indisponible" });
  }
});

app.post("/api/agents/creative-ideas", async (req, res) => {
  const niche = String(req.body?.niche || "IA locale");
  try {
    const output = await askOllama([{ role: "system", content: "Génère 3 idées de produit réalistes. Pas de chiffres de marché inventés. Retourne du JSON si possible." }, { role: "user", content: niche }]);
    res.json({ success: true, ideas: [{ id: `idea-${Date.now()}`, title: `Analyse locale: ${niche}`, niche, problemSolved: "Voir analyse générée", targetCustomer: "À définir", mvpTechStack: ["Nova", "Ollama"], acquisitionFunnel: output, monetizationPlan: output, validatedDealOpportunity: output }] });
  } catch (err: any) { res.status(503).json({ error: err?.message }); }
});

app.post("/api/agents/dropshipping/deals", async (req, res) => {
  const category = String(req.body?.category || "tous");
  try {
    const search = await webSearch(`${category} produits tendances ecommerce`, 5).catch(() => []);
    res.json({ success: true, deals: search.map((s, i) => ({ id: `deal-${Date.now()}-${i}`, niche: category, productTitle: s.title, sourceSupplierPrice: 0, recommendedSellPrice: 0, competitorHighPrice: 0, estimatedNetMarginPercent: 0, demandScore: 0, trendGrowthPercent: 0, saturationLevel: "unknown", whySellNow: s.snippet || "Source web trouvée; prix à vérifier manuellement.", hookMarketing: "À générer après validation du produit", supplierName: "Source web", supplierUrl: s.uri })) });
  } catch (err: any) { res.status(500).json({ error: err?.message }); }
});

app.post("/api/agents/marketplace/audit", (req, res) => {
  const productName = String(req.body?.productName || "Produit");
  const currentPrice = Number(req.body?.currentPrice || 0);
  const platform = String(req.body?.platform || "marketplace");
  res.json({ success: true, audit: { id: `audit-${Date.now()}`, platform, productName, currentPrice, optimalPrice: currentPrice, priceDelta: 0, priceDeltaPercent: 0, buyBoxChance: 0, demandVelocity: "unknown", recommendation: "Aucune donnée marketplace temps réel n'est inventée. Utilise la recherche web pour valider le prix réel.", marginAtOptimal: 0, competitorOffers: [], promoTriggerDiscount: 0 } });
});

app.post("/api/agents/promo/generate", async (req, res) => {
  const product = String(req.body?.productTitle || "Produit");
  const audience = String(req.body?.targetAudience || "client cible");
  try {
    const text = await askOllama([{ role: "system", content: "Crée une campagne marketing honnête: 4 hooks, 2 textes pub et un script vidéo 15 secondes. N'invente pas de témoignages, ventes ou garanties." }, { role: "user", content: `Produit: ${product}\nAudience: ${audience}` }]);
    res.json({ success: true, campaign: { productTitle: product, targetAudience: audience, hooksViral: text.split("\n").filter(Boolean).slice(0, 4), adCopies: [{ platform: "Social", headline: product, body: text, callToAction: "En savoir plus" }], bundleOffers: [], tiktokScript15s: text } });
  } catch (err: any) { res.status(503).json({ error: err?.message }); }
});

app.get("/api/doctor/diagnose", (_req, res) => {
  const mem = process.memoryUsage();
  const totalMb = Math.round(os.totalmem() / 1024 / 1024);
  const freeMb = Math.round(os.freemem() / 1024 / 1024);
  const usedMb = totalMb - freeMb;
  const load = os.loadavg()[0] || 0;
  const cpuPct = clamp(Math.round((load / Math.max(1, os.cpus().length)) * 100), 0, 100);
  res.json({ overallScore: 100 - clamp(Math.round((usedMb / totalMb) * 70 + cpuPct * 0.3), 0, 95), status: usedMb / totalMb > 0.9 ? "critical" : usedMb / totalMb > 0.75 ? "degraded" : "optimal", cpuUsagePct: cpuPct, ramUsageMb: usedMb, ramTotalMb: totalMb, gpuVramUsageMb: 0, gpuVramTotalMb: 0, zombieSocketsCleaned: 0, cacheFragmentationPct: 0, activeModelMemoryMb: 0, securityLeakRisksCount: 0, issuesDetected: [], healedItemsHistory: [] });
});

app.post("/api/doctor/heal", async (_req, res) => {
  const before = process.memoryUsage().heapUsed;
  const gc = (global as any).gc;
  if (typeof gc === "function") gc();
  const after = process.memoryUsage().heapUsed;
  res.json({ success: true, freedMemoryMb: Math.max(0, Math.round((before - after) / 1024 / 1024)), message: "Nettoyage limité au processus Nova; aucun autre programme Windows n'a été fermé." });
});

const snapshots: any[] = [];
app.post("/api/autopatch/run", (req, res) => {
  if (req.body?.userAuthorized !== true) return res.status(403).json({ success: false, message: "Autorisation requise" });
  const snap = { id: `snapshot-${Date.now()}`, timestamp: now(), label: "Point de contrôle Nova", filesProtected: 0 };
  snapshots.unshift(snap);
  res.json({ success: true, dryRun: true, snapshot: snap, message: "Audit seulement dans cette version; aucun fichier n'a été modifié automatiquement." });
});
app.get("/api/autopatch/snapshots", (_req, res) => res.json({ snapshots }));
app.post("/api/autopatch/rollback", (_req, res) => res.json({ success: false, message: "Rollback fichier non activé dans v0.1 afin d'éviter toute suppression accidentelle." }));

app.post("/api/integrations/slack", async (req, res) => {
  const webhookUrl = String(req.body?.webhookUrl || "");
  if (!webhookUrl) return res.json({ success: false, error: "Webhook manquant" });
  try {
    const r = await fetch(webhookUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: req.body?.message || "Nova Local Studio" }) });
    res.json({ success: r.ok, status: r.status });
  } catch (err: any) { res.status(500).json({ success: false, error: err?.message }); }
});
app.post("/api/integrations/jira", (req, res) => res.json({ success: true, simulated: true, formatted: { summary: req.body?.summary || "", description: req.body?.description || "", priority: req.body?.priority || "Medium" } }));

app.get("/api/media/status", async (_req, res) => {
  const check = async (url: string) => { try { const r = await fetch(url, { signal: AbortSignal.timeout(1500) }); return r.ok; } catch { return false; } };
  const [stableDiffusion, comfyui] = await Promise.all([check("http://127.0.0.1:7860/sdapi/v1/sd-models"), check("http://127.0.0.1:8188/system_stats")]);
  res.json({ stableDiffusion, comfyui });
});

app.post("/api/media/image/generate", async (req, res) => {
  const host = String(req.body?.host || "http://127.0.0.1:7860").replace(/\/+$/, "");
  try {
    const r = await fetch(`${host}/sdapi/v1/txt2img`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: req.body?.prompt || "", negative_prompt: req.body?.negativePrompt || "", steps: clamp(Number(req.body?.steps || 24), 1, 80), width: clamp(Number(req.body?.width || 768), 256, 2048), height: clamp(Number(req.body?.height || 768), 256, 2048) }) });
    if (!r.ok) throw new Error(`Stable Diffusion ${r.status}`);
    const data: any = await r.json();
    res.json({ success: true, images: data.images || [] });
  } catch (err: any) { res.status(503).json({ success: false, error: `Moteur image local indisponible: ${err?.message}` }); }
});

app.post("/api/media/video/generate", async (req, res) => {
  const host = String(req.body?.host || "http://127.0.0.1:8188").replace(/\/+$/, "");
  if (!req.body?.workflow) return res.status(400).json({ success: false, error: "Un workflow ComfyUI vidéo est requis dans v0.1." });
  try {
    const r = await fetch(`${host}/prompt`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: req.body.workflow }) });
    if (!r.ok) throw new Error(`ComfyUI ${r.status}`);
    res.json({ success: true, ...(await r.json() as any) });
  } catch (err: any) { res.status(503).json({ success: false, error: err?.message }); }
});

app.post("/api/games/generate", async (req, res) => {
  const prompt = String(req.body?.prompt || "").trim();
  if (!prompt) return res.status(400).json({ error: "Description du jeu requise" });
  try {
    const html = await askOllama([{ role: "system", content: "Crée un jeu jouable complet dans UN fichier HTML autonome avec CSS et JavaScript inline. Retourne uniquement le HTML, sans markdown." }, { role: "user", content: prompt }], { host: req.body?.host, model: req.body?.model, temperature: 0.45 });
    const dataDir = process.env.NOVA_DATA_DIR || path.join(process.cwd(), "nova-data");
    const dir = path.join(dataDir, "generated-games");
    await fs.mkdir(dir, { recursive: true });
    const file = path.join(dir, `game-${Date.now()}.html`);
    await fs.writeFile(file, html.replace(/^```html\s*/i, "").replace(/```\s*$/i, ""), "utf8");
    res.json({ success: true, file, html });
  } catch (err: any) { res.status(503).json({ error: err?.message || "Ollama indisponible" }); }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer } = await import("vite");
    const vite = await createServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = process.env.NOVA_DIST_DIR || path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => res.sendFile(path.join(distPath, "index.html")));
  }
  app.listen(PORT, "127.0.0.1", () => console.log(`Nova Local Studio: http://127.0.0.1:${PORT}`));
}

startServer().catch((err) => {
  console.error("Nova server failed:", err);
  process.exitCode = 1;
});

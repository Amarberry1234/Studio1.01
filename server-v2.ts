import express from "express";
import path from "path";
import os from "os";
import fs from "fs/promises";
import { spawn } from "child_process";

const app = express();
const PORT = Number(process.env.NOVA_PORT || process.env.PORT || 3000);
const DEFAULT_OLLAMA = process.env.OLLAMA_HOST || "http://127.0.0.1:11434";
const DEFAULT_MODEL = process.env.NOVA_MODEL || "";

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

const now = () => new Date().toISOString();
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const cleanHost = (host?: string) => String(host || DEFAULT_OLLAMA).trim().replace(/\/+$/, "");
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "Local";
  const gb = bytes / 1024 / 1024 / 1024;
  return gb >= 1 ? `${gb.toFixed(gb >= 10 ? 0 : 1)} GB` : `${Math.round(bytes / 1024 / 1024)} MB`;
}

async function fetchWithTimeout(url: string, init: RequestInit = {}, timeoutMs = 5000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function probeOllama(host: string, timeoutMs = 1800) {
  const started = Date.now();
  try {
    const response = await fetchWithTimeout(`${cleanHost(host)}/api/tags`, {}, timeoutMs);
    if (!response.ok) {
      return { online: false, host: cleanHost(host), models: [] as any[], latencyMs: Date.now() - started, error: `HTTP ${response.status}` };
    }
    const data: any = await response.json();
    return { online: true, host: cleanHost(host), models: Array.isArray(data?.models) ? data.models : [], latencyMs: Date.now() - started, error: "" };
  } catch (err: any) {
    return { online: false, host: cleanHost(host), models: [] as any[], latencyMs: Date.now() - started, error: err?.name === "AbortError" ? "timeout" : String(err?.message || err || "inaccessible") };
  }
}

let lastOllamaStartAttempt = 0;
let ollamaStartedByNova = false;

async function existingOllamaExecutables(): Promise<string[]> {
  const values = new Set<string>();
  if (process.platform === "win32") {
    const local = process.env.LOCALAPPDATA;
    const programFiles = process.env.ProgramFiles;
    const programFilesX86 = process.env["ProgramFiles(x86)"];
    if (local) values.add(path.join(local, "Programs", "Ollama", "ollama.exe"));
    if (local) values.add(path.join(local, "Ollama", "ollama.exe"));
    if (programFiles) values.add(path.join(programFiles, "Ollama", "ollama.exe"));
    if (programFilesX86) values.add(path.join(programFilesX86, "Ollama", "ollama.exe"));
  } else {
    values.add("/usr/local/bin/ollama");
    values.add("/usr/bin/ollama");
    values.add("/opt/homebrew/bin/ollama");
  }

  const found: string[] = [];
  for (const candidate of values) {
    try {
      await fs.access(candidate);
      found.push(candidate);
    } catch {}
  }
  return found;
}

async function spawnOllamaServe(): Promise<{ started: boolean; executable?: string; error?: string }> {
  if (Date.now() - lastOllamaStartAttempt < 20000) return { started: false, error: "start already attempted recently" };
  lastOllamaStartAttempt = Date.now();

  const absoluteCandidates = await existingOllamaExecutables();
  const candidates = [...absoluteCandidates, process.platform === "win32" ? "ollama.exe" : "ollama"];

  for (const executable of candidates) {
    const result = await new Promise<{ ok: boolean; error?: string }>((resolve) => {
      try {
        const child = spawn(executable, ["serve"], {
          detached: true,
          windowsHide: true,
          stdio: "ignore",
          env: { ...process.env, OLLAMA_HOST: process.env.OLLAMA_HOST || "127.0.0.1:11434" },
        });
        const timer = setTimeout(() => {
          child.unref();
          resolve({ ok: true });
        }, 300);
        child.once("error", (err) => {
          clearTimeout(timer);
          resolve({ ok: false, error: err.message });
        });
        child.once("spawn", () => {
          // process successfully created; leave a short grace period before probing
        });
      } catch (err: any) {
        resolve({ ok: false, error: err?.message || String(err) });
      }
    });

    if (result.ok) {
      ollamaStartedByNova = true;
      return { started: true, executable };
    }
  }
  return { started: false, error: "ollama executable not found" };
}

async function discoverOllama(preferredHost?: string, allowStart = true) {
  const candidates = Array.from(new Set([
    cleanHost(preferredHost),
    cleanHost(DEFAULT_OLLAMA),
    "http://127.0.0.1:11434",
    "http://localhost:11434",
  ].filter(Boolean)));

  const attempts: any[] = [];
  for (const host of candidates) {
    const probe = await probeOllama(host);
    attempts.push(probe);
    if (probe.online) return { ...probe, attempts, autostarted: false };
  }

  if (allowStart) {
    const started = await spawnOllamaServe();
    if (started.started) {
      for (let i = 0; i < 20; i++) {
        await sleep(i < 5 ? 300 : 650);
        for (const host of candidates) {
          const probe = await probeOllama(host, 1200);
          if (probe.online) return { ...probe, attempts: [...attempts, probe], autostarted: true, executable: started.executable };
        }
      }
    }
    return { online: false, host: candidates[0], models: [] as any[], attempts, autostarted: false, startError: started.error };
  }

  return { online: false, host: candidates[0], models: [] as any[], attempts, autostarted: false };
}

function ollamaModelName(model: any): string {
  return String(model?.name || model?.model || "").trim();
}

function chooseModel(models: any[], requested?: string): string {
  const names = models.map(ollamaModelName).filter(Boolean);
  const req = String(requested || "").trim();
  if (req && names.includes(req)) return req;
  if (req) {
    const base = req.split(":")[0].toLowerCase();
    const close = names.find((n) => n.toLowerCase().split(":")[0] === base);
    if (close) return close;
  }
  if (DEFAULT_MODEL && names.includes(DEFAULT_MODEL)) return DEFAULT_MODEL;
  const preferred = ["gpt-oss", "qwen", "deepseek", "llama", "mistral", "gemma", "phi"];
  for (const key of preferred) {
    const found = names.find((name) => name.toLowerCase().includes(key));
    if (found) return found;
  }
  return names[0] || req || DEFAULT_MODEL || "";
}

async function resolvedOllama(preferredHost?: string, requestedModel?: string, allowStart = true) {
  const runtime = await discoverOllama(preferredHost, allowStart);
  if (!runtime.online) return { ...runtime, selectedModel: "" };
  return { ...runtime, selectedModel: chooseModel(runtime.models, requestedModel) };
}

async function askOllama(
  messages: Array<{ role: string; content: string }>,
  options: { host?: string; model?: string; temperature?: number } = {}
): Promise<{ text: string; host: string; model: string }> {
  const runtime = await resolvedOllama(options.host, options.model, true);
  if (!runtime.online) throw new Error(`Ollama introuvable. ${runtime.startError || runtime.attempts?.map((a: any) => `${a.host}: ${a.error}`).join(" | ") || ""}`.trim());
  if (!runtime.selectedModel) throw new Error("Ollama est en ligne, mais aucun modèle n'est installé.");

  const response = await fetchWithTimeout(`${runtime.host}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: runtime.selectedModel,
      messages,
      stream: false,
      options: { temperature: options.temperature ?? 0.35 },
    }),
  }, 180000);
  if (!response.ok) throw new Error(`Ollama ${response.status}: ${response.statusText}`);
  const data: any = await response.json();
  return { text: data?.message?.content || data?.response || "", host: runtime.host, model: runtime.selectedModel };
}

function stripHtml(input: string): string {
  return input
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
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

type SearchResult = { title: string; uri: string; snippet: string; provider?: string };

function uniqueResults(items: SearchResult[], maxResults: number): SearchResult[] {
  const seen = new Set<string>();
  const out: SearchResult[] = [];
  for (const item of items) {
    const uri = String(item.uri || "").trim();
    if (!/^https?:\/\//i.test(uri)) continue;
    const key = uri.replace(/#.*$/, "").replace(/\/$/, "").toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ ...item, title: stripHtml(item.title || uri), snippet: stripHtml(item.snippet || "") });
    if (out.length >= maxResults) break;
  }
  return out;
}

async function searchDuckDuckGo(query: string, maxResults: number): Promise<SearchResult[]> {
  const endpoints = [
    `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
    `https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(query)}`,
  ];
  for (const url of endpoints) {
    try {
      const response = await fetchWithTimeout(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36",
          Accept: "text/html,application/xhtml+xml",
          "Accept-Language": "fr-CA,fr;q=0.9,en;q=0.8",
        },
      }, 9000);
      if (!response.ok) continue;
      const html = await response.text();
      const results: SearchResult[] = [];
      for (const match of html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
        const attrs = match[1] || "";
        if (!/result__a|result-link/i.test(attrs)) continue;
        const hrefMatch = attrs.match(/href=["']([^"']+)["']/i);
        if (!hrefMatch) continue;
        const uri = unwrapDuckUrl(hrefMatch[1]);
        if (!/^https?:\/\//i.test(uri)) continue;
        results.push({ title: stripHtml(match[2]), uri, snippet: "", provider: "DuckDuckGo" });
        if (results.length >= maxResults) break;
      }
      if (results.length) return uniqueResults(results, maxResults);
    } catch {}
  }
  return [];
}

async function searchBing(query: string, maxResults: number): Promise<SearchResult[]> {
  try {
    const response = await fetchWithTimeout(`https://www.bing.com/search?q=${encodeURIComponent(query)}&count=${maxResults + 4}&setlang=fr-CA`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "fr-CA,fr;q=0.9,en;q=0.8",
      },
    }, 9000);
    if (!response.ok) return [];
    const html = await response.text();
    const results: SearchResult[] = [];
    for (const block of html.matchAll(/<li[^>]*class=["'][^"']*b_algo[^"']*["'][^>]*>([\s\S]*?)<\/li>/gi)) {
      const body = block[1];
      const link = body.match(/<h2[^>]*>\s*<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i) || body.match(/<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i);
      if (!link || !/^https?:\/\//i.test(link[1])) continue;
      const p = body.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
      results.push({ title: stripHtml(link[2]), uri: link[1], snippet: p ? stripHtml(p[1]) : "", provider: "Bing" });
      if (results.length >= maxResults) break;
    }
    return uniqueResults(results, maxResults);
  } catch {
    return [];
  }
}

async function searchWikipedia(query: string, maxResults: number): Promise<SearchResult[]> {
  const hosts = ["fr.wikipedia.org", "en.wikipedia.org"];
  for (const host of hosts) {
    try {
      const url = `https://${host}/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=${maxResults}&format=json&utf8=1&origin=*`;
      const response = await fetchWithTimeout(url, { headers: { "User-Agent": "NovaLocalStudio/0.2" } }, 9000);
      if (!response.ok) continue;
      const data: any = await response.json();
      const items = Array.isArray(data?.query?.search) ? data.query.search : [];
      const results = items.map((item: any) => ({
        title: String(item.title || "Wikipedia"),
        uri: `https://${host}/wiki/${encodeURIComponent(String(item.title || "").replace(/ /g, "_"))}`,
        snippet: stripHtml(String(item.snippet || "")),
        provider: "Wikipedia",
      }));
      if (results.length) return uniqueResults(results, maxResults);
    } catch {}
  }
  return [];
}

async function webSearch(query: string, maxResults = 8): Promise<SearchResult[]> {
  const combined: SearchResult[] = [];
  const ddg = await searchDuckDuckGo(query, maxResults);
  combined.push(...ddg);
  if (combined.length < maxResults) combined.push(...await searchBing(query, maxResults));
  if (combined.length < Math.min(3, maxResults)) combined.push(...await searchWikipedia(query, maxResults));
  return uniqueResults(combined, maxResults);
}

function isPrivateNetworkUrl(uri: string): boolean {
  try {
    const u = new URL(uri);
    const h = u.hostname.toLowerCase();
    return h === "localhost" || h === "127.0.0.1" || h === "::1" || /^10\./.test(h) || /^192\.168\./.test(h) || /^172\.(1[6-9]|2\d|3[0-1])\./.test(h);
  } catch {
    return true;
  }
}

async function fetchPageText(uri: string): Promise<string> {
  if (isPrivateNetworkUrl(uri)) return "";
  try {
    const response = await fetchWithTimeout(uri, {
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) NovaLocalStudio/0.2",
        Accept: "text/html,text/plain,application/xhtml+xml",
        "Accept-Language": "fr-CA,fr;q=0.9,en;q=0.8",
      },
    }, 10000);
    if (!response.ok) return "";
    const type = response.headers.get("content-type") || "";
    if (!type.includes("text/html") && !type.includes("text/plain") && !type.includes("application/xhtml+xml")) return "";
    return stripHtml(await response.text()).slice(0, 16000);
  } catch {
    return "";
  }
}

async function networkCheck(url: string) {
  const started = Date.now();
  try {
    const r = await fetchWithTimeout(url, { headers: { "User-Agent": "NovaLocalStudio/0.2" } }, 7000);
    return { url, ok: r.ok, status: r.status, latencyMs: Date.now() - started, error: "" };
  } catch (err: any) {
    return { url, ok: false, status: 0, latencyMs: Date.now() - started, error: err?.name === "AbortError" ? "timeout" : String(err?.message || err) };
  }
}

app.get("/api/health", async (_req, res) => {
  const ollama = await discoverOllama(undefined, false);
  res.json({
    status: "ok",
    timestamp: now(),
    provider: "ollama",
    geminiConfigured: false,
    webResearch: true,
    desktop: process.env.NOVA_DESKTOP === "1",
    ollamaOnline: !!ollama.online,
    ollamaHost: ollama.host,
    ollamaModels: ollama.models?.length || 0,
    version: "0.2.0",
  });
});

app.get("/api/network/diagnose", async (_req, res) => {
  const checks = await Promise.all([
    networkCheck("https://example.com"),
    networkCheck("https://lite.duckduckgo.com/lite/"),
    networkCheck("https://www.bing.com/"),
    networkCheck("https://fr.wikipedia.org/w/api.php?action=query&meta=siteinfo&format=json&origin=*"),
  ]);
  const testSearch = await webSearch("actualité technologie", 3).catch(() => []);
  res.json({ online: checks.some((c) => c.ok), searchWorking: testSearch.length > 0, resultCount: testSearch.length, checks, sampleResults: testSearch });
});

app.post("/api/ollama/discover", async (req, res) => {
  const runtime = await resolvedOllama(req.body?.host, req.body?.model, req.body?.autoStart !== false);
  res.json({ ...runtime, startedByNova: ollamaStartedByNova });
});

app.post("/api/ollama/tags", async (req, res) => {
  const runtime = await resolvedOllama(req.body?.host, req.body?.model, true);
  if (!runtime.online) {
    return res.json({ online: false, host: runtime.host, models: [], selectedModel: "", message: runtime.startError || "Ollama inaccessible", attempts: runtime.attempts || [] });
  }
  res.json({ online: true, host: runtime.host, models: runtime.models, selectedModel: runtime.selectedModel, autostarted: runtime.autostarted, startedByNova: ollamaStartedByNova });
});

app.post("/api/ollama/chat", async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const runtime = await resolvedOllama(req.body?.host, req.body?.model, true);
    if (!runtime.online) throw new Error(`Ollama inaccessible. ${runtime.startError || "Vérifie que Ollama est installé."}`);
    if (!runtime.selectedModel) throw new Error("Ollama est connecté, mais aucun modèle n'est installé. Installe un modèle dans l'onglet Modèles.");

    const upstream = await fetch(`${runtime.host}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: runtime.selectedModel,
        messages: Array.isArray(req.body?.messages) ? req.body.messages : [],
        options: req.body?.options || {},
        stream: true,
      }),
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
    res.write(`data: ${JSON.stringify({ message: { role: "assistant", content: `Erreur Ollama: ${err?.message || "inconnue"}` }, done: true, error: true })}\n\n`);
    res.write("data: [DONE]\n\n");
    res.end();
  }
});

app.post("/api/ollama/pull", async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  try {
    const name = String(req.body?.name || "").trim();
    if (!name) throw new Error("Nom de modèle requis");
    const runtime = await resolvedOllama(req.body?.host, undefined, true);
    if (!runtime.online) throw new Error("Ollama inaccessible");
    const upstream = await fetch(`${runtime.host}/api/pull`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, stream: true }),
    });
    if (!upstream.ok || !upstream.body) throw new Error(`Ollama ${upstream.status}`);
    const reader = upstream.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) if (line.trim()) res.write(`data: ${line.trim()}\n\n`);
    }
    if (buffer.trim()) res.write(`data: ${buffer.trim()}\n\n`);
    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err: any) {
    res.write(`data: ${JSON.stringify({ status: "error", error: err?.message || "inconnue" })}\n\n`);
    res.write("data: [DONE]\n\n");
    res.end();
  }
});

app.post("/api/ollama/delete", async (req, res) => {
  try {
    const name = String(req.body?.name || "").trim();
    if (!name) return res.status(400).json({ success: false, error: "Nom de modèle requis" });
    const runtime = await resolvedOllama(req.body?.host, undefined, true);
    if (!runtime.online) return res.status(503).json({ success: false, error: "Ollama inaccessible" });
    const r = await fetch(`${runtime.host}/api/delete`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
    res.json({ success: r.ok, status: r.status, error: r.ok ? "" : await r.text() });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || String(err) });
  }
});

app.post("/api/ollama/create", async (req, res) => {
  try {
    const name = String(req.body?.name || "").trim();
    const baseModel = String(req.body?.baseModel || "").trim();
    const systemPrompt = String(req.body?.systemPrompt || "").trim();
    const temperature = Number(req.body?.temperature ?? 0.3);
    if (!name || !baseModel) return res.status(400).json({ success: false, error: "Nom et modèle de base requis" });
    const runtime = await resolvedOllama(req.body?.host, baseModel, true);
    if (!runtime.online) return res.status(503).json({ success: false, error: "Ollama inaccessible" });
    const modelfile = `FROM ${baseModel}\nPARAMETER temperature ${clamp(temperature, 0, 2)}\n${systemPrompt ? `SYSTEM ${JSON.stringify(systemPrompt)}` : ""}`;
    const r = await fetch(`${runtime.host}/api/create`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, modelfile, stream: false }) });
    const text = await r.text();
    res.status(r.ok ? 200 : r.status).json({ success: r.ok, name, response: text });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || String(err) });
  }
});

app.post("/api/external-ai/consult", async (req, res) => {
  const started = Date.now();
  const query = String(req.body?.query || "").trim();
  const strategy = String(req.body?.strategy || "deep_research");
  const depth = String(req.body?.depth || "deep");
  const includeWebSearch = req.body?.includeWebSearch !== false;
  if (!query) return res.status(400).json({ error: "Question requise" });

  let sources: SearchResult[] = [];
  let researchBlock = "";
  let searchError = "";
  if (includeWebSearch) {
    try {
      const limit = depth === "exhaustive" ? 12 : depth === "deep" ? 8 : 5;
      sources = await webSearch(query, limit);
      if (!sources.length) throw new Error("Aucun résultat retourné par les moteurs disponibles");
      const enriched = await Promise.all(sources.slice(0, 6).map(async (s, i) => ({ ...s, text: await fetchPageText(s.uri), n: i + 1 })));
      researchBlock = enriched.map((s) => `[${s.n}] ${s.title}\nURL: ${s.uri}\n${s.text || s.snippet || "Contenu non lisible; utilise le titre et l'URL seulement."}`).join("\n\n");
    } catch (err: any) {
      searchError = err?.message || "Erreur de recherche";
    }
  }

  const engineeredPrompt = `Réponds en français à la demande suivante avec rigueur. Stratégie: ${strategy}. Profondeur: ${depth}.\n\nQUESTION:\n${query}\n\nSOURCES WEB:\n${researchBlock || "Aucune source web exploitable."}\n\nRÈGLES: distingue les faits des inférences. Cite [1], [2], etc. seulement quand une source correspondante est fournie. N'invente aucune source ni donnée.`;

  let responseText = "";
  let localModelOnline = false;
  let usedModel = "";
  let usedHost = "";
  try {
    const answer = await askOllama([
      { role: "system", content: "Tu es Nova Research. Tu synthétises des sources web réelles et tu signales clairement les limites." },
      { role: "user", content: engineeredPrompt },
    ], { host: req.body?.host, model: req.body?.model, temperature: 0.2 });
    responseText = answer.text;
    localModelOnline = true;
    usedModel = answer.model;
    usedHost = answer.host;
  } catch (err: any) {
    const sourceLines = sources.slice(0, 8).map((s, i) => `${i + 1}. ${s.title}\n${s.uri}`).join("\n\n");
    responseText = sources.length
      ? `La recherche Internet a fonctionné, mais le modèle local n'a pas pu faire la synthèse.\n\n${sourceLines}\n\nErreur Ollama: ${err?.message || "inconnue"}`
      : `La recherche Internet et le modèle local sont indisponibles pour cette requête.\nRecherche: ${searchError || "aucun résultat"}\nOllama: ${err?.message || "inconnu"}`;
  }

  res.json({
    id: `ext-${Date.now()}`,
    query,
    strategy,
    depth,
    webSearchEnabled: includeWebSearch,
    engineeredPrompt,
    response: responseText,
    groundingSources: sources,
    keyTakeaways: responseText.split(/\n+/).filter((x) => x.trim().length > 25).slice(0, 4),
    suggestedFollowUps: ["Comparer les sources", "Chercher des données plus récentes", "Ouvrir les sources principales"],
    timestamp: now(),
    latencyMs: Date.now() - started,
    searchError,
    localModelOnline,
    usedModel,
    usedHost,
  });
});

app.post("/api/external-ai/optimize-prompt", async (req, res) => {
  const rawPrompt = String(req.body?.rawPrompt || "").trim();
  if (!rawPrompt) return res.status(400).json({ error: "Prompt requis" });
  try {
    const answer = await askOllama([
      { role: "system", content: "Réécris le prompt utilisateur en spécification claire, complète et directement exécutable. Retourne uniquement le prompt optimisé." },
      { role: "user", content: rawPrompt },
    ], { host: req.body?.host, model: req.body?.model });
    res.json({ originalPrompt: rawPrompt, optimizedPrompt: answer.text, strategyApplied: "Nova Local Prompt Refiner", improvements: ["objectif clarifié", "contraintes explicites", "format de sortie défini"], qualityGainEstimate: "amélioration qualitative non chiffrée", model: answer.model });
  } catch (err: any) {
    res.status(503).json({ error: err?.message || "Ollama indisponible" });
  }
});

const AGENT_ROWS = [
  ["reformulator", "Clarifier & Prompt Reformulateur", "🎯", "INTERPRÈTE D'INTENTION", "amber"],
  ["architect", "Grand Architecte & Superviseur", "🏛️", "GARDE-FOU DU CODE", "blue"],
  ["coder", "Lead Full-Stack Implementer", "⚡", "DÉVELOPPEUR", "emerald"],
  ["sentinel", "Sentinelle Qualité", "🛡️", "AUDIT", "purple"],
  ["creative_ideator", "Agent Créatif", "💡", "IDÉATION", "amber"],
  ["dropshipping_scout", "Agent Dropshipping", "📦", "E-COMMERCE", "indigo"],
  ["marketplace_arb", "Agent Marketplace", "🛒", "ARBITRAGE", "blue"],
  ["pricing_deal_hunter", "Agent Prix", "📈", "PRICING", "emerald"],
  ["promo_marketer", "Agent Promotionnel", "🚀", "MARKETING", "rose"],
];

let agentState: any[] = AGENT_ROWS.map(([role, name, avatar, badge, color], i) => ({
  id: `agent-${i + 1}`,
  role,
  name,
  avatar,
  badge,
  color,
  description: `${name} utilise le modèle Ollama réellement disponible sur la machine.`,
  responsibilities: ["Analyser la demande", "Produire un résultat vérifiable"],
  systemPrompt: `Tu es ${name}.`,
  guardrails: ["Ne pas inventer d'exécution", "Signaler les limites"],
  isActive: i < 4,
}));

let rules: any[] = [
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
  agentState = agentState.map((a) => ({
    ...a,
    isActive: preset === "all" ? true
      : preset === "dev_only" ? ["reformulator", "architect", "coder", "sentinel"].includes(a.role)
      : preset === "ecom_only" ? ["dropshipping_scout", "marketplace_arb", "pricing_deal_hunter", "promo_marketer"].includes(a.role)
      : preset === "lean_duo" ? ["architect", "coder"].includes(a.role)
      : a.isActive,
  }));
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
  res.json({ success: true, calculation: { costOfGoods: cost, sellingPrice: price, shippingCost: shipping, adCostPerAcquisition: cpa, platformFeePercent: feePct, platformFeeAmount, netProfit, marginPercent, breakEvenRoas, verdict, recommendation: marginPercent > 0 ? "Marge positive. Valide ensuite avec les frais réels de ta plateforme." : "Marge négative: revois prix, coût produit ou acquisition." } });
});

app.post("/api/agents/rephrase", async (req, res) => {
  const rawPrompt = String(req.body?.rawPrompt || "").trim();
  if (!rawPrompt) return res.status(400).json({ error: "Prompt vide" });
  try {
    const answer = await askOllama([
      { role: "system", content: "Clarifie la demande en une spécification concise, puis donne 3 formulations améliorées et 2 questions de cadrage." },
      { role: "user", content: rawPrompt },
    ], { host: req.body?.host, model: req.body?.model });
    const lines = answer.text.split("\n").map((x) => x.trim()).filter(Boolean);
    res.json({ success: true, spec: { originalPrompt: rawPrompt, clarityScore: 80, ambiguityScore: 20, detectedGoal: lines[0] || rawPrompt, rephrasedOptions: lines.slice(0, 3), clarificationQuestions: lines.slice(3, 5).length ? lines.slice(3, 5) : ["Quel résultat final doit être produit?", "Quelles contraintes sont obligatoires?"], recommendedStrategy: `Nova CoWork via ${answer.model}` } });
  } catch (err: any) {
    res.status(503).json({ error: err?.message || "Ollama indisponible" });
  }
});

app.post("/api/agents/cowork/run", async (req, res) => {
  const userPrompt = String(req.body?.userPrompt || "").trim();
  if (!userPrompt) return res.status(400).json({ error: "Prompt requis" });
  try {
    const reformulated = await askOllama([{ role: "system", content: "Reformule cette demande en spécification technique claire. Ne prétends pas avoir exécuté de code." }, { role: "user", content: userPrompt }], { host: req.body?.host, model: req.body?.model });
    const architecture = await askOllama([{ role: "system", content: "Tu es architecte logiciel. À partir de la spécification, propose une architecture concrète, fichiers et tests." }, { role: "user", content: reformulated.text }], { host: reformulated.host, model: reformulated.model });
    const code = await askOllama([{ role: "system", content: "Tu es développeur senior. Produit le code complet demandé à partir de la spécification et de l'architecture. N'invente pas des tests exécutés." }, { role: "user", content: `${reformulated.text}\n\nARCHITECTURE:\n${architecture.text}` }], { host: architecture.host, model: architecture.model, temperature: 0.2 });
    const audit = await askOllama([{ role: "system", content: "Tu es relecteur qualité. Audite le code fourni. Liste les risques, erreurs probables et tests à exécuter. Ne donne aucun score inventé." }, { role: "user", content: code.text.slice(0, 24000) }], { host: code.host, model: code.model, temperature: 0.15 });
    const mkStep = (n: number, role: string, name: string, title: string, output: string) => ({ id: `step-${n}-${Date.now()}`, agentRole: role, agentName: name, title, status: "completed", summary: output.slice(0, 240), detailedOutput: output, timestamp: now() });
    const steps: any[] = [
      mkStep(1, "reformulator", "Clarifier", "1. Spécification", reformulated.text),
      mkStep(2, "architect", "Architecte", "2. Architecture", architecture.text),
      { ...mkStep(3, "coder", "Coder", "3. Code", code.text), codeSnippets: [{ language: "text", filename: "generated-output.txt", code: code.text }] },
      mkStep(4, "sentinel", "Sentinelle", "4. Audit", audit.text),
    ];
    res.json({ success: true, sessionId: `cowork-${Date.now()}`, title: userPrompt.slice(0, 80), steps, finalDeliverable: { explanation: audit.text, architectureSummary: architecture.text, files: [{ path: "generated-output.txt", code: code.text, language: "text" }], qualityScore: 0, antiSpaghettiCertified: false }, model: code.model });
  } catch (err: any) {
    res.status(503).json({ error: err?.message || "Ollama indisponible" });
  }
});

app.post("/api/agents/creative-ideas", async (req, res) => {
  const niche = String(req.body?.niche || "IA locale");
  try {
    const answer = await askOllama([{ role: "system", content: "Génère une idée de produit réaliste et monétisable. Pas de chiffres de marché inventés. Donne cible, MVP, acquisition et monétisation." }, { role: "user", content: niche }], { host: req.body?.host, model: req.body?.model });
    res.json({ success: true, ideas: [{
      id: `idea-${Date.now()}`,
      title: `Concept Nova — ${niche}`,
      category: "micro_saas",
      monthlyRevenuePotential: "À valider avec données réelles",
      startupCost: "Variable",
      timeToLaunch: "À estimer après cadrage",
      difficulty: "moyen",
      elevatorPitch: answer.text.slice(0, 500),
      targetAudience: "À préciser",
      pricingTiers: [],
      unfairAdvantage: "Exécution locale et contrôle des données",
      mvpTechStack: ["Nova", "Ollama"],
      acquisitionFunnel: answer.text,
      monetizationPlan: answer.text,
      validatedDealOpportunity: "Non validée automatiquement",
    }] });
  } catch (err: any) {
    res.status(503).json({ error: err?.message || "Ollama indisponible", ideas: [] });
  }
});

app.post("/api/agents/dropshipping/deals", async (req, res) => {
  const category = String(req.body?.category || "tous");
  const results = await webSearch(`${category} produits tendances ecommerce 2026`, 6).catch(() => []);
  const deals = results.map((s, i) => ({
    id: `deal-${Date.now()}-${i}`,
    productTitle: s.title,
    niche: category,
    sourceSupplierPrice: 0,
    recommendedSellPrice: 0,
    competitorAveragePrice: 0,
    competitorHighPrice: 0,
    estimatedMarginPercent: 0,
    estimatedNetProfit: 0,
    demandScore: 0,
    competitionLevel: "moyenne",
    trendGrowth: "À vérifier",
    whySellNow: s.snippet || "Source web trouvée; analyse de demande à confirmer.",
    supplierUrl: s.uri,
    targetAudience: "À déterminer",
    pricingStrategy: "Valider coûts et prix concurrents avant décision",
    hookMarketing: "À générer après validation",
    adCopy: "",
    suggestedChannels: [],
    searchGroundingSources: [{ title: s.title, uri: s.uri }],
  }));
  res.json({ success: true, deals });
});

app.post("/api/agents/marketplace/audit", async (req, res) => {
  const productName = String(req.body?.productName || "Produit");
  const currentPrice = Number(req.body?.currentPrice || 0);
  const platform = String(req.body?.platform || "amazon");
  const search = await webSearch(`${productName} ${platform} prix`, 5).catch(() => []);
  res.json({ success: true, audit: {
    id: `audit-${Date.now()}`,
    platform,
    productName,
    currentPrice,
    optimalPrice: currentPrice,
    priceDelta: 0,
    priceDeltaPercent: 0,
    buyBoxChance: 0,
    demandVelocity: "stable",
    recommendation: search.length ? `Sources trouvées: ${search.slice(0, 3).map((s) => s.uri).join(" | ")}. Les prix doivent être vérifiés dans les pages avant calcul.` : "Aucune donnée marketplace fiable trouvée automatiquement.",
    marginAtOptimal: 0,
    competitorOffers: [],
    promoTriggerDiscount: 0,
  } });
});

app.post("/api/agents/promo/generate", async (req, res) => {
  const product = String(req.body?.productTitle || "Produit");
  const audience = String(req.body?.targetAudience || "client cible");
  try {
    const answer = await askOllama([{ role: "system", content: "Crée une campagne marketing honnête: 4 hooks, 2 textes pub et un script vidéo 15 secondes. N'invente pas de témoignages, ventes ou garanties." }, { role: "user", content: `Produit: ${product}\nAudience: ${audience}` }], { host: req.body?.host, model: req.body?.model });
    const lines = answer.text.split("\n").map((x) => x.trim()).filter(Boolean);
    res.json({ success: true, campaign: { productTitle: product, targetAudience: audience, hooksViral: lines.slice(0, 4), adCopies: [{ platform: "Social", headline: product, body: answer.text, callToAction: "En savoir plus" }], bundleOffers: [], tiktokScript15s: answer.text } });
  } catch (err: any) {
    res.status(503).json({ error: err?.message || "Ollama indisponible" });
  }
});

function safeJsonFromText(text: string): any {
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  try { return JSON.parse(cleaned); } catch {}
  const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    try { return JSON.parse(arrayMatch[0]); } catch {}
  }
  const objectMatch = cleaned.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    try { return JSON.parse(objectMatch[0]); } catch {}
  }
  return null;
}

app.post("/api/autonomous/discover-opportunities", async (req, res) => {
  const niche = String(req.body?.niche || "all");
  const customFocus = String(req.body?.customFocus || "").trim();
  const query = customFocus || (niche === "all" ? "tendances outils numériques micro SaaS jeux indépendants automatisation 2026" : `${niche} tendances demande 2026`);
  const sources = await webSearch(query, 8).catch(() => []);
  const sourceBlock = sources.slice(0, 8).map((s, i) => `[${i + 1}] ${s.title} — ${s.uri} — ${s.snippet}`).join("\n");

  let opportunities: any[] = [];
  try {
    const answer = await askOllama([
      { role: "system", content: "À partir UNIQUEMENT des sources fournies, propose au maximum 3 opportunités prudentes. Retourne un tableau JSON. N'invente aucun volume de recherche, revenu ou tendance chiffrée. Champs: searchTopic,niche,userPainPoint,proposedProductTitle,valueProposition,fullDeliverableCodeOrSpec,marketingCopy,salesPitchHeadline,tags." },
      { role: "user", content: `FOCUS: ${query}\nSOURCES:\n${sourceBlock || "Aucune source"}` },
    ], { host: req.body?.host, model: req.body?.model, temperature: 0.25 });
    const parsed = safeJsonFromText(answer.text);
    if (Array.isArray(parsed)) opportunities = parsed;
  } catch {}

  if (!opportunities.length) {
    opportunities = sources.slice(0, 3).map((s) => ({
      searchTopic: query,
      niche: niche === "all" ? "digital_guide" : niche,
      userPainPoint: s.snippet || "Besoin à confirmer par analyse de la source",
      proposedProductTitle: s.title,
      valueProposition: `Explorer une offre basée sur cette source: ${s.uri}`,
      fullDeliverableCodeOrSpec: `Source à analyser: ${s.uri}`,
      marketingCopy: "À produire après validation de la demande réelle.",
      salesPitchHeadline: s.title,
      tags: ["web-research", "validation-required"],
    }));
  }

  const allowedNiches = new Set(["saas_tool", "tshirt_merch", "game_template", "ai_prompt_pack", "automation_script", "digital_guide"]);
  const normalized = opportunities.slice(0, 4).map((o, i) => ({
    id: `opp-${Date.now()}-${i}`,
    searchTopic: String(o.searchTopic || query),
    niche: allowedNiches.has(String(o.niche)) ? String(o.niche) : (niche !== "all" && allowedNiches.has(niche) ? niche : "digital_guide"),
    searchVolumeEstimate: "À vérifier",
    trendStatus: "emerging",
    userPainPoint: String(o.userPainPoint || "À confirmer"),
    proposedProductTitle: String(o.proposedProductTitle || `Opportunité ${i + 1}`),
    valueProposition: String(o.valueProposition || "À préciser"),
    targetPriceUsd: 0,
    fullDeliverableCodeOrSpec: String(o.fullDeliverableCodeOrSpec || ""),
    marketingCopy: String(o.marketingCopy || ""),
    salesPitchHeadline: String(o.salesPitchHeadline || o.proposedProductTitle || ""),
    tags: Array.isArray(o.tags) ? o.tags.map(String) : ["web-research"],
    generatedAt: now(),
    isPublishedLocally: false,
  }));
  res.json({ success: true, opportunities: normalized, sources });
});

app.get("/api/doctor/diagnose", (_req, res) => {
  const totalMb = Math.round(os.totalmem() / 1024 / 1024);
  const freeMb = Math.round(os.freemem() / 1024 / 1024);
  const usedMb = totalMb - freeMb;
  const load = os.loadavg()[0] || 0;
  const cpuPct = clamp(Math.round((load / Math.max(1, os.cpus().length)) * 100), 0, 100);
  res.json({
    overallScore: 100 - clamp(Math.round((usedMb / totalMb) * 70 + cpuPct * 0.3), 0, 95),
    status: usedMb / totalMb > 0.9 ? "critical" : usedMb / totalMb > 0.75 ? "degraded" : "optimal",
    cpuUsagePct: cpuPct,
    ramUsageMb: usedMb,
    ramTotalMb: totalMb,
    gpuVramUsageMb: 0,
    gpuVramTotalMb: 0,
    zombieSocketsCleaned: 0,
    cacheFragmentationPct: 0,
    activeModelMemoryMb: 0,
    securityLeakRisksCount: 0,
    issuesDetected: [],
    healedItemsHistory: [],
  });
});

app.post("/api/doctor/heal", async (_req, res) => {
  const before = process.memoryUsage().heapUsed;
  const gc = (global as any).gc;
  if (typeof gc === "function") gc();
  const after = process.memoryUsage().heapUsed;
  res.json({ success: true, freedMemoryMb: Math.max(0, Math.round((before - after) / 1024 / 1024)), message: "Nettoyage limité au processus Nova. Aucun autre programme Windows n'a été fermé." });
});

const snapshots: any[] = [];

app.get("/api/autopatch/status", async (_req, res) => {
  const ollama = await discoverOllama(undefined, false);
  const network = await networkCheck("https://example.com");
  const modules = [
    { name: "Serveur Nova", status: "ok", details: `Port local ${PORT}` },
    { name: "Ollama", status: ollama.online ? "ok" : "warning", details: ollama.online ? `${ollama.models.length} modèle(s) détecté(s)` : "Non connecté" },
    { name: "Internet", status: network.ok ? "ok" : "warning", details: network.ok ? `HTTP ${network.status}` : network.error || "hors ligne" },
  ];
  const passed = modules.filter((m) => m.status === "ok").length;
  res.json({ score: Math.round((passed / modules.length) * 100), isFullyIntact: passed === modules.length, totalChecks: modules.length, passedChecks: passed, autoPatchCount: snapshots.length, lastPatchDate: snapshots[0]?.timestamp || "Jamais", modules, patches: [] });
});

app.post("/api/autopatch/run", async (req, res) => {
  if (req.body?.userAuthorized !== true) return res.status(403).json({ success: false, message: "Autorisation requise" });
  const snap = { id: `snapshot-${Date.now()}`, timestamp: now(), label: "Point de contrôle Nova", filesProtected: 0 };
  snapshots.unshift(snap);
  const ollama = await resolvedOllama(undefined, undefined, true);
  res.json({ success: true, dryRun: true, snapshot: snap, ollamaOnline: ollama.online, message: "Diagnostic et tentative de reconnexion effectués. Cette version ne modifie pas automatiquement le code utilisateur." });
});
app.get("/api/autopatch/snapshots", (_req, res) => res.json({ snapshots }));
app.post("/api/autopatch/rollback", (_req, res) => res.json({ success: false, message: "Rollback fichier non activé afin d'éviter toute suppression accidentelle." }));

app.get("/api/desktop/scripts", (_req, res) => {
  const launcher = `@echo off\r\nstart \"\" \"Nova Local Studio.exe\"\r\n`;
  const diagnose = `@echo off\r\necho === OLLAMA ===\r\ncurl -s http://127.0.0.1:11434/api/tags\r\necho.\r\necho === INTERNET ===\r\ncurl -I https://example.com\r\npause\r\n`;
  res.json({ scripts: [
    { fileName: "Lancer-NovaStudio.bat", extension: "bat", type: "launcher", description: "Lance Nova Local Studio installé.", content: launcher, sizeKb: 1 },
    { fileName: "Diagnostiquer-Nova.bat", extension: "bat", type: "autopatch", description: "Teste Ollama et la connexion Internet sans modifier le PC.", content: diagnose, sizeKb: 1 },
  ] });
});

app.post("/api/integrations/slack", async (req, res) => {
  const webhookUrl = String(req.body?.webhookUrl || "").trim();
  if (!webhookUrl) return res.status(400).json({ success: false, error: "Webhook Slack manquant" });
  try {
    const r = await fetchWithTimeout(webhookUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: req.body?.message || "Nova Local Studio" }) }, 10000);
    res.status(r.ok ? 200 : 502).json({ success: r.ok, status: r.status });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || String(err) });
  }
});

app.post("/api/integrations/jira", (req, res) => {
  const summary = String(req.body?.summary || "");
  const description = String(req.body?.description || "");
  const priority = String(req.body?.priority || "Medium");
  const assignee = String(req.body?.assignee || "");
  const issueKey = String(req.body?.issueKey || `LOCAL-${Date.now().toString().slice(-5)}`);
  const formattedJiraMarkdown = `h2. ${summary}\n\n${description}\n\n*Priority:* ${priority}\n*Assignee:* ${assignee || "Non assigné"}`;
  res.json({ success: true, simulated: true, issueKey, formattedJiraMarkdown });
});

app.get("/api/media/status", async (_req, res) => {
  const check = async (url: string) => {
    try { const r = await fetchWithTimeout(url, {}, 1800); return r.ok; } catch { return false; }
  };
  const [stableDiffusion, comfyui] = await Promise.all([
    check("http://127.0.0.1:7860/sdapi/v1/sd-models"),
    check("http://127.0.0.1:8188/system_stats"),
  ]);
  res.json({ stableDiffusion, comfyui, imageHost: "http://127.0.0.1:7860", videoHost: "http://127.0.0.1:8188" });
});

app.post("/api/media/image/generate", async (req, res) => {
  const host = String(req.body?.host || "http://127.0.0.1:7860").replace(/\/+$/, "");
  try {
    const r = await fetchWithTimeout(`${host}/sdapi/v1/txt2img`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: req.body?.prompt || "", negative_prompt: req.body?.negativePrompt || "", steps: clamp(Number(req.body?.steps || 24), 1, 80), width: clamp(Number(req.body?.width || 768), 256, 2048), height: clamp(Number(req.body?.height || 768), 256, 2048) }),
    }, 300000);
    if (!r.ok) throw new Error(`Stable Diffusion ${r.status}`);
    const data: any = await r.json();
    res.json({ success: true, images: data.images || [] });
  } catch (err: any) {
    res.status(503).json({ success: false, error: `Moteur image local indisponible: ${err?.message || "inconnu"}` });
  }
});

app.post("/api/media/video/generate", async (req, res) => {
  const host = String(req.body?.host || "http://127.0.0.1:8188").replace(/\/+$/, "");
  if (!req.body?.workflow) return res.status(400).json({ success: false, error: "Un workflow ComfyUI vidéo est requis." });
  try {
    const r = await fetchWithTimeout(`${host}/prompt`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: req.body.workflow }) }, 30000);
    if (!r.ok) throw new Error(`ComfyUI ${r.status}`);
    res.json({ success: true, ...(await r.json() as any) });
  } catch (err: any) {
    res.status(503).json({ success: false, error: err?.message || "ComfyUI indisponible" });
  }
});

app.post("/api/games/generate", async (req, res) => {
  const promptText = String(req.body?.prompt || "").trim();
  if (!promptText) return res.status(400).json({ error: "Description du jeu requise" });
  try {
    const answer = await askOllama([{ role: "system", content: "Crée un jeu jouable complet dans UN fichier HTML autonome avec CSS et JavaScript inline. Retourne uniquement le HTML, sans markdown." }, { role: "user", content: promptText }], { host: req.body?.host, model: req.body?.model, temperature: 0.45 });
    const html = answer.text.replace(/^```html\s*/i, "").replace(/```\s*$/i, "");
    const dataDir = process.env.NOVA_DATA_DIR || path.join(process.cwd(), "nova-data");
    const dir = path.join(dataDir, "generated-games");
    await fs.mkdir(dir, { recursive: true });
    const file = path.join(dir, `game-${Date.now()}.html`);
    await fs.writeFile(file, html, "utf8");
    res.json({ success: true, file, html, model: answer.model });
  } catch (err: any) {
    res.status(503).json({ error: err?.message || "Ollama indisponible" });
  }
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

  app.listen(PORT, "127.0.0.1", () => {
    console.log(`Nova Local Studio v0.2: http://127.0.0.1:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Nova server failed:", err);
  process.exitCode = 1;
});

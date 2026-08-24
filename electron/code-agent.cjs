const fs = require("fs/promises");
const path = require("path");
const { spawn } = require("child_process");

const IGNORE_DIRS = new Set([
  ".git", "node_modules", "dist", "build", "release", ".next", ".nuxt", "coverage",
  ".cache", ".turbo", ".vite", ".nova", "vendor", "target", "__pycache__", ".venv", "venv"
]);

const TEXT_EXTENSIONS = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json", ".html", ".css", ".scss", ".md",
  ".py", ".go", ".rs", ".java", ".kt", ".cs", ".cpp", ".c", ".h", ".hpp", ".php", ".rb",
  ".yml", ".yaml", ".toml", ".ini", ".env", ".txt", ".sql", ".sh", ".ps1", ".bat", ".xml"
]);

const MAX_CONTEXT_CHARS = 90000;
const MAX_FILE_CHARS = 18000;
const MAX_WRITES = 10;

function cleanHost(host) {
  return String(host || "http://127.0.0.1:11434").trim().replace(/\/+$/, "");
}

async function realDirectory(root) {
  if (!root || typeof root !== "string") throw new Error("Aucun dossier de projet sélectionné.");
  const resolved = await fs.realpath(root);
  const stat = await fs.stat(resolved);
  if (!stat.isDirectory()) throw new Error("Le workspace sélectionné n'est pas un dossier.");
  return resolved;
}

function safeResolve(root, relativePath) {
  const rel = String(relativePath || "").replace(/\\/g, "/").replace(/^\/+/, "");
  if (!rel || rel.includes("\0")) throw new Error("Chemin de fichier invalide.");
  const target = path.resolve(root, rel);
  const prefix = root.endsWith(path.sep) ? root : root + path.sep;
  if (target !== root && !target.startsWith(prefix)) throw new Error(`Chemin refusé hors workspace: ${relativePath}`);
  return target;
}

function isTextFile(name) {
  const base = path.basename(name).toLowerCase();
  if (["dockerfile", "makefile", "procfile", ".gitignore", ".npmrc", ".editorconfig", ".env.example"].includes(base)) return true;
  return TEXT_EXTENSIONS.has(path.extname(name).toLowerCase());
}

async function scanWorkspace(root, maxFiles = 450) {
  const files = [];
  const walk = async (dir, depth) => {
    if (files.length >= maxFiles || depth > 10) return;
    let entries = [];
    try { entries = await fs.readdir(dir, { withFileTypes: true }); } catch { return; }
    entries.sort((a, b) => Number(b.isDirectory()) - Number(a.isDirectory()) || a.name.localeCompare(b.name));
    for (const entry of entries) {
      if (files.length >= maxFiles) break;
      if (entry.name.startsWith(".") && ![".env.example", ".gitignore"].includes(entry.name)) continue;
      const abs = path.join(dir, entry.name);
      const rel = path.relative(root, abs).replace(/\\/g, "/");
      if (entry.isDirectory()) {
        if (IGNORE_DIRS.has(entry.name)) continue;
        await walk(abs, depth + 1);
      } else if (entry.isFile() && isTextFile(entry.name)) {
        try {
          const stat = await fs.stat(abs);
          files.push({ path: rel, size: stat.size });
        } catch {}
      }
    }
  };
  await walk(root, 0);
  return files;
}

function scoreFile(filePath, promptTokens) {
  const p = filePath.toLowerCase();
  let score = 0;
  if (/^(package\.json|tsconfig.*\.json|vite\.config\.|README|server\.|src\/App\.|src\/main\.)/i.test(filePath)) score += 30;
  if (/src\//i.test(filePath)) score += 10;
  if (/test|spec/i.test(filePath)) score += 4;
  for (const token of promptTokens) if (token.length > 2 && p.includes(token)) score += 8;
  if (/lock$|lock\./i.test(filePath)) score -= 40;
  return score;
}

async function readText(abs, maxChars = MAX_FILE_CHARS) {
  const raw = await fs.readFile(abs, "utf8");
  if (raw.length <= maxChars) return raw;
  return raw.slice(0, maxChars) + "\n/* ... contenu tronqué par Nova ... */";
}

async function buildContext(root, files, prompt) {
  const tokens = String(prompt || "").toLowerCase().split(/[^a-z0-9_./-]+/i).filter(Boolean);
  const ranked = [...files].sort((a, b) => scoreFile(b.path, tokens) - scoreFile(a.path, tokens) || a.size - b.size);
  let used = 0;
  const sections = [];
  for (const file of ranked) {
    if (used >= MAX_CONTEXT_CHARS) break;
    if (file.size > 180000) continue;
    try {
      const content = await readText(safeResolve(root, file.path));
      const block = `\n--- FILE: ${file.path} ---\n${content}\n`;
      if (used + block.length > MAX_CONTEXT_CHARS && sections.length > 5) continue;
      sections.push(block);
      used += block.length;
    } catch {}
  }
  return sections.join("\n");
}

async function ollamaRuntime(host, requestedModel) {
  const base = cleanHost(host);
  const response = await fetch(`${base}/api/tags`, { signal: AbortSignal.timeout(3500) });
  if (!response.ok) throw new Error(`Ollama ne répond pas (${response.status}).`);
  const data = await response.json();
  const names = Array.isArray(data?.models) ? data.models.map((m) => String(m.name || m.model || "")).filter(Boolean) : [];
  if (!names.length) throw new Error("Ollama est connecté, mais aucun modèle n'est installé.");
  let model = String(requestedModel || "").trim();
  if (!names.includes(model)) {
    const baseName = model.split(":")[0].toLowerCase();
    model = names.find((n) => baseName && n.toLowerCase().startsWith(baseName)) || "";
  }
  if (!model) {
    for (const key of ["qwen", "gpt-oss", "deepseek", "codestral", "coder", "llama", "mistral", "gemma"]) {
      model = names.find((n) => n.toLowerCase().includes(key)) || "";
      if (model) break;
    }
  }
  return { host: base, model: model || names[0], models: names };
}

function extractJson(text) {
  const cleaned = String(text || "").replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  try { return JSON.parse(cleaned); } catch {}
  const first = cleaned.indexOf("{");
  const last = cleaned.lastIndexOf("}");
  if (first >= 0 && last > first) {
    try { return JSON.parse(cleaned.slice(first, last + 1)); } catch {}
  }
  throw new Error("Le modèle n'a pas retourné un plan JSON exploitable.");
}

async function askJson(runtime, messages, timeoutMs = 240000) {
  const response = await fetch(`${runtime.host}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: runtime.model,
      messages,
      stream: false,
      format: "json",
      options: { temperature: 0.12, num_ctx: 32768 },
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) throw new Error(`Ollama ${response.status}: ${response.statusText}`);
  const data = await response.json();
  return extractJson(data?.message?.content || data?.response || "");
}

async function createSnapshot(root, writes) {
  const id = new Date().toISOString().replace(/[:.]/g, "-");
  const snapshotRoot = path.join(root, ".nova", "snapshots", id);
  const manifest = { id, root, createdAt: new Date().toISOString(), files: [] };
  await fs.mkdir(snapshotRoot, { recursive: true });
  for (const write of writes) {
    const target = safeResolve(root, write.path);
    let existed = false;
    try {
      const stat = await fs.stat(target);
      existed = stat.isFile();
    } catch {}
    manifest.files.push({ path: write.path, existed });
    if (existed) {
      const backup = path.join(snapshotRoot, "files", write.path);
      await fs.mkdir(path.dirname(backup), { recursive: true });
      await fs.copyFile(target, backup);
    }
  }
  await fs.writeFile(path.join(snapshotRoot, "manifest.json"), JSON.stringify(manifest, null, 2), "utf8");
  return manifest;
}

async function applyWrites(root, rawWrites) {
  const writes = Array.isArray(rawWrites) ? rawWrites.slice(0, MAX_WRITES) : [];
  const normalized = [];
  for (const item of writes) {
    const rel = String(item?.path || "").replace(/\\/g, "/").replace(/^\/+/, "").trim();
    const content = typeof item?.content === "string" ? item.content : "";
    if (!rel || rel.startsWith(".git/") || rel.startsWith("node_modules/") || rel.startsWith(".nova/")) continue;
    safeResolve(root, rel);
    normalized.push({ path: rel, content });
  }
  if (!normalized.length) return { snapshot: null, changed: [] };
  const snapshot = await createSnapshot(root, normalized);
  for (const item of normalized) {
    const target = safeResolve(root, item.path);
    await fs.mkdir(path.dirname(target), { recursive: true });
    const tmp = `${target}.nova-tmp-${process.pid}`;
    await fs.writeFile(tmp, item.content, "utf8");
    await fs.rename(tmp, target);
  }
  return { snapshot, changed: normalized.map((x) => x.path) };
}

function runProcess(command, args, cwd, timeoutMs = 120000) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd,
      windowsHide: true,
      shell: process.platform === "win32",
      env: { ...process.env, CI: "1", FORCE_COLOR: "0" },
    });
    let stdout = "";
    let stderr = "";
    const append = (current, chunk) => (current + chunk.toString()).slice(-22000);
    child.stdout?.on("data", (d) => { stdout = append(stdout, d); });
    child.stderr?.on("data", (d) => { stderr = append(stderr, d); });
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      try { child.kill(); } catch {}
    }, timeoutMs);
    child.on("error", (err) => {
      clearTimeout(timer);
      resolve({ ok: false, code: -1, command: [command, ...args].join(" "), stdout, stderr: `${stderr}\n${err.message}`.trim(), timedOut });
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ ok: code === 0 && !timedOut, code, command: [command, ...args].join(" "), stdout, stderr, timedOut });
    });
  });
}

async function validationCommands(root) {
  const pkgPath = path.join(root, "package.json");
  try {
    const pkg = JSON.parse(await fs.readFile(pkgPath, "utf8"));
    const scripts = pkg.scripts || {};
    const manager = await fs.access(path.join(root, "pnpm-lock.yaml")).then(() => "pnpm").catch(async () =>
      fs.access(path.join(root, "yarn.lock")).then(() => "yarn").catch(() => "npm")
    );
    const commands = [];
    const add = (script) => {
      if (!scripts[script]) return;
      if (manager === "npm") commands.push(["npm", ["run", script]]);
      else commands.push([manager, [script]]);
    };
    if (scripts.lint) add("lint");
    else if (scripts.typecheck) add("typecheck");
    else if (scripts.check) add("check");
    if (scripts.build) add("build");
    return commands.slice(0, 2);
  } catch {}

  try {
    await fs.access(path.join(root, "pyproject.toml"));
    return [[process.platform === "win32" ? "python" : "python3", ["-m", "compileall", "."]]];
  } catch {}
  return [];
}

async function validateProject(root, emit) {
  const commands = await validationCommands(root);
  if (!commands.length) return [];
  const results = [];
  for (const [cmd, args] of commands) {
    emit({ phase: "test", status: "running", message: `Vérification: ${cmd} ${args.join(" ")}` });
    const result = await runProcess(cmd, args, root);
    results.push(result);
    emit({ phase: "test", status: result.ok ? "done" : "error", message: result.ok ? `${result.command} ✓` : `${result.command} a échoué` });
    if (!result.ok) break;
  }
  return results;
}

function compactErrors(results) {
  return results.filter((r) => !r.ok).map((r) => `COMMAND: ${r.command}\nEXIT: ${r.code}\nSTDOUT:\n${r.stdout}\nSTDERR:\n${r.stderr}`).join("\n\n").slice(0, 28000);
}

async function restoreSnapshot(root, snapshotId) {
  const safeId = String(snapshotId || "").replace(/[^a-zA-Z0-9_-]/g, "");
  if (!safeId) throw new Error("Snapshot invalide.");
  const snapshotRoot = path.join(root, ".nova", "snapshots", safeId);
  const manifest = JSON.parse(await fs.readFile(path.join(snapshotRoot, "manifest.json"), "utf8"));
  for (const item of manifest.files || []) {
    const target = safeResolve(root, item.path);
    if (item.existed) {
      const backup = path.join(snapshotRoot, "files", item.path);
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.copyFile(backup, target);
    } else {
      await fs.rm(target, { force: true });
    }
  }
  return { success: true, restored: (manifest.files || []).map((x) => x.path) };
}

function createEmitter(getWindow) {
  return (payload) => {
    try { getWindow()?.webContents?.send("nova-code:progress", { at: Date.now(), ...payload }); } catch {}
  };
}

function registerCodeAgent({ ipcMain, dialog, getWindow }) {
  const emit = createEmitter(getWindow);

  ipcMain.handle("nova-code:select-workspace", async () => {
    const result = await dialog.showOpenDialog(getWindow(), {
      title: "Ouvrir un projet dans Nova Code",
      properties: ["openDirectory", "createDirectory"],
      buttonLabel: "Ouvrir ce projet",
    });
    if (result.canceled || !result.filePaths?.[0]) return { canceled: true };
    const root = await realDirectory(result.filePaths[0]);
    const files = await scanWorkspace(root);
    return { canceled: false, root, name: path.basename(root), files };
  });

  ipcMain.handle("nova-code:inspect-workspace", async (_event, { root }) => {
    const actualRoot = await realDirectory(root);
    const files = await scanWorkspace(actualRoot);
    return { root: actualRoot, name: path.basename(actualRoot), files };
  });

  ipcMain.handle("nova-code:read-file", async (_event, { root, relativePath }) => {
    const actualRoot = await realDirectory(root);
    const abs = safeResolve(actualRoot, relativePath);
    return { path: relativePath, content: await readText(abs, 120000) };
  });

  ipcMain.handle("nova-code:undo-task", async (_event, { root, snapshotId }) => {
    const actualRoot = await realDirectory(root);
    return restoreSnapshot(actualRoot, snapshotId);
  });

  ipcMain.handle("nova-code:run-task", async (_event, payload = {}) => {
    const prompt = String(payload.prompt || "").trim();
    if (!prompt) throw new Error("Décris ce que Nova doit coder.");
    const root = await realDirectory(payload.root);
    emit({ phase: "scan", status: "running", message: "Lecture du projet..." });
    const files = await scanWorkspace(root);
    const tree = files.map((f) => `${f.path} (${f.size}b)`).join("\n");
    const context = await buildContext(root, files, prompt);
    emit({ phase: "scan", status: "done", message: `${files.length} fichiers repérés` });

    emit({ phase: "think", status: "running", message: "Nova prépare les changements..." });
    const runtime = await ollamaRuntime(payload.host, payload.model);
    const system = `Tu es Nova Code, un agent développeur local pragmatique. Tu travailles dans UN workspace autorisé.\n\nRÈGLES:\n- Réponds UNIQUEMENT en JSON valide.\n- N'invente pas de commandes exécutées.\n- Modifie le minimum de fichiers nécessaire.\n- Maximum ${MAX_WRITES} fichiers.\n- Jamais de suppression de fichier.\n- Chaque fichier dans files doit contenir son CONTENU COMPLET final, pas un diff.\n- Ne touche jamais .git, node_modules, dist, build, release ou .nova.\n- Préserve le style et l'architecture du projet.\n\nFORMAT EXACT:\n{\"summary\":\"courte explication\",\"files\":[{\"path\":\"src/x.ts\",\"content\":\"contenu complet\"}],\"notes\":[\"point utile\"]}`;
    const task = await askJson(runtime, [
      { role: "system", content: system },
      { role: "user", content: `DEMANDE:\n${prompt}\n\nARBORESCENCE:\n${tree.slice(0, 30000)}\n\nCONTEXTE FICHIERS:\n${context}` },
    ]);
    emit({ phase: "think", status: "done", message: `Plan produit avec ${runtime.model}` });

    emit({ phase: "write", status: "running", message: "Application des changements..." });
    const firstApply = await applyWrites(root, task.files);
    let changed = [...firstApply.changed];
    let snapshot = firstApply.snapshot;
    emit({ phase: "write", status: "done", message: changed.length ? `${changed.length} fichier(s) modifié(s)` : "Aucun fichier à modifier" });

    let tests = await validateProject(root, emit);
    let fixed = false;
    if (tests.some((r) => !r.ok) && changed.length) {
      emit({ phase: "fix", status: "running", message: "Un test a échoué. Nova corrige..." });
      const errorText = compactErrors(tests);
      const changedContext = (await Promise.all(changed.slice(0, 8).map(async (rel) => {
        try { return `--- FILE: ${rel} ---\n${await readText(safeResolve(root, rel), 22000)}`; } catch { return ""; }
      }))).join("\n\n");
      const fix = await askJson(runtime, [
        { role: "system", content: system },
        { role: "user", content: `La modification précédente a échoué aux vérifications. Corrige uniquement ce qui est nécessaire.\n\nDEMANDE INITIALE:\n${prompt}\n\nERREURS RÉELLES:\n${errorText}\n\nFICHIERS MODIFIÉS:\n${changedContext}` },
      ]);
      const fixApply = await applyWrites(root, fix.files);
      if (!snapshot && fixApply.snapshot) snapshot = fixApply.snapshot;
      changed = Array.from(new Set([...changed, ...fixApply.changed]));
      fixed = fixApply.changed.length > 0;
      tests = await validateProject(root, emit);
      emit({ phase: "fix", status: tests.every((r) => r.ok) ? "done" : "error", message: tests.every((r) => r.ok) ? "Correction validée" : "Il reste une erreur à vérifier" });
    }

    const success = tests.length ? tests.every((r) => r.ok) : true;
    emit({ phase: "done", status: success ? "done" : "error", message: success ? "Terminé" : "Terminé avec erreur de validation" });
    return {
      success,
      root,
      projectName: path.basename(root),
      model: runtime.model,
      summary: String(task.summary || "Modification terminée."),
      notes: Array.isArray(task.notes) ? task.notes.map(String).slice(0, 8) : [],
      changedFiles: changed,
      snapshotId: snapshot?.id || "",
      validation: tests,
      autoFixAttempted: fixed,
    };
  });
}

module.exports = { registerCodeAgent };

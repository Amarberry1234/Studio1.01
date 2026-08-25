import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Circle,
  Clock3,
  Code2,
  FileCode2,
  FolderOpen,
  Globe2,
  Loader2,
  Play,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Terminal,
  X,
  XCircle,
} from "lucide-react";

interface WorkspaceFile {
  path: string;
  size: number;
}

interface ValidationResult {
  ok: boolean;
  code: number;
  command: string;
  stdout: string;
  stderr: string;
  timedOut?: boolean;
}

interface ChangeStat {
  path: string;
  created: boolean;
  beforeLines: number;
  afterLines: number;
  deltaLines: number;
}

interface CodeTaskResult {
  success: boolean;
  projectName: string;
  model: string;
  summary: string;
  notes: string[];
  changedFiles: string[];
  changeStats?: ChangeStat[];
  snapshotId: string;
  validation: ValidationResult[];
  autoFixPasses: number;
  durationMs: number;
  webUsed: boolean;
}

interface ProgressEvent {
  phase: string;
  status: "running" | "done" | "error";
  message: string;
  at?: number;
}

interface DesktopBridge {
  selectWorkspace: () => Promise<{ canceled: boolean; root?: string; name?: string; files?: WorkspaceFile[] }>;
  inspectWorkspace: (root: string) => Promise<{ root: string; name: string; files: WorkspaceFile[] }>;
  readWorkspaceFile: (root: string, relativePath: string) => Promise<{ path: string; content: string }>;
  runCodeTask: (payload: { root: string; prompt: string; allowWeb?: boolean }) => Promise<CodeTaskResult>;
  undoCodeTask: (root: string, snapshotId: string) => Promise<{ success: boolean; restored: string[] }>;
  onCodeProgress: (callback: (payload: ProgressEvent) => void) => () => void;
}

declare global {
  interface Window {
    novaDesktop?: DesktopBridge;
  }
}

const PHASES = [
  { id: "scan", label: "Projet" },
  { id: "think", label: "Plan" },
  { id: "research", label: "Web" },
  { id: "write", label: "Code" },
  { id: "deps", label: "Dépendances" },
  { id: "test", label: "Tests" },
  { id: "fix", label: "Fix" },
  { id: "done", label: "Fini" },
];

function readableSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function shortPath(value: string, max = 64) {
  if (value.length <= max) return value;
  return `…${value.slice(-(max - 1))}`;
}

function formatDuration(ms: number) {
  if (!ms) return "";
  if (ms < 1000) return `${ms} ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(ms < 10000 ? 1 : 0)} s`;
  return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
}

function cleanReadable(text: string) {
  return String(text || "")
    .replace(/\r/g, "")
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/^```(?:\w+)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .trim();
}

const ReadableText: React.FC<{ text: string }> = ({ text }) => {
  const clean = cleanReadable(text);
  if (!clean) return null;
  const blocks = clean.split(/\n{2,}/).map((x) => x.trim()).filter(Boolean);
  return (
    <div className="space-y-3 text-[15px] leading-7 text-neutral-300">
      {blocks.map((block, index) => (
        <p key={index} className="whitespace-pre-wrap break-words">{block}</p>
      ))}
    </div>
  );
};

const StatusIcon: React.FC<{ event?: ProgressEvent }> = ({ event }) => {
  if (!event) return <Circle className="w-3.5 h-3.5 text-neutral-700" />;
  if (event.status === "running") return <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />;
  if (event.status === "error") return <XCircle className="w-3.5 h-3.5 text-rose-400" />;
  return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
};

export const AgentsCoWorkStudio: React.FC = () => {
  const [workspaceRoot, setWorkspaceRoot] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [files, setFiles] = useState<WorkspaceFile[]>([]);
  const [fileSearch, setFileSearch] = useState("");
  const [prompt, setPrompt] = useState("");
  const [lastPrompt, setLastPrompt] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState<Record<string, ProgressEvent>>({});
  const [result, setResult] = useState<CodeTaskResult | null>(null);
  const [error, setError] = useState("");
  const [selectedFile, setSelectedFile] = useState("");
  const [selectedFileContent, setSelectedFileContent] = useState("");
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [isUndoing, setIsUndoing] = useState(false);
  const [allowWeb, setAllowWeb] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const isDesktop = !!window.novaDesktop;

  useEffect(() => {
    const saved = localStorage.getItem("nova_code_workspace") || "";
    const savedWeb = localStorage.getItem("nova_code_web");
    if (savedWeb !== null) setAllowWeb(savedWeb !== "0");
    if (!saved || !window.novaDesktop) return;
    window.novaDesktop.inspectWorkspace(saved)
      .then((info) => {
        setWorkspaceRoot(info.root);
        setWorkspaceName(info.name);
        setFiles(info.files || []);
      })
      .catch(() => localStorage.removeItem("nova_code_workspace"));
  }, []);

  useEffect(() => {
    localStorage.setItem("nova_code_web", allowWeb ? "1" : "0");
  }, [allowWeb]);

  useEffect(() => {
    if (!window.novaDesktop) return;
    return window.novaDesktop.onCodeProgress((event) => {
      setProgress((prev) => ({ ...prev, [event.phase]: event }));
    });
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [progress, result, error, lastPrompt]);

  const filteredFiles = useMemo(() => {
    const q = fileSearch.trim().toLowerCase();
    return files.filter((f) => !q || f.path.toLowerCase().includes(q)).slice(0, 260);
  }, [files, fileSearch]);

  const openWorkspace = async () => {
    setError("");
    if (!window.novaDesktop) {
      setError("Ouvre Nova depuis l'application Windows pour travailler directement dans tes dossiers.");
      return;
    }
    try {
      const info = await window.novaDesktop.selectWorkspace();
      if (info.canceled || !info.root) return;
      setWorkspaceRoot(info.root);
      setWorkspaceName(info.name || info.root.split(/[\\/]/).pop() || "Projet");
      setFiles(info.files || []);
      setResult(null);
      setProgress({});
      setLastPrompt("");
      setSelectedFile("");
      localStorage.setItem("nova_code_workspace", info.root);
    } catch (err: any) {
      setError(err?.message || "Impossible d'ouvrir ce dossier.");
    }
  };

  const refreshWorkspace = async () => {
    if (!workspaceRoot || !window.novaDesktop) return;
    try {
      const info = await window.novaDesktop.inspectWorkspace(workspaceRoot);
      setFiles(info.files || []);
    } catch {}
  };

  const openFile = async (relativePath: string) => {
    if (!workspaceRoot || !window.novaDesktop) return;
    setSelectedFile(relativePath);
    setSelectedFileContent("");
    setIsReadingFile(true);
    try {
      const file = await window.novaDesktop.readWorkspaceFile(workspaceRoot, relativePath);
      setSelectedFileContent(file.content || "");
    } catch (err: any) {
      setSelectedFileContent(`Impossible de lire ce fichier.\n\n${err?.message || "Erreur inconnue"}`);
    } finally {
      setIsReadingFile(false);
    }
  };

  const run = async (quickPrompt?: string) => {
    const task = String(quickPrompt ?? prompt).trim();
    if (!task || isRunning) return;
    if (!workspaceRoot) {
      await openWorkspace();
      return;
    }
    if (!window.novaDesktop) {
      setError("Nova Code doit être lancé depuis l'application Windows pour modifier réellement tes fichiers.");
      return;
    }

    setLastPrompt(task);
    setPrompt("");
    setIsRunning(true);
    setError("");
    setResult(null);
    setProgress({});
    setSelectedFile("");
    setShowDetails(false);

    try {
      const output = await window.novaDesktop.runCodeTask({
        root: workspaceRoot,
        prompt: task,
        allowWeb,
      });
      setResult(output);
      await refreshWorkspace();
    } catch (err: any) {
      setError(err?.message || "Nova Code n'a pas réussi à terminer la tâche.");
    } finally {
      setIsRunning(false);
    }
  };

  const undo = async () => {
    if (!result?.snapshotId || !workspaceRoot || !window.novaDesktop || isUndoing) return;
    setIsUndoing(true);
    setError("");
    try {
      await window.novaDesktop.undoCodeTask(workspaceRoot, result.snapshotId);
      await refreshWorkspace();
      setResult((prev) => prev ? { ...prev, summary: `${prev.summary}\n\nLes changements de cette tâche ont été annulés.` } : prev);
    } catch (err: any) {
      setError(err?.message || "Impossible d'annuler cette tâche.");
    } finally {
      setIsUndoing(false);
    }
  };

  const quickTasks = [
    "Corrige les bugs et vérifie que le build passe.",
    "Analyse ce projet et améliore ce qui est fragile sans changer le design.",
    "Nettoie le code inutile et garde exactement le même comportement.",
  ];

  return (
    <div className="flex-1 min-h-0 bg-[#09090b] text-neutral-100 flex overflow-hidden">
      <aside className="w-[270px] shrink-0 border-r border-neutral-800/80 bg-[#0c0c0f] flex flex-col min-h-0">
        <div className="p-4 border-b border-neutral-800/80">
          <button
            onClick={openWorkspace}
            className="w-full h-10 rounded-xl bg-white text-black hover:bg-neutral-200 transition flex items-center justify-center gap-2 text-sm font-semibold"
          >
            <FolderOpen className="w-4 h-4" />
            {workspaceRoot ? "Changer de projet" : "Ouvrir un projet"}
          </button>
          {workspaceRoot && (
            <div className="mt-3 px-1">
              <div className="text-sm font-medium text-neutral-200 truncate">{workspaceName}</div>
              <div className="text-[11px] text-neutral-600 mt-1 truncate" title={workspaceRoot}>{shortPath(workspaceRoot, 42)}</div>
            </div>
          )}
        </div>

        {workspaceRoot ? (
          <>
            <div className="p-3 border-b border-neutral-800/60">
              <div className="h-9 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center px-3 gap-2">
                <Search className="w-3.5 h-3.5 text-neutral-600" />
                <input
                  value={fileSearch}
                  onChange={(e) => setFileSearch(e.target.value)}
                  placeholder="Rechercher un fichier"
                  className="flex-1 min-w-0 bg-transparent outline-none text-xs text-neutral-300 placeholder-neutral-600"
                />
              </div>
            </div>
            <div className="px-3 py-2 flex items-center justify-between text-[11px] text-neutral-600">
              <span>FICHIERS</span>
              <button onClick={refreshWorkspace} className="hover:text-neutral-300" title="Actualiser">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-2 pb-3">
              {filteredFiles.map((file) => (
                <button
                  key={file.path}
                  onClick={() => openFile(file.path)}
                  className={`w-full px-2.5 py-2 rounded-lg text-left flex items-center gap-2.5 group ${selectedFile === file.path ? "bg-neutral-800 text-white" : "text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200"}`}
                >
                  <FileCode2 className="w-3.5 h-3.5 shrink-0 text-neutral-600 group-hover:text-neutral-400" />
                  <span className="text-xs truncate flex-1">{file.path}</span>
                  <span className="text-[9px] text-neutral-700 shrink-0">{readableSize(file.size)}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="p-4 text-xs leading-5 text-neutral-600">
            Nova n'accède à rien tant que tu n'as pas choisi un dossier.
          </div>
        )}
      </aside>

      <section className="flex-1 min-w-0 flex flex-col bg-[#09090b]">
        <header className="h-16 shrink-0 border-b border-neutral-800/70 px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Code2 className="w-4.5 h-4.5 text-blue-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-semibold text-white">Nova Code</h1>
                <span className="px-2 py-0.5 rounded-md text-[9px] font-bold tracking-wide bg-violet-500/10 border border-violet-500/20 text-violet-300">WORK MODE</span>
              </div>
              <div className="text-[11px] text-neutral-600 truncate">{workspaceRoot ? shortPath(workspaceRoot) : "Ouvre un projet et décris ce que tu veux."}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setAllowWeb((v) => !v)}
              className={`h-9 px-3 rounded-lg border text-xs flex items-center gap-2 transition ${allowWeb ? "border-blue-500/25 bg-blue-500/10 text-blue-300" : "border-neutral-800 bg-neutral-900 text-neutral-500"}`}
              title="Nova peut consulter de la documentation Web quand c'est nécessaire"
            >
              <Globe2 className="w-3.5 h-3.5" />
              Web {allowWeb ? "Auto" : "Off"}
            </button>
            <div className="h-9 px-3 rounded-lg border border-neutral-800 bg-neutral-900 text-xs text-neutral-500 flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              Snapshot auto
            </div>
          </div>
        </header>

        <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-6 py-8 md:py-10">
            {!lastPrompt && !result && !isRunning && !error && (
              <div className="pt-[7vh] max-w-2xl mx-auto">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-950/30 mb-5">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-semibold tracking-tight text-white">Qu'est-ce qu'on code?</h2>
                <p className="mt-2 text-[15px] leading-7 text-neutral-500">
                  Donne-moi le résultat que tu veux. Nova lit le projet, modifie seulement ce qu'il faut, lance les vérifications et tente de corriger les erreurs tout seul.
                </p>

                {!workspaceRoot ? (
                  <button onClick={openWorkspace} className="mt-7 h-11 px-5 rounded-xl bg-white text-black hover:bg-neutral-200 text-sm font-semibold flex items-center gap-2">
                    <FolderOpen className="w-4 h-4" />
                    Choisir mon projet
                  </button>
                ) : (
                  <div className="mt-8 grid gap-2">
                    {quickTasks.map((task) => (
                      <button
                        key={task}
                        onClick={() => setPrompt(task)}
                        className="text-left rounded-xl border border-neutral-800 bg-neutral-900/45 hover:bg-neutral-900 px-4 py-3 text-sm text-neutral-400 hover:text-neutral-200 transition"
                      >
                        {task}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {lastPrompt && (
              <div className="mb-6 flex justify-end">
                <div className="max-w-[82%] rounded-2xl rounded-br-md bg-neutral-100 text-neutral-900 px-4 py-3 text-[15px] leading-6 whitespace-pre-wrap">
                  {lastPrompt}
                </div>
              </div>
            )}

            {(isRunning || Object.keys(progress).length > 0) && (
              <div className="mb-6 rounded-2xl border border-neutral-800 bg-neutral-900/35 overflow-hidden">
                <div className="px-5 py-4 flex items-center justify-between gap-4 border-b border-neutral-800/70">
                  <div className="flex items-center gap-2.5">
                    {isRunning ? <Loader2 className="w-4 h-4 text-blue-400 animate-spin" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    <span className="text-sm font-medium text-neutral-200">{isRunning ? "Nova travaille" : "Exécution terminée"}</span>
                  </div>
                  {result?.model && <span className="text-[11px] text-neutral-600">{result.model}</span>}
                </div>
                <div className="p-4 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                  {PHASES.map((phase) => {
                    const event = progress[phase.id];
                    const hiddenResearch = phase.id === "research" && !allowWeb && !event;
                    if (hiddenResearch) return null;
                    return (
                      <div key={phase.id} className="rounded-xl bg-black/15 border border-neutral-800/60 px-3 py-2.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <StatusIcon event={event} />
                          <span className="text-[11px] font-medium text-neutral-400 truncate">{phase.label}</span>
                        </div>
                        <div className="mt-1 text-[9px] text-neutral-700 truncate" title={event?.message}>{event?.message || "En attente"}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {error && (
              <div className="mb-6 rounded-2xl border border-rose-500/20 bg-rose-500/[0.06] p-5 flex gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-rose-200">Nova s'est arrêté avant de toucher plus loin au projet</div>
                  <div className="mt-1 text-sm leading-6 text-rose-300/75 whitespace-pre-wrap">{error}</div>
                </div>
              </div>
            )}

            {result && (
              <div className="space-y-4">
                <section className={`rounded-2xl border p-6 ${result.success ? "border-emerald-500/20 bg-emerald-500/[0.035]" : "border-amber-500/20 bg-amber-500/[0.035]"}`}>
                  <div className="flex items-start justify-between gap-5">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-3">
                        {result.success ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertTriangle className="w-5 h-5 text-amber-400" />}
                        <h2 className="text-base font-semibold text-white">{result.success ? "Terminé" : "À vérifier"}</h2>
                      </div>
                      <ReadableText text={result.summary} />
                    </div>
                    <div className="shrink-0 flex items-center gap-3 text-[11px] text-neutral-600">
                      {result.durationMs > 0 && <span className="flex items-center gap-1"><Clock3 className="w-3.5 h-3.5" /> {formatDuration(result.durationMs)}</span>}
                      {result.webUsed && <span className="flex items-center gap-1 text-blue-400/70"><Globe2 className="w-3.5 h-3.5" /> Web</span>}
                    </div>
                  </div>
                </section>

                {result.changedFiles.length > 0 && (
                  <section className="rounded-2xl border border-neutral-800 bg-neutral-900/30 overflow-hidden">
                    <div className="px-5 py-4 border-b border-neutral-800/70 flex items-center justify-between">
                      <span className="text-sm font-medium text-neutral-200">Fichiers modifiés</span>
                      <span className="text-[11px] text-neutral-600">{result.changedFiles.length}</span>
                    </div>
                    <div className="p-2">
                      {result.changedFiles.map((file) => {
                        const stat = result.changeStats?.find((x) => x.path === file);
                        return (
                          <button key={file} onClick={() => openFile(file)} className="w-full rounded-lg px-3 py-2.5 hover:bg-neutral-800/60 flex items-center gap-3 text-left">
                            <FileCode2 className="w-4 h-4 text-blue-400 shrink-0" />
                            <span className="text-sm text-neutral-300 truncate flex-1">{file}</span>
                            {stat && (
                              <span className="text-[10px] text-neutral-600 shrink-0">
                                {stat.created ? "nouveau" : `${stat.deltaLines >= 0 ? "+" : ""}${stat.deltaLines} lignes`}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </section>
                )}

                <section className="rounded-2xl border border-neutral-800 bg-neutral-900/30 overflow-hidden">
                  <button onClick={() => setShowDetails((v) => !v)} className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-neutral-900/70">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-neutral-500" />
                      <span className="text-sm font-medium text-neutral-300">Vérifications</span>
                      <span className="text-[10px] text-neutral-600">{result.validation.length ? `${result.validation.filter((x) => x.ok).length}/${result.validation.length}` : "aucune commande"}</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-neutral-600 transition-transform ${showDetails ? "rotate-180" : ""}`} />
                  </button>
                  {showDetails && (
                    <div className="border-t border-neutral-800/70 p-4 space-y-3">
                      {result.validation.length === 0 ? (
                        <p className="text-xs text-neutral-600">Aucun script de lint/test/build détecté dans ce projet.</p>
                      ) : result.validation.map((check, index) => (
                        <details key={`${check.command}-${index}`} className="rounded-xl border border-neutral-800 bg-black/15 overflow-hidden">
                          <summary className="cursor-pointer list-none px-4 py-3 flex items-center gap-2 text-xs">
                            {check.ok ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <XCircle className="w-3.5 h-3.5 text-rose-400" />}
                            <span className="font-mono text-neutral-400">{check.command}</span>
                          </summary>
                          {!check.ok && (
                            <pre className="border-t border-neutral-800 p-4 max-h-64 overflow-auto whitespace-pre-wrap break-words text-[11px] leading-5 text-rose-300/75 font-mono">{`${check.stdout}\n${check.stderr}`.trim()}</pre>
                          )}
                        </details>
                      ))}
                      {result.notes?.length > 0 && (
                        <div className="pt-2 text-xs leading-6 text-neutral-500">
                          {result.notes.map((note, i) => <div key={i}>• {note}</div>)}
                        </div>
                      )}
                    </div>
                  )}
                </section>

                {result.snapshotId && result.changedFiles.length > 0 && (
                  <div className="flex justify-end">
                    <button
                      onClick={undo}
                      disabled={isUndoing}
                      className="h-9 px-3 rounded-lg border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-xs text-neutral-400 hover:text-neutral-200 flex items-center gap-2 disabled:opacity-50"
                    >
                      {isUndoing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                      Annuler cette tâche
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="shrink-0 px-6 pb-5 pt-2 bg-gradient-to-t from-[#09090b] via-[#09090b] to-transparent">
          <div className="max-w-4xl mx-auto rounded-2xl border border-neutral-700/80 bg-neutral-900 shadow-2xl shadow-black/40 focus-within:border-neutral-600 transition">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === "Enter") run();
              }}
              disabled={isRunning}
              placeholder={workspaceRoot ? "Décris simplement ce que tu veux changer, créer ou réparer…" : "Ouvre d'abord un projet…"}
              className="w-full min-h-[88px] max-h-[220px] resize-y bg-transparent px-4 pt-4 pb-2 outline-none text-[15px] leading-6 text-neutral-100 placeholder-neutral-600 disabled:opacity-50"
            />
            <div className="px-3 pb-3 flex items-center justify-between gap-3">
              <div className="text-[10px] text-neutral-700 px-1">Ctrl + Entrée</div>
              <button
                onClick={() => run()}
                disabled={!prompt.trim() || isRunning || !workspaceRoot}
                className="h-9 px-4 rounded-xl bg-white hover:bg-neutral-200 text-black disabled:opacity-30 disabled:hover:bg-white text-sm font-semibold flex items-center gap-2 transition"
              >
                {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                {isRunning ? "Travail en cours" : "Exécuter"}
              </button>
            </div>
          </div>
          <div className="max-w-4xl mx-auto mt-2 text-center text-[10px] text-neutral-700">
            Nova travaille uniquement dans le dossier choisi et crée un point de retour avant chaque tâche.
          </div>
        </div>
      </section>

      {selectedFile && (
        <aside className="w-[42%] max-w-[720px] min-w-[420px] shrink-0 border-l border-neutral-800 bg-[#0b0b0e] flex flex-col min-h-0 shadow-2xl shadow-black/40">
          <div className="h-14 shrink-0 px-4 border-b border-neutral-800 flex items-center justify-between gap-3">
            <div className="min-w-0 flex items-center gap-2">
              <FileCode2 className="w-4 h-4 text-blue-400 shrink-0" />
              <span className="text-xs font-mono text-neutral-300 truncate" title={selectedFile}>{selectedFile}</span>
            </div>
            <button onClick={() => setSelectedFile("")} className="w-8 h-8 rounded-lg hover:bg-neutral-800 flex items-center justify-center text-neutral-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 min-h-0 overflow-auto bg-black/20">
            {isReadingFile ? (
              <div className="h-full flex items-center justify-center"><Loader2 className="w-5 h-5 text-neutral-500 animate-spin" /></div>
            ) : (
              <pre className="p-5 text-[12px] leading-6 text-neutral-300 font-mono whitespace-pre overflow-auto min-w-full">{selectedFileContent}</pre>
            )}
          </div>
        </aside>
      )}
    </div>
  );
};

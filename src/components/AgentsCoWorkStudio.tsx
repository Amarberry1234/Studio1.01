import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Code2,
  FolderOpen,
  Folder,
  FileCode2,
  Search,
  Play,
  Loader2,
  CheckCircle2,
  XCircle,
  Circle,
  RotateCcw,
  ShieldCheck,
  Terminal,
  X,
  ChevronRight,
  Sparkles,
  GitBranch,
  Cpu,
  PanelRightClose,
  AlertTriangle,
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

interface CodeTaskResult {
  success: boolean;
  projectName: string;
  model: string;
  summary: string;
  notes: string[];
  changedFiles: string[];
  snapshotId: string;
  validation: ValidationResult[];
  autoFixAttempted: boolean;
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
  runCodeTask: (payload: { root: string; prompt: string; host?: string; model?: string }) => Promise<CodeTaskResult>;
  undoCodeTask: (root: string, snapshotId: string) => Promise<{ success: boolean; restored: string[] }>;
  onCodeProgress: (callback: (payload: ProgressEvent) => void) => () => void;
}

declare global {
  interface Window {
    novaDesktop?: DesktopBridge;
  }
}

interface AgentsCoWorkStudioProps {
  ollamaHost?: string;
  selectedModelId?: string;
}

const PHASES = [
  { id: "scan", label: "Lire le projet" },
  { id: "think", label: "Préparer" },
  { id: "write", label: "Modifier" },
  { id: "test", label: "Tester" },
  { id: "fix", label: "Corriger" },
  { id: "done", label: "Terminé" },
];

function shortPath(value: string, max = 54) {
  if (value.length <= max) return value;
  return `…${value.slice(-(max - 1))}`;
}

function readableSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function cleanReadable(text: string) {
  return String(text || "")
    .replace(/\r/g, "")
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

export const AgentsCoWorkStudio: React.FC<AgentsCoWorkStudioProps> = ({
  ollamaHost,
  selectedModelId,
}) => {
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
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const isDesktop = !!window.novaDesktop;

  useEffect(() => {
    const saved = localStorage.getItem("nova_code_workspace") || "";
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
    return files.filter((f) => !q || f.path.toLowerCase().includes(q)).slice(0, 220);
  }, [files, fileSearch]);

  const openWorkspace = async () => {
    setError("");
    if (!window.novaDesktop) {
      setError("L'ouverture directe d'un dossier est disponible dans l'application Windows Nova.");
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

    try {
      const output = await window.novaDesktop.runCodeTask({
        root: workspaceRoot,
        prompt: task,
        host: ollamaHost,
        model: selectedModelId,
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
      setError(err?.message || "Impossible d'annuler les changements.");
    } finally {
      setIsUndoing(false);
    }
  };

  const activeProgress = PHASES.map((phase) => ({ ...phase, event: progress[phase.id] })).filter((x) => x.event);
  const currentProgress = [...activeProgress].reverse().find((x) => x.event?.status === "running")?.event;
  const passedTests = result?.validation?.filter((v) => v.ok).length || 0;
  const failedTests = result?.validation?.filter((v) => !v.ok).length || 0;

  return (
    <div className="flex-1 h-full min-h-0 bg-[#09090b] text-neutral-100 flex overflow-hidden">
      <aside className="w-[278px] shrink-0 border-r border-neutral-800/80 bg-[#0c0c0f] flex flex-col min-h-0">
        <div className="h-14 px-4 border-b border-neutral-800/80 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-xs font-semibold text-neutral-200 truncate">{workspaceName || "Aucun projet"}</div>
            <div className="text-[10px] text-neutral-600 truncate" title={workspaceRoot}>{workspaceRoot ? shortPath(workspaceRoot, 34) : "Choisis un dossier à coder"}</div>
          </div>
          <button
            onClick={openWorkspace}
            className="w-8 h-8 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center transition"
            title="Ouvrir un dossier"
          >
            <FolderOpen className="w-4 h-4" />
          </button>
        </div>

        {workspaceRoot ? (
          <>
            <div className="p-3 border-b border-neutral-800/70">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-neutral-600" />
                <input
                  value={fileSearch}
                  onChange={(e) => setFileSearch(e.target.value)}
                  placeholder="Chercher un fichier"
                  className="w-full h-8 pl-8 pr-2 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-neutral-300 placeholder-neutral-600 outline-none focus:border-neutral-700"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto py-2 px-2">
              <div className="px-2 pb-2 flex items-center gap-2 text-[10px] uppercase tracking-wider font-semibold text-neutral-600">
                <Folder className="w-3.5 h-3.5" />
                <span>Fichiers</span>
                <span className="ml-auto normal-case tracking-normal font-normal">{files.length}</span>
              </div>
              {filteredFiles.map((file) => {
                const depth = Math.min(4, Math.max(0, file.path.split("/").length - 1));
                const name = file.path.split("/").pop() || file.path;
                return (
                  <button
                    key={file.path}
                    onClick={() => openFile(file.path)}
                    className={`w-full h-7 rounded-md flex items-center gap-2 pr-2 text-left text-xs transition ${selectedFile === file.path ? "bg-blue-500/10 text-blue-200" : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900"}`}
                    style={{ paddingLeft: 8 + depth * 12 }}
                    title={`${file.path} — ${readableSize(file.size)}`}
                  >
                    <FileCode2 className="w-3.5 h-3.5 shrink-0 text-neutral-600" />
                    <span className="truncate">{name}</span>
                  </button>
                );
              })}
            </div>

            <div className="px-3 py-3 border-t border-neutral-800/80 text-[10px] text-neutral-600 flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Nova modifie seulement ce dossier</span>
            </div>
          </>
        ) : (
          <div className="flex-1 p-4 flex flex-col items-center justify-center text-center">
            <div className="w-11 h-11 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-3">
              <FolderOpen className="w-5 h-5 text-neutral-400" />
            </div>
            <div className="text-sm font-medium text-neutral-300">Ouvre ton projet</div>
            <div className="text-xs leading-5 text-neutral-600 mt-1 mb-4">Nova pourra lire, modifier et tester les fichiers de ce dossier.</div>
            <button onClick={openWorkspace} className="h-9 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition">Choisir un dossier</button>
          </div>
        )}
      </aside>

      <section className="flex-1 min-w-0 flex flex-col bg-[#09090b]">
        <div className="h-14 shrink-0 border-b border-neutral-800/80 px-5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600/15 border border-blue-500/20 flex items-center justify-center">
            <Code2 className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <div className="text-sm font-semibold text-neutral-100">Nova Code</div>
            <div className="text-[10px] text-neutral-600">Agent local · fichiers réels · tests réels · snapshots automatiques</div>
          </div>
          <div className="flex-1" />
          <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-neutral-500 bg-neutral-900/70 border border-neutral-800 rounded-lg px-2.5 py-1.5">
            <Cpu className="w-3.5 h-3.5 text-emerald-500" />
            <span className="max-w-44 truncate">{result?.model || selectedModelId || "Modèle Ollama auto"}</span>
          </div>
          <div className="hidden md:flex items-center gap-1.5 text-[11px] text-neutral-500">
            <GitBranch className="w-3.5 h-3.5" />
            <span>snapshot avant écriture</span>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto">
          <div className="max-w-[900px] mx-auto px-6 py-9 pb-44">
            {!lastPrompt && !isRunning && !result && !error && (
              <div className="min-h-[54vh] flex flex-col items-center justify-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600/20 to-violet-600/20 border border-blue-500/20 flex items-center justify-center mb-5 shadow-2xl shadow-blue-950/20">
                  <Sparkles className="w-6 h-6 text-blue-300" />
                </div>
                <h1 className="text-2xl font-semibold tracking-tight text-white">Qu'est-ce qu'on code?</h1>
                <p className="mt-2 max-w-xl text-sm leading-6 text-neutral-500">
                  Donne-moi le résultat que tu veux. Je lis le projet, je modifie les fichiers, je lance les vérifications et je tente une correction si ça casse.
                </p>
                {!workspaceRoot && (
                  <button onClick={openWorkspace} className="mt-6 h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium flex items-center gap-2 transition">
                    <FolderOpen className="w-4 h-4" /> Ouvrir un projet
                  </button>
                )}
                {workspaceRoot && (
                  <div className="mt-7 grid sm:grid-cols-3 gap-2 w-full max-w-2xl">
                    {["Corrige les erreurs TypeScript et vérifie le build.", "Ajoute la fonctionnalité décrite dans le README.", "Simplifie ce projet sans casser ce qui fonctionne."].map((example) => (
                      <button key={example} onClick={() => run(example)} className="text-left rounded-xl border border-neutral-800 bg-neutral-900/40 hover:bg-neutral-900 p-3 text-xs leading-5 text-neutral-400 hover:text-neutral-200 transition">
                        {example}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {lastPrompt && (
              <div className="mb-7 flex justify-end">
                <div className="max-w-[82%] rounded-2xl rounded-tr-md bg-blue-600 px-4 py-3 text-[15px] leading-6 text-white shadow-lg shadow-blue-950/20">
                  {lastPrompt}
                </div>
              </div>
            )}

            {(isRunning || activeProgress.length > 0) && (
              <div className="mb-7 rounded-2xl border border-neutral-800 bg-neutral-900/35 overflow-hidden">
                <div className="px-4 py-3 border-b border-neutral-800 flex items-center gap-3">
                  {isRunning ? <Loader2 className="w-4 h-4 text-blue-400 animate-spin" /> : result?.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Circle className="w-4 h-4 text-neutral-600" />}
                  <div className="text-sm font-medium text-neutral-200">{currentProgress?.message || (isRunning ? "Nova travaille..." : "Exécution terminée")}</div>
                </div>
                <div className="px-4 py-3 flex flex-wrap gap-x-5 gap-y-2">
                  {PHASES.filter((phase) => progress[phase.id] || phase.id === "done" && result).map((phase) => {
                    const event = progress[phase.id];
                    const status = event?.status || (phase.id === "done" && result ? (result.success ? "done" : "error") : undefined);
                    return (
                      <div key={phase.id} className="flex items-center gap-1.5 text-[11px]">
                        {status === "running" ? <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" /> : status === "done" ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : status === "error" ? <XCircle className="w-3.5 h-3.5 text-rose-400" /> : <Circle className="w-3.5 h-3.5 text-neutral-700" />}
                        <span className={status ? "text-neutral-400" : "text-neutral-700"}>{phase.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {error && (
              <div className="mb-7 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 flex gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-rose-200">Nova a rencontré un problème</div>
                  <div className="mt-1 text-sm leading-6 text-rose-300/80 whitespace-pre-wrap">{error}</div>
                </div>
              </div>
            )}

            {result && (
              <div className="space-y-5">
                <div className={`rounded-2xl border p-5 ${result.success ? "border-emerald-500/20 bg-emerald-500/[0.035]" : "border-amber-500/20 bg-amber-500/[0.035]"}`}>
                  <div className="flex items-start gap-3">
                    {result.success ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" /> : <XCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />}
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-white">{result.success ? "Terminé" : "Modifications faites, mais une vérification échoue"}</div>
                      <div className="mt-2"><ReadableText text={result.summary} /></div>
                    </div>
                  </div>
                </div>

                {result.changedFiles.length > 0 && (
                  <div className="rounded-2xl border border-neutral-800 bg-neutral-900/35 overflow-hidden">
                    <div className="px-4 py-3 border-b border-neutral-800 flex items-center justify-between">
                      <div className="text-xs font-semibold text-neutral-300">Fichiers modifiés <span className="text-neutral-600 font-normal">({result.changedFiles.length})</span></div>
                      {result.snapshotId && (
                        <button onClick={undo} disabled={isUndoing} className="h-7 px-2 rounded-lg hover:bg-neutral-800 text-[11px] text-neutral-500 hover:text-neutral-200 flex items-center gap-1.5 transition disabled:opacity-50">
                          {isUndoing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                          Annuler cette tâche
                        </button>
                      )}
                    </div>
                    <div className="p-2">
                      {result.changedFiles.map((file) => (
                        <button key={file} onClick={() => openFile(file)} className="w-full px-2.5 py-2 rounded-lg flex items-center gap-2 text-left hover:bg-neutral-800/60 transition">
                          <FileCode2 className="w-4 h-4 text-blue-400 shrink-0" />
                          <span className="text-xs text-neutral-300 truncate">{file}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-neutral-700 ml-auto shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {result.validation.length > 0 && (
                  <div className="rounded-2xl border border-neutral-800 bg-neutral-900/35 overflow-hidden">
                    <div className="px-4 py-3 border-b border-neutral-800 flex items-center gap-2 text-xs font-semibold text-neutral-300">
                      <Terminal className="w-4 h-4 text-neutral-500" /> Vérifications
                      <span className="ml-auto font-normal text-neutral-600">{passedTests} réussie(s){failedTests ? ` · ${failedTests} échouée(s)` : ""}</span>
                    </div>
                    <div className="divide-y divide-neutral-800/80">
                      {result.validation.map((test, index) => (
                        <details key={`${test.command}-${index}`} className="group">
                          <summary className="list-none cursor-pointer px-4 py-3 flex items-center gap-2 text-xs">
                            {test.ok ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-rose-400" />}
                            <code className="text-neutral-400">{test.command}</code>
                            <span className="ml-auto text-neutral-700">code {test.code}</span>
                          </summary>
                          {!test.ok && (
                            <pre className="mx-4 mb-4 max-h-64 overflow-auto rounded-xl bg-black/30 border border-neutral-800 p-3 text-[11px] leading-5 text-neutral-400 whitespace-pre-wrap">{(test.stderr || test.stdout || "Aucun détail").slice(-12000)}</pre>
                          )}
                        </details>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="absolute bottom-0 left-[278px] right-0 pointer-events-none">
          <div className="max-w-[900px] mx-auto px-6 pb-5 pointer-events-auto">
            <div className="rounded-2xl border border-neutral-700/80 bg-[#111114]/95 backdrop-blur-xl shadow-2xl shadow-black/40 overflow-hidden">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    run();
                  }
                }}
                disabled={isRunning}
                placeholder={workspaceRoot ? "Dis-moi ce que tu veux changer dans ce projet…" : "Ouvre un projet pour commencer…"}
                className="w-full min-h-[82px] max-h-56 resize-y bg-transparent px-4 pt-4 pb-2 text-[15px] leading-6 text-neutral-100 placeholder-neutral-600 outline-none disabled:opacity-60"
              />
              <div className="px-3 pb-3 flex items-center gap-3">
                <div className="text-[10px] text-neutral-600">Entrée = exécuter · Shift+Entrée = nouvelle ligne</div>
                <div className="flex-1" />
                <button
                  onClick={() => run()}
                  disabled={!prompt.trim() || isRunning || !workspaceRoot}
                  className="h-9 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-neutral-800 disabled:text-neutral-600 text-white text-xs font-medium flex items-center gap-2 transition"
                >
                  {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  {isRunning ? "En cours" : "Exécuter"}
                </button>
              </div>
            </div>
            <div className="text-center mt-2 text-[10px] text-neutral-700">Nova peut se tromper. Les modifications sont sauvegardées dans un snapshot avant écriture.</div>
          </div>
        </div>
      </section>

      {selectedFile && (
        <aside className="w-[420px] shrink-0 border-l border-neutral-800 bg-[#0c0c0f] flex flex-col min-h-0">
          <div className="h-14 px-4 border-b border-neutral-800 flex items-center gap-2">
            <FileCode2 className="w-4 h-4 text-blue-400 shrink-0" />
            <span className="text-xs text-neutral-300 truncate" title={selectedFile}>{selectedFile}</span>
            <button onClick={() => setSelectedFile("")} className="ml-auto w-8 h-8 rounded-lg hover:bg-neutral-800 flex items-center justify-center text-neutral-500 hover:text-white transition" title="Fermer l'aperçu">
              <PanelRightClose className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 min-h-0 overflow-auto bg-black/20">
            {isReadingFile ? (
              <div className="h-full flex items-center justify-center"><Loader2 className="w-5 h-5 text-neutral-500 animate-spin" /></div>
            ) : (
              <pre className="p-4 text-[12px] leading-6 font-mono text-neutral-400 whitespace-pre overflow-x-auto">{selectedFileContent}</pre>
            )}
          </div>
          <div className="px-4 py-2 border-t border-neutral-800 text-[10px] text-neutral-700 flex items-center gap-1.5">
            <X className="w-3 h-3" /> aperçu en lecture seule
          </div>
        </aside>
      )}
    </div>
  );
};

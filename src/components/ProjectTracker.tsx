import React, { useState } from "react";
import { ProjectItem, AppSettings } from "../types";
import { exportProjectsToPDF, exportToCSV } from "../utils/export";
import {
  Kanban,
  Plus,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Send,
  Download,
  Share2,
  Trash2,
  Tag,
  User,
  Sparkles,
  ExternalLink,
  Bell,
} from "lucide-react";

interface ProjectTrackerProps {
  projects: ProjectItem[];
  onUpdateProjects: (projects: ProjectItem[]) => void;
  settings: AppSettings;
}

export const ProjectTracker: React.FC<ProjectTrackerProps> = ({
  projects,
  onUpdateProjects,
  settings,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [newProject, setNewProject] = useState<Partial<ProjectItem>>({
    title: "",
    description: "",
    deadline: new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0],
    status: "todo",
    priority: "medium",
    assignedTo: "Amar",
    tags: ["Productivité", "Local AI"],
  });
  const [tagInput, setTagInput] = useState("");
  const [notificationStatus, setNotificationStatus] = useState<string | null>(null);

  const urgentTasks = projects.filter(
    (p) => p.status !== "done" && (p.priority === "urgent" || p.priority === "high")
  );

  const filteredProjects = projects.filter((p) => {
    if (filterPriority !== "all" && p.priority !== filterPriority) return false;
    return true;
  });

  const handleAddProject = () => {
    if (!newProject.title?.trim()) return;
    const item: ProjectItem = {
      id: `proj-${Date.now()}`,
      title: newProject.title,
      description: newProject.description || "",
      deadline: newProject.deadline || new Date().toISOString().split("T")[0],
      status: newProject.status as any || "todo",
      priority: newProject.priority as any || "medium",
      assignedTo: newProject.assignedTo || "Amar",
      tags: newProject.tags || [],
      jiraKey: `LOCAL-${Math.floor(100 + Math.random() * 900)}`,
      createdAt: new Date().toISOString(),
    };

    onUpdateProjects([item, ...projects]);
    setShowAddModal(false);
    setNewProject({
      title: "",
      description: "",
      deadline: new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0],
      status: "todo",
      priority: "medium",
      assignedTo: "Amar",
      tags: ["Productivité"],
    });
  };

  const handleUpdateStatus = (id: string, status: ProjectItem["status"]) => {
    onUpdateProjects(
      projects.map((p) => (p.id === id ? { ...p, status } : p))
    );
  };

  const handleDeleteProject = (id: string) => {
    onUpdateProjects(projects.filter((p) => p.id !== id));
  };

  const handleSendSlackAlert = async (project: ProjectItem) => {
    setNotificationStatus(`Envoi de l'alerte Slack pour "${project.title}"...`);
    try {
      const res = await fetch("/api/integrations/slack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          webhookUrl: settings.slack.webhookUrl,
          message: `🚨 *Alerte Échéance Projet* : *${project.title}*\n• Priorité : ${project.priority.toUpperCase()}\n• Deadline : ${project.deadline}\n• Assigné à : ${project.assignedTo || "Amar"}\n• Détail : ${project.description}`,
          channel: settings.slack.channel,
        }),
      });
      const data = await res.json();
      setNotificationStatus(`✓ Alerte envoyée sur Slack (${settings.slack.channel}) avec succès !`);
      setTimeout(() => setNotificationStatus(null), 3500);
    } catch (_err) {
      setNotificationStatus("Échec de l'envoi Slack.");
    }
  };

  const handleExportJira = async (project: ProjectItem) => {
    try {
      const res = await fetch("/api/integrations/jira", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issueKey: project.jiraKey,
          summary: project.title,
          description: project.description,
          priority: project.priority,
          assignee: project.assignedTo,
        }),
      });
      const data = await res.json();
      navigator.clipboard.writeText(data.formattedJiraMarkdown);
      setNotificationStatus(`✓ Ticket ${data.issueKey} au format Jira copié dans le presse-papiers !`);
      setTimeout(() => setNotificationStatus(null), 3500);
    } catch (_err) {
      setNotificationStatus("Erreur d'export Jira.");
    }
  };

  return (
    <div id="project-tracker-view" className="flex-1 flex flex-col h-full bg-neutral-900/50 overflow-y-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <h1 className="text-base font-bold text-neutral-100 flex items-center space-x-2">
            <Kanban className="w-5 h-5 text-blue-400" />
            <span>Pilotage de Projets, Deadlines & Synchronisation</span>
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Suivez vos livrables IA, recevez des alertes automatiques et synchronisez avec Slack & Jira.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => exportProjectsToPDF(projects)}
            className="flex items-center space-x-1.5 bg-neutral-950 hover:bg-neutral-850 border border-neutral-800 text-neutral-300 text-xs px-3 py-2 rounded-xl transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exporter en PDF</span>
          </button>

          <button
            onClick={() => exportToCSV("projets_deadlines", projects)}
            className="flex items-center space-x-1.5 bg-neutral-950 hover:bg-neutral-850 border border-neutral-800 text-neutral-300 text-xs px-3 py-2 rounded-xl transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exporter en CSV</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-md transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nouveau Projet</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notificationStatus && (
        <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{notificationStatus}</span>
        </div>
      )}

      {/* Smart Alerts Banner */}
      {urgentTasks.length > 0 && (
        <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/30 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <Bell className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-rose-200">
                {urgentTasks.length} tâche(s) critique(s) avec échéance proche !
              </h3>
              <p className="text-[11px] text-rose-300/80">
                Pensez à exécuter les prompts requis et à notifier votre équipe via le webhook Slack.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono font-bold text-rose-400 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">
            Alerte Active
          </span>
        </div>
      )}

      {/* Priority Filters */}
      <div className="flex items-center space-x-2 text-xs">
        <span className="text-neutral-400 font-medium">Filtrer par priorité :</span>
        {["all", "urgent", "high", "medium", "low"].map((p) => (
          <button
            key={p}
            onClick={() => setFilterPriority(p)}
            className={`px-2.5 py-1 rounded-lg uppercase text-[10px] font-bold tracking-wider transition ${
              filterPriority === p
                ? "bg-blue-600 text-white"
                : "bg-neutral-950 text-neutral-400 hover:text-neutral-200 border border-neutral-850"
            }`}
          >
            {p === "all" ? "Tous" : p}
          </button>
        ))}
      </div>

      {/* Kanban Columns */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1">
        {(
          [
            { id: "todo", title: "À Faire", color: "text-neutral-400", border: "border-neutral-800" },
            { id: "in_progress", title: "En Cours", color: "text-blue-400", border: "border-blue-500/30" },
            { id: "review", title: "Revue / Validation", color: "text-purple-400", border: "border-purple-500/30" },
            { id: "done", title: "Terminé", color: "text-emerald-400", border: "border-emerald-500/30" },
          ] as const
        ).map((col) => {
          const colTasks = filteredProjects.filter((p) => p.status === col.id);

          return (
            <div
              key={col.id}
              className="bg-neutral-950 border border-neutral-850 rounded-2xl p-3.5 flex flex-col space-y-3"
            >
              <div className="flex items-center justify-between pb-2 border-b border-neutral-850">
                <span className={`font-bold text-xs ${col.color}`}>{col.title}</span>
                <span className="text-[10px] font-mono text-neutral-400 bg-neutral-900 px-2 py-0.5 rounded">
                  {colTasks.length}
                </span>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto min-h-[300px]">
                {colTasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-xl p-3 space-y-2.5 transition shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <span className="font-semibold text-xs text-neutral-100 leading-snug">
                        {task.title}
                      </span>
                      <button
                        onClick={() => handleDeleteProject(task.id)}
                        className="text-neutral-500 hover:text-rose-400 ml-1 p-0.5"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    <p className="text-[11px] text-neutral-400 leading-relaxed">
                      {task.description}
                    </p>

                    <div className="flex flex-wrap gap-1">
                      {task.tags.map((t, idx) => (
                        <span
                          key={idx}
                          className="text-[9px] bg-neutral-950 text-neutral-400 px-1.5 py-0.5 rounded border border-neutral-850 font-mono"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-neutral-400 pt-2 border-t border-neutral-850">
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-neutral-500" />
                        <span>{task.deadline}</span>
                      </span>

                      <span
                        className={`font-bold uppercase text-[9px] px-1.5 py-0.5 rounded ${
                          task.priority === "urgent"
                            ? "bg-rose-500/20 text-rose-300"
                            : task.priority === "high"
                            ? "bg-amber-500/20 text-amber-300"
                            : "bg-blue-500/20 text-blue-300"
                        }`}
                      >
                        {task.priority}
                      </span>
                    </div>

                    {/* Quick Sync Buttons (Slack & Jira) */}
                    <div className="flex items-center space-x-1.5 pt-1">
                      <button
                        onClick={() => handleSendSlackAlert(task)}
                        className="flex-1 bg-neutral-950 hover:bg-neutral-800 text-[10px] text-neutral-300 py-1 rounded-lg border border-neutral-850 flex items-center justify-center space-x-1 transition"
                        title="Envoyer une notification Slack"
                      >
                        <Send className="w-2.5 h-2.5 text-blue-400" />
                        <span>Slack</span>
                      </button>
                      <button
                        onClick={() => handleExportJira(task)}
                        className="flex-1 bg-neutral-950 hover:bg-neutral-800 text-[10px] text-neutral-300 py-1 rounded-lg border border-neutral-850 flex items-center justify-center space-x-1 transition"
                        title="Formater pour Jira"
                      >
                        <Tag className="w-2.5 h-2.5 text-purple-400" />
                        <span>Jira</span>
                      </button>
                    </div>

                    {/* Status Changer */}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-neutral-500">Déplacer vers :</span>
                      <select
                        value={task.status}
                        onChange={(e) => handleUpdateStatus(task.id, e.target.value as any)}
                        className="bg-neutral-950 border border-neutral-800 text-[10px] text-neutral-300 rounded px-1.5 py-0.5 focus:outline-none"
                      >
                        <option value="todo">À Faire</option>
                        <option value="in_progress">En Cours</option>
                        <option value="review">Revue</option>
                        <option value="done">Terminé</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Project Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-neutral-200 text-xs">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h2 className="text-sm font-bold text-neutral-100 flex items-center space-x-2">
                <Kanban className="w-4 h-4 text-blue-400" />
                <span>Nouveau Projet & Échéance</span>
              </h2>
              <button onClick={() => setShowAddModal(false)} className="text-neutral-500 hover:text-neutral-300">
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="font-semibold block mb-1">Titre de la tâche</label>
                <input
                  type="text"
                  value={newProject.title}
                  onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                  placeholder="Ex : Fine-tuning DeepSeek-R1 pour analyse légale"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-neutral-200"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Description & Objectif</label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  rows={3}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-neutral-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Date d'échéance (Deadline)</label>
                  <input
                    type="date"
                    value={newProject.deadline}
                    onChange={(e) => setNewProject({ ...newProject, deadline: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-neutral-200"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Priorité</label>
                  <select
                    value={newProject.priority}
                    onChange={(e) => setNewProject({ ...newProject, priority: e.target.value as any })}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-neutral-200"
                  >
                    <option value="low">Faible</option>
                    <option value="medium">Moyenne</option>
                    <option value="high">Élevée</option>
                    <option value="urgent">Urgente</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-800 flex justify-end space-x-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300"
              >
                Annuler
              </button>
              <button
                onClick={handleAddProject}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow"
              >
                Ajouter la tâche
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

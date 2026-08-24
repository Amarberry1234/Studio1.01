import React, { useState } from "react";
import {
  FolderArchive,
  Download,
  FileText,
  FileCode,
  FileSpreadsheet,
  Search,
  Filter,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  Gamepad2,
  Paintbrush,
  HeartPulse,
  Share2,
  Calendar,
  Layers,
} from "lucide-react";
import { jsPDF } from "jspdf";
import { MasterPortfolioItem, ChatSession, ProjectItem } from "../types";

interface MasterPortfolioDossierProps {
  sessions: ChatSession[];
  projects: ProjectItem[];
}

export const MasterPortfolioDossier: React.FC<MasterPortfolioDossierProps> = ({
  sessions,
  projects,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Compile All Project Artifacts Dynamically
  const portfolioItems: MasterPortfolioItem[] = [
    // 1. Autonomous Offers
    {
      id: "port-opp-1",
      type: "market_offer",
      title: "InvoiceVault Local - Extracteur OCR & Grand Livre Sécurisé",
      category: "Offre Commerciale Autonome",
      summary: "SaaS Local d'extraction OCR de factures pour TPE/PME sans abonnement cloud.",
      content: "Prix conseillé: $49 | Volume: 85,000 req/mois | 100% Libre de Droit & Prêt à vendre.",
      date: new Date().toISOString().split("T")[0],
      tags: ["SaaS", "Finance", "OCR", "Autonome"],
    },
    {
      id: "port-opp-2",
      type: "graphic_asset",
      title: "Apex Cyber Mecha - Vector T-Shirt Streetwear Pack",
      category: "Design Textile & Vectoriel",
      summary: "Emblème textile haute résolution SVG/PNG transparent prêt pour sérigraphie.",
      content: "Format Vectoriel SVG pur | Optimisé pour impression DTG & flocage.",
      date: new Date().toISOString().split("T")[0],
      tags: ["Merch", "T-Shirt", "Vectoriel", "Streetwear"],
    },
    {
      id: "port-opp-3",
      type: "game",
      title: "Alien Swarm : Reactive 2D & GTA 2 Retro Engines",
      category: "Moteur de Jeux Rétro",
      summary: "Jeux 2D HTML5 Canvas complets avec IA de horde, lampes torches dynamiques et physique de drift.",
      content: "60 FPS Canvas | 0 dépendance | Jouable en local et exportable en standalone.",
      date: new Date().toISOString().split("T")[0],
      tags: ["GameDev", "Alien Swarm", "GTA 2", "Canvas 2D"],
    },
    {
      id: "port-opp-4",
      type: "doctor_report",
      title: "Rapport Médical & Optimisation Système PC",
      category: "Santé Système & Sécurité",
      summary: "Nettoyage de mémoire vive, défragmentation du cache V8 et audit zéro-télémétrie.",
      content: "Score: 98/100 | RAM Libérée: +215 Mo | Bouclier privé: 100% sécurisé.",
      date: new Date().toISOString().split("T")[0],
      tags: ["Docteur", "Optimisation", "RAM", "Offline"],
    },
    // 2. Chat Sessions
    ...sessions.map((s) => ({
      id: `port-session-${s.id}`,
      type: "session" as const,
      title: `Session IA : ${s.title}`,
      category: "Consultation & Architecture",
      summary: `Dialogue local avec ${s.messages.length} messages et modèle ${s.modelId}.`,
      content: s.messages.map((m) => `[${m.role.toUpperCase()}] ${m.content}`).join("\n\n"),
      date: s.createdAt.split("T")[0],
      tags: ["Chat", "Architecture", s.modelId],
    })),
    // 3. Projects / Kanban Tasks
    ...projects.map((p) => ({
      id: `port-proj-${p.id}`,
      type: "project_task" as const,
      title: `Projet Kanban : ${p.title}`,
      category: "Gestion de Projet",
      summary: p.description,
      content: `Priorité: ${p.priority.toUpperCase()} | Échéance: ${p.deadline} | Statut: ${p.status.toUpperCase()}`,
      date: p.createdAt.split("T")[0],
      tags: p.tags,
    })),
  ];

  const filteredItems = portfolioItems.filter((item) => {
    const matchesCategory = selectedCategory === "all" || item.type === selectedCategory;
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Generate Master PDF Dossier using jsPDF
  const handleExportMasterPdf = () => {
    setIsExportingPdf(true);
    try {
      const doc = new jsPDF();

      // Header & Title
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 40, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.text("DOSSIER MAÎTRE DES PROJETS RÉALISÉS", 14, 22);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(148, 163, 184);
      doc.text(`Généré le ${new Date().toLocaleDateString()} | 100% Libre de Droit & Open-Source`, 14, 32);

      let yPos = 55;

      filteredItems.forEach((item, index) => {
        if (yPos > 260) {
          doc.addPage();
          yPos = 20;
        }

        doc.setDrawColor(226, 232, 240);
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(14, yPos - 5, 182, 35, 3, 3, "FD");

        doc.setTextColor(15, 23, 42);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text(`${index + 1}. ${item.title}`, 18, yPos + 2);

        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 116, 139);
        doc.text(`Catégorie : ${item.category} | Date : ${item.date}`, 18, yPos + 9);

        doc.setTextColor(51, 65, 85);
        doc.setFontSize(9);
        const splitSummary = doc.splitTextToSize(item.summary, 170);
        doc.text(splitSummary, 18, yPos + 16);

        yPos += 42;
      });

      doc.save(`dossier-maitre-projets-${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (err) {
      console.error("Erreur PDF:", err);
      alert("Erreur lors de la génération du PDF.");
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportMarkdownDossier = () => {
    const mdContent = `# DOSSIER COMPLET DE TOUS LES PROJETS RÉALISÉS
Date : ${new Date().toLocaleString()}
Licence : 100% Libre de Droit, Open Commercial & Privé

---

${filteredItems
  .map(
    (item, idx) => `## ${idx + 1}. ${item.title}
- **Catégorie :** ${item.category}
- **Date :** ${item.date}
- **Tags :** ${item.tags.join(", ")}

### Résumé :
${item.summary}

### Détails & Spécifications :
\`\`\`
${item.content}
\`\`\`

---
`
  )
  .join("\n")}
`;

    const blob = new Blob([mdContent], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dossier-complet-projets-${new Date().toISOString().split("T")[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJsonBundle = () => {
    const jsonContent = JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        totalItems: filteredItems.length,
        items: filteredItems,
      },
      null,
      2
    );
    const blob = new Blob([jsonContent], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `archive-projets-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-950 text-neutral-100 overflow-y-auto">
      {/* Header Bar */}
      <div className="border-b border-neutral-800 bg-neutral-900/80 backdrop-blur-md px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <FolderArchive className="w-5 h-5 text-neutral-950 font-bold" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold text-white tracking-tight">
                Dossier & Portfolio de Tous les Projets Réalisés
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                LIVRABLES TÉLÉCHARGEABLES
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              Centralise toutes vos créations : offres commerciales, designs t-shirts, jeux 2D, diagnostics et tâches
            </p>
          </div>
        </div>

        {/* Master Export Actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportJsonBundle}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 text-xs font-medium transition"
          >
            <FileCode className="w-3.5 h-3.5 text-blue-400" />
            <span>JSON Archive</span>
          </button>

          <button
            onClick={handleExportMarkdownDossier}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 text-xs font-medium transition"
          >
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            <span>Markdown (.md)</span>
          </button>

          <button
            onClick={handleExportMasterPdf}
            disabled={isExportingPdf}
            className="flex items-center space-x-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-neutral-950 font-bold text-xs transition shadow-lg shadow-amber-500/20"
          >
            <Download className={`w-3.5 h-3.5 ${isExportingPdf ? "animate-spin" : ""}`} />
            <span>TÉLÉCHARGER DOSSIER PDF</span>
          </button>
        </div>
      </div>

      <div className="p-6 max-w-6xl mx-auto w-full space-y-6">
        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-neutral-900/60 border border-neutral-800 rounded-2xl p-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Rechercher parmi les projets réalisés..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none transition"
            />
          </div>

          <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto pb-1 text-xs">
            {[
              { id: "all", label: "Tous les Projets" },
              { id: "market_offer", label: "💼 Offres Autonomes" },
              { id: "graphic_asset", label: "👕 Designs & T-Shirts" },
              { id: "game", label: "🎮 Jeux Vidéo" },
              { id: "doctor_report", label: "💊 Santé PC" },
              { id: "project_task", label: "📋 Tâches Kanban" },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition ${
                  selectedCategory === cat.id
                    ? "bg-amber-500 text-neutral-950 font-bold"
                    : "bg-neutral-800 text-neutral-400 hover:text-white"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Project Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-neutral-900/40 border border-neutral-800/80 hover:border-neutral-700 rounded-2xl p-5 space-y-3 transition flex flex-col justify-between text-left"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {item.category.toUpperCase()}
                  </span>
                  <span className="text-xs text-neutral-500 flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>{item.date}</span>
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white line-clamp-1">{item.title}</h3>
                <p className="text-xs text-neutral-300 line-clamp-2 leading-relaxed">
                  {item.summary}
                </p>
              </div>

              <div className="pt-3 border-t border-neutral-800/60 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-1">
                  {item.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-neutral-950 border border-neutral-800 text-[10px] text-neutral-400"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                <span className="text-[11px] text-emerald-400 font-medium">
                  ✓ Prêt à l'Emploi
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

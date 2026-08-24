import React, { useState, useEffect } from "react";
import {
  Lightbulb,
  Sparkles,
  TrendingUp,
  Package,
  ShoppingCart,
  DollarSign,
  Zap,
  Target,
  ArrowRight,
  CheckCircle2,
  Copy,
  Check,
  RefreshCw,
  Search,
  ExternalLink,
  Flame,
  Percent,
  Play,
  ShieldCheck,
  BarChart3,
  Video,
  Radio,
  Sliders,
  ChevronRight,
  Filter,
} from "lucide-react";
import confetti from "canvas-confetti";
import {
  DropshippingDeal,
  MonetizableAIIdea,
  MarketplaceListingAudit,
} from "../types";

export const BusinessEcomAgentsStudio: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<
    "deals_hunter" | "creative_ideas" | "marketplace_arb" | "promo_machine"
  >("deals_hunter");

  // Deals Hunter State
  const [selectedNiche, setSelectedNiche] = useState<string>("tous");
  const [deals, setDeals] = useState<DropshippingDeal[]>([]);
  const [isLoadingDeals, setIsLoadingDeals] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<DropshippingDeal | null>(null);

  // Creative Ideas State
  const [creativeNiche, setCreativeNiche] = useState("Intelligence Artificielle & Automatisation");
  const [ideas, setIdeas] = useState<MonetizableAIIdea[]>([]);
  const [isLoadingIdeas, setIsLoadingIdeas] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<MonetizableAIIdea | null>(null);

  // Marketplace Audit State
  const [auditProduct, setAuditProduct] = useState("Mini-Mixeur Sans Fil USB-C");
  const [auditPrice, setAuditPrice] = useState("34.95");
  const [auditPlatform, setAuditPlatform] = useState<"amazon" | "ebay" | "shopify" | "etsy">("amazon");
  const [auditResult, setAuditResult] = useState<MarketplaceListingAudit | null>(null);
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);

  // Promo Machine State
  const [promoProduct, setPromoProduct] = useState("Correcteur de Posture Intelligent Biofeedback");
  const [promoAudience, setPromoAudience] = useState("Télétravailleurs et personnes souffrant du dos");
  const [promoResult, setPromoResult] = useState<any>(null);
  const [isLoadingPromo, setIsLoadingPromo] = useState(false);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Export Deal to Shopify CSV format
  const handleExportCSV = (deal: DropshippingDeal) => {
    const csvContent = [
      ["Handle", "Title", "Body (HTML)", "Vendor", "Type", "Tags", "Variant Price", "Variant Compare At Price", "Cost per item"],
      [
        deal.productTitle.toLowerCase().replace(/[^a-z0-9]/g, "-"),
        `"${deal.productTitle}"`,
        `"<p>${deal.whySellNow}</p><p><strong>Hook:</strong> ${deal.hookMarketing}</p>"`,
        `"Swarm Dropshipping Scout"`,
        `"${deal.niche}"`,
        `"winner, viral, dropshipping, ${deal.niche}"`,
        deal.recommendedSellPrice.toFixed(2),
        deal.competitorHighPrice.toFixed(2),
        deal.sourceSupplierPrice.toFixed(2),
      ],
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `shopify_product_${deal.niche}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    handleTriggerConfetti();
  };

  // Load initial deals and ideas
  useEffect(() => {
    fetchDeals("tous");
    fetchCreativeIdeas("Micro-SaaS & E-commerce");
    runMarketplaceAudit("Mini-Mixeur Sans Fil USB-C", 34.95, "amazon");
    runPromoGenerator("Correcteur de Posture Intelligent", "Télétravailleurs");
  }, []);

  const fetchDeals = async (niche: string) => {
    setIsLoadingDeals(true);
    try {
      const res = await fetch("/api/agents/dropshipping/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: niche }),
      });
      const data = await res.json();
      if (data.success && data.deals) {
        setDeals(data.deals);
        if (!selectedDeal || niche !== selectedNiche) {
          setSelectedDeal(data.deals[0] || null);
        }
      }
    } catch (err) {
      console.error("Erreur chargement deals:", err);
    } finally {
      setIsLoadingDeals(false);
    }
  };

  const fetchCreativeIdeas = async (nicheTarget: string) => {
    setIsLoadingIdeas(true);
    try {
      const res = await fetch("/api/agents/creative-ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche: nicheTarget }),
      });
      const data = await res.json();
      if (data.success && data.ideas) {
        setIdeas(data.ideas);
        setSelectedIdea(data.ideas[0] || null);
      }
    } catch (err) {
      console.error("Erreur chargement idées:", err);
    } finally {
      setIsLoadingIdeas(false);
    }
  };

  const runMarketplaceAudit = async (product: string, price: number, platform: string) => {
    setIsLoadingAudit(true);
    try {
      const res = await fetch("/api/agents/marketplace/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productName: product, currentPrice: price, platform }),
      });
      const data = await res.json();
      if (data.success && data.audit) {
        setAuditResult(data.audit);
      }
    } catch (err) {
      console.error("Erreur audit marketplace:", err);
    } finally {
      setIsLoadingAudit(false);
    }
  };

  const runPromoGenerator = async (product: string, audience: string) => {
    setIsLoadingPromo(true);
    try {
      const res = await fetch("/api/agents/promo/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productTitle: product, targetAudience: audience }),
      });
      const data = await res.json();
      if (data.success && data.campaign) {
        setPromoResult(data.campaign);
      }
    } catch (err) {
      console.error("Erreur promo generator:", err);
    } finally {
      setIsLoadingPromo(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleTriggerConfetti = () => {
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 },
      colors: ["#10B981", "#3B82F6", "#F59E0B"],
    });
  };

  return (
    <div className="space-y-6">
      {/* Subtabs for E-com & Monetization Agents */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-neutral-900/90 p-2 rounded-2xl border border-neutral-800 shadow-md">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            id="subtab-deals"
            onClick={() => setActiveSubTab("deals_hunter")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition ${
              activeSubTab === "deals_hunter"
                ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-500/20"
                : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50"
            }`}
          >
            <Package className="w-4 h-4 text-indigo-300" />
            <span>📦 Chasseur Deals & Prix E-com</span>
            <span className="px-1.5 py-0.5 text-[9px] rounded bg-indigo-500/30 text-indigo-200">
              {deals.length} Winners
            </span>
          </button>

          <button
            id="subtab-creative"
            onClick={() => setActiveSubTab("creative_ideas")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition ${
              activeSubTab === "creative_ideas"
                ? "bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg shadow-amber-500/20"
                : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50"
            }`}
          >
            <Lightbulb className="w-4 h-4 text-amber-300" />
            <span>💡 Idées IA Monétisables</span>
            <span className="px-1.5 py-0.5 text-[9px] rounded bg-amber-500/30 text-amber-200">
              Cash-Flow
            </span>
          </button>

          <button
            id="subtab-marketplace"
            onClick={() => setActiveSubTab("marketplace_arb")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition ${
              activeSubTab === "marketplace_arb"
                ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/20"
                : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50"
            }`}
          >
            <ShoppingCart className="w-4 h-4 text-cyan-300" />
            <span>🛒 Arbitrage & Buy Box</span>
          </button>

          <button
            id="subtab-promo"
            onClick={() => setActiveSubTab("promo_machine")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition ${
              activeSubTab === "promo_machine"
                ? "bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-lg shadow-rose-500/20"
                : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50"
            }`}
          >
            <Sparkles className="w-4 h-4 text-rose-300" />
            <span>🚀 Machine Promotionnelle & UGC</span>
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[11px] font-mono text-emerald-400 font-bold">
            Intelligence Monétisation 100% Active
          </span>
        </div>
      </div>

      {/* ======================================================================
          SECTION 1: DROPSHIPPING DEALS & PRICING DISCREPANCY DETECTOR
      ====================================================================== */}
      {activeSubTab === "deals_hunter" && (
        <div className="space-y-6">
          {/* Top Banner / Filter */}
          <div className="bg-gradient-to-br from-neutral-900 via-neutral-900 to-indigo-950/40 border border-indigo-500/30 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <Package className="w-5 h-5 text-indigo-400" />
                  <span className="text-xs uppercase font-bold tracking-widest text-indigo-400">
                    AGENT DROPSHIPPING & INTELLIGENCE DES ÉCARTS DE PRIX
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white">
                  Radar Offre & Demande, Écarts de Prix & Marges Gagnantes
                </h2>
                <p className="text-xs text-neutral-400 max-w-2xl">
                  L'agent scanne le coût d'achat fournisseur et calcule exactement le tarif auquel vous devriez vendre pour battre la concurrence tout en dégageant plus de 75% de marge nette.
                </p>
              </div>

              {/* Niche selector */}
              <div className="flex flex-wrap items-center gap-2">
                {["tous", "santé & bien-être", "gadgets & high-tech", "déco & maison"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedNiche(cat);
                      fetchDeals(cat);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition ${
                      selectedNiche === cat
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 border border-indigo-400/40"
                        : "bg-neutral-800/80 text-neutral-400 hover:text-white border border-neutral-700/50"
                    }`}
                  >
                    {cat}
                  </button>
                ))}

                <button
                  onClick={() => fetchDeals(selectedNiche)}
                  disabled={isLoadingDeals}
                  className="p-2 rounded-xl bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700 transition"
                  title="Rafraîchir les deals"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingDeals ? "animate-spin text-indigo-400" : ""}`} />
                </button>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="bg-neutral-950/60 p-3 rounded-2xl border border-neutral-800 flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
                  %
                </div>
                <div>
                  <div className="text-[10px] text-neutral-400">Marge Nette Moyenne</div>
                  <div className="text-sm font-bold text-emerald-400">81.3% de profit</div>
                </div>
              </div>

              <div className="bg-neutral-950/60 p-3 rounded-2xl border border-neutral-800 flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">
                  🔥
                </div>
                <div>
                  <div className="text-[10px] text-neutral-400">Score de Demande</div>
                  <div className="text-sm font-bold text-indigo-400">92/100 (Explosif)</div>
                </div>
              </div>

              <div className="bg-neutral-950/60 p-3 rounded-2xl border border-neutral-800 flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold">
                  ⚖️
                </div>
                <div>
                  <div className="text-[10px] text-neutral-400">Écart Fournisseur / Vente</div>
                  <div className="text-sm font-bold text-amber-400">x5.2 Multiplicateur</div>
                </div>
              </div>

              <div className="bg-neutral-950/60 p-3 rounded-2xl border border-neutral-800 flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold">
                  🛡️
                </div>
                <div>
                  <div className="text-[10px] text-neutral-400">Protection Saturation</div>
                  <div className="text-sm font-bold text-blue-400">Anti-Guerre des Prix</div>
                </div>
              </div>
            </div>
          </div>

          {/* Deals Grid & Focus View */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Deals List */}
            <div className="lg:col-span-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center justify-between">
                <span>Produits Gagnants Détectés</span>
                <span className="text-indigo-400">{deals.length} Opportunités</span>
              </h3>

              {deals.map((deal) => {
                const isSelected = selectedDeal?.id === deal.id;
                return (
                  <div
                    key={deal.id}
                    onClick={() => setSelectedDeal(deal)}
                    className={`p-4 rounded-2xl border transition cursor-pointer relative overflow-hidden ${
                      isSelected
                        ? "bg-indigo-950/30 border-indigo-500/60 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/30"
                        : "bg-neutral-900/60 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            {deal.niche}
                          </span>
                          <span className="text-[10px] text-emerald-400 font-bold">
                            +{deal.estimatedMarginPercent}% Marge
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white line-clamp-1">
                          {deal.productTitle}
                        </h4>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-xs font-bold text-emerald-400">
                          {deal.recommendedSellPrice.toFixed(2)}€
                        </div>
                        <div className="text-[10px] text-neutral-500 line-through">
                          Coût : {deal.sourceSupplierPrice.toFixed(2)}€
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-400">
                      <span className="text-indigo-300 flex items-center space-x-1">
                        <Flame className="w-3.5 h-3.5 text-amber-400" />
                        <span>{deal.trendGrowth}</span>
                      </span>
                      <span className="text-emerald-400 font-bold">
                        Bénéfice : +{deal.estimatedNetProfit.toFixed(2)}€ / vente
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Deal Deep-Dive Sheet */}
            <div className="lg:col-span-7">
              {selectedDeal ? (
                <div className="bg-neutral-900/90 border border-neutral-800 rounded-3xl p-6 space-y-6 shadow-2xl sticky top-4">
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {selectedDeal.niche}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Demande {selectedDeal.demandScore}/100
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-white">
                        {selectedDeal.productTitle}
                      </h3>
                      <p className="text-xs text-neutral-400">
                        {selectedDeal.whySellNow}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        onClick={() => handleExportCSV(selectedDeal)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-1.5 transition shadow-md shadow-emerald-600/30"
                        title="Télécharger la fiche produit prête à être importée dans Shopify ou TikTok Shop"
                      >
                        <Package className="w-3.5 h-3.5" />
                        <span>Export CSV Shopify</span>
                      </button>

                      <button
                        onClick={() => {
                          handleCopy(
                            `Produit : ${selectedDeal.productTitle}\nPrix Recommandé : ${selectedDeal.recommendedSellPrice}€\nConseil : ${selectedDeal.pricingStrategy}`,
                            "deal-info"
                          );
                          handleTriggerConfetti();
                        }}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center space-x-1.5 transition shadow-md shadow-indigo-600/30"
                      >
                        {copiedId === "deal-info" ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-300" />
                            <span>Copié !</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copier Fiche</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Pricing Matrix & Discrepancy Breakdown */}
                  <div className="p-4 rounded-2xl bg-neutral-950/80 border border-indigo-500/30 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center space-x-1.5">
                        <DollarSign className="w-4 h-4 text-emerald-400" />
                        <span>Analyse de Tarification & Écarts Marché</span>
                      </span>
                      <span className="text-[11px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        Marge nette estimée : {selectedDeal.estimatedMarginPercent}%
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800">
                        <div className="text-[10px] text-neutral-400">Prix d'Achat Usine</div>
                        <div className="text-base font-bold text-neutral-300">
                          {selectedDeal.sourceSupplierPrice.toFixed(2)}€
                        </div>
                        <div className="text-[9px] text-neutral-500">Fournisseur vérifié</div>
                      </div>

                      <div className="p-3 rounded-xl bg-indigo-900/30 border border-indigo-500/50 shadow-inner">
                        <div className="text-[10px] text-indigo-300 font-bold">Prix de Vente Idéal</div>
                        <div className="text-lg font-black text-emerald-400">
                          {selectedDeal.recommendedSellPrice.toFixed(2)}€
                        </div>
                        <div className="text-[9px] text-indigo-300 font-semibold">Conseillé par l'Agent</div>
                      </div>

                      <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800">
                        <div className="text-[10px] text-neutral-400">Prix Concurrent Haut</div>
                        <div className="text-base font-bold text-amber-400">
                          {selectedDeal.competitorHighPrice.toFixed(2)}€
                        </div>
                        <div className="text-[9px] text-neutral-500">Moyenne : {selectedDeal.competitorAveragePrice.toFixed(2)}€</div>
                      </div>
                    </div>

                    {/* Pricing Strategy Explanation */}
                    <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-200 leading-relaxed">
                      <strong className="text-white block mb-1 font-bold">
                        🧠 Stratégie d'Encadrement du Prix :
                      </strong>
                      {selectedDeal.pricingStrategy}
                    </div>
                  </div>

                  {/* Viral Marketing & Ad Copy Pack */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center space-x-2">
                      <Zap className="w-4 h-4 text-amber-400" />
                      <span>Kit d'Acquisition & Scripts Viraux</span>
                    </h4>

                    <div className="p-3.5 rounded-2xl bg-neutral-950/60 border border-neutral-800 space-y-2">
                      <div className="text-[11px] font-bold text-amber-400">
                        ⚡ Hook Vidéo TikTok / Reels (0-3s) :
                      </div>
                      <p className="text-xs text-neutral-200 italic font-mono bg-neutral-900 p-2.5 rounded-xl border border-neutral-800">
                        "{selectedDeal.hookMarketing}"
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-neutral-950/60 border border-neutral-800 space-y-2">
                      <div className="text-[11px] font-bold text-blue-400">
                        📢 Texte Publicitaire Prêt à Lancer (Ad Copy) :
                      </div>
                      <p className="text-xs text-neutral-300 leading-relaxed">
                        {selectedDeal.adCopy}
                      </p>
                    </div>

                    {selectedDeal.viralTiktokVideoPrompt && (
                      <div className="p-3.5 rounded-2xl bg-neutral-950/60 border border-neutral-800 space-y-2">
                        <div className="text-[11px] font-bold text-rose-400 flex items-center space-x-1.5">
                          <Video className="w-3.5 h-3.5" />
                          <span>Scénario Visuel 15s :</span>
                        </div>
                        <p className="text-xs text-neutral-400">
                          {selectedDeal.viralTiktokVideoPrompt}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="h-64 rounded-3xl border border-dashed border-neutral-800 flex items-center justify-center text-neutral-500 text-xs">
                  Sélectionnez un deal dans la liste pour voir l'analyse complète
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================
          SECTION 2: CREATIVE IDEATOR & SERIOUSLY MONETIZABLE AI BUSINESSES
      ====================================================================== */}
      {activeSubTab === "creative_ideas" && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-neutral-900 via-neutral-900 to-amber-950/40 border border-amber-500/30 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <Lightbulb className="w-5 h-5 text-amber-400" />
                  <span className="text-xs uppercase font-bold tracking-widest text-amber-400">
                    AGENT CRÉATIF & INCUBATEUR D'IDÉES IA ULTRA-MONÉTISABLES
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white">
                  Générateur de Business IA Concrets & Rentables
                </h2>
                <p className="text-xs text-neutral-400 max-w-2xl">
                  Ne perdez pas de temps avec des idées théoriques. Cet agent conçoit des concepts d'IA prêts à encaisser dès la première semaine avec un plan tarifaire et un funnel d'acquisition complet.
                </p>
              </div>

              {/* Custom Niche Search Bar */}
              <div className="flex items-center space-x-2 max-w-md w-full">
                <input
                  type="text"
                  value={creativeNiche}
                  onChange={(e) => setCreativeNiche(e.target.value)}
                  placeholder="Ex: Immobilier, E-commerce, Artisans..."
                  className="flex-1 bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                />
                <button
                  onClick={() => fetchCreativeIdeas(creativeNiche)}
                  disabled={isLoadingIdeas}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center space-x-1.5 transition shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isLoadingIdeas ? "Génération..." : "Générer Idées"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Ideas Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {ideas.map((idea) => {
              const isSelected = selectedIdea?.id === idea.id;
              return (
                <div
                  key={idea.id}
                  onClick={() => setSelectedIdea(idea)}
                  className={`p-5 rounded-3xl border transition flex flex-col justify-between cursor-pointer space-y-4 ${
                    isSelected
                      ? "bg-amber-950/20 border-amber-500/60 shadow-xl shadow-amber-500/10 ring-1 ring-amber-500/30"
                      : "bg-neutral-900/80 border-neutral-800 hover:border-neutral-700"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {idea.category.replace("_", " ")}
                      </span>
                      <span className="text-xs font-bold text-emerald-400">
                        {idea.monthlyRevenuePotential}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white leading-snug">
                      {idea.title}
                    </h4>

                    <p className="text-xs text-neutral-400 line-clamp-3">
                      {idea.elevatorPitch}
                    </p>
                  </div>

                  <div className="space-y-2 pt-3 border-t border-neutral-800">
                    <div className="flex items-center justify-between text-[11px] text-neutral-400">
                      <span>Coût de lancement :</span>
                      <span className="text-white font-bold">{idea.startupCost}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-neutral-400">
                      <span>Temps de déploiement :</span>
                      <span className="text-amber-300 font-bold">{idea.timeToLaunch}</span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedIdea(idea);
                        handleCopy(
                          `Idée IA : ${idea.title}\nPotentiel : ${idea.monthlyRevenuePotential}\nPitch : ${idea.elevatorPitch}\nPlan de monétisation : ${idea.monetizationPlan}`,
                          idea.id
                        );
                        handleTriggerConfetti();
                      }}
                      className="w-full mt-2 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold flex items-center justify-center space-x-1.5 transition border border-neutral-700"
                    >
                      {copiedId === idea.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Plan Copié !</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copier Blueprint Complet</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Deep Blueprint View if selected */}
          {selectedIdea && (
            <div className="bg-neutral-900/90 border border-neutral-800 rounded-3xl p-6 space-y-6 shadow-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs uppercase font-bold text-amber-400">
                    BLUEPRINT DE MONÉTISATION EXHAUSTIF
                  </span>
                  <h3 className="text-lg font-bold text-white mt-1">
                    {selectedIdea.title}
                  </h3>
                </div>
                <div className="text-right">
                  <div className="text-xs text-neutral-400">Potentiel de Cash-Flow</div>
                  <div className="text-base font-black text-emerald-400">
                    {selectedIdea.monthlyRevenuePotential}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {selectedIdea.pricingTiers.map((tier, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-neutral-950/80 border border-neutral-800 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-300">{tier.tier}</span>
                      <span className="text-sm font-black text-amber-400">{tier.price}</span>
                    </div>
                    <p className="text-xs text-neutral-400">{tier.description}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-neutral-950/60 border border-neutral-800 space-y-2">
                  <div className="font-bold text-blue-400 flex items-center space-x-1.5">
                    <Target className="w-4 h-4" />
                    <span>Funnel d'Acquisition (Clients Payants) :</span>
                  </div>
                  <p className="text-neutral-300 leading-relaxed">
                    {selectedIdea.acquisitionFunnel}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-neutral-950/60 border border-neutral-800 space-y-2">
                  <div className="font-bold text-emerald-400 flex items-center space-x-1.5">
                    <DollarSign className="w-4 h-4" />
                    <span>Plan d'Encaissement & Scaling :</span>
                  </div>
                  <p className="text-neutral-300 leading-relaxed">
                    {selectedIdea.monetizationPlan}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================================
          SECTION 3: MARKETPLACE AUDIT & BUY BOX DOMINATOR
      ====================================================================== */}
      {activeSubTab === "marketplace_arb" && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-neutral-900 via-neutral-900 to-cyan-950/40 border border-cyan-500/30 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <ShoppingCart className="w-5 h-5 text-cyan-400" />
                  <span className="text-xs uppercase font-bold tracking-widest text-cyan-400">
                    AGENT MARKETPLACE & DOMINATION BUY BOX
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white">
                  Audit Tarifaire Multi-Plateforme & Optimisation de Vente
                </h2>
                <p className="text-xs text-neutral-400 max-w-2xl">
                  Testez n'importe quel prix pour savoir si l'algorithme d'Amazon, eBay ou Shopify vous donnera la Buy Box ou si vous perdez des ventes bêtement.
                </p>
              </div>

              {/* Input Form */}
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={auditProduct}
                  onChange={(e) => setAuditProduct(e.target.value)}
                  placeholder="Nom du produit"
                  className="bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500"
                />
                <input
                  type="number"
                  value={auditPrice}
                  onChange={(e) => setAuditPrice(e.target.value)}
                  placeholder="Prix actuel (€)"
                  className="w-24 bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white"
                />
                <select
                  value={auditPlatform}
                  onChange={(e) => setAuditPlatform(e.target.value as any)}
                  className="bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="amazon">Amazon</option>
                  <option value="shopify">Shopify</option>
                  <option value="ebay">eBay</option>
                  <option value="etsy">Etsy</option>
                </select>

                <button
                  onClick={() => runMarketplaceAudit(auditProduct, parseFloat(auditPrice) || 29.99, auditPlatform)}
                  disabled={isLoadingAudit}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition flex items-center space-x-1.5"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>{isLoadingAudit ? "Audit..." : "Auditer Prix"}</span>
                </button>
              </div>
            </div>
          </div>

          {auditResult && (
            <div className="bg-neutral-900/90 border border-neutral-800 rounded-3xl p-6 space-y-6 shadow-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
                <div>
                  <span className="text-xs uppercase font-bold text-cyan-400">
                    RÉSULTAT DE L'AUDIT ALGORITHMIQUE ({auditResult.platform.toUpperCase()})
                  </span>
                  <h3 className="text-lg font-bold text-white mt-1">
                    {auditResult.productName}
                  </h3>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <div className="text-[10px] text-neutral-400">Chances d'Obtention Buy Box</div>
                    <div className="text-base font-black text-emerald-400">
                      {auditResult.buyBoxChance}% Probabilité
                    </div>
                  </div>
                </div>
              </div>

              {/* Pricing Verdict */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 text-center">
                  <div className="text-xs text-neutral-400">Votre Prix Actuel</div>
                  <div className="text-xl font-bold text-neutral-300 mt-1">
                    {auditResult.currentPrice.toFixed(2)}€
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/50 text-center shadow-inner">
                  <div className="text-xs text-cyan-300 font-bold">Prix Optimal Recommandé</div>
                  <div className="text-2xl font-black text-emerald-400 mt-1">
                    {auditResult.optimalPrice.toFixed(2)}€
                  </div>
                  <div className="text-[10px] text-cyan-300">
                    Delta : {auditResult.priceDelta > 0 ? `+${auditResult.priceDelta}€` : `${auditResult.priceDelta}€`} ({auditResult.priceDeltaPercent}%)
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 text-center">
                  <div className="text-xs text-neutral-400">Marge Nette Consolidée</div>
                  <div className="text-xl font-bold text-emerald-400 mt-1">
                    {auditResult.marginAtOptimal}%
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-200 leading-relaxed">
                <strong className="text-white block mb-1 font-bold">
                  🎯 Recommandation de l'Agent Marketplace :
                </strong>
                {auditResult.recommendation}
              </div>

              {/* Competitor Radar Table */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                  Offres Concurrentes Directes
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-neutral-800 text-neutral-400">
                        <th className="pb-2">Vendeur</th>
                        <th className="pb-2">Prix Affiché</th>
                        <th className="pb-2">Évaluation</th>
                        <th className="pb-2">Délai Livraison</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/60">
                      {auditResult.competitorOffers.map((comp, idx) => (
                        <tr key={idx} className="text-neutral-300">
                          <td className="py-2.5 font-medium">{comp.seller}</td>
                          <td className="py-2.5 font-bold text-white">{comp.price.toFixed(2)}€</td>
                          <td className="py-2.5 text-amber-400">★ {comp.rating}</td>
                          <td className="py-2.5 text-neutral-400">{comp.deliveryDays} jour(s)</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================================
          SECTION 4: PROMO MACHINE & VIRAL UGC ADS
      ====================================================================== */}
      {activeSubTab === "promo_machine" && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-neutral-900 via-neutral-900 to-rose-950/40 border border-rose-500/30 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-rose-400" />
                  <span className="text-xs uppercase font-bold tracking-widest text-rose-400">
                    AGENT PROMOTIONNEL & MACHINE À VENDRE
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white">
                  Générateur de Hooks Viraux, Bundles & Scripts Publicitaires
                </h2>
                <p className="text-xs text-neutral-400 max-w-2xl">
                  Générez en 1 clic les meilleures offres promotionnelles (1 acheté = 1 offert, packs duo) et les textes publicitaires qui transforment les clics en achats.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={promoProduct}
                  onChange={(e) => setPromoProduct(e.target.value)}
                  placeholder="Nom du produit"
                  className="bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-neutral-500"
                />
                <button
                  onClick={() => runPromoGenerator(promoProduct, promoAudience)}
                  disabled={isLoadingPromo}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center space-x-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isLoadingPromo ? "Génération..." : "Générer Campagne"}</span>
                </button>
              </div>
            </div>
          </div>

          {promoResult && (
            <div className="bg-neutral-900/90 border border-neutral-800 rounded-3xl p-6 space-y-6 shadow-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs uppercase font-bold text-rose-400">
                    KIT DE CONVERSION PROMOTIONNELLE
                  </span>
                  <h3 className="text-lg font-bold text-white mt-1">
                    Campagne pour : {promoResult.productTitle}
                  </h3>
                </div>
                <button
                  onClick={() => {
                    handleCopy(JSON.stringify(promoResult, null, 2), "all-promo");
                    handleTriggerConfetti();
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center space-x-1.5 transition"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copier Toute la Campagne</span>
                </button>
              </div>

              {/* Viral Hooks */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center space-x-1.5">
                  <Flame className="w-4 h-4" />
                  <span>Top 4 Hooks Viraux (Accroches TikTok / Shorts)</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {promoResult.hooksViral.map((hook: string, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-neutral-950/80 border border-neutral-800 flex items-center justify-between gap-2"
                    >
                      <p className="text-xs text-neutral-200 font-mono italic">"{hook}"</p>
                      <button
                        onClick={() => handleCopy(hook, `hook-${idx}`)}
                        className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
                        title="Copier"
                      >
                        {copiedId === `hook-${idx}` ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bundles Matrix */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center space-x-1.5">
                  <Package className="w-4 h-4" />
                  <span>Offres Groupées Irrésistibles (Bundles & Upsells)</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {promoResult.bundleOffers.map((bundle: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-neutral-950/80 border border-indigo-500/20 space-y-2"
                    >
                      <div className="text-xs font-bold text-white">{bundle.name}</div>
                      <div className="text-sm font-black text-emerald-400">{bundle.pricing}</div>
                      <p className="text-xs text-neutral-400">{bundle.conversionBenefit}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ad Copies */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400">
                  Textes Publicitaires Optimisés (Meta / TikTok Ads)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {promoResult.adCopies.map((ad: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-neutral-950/80 border border-neutral-800 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-rose-300">{ad.platform}</span>
                        <button
                          onClick={() => handleCopy(`${ad.headline}\n\n${ad.body}\n\n${ad.callToAction}`, `ad-${idx}`)}
                          className="text-[11px] text-neutral-400 hover:text-white flex items-center space-x-1"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Copier</span>
                        </button>
                      </div>
                      <div className="text-xs font-bold text-white">{ad.headline}</div>
                      <p className="text-xs text-neutral-300 leading-relaxed">{ad.body}</p>
                      <div className="text-xs font-bold text-emerald-400">{ad.callToAction}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

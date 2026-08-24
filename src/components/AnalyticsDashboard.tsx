import React from "react";
import { AnalyticsMetric, ModelInfo } from "../types";
import { exportToCSV } from "../utils/export";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import {
  LineChart as LineChartIcon,
  TrendingUp,
  DollarSign,
  Zap,
  Clock,
  Download,
  ShieldCheck,
  Cpu,
  Sparkles,
} from "lucide-react";

interface AnalyticsDashboardProps {
  analytics: AnalyticsMetric[];
  models: ModelInfo[];
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  analytics,
  models,
}) => {
  const totalTokens = analytics.reduce((acc, curr) => acc + curr.tokensGenerated, 0);
  const totalCostSaved = analytics.reduce((acc, curr) => acc + curr.costSavedUsd, 0);
  const totalPrompts = analytics.reduce((acc, curr) => acc + curr.promptsCount, 0);
  const avgSpeed = (
    analytics.reduce((acc, curr) => acc + curr.avgTokensPerSec, 0) / analytics.length
  ).toFixed(1);

  return (
    <div id="analytics-dashboard-view" className="flex-1 flex flex-col h-full bg-neutral-900/50 overflow-y-auto p-4 md:p-6 space-y-6 text-neutral-200 text-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <h1 className="text-base font-bold text-neutral-100 flex items-center space-x-2">
            <LineChartIcon className="w-5 h-5 text-emerald-400" />
            <span>Tableau de Bord Analytics, Débit & Économies Réalisées</span>
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Suivi en temps réel de votre inférence locale, bande passante de jetons et budget préservé.
          </p>
        </div>

        <button
          onClick={() => exportToCSV("analytics_metrics", analytics)}
          className="flex items-center space-x-1.5 bg-neutral-950 hover:bg-neutral-850 border border-neutral-800 text-neutral-300 px-3.5 py-2 rounded-xl transition"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Exporter Métriques CSV</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Économies Financières</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-400 font-mono">
              +{totalCostSaved.toFixed(2)} $
            </div>
            <span className="text-[10px] text-neutral-500">
              Par rapport aux API payantes (OpenAI / Claude)
            </span>
          </div>
        </div>

        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Jetons Générés</span>
            <Zap className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <div className="text-2xl font-black text-blue-400 font-mono">
              {(totalTokens / 1000).toFixed(1)}k
            </div>
            <span className="text-[10px] text-neutral-500">
              Tokens traités en mémoire locale
            </span>
          </div>
        </div>

        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Débit Moyen</span>
            <TrendingUp className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <div className="text-2xl font-black text-purple-400 font-mono">
              {avgSpeed} t/s
            </div>
            <span className="text-[10px] text-neutral-500">
              Vitesse d'inférence GPU / NPU
            </span>
          </div>
        </div>

        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Requêtes & Prompts</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="text-2xl font-black text-neutral-200 font-mono">
              {totalPrompts}
            </div>
            <span className="text-[10px] text-neutral-500">
              Exécutions 100% confidentielles
            </span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Tokens Generation Activity */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 space-y-3 shadow-md">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs text-neutral-200">Volume de Jetons par Jour</h3>
            <span className="text-[10px] text-blue-400 font-mono">Tokens Générés</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics}>
                <defs>
                  <linearGradient id="tokenGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis dataKey="date" stroke="#737373" fontSize={11} />
                <YAxis stroke="#737373" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0a0a0a",
                    borderColor: "#262626",
                    borderRadius: "8px",
                    color: "#f5f5f5",
                    fontSize: "11px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="tokensGenerated"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#tokenGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Money Saved & Tokens/Sec Speed */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 space-y-3 shadow-md">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs text-neutral-200">Vitesse d'Inférence (Tokens/sec)</h3>
            <span className="text-[10px] text-emerald-400 font-mono">Débit Temps Réel</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis dataKey="date" stroke="#737373" fontSize={11} />
                <YAxis stroke="#737373" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0a0a0a",
                    borderColor: "#262626",
                    borderRadius: "8px",
                    color: "#f5f5f5",
                    fontSize: "11px",
                  }}
                />
                <Bar dataKey="avgTokensPerSec" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

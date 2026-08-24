import React, { useState } from "react";
import { Sparkles, Check, Copy, ArrowRight, RefreshCw, X, ShieldCheck, Zap } from "lucide-react";
import { PromptOptimizationResult } from "../types";

interface PromptOptimizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt?: string;
  onApplyPrompt: (optimizedPrompt: string) => void;
}

export const PromptOptimizerModal: React.FC<PromptOptimizerModalProps> = ({
  isOpen,
  onClose,
  initialPrompt = "",
  onApplyPrompt,
}) => {
  const [inputPrompt, setInputPrompt] = useState(initialPrompt);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PromptOptimizationResult | null>(null);
  const [copied, setCopied] = useState(false);

  React.useEffect(() => {
    if (initialPrompt) {
      setInputPrompt(initialPrompt);
    }
  }, [initialPrompt]);

  if (!isOpen) return null;

  const handleOptimize = async () => {
    if (!inputPrompt.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/external-ai/optimize-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawPrompt: inputPrompt }),
      });

      if (!res.ok) throw new Error("Erreur d'optimisation");
      const data: PromptOptimizationResult = await res.json();
      setResult(data);
    } catch (err: any) {
      alert(`Erreur lors de l'optimisation : ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.optimizedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = () => {
    if (!result) return;
    onApplyPrompt(result.optimizedPrompt);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-925">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Optimiseur de Prompt IA (Master Formulateur)
              </h3>
              <p className="text-[11px] text-neutral-400">
                Transforme n'importe quelle consigne brute en un Master Prompt à impact maximal.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Input Prompt */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-300">
              Votre Prompt Initial ou Idée :
            </label>
            <textarea
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              rows={3}
              placeholder="Ex: Fais-moi un composant React de tableau de bord avec tri et pagination..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-purple-500 transition resize-none leading-relaxed text-xs"
            />
          </div>

          <button
            onClick={handleOptimize}
            disabled={!inputPrompt.trim() || isLoading}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold shadow-lg shadow-purple-500/20 disabled:opacity-50 transition flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Formulation du Master Prompt...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Générer le Master Prompt Optimisé</span>
              </>
            )}
          </button>

          {/* Result Card */}
          {result && (
            <div className="space-y-3 pt-2 animate-in fade-in duration-300">
              {/* Quality score badge */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-purple-950/30 border border-purple-500/30">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <div>
                    <span className="font-semibold text-purple-200">
                      Méthode : {result.strategyApplied}
                    </span>
                    <span className="text-[10px] text-emerald-300 ml-2 bg-emerald-500/20 px-1.5 py-0.5 rounded font-mono">
                      {result.qualityGainEstimate}
                    </span>
                  </div>
                </div>
              </div>

              {/* Improvements List */}
              <div className="space-y-1">
                <div className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                  Techniques de Prompt Engineering Appliquées :
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {result.improvements.map((imp, idx) => (
                    <div
                      key={idx}
                      className="p-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-[11px] text-neutral-300 flex items-center space-x-1.5"
                    >
                      <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span className="truncate">{imp}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Master Prompt Output */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-neutral-300">
                    Master Prompt Résultant :
                  </label>
                  <button
                    onClick={handleCopy}
                    className="flex items-center space-x-1 text-purple-300 hover:text-white text-[11px] px-2 py-0.5 rounded bg-purple-900/40"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copié !</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copier</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-neutral-200 text-xs font-mono whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto">
                  {result.optimizedPrompt}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {result && (
          <div className="px-5 py-3 border-t border-neutral-800 bg-neutral-925 flex items-center justify-end space-x-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 text-xs font-medium transition"
            >
              Fermer
            </button>
            <button
              onClick={handleApply}
              className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md transition flex items-center space-x-1.5"
            >
              <span>Appliquer dans l'Éditeur</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

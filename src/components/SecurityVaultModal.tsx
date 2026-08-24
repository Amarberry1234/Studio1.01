import React, { useState } from "react";
import { SecuritySettings } from "../types";
import { hashPassphrase } from "../utils/crypto";
import { ShieldCheck, Lock, Unlock, Key, CheckCircle2, AlertTriangle } from "lucide-react";

interface SecurityVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  security: SecuritySettings;
  onUpdateSecurity: (sec: SecuritySettings) => void;
  masterPassphrase: string;
  onSetMasterPassphrase: (pass: string) => void;
}

export const SecurityVaultModal: React.FC<SecurityVaultModalProps> = ({
  isOpen,
  onClose,
  security,
  onUpdateSecurity,
  masterPassphrase,
  onSetMasterPassphrase,
}) => {
  const [passInput, setPassInput] = useState("");
  const [confirmPassInput, setConfirmPassInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSetupOrUnlock = async () => {
    if (!passInput) {
      setError("Veuillez saisir un mot de passe.");
      return;
    }

    if (!security.passphraseHash) {
      // First-time setup
      if (passInput !== confirmPassInput) {
        setError("Les mots de passe ne correspondent pas.");
        return;
      }
      if (passInput.length < 6) {
        setError("Le mot de passe doit contenir au moins 6 caractères.");
        return;
      }

      const hash = await hashPassphrase(passInput);
      onUpdateSecurity({
        ...security,
        e2eEncryptionEnabled: true,
        isVaultLocked: false,
        passphraseHash: hash,
      });
      onSetMasterPassphrase(passInput);
      setSuccess("✓ Coffre-fort chiffré AES-GCM 256-bit configuré avec succès !");
      setTimeout(() => {
        setSuccess(null);
        onClose();
      }, 1500);
    } else {
      // Unlock verification
      const hash = await hashPassphrase(passInput);
      if (hash === security.passphraseHash) {
        onUpdateSecurity({ ...security, isVaultLocked: false });
        onSetMasterPassphrase(passInput);
        setSuccess("✓ Coffre déverrouillé !");
        setTimeout(() => {
          setSuccess(null);
          onClose();
        }, 1200);
      } else {
        setError("Mot de passe incorrect.");
      }
    }
  };

  const handleLockVault = () => {
    onUpdateSecurity({ ...security, isVaultLocked: true });
    onSetMasterPassphrase("");
    onClose();
  };

  const isConfigured = !!security.passphraseHash;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-950 border border-neutral-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-neutral-200 text-xs">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-sm font-bold text-neutral-100">Coffre Sécurisé & Chiffrement E2E</h2>
              <p className="text-[11px] text-neutral-400">Chiffrement AES-GCM 256-bit côté client.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-300">
            ✕
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-950/40 border border-rose-500/30 text-rose-300 rounded-xl flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 rounded-xl flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <div className="space-y-3">
          {isConfigured && !security.isVaultLocked && (
            <div className="p-3 bg-neutral-900 rounded-xl border border-neutral-800 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-emerald-400 font-semibold">
                <Unlock className="w-4 h-4" />
                <span>Coffre actuellement déverrouillé</span>
              </div>
              <button
                onClick={handleLockVault}
                className="bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-3 py-1.5 rounded-lg text-xs font-medium transition"
              >
                Verrouiller
              </button>
            </div>
          )}

          {(!isConfigured || security.isVaultLocked) && (
            <div className="space-y-3">
              <div>
                <label className="font-semibold block mb-1">
                  {isConfigured ? "Mot de passe maître pour déverrouiller" : "Créer un mot de passe maître local"}
                </label>
                <input
                  type="password"
                  value={passInput}
                  onChange={(e) => {
                    setPassInput(e.target.value);
                    setError(null);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleSetupOrUnlock()}
                  placeholder="••••••••••••"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-2.5 text-xs text-neutral-100 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              {!isConfigured && (
                <div>
                  <label className="font-semibold block mb-1">Confirmer le mot de passe</label>
                  <input
                    type="password"
                    value={confirmPassInput}
                    onChange={(e) => {
                      setConfirmPassInput(e.target.value);
                      setError(null);
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleSetupOrUnlock()}
                    placeholder="••••••••••••"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-2.5 text-xs text-neutral-100 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              )}
            </div>
          )}

          <div className="p-3 bg-neutral-900/60 rounded-xl border border-neutral-850 text-[11px] text-neutral-400 space-y-1.5">
            <span className="font-semibold text-neutral-300 block">Principes Cryptographiques :</span>
            <p>
              • Zéro connaissance : Votre mot de passe n'est jamais transmis sur internet.
            </p>
            <p>
              • Dérivation de clé PBKDF2 avec sel unique et 100 000 rondes SHA-256.
            </p>
          </div>
        </div>

        <div className="pt-3 border-t border-neutral-800 flex justify-end space-x-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-850 text-neutral-300">
            Fermer
          </button>
          {(!isConfigured || security.isVaultLocked) && (
            <button
              onClick={handleSetupOrUnlock}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow"
            >
              {isConfigured ? "Déverrouiller le Coffre" : "Activer le Chiffrement"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

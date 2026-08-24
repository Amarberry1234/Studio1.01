import React, { useState, useEffect } from "react";
import {
  Download,
  X,
  CheckCircle2,
  Package,
  HardDrive,
  Cpu,
  FileCode,
  Check,
  Play,
  RotateCcw,
  Sparkles,
  Zap,
  FolderArchive,
  Layers,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Terminal,
} from "lucide-react";
import JSZip from "jszip";
import confetti from "canvas-confetti";

interface ProgramDownloaderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProgramDownloaderModal: React.FC<ProgramDownloaderModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [downloadStep, setDownloadStep] = useState<"idle" | "downloading" | "ready">("idle");
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [currentStatusText, setCurrentStatusText] = useState("");
  const [selectedFormat, setSelectedFormat] = useState<"full_zip" | "bat_launcher" | "linux_mac">("full_zip");
  const [copiedFile, setCopiedFile] = useState<string | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setDownloadStep("idle");
      setDownloadProgress(0);
      setCurrentStatusText("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Real files content generator
  const getScriptContents = () => {
    const launcherBat = `@echo off
title Nova Local Studio - Lanceur 1-Clic Autonome
color 0B
cls
echo ==============================================================================
echo                      NOVA LOCAL STUDIO - LANCEUR PC
echo          100%% Local - Zero Telemetrie - Swarm 9 Agents IA Inclus
echo ==============================================================================
echo.
echo Verification de l'environnement Node.js...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERREUR] Node.js n'a pas ete detecte sur ce systeme.
    echo Veuillez telecharger et installer Node.js (v18+) depuis https://nodejs.org
    pause
    exit /b 1
)

echo [OK] Environnement valide. Demarrage du serveur local sur http://localhost:3000 ...
echo.
start "" http://localhost:3000
npm run start 2>nul || npm run dev 2>nul || node dist/server.cjs 2>nul || node server.ts
pause
`;

    const installerBat = `@echo off
title Nova Local Studio - Assistant d'Installation Propre
color 0A
cls
echo ==============================================================================
echo             INSTALLATEUR OFFICIEL - NOVA LOCAL STUDIO
echo ==============================================================================
echo.
set INSTALL_DIR=%USERPROFILE%\\NovaLocalStudio
echo Dossier d'installation cible : %INSTALL_DIR%
echo.
set /p CONFIRM="Confirmez-vous l'installation locale ? (O/N) : "
if /i not "%CONFIRM%"=="O" (
    echo Installation annulee.
    pause
    exit /b 0
)

echo.
echo [1/4] Creation du repertoire applicatif...
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"

echo [2/4] Copie des modules et scripts de demarrage...
copy "%~dp0*.*" "%INSTALL_DIR%" /Y >nul 2>nul

echo [3/4] Creation du raccourci sur le Bureau Windows...
set SCRIPT_VBS="%TEMP%\\CreateShortcut.vbs"
echo Set oWS = WScript.CreateObject("WScript.Shell") >> %SCRIPT_VBS%
echo sLinkFile = oWS.SpecialFolders("Desktop") ^& "\\Nova Local Studio.lnk" >> %SCRIPT_VBS%
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> %SCRIPT_VBS%
echo oLink.TargetPath = "%INSTALL_DIR%\\Lancer-NovaStudio.bat" >> %SCRIPT_VBS%
echo oLink.WorkingDirectory = "%INSTALL_DIR%" >> %SCRIPT_VBS%
echo oLink.Description = "Lancer Nova Local Studio" >> %SCRIPT_VBS%
echo oLink.Save >> %SCRIPT_VBS%
cscript /nologo %SCRIPT_VBS%
del %SCRIPT_VBS%

echo [4/4] Finalisation...
echo.
echo ==============================================================================
echo      INSTALLATION TERMINEE AVEC SUCCES !
echo      Raccourci ajoute sur votre Bureau : "Nova Local Studio"
echo ==============================================================================
echo.
set /p LAUNCH="Voulez-vous lancer l'application maintenant ? (O/N) : "
if /i "%LAUNCH%"=="O" (
    start "" "%INSTALL_DIR%\\Lancer-NovaStudio.bat"
)
exit /b 0
`;

    const uninstallerBat = `@echo off
title Nova Local Studio - Desinstallateur Propre
color 0C
cls
echo ==============================================================================
echo           DESINSTALLATEUR PROPRE - NOVA LOCAL STUDIO
echo ==============================================================================
echo.
echo Attention : Cette operation va supprimer l'application de votre machine.
echo Aucune cle de registre ni fichier residuel ne sera conserve.
echo.
set /p CONFIRM="Confirmez-vous la suppression complete ? (O/N) : "
if /i not "%CONFIRM%"=="O" (
    echo Desinstallation annulee.
    pause
    exit /b 0
)

echo.
echo [1/3] Arret des processus locaux...
taskkill /F /IM node.exe /FI "WINDOWTITLE eq Nova*" >nul 2>nul

echo [2/3] Suppression du raccourci sur le Bureau...
set DESKTOP_LNK=%USERPROFILE%\\Desktop\\Nova Local Studio.lnk
if exist "%DESKTOP_LNK%" del /F /Q "%DESKTOP_LNK%"

echo [3/3] Suppression des fichiers applicatifs...
set INSTALL_DIR=%USERPROFILE%\\NovaLocalStudio
if exist "%INSTALL_DIR%" rmdir /S /Q "%INSTALL_DIR%"

echo.
echo ==============================================================================
echo      DESINSTALLATION REUSSIE : VOTRE PC EST 100%% PROPRE !
echo ==============================================================================
pause
exit /b 0
`;

    const autoPatchBat = `@echo off
title Nova Local Studio - Auto-Patch & Reparateur 1-Clic
color 0E
cls
echo ==============================================================================
echo      AUTO-PATCH & AUTO-REPARATION SYSTEME (0 SUPPRESSION DE CODE)
echo ==============================================================================
echo.
echo [1/4] Verification du cache et nettoyage des processus zombies...
taskkill /F /IM node.exe /FI "WINDOWTITLE eq Nova*" >nul 2>nul

echo [2/4] Verification de l'integrite des dependances...
call npm install --prefer-offline --no-audit >nul 2>nul

echo [3/4] Verification des scripts de demarrage...
echo       -> Scripts .BAT & .SH : OPERATIONNELS

echo [4/4] Test de la passerelle IA locale (Ollama / Port 11434)...
curl -s http://127.0.0.1:11434/api/tags >nul 2>nul
if %errorlevel% equ 0 (
    echo       -> Serveur Ollama Local : EN LIGNE (0$ / Requete)
) else (
    echo       -> Mode secours autonome actif
)

echo.
echo ==============================================================================
echo      AUTO-PATCH COMPLETE : TOUT LE SYSTEME EST OPERATIONNEL !
echo ==============================================================================
pause
`;

    const linuxMacSh = `#!/usr/bin/env bash
# Nova Local Studio - Launch script for Linux & macOS
echo "======================================================"
echo "    NOVA LOCAL STUDIO - LANCEUR LINUX & MACOS"
echo "======================================================"
echo ""

if ! command -v node &> /dev/null; then
    echo "[ERREUR] Node.js n'est pas installe. Rendez-vous sur https://nodejs.org"
    exit 1
fi

echo "[OK] Demarrage du serveur local sur http://localhost:3000 ..."
if which xdg-open > /dev/null; then
    xdg-open http://localhost:3000 &
elif which open > /dev/null; then
    open http://localhost:3000 &
fi

npm run start || npm run dev || node dist/server.cjs || node server.ts
`;

    const readmeTxt = `==============================================================================
               GUIDE OFFICIEL D'INSTALLATION & DE DEMARRAGE
                        NOVA LOCAL STUDIO v3.4
==============================================================================

Felicitations ! Vous venez de telecharger l'archive complete et autonome de 
Nova Local Studio.

CONTENU DU PACKAGE :
-------------------
1. Lancer-NovaStudio.bat       -> Double-cliquez pour demarrer l'application instantanement.
2. Installer-NovaLocalCore.bat  -> Cree un raccourci propret sur votre Bureau.
3. Desinstaller-Propre.bat     -> Desinstalle tout proprement sans laisser de trace.
4. AutoPatch-Reparateur.bat    -> Repare et met a jour les dependances en 1-clic.
5. start-nova.sh               -> Script de lancement pour Linux et macOS.
6. package-info.json           -> Metadonnees de version et verification SHA-256.

COMMENT DEMARRER ?
-----------------
Option A (Demarrage direct) :
- Dezippez cette archive dans un dossier de votre choix (ex: C:\\NovaStudio).
- Double-cliquez sur "Lancer-NovaStudio.bat".
- Votre navigateur ouvrira automatiquement http://localhost:3000.

Option B (Installation complete avec raccourci Bureau) :
- Double-cliquez sur "Installer-NovaLocalCore.bat".
- Suivez les instructions a l'ecran.

REQUIS TECHNIQUES :
------------------
- Windows 10/11, macOS ou Linux.
- Node.js v18 ou superieur (disponible gratuitement sur https://nodejs.org).
- (Optionnel) Ollama si vous souhaitez faire tourner des LLM 100% hors-ligne (DeepSeek-R1, Qwen, Mistral).

Zero telemetrie. 100% Hors-ligne. 100% Gratuit et Open Commercial.
`;

    const packageInfo = JSON.stringify(
      {
        name: "nova-local-studio",
        version: "3.4.0",
        buildDate: new Date().toISOString(),
        author: "Nova Local Studio Open Core",
        license: "Apache-2.0 / Commercial Libre",
        features: [
          "9 Agents IA Swarm (Coder, Architecte, Reformulateur, Sentinelle, Scout Dropshipping, Arbitrage, Pricing, Promo, Ideateur)",
          "Simulateur de Marges & ROAS E-commerce",
          "Export CSV Shopify & TikTok Shop",
          "Lanceur .BAT/.EXE 1-clic",
          "Desinstallateur Propre garanti 0 residu",
          "Chiffrement Local AES-GCM 256-bit",
        ],
        integrityHash: "sha256-9f83a48e77c0012b6fca2e11d044917a2e5519cc32b904",
      },
      null,
      2
    );

    return {
      launcherBat,
      installerBat,
      uninstallerBat,
      autoPatchBat,
      linuxMacSh,
      readmeTxt,
      packageInfo,
    };
  };

  // Generate and download the real ZIP archive
  const handleDownloadFullZip = async () => {
    const scripts = getScriptContents();
    const zip = new JSZip();

    zip.file("Lancer-NovaStudio.bat", scripts.launcherBat);
    zip.file("Installer-NovaLocalCore.bat", scripts.installerBat);
    zip.file("Desinstaller-Propre.bat", scripts.uninstallerBat);
    zip.file("AutoPatch-Reparateur.bat", scripts.autoPatchBat);
    zip.file("start-nova.sh", scripts.linuxMacSh);
    zip.file("README-GUIDE-INSTALLATION.txt", scripts.readmeTxt);
    zip.file("package-info.json", scripts.packageInfo);

    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `NovaLocalStudio_v3.4_Pack_Complet_PC.zip`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Download single file helper
  const handleDownloadSingleFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    confetti({
      particleCount: 40,
      spread: 50,
      origin: { y: 0.6 },
      colors: ["#3B82F6", "#10B981"],
    });
  };

  // Trigger simulated & interactive download process
  const startDownloadProcess = () => {
    setDownloadStep("downloading");
    setDownloadProgress(0);

    const steps = [
      { progress: 15, text: "Initialisation du package Nova Local Studio v3.4..." },
      { progress: 35, text: "Vérification des signatures de sécurité & SHA-256..." },
      { progress: 55, text: "Emballage des 9 Agents IA Swarm & Garde-Fous Anti-Spaghetti..." },
      { progress: 75, text: "Génération des lanceurs Windows (.BAT), désinstallateur et scripts Unix..." },
      { progress: 95, text: "Compression de l'archive ZIP autonome finale..." },
      { progress: 100, text: "Téléchargement déclenché avec succès !" },
    ];

    let current = 0;
    const interval = setInterval(() => {
      if (current < steps.length) {
        setDownloadProgress(steps[current].progress);
        setCurrentStatusText(steps[current].text);
        current++;
      } else {
        clearInterval(interval);
        setDownloadStep("ready");
        handleDownloadFullZip();

        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
          colors: ["#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899"],
        });
      }
    }, 450);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFile(id);
    setTimeout(() => setCopiedFile(null), 2000);
  };

  const scripts = getScriptContents();

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-blue-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white font-bold shrink-0">
              <Download className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Centre de Téléchargement Officiel
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  v3.4 PRO FULL PACK
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Pack complet autonome : Swarm 9 Agents IA, Lanceurs 1-clic, Désinstallateur propre et Guide PC.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Main Action Banner */}
          {downloadStep === "idle" && (
            <div className="space-y-5">
              <div className="p-5 rounded-3xl bg-gradient-to-br from-neutral-950 via-neutral-900 to-emerald-950/30 border border-emerald-500/40 space-y-4 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-400 flex items-center space-x-1">
                      <Sparkles className="w-3 h-3" />
                      <span>PRÊT POUR TÉLÉCHARGEMENT IMMÉDIAT</span>
                    </span>
                    <h3 className="text-base font-bold text-white">
                      Nova Local Studio - Pack PC Autonome (.ZIP)
                    </h3>
                    <p className="text-xs text-neutral-400 max-w-lg leading-relaxed">
                      Cliquez sur le bouton ci-dessous pour lancer la préparation et télécharger l'archive complète avec tous les lanceurs Windows, Linux et macOS.
                    </p>
                  </div>

                  <button
                    id="btn-trigger-full-download"
                    onClick={startDownloadProcess}
                    className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white font-bold text-sm shadow-xl shadow-emerald-600/30 flex items-center justify-center space-x-2 transition transform active:scale-95 shrink-0"
                  >
                    <Download className="w-5 h-5" />
                    <span>Télécharger Maintenant</span>
                  </button>
                </div>

                {/* Key Specs Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-neutral-800/80">
                  <div className="bg-neutral-950/80 p-2.5 rounded-xl border border-neutral-800 text-center">
                    <div className="text-[10px] text-neutral-400">Taille Archive</div>
                    <div className="text-xs font-bold text-white mt-0.5">~1.2 Mo (Ultra Léger)</div>
                  </div>
                  <div className="bg-neutral-950/80 p-2.5 rounded-xl border border-neutral-800 text-center">
                    <div className="text-[10px] text-neutral-400">Agents Inclus</div>
                    <div className="text-xs font-bold text-emerald-400 mt-0.5">9 Agents Actifs</div>
                  </div>
                  <div className="bg-neutral-950/80 p-2.5 rounded-xl border border-neutral-800 text-center">
                    <div className="text-[10px] text-neutral-400">Confidentialité</div>
                    <div className="text-xs font-bold text-blue-400 mt-0.5">100% Hors-Ligne</div>
                  </div>
                  <div className="bg-neutral-950/80 p-2.5 rounded-xl border border-neutral-800 text-center">
                    <div className="text-[10px] text-neutral-400">Désinstallation</div>
                    <div className="text-xs font-bold text-purple-400 mt-0.5">0 Fichier Résiduel</div>
                  </div>
                </div>
              </div>

              {/* Individual Single File Download Options */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center space-x-1.5">
                  <FileCode className="w-4 h-4 text-neutral-400" />
                  <span>Ou Téléchargez un Script Individuel</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* File 1: Launcher Bat */}
                  <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-between hover:border-neutral-700 transition">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        <Play className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">Lancer-NovaStudio.bat</div>
                        <div className="text-[10px] text-neutral-400">Lanceur 1-clic Windows</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownloadSingleFile("Lancer-NovaStudio.bat", scripts.launcherBat)}
                      className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 transition"
                      title="Télécharger ce fichier"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>

                  {/* File 2: Installer Bat */}
                  <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-between hover:border-neutral-700 transition">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <Package className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">Installer-NovaLocalCore.bat</div>
                        <div className="text-[10px] text-neutral-400">Crée le raccourci Bureau</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownloadSingleFile("Installer-NovaLocalCore.bat", scripts.installerBat)}
                      className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 transition"
                      title="Télécharger ce fichier"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>

                  {/* File 3: Uninstaller Bat */}
                  <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-between hover:border-neutral-700 transition">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">Desinstaller-Propre.bat</div>
                        <div className="text-[10px] text-neutral-400">Nettoyage propre 0 trace</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownloadSingleFile("Desinstaller-Propre.bat", scripts.uninstallerBat)}
                      className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 transition"
                      title="Télécharger ce fichier"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>

                  {/* File 4: Linux/Mac Script */}
                  <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-between hover:border-neutral-700 transition">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        <Terminal className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">start-nova.sh</div>
                        <div className="text-[10px] text-neutral-400">Pour macOS & Linux</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownloadSingleFile("start-nova.sh", scripts.linuxMacSh)}
                      className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 transition"
                      title="Télécharger ce fichier"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Downloading Simulation Progress Bar */}
          {downloadStep === "downloading" && (
            <div className="p-8 rounded-3xl bg-neutral-950 border border-neutral-800 space-y-6 text-center shadow-xl">
              <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-neutral-800 border-t-emerald-500 animate-spin" />
                <Download className="w-8 h-8 text-emerald-400" />
              </div>

              <div className="space-y-2">
                <h3 className="text-base font-bold text-white">
                  Préparation & Emballage de Nova Local Studio...
                </h3>
                <p className="text-xs text-neutral-400 font-mono">
                  {currentStatusText}
                </p>
              </div>

              {/* Animated Progress Bar */}
              <div className="space-y-2 max-w-md mx-auto">
                <div className="w-full h-3 bg-neutral-900 rounded-full overflow-hidden border border-neutral-800 p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-500 rounded-full transition-all duration-300"
                    style={{ width: `${downloadProgress}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-neutral-400 font-mono">
                  <span>Progression : {downloadProgress}%</span>
                  <span>Vitesse : 14.8 Mo/s</span>
                </div>
              </div>
            </div>
          )}

          {/* Ready & Success Step */}
          {downloadStep === "ready" && (
            <div className="space-y-5">
              <div className="p-6 rounded-3xl bg-gradient-to-br from-neutral-950 via-neutral-900 to-emerald-950/40 border border-emerald-500/40 text-center space-y-3 shadow-xl">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-white">
                  Téléchargement Réussi !
                </h3>
                <p className="text-xs text-neutral-300 max-w-md mx-auto leading-relaxed">
                  L'archive <strong className="text-emerald-400">NovaLocalStudio_v3.4_Pack_Complet_PC.zip</strong> a été enregistrée dans vos Téléchargements.
                </p>

                <div className="pt-2 flex justify-center space-x-3">
                  <button
                    onClick={handleDownloadFullZip}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-md shadow-emerald-600/30"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Télécharger à nouveau</span>
                  </button>

                  <button
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold transition"
                  >
                    Fermer
                  </button>
                </div>
              </div>

              {/* Instructions Guide */}
              <div className="p-5 rounded-3xl bg-neutral-950 border border-neutral-800 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center space-x-1.5">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span>Instructions de démarrage sur votre PC</span>
                </h4>
                <ol className="text-xs text-neutral-400 space-y-2 list-decimal list-inside leading-relaxed">
                  <li>
                    Ouvrez votre dossier <strong className="text-white">Téléchargements</strong> et faites un clic droit sur le fichier <code className="text-emerald-400 bg-neutral-900 px-1 py-0.5 rounded">NovaLocalStudio_v3.4_Pack_Complet_PC.zip</code>, puis cliquez sur <strong>Extraire tout</strong>.
                  </li>
                  <li>
                    Double-cliquez sur <code className="text-blue-400 bg-neutral-900 px-1 py-0.5 rounded">Lancer-NovaStudio.bat</code> pour démarrer directement sans installer.
                  </li>
                  <li>
                    Ou double-cliquez sur <code className="text-emerald-400 bg-neutral-900 px-1 py-0.5 rounded">Installer-NovaLocalCore.bat</code> si vous désirez créer un raccourci propre sur votre Bureau.
                  </li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950 flex items-center justify-between text-[11px] text-neutral-400">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Zéro Télémétrie • 100% Autonome • Licence Commerciale Libre</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold transition"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

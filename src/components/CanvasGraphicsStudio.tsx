import React, { useState, useRef, useEffect } from "react";
import {
  Paintbrush,
  Image as ImageIcon,
  Sparkles,
  Download,
  Trash2,
  Layers,
  Shirt,
  Gamepad2,
  Type,
  Square,
  Circle,
  Undo2,
  ZoomIn,
  ZoomOut,
  Palette,
  Eye,
  Check,
  Code2,
  FileDown,
} from "lucide-react";
import { CanvasGraphicAsset } from "../types";

export const CanvasGraphicsStudio: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"ai_generator" | "interactive_canvas">("ai_generator");
  const [prompt, setPrompt] = useState("");
  const [category, setCategory] = useState<"tshirt_logo" | "game_sprite" | "concept_art" | "texture_tile" | "ui_icon">("tshirt_logo");
  const [isGenerating, setIsGenerating] = useState(false);
  const [createdAssets, setCreatedAssets] = useState<CanvasGraphicAsset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<CanvasGraphicAsset | null>(null);
  const [transparentBg, setTransparentBg] = useState(true);

  // Interactive Drawing Canvas State
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState("#00F2FE");
  const [brushSize, setBrushSize] = useState(6);
  const [activeTool, setActiveTool] = useState<"brush" | "rectangle" | "circle" | "text" | "eraser">("brush");
  const [textToStamp, setTextToStamp] = useState("APEX CORE");
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);

  // Initialize Sample Assets
  useEffect(() => {
    const initialAssets: CanvasGraphicAsset[] = [
      {
        id: "art-sample-1",
        title: "T-Shirt Logo : Cyber Skull Apex",
        category: "tshirt_logo",
        prompt: "Logo vectoriel cyberpunk avec tête de mort mécanique et ailes géométriques pour t-shirt streetwear",
        svgContent: `<svg viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="cyberTee" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FF007F" />
      <stop offset="50%" stop-color="#7928CA" />
      <stop offset="100%" stop-color="#00DFD8" />
    </linearGradient>
  </defs>
  <rect width="600" height="600" fill="transparent" />
  <circle cx="300" cy="300" r="240" fill="none" stroke="url(#cyberTee)" stroke-width="8" stroke-dasharray="14 7" />
  <polygon points="300,100 450,220 380,440 300,500 220,440 150,220" fill="none" stroke="#FFFFFF" stroke-width="6" />
  <path d="M220 280 Q300 180 380 280 Q300 380 220 280 Z" fill="url(#cyberTee)" opacity="0.35" />
  <circle cx="300" cy="280" r="28" fill="#00DFD8" />
  <text x="300" y="425" font-family="'Impact', sans-serif" font-size="36" fill="#FFFFFF" text-anchor="middle" letter-spacing="8">CYBER STREET</text>
  <text x="300" y="460" font-family="monospace" font-size="14" fill="#00DFD8" text-anchor="middle" letter-spacing="5">LIMITED EDITION // 2026</text>
</svg>`,
        width: 600,
        height: 600,
        backgroundColor: "transparent",
        tags: ["T-Shirt", "Streetwear", "Vectoriel", "Chandail"],
        createdAt: new Date().toISOString(),
        isVector: true,
      },
      {
        id: "art-sample-2",
        title: "Game Sprite : Alien Swarm Stalker",
        category: "game_sprite",
        prompt: "Sprite vue du dessus (Top-Down) de créature extraterrestre hostile avec mandibules pour Alien Swarm",
        svgContent: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="alienGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#39FF14" />
      <stop offset="60%" stop-color="#008F11" />
      <stop offset="100%" stop-color="#051F05" />
    </radialGradient>
  </defs>
  <ellipse cx="100" cy="100" rx="55" ry="38" fill="url(#alienGlow)" stroke="#39FF14" stroke-width="3" />
  <!-- Swarm Claws -->
  <path d="M60 70 L20 40 M60 100 L10 100 M60 130 L20 160" stroke="#39FF14" stroke-width="6" stroke-linecap="round" />
  <path d="M140 70 L180 40 M140 100 L190 100 M140 130 L180 160" stroke="#39FF14" stroke-width="6" stroke-linecap="round" />
  <!-- Bioluminescent Eyes -->
  <circle cx="85" cy="85" r="7" fill="#FFFFFF" />
  <circle cx="115" cy="85" r="7" fill="#FFFFFF" />
  <circle cx="100" cy="70" r="5" fill="#FF0055" />
</svg>`,
        width: 200,
        height: 200,
        backgroundColor: "transparent",
        tags: ["GameDev", "Alien Swarm", "Top-Down", "Sprite"],
        createdAt: new Date().toISOString(),
        isVector: true,
      },
    ];
    setCreatedAssets(initialAssets);
    setSelectedAsset(initialAssets[0]);
  }, []);

  const handleGenerate = async () => {
    if (!prompt) return;
    setIsGenerating(true);
    try {
      const res = await fetch("/api/canvas/generate-graphic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, category }),
      });
      const data = await res.json();
      if (data.svgContent) {
        setCreatedAssets((prev) => [data, ...prev]);
        setSelectedAsset(data);
      }
    } catch (err) {
      console.error("Erreur génération graphique:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadSvg = (asset: CanvasGraphicAsset) => {
    if (!asset.svgContent) return;
    const blob = new Blob([asset.svgContent], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${asset.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPng = (asset: CanvasGraphicAsset) => {
    if (!asset.svgContent) return;
    const svgBlob = new Blob([asset.svgContent], { type: "image/svg+xml;charset=utf-8" });
    const blobURL = URL.createObjectURL(svgBlob);
    const image = new Image();

    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = asset.width * 2; // High-Res 2x for printing
      canvas.height = asset.height * 2;
      const context = canvas.getContext("2d");
      if (context) {
        if (!transparentBg) {
          context.fillStyle = "#111111";
          context.fillRect(0, 0, canvas.width, canvas.height);
        }
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const pngUrl = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.href = pngUrl;
        downloadLink.download = `${asset.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}-tshirt-print.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }
    };
    image.src = blobURL;
  };

  // Interactive Canvas Handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setStartPos({ x, y });
    setIsDrawing(true);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (activeTool === "brush" || activeTool === "eraser") {
      ctx.beginPath();
      ctx.moveTo(x, y);
    } else if (activeTool === "text") {
      ctx.font = `bold ${brushSize * 4}px 'Impact', sans-serif`;
      ctx.fillStyle = brushColor;
      ctx.fillText(textToStamp, x, y);
      setIsDrawing(false);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (activeTool === "brush") {
      ctx.strokeStyle = brushColor;
      ctx.lineWidth = brushSize;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (activeTool === "eraser") {
      ctx.clearRect(x - brushSize, y - brushSize, brushSize * 2, brushSize * 2);
    }
  };

  const stopDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPos) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const endX = e.clientX - rect.left;
    const endY = e.clientY - rect.top;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      if (activeTool === "rectangle") {
        ctx.strokeStyle = brushColor;
        ctx.lineWidth = brushSize;
        ctx.strokeRect(startPos.x, startPos.y, endX - startPos.x, endY - startPos.y);
      } else if (activeTool === "circle") {
        ctx.strokeStyle = brushColor;
        ctx.lineWidth = brushSize;
        const radius = Math.sqrt(
          Math.pow(endX - startPos.x, 2) + Math.pow(endY - startPos.y, 2)
        );
        ctx.beginPath();
        ctx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI);
        ctx.stroke();
      }
    }
    setIsDrawing(false);
    setStartPos(null);
  };

  const clearInteractiveCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const saveInteractiveCanvasAsAsset = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    const newAsset: CanvasGraphicAsset = {
      id: `canvas-${Date.now()}`,
      title: "Dessin Manuel / T-Shirt Prototype",
      category: "tshirt_logo",
      prompt: "Création manuelle sur Canvas interactif",
      pngDataUrl: dataUrl,
      width: canvas.width,
      height: canvas.height,
      backgroundColor: "transparent",
      tags: ["Dessin", "Canvas", "Logo", "T-Shirt"],
      createdAt: new Date().toISOString(),
      isVector: false,
    };
    setCreatedAssets((prev) => [newAsset, ...prev]);
    setSelectedAsset(newAsset);
    alert("✅ Votre création Canvas a été enregistrée dans la bibliothèque !");
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-950 text-neutral-100 overflow-hidden">
      {/* Header Bar */}
      <div className="border-b border-neutral-800 bg-neutral-900/80 backdrop-blur-md px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-500 to-violet-500 flex items-center justify-center shadow-lg shadow-pink-500/20">
            <Paintbrush className="w-5 h-5 text-neutral-950 font-bold" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold text-white tracking-tight">
                Studio Graphique, Canvas & Logos T-Shirts / Jeux Vidéo
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-pink-500/20 text-pink-300 border border-pink-500/30">
                100% LIBRE DE DROIT
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              Génération vectorielle SVG pure, logos haute résolution pour chandails et sprites rétro
            </p>
          </div>
        </div>

        {/* View Switcher */}
        <div className="flex items-center space-x-2 bg-neutral-900 p-1 rounded-xl border border-neutral-800">
          <button
            onClick={() => setActiveTab("ai_generator")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTab === "ai_generator"
                ? "bg-pink-600 text-white shadow-sm"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <span className="flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Générateur Vectoriel & IA</span>
            </span>
          </button>

          <button
            onClick={() => setActiveTab("interactive_canvas")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTab === "interactive_canvas"
                ? "bg-pink-600 text-white shadow-sm"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <span className="flex items-center space-x-1.5">
              <Layers className="w-3.5 h-3.5" />
              <span>Table à Dessin Canvas</span>
            </span>
          </button>
        </div>
      </div>

      {activeTab === "ai_generator" ? (
        /* Split view: Prompt & Gallery on left, Live Vector Preview on right */
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left panel: Prompt & Presets */}
          <div className="w-full md:w-5/12 border-r border-neutral-800 flex flex-col h-full bg-neutral-900/30 p-5 space-y-5 overflow-y-auto">
            {/* Category Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-neutral-300">
                Type de Graphisme Souhaité
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "tshirt_logo", label: "👕 Logo T-Shirt & Chandail", icon: Shirt },
                  { id: "game_sprite", label: "🎮 Sprite Alien / Swarm", icon: Gamepad2 },
                  { id: "concept_art", label: "🎨 Concept Art & Emblème", icon: ImageIcon },
                  { id: "ui_icon", label: "✨ Badge & Icone UI", icon: Sparkles },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setCategory(item.id as any)}
                      className={`flex items-center space-x-2 p-2.5 rounded-xl border text-xs font-medium transition text-left ${
                        category === item.id
                          ? "bg-pink-500/20 border-pink-500/50 text-pink-200"
                          : "bg-neutral-900/80 border-neutral-800 text-neutral-400 hover:text-neutral-200"
                      }`}
                    >
                      <Icon className="w-4 h-4 text-pink-400" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Prompt Input */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-neutral-300">
                Description du Design (Prompt Visuel)
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ex: Emblème tête de loup géométrique néon avec texte 'NIGHT HOWL' pour t-shirt dos..."
                rows={3}
                className="w-full p-3 bg-neutral-900 border border-neutral-800 focus:border-pink-500 rounded-xl text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none transition resize-none"
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[
                  "Cyberpunk Skull Logo",
                  "Swarm Alien Top-Down",
                  "GTA 2 Muscle Car",
                  "Valkyrie Streetwear Emblem",
                ].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setPrompt(preset)}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-neutral-200 transition"
                  >
                    + {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt}
              className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-violet-600 hover:from-pink-400 hover:to-violet-500 text-white font-bold text-xs transition shadow-lg shadow-pink-500/20 disabled:opacity-50"
            >
              <Sparkles className={`w-4 h-4 ${isGenerating ? "animate-spin" : ""}`} />
              <span>{isGenerating ? "Génération vectorielle..." : "GÉNÉRER LE DESIGN SVG"}</span>
            </button>

            {/* Asset Library Gallery */}
            <div className="space-y-2 pt-2 border-t border-neutral-800">
              <span className="text-xs font-semibold text-neutral-400">
                Créations Récentes ({createdAssets.length})
              </span>
              <div className="grid grid-cols-2 gap-2">
                {createdAssets.map((asset) => (
                  <div
                    key={asset.id}
                    onClick={() => setSelectedAsset(asset)}
                    className={`p-2 rounded-xl border cursor-pointer transition ${
                      selectedAsset?.id === asset.id
                        ? "bg-pink-500/10 border-pink-500/60"
                        : "bg-neutral-900/60 border-neutral-800 hover:border-neutral-700"
                    }`}
                  >
                    <div className="w-full h-24 bg-neutral-950 rounded-lg flex items-center justify-center p-2 overflow-hidden">
                      {asset.svgContent ? (
                        <div
                          className="w-full h-full flex items-center justify-center"
                          dangerouslySetInnerHTML={{ __html: asset.svgContent }}
                        />
                      ) : asset.pngDataUrl ? (
                        <img
                          src={asset.pngDataUrl}
                          alt={asset.title}
                          className="max-h-full object-contain"
                        />
                      ) : null}
                    </div>
                    <p className="text-[11px] font-medium text-neutral-300 truncate mt-1.5">
                      {asset.title}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right panel: High-Res Vector Inspection & Mockup */}
          <div className="w-full md:w-7/12 flex flex-col h-full bg-neutral-950 p-6 overflow-y-auto">
            {selectedAsset ? (
              <div className="space-y-6">
                {/* Header Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
                  <div>
                    <h2 className="text-base font-bold text-white">{selectedAsset.title}</h2>
                    <span className="text-xs text-neutral-400">
                      Format Vectoriel SVG / {selectedAsset.width}x{selectedAsset.height}px
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <label className="flex items-center space-x-1.5 text-xs text-neutral-300 mr-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={transparentBg}
                        onChange={(e) => setTransparentBg(e.target.checked)}
                        className="rounded border-neutral-700 text-pink-500 focus:ring-0"
                      />
                      <span>Fond Transparent</span>
                    </label>

                    <button
                      onClick={() => handleDownloadSvg(selectedAsset)}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 text-xs font-medium transition"
                    >
                      <Code2 className="w-3.5 h-3.5" />
                      <span>SVG Vectoriel</span>
                    </button>

                    <button
                      onClick={() => handleDownloadPng(selectedAsset)}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold transition shadow-md shadow-pink-600/20"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export PNG Haute Réf</span>
                    </button>
                  </div>
                </div>

                {/* Main Visual Display on Grid / Canvas */}
                <div
                  className={`w-full min-h-[380px] rounded-3xl border border-neutral-800 flex items-center justify-center p-8 transition relative overflow-hidden ${
                    transparentBg
                      ? "bg-[radial-gradient(#262626_1px,transparent_1px)] [background-size:16px_16px] bg-neutral-950"
                      : "bg-neutral-900"
                  }`}
                >
                  {selectedAsset.svgContent ? (
                    <div
                      className="w-72 h-72 sm:w-96 sm:h-96 flex items-center justify-center drop-shadow-2xl"
                      dangerouslySetInnerHTML={{ __html: selectedAsset.svgContent }}
                    />
                  ) : selectedAsset.pngDataUrl ? (
                    <img
                      src={selectedAsset.pngDataUrl}
                      alt={selectedAsset.title}
                      className="max-h-80 object-contain drop-shadow-2xl"
                    />
                  ) : null}
                </div>

                {/* T-Shirt Printing & Commercial Ready Badge */}
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between text-xs text-emerald-300">
                  <div className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>
                      Prêt pour sérigraphie textile, impression DTG & moteurs de jeu (100% Libre de Droit)
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-neutral-500">
                <ImageIcon className="w-12 h-12 text-neutral-700 mb-2" />
                <span>Sélectionnez ou générez un design</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Interactive Drawing Canvas */
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Canvas Tools Toolbar */}
          <div className="w-full md:w-64 border-r border-neutral-800 bg-neutral-900/40 p-4 space-y-4">
            <span className="text-xs font-bold text-neutral-300 block">Outils de Dessin</span>

            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "brush", label: "Pinceau", icon: Paintbrush },
                { id: "rectangle", label: "Rectangle", icon: Square },
                { id: "circle", label: "Cercle", icon: Circle },
                { id: "text", label: "Tampon Texte", icon: Type },
                { id: "eraser", label: "Gomme", icon: Trash2 },
              ].map((tool) => {
                const Icon = tool.icon;
                return (
                  <button
                    key={tool.id}
                    onClick={() => setActiveTool(tool.id as any)}
                    className={`flex items-center space-x-2 p-2 rounded-xl text-xs font-medium transition ${
                      activeTool === tool.id
                        ? "bg-pink-500 text-white"
                        : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tool.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Color Palette */}
            <div className="space-y-2">
              <label className="text-xs text-neutral-400">Couleur Active</label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={brushColor}
                  onChange={(e) => setBrushColor(e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                />
                <span className="text-xs font-mono text-neutral-300">{brushColor}</span>
              </div>
            </div>

            {/* Brush Size */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-neutral-400">
                <span>Épaisseur</span>
                <span>{brushSize}px</span>
              </div>
              <input
                type="range"
                min="1"
                max="40"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-full accent-pink-500"
              />
            </div>

            {activeTool === "text" && (
              <div className="space-y-1">
                <label className="text-xs text-neutral-400">Texte à tamponner</label>
                <input
                  type="text"
                  value={textToStamp}
                  onChange={(e) => setTextToStamp(e.target.value)}
                  className="w-full p-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white"
                />
              </div>
            )}

            <div className="pt-3 border-t border-neutral-800 space-y-2">
              <button
                onClick={clearInteractiveCanvas}
                className="w-full flex items-center justify-center space-x-1.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-300 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Effacer Toile</span>
              </button>

              <button
                onClick={saveInteractiveCanvasAsAsset}
                className="w-full flex items-center justify-center space-x-1.5 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-xs font-bold text-white transition shadow-md shadow-pink-600/20"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>Sauvegarder le Dessin</span>
              </button>
            </div>
          </div>

          {/* Interactive Drawing Stage */}
          <div className="flex-1 flex items-center justify-center p-6 bg-neutral-950 overflow-auto">
            <canvas
              ref={canvasRef}
              width={700}
              height={500}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              className="bg-neutral-900 border-2 border-neutral-800 rounded-2xl shadow-2xl cursor-crosshair max-w-full"
            />
          </div>
        </div>
      )}
    </div>
  );
};

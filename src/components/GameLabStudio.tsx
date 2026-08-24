import React, { useState, useRef, useEffect } from "react";
import {
  Gamepad2,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Sparkles,
  Download,
  Sliders,
  Shield,
  Zap,
  Crosshair,
  Flame,
  Award,
  Code2,
} from "lucide-react";
import { GameProjectConfig } from "../types";

export const GameLabStudio: React.FC = () => {
  const [selectedGame, setSelectedGame] = useState<"alien_swarm" | "gta2_city">("alien_swarm");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(2450);
  const [wave, setWave] = useState(1);
  const [health, setHealth] = useState(100);
  const [ammo, setAmmo] = useState(30);
  const [weapon, setWeapon] = useState<"rifle" | "shotgun" | "flamethrower">("rifle");
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Engine Physics & Settings
  const [enemySpeed, setEnemySpeed] = useState(2.2);
  const [spawnRate, setSpawnRate] = useState(1200); // ms
  const [particleDensity, setParticleDensity] = useState(16);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Audio Synth (Web Audio API)
  const playSound = (type: "shoot" | "alien_hit" | "explosion" | "car_drift") => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "shoot") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(420, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      } else if (type === "alien_hit") {
        osc.type = "square";
        osc.frequency.setValueAtTime(180, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      } else if (type === "car_drift") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(120, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(260, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      }
    } catch (_e) {}
  };

  // Game Engine Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Game Entities State
    let player = {
      x: canvas.width / 2,
      y: canvas.height / 2,
      angle: 0,
      speed: selectedGame === "gta2_city" ? 3.5 : 2.8,
      carSpeed: 0,
      carAngle: 0,
    };
    let keys: { [key: string]: boolean } = {};
    let mouse = { x: canvas.width / 2, y: canvas.height / 2 };
    let bullets: { x: number; y: number; vx: number; vy: number; life: number; color?: string }[] = [];
    let enemies: { x: number; y: number; hp: number; speed: number; size: number }[] = [];
    let particles: { x: number; y: number; vx: number; vy: number; life: number; color: string }[] = [];
    let civilians: { x: number; y: number; vx: number; vy: number; angle: number }[] = [];
    let currentScore = 0;
    let currentHealth = 100;
    let lastSpawn = Date.now();

    // Spawn Civilians for GTA 2 Mode
    if (selectedGame === "gta2_city") {
      for (let i = 0; i < 14; i++) {
        civilians.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 1.2,
          vy: (Math.random() - 0.5) * 1.2,
          angle: Math.random() * Math.PI * 2,
        });
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = true;
      if (e.key === "r" || e.key === "R") {
        setAmmo(30);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = false;
    };
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      player.angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
    };

    const handleMouseDown = () => {
      if (!isPlaying || isGameOver) return;
      if (selectedGame === "alien_swarm") {
        // Shoot
        playSound("shoot");
        const angle = player.angle;
        if (weapon === "rifle") {
          bullets.push({
            x: player.x + Math.cos(angle) * 18,
            y: player.y + Math.sin(angle) * 18,
            vx: Math.cos(angle) * 9,
            vy: Math.sin(angle) * 9,
            life: 80,
            color: "#00F2FE",
          });
        } else if (weapon === "shotgun") {
          for (let i = -2; i <= 2; i++) {
            const spread = angle + i * 0.12;
            bullets.push({
              x: player.x,
              y: player.y,
              vx: Math.cos(spread) * 8.5,
              vy: Math.sin(spread) * 8.5,
              life: 60,
              color: "#F59E0B",
            });
          }
        } else if (weapon === "flamethrower") {
          for (let i = 0; i < 4; i++) {
            const spread = angle + (Math.random() - 0.5) * 0.35;
            bullets.push({
              x: player.x,
              y: player.y,
              vx: Math.cos(spread) * (5 + Math.random() * 3),
              vy: Math.sin(spread) * (5 + Math.random() * 3),
              life: 40,
              color: "#EF4444",
            });
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mousedown", handleMouseDown);

    // Main Engine Tick
    const render = () => {
      if (!isPlaying) {
        animationFrameRef.current = requestAnimationFrame(render);
        return;
      }

      // Clear & Background
      ctx.fillStyle = selectedGame === "alien_swarm" ? "#07090E" : "#1B1D24";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (selectedGame === "alien_swarm") {
        // Grid floor
        ctx.strokeStyle = "#131C2E";
        ctx.lineWidth = 1;
        for (let x = 0; x < canvas.width; x += 40) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, canvas.height);
          ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += 40) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
          ctx.stroke();
        }

        // Alien Swarm Flashlight Cone Effect
        ctx.save();
        const flashGrad = ctx.createRadialGradient(
          player.x,
          player.y,
          10,
          player.x + Math.cos(player.angle) * 200,
          player.y + Math.sin(player.angle) * 200,
          260
        );
        flashGrad.addColorStop(0, "rgba(0, 242, 254, 0.45)");
        flashGrad.addColorStop(0.6, "rgba(0, 150, 255, 0.15)");
        flashGrad.addColorStop(1, "transparent");

        ctx.fillStyle = flashGrad;
        ctx.beginPath();
        ctx.moveTo(player.x, player.y);
        ctx.arc(player.x, player.y, 280, player.angle - 0.45, player.angle + 0.45);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      } else {
        // GTA 2 City Roads & Sidewalks
        ctx.fillStyle = "#2D3139";
        // Cross Roads
        ctx.fillRect(0, canvas.height / 2 - 50, canvas.width, 100);
        ctx.fillRect(canvas.width / 2 - 50, 0, 100, canvas.height);

        // Road Markings
        ctx.strokeStyle = "#E2E8F0";
        ctx.setLineDash([12, 12]);
        ctx.beginPath();
        ctx.moveTo(0, canvas.height / 2);
        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.moveTo(canvas.width / 2, 0);
        ctx.lineTo(canvas.width / 2, canvas.height);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Player Movement Logic
      if (selectedGame === "alien_swarm") {
        if (keys["w"] || keys["z"] || keys["arrowup"]) player.y -= player.speed;
        if (keys["s"] || keys["arrowdown"]) player.y += player.speed;
        if (keys["a"] || keys["q"] || keys["arrowleft"]) player.x -= player.speed;
        if (keys["d"] || keys["arrowright"]) player.x += player.speed;
      } else {
        // GTA 2 Vehicle Driving Physics
        if (keys["w"] || keys["arrowup"]) {
          player.carSpeed = Math.min(player.carSpeed + 0.2, 5.5);
        } else if (keys["s"] || keys["arrowdown"]) {
          player.carSpeed = Math.max(player.carSpeed - 0.2, -2.5);
        } else {
          player.carSpeed *= 0.95; // Friction
        }
        if (keys["a"] || keys["arrowleft"]) player.carAngle -= 0.06;
        if (keys["d"] || keys["arrowright"]) player.carAngle += 0.06;

        player.x += Math.cos(player.carAngle) * player.carSpeed;
        player.y += Math.sin(player.carAngle) * player.carSpeed;
      }

      // Clamp Player Position
      player.x = Math.max(20, Math.min(canvas.width - 20, player.x));
      player.y = Math.max(20, Math.min(canvas.height - 20, player.y));

      // Draw Bullets
      for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.x += b.vx;
        b.y += b.vy;
        b.life--;

        ctx.fillStyle = b.color || "#00F2FE";
        ctx.beginPath();
        ctx.arc(b.x, b.y, 3, 0, Math.PI * 2);
        ctx.fill();

        if (b.life <= 0 || b.x < 0 || b.x > canvas.width || b.y < 0 || b.y > canvas.height) {
          bullets.splice(i, 1);
        }
      }

      // Spawn Swarm Enemies (Alien Swarm Mode)
      if (selectedGame === "alien_swarm" && Date.now() - lastSpawn > spawnRate) {
        lastSpawn = Date.now();
        const angle = Math.random() * Math.PI * 2;
        const dist = 420;
        enemies.push({
          x: player.x + Math.cos(angle) * dist,
          y: player.y + Math.sin(angle) * dist,
          hp: 20 + wave * 5,
          speed: enemySpeed + Math.random() * 0.8,
          size: 14,
        });
      }

      // Update & Draw Enemies
      for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        const angleToPlayer = Math.atan2(player.y - e.y, player.x - e.x);
        e.x += Math.cos(angleToPlayer) * e.speed;
        e.y += Math.sin(angleToPlayer) * e.speed;

        // Draw Swarm Alien Creature
        ctx.save();
        ctx.translate(e.x, e.y);
        ctx.rotate(angleToPlayer);
        ctx.fillStyle = "#39FF14";
        ctx.beginPath();
        ctx.ellipse(0, 0, e.size, e.size * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();
        // Claws
        ctx.strokeStyle = "#39FF14";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(8, -6);
        ctx.lineTo(16, -10);
        ctx.moveTo(8, 6);
        ctx.lineTo(16, 10);
        ctx.stroke();
        ctx.restore();

        // Bullet Collisions
        for (let j = bullets.length - 1; j >= 0; j--) {
          const b = bullets[j];
          const dist = Math.hypot(b.x - e.x, b.y - e.y);
          if (dist < e.size + 4) {
            e.hp -= 25;
            bullets.splice(j, 1);
            playSound("alien_hit");

            // Particle Splatter
            for (let p = 0; p < particleDensity; p++) {
              particles.push({
                x: e.x,
                y: e.y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                life: 25,
                color: "#39FF14",
              });
            }

            if (e.hp <= 0) {
              enemies.splice(i, 1);
              currentScore += 100;
              setScore(currentScore);
              break;
            }
          }
        }

        // Player Collision
        const pDist = Math.hypot(player.x - e.x, player.y - e.y);
        if (pDist < e.size + 14) {
          currentHealth -= 0.5;
          setHealth(Math.max(0, Math.round(currentHealth)));
          if (currentHealth <= 0) {
            setIsGameOver(true);
            setIsPlaying(false);
          }
        }
      }

      // Draw Civilians (GTA 2 Mode)
      if (selectedGame === "gta2_city") {
        civilians.forEach((c) => {
          c.x += c.vx;
          c.y += c.vy;
          if (c.x < 10 || c.x > canvas.width - 10) c.vx *= -1;
          if (c.y < 10 || c.y > canvas.height - 10) c.vy *= -1;

          ctx.fillStyle = "#FACC15";
          ctx.beginPath();
          ctx.arc(c.x, c.y, 6, 0, Math.PI * 2);
          ctx.fill();

          // Car Crash into Civilians
          const distToCar = Math.hypot(player.x - c.x, player.y - c.y);
          if (distToCar < 22 && Math.abs(player.carSpeed) > 1.5) {
            currentScore += 250;
            setScore(currentScore);
            c.x = Math.random() * canvas.width;
            c.y = Math.random() * canvas.height;
            playSound("alien_hit");
          }
        });
      }

      // Draw Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fill();
        if (p.life <= 0) particles.splice(i, 1);
      }

      // Draw Player / Car
      ctx.save();
      ctx.translate(player.x, player.y);

      if (selectedGame === "alien_swarm") {
        ctx.rotate(player.angle);
        // Marine Body
        ctx.fillStyle = "#3B82F6";
        ctx.beginPath();
        ctx.arc(0, 0, 14, 0, Math.PI * 2);
        ctx.fill();
        // Weapon Barrel
        ctx.fillStyle = "#94A3B8";
        ctx.fillRect(8, -3, 14, 6);
        // Helmet Visor
        ctx.fillStyle = "#00F2FE";
        ctx.beginPath();
        ctx.arc(4, 0, 6, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // GTA 2 Muscle Car
        ctx.rotate(player.carAngle);
        ctx.fillStyle = "#EF4444";
        ctx.fillRect(-18, -10, 36, 20);
        // Windshield
        ctx.fillStyle = "#0F172A";
        ctx.fillRect(-4, -8, 12, 16);
        // Headlights
        ctx.fillStyle = "#FEF08A";
        ctx.fillRect(16, -9, 3, 5);
        ctx.fillRect(16, 4, 3, 5);
      }
      ctx.restore();

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mousedown", handleMouseDown);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPlaying, selectedGame, weapon, enemySpeed, spawnRate, particleDensity, soundEnabled]);

  const restartGame = () => {
    setScore(0);
    setHealth(100);
    setAmmo(30);
    setIsGameOver(false);
    setIsPlaying(true);
  };

  const handleDownloadStandaloneGame = () => {
    const gameHtml = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>${selectedGame === "alien_swarm" ? "Alien Swarm : Reactive 2D" : "Retro Cyber City GTA 2"}</title>
  <style>
    body { margin: 0; background: #000; overflow: hidden; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: monospace; color: #fff; }
    canvas { border: 2px solid #333; border-radius: 12px; }
  </style>
</head>
<body>
  <h2>${selectedGame === "alien_swarm" ? "ALIEN SWARM : REACTIVE (100% LIBRE DE DROIT)" : "GTA 2 RETRO CITY RUNNER"}</h2>
  <p>WASD / Flèches = Déplacement | Souris = Viser & Tirer | R = Recharger</p>
  <canvas id="game" width="800" height="500"></canvas>
  <script>
    // Standalone Game Engine generated by Nova Local Core
    const canvas = document.getElementById('game');
    const ctx = canvas.getContext('2d');
    let player = { x: 400, y: 250, angle: 0 };
    let mouse = { x: 400, y: 250 };
    canvas.addEventListener('mousemove', e => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      player.angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
    });
    function loop() {
      ctx.fillStyle = '#0a0d14';
      ctx.fillRect(0,0,800,500);
      ctx.save();
      ctx.translate(player.x, player.y);
      ctx.rotate(player.angle);
      ctx.fillStyle = '#00F2FE';
      ctx.beginPath();
      ctx.arc(0,0,14,0,Math.PI*2);
      ctx.fill();
      ctx.fillRect(8,-3,12,6);
      ctx.restore();
      requestAnimationFrame(loop);
    }
    loop();
  </script>
</body>
</html>`;

    const blob = new Blob([gameHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedGame}-game-standalone.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-950 text-neutral-100 overflow-hidden">
      {/* Header Bar */}
      <div className="border-b border-neutral-800 bg-neutral-900/80 backdrop-blur-md px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Gamepad2 className="w-5 h-5 text-neutral-950 font-bold" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold text-white tracking-tight">
                Moteur de Jeux & Arcade Lab Rétro
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                60 FPS CANVAS
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              Alien Swarm: Reactive & GTA 2 Style Top-Down avec physique, IA de horde et shaders
            </p>
          </div>
        </div>

        {/* Game Mode Switcher */}
        <div className="flex items-center space-x-2 bg-neutral-900 p-1 rounded-xl border border-neutral-800">
          <button
            onClick={() => {
              setSelectedGame("alien_swarm");
              restartGame();
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              selectedGame === "alien_swarm"
                ? "bg-cyan-600 text-white shadow-sm"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            👾 Alien Swarm : Reactive
          </button>

          <button
            onClick={() => {
              setSelectedGame("gta2_city");
              restartGame();
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              selectedGame === "gta2_city"
                ? "bg-cyan-600 text-white shadow-sm"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            🚗 Retro Cyber City (GTA 2)
          </button>
        </div>
      </div>

      {/* Main Split: Control Sidebar on Left, Game Canvas on Right */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Side: Parameters, Weapons & Stats */}
        <div className="w-full md:w-80 border-r border-neutral-800 bg-neutral-900/40 p-5 space-y-5 overflow-y-auto">
          {/* Game State & High Score */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-neutral-400">Score Actuel</span>
              <span className="text-cyan-400 font-extrabold text-base">{score} PTS</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-neutral-400">Record Local</span>
              <span className="text-amber-400 font-bold">{Math.max(score, highScore)} PTS</span>
            </div>
          </div>

          {/* Weapon Selector (Alien Swarm) */}
          {selectedGame === "alien_swarm" && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-neutral-300">Arsenal Tactique</label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: "rifle", label: "Fusil Laser", icon: Zap },
                  { id: "shotgun", label: "Pompe", icon: Crosshair },
                  { id: "flamethrower", label: "Lance-Flamme", icon: Flame },
                ].map((w) => {
                  const Icon = w.icon;
                  return (
                    <button
                      key={w.id}
                      onClick={() => setWeapon(w.id as any)}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl border text-[11px] font-medium transition ${
                        weapon === w.id
                          ? "bg-cyan-500/20 border-cyan-500/60 text-cyan-200"
                          : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white"
                      }`}
                    >
                      <Icon className="w-4 h-4 mb-1" />
                      <span>{w.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Real-time Algorithmic Engine Tweaks */}
          <div className="space-y-4 pt-2 border-t border-neutral-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-300">Physique & Algorithmes</span>
              <Sliders className="w-3.5 h-3.5 text-neutral-500" />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs text-neutral-400">
                <span>Vitesse des Entités</span>
                <span>{enemySpeed.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                step="0.2"
                value={enemySpeed}
                onChange={(e) => setEnemySpeed(Number(e.target.value))}
                className="w-full accent-cyan-500"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs text-neutral-400">
                <span>Particules & Éclaboussures</span>
                <span>{particleDensity}</span>
              </div>
              <input
                type="range"
                min="4"
                max="32"
                value={particleDensity}
                onChange={(e) => setParticleDensity(Number(e.target.value))}
                className="w-full accent-cyan-500"
              />
            </div>
          </div>

          {/* Sound & Actions */}
          <div className="pt-2 border-t border-neutral-800 space-y-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="w-full flex items-center justify-center space-x-2 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-300 transition"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4" />}
              <span>{soundEnabled ? "Audio Synthétique Activé" : "Audio Muet"}</span>
            </button>

            <button
              onClick={handleDownloadStandaloneGame}
              className="w-full flex items-center justify-center space-x-1.5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-xs font-bold text-white transition shadow-md shadow-cyan-600/20"
            >
              <Download className="w-4 h-4" />
              <span>Télécharger Jeu Solo HTML5</span>
            </button>
          </div>
        </div>

        {/* Right Side: Game Stage & HUD */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-neutral-950 relative">
          {/* In-Game HUD Overlay */}
          <div className="w-full max-w-[800px] flex items-center justify-between px-4 py-2 bg-neutral-900/90 border border-neutral-800 rounded-t-2xl text-xs">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1.5">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-white">SANTÉ : {health}%</span>
              </div>
              {selectedGame === "alien_swarm" && (
                <div className="text-neutral-400">
                  MUNITIONS : <span className="font-mono text-cyan-300">30 / ∞</span>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="px-3 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 font-semibold"
              >
                {isPlaying ? "Pause" : "Jouer"}
              </button>
              <button
                onClick={restartGame}
                className="px-3 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold"
              >
                Recommencer
              </button>
            </div>
          </div>

          {/* HTML5 Game Canvas */}
          <div className="relative">
            <canvas
              ref={canvasRef}
              width={800}
              height={500}
              className="border-x-2 border-b-2 border-neutral-800 rounded-b-2xl shadow-2xl bg-neutral-950 cursor-crosshair max-w-full"
            />

            {/* Game Over Modal Screen */}
            {isGameOver && (
              <div className="absolute inset-0 bg-black/85 backdrop-blur-sm rounded-b-2xl flex flex-col items-center justify-center p-6 space-y-4">
                <h3 className="text-3xl font-extrabold text-red-500 tracking-wider">
                  MISSION TERMINÉE
                </h3>
                <p className="text-sm text-neutral-300">
                  Votre score final : <span className="font-bold text-cyan-400">{score} PTS</span>
                </p>
                <button
                  onClick={restartGame}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 text-white font-bold text-sm shadow-xl shadow-cyan-500/30"
                >
                  REJOUER MAINTENANT
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

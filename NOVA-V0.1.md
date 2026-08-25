# Nova Local Studio v0.1 — branche locale propre

Cette branche retire Gemini du runtime et transforme Nova en application Windows empaquetable.

## Ce qui fonctionne dans cette version

- Chat local via Ollama (`/api/ollama/chat`)
- Gestion et téléchargement de modèles Ollama
- Recherche Web sans Gemini via DuckDuckGo HTML + lecture de pages + synthèse locale Ollama
- CoWork réel en 4 passes Ollama : reformulation, architecture, code, audit
- Diagnostic mémoire/CPU basé sur les mesures réelles du processus et du système
- Calcul de marge e-commerce déterministe sans inventer de données marché
- Recherche de produits Web sans inventer de prix lorsqu'ils ne sont pas disponibles
- Hooks backend pour génération d'images via Stable Diffusion WebUI / SD.Next
- Hook backend pour vidéo via workflow ComfyUI
- Génération d'un jeu HTML autonome via Ollama dans le dossier de données Nova
- Electron + electron-builder + installateur NSIS Windows

## Ce qui n'est PAS encore finalisé

- L'interface graphique n'expose pas encore tous les nouveaux endpoints Media (image/vidéo/jeu) dans des écrans complets.
- Le mode vidéo demande pour l'instant un workflow ComfyUI fourni.
- L'auto-patch reste volontairement en mode audit/dry-run afin d'éviter toute suppression accidentelle.
- L'installateur n'est pas signé numériquement : Windows SmartScreen peut afficher un avertissement.

## Lancer en développement

1. Installer Node.js 22+ et Ollama.
2. `npm install`
3. `npm run dev`
4. Ouvrir `http://127.0.0.1:3000`

## Créer l'installateur Windows

`npm run dist:win`

Le fichier est généré dans `release/`.

Le workflow GitHub Actions `Build Nova Windows` fait aussi ce build automatiquement sur Windows.

# ☀️ Eversun — Suivi de Projets Solaires

Application web de suivi de dossiers solaires : Déclaration Préalable, Consuel, Raccordement, DAACT.

---

## 🚀 Démarrage rapide

### Prérequis
- [Node.js](https://nodejs.org/) v18 ou supérieur
- [npm](https://www.npmjs.com/) v9+

### Installation

```bash
# 1. Installer les dépendances
npm install

# 2. Lancer le serveur de développement
npm run dev
```

L'application s'ouvre automatiquement sur **http://localhost:3000**

---

## 📁 Structure du projet

```
eversun/
├── public/
│   └── favicon.svg          # Icône de l'application
├── src/
│   ├── main.jsx             # Point d'entrée React
│   └── App.jsx              # Application complète
├── .vscode/
│   ├── settings.json        # Paramètres VSCode
│   ├── extensions.json      # Extensions recommandées
│   └── launch.json          # Config debug Chrome
├── index.html
├── vite.config.js
├── package.json
└── README.md
```

---

## 🛠️ Scripts disponibles

| Commande | Description |
|----------|-------------|
| `npm run dev` | Serveur de développement (port 3000) |
| `npm run build` | Build de production dans `dist/` |
| `npm run preview` | Prévisualiser le build de production |

---

## ⌨️ Raccourcis clavier

| Raccourci | Action |
|-----------|--------|
| `/` | Focuser la barre de recherche |
| `Ctrl+S` | Enregistrer (dans les modals) |
| `Ctrl+Shift+D` | Basculer mode sombre / clair |
| `Échap` | Fermer le modal / effacer la recherche |

---

## 🏗️ Stack technique

- **React 18** — UI
- **Vite 5** — Build tool & dev server
- **localStorage** — Persistance des données (pas de backend requis)

---

## 📦 Build de production

```bash
npm run build
```

Les fichiers sont générés dans le dossier `dist/`. Vous pouvez les déployer sur n'importe quel hébergeur statique (Netlify, Vercel, GitHub Pages…).

---

## 🔒 Données

Toutes les données sont stockées **localement dans le navigateur** (`localStorage`). Aucune donnée n'est envoyée vers un serveur.

Pour exporter/sauvegarder, ouvrez la console du navigateur et tapez :
```js
JSON.stringify(Object.fromEntries(Object.keys(localStorage).filter(k=>k.startsWith('evs')).map(k=>[k,JSON.parse(localStorage[k])])))
```

---

*Eversun v2 — Développé avec Claude*

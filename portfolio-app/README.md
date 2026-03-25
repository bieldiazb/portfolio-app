# 📊 Cartera Personal

App web per gestionar inversions i estalvis, amb actualització automàtica de preus via Yahoo Finance.

## Tecnologies

- **Vite + React 18** — build ràpid i components moderns
- **CSS Modules** — estils encapsulats per component
- **Recharts** — gràfic de distribució del portfoli
- **localStorage** — dades persistents al navegador, sense servidor
- **Yahoo Finance API** — preus en temps real d'ETFs i accions
- **GitHub Pages** — hosting gratuït via GitHub Actions


## Instal·lació local

```bash
npm install
npm run dev
```

Obre http://localhost:5173/portfolio-app/

## Desplegar a GitHub Pages

### 1. Crea el repositori a GitHub

Ves a https://github.com/new i crea un repositori anomenat **`portfolio-app`** (públic o privat).

### 2. Configura el nom del repositori a vite.config.js

Si el teu repositori es diu diferent, edita `vite.config.js`:

```js
base: '/NOM-DEL-TEU-REPO/',
```

### 3. Puja el codi

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/EL-TEU-USUARI/portfolio-app.git
git push -u origin main
```

### 4. Activa GitHub Pages

A GitHub → Settings → Pages → Source → **GitHub Actions**

La primera vegada el desplegament triga ~2 minuts. Després de cada `git push` s'actualitza sol.

### 5. URL final

```
https://EL-TEU-USUARI.github.io/portfolio-app/
```

## Estructura del projecte

```
src/
├── components/
│   ├── Header.jsx / .module.css
│   ├── MetricsBar.jsx / .module.css
│   ├── Tabs.jsx / .module.css
│   ├── InvestmentsTable.jsx / .module.css
│   ├── AddInvestmentModal.jsx
│   ├── Modal.module.css
│   ├── SavingsList.jsx / .module.css
│   └── AllocationChart.jsx / .module.css
├── hooks/
│   ├── usePortfolioStore.js   ← localStorage + CRUD
│   └── usePriceFetcher.js     ← Yahoo Finance API
├── utils/
│   └── format.js              ← formatadors de números i types
├── App.jsx
├── App.module.css
├── main.jsx
└── index.css
```

## Afegir nous actius

- **ETFs europeus (Euronext Amsterdam):** ticker + `.AS` → ex: `IWDA.AS`
- **ETFs britànics (LSE):** ticker + `.L` → ex: `VUSA.L`
- **Accions espanyoles (BME):** ticker + `.MC` → ex: `IBE.MC`
- **Accions americanes (NYSE/NASDAQ):** ticker directe → ex: `AAPL`, `LMT`

## Seguretat

Les dades es guarden únicament al teu navegador (localStorage). Cap dada es transmet a cap servidor extern excepte les peticions de preus a Yahoo Finance (ticker públic).

# Resultados OPOS

Web estática (Vite + Tailwind) para calcular resultados de tests con plantillas y soporte multilenguaje.

## Desarrollo local

Requisitos: Node.js 20+.

```bash
npm install
npm run dev
```

## Build estático

```bash
npm run build
```

Salida: `dist/`

## Datos

- Datos de exámenes: `public/results.json`
- Traducciones: `public/copies.json`

## Deploy a GitHub Pages

Este repo incluye un workflow que compila y publica `dist/` automáticamente al hacer push a `main`.

Pasos en GitHub:

1. Settings → Pages
2. Build and deployment → Source: GitHub Actions
3. Haz push a `main` y espera a que termine el workflow “Deploy to GitHub Pages”


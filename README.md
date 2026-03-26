# TestsResult

Static web app (Vite + Tailwind) to calculate multiple-choice test results from official templates, with multilingual UI.

## Live Demo

https://didactor91.github.io/TestsResult/

## Local Development

Requirements: Node.js 20+.

```bash
npm install
npm run dev
```

## Static Build

```bash
npm run build
```

Output: `dist/`

## Data Files

- Exam data: `public/results.json`
- UI translations: `public/copies.json`

## Deploy to GitHub Pages

This repository includes a GitHub Actions workflow that builds and publishes `dist/` automatically on pushes to `main`.

Steps on GitHub:

1. Settings → Pages
2. Build and deployment → Source: GitHub Actions
3. Push to `main` and wait for the “Deploy to GitHub Pages” workflow to finish

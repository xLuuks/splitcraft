# SplitCraft (Client-Side)

SplitCraft e uma aplicacao web para dividir imagens no navegador, sem processamento em servidor.

## Requisitos

- Node.js 18+
- npm 9+

## Rodando localmente

```powershell
cd frontend
npm install
npm start
```

Abra `http://localhost:3000`.

## Build para producao

```powershell
cd frontend
npm run build
```

A pasta de saida sera `frontend/build`.

## Deploy estatico (recomendado)

Voce pode publicar a pasta `frontend/build` em:

- Vercel
- Netlify
- GitHub Pages
- Cloudflare Pages

## Observacoes

- O projeto foi simplificado para frontend 100% client-side.
- O deploy usa apenas os arquivos de `frontend/build`.

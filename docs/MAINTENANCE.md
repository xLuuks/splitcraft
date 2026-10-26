# Manutenção

## Ferramentas e verificações

Use Node.js 22.13 ou superior na linha 22, ou uma linha LTS mais recente (como a 24), e npm. O `package-lock.json` deve acompanhar mudanças nas dependências.

Execute os comandos na pasta `frontend`:

```sh
npm ci
npm audit
npm run lint
npm run format:check
npm run test:ci
npm run build
```

`npm run format` aplica a formatação. Os testes de interface usam JSDOM; não substituem uma revisão visual em navegadores reais.

## Dependências de build

O ambiente usa Vite para desenvolvimento e build, Vitest com JSDOM para testes e Tailwind CSS 4 com o plugin de Vite para estilos. CRA, CRACO, Webpack e Jest foram removidos da cadeia de ferramentas.

`npm start` e `npm run dev` iniciam o servidor em `http://localhost:3000`. O comando `npm run build` gera `frontend/build`, e `npm run preview` disponibiliza esse artefato em `http://localhost:4173`.

O alias `@` aponta para `frontend/src`. Componentes e testes com JSX usam a extensão `.jsx`; os utilitários usam `.js`. O tema e os componentes existentes foram preservados durante a migração.

Execute `npm audit` para acompanhar os avisos de todas as dependências e `npm audit --omit=dev` para avaliar separadamente as dependências de execução. Evite atualizações forçadas: alterações de versão principal precisam ser verificadas com testes, build e revisão visual.

Referências: [Vite](https://vite.dev/guide/), [Vitest](https://vitest.dev/guide/migration/) e [Tailwind CSS](https://tailwindcss.com/docs/upgrade-guide).

## Capturas e documentação

O README principal apresenta a motivação, as funcionalidades, a arquitetura e os comandos do projeto. A licença escolhida é MIT; o texto completo fica em `LICENSE`, na raiz do repositório.

As capturas ficam em `docs/screenshots`. A imagem de demonstração em `docs/assets/demo-social.png` foi criada para o projeto e também é distribuída sob a licença MIT.

Ao alterar a interface, atualize as capturas da tela inicial, do editor, dos resultados e do editor mobile. Use a imagem de demonstração em uma grade de 2 linhas e 2 colunas. As capturas desktop usam viewport de 1440 × 1000 px; a mobile usa 390 × 844 px, com captura da página completa. Aguarde o carregamento das fontes e o desaparecimento das notificações antes de capturar. Evite imagens com dados pessoais ou de terceiros.

Antes de publicar, confira também os valores do painel do Cloudflare descritos em `DEPLOYMENT.md`.

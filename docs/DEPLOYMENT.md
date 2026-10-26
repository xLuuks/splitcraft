# Deploy no Cloudflare Pages

O SplitCraft gera arquivos estáticos. Não precisa de backend, banco de dados ou chaves de API.

## Configuração do projeto

No painel do Cloudflare Pages, conecte o repositório e confira:

| Campo                | Valor             |
| -------------------- | ----------------- |
| Branch de produção   | `main`            |
| Diretório raiz       | `frontend`        |
| Comando de build     | `npm run build`   |
| Diretório de saída   | `build`           |
| Variável de ambiente | `NODE_VERSION=22` |

Esses são os valores esperados pelo código; a configuração do painel deve ser conferida no Cloudflare.

O projeto usa Vite e requer Node.js 22.13 ou superior na linha 22, ou uma linha LTS mais recente (como a 24). A variável `NODE_VERSION=22` deve selecionar uma versão atualizada dessa linha. A saída foi configurada como `build` em `vite.config.mjs` para manter o diretório de deploy existente.

## Validação antes de publicar

```sh
cd frontend
npm ci
npm audit
npm run lint
npm run format:check
npm run test:ci
npm run build
```

O workflow `.github/workflows/ci.yml` executa as mesmas verificações no GitHub.
O deploy continua sendo feito pela integração do Cloudflare Pages com o repositório.

Para conferir o artefato gerado antes de publicar, execute `npm run preview` na pasta `frontend` e abra `http://localhost:4173`.

## Limitações

- Imagens carregadas por URL dependem de permissão CORS do site de origem.
- O processamento e a geração do ZIP usam a memória disponível no navegador.
- A exportação usa Canvas API: animações e metadados do arquivo original não são preservados.
- “Manter formato original” usa PNG quando o formato original não possui codificador suportado. O nome do download acompanha o tipo efetivamente gerado pelo navegador.

# Como fazer Deploy no Vercel

Esta aplicação foi adaptada para funcionar no Vercel usando funções serverless.

## 📁 Estrutura do Projeto

O projeto agora tem duas partes:

1. **`server/`** - Servidor Express tradicional (usado apenas em desenvolvimento local)
2. **`api/`** - Funções serverless para produção no Vercel

## 🚀 Deploy via Dashboard do Vercel (Recomendado)

### Passo 1: Preparar o Repositório

1. Faça commit de todas as alterações:
   ```bash
   git add .
   git commit -m "Preparar aplicação para deploy no Vercel"
   ```

2. Faça push para o GitHub/GitLab/Bitbucket:
   ```bash
   git push origin main
   ```

### Passo 2: Importar no Vercel

1. Acesse [vercel.com](https://vercel.com) e faça login
2. Clique em **"Add New Project"**
3. Selecione seu repositório
4. O Vercel detectará automaticamente a configuração do Vite

### Passo 3: Configurar o Build

As configurações já estão no arquivo `vercel.json`:

- **Build Command**: Auto-detectado (Vercel usa `vite build` automaticamente)
- **Output Directory**: `dist/public` (configurado no vercel.json)
- **Install Command**: `npm install` (padrão)

**Importante**: O Vercel detecta automaticamente que é um projeto Vite e compila o frontend. As funções serverless TypeScript em `api/` são compiladas separadamente pelo Vercel.

### Passo 4: Variáveis de Ambiente (se necessário)

Se você tiver variáveis de ambiente, adicione-as em:
**Project Settings → Environment Variables**

### Passo 5: Deploy

Clique em **"Deploy"** e aguarde!

## 🖥️ Deploy via CLI do Vercel

### Instalação do CLI

```bash
npm i -g vercel
```

### Login

```bash
vercel login
```

### Deploy de Preview

```bash
vercel
```

### Deploy de Produção

```bash
vercel --prod
```

## 📊 Como Funciona

### Em Desenvolvimento (Local)

```bash
npm run dev
```

- Usa o servidor Express tradicional em `server/`
- Roda na porta 5000
- Hot reload com Vite

### Em Produção (Vercel)

- Frontend compilado é servido estaticamente de `dist/public`
- Backend usa funções serverless em `api/`
- Todas as rotas `/api/*` são automaticamente direcionadas para `api/[...slug].ts` (catch-all do Vercel)
- Rotas do frontend são direcionadas para `index.html` (client-side routing)

## 🔧 Arquivos de Configuração

### `vercel.json`

```json
{
  "outputDirectory": "dist/public",
  "rewrites": [
    {
      "source": "/((?!api).*)",
      "destination": "/index.html"
    }
  ],
  "functions": {
    "api/[...slug].ts": {
      "memory": 1024,
      "maxDuration": 10
    }
  }
}
```

**Como funciona**:
- `outputDirectory`: Define onde o Vercel encontra os arquivos estáticos buildados (`dist/public`)
- `rewrite`: Usa regex negativa `(?!api)` para redirecionar todas as rotas que NÃO começam com `/api` para `index.html` (client-side routing do React)
- `functions`: O Vercel detecta automaticamente `api/[...slug].ts` (sintaxe catch-all) e roteia TODAS as requisições `/api/*` para ele
- O Express dentro de `api/[...slug].ts` recebe o path completo e faz o roteamento interno para `/api/tickets`, `/api/orders`, etc.
- **Importante**: O nome `[...slug].ts` é especial - indica ao Vercel que esse arquivo deve capturar todas as rotas dentro de `/api/`

### `.vercelignore`

```
server/
node_modules/
.git/
*.log
.env*
!.env.example
```

## ⚠️ Limitações do Vercel (Funções Serverless)

1. **Sem conexões persistentes**: WebSockets precisam de configuração especial
2. **Timeout de execução**: 
   - Plano Hobby: 10 segundos
   - Plano Pro: 60 segundos
3. **Cold starts**: Primeira requisição pode ser mais lenta
4. **Sem armazenamento persistente**: 
   - ⚠️ **IMPORTANTE**: Esta aplicação usa armazenamento em memória (`MemStorage`)
   - Os dados serão perdidos a cada cold start
   - Para produção, você DEVE usar um banco de dados persistente (PostgreSQL, MongoDB, etc.)

## 💾 Próximo Passo Recomendado: Banco de Dados Persistente

Para uma aplicação em produção, você precisa substituir o `MemStorage` por um banco de dados real:

### Opções Recomendadas:

1. **Vercel Postgres** (Integrado)
2. **Neon** (PostgreSQL serverless)
3. **PlanetScale** (MySQL serverless)
4. **Supabase** (PostgreSQL com recursos extras)

### Como Adicionar Vercel Postgres:

1. No dashboard do Vercel, vá em **Storage**
2. Clique em **Create Database** → **Postgres**
3. Conecte ao seu projeto
4. Use as variáveis de ambiente fornecidas

## 📱 Testando o Deploy

Depois do deploy, teste:

1. ✅ Frontend carrega corretamente
2. ✅ Rotas `/api/tickets` funcionam
3. ✅ Rotas `/api/orders` funcionam
4. ✅ Navegação entre páginas funciona (client-side routing)

## 🐛 Troubleshooting

### Erro: "Function is too large"

- Reduza dependências desnecessárias
- Use imports dinâmicos quando possível

### Erro: "Build failed"

- Verifique se todas as dependências estão no `package.json`
- Verifique se não há erros de TypeScript

### API retorna 404

- Verifique se `vercel.json` está configurado corretamente
- Verifique se o arquivo `api/[...slug].ts` existe
- Certifique-se de que o nome do arquivo usa exatamente a sintaxe `[...slug].ts` (colchetes são obrigatórios)

### Dados não persistem

- Isso é esperado com `MemStorage`
- Implemente um banco de dados persistente

## 📚 Recursos Adicionais

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Functions](https://vercel.com/docs/functions)
- [Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite)

---

**Desenvolvido com ❤️ para facilitar o deploy no Vercel**

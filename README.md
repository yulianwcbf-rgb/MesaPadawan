# Mesa Padawan — Ranking de Performance

Dashboard de ranking de performance da mesa de assessores (EWZ Capital),
originalmente criado no Base44 e adaptado para rodar **100% no GitHub Pages**,
com **frontend e backend funcionando**, incluindo login.

## Dois modos de backend

O GitHub Pages é hospedagem **estática** (só serve arquivos, não roda servidor).
O app suporta dois backends, escolhidos automaticamente:

| Modo | Quando é usado | Login | Dados |
| --- | --- | --- | --- |
| **Supabase (recomendado)** | Quando as variáveis `VITE_SUPABASE_*` estão configuradas | Compartilhado entre todos | **Compartilhados** — todos veem os mesmos dados, de qualquer aparelho |
| **Local (fallback)** | Quando não há Supabase configurado | Por navegador | Ficam **só no navegador de cada pessoa** |

O código do app não muda entre os modos — tudo passa por
`src/api/base44Client.js`, que escolhe o backend.

## ✅ Modo compartilhado com Supabase (passo a passo)

Para que **todas as pessoas façam login e vejam os mesmos dados** em qualquer
celular/computador, use o Supabase (tem plano gratuito):

1. **Crie um projeto** em <https://supabase.com> (New project). Guarde a senha do banco.
2. **Crie as tabelas:** no projeto, vá em **SQL Editor → New query**, cole todo o
   conteúdo de [`supabase/schema.sql`](supabase/schema.sql) e clique em **Run**.
3. **Desative a confirmação por email** (para entrar direto após cadastrar):
   **Authentication → Sign In / Providers → Email** e desligue **“Confirm email”**.
   (Opcional — se preferir manter, cada pessoa precisa confirmar pelo email.)
4. **Pegue as chaves:** **Project Settings → API** e copie:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public key** → `VITE_SUPABASE_ANON_KEY`
   (São valores públicos, seguros para o frontend.)
5. **Configure no GitHub** (para o build do Pages usar o Supabase):
   **Settings → Secrets and variables → Actions → New repository secret** e crie:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. **Publique:** faça o merge na `main`. O GitHub Actions builda e publica. Pronto —
   cada pessoa cria sua conta (ou faz login) e todos compartilham os mesmos dados.

Para rodar localmente nesse modo, crie um arquivo `.env` (baseado em
[`.env.example`](.env.example)) com as duas variáveis e rode `npm run dev`.

> A área do líder (abas Histórico, Análise, Equipe e o formulário do Líder)
> continua protegida por uma senha de líder: **`AAAaaa123`**
> (em `src/components/PasswordGate.jsx`). Isso é independente do login.

## Modo local (sem configurar nada)

Se você **não** configurar o Supabase, o app funciona mesmo assim, mas os dados
ficam **no navegador de cada pessoa** (bom para uso em um único computador, como
o PC da mesa). Nesse modo há uma conta admin criada no primeiro acesso:

- **Email:** `admin@mesa.local` — **Senha:** `admin123`
  (personalizável por `VITE_ADMIN_EMAIL` / `VITE_ADMIN_PASSWORD`).

## Rodar localmente

```bash
npm install
npm run dev            # desenvolvimento
npm run build          # gera a versão de produção em dist/
npm run preview        # testa a versão de produção
```

## Como o deploy funciona (GitHub Pages)

Deploy automático via GitHub Actions (`.github/workflows/deploy.yml`):

1. Push/merge na branch **`main`**.
2. No GitHub: **Settings → Pages → Build and deployment → Source: “GitHub Actions”**.
3. A URL aparece em **Settings → Pages**
   (`https://<usuário>.github.io/<repositório>/`).

Detalhes que garantem o funcionamento em qualquer caminho do Pages:

- Roteamento com **HashRouter** (`/#/login`…): links diretos e refresh **não dão 404**.
- Vite com `base: './'`: os arquivos carregam tanto na raiz quanto em subcaminho.

## Estrutura

- `src/api/base44Client.js` — ponto único que expõe o `db` e escolhe o backend.
- `src/api/supabase/` — backend compartilhado (Supabase: auth + entidades).
- `src/api/backend/` — backend local (fallback em `localStorage`).
- `src/pages/` — páginas (Home, Login, Register, ForgotPassword, ResetPassword).
- `src/components/padawan/` — abas do dashboard (Ranking, Lançamento, Histórico,
  Análise, Equipe, Regras).
- `src/lib/scoring.js` — regras de pontuação.
- `supabase/schema.sql` — script para criar as tabelas e políticas no Supabase.
- `base44/entities/` — esquemas originais das entidades (referência).

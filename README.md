# Fluentify

Plataforma de aprendizado de inglês para brasileiros que combina **professor de IA**, **plano de estudos personalizado**, **prática de fala com feedback** e **repetição espaçada**.

O objetivo é resolver o problema de quem estuda sozinho: em vez de conteúdo genérico, o aluno recebe um plano adaptado ao nível e ao tempo disponível, conversa com um tutor que responde em streaming, recebe correções estruturadas e revisa automaticamente o que errou.

> Projeto full-stack desenvolvido como estudo aprofundado de arquitetura, integração com LLMs, algoritmos de aprendizado e segurança de APIs.

Quando o repositório estiver publicado no GitHub, descomente e troque OWNER/REPO:
[![CI](https://github.com/OWNER/REPO/actions/workflows/ci.yml/badge.svg)](https://github.com/OWNER/REPO/actions/workflows/ci.yml)

![TypeScript](https://img.shields.io/badge/TypeScript-6.x-3178C6?logo=typescript&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-12-E0234E?logo=nestjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma&logoColor=white)

---

## Índice

- [Visão geral](#visão-geral)
- [Funcionalidades](#funcionalidades)
- [Arquitetura](#arquitetura)
- [Stack](#stack)
- [Estrutura do repositório](#estrutura-do-repositório)
- [Como rodar localmente](#como-rodar-localmente)
  - [Acessar pelo celular (IP da máquina)](#4-acessar-pelo-celular-na-mesma-rede-ip-da-máquina)
  - [Instalar como app (PWA)](#5-instalar-como-app-no-celular-pwa)
- [Credenciais de demonstração](#credenciais-de-demonstração)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [API](#api)
- [Modelo de dados](#modelo-de-dados)
- [Decisões de engenharia](#decisões-de-engenharia)
- [Testes e qualidade](#testes-e-qualidade)
- [CI](#ci)
- [Roadmap e limitações](#roadmap-e-limitações)
- [Screenshots](#screenshots)

---

## Visão geral

O fluxo principal do produto:

1. **Onboarding** — o aluno informa objetivo, tempo por dia, dias por semana e faz um **mini teste de nivelamento** (10 perguntas). O nível final é o **menor** entre o autodeclarado e o testado, para evitar frustração no primeiro dia.
2. **Plano de estudos** — um job assíncrono (BullMQ) usa IA para gerar semanas de estudo, cada dia com lições de fala, vocabulário e conversa.
3. **Prática diária** — exercício de fala com reconhecimento de voz, cartões de vocabulário e um chat com o professor.
4. **Feedback** — o chat responde em streaming e, em paralelo, um analisador devolve correções estruturadas (`original → corrigido + explicação`).
5. **Revisão** — palavras e frases erradas viram cartões no algoritmo **SM-2**.
6. **Evolução** — XP, conquistas, streak com congelador, meta semanal, missões de role-play e recalibragem automática de nível.

---

## Funcionalidades

### Autenticação e conta
- Cadastro e login com e-mail/senha (**bcrypt**).
- **Google Sign-In** (opcional, via `GOOGLE_CLIENT_ID`).
- Access token JWT curto (15 min) mantido **em memória** no front.
- Refresh token em **cookie HttpOnly** com rotação, detecção de reuso e revogação de todas as sessões.
- Recuperação de senha por e-mail (Resend) com token de uso único e expiração.

### Nivelamento e plano
- Mini teste público (roda antes do cadastro) com gabarito **somente no servidor**.
- Geração de plano via fila **BullMQ** com retry/backoff.
- Acompanhamento do job por `GET /plans/jobs/:id`.
- Recalibragem automática: média ≥ 90 sobe o nível, ≤ 40 desce, com histórico em `LevelHistory`.

### Prática de fala
- Exercício com **Web Speech API** (reconhecimento e síntese de voz).
- Alinhamento por **LCS** (Longest Common Subsequence) para comparar frase esperada e transcrição.
- Nota por palavra (certa/errada), dica gerada por IA somente quando necessário (economia de tokens).
- Frases com nota **< 80%** viram cartão de revisão automaticamente.

### Chat e correção estruturada
- Resposta do professor em **SSE (streaming)**.
- Analisador roda **em paralelo** com o modelo rápido e devolve `corrections` + `newWords` validados com **Zod**.
- Correções aparecem abaixo do balão do aluno e alimentam a revisão espaçada.
- Quotas diárias por funcionalidade e registro de tokens em `AiUsage`.

### Repetição espaçada
- Algoritmo **SM-2** (o mesmo do Anki) em função pura e testável.
- Cartões gerados automaticamente por vocabulário concluído, fala ruim e correções do chat.
- Deduplicação por `(userId, front)` e fila de revisão por `dueAt`.

### Gamificação
- XP por dia concluído, fala ≥ 90% (somente na primeira vez por exercício) e missões.
- Nível do jogador calculado por `floor(sqrt(xp / 100)) + 1`.
- Conquistas (`UserAchievement`), streak com **congelador** e fuso horário por usuário.
- Meta semanal e grade de conquistas na tela de progresso.

### Missões de role-play
- Catálogo com cenário, personagem e objetivos.
- Conversa com o mesmo motor do tutor, mas com prompt de role-play.
- Avaliação final por IA: objetivos cumpridos, nota e feedback.
- Missões bloqueadas por nível mínimo.

### Operação e segurança
- Filtro por `userId` em todas as leituras/escritas (anti-IDOR).
- `ValidationPipe` global com `whitelist` e `transform`.
- Throttling global e limites específicos em rotas caras.
- Logs estruturados com `pino`, ocultando `authorization` e `cookie`.
- Sentry para erros (API e web).
- Health check em `GET /health`.
- Dashboard de filas (Bull Board) em `/queues` protegido por Basic Auth.
- **PWA instalável**: manifest, service worker e prompt de instalação no celular.

---

## Arquitetura

```mermaid
flowchart LR
  subgraph Client["Navegador"]
    WEB["React + Vite<br/>TanStack Query + SSE"]
  end

  subgraph API["API NestJS"]
    AUTH["Auth / JWT"]
    PROFILE["Profile / Placement"]
    PLANS["Plans"]
    LESSONS["Lessons"]
    SPEAK["Speaking"]
    TUTOR["Tutor"]
    MISSIONS["Missions"]
    REVIEWS["Reviews (SM-2)"]
    PROGRESS["Progress / Gamification"]
  end

  DB[("PostgreSQL")]
  REDIS[("Redis")]
  QUEUE["BullMQ<br/>fila de planos"]
  AI["OpenAI<br/>smart + fast"]

  WEB -->|REST| AUTH
  WEB -->|REST + SSE| LESSONS
  WEB -->|REST + SSE| TUTOR
  WEB -->|REST + SSE| MISSIONS
  WEB -->|REST| PROGRESS

  AUTH --> DB
  PROFILE --> DB
  LESSONS --> DB
  REVIEWS --> DB
  PROGRESS --> DB
  TUTOR --> AI
  SPEAK --> AI
  MISSIONS --> AI
  PLANS --> QUEUE
  QUEUE --> REDIS
  QUEUE --> AI
  QUEUE --> DB
```

**Separação de responsabilidades:** a API é modular (um módulo Nest por domínio), o front é uma SPA React consumindo REST + SSE, e tarefas caras de IA rodam fora do ciclo de request quando possível (fila de planos).

---

## Stack

| Camada | Tecnologias |
|---|---|
| **Backend** | NestJS 12, TypeScript 6, Prisma 6, PostgreSQL 16 |
| **Autenticação** | JWT, Passport, bcrypt, Google Auth Library |
| **IA** | OpenAI (chat completions, streaming, JSON mode), Zod |
| **Assíncrono** | BullMQ + Redis |
| **Frontend** | React 19, Vite 8, TanStack Query 5, React Router 7, Tailwind CSS 4 |
| **Voz** | Web Speech API (SpeechRecognition + SpeechSynthesis) |
| **Observabilidade** | Sentry, nestjs-pino, `@nestjs/observe` |
| **E-mail** | Resend |
| **Qualidade** | Vitest, oxlint, ESLint, GitHub Actions |
| **Infra local** | Docker Compose (Postgres + Redis) |

---

## Estrutura do repositório

```text
Fluentify/
├─ english-api/                 # API NestJS
│  ├─ prisma/
│  │  ├─ schema.prisma          # modelos e enums
│  │  ├─ migrations/            # histórico versionado
│  │  └─ seed.ts                # dados de demonstração
│  ├─ src/
│  │  ├─ ai/                    # OpenAI, quotas, custo
│  │  ├─ auth/                  # JWT, Google, refresh tokens
│  │  ├─ placement/             # mini teste de nivelamento
│  │  ├─ plans/                 # geração assíncrona de plano
│  │  ├─ lessons/               # dia atual, conclusão
│  │  ├─ speaking/              # avaliação de fala, LCS
│  │  ├─ tutor/                 # chat + análise estruturada
│  │  ├─ missions/              # role-play
│  │  ├─ reviews/               # SM-2
│  │  ├─ progress/              # streak, pontos fracos
│  │  ├─ gamification/          # XP e conquistas
│  │  ├─ profile/               # perfil + recalibragem
│  │  ├─ generated/prisma/      # client gerado (não versionado)
│  │  └─ common/                # SSE, fuso, decorators
│  └─ docker-compose.yml        # Postgres + Redis
│
├─ english-web/                 # SPA React
│  └─ src/
│     ├─ pages/                 # Onboarding, Home, Tutor, Progress, Review, Missions...
│     ├─ components/            # ChatView, SpeakingExercise, CelebrationModal...
│     ├─ hooks/                 # useSpeechRecognition, usePlanJob
│     ├─ lib/                   # axios, tipos, speech
│     └─ auth/                  # contexto e rota protegida
│
├─ .github/workflows/ci.yml     # lint + build + testes + migrations
└─ README.md
```

---

## Como rodar localmente

### Pré-requisitos

- **Node.js 24+**
- **npm**
- **Docker** e **Docker Compose**
- Chave da **OpenAI** (necessária para gerar plano, chat, missões e dicas de IA)

> Os comandos abaixo funcionam no Linux/macOS e no Windows (PowerShell). No Windows, troque `cp` por `Copy-Item`.

### 1. Subir Postgres e Redis

```bash
cd english-api
docker compose up -d
```

Isso expõe Postgres em `localhost:5433` e Redis em `localhost:6379`.

### 2. Rodar a API

```bash
cd english-api
cp .env.example .env          # Windows: Copy-Item .env.example .env
# edite o .env: DATABASE_URL, JWT_SECRET e OPENAI_API_KEY são os principais
npm ci
npx prisma migrate dev
npm run db:seed
npm run start:dev
```

A API sobe em `http://localhost:3000`.

> Se você restaurou um **backup** de outra máquina, o schema já está no dump: rode `npx prisma generate` (para criar o client) e **não** `prisma migrate dev`. O Redis precisa estar no ar para o BullMQ.

### 3. Rodar o front

```bash
cd english-web
cp .env.example .env          # Windows: Copy-Item .env.example .env
# VITE_API_URL=/api (padrão)
npm ci
npm run dev
```

A SPA sobe em `http://localhost:5173`.

> Sem uma `OPENAI_API_KEY` válida, o login e o conteúdo já seedado funcionam, mas geração de plano, chat, missões e dicas de IA vão falhar.
>
> Para recuperação de senha, se não houver `RESEND_API_KEY` ou o envio falhar, a API imprime o conteúdo do e-mail no console em desenvolvimento. Copie o link `/reset?token=...` de lá.

### 4. Acessar pelo celular na mesma rede (IP da máquina)

O front pode ser aberto por qualquer dispositivo na mesma Wi‑Fi. Como o front chama a API em `/api`, o **proxy do Vite** resolve a API local: você **não precisa** mudar `VITE_API_URL` nem configurar CORS para cada IP.

#### 4.1 Descubra o IP da máquina

Windows (PowerShell):

```powershell
ipconfig
# ou:
Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '127.*' }
```

Linux/macOS:

```bash
ip addr    # ou: ifconfig
```

Use o IPv4 do adaptador que está na **mesma rede** do celular (Wi‑Fi ou Ethernet). Exemplo: `192.168.0.10`.

#### 4.2 Abra no celular

Com a API e o front rodando:

```text
http://192.168.0.10:5173
```

(substitua pelo IP do seu computador)

O Vite já está com `server.host: true`, então escuta em `0.0.0.0`. O celular e o computador precisam estar na mesma Wi‑Fi; redes de visitantes com “isolamento de clientes” podem bloquear.

#### 4.3 Se não abrir: libere o firewall

No Windows, abra o PowerShell **como administrador**:

```powershell
New-NetFirewallRule -DisplayName "Fluentify Dev (LAN)" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 5173,4173 -Profile Private
```

- `5173` → `npm run dev`
- `4173` → `npm run preview` (PWA)

A porta `3000` **não precisa** ser exposta: o navegador fala apenas com o Vite, que encaminha `/api` para `127.0.0.1:3000`.

Confirme que a rede está como **Privada** (Configurações → Rede e Internet → Wi‑Fi → Propriedades) e que o roteador não tem “AP isolation / isolamento de clientes”.

#### 4.4 Como funciona o proxy (e quando mudar)

O `english-web/vite.config.ts` tem:

```ts
server:  { host: true, port: 5173, proxy: apiProxy },
preview: { host: true, port: 4173, proxy: apiProxy },
```

e o proxy encaminha `/api/*` para `http://127.0.0.1:3000`, removendo o prefixo `/api`. O `english-web/.env` usa `VITE_API_URL=/api`, então:

```text
celular → http://IP:5173  → Vite (proxy) → http://127.0.0.1:3000 (API)
```

Isso mantém front e API na mesma origem, sem CORS, e faz o cookie de refresh (`COOKIE_PATH=/api/auth`) funcionar no celular.

Se a API estiver em **outra máquina**, defina no `english-web/.env`:

```env
API_PROXY_TARGET=http://IP-DA-API:3000
```

e reinicie o `npm run dev`.

> O IP pode mudar quando você troca de rede ou reconecta no Wi‑Fi. Se parar de abrir, rode `ipconfig` novamente.

### 5. Instalar como app no celular (PWA)

O projeto já inclui manifest, ícones, service worker e um banner de instalação. **Instalar exige HTTPS** (ou `localhost`); por isso, na mesma Wi‑Fi em HTTP, o navegador não oferece a instalação.

#### 5.1 Gere o build e sirva o preview

```bash
cd english-web
npm run build
npm run preview
```

O preview sobe em `http://localhost:4173` e mantém o proxy `/api`.

#### 5.2 Exponha com HTTPS (escolha uma opção)

**Opção A — Cloudflare Tunnel (mais rápida, pública)**

```powershell
winget install --id Cloudflare.cloudflared -e
```

Feche e reabra o terminal. Com o preview rodando:

```bash
cloudflared tunnel --url http://localhost:4173
```

Copie a URL `https://....trycloudflare.com` e abra no celular.

**Opção B — Tailscale (privado)**

1. Instale o Tailscale no computador e no celular com a mesma conta.
2. Com o preview rodando:

```bash
tailscale serve --bg 4173
```

3. Abra no celular a URL `https://<máquina>.<tailnet>.ts.net`.

#### 5.3 Instale

- **Android/Chrome:** o banner “Instale o Fluentify no celular” aparece; ou menu → “Instalar app”.
- **iPhone/Safari:** Compartilhar → “Adicionar à Tela de Início”.

#### 5.4 Observações

- O banner aparece só em telas mobile e depois do login.
- Em `npm run dev`, o service worker não fica ativo por padrão; para testar a instalação use `npm run build` + `npm run preview`.
- **Login com Google:** adicione a URL do túnel em “Origens JavaScript autorizadas” no Google Cloud Console.
- **Recuperação de senha:** ajuste `FRONTEND_URL` no `english-api/.env` para a URL usada no celular/túnel e reinicie a API.
- Túneis `trycloudflare.com` são públicos; para acesso privado, use Tailscale.
- Para acessar **fora da sua rede** (4G/5G), o IP local não funciona — use o túnel ou faça o deploy descrito no roadmap.

### 6. Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| Celular não abre `http://IP:5173` | Firewall, rede diferente ou AP isolation | Libere a porta, confirme a mesma Wi‑Fi e a rede Privada |
| Tela abre, mas o login falha | `VITE_API_URL` diferente de `/api` ou API parada | Confira o `.env` do web e se a API está na porta 3000 |
| Login funciona e cai ao recarregar | `COOKIE_PATH` diferente de `/api/auth` | Ajuste o `.env` da API e reinicie |
| `P1001` / banco inacessível | Porta errada (o compose usa **5433**) | Confira `DATABASE_URL` |
| API não sobe | `OPENAI_API_KEY` ausente | Preencha a chave (o `AiService` exige) |
| PWA não oferece instalar | Página em HTTP, não HTTPS | Use `preview` + túnel HTTPS |
| O IP parou de funcionar | O DHCP trocou o IP | Rode `ipconfig` e use o novo IP |
| `Cannot find module .../generated/prisma` | Client do Prisma não gerado | Rode `npx prisma generate` |

---

## Credenciais de demonstração

O seed cria um aluno pronto para explorar o produto:

| Campo | Valor |
|---|---|
| E-mail | `demo@fluentify.app` |
| Senha | `demo12345` |

O usuário demo já vem com:

- perfil **INTERMEDIATE**, objetivo **CONVERSATION**, 10 min/dia, 5 dias/semana;
- plano ativo de **7 dias** (21 lições) com o primeiro dia concluído;
- **5 cartões** de revisão vencidos;
- **5 tentativas** de fala (para o gráfico e para os pontos fracos);
- streak de **3 dias** com 1 congelador;
- **250 XP** e 2 conquistas.

O seed é **idempotente**: pode ser executado novamente sem duplicar dados.

---

## Variáveis de ambiente

### API (`english-api/.env`)

| Variável | Obrigatória | Descrição |
|---|---|---|
| `DATABASE_URL` | ✅ | String de conexão do PostgreSQL |
| `JWT_SECRET` | ✅ | Segredo para assinar o access token |
| `OPENAI_API_KEY` | ✅ (IA) | Chave da OpenAI |
| `OPENAI_MODEL` | — | Modelo "smart" (padrão `gpt-4.1`) |
| `OPENAI_MODEL_FAST` | — | Modelo "fast" para análise/dicas (padrão `gpt-4.1-mini`) |
| `FRONTEND_URL` | ✅ | Origem liberada no CORS e base do link de recuperação de senha (aceita lista separada por vírgula) |
| `COOKIE_PATH` | ✅ | Caminho do cookie de refresh. Com o proxy do Vite, use `/api/auth`; sem proxy, `/auth` |
| `REDIS_HOST` / `REDIS_PORT` | ✅ | Conexão do BullMQ |
| `PORT` | — | Porta da API (padrão `3000`) |
| `NODE_ENV` | — | `development` / `production` |
| `SENTRY_DSN` | — | Erros no Sentry |
| `RESEND_API_KEY` / `MAIL_FROM` | — | Recuperação de senha |
| `GOOGLE_CLIENT_ID` | — | Login com Google |
| `AI_DAILY_TOKEN_ALERT` | — | Limite para alerta de consumo |
| `DASHBOARD_USER` / `DASHBOARD_PASS` | — | Basic Auth do Bull Board (`/queues`) |

### Web (`english-web/.env`)

| Variável | Obrigatória | Descrição |
|---|---|---|
| `VITE_API_URL` | ✅ | `/api` em dev (proxy do Vite para a API local); URL pública da API em produção |
| `VITE_GOOGLE_CLIENT_ID` | — | Client ID do Google Sign-In |
| `VITE_SENTRY_DSN` | — | Erros no Sentry |

> Em desenvolvimento, o Vite encaminha `/api/*` para `http://127.0.0.1:3000`. Para apontar para outra máquina, defina `API_PROXY_TARGET` no `.env` do web.

---

## API

Base local: `http://localhost:3000`. Rotas marcadas com 🔒 exigem `Authorization: Bearer <accessToken>`.

### Autenticação

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/auth/register` | Cria conta e devolve access token + cookie de refresh |
| `POST` | `/auth/login` | Login com e-mail/senha |
| `POST` | `/auth/google` | Login com credencial do Google |
| `POST` | `/auth/refresh` | Rotaciona o refresh token |
| `POST` | `/auth/logout` | Revoga o refresh token |
| `POST` | `/auth/forgot` | Envia e-mail de recuperação |
| `POST` | `/auth/reset` | Redefine a senha |

### Perfil e nivelamento

| Método | Rota | Descrição |
|---|---|---|
| `GET/PUT` | `/profile` 🔒 | Lê/atualiza perfil e fuso |
| `GET` | `/placement/questions` | Perguntas do teste (sem gabarito) |
| `POST` | `/placement/submit` | Corrige o teste e devolve o nível |

### Plano e lições

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/plans/generate` 🔒 | Enfileira a geração do plano |
| `GET` | `/plans/jobs/:id` 🔒 | Status do job |
| `GET` | `/plans/active` 🔒 | Plano ativo |
| `GET` | `/lessons/today` 🔒 | Dia atual com lições |
| `POST` | `/lessons/days/:id/complete` 🔒 | Conclui o dia (cartões, streak, XP, nível) |

### Fala, chat e revisão

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/speaking/evaluate` 🔒 | Avalia a fala (LCS) e gera dica/XP |
| `POST` | `/tutor/message` 🔒 | Chat do professor em **SSE** |
| `GET` | `/reviews/due` 🔒 | Cartões vencidos |
| `POST` | `/reviews/:id/grade` 🔒 | Avalia um cartão (SM-2) |

### Progresso, missões e saúde

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/progress` 🔒 | Resumo, XP, meta semanal e conquistas |
| `GET` | `/progress/weak-points` 🔒 | Palavras mais erradas |
| `POST` | `/progress/practice` 🔒 | Gera frases sob medida |
| `GET` | `/missions` 🔒 | Lista de missões |
| `POST` | `/missions/:id/start` 🔒 | Inicia uma missão |
| `POST` | `/missions/runs/:runId/message` 🔒 | Chat da missão em **SSE** |
| `POST` | `/missions/runs/:runId/finish` 🔒 | Avalia a missão |
| `GET` | `/health` | Health check (banco) |

**Formato SSE:** cada evento é `data: {json}\n\n` com `type` em `meta`, `delta`, `analysis`, `done` ou `error`.

---

## Modelo de dados

```mermaid
erDiagram
  User ||--o| Profile : has
  User ||--o{ StudyPlan : owns
  StudyPlan ||--o{ PlanDay : contains
  PlanDay ||--o{ Lesson : contains
  User ||--o{ Attempt : makes
  Lesson ||--o{ Attempt : evaluated_in
  User ||--o{ ReviewCard : reviews
  User ||--o{ Conversation : opens
  Conversation ||--o{ Message : contains
  User ||--o| Streak : keeps
  User ||--o{ MissionRun : runs
  User ||--o{ UserAchievement : unlocks
  User ||--o{ LevelHistory : changes
  User ||--o{ AiUsage : consumes
  User ||--o{ RefreshToken : owns
```

Destaques:

- `Lesson.content` é **JSON** e varia por tipo (`SPEAKING`, `VOCAB`, `CHAT`).
- `Message.analysis` guarda a correção estruturada daquela mensagem.
- `ReviewCard` tem índice único `(userId, front)` para evitar duplicatas.
- `AiUsage` agrega tokens por `(userId, dia, feature)` para quotas e custo.
- `LevelHistory` registra cada recalibragem com a média que a motivou.

---

## Decisões de engenharia

**Por que SM-2?** É simples, determinístico e comprovado. A função pura `sm2()` é fácil de testar e não depende de banco. Acertou fácil → intervalo cresce; errou → volta para 1 dia.

**Por que a análise roda em paralelo?** O aluno não deve esperar a IA "professora" terminar para receber a resposta. O tutor usa o modelo forte em streaming e, ao mesmo tempo, um modelo rápido analisa a mensagem. No fim, o evento `analysis` chega quase de graça em latência.

**Por que XP só na primeira vez?** Gamificação é fácil de vazar. Dar XP toda vez que alguém repete a mesma frase permitiria farmar pontos. O bônus de fala exige `score ≥ 90` e verifica se já houve um acerto ≥ 90 naquele `lessonId`.

**Por que o nível final é o menor?** Entre o autodeclarado e o testado, começar um pouco fácil é melhor do que frustrar. A recalibragem sobe o nível rápido quando o desempenho é bom.

**Streak com fuso e congelador.** O "dia" usa o fuso do aluno (com fallback seguro), e faltar exatamente um dia consome um congelador em vez de zerar. Ganha-se um congelador a cada 7 dias, com máximo de 2.

**Segurança de sessão.** Access token de 15 min fica só em memória; o refresh token é um cookie HttpOnly restrito a `/auth`, com rotação. Se um token já revogado for reapresentado, todas as sessões do usuário são derrubadas.

**Custo de IA.** Cada feature tem quota diária (`tutor`, `tip`, `plan`, `analysis`, `mission`), o consumo é registrado em `AiUsage`, e há alerta por volume de tokens.

**Validação de JSON da IA.** `AiService.json()` usa `response_format: json_object`, remove cercas de código, valida com **Zod** e tenta novamente com backoff — evitando que um JSON malformado quebre o fluxo.

---

## Testes e qualidade

```bash
# API
cd english-api
npm run lint       # oxlint
npm test           # Vitest (SM-2, LCS, streak)
npm run build      # nest build

# Web
cd english-web
npm run lint       # ESLint
npm run build      # tsc -b && vite build
```

- **15 testes unitários** cobrindo as regras puras mais críticas (SM-2, alinhamento de fala e streak).
- Testes de avaliação de IA ficam **opt-in** (`RUN_EVALS=1`) por custo e dependência de chave.
- Typecheck rigoroso nos dois projetos.

---

## CI

O workflow [`.github/workflows/ci.yml`](.github/workflows/ci.yml) roda em `push` para `main` e em pull requests:

**API**
1. sobe um Postgres 16 como service;
2. `npm ci`, `prisma generate`, `prisma migrate deploy`;
3. executa o seed (smoke test);
4. `lint`, `build` e `test`.

**Web**
1. `npm ci`;
2. `lint`;
3. `build`.

---

## Roadmap e limitações

- **Sem deploy público ainda.** O projeto roda localmente com Docker Compose; um próximo passo é publicar API + banco + front (Railway/Fly.io + Vercel/Netlify).
- **Cobertura de testes concentrada em funções puras.** Falta ampliar e2e das rotas principais e testes de componentes no front.
- **Dependência de chave paga da OpenAI** para as features de IA.
- **`@nestjs/observe`** está configurado com chaves placeholder — deve ser desativado ou configurado em produção.
- **Bull Board** usa Basic Auth com credenciais padrão de desenvolvimento; troque em produção.
- **Evolução da agregação de pontos fracos:** hoje é feita em memória sobre as últimas 100 tentativas; com volume maior, migrar para SQL (`jsonb_array_elements`) ou uma tabela `WordStat`.

---

## Screenshots

#### Abaixo a lista das telas

| Onboarding |
|---|
| ![Onboarding](docs/screenshots/onboarding.png) |

| Home |
|---|
| ![Home](docs/screenshots/home.png) |

| Tutor |
|---|
| ![Tutor](docs/screenshots/tutor.png) |

| Progress |
|---|
| ![Progress](docs/screenshots/progress.png) |

| Mission |
|---|
| ![Mission](docs/screenshots/mission.png) |

---

## Licença

Projeto privado, desenvolvido para fins de estudo e portfólio. Todos os direitos reservados.

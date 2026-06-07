# SIFU - Sistema Integrado Funcional e Unificado

Sistema de gestão da **Biblioteca UFERSA** com front-end hospedado no AWS Amplify, back-end serverless em AWS Lambda com API Gateway HTTP API v2, autenticação via Amazon Cognito e inteligência artificial com Google Gemini.

---

## O que é o Sistema

O SIFU é uma aplicação web completa para gerenciamento da Biblioteca da **Universidade Federal Rural do Semi-Árido (UFERSA)**. Ele permite o controle de salas de estudo, reservas e empréstimos, inventário de materiais, registro de ocorrências e um assistente virtual com IA.

### URLs de Produção

| Recurso | URL |
|---------|-----|
| Front-end | `https://gerenciador-salas.robsonruan.sifu1.web.ufersa.dev.br` |
| API Base | `https://api.robsonruan.sifu1.web.ufersa.dev.br` |
| Domínio Padrão API | `https://2791fnzy75.execute-api.us-east-1.amazonaws.com` |

---

## Funcionalidades

- **Gestão de Salas** — CRUD de salas de estudo com recursos, capacidade e status
- **Reservas e Empréstimos** — Agendamento de salas por alunos e servidores
- **Inventário de Materiais** — Controle de equipamentos e materiais por sala
- **Ocorrências** — Registro e acompanhamento de problemas
- **IA e Relatórios** — Assistente virtual com IA e futura geração de relatórios
- **Painel Institucional** — Dashboard com métricas e indicadores
- **Autenticação** — Login via Google ou usuário/senha (Amazon Cognito)
- **Tema Escuro** — Suporte a dark mode com acessibilidade

---

## Como Navegar

1. Acesse `https://gerenciador-salas.robsonruan.sifu1.web.ufersa.dev.br`
2. Faça login com sua conta Google (@ufersa.edu.br) ou com usuário Cognito
3. Use o menu principal para navegar entre os módulos:

| Módulo | Descrição |
|--------|-----------|
| Gestão de Salas | Cadastro e gerenciamento de salas de estudo |
| Reservas e Empréstimos | Agendamento e controle de reservas |
| IA e Relatórios | Chatbot com IA e relatórios gerenciais |
| Painel Institucional | Métricas, gráficos e indicadores |
| Inventário | Controle de materiais e equipamentos |
| Ocorrências | Registro de problemas e incidentes |
| Gerenciar Conta | Edição de perfil e foto |

4. O chatbot com IA está disponível no canto inferior direito após o login

---

## Arquitetura

```
                    ┌──────────────────────┐
                    │   AWS Amplify         │
                    │  (Front-end estático) │
                    │  gerenciador-salas... │
                    └──────────┬───────────┘
                               │ HTTPS
                               ▼
┌──────────────────────────────────────────────────┐
│           Amazon Cognito User Pool               │
│  (us-east-1_rbEMILSBU)                           │
│  • Login com Google / COGNITO                    │
│  • Emissão de JWT (id_token, access_token)       │
│  • OAuth 2.0 (authorization_code)                │
└──────────────────────┬───────────────────────────┘
                       │ JWT Bearer Token
                       ▼
┌──────────────────────────────────────────────────┐
│     API Gateway HTTP API v2 (2791fnzy75)         │
│  • Domínio customizado: api.robsonruan...        │
│  • Autorizador Cognito JWT (rota /chatbot)       │
│  • Rotas públicas: /api/salas, /api/reservas...  │
├──────────────────────────────────────────────────┤
│  POST /chatbot     → Lambda chatbot.js           │
│  GET /api/salas    → Lambda crud.js (salas)      │
│  POST /api/salas   → Lambda crud.js (salas)      │
│  PUT /api/salas/   → Lambda crud.js (salas)      │
│  DELETE /api/salas → Lambda crud.js (salas)      │
│  GET /api/reservas → Lambda crud.js (reservas)   │
│  ...outras rotas CRUD                            │
│  PUT /profile      → Lambda profile.js           │
└──────┬───────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────┐
│              AWS Lambda (Node.js 20.x)            │
│  • Código via update-function-code (manual)       │
│  • @aws-sdk v3 (disponível no runtime)            │
│  • Sem bundling necessário                        │
└──────┬───────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────┐
│           Amazon DynamoDB (Serverless)            │
│  Tabelas:                                         │
│  • UFERSA_Salas        → UUID, recursos[ ]       │
│  • UFERSA_Reservas     → UUID, sala_id           │
│  • UFERSA_Ocorrencias  → UUID                    │
│  • UFERSA_Inventario   → UUID                    │
│  • sifu-robsonruan     → profile dos usuários    │
│  • sifu-robsonruan-chat→ histórico do chat       │
└──────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────┐
│           Amazon S3 (sifu-robsonruan-2026)        │
│  • Armazenamento de fotos de perfil              │
│  • Acesso público GetObject                       │
└──────────────────────────────────────────────────┘
```

### Tecnologias

| Camada | Tecnologia |
|--------|-----------|
| Front-end | HTML5, Tailwind CSS, JavaScript Vanilla |
| Hospedagem | AWS Amplify (static site) |
| API | AWS API Gateway HTTP API v2 |
| Autenticação | Amazon Cognito (Google IdP + COGNITO) |
| Back-end | AWS Lambda (Node.js 20.x) |
| Banco de Dados | Amazon DynamoDB (NoSQL) |
| Armazenamento | Amazon S3 (fotos de perfil) |
| IA | Google Gemini API (modelos flash) |

### Fluxo de Autenticação

1. Usuário acessa o front-end e clica em "Entrar com Google"
2. Redirecionado para o Cognito Hosted UI (`auth-salas.auth.us-east-1.amazoncognito.com`)
3. Cognito redireciona para o Google para autenticação
4. Após autenticação, Google redireciona de volta ao Cognito
5. Cognito troca o código de autorização por tokens JWT (id_token, access_token)
6. Front-end armazena os tokens em `sessionStorage`
7. Requisições à API protegida enviam `Authorization: Bearer <id_token>`
8. API Gateway valida o JWT com o autorizador Cognito
9. Lambda recebe `event.requestContext.authorizer.jwt.claims` com dados do usuário

---

## Documentação da API

### Base URL

```
https://api.robsonruan.sifu1.web.ufersa.dev.br
```

Alternativa (domínio padrão API Gateway):
```
https://2791fnzy75.execute-api.us-east-1.amazonaws.com
```

### Autenticação

A maioria dos endpoints é pública. Apenas o `/chatbot` exige autenticação:

```
Authorization: Bearer SEU_TOKEN_JWT
```

> ⚠️ **Segurança**: Tokens JWT expiram em 1 hora e contêm dados do usuário. Nunca compartilhe seu token ou senha. Em produção, o fluxo de autenticação é feito pelo front-end via Cognito Hosted UI. Comandos de autenticação via CLI são apenas para testes em desenvolvimento.

### Padrão de Respostas

**Sucesso (200/201):**
```json
{
  "id": "uuid-gerado",
  "nome": "Exemplo",
  ...demais campos
}
```

**Erro (400/404/405/500):**
```json
{
  "erro": "Mensagem descritiva do erro"
}
```

### Endpoints

#### Salas — `GET /api/salas`

Lista todas as salas cadastradas.

```
GET https://api.robsonruan.sifu1.web.ufersa.dev.br/api/salas
```

**Response (200):**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "nome": "Laboratório A",
    "capacidade": 10,
    "tipo": "colaborativo",
    "recursos": ["ar condicionado", "projetor"],
    "status": "disponivel",
    "data_criacao": "2026-06-07T12:00:00.000Z"
  }
]
```

**Exemplo curl:**
```bash
curl https://api.robsonruan.sifu1.web.ufersa.dev.br/api/salas
```

---

#### Salas — `POST /api/salas`

Cria uma nova sala.

```
POST https://api.robsonruan.sifu1.web.ufersa.dev.br/api/salas
Content-Type: application/json
```

**Request:**
```json
{
  "nome": "Laboratório B",
  "capacidade": 20,
  "tipo": "estudo",
  "recursos": ["quadro branco", "tv"],
  "status": "disponivel"
}
```

**Response (201):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "nome": "Laboratório B",
  "capacidade": 20,
  "tipo": "estudo",
  "recursos": ["quadro branco", "tv"],
  "status": "disponivel",
  "data_criacao": "2026-06-07T12:00:00.000Z"
}
```

**Campos obrigatórios:** `nome`, `capacidade`, `tipo`
**Campos opcionais:** `recursos` (string separada por vírgula ou array), `status` (default: "disponivel")

**Exemplo curl:**
```bash
curl -X POST https://api.robsonruan.sifu1.web.ufersa.dev.br/api/salas \
  -H "Content-Type: application/json" \
  -d '{"nome":"Laboratório B","capacidade":20,"tipo":"estudo","recursos":["quadro branco","tv"]}'
```

---

#### Salas — `GET /api/salas/{id}`

Retorna uma sala específica pelo ID.

```
GET https://api.robsonruan.sifu1.web.ufersa.dev.br/api/salas/550e8400-e29b-41d4-a716-446655440001
```

**Response (200):** objeto completo da sala.
**Response (404):** `{"erro": "Nao encontrado"}`

---

#### Salas — `PUT /api/salas/{id}`

Atualiza parcialmente uma sala. Envie apenas os campos que deseja modificar.

```
PUT https://api.robsonruan.sifu1.web.ufersa.dev.br/api/salas/550e8400-e29b-41d4-a716-446655440001
Content-Type: application/json
```

**Request:**
```json
{
  "capacidade": 25,
  "status": "em_manutencao"
}
```

**Response (200):** objeto completo com campos atualizados + `data_atualizacao`.

---

#### Salas — `DELETE /api/salas/{id}`

Exclui uma sala.

```
DELETE https://api.robsonruan.sifu1.web.ufersa.dev.br/api/salas/550e8400-e29b-41d4-a716-446655440001
```

**Response (200):** `{"mensagem": "Excluido"}`

---

#### Reservas — `GET /api/reservas`

Lista todas as reservas.

```
GET https://api.robsonruan.sifu1.web.ufersa.dev.br/api/reservas
```

**Response (200):**
```json
[
  {
    "id": "660e8400-e29b-41d4-a716-446655440010",
    "nome": "João Silva",
    "matricula": "2023001",
    "cargo": "Estudante",
    "sala_id": "550e8400-e29b-41d4-a716-446655440001",
    "data": "2026-06-10",
    "hora_inicio": "09:00",
    "hora_fim": "11:00",
    "status": "ativo",
    "data_criacao": "2026-06-07T12:00:00.000Z"
  }
]
```

---

#### Reservas — `POST /api/reservas`

Cria uma nova reserva.

**Campos obrigatórios:** `nome`, `matricula`, `data`, `hora_inicio`, `hora_fim`
**Campos opcionais:** `cargo` (default: "Estudante"), `sala_id`, `status` (default: "ativo")

**Exemplo curl:**
```bash
curl -X POST https://api.robsonruan.sifu1.web.ufersa.dev.br/api/reservas \
  -H "Content-Type: application/json" \
  -d '{"nome":"João Silva","matricula":"2023001","cargo":"Estudante","data":"2026-06-10","hora_inicio":"09:00","hora_fim":"11:00"}'
```

`PUT /api/reservas/{id}` e `DELETE /api/reservas/{id}` seguem o mesmo padrão dos endpoints de sala.

---

#### Materiais — `GET /api/materiais`

Lista materiais do inventário.

```
GET https://api.robsonruan.sifu1.web.ufersa.dev.br/api/materiais
```

**Response (200):**
```json
[
  {
    "id": "770e8400-e29b-41d4-a716-446655440020",
    "codigo": "EQP001",
    "nome": "Notebook Dell",
    "tipo": "equipamento",
    "sala_id": "550e8400-e29b-41d4-a716-446655440001",
    "status": "disponivel",
    "data_criacao": "2026-06-07T12:00:00.000Z"
  }
]
```

---

#### Materiais — `POST /api/materiais`

Cria um novo material.

**Campos obrigatórios:** `codigo`, `nome`, `tipo`
**Campos opcionais:** `sala_id`, `status` (default: "disponivel"), `descricao`

**Exemplo curl:**
```bash
curl -X POST https://api.robsonruan.sifu1.web.ufersa.dev.br/api/materiais \
  -H "Content-Type: application/json" \
  -d '{"codigo":"EQP001","nome":"Notebook Dell","tipo":"equipamento"}'
```

`PUT /api/materiais/{id}` e `DELETE /api/materiais/{id}` seguem o mesmo padrão.

---

#### Ocorrências — `GET /api/ocorrencias`

Lista ocorrências registradas.

```
GET https://api.robsonruan.sifu1.web.ufersa.dev.br/api/ocorrencias
```

---

#### Ocorrências — `POST /api/ocorrencias`

Registra uma nova ocorrência.

**Campos obrigatórios:** `aluno_nome`, `aluno_matricula`, `descricao`
**Campo opcional:** `foto_base64` (string base64 — enviada para o S3 automaticamente)

**Exemplo curl:**
```bash
curl -X POST https://api.robsonruan.sifu1.web.ufersa.dev.br/api/ocorrencias \
  -H "Content-Type: application/json" \
  -d '{"aluno_nome":"João","aluno_matricula":"2023001","descricao":"Ar condicionado com defeito"}'
```

---

#### Chatbot — `POST /chatbot` 🔒

Envia mensagem para a IA Gemini. **Requer autenticação.**

```
POST https://api.robsonruan.sifu1.web.ufersa.dev.br/chatbot
Content-Type: application/json
Authorization: Bearer SEU_TOKEN_JWT
```

**Request:**
```json
{
  "chat": "Recomende um livro de JavaScript"
}
```

**Response (200):**
```json
{
  "message": "Olá! Recomendo o livro 'JavaScript Eloquente' de Marijn Haverbeke..."
}
```

**Response sem token (401):**
```json
{
  "message": "Unauthorized"
}
```

**Exemplo curl:**
```bash
curl -X POST https://api.robsonruan.sifu1.web.ufersa.dev.br/chatbot \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_JWT" \
  -d '{"chat":"Recomende um livro"}'
```

---

#### Profile — `GET /profile?id=`

Retorna o perfil do usuário.

```
GET https://api.robsonruan.sifu1.web.ufersa.dev.br/profile?id=SEU_USER_ID
```

**Response (200):**
```json
{
  "id": "google_103765168317649670038",
  "nome": "Robson Ruan",
  "email": "robson@ufersa.edu.br",
  "fotoUrl": "https://sifu-robsonruan-2026.s3.amazonaws.com/profile_...png"
}
```

---

#### Profile — `PUT /profile`

Atualiza o perfil do usuário (nome, email, foto).

```
PUT https://api.robsonruan.sifu1.web.ufersa.dev.br/profile
Content-Type: application/json
```

**Request:**
```json
{
  "id": "SEU_USER_ID",
  "nome": "Seu Nome",
  "email": "seu@email.com",
  "foto": "data:image/png;base64,iVBORw0KGgo..."
}
```

**Response (200):**
```json
{
  "message": "Perfil atualizado com sucesso!",
  "fotoUrl": "https://sifu-robsonruan-2026.s3.amazonaws.com/profile_...png"
}
```

---

### Resumo de Códigos HTTP

| Código | Significado |
|--------|-------------|
| 200 | Sucesso (GET, PUT, DELETE) |
| 201 | Criado com sucesso (POST) |
| 400 | Erro de validação (campos obrigatórios faltando) |
| 401 | Não autorizado (token ausente ou inválido) |
| 404 | Recurso não encontrado |
| 405 | Método não permitido |
| 500 | Erro interno do servidor |

---

## IA — Chatbot com Google Gemini

### Modelos Utilizados

O chatbot implementa um sistema de fallback automático entre 4 modelos Gemini:

| Ordem | Modelo | Descrição |
|-------|--------|-----------|
| 1º | `gemini-2.0-flash-lite` | Modelo leve, baixa latência, maior disponibilidade |
| 2º | `gemini-flash-latest` | Última versão estável do Flash |
| 3º | `gemini-2.0-flash` | Modelo flash completo |
| 4º | `gemini-1.5-pro` | Modelo Pro da geração anterior |

### Funcionamento

1. O usuário envia uma mensagem pelo widget de chat no front-end
2. O front-end faz uma requisição `POST /chatbot` com o JWT no header `Authorization`
3. O API Gateway valida o token JWT com o autorizador Cognito
4. A Lambda `chatbot.js` extrai o `userId` do claim `sub` do JWT
5. A Lambda tenta chamar a API Gemini com o primeiro modelo da lista
6. Se o modelo retornar erro de cota (429/503/high demand), tenta o próximo
7. Se todos falharem, retorna mensagem amigável ao usuário
8. A resposta da IA e a mensagem do usuário são salvas no DynamoDB (tabela `sifu-robsonruan-chat`)

### Armazenamento do Histórico

Cada interação gera dois registros no DynamoDB:

```json
// Mensagem do usuário
{
  "userId": "a4384468-80a1-7051-a36a-4f05bf5ac1cc",
  "timestamp": "2026-06-07T19:00:00.000Z_USER",
  "role": "user",
  "message": "Recomende um livro de JavaScript"
}

// Resposta da IA
{
  "userId": "a4384468-80a1-7051-a36a-4f05bf5ac1cc",
  "timestamp": "2026-06-07T19:00:00.000Z_BOT",
  "role": "bot",
  "message": "Olá! Recomendo o livro 'JavaScript Eloquente'..."
}
```

### Tratamento de Erros

- **Cota excedida**: Detecta HTTP 429/503 e mensagens "high demand" — pula para próximo modelo
- **Modelo inexistente**: Detecta "not found" ou "not supported" — pula automaticamente
- **Erro genérico**: Retorna mensagem descritiva ao usuário
- **Todos falham**: Mensagem amigável informando indisponibilidade temporária

---

## Próximos Passos — Geração de Relatórios com IA

### 1. Estruturar os Dados para Relatórios

Criar endpoints que consolidem dados de múltiplas tabelas DynamoDB:

- `GET /api/relatorios/uso-salas` — Taxa de ocupação das salas por período
- `GET /api/relatorios/reservas` — Estatísticas de reservas (por usuário, sala, mês)
- `GET /api/relatorios/inventario` — Relatório de materiais por sala e status
- `GET /api/relatorios/ocorrencias` — Incidentes por tipo, sala e período

### 2. Nova Lambda de Relatórios

Criar `src/relatorios.js` que:

1. Busque dados brutos nas tabelas DynamoDB
2. Estruture em formato adequado para análise
3. Envie para o Gemini com prompt especializado
4. Retorne relatório em linguagem natural

### 3. Interface de Relatórios no Front-end

- Página dedicada em `front-end/ia_relatorios/`
- Seletor de tipo de relatório (uso, reservas, inventário, ocorrências)
- Seletor de período (últimos 7 dias, mês, semestre, customizado)
- Visualização lado a lado: dados brutos + análise da IA
- Botão para exportar relatório em PDF

### 4. Expansão do Chatbot

- Contexto com data atual para respostas precisas sobre temporalidade
- Memória de conversa (últimas N interações)
- Comandos especiais: `/relatorio salas`, `/estatisticas`, `/ocupacao`
- Sugestões automáticas baseadas no perfil do usuário

### 5. Infraestrutura

```yaml
RelatoriosTable:
  Type: AWS::DynamoDB::Table
  Properties:
    TableName: sifu-robsonruan-relatorios
    AttributeDefinitions:
      - AttributeName: relatorioId
        AttributeType: S
    KeySchema:
      - AttributeName: relatorioId
        KeyType: HASH
    BillingMode: PAY_PER_REQUEST
```

- Nova Lambda `ufersa-biblioteca-dev-relatorios`
- Rota `GET /api/relatorios` protegida por autorizador Cognito
- Cache de relatórios gerados no DynamoDB para evitar chamadas repetidas à API Gemini

---

## Estrutura do Projeto

```
sifu-biblioteca-frontend/
├── README.md
├── CONTEXT.md              # Contexto de sessão (AWS, URLs, comandos)
├── amplify.yml             # Configuração do Amplify (raiz)
│
├── front-end/              # Interface do usuário
│   ├── index.html          # Menu principal com autenticação e chat
│   ├── amplify.yml         # Build spec do Amplify
│   ├── js/                 # Scripts do front-end
│   │   ├── api.js          # Módulo de API (ES module)
│   │   ├── auth.js         # Autenticação Cognito
│   │   ├── crud_salas.js   # CRUD de salas
│   │   ├── crud_reservas.js
│   │   ├── crud_materiais.js
│   │   ├── theme.js        # Dark mode e acessibilidade
│   │   └── user-profile.js
│   ├── gestao_salas/       # Página de gestão de salas
│   ├── reservas_emprestimos/
│   ├── inventario/
│   ├── ocorrencias/
│   ├── painel_institucional/
│   ├── ia_relatorios/      # Hub de IA e relatórios
│   ├── conta/              # Gerenciamento de perfil
│   └── data/               # Dados JSON (modo offline)
│
└── back-end/               # API e infraestrutura AWS
    ├── serverless.yml      # Infraestrutura como código
    ├── package.json        # Dependências Node.js
    ├── src/                # Handlers Lambda
    │   ├── chatbot.js      # Chatbot com Gemini IA
    │   ├── crud.js         # CRUD principal (salas, reservas, etc.)
    │   ├── profile.js      # Gerenciamento de perfil
    │   ├── common/         # Utilitários DynamoDB
    │   ├── salas/          # Handlers específicos de salas
    │   ├── reservas/
    │   ├── inventario/
    │   └── ocorrencias/
    ├── routes/             # Rotas Express (desenvolvimento local)
    └── database/           # Scripts de setup de banco
```

---

## Deploy

### Front-end (Amplify)

O front-end é deployado automaticamente via Amplify ao fazer push no branch `main` do repositório GitHub. O build spec está em `front-end/amplify.yml`.

### Back-end (Lambda)

As Lambdas são atualizadas manualmente (Serverless Framework não é usado devido a timeout):

```bash
aws lambda update-function-code \
  --function-name ufersa-biblioteca-dev-chatbot \
  --zip-file fileb://chatbot.zip \
  --region us-east-1
```

---

## Comandos Úteis

> ⚠️ **Segurança**: Os comandos abaixo são apenas para testes em desenvolvimento. Em produção, a autenticação é feita pelo front-end via Cognito Hosted UI. Nunca compartilhe tokens JWT — eles expiram em 1 hora e contêm dados do usuário.

```bash
# Testar chatbot via CLI
aws lambda invoke --function-name ufersa-biblioteca-dev-chatbot \
  --payload fileb://payload.json \
  --region us-east-1 \
  response.json

# Autenticar usuário Cognito (admin) — apenas para testes em desenvolvimento
aws cognito-idp admin-initiate-auth \
  --user-pool-id us-east-1_rbEMILSBU \
  --client-id 6kgkftt1cbk54jveeljh1h1tcs \
  --auth-flow ADMIN_USER_PASSWORD_AUTH \
  --auth-parameters USERNAME=SEU_USUARIO,PASSWORD=SUA_SENHA

# Testar API via curl com token
curl -X POST https://api.robsonruan.sifu1.web.ufersa.dev.br/chatbot \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_JWT" \
  -d '{"chat":"sua mensagem"}'
```

---

## Licença

MIT License — Projeto acadêmico da disciplina Web 2026-1.

**Autor**: Robson Ruan  
**Instituição**: UFERSA — Universidade Federal Rural do Semi-Árido

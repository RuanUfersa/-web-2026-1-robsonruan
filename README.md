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

```bash
# Testar chatbot via CLI
aws lambda invoke --function-name ufersa-biblioteca-dev-chatbot \
  --payload fileb://payload.json \
  --region us-east-1 \
  response.json

# Autenticar usuário Cognito (admin)
aws cognito-idp admin-initiate-auth \
  --user-pool-id us-east-1_rbEMILSBU \
  --client-id 6kgkftt1cbk54jveeljh1h1tcs \
  --auth-flow ADMIN_USER_PASSWORD_AUTH \
  --auth-parameters USERNAME=robson,PASSWORD=Senha123!

# Testar API via curl com token
curl -X POST https://api.robsonruan.sifu1.web.ufersa.dev.br/chatbot \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <id_token>" \
  -d '{"chat":"sua mensagem"}'
```

---

## Licença

MIT License — Projeto acadêmico da disciplina Web 2026-1.

**Autor**: Robson Ruan  
**Instituição**: UFERSA — Universidade Federal Rural do Semi-Árido

# SIFU - Sistema Integrado Funcional e Unificado

Sistema de gestão da Biblioteca UFERSA com front-end e back-end separados.

## Visão Geral

O SIFU é uma aplicação web completa para gerenciamento de salas, reservas, inventário de materiais e ocorrências da Biblioteca da UFERSA (Universidade Federal Rural do Semi-Árido).

### Funcionalidades

- **Gestão de Salas**: Criar, listar, atualizar e excluir salas de estudo
- **Reservas e Empréstimos**: Agendamento de salas por usuários
- **Inventário de Materiais**: Controle de equipamentos e materiais por sala
- **Ocorrências**: Registro e acompanhamento de problemas
- **Hub de IA e Relatórios**: Análises e insights baseados em inteligência artificial
- **Painel Institucional**: Dashboard com métricas e indicadores

### Tecnologias

- **Front-end**: HTML5, Tailwind CSS, JavaScript Vanilla
- **Back-end**: Node.js, Express, SQLite (desenvolvimento) / DynamoDB (produção)
- **Infraestrutura**: AWS Lambda, Serverless Framework, AWS Amplify

---

## Estrutura do Projeto

```
projeto/
├── front-end/           # Interface do usuário (HTML, CSS, JS estático)
│   ├── index.html       # Menu principal
│   ├── gestao_salas/    # Página de gestão de salas
│   ├── reservas_emprestimos/  # Página de reservas
│   ├── inventario/      # Página de inventário
│   ├── ocorrencias/     # Página de ocorrências
│   ├── painel_institucional/  # Dashboard institucional
│   ├── ia_relatorios/   # Hub de IA e relatórios
│   ├── js/              # Scripts JavaScript
│   ├── data/            # Dados JSON (banco local)
│   └── amplify.yml      # Configuração AWS Amplify
│
└── back-end/            # API e lógica do servidor (Node.js)
    ├── server.js        # Servidor Express principal
    ├── routes/          # Rotas da API REST
    ├── src/             # Handlers Serverless (AWS Lambda)
    │   ├── salas/       # CRUD de salas
    │   ├── reservas/    # CRUD de reservas
    │   ├── inventario/  # CRUD de materiais
    │   └── ocorrencias/ # CRUD de ocorrências
    ├── database/        # Scripts de banco de dados
    ├── package.json     # Dependências Node.js
    └── serverless.yml   # Configuração Serverless Framework
```

---

## Como Executar o Projeto

O SIFU pode ser executado de várias formas, dependendo da necessidade:

### 1. Front-end Estático (Modo Offline)

O front-end pode funcionar de forma totalmente autônoma usando arquivos JSON como "banco de dados" local.

**Pré-requisitos**: Nenhum (apenas um navegador web)

**Execução**:
- Abra o arquivo `front-end/index.html` diretamente no navegador
- Ou utilize um servidor estático simples:
  ```bash
  # Usando Python
  cd front-end
  python -m http.server 8080

  # Ou usando Node.js
  npx serve .
  ```

**URL**: http://localhost:8080

> ⚠️ **Nota**: Este modo usa os arquivos JSON em `front-end/data/` como banco de dados. As alterações são perdidas ao atualizar a página.

---

### 2. Servidor Express Local (com SQLite)

Esta é a forma mais simples de executar o back-end completo com banco de dados local.

**Pré-requisitos**:
- Node.js (v18+)
- npm

**Execução**:
```bash
cd back-end

# Instalar dependências
npm install

# Iniciar o servidor
npm run dev
```

**URL**: http://localhost:3000

**Endpoints disponíveis**:
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | /api/salas | Listar todas as salas |
| POST | /api/salas | Criar nova sala |
| GET | /api/reservas | Listar reservas |
| POST | /api/reservas | Criar reserva |
| GET | /api/materiais | Listar materiais |
| POST | /api/materiais | Criar material |
| GET | /api/ocorrencias | Listar ocorrências |
| POST | /api/ocorrencias | Criar ocorrência |

---

### 3. Serverless Offline (Simulação AWS)

Esta opção simula o ambiente AWS Lambda localmente, ideal para testar a arquitetura serverless.

**Pré-requisitos**:
- Node.js (v18+)
- npm
- Java (para DynamoDB Local)

**Execução**:
```bash
cd back-end

# Instalar dependências
npm install

# Iniciar com serverless offline
npm run offline
```

**URLs**:
- API: http://localhost:3000
- Dashboard Serverless: http://localhost:3002

---

### 4. Serverless Offline com DynamoDB Local

Simula completamente a infraestrutura AWS localmente.

**Pré-requisitos**:
- Node.js (v18+)
- npm
- Java (obrigatório para DynamoDB Local)

**Execução**:
```bash
cd back-end

# Instalar dependências
npm install

# Iniciar DynamoDB local e serverless
npm run dev:offline
```

**URLs**:
- API: http://localhost:3000
- DynamoDB Local: http://localhost:8000

---

### 5. Deploy na AWS (Produção)

Para deploy real na nuvem AWS.

**Pré-requisitos**:
- Conta AWS configurada
- AWS CLI instalado e configurado
- Credenciais AWS com permissões para Lambda, API Gateway e DynamoDB

**Execução**:
```bash
cd back-end

# Fazer deploy para AWS
npx serverless deploy
```

**Endpoints**: Os endpoints serão criados automaticamente na AWS e exibidos no console após o deploy.

---

### 6. Front-end no AWS Amplify (Hospedagem)

O front-end pode ser hospedado gratuitamente no AWS Amplify.

**Passos**:
1. Acesse o [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
2. Crie um novo app conectando seu repositório GitHub
3. Selecione o branch `main`
4. Configure o base directory como `front-end`
5. O Amplify detectará o `amplify.yml` automaticamente
6. Faça o deploy

**URL**: `https://seu-dominio.sifu1.web.ufersa.dev.br`

---

## Configuração de Variáveis de Ambiente

Para o ambiente de produção AWS, configure as seguintes variáveis:

```env
# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=sua_chave
AWS_SECRET_ACCESS_KEY=sua_secreta

# DynamoDB
DYNAMODB_TABLE=sifu-biblioteca

# CORS
CORS_ORIGIN=https://seu-dominio.com
```

---

## Scripts Disponíveis

### Back-end (back-end/package.json)

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Inicia o servidor Express local |
| `npm run offline` | Inicia Serverless Offline |
| `npm run dev:offline` | Inicia Serverless + DynamoDB Local |

### Front-end (front-end/package.json)

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Compila Tailwind CSS em modo watch |
| `npm run build` | Compila Tailwind CSS minificado |

---

## Integração Front-end e Back-end

Para conectar o front-end ao back-end local:

1. Edite o arquivo `front-end/js/api.js`
2. Altere a variável `API_BASE_URL` para:
   ```javascript
   const API_BASE_URL = 'http://localhost:3000/api';
   ```

Para ambiente de produção (AWS):
```javascript
const API_BASE_URL = 'https://sua-api-aws.execute-api.us-east-1.amazonaws.com/prod/api';
```

---

## Estrutura de Dados

### Salas
```json
{
  "id": 1,
  "nome": "Laboratório A",
  "capacidade": 10,
  "tipo": "colaborativo",
  "recursos": ["ar condicionado", "projetor"],
  "status": "disponivel"
}
```

### Reservas
```json
{
  "id": 1,
  "sala_id": 1,
  "usuario_nome": "João Silva",
  "usuario_matricula": "2023001",
  "data_reserva": "2026-05-01",
  "hora_inicio": "09:00",
  "hora_fim": "11:00",
  "status": "ativo"
}
```

---

## Contribuição

1. Fork o repositório
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Crie um Pull Request

---

## Licença

MIT License

---

## Contato

Para dúvidas ou sugestões, entre em contato com a equipe de desenvolvimento.

**Professor**: Robson Ruan  
**Disciplina**: Web 2026-1  
**Instituição**: UFERSA - Universidade Federal Rural do Semi-Árido
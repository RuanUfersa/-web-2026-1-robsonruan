# SIFU - Back-end

API do Sistema Integrado Funcional e Unificado da Biblioteca UFERSA.

## Estrutura

```
back-end/
├── server.js             # Servidor Node.js
├── routes/              # Rotas da API
├── src/               # Handlers Serverless
├── database/           # Scripts de banco de dados
├── package.json         # Dependências Node.js
└── serverless.yml     # Configuração Serverless
```

## API Endpoints

| Método | Endpoint | Descrição |
|--------|----------|----------|
| GET/POST | /api/salas | Gestión de Salas |
| GET/POST | /api/reservas | Reservas e Empréstimos |
| GET/POST | /api/materiais | Inventário |
| CRUD | /api/ocorrencias | Ocorrências |

## Execução

```bash
npm install
npm run dev
```

O servidor estará disponível em http://localhost:3000
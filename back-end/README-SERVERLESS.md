# SIFU - Serverless Local

Este projeto está configurado para rodar localmente com DynamoDB local usando Serverless Framework.

## Pré-requisitos

1. Node.js instalado
2. Java JDK (necessário para DynamoDB Local)

## Instalação

```bash
cd back-end
npm install
```

## Rodar Localmente

### Opção 1: Serverless Offline com DynamoDB Local

```bash
npm run dev:offline
```

Isso inicia:
- DynamoDB Local na porta 8000
- Serverless Offline na porta 3000

### Opção 2: Apenas Serverless Offline (sem DynamoDB)

```bash
npm run offline
```

## URLs Locais

- API: http://localhost:3000
- DynamoDB Local: http://localhost:8000

## Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET/POST | /api/salas | Gestão de Salas |
| GET/POST | /api/reservas | Reservas e Empréstimos |
| GET/POST | /api/materiais | Inventário |
| GET/POST | /api/ocorrencias | Ocorrências |

## Observações

- O front-end deve ser servido separadamente ou via S3
- O DynamoDB local armazena dados em memória (não persiste)
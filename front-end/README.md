# SIFU - Front-end

Interface do Sistema Integrado Funcional e Unificado da Biblioteca UFERSA.

## Estrutura

```
front-end/
├── gestao_salas/          # Gestão de Salas
├── reservas_emprestimos/   # Reservas e Empréstimos
├── inventario/           # Inventário de Materiais
├── ocorrencias/          # Ocorrências
├── painel_institucional/  # Painel Institucional
├── ia_relatorios/        # Hub de IA e Relatórios
├── js/                # Scripts JavaScript
└── test-api.html        # Teste de API
```

## API

O front-end se comunica com a API do back-end via fetch('/api/*').

## Execução

O back-end deve estar rodando para que o front-end funcione corretamente.

```bash
cd ../back-end
npm run dev
```
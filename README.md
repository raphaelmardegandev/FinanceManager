
# FinanceManager

O FinanceManager é uma aplicação web de gestão financeira pessoal desenvolvida com **ASP.NET Core 8** e **JavaScript**.

O projeto permite gerenciar contas, categorias, receitas e despesas, acompanhar indicadores financeiros por meio de um dashboard e gerar relatórios em CSV e PDF.

## Funcionalidades

O sistema possui cinco módulos principais:

| Módulo | Descrição |
| --- | --- |
| Contas | Cadastro e gerenciamento de contas financeiras. |
| Categorias | Cadastro de categorias de receitas e despesas. |
| Transações | Registro e gerenciamento de movimentações financeiras. |
| Dashboard | Visualização de indicadores, gráficos e transações recentes. |
| Relatórios | Consulta de movimentações com filtros e exportação em CSV e PDF. |

Também conta com cadastro de usuários, login e autenticação JWT.

## Tecnologias utilizadas

### Backend

- C# / .NET 8
- ASP.NET Core Web API
- Entity Framework Core
- SQLite
- JWT Bearer Authentication
- Swagger / OpenAPI
- QuestPDF

### Frontend

- HTML5
- CSS3
- JavaScript
- Chart.js
- Fetch API

## Estrutura do projeto

```text
FinanceManagerStarter/
├── FinanceManager.API/
│   ├── Controllers/
│   ├── Data/
│   ├── DTOs/
│   ├── Migrations/
│   ├── Models/
│   ├── Services/
│   ├── wwwroot/
│   │   ├── css/
│   │   ├── js/
│   │   ├── index.html
│   │   ├── accounts.html
│   │   ├── categories.html
│   │   ├── transactions.html
│   │   ├── reports.html
│   │   ├── login.html
│   │   └── register.html
│   └── FinanceManager.API.csproj
└── README.md
```

## Pré-requisitos

Para executar o projeto localmente, é necessário:

- [.NET SDK 8](https://dotnet.microsoft.com/download/dotnet/8.0)
- Git
- Visual Studio Code ou outro editor de sua preferência

O banco de dados utilizado é o SQLite, portanto não é necessário instalar um servidor de banco de dados.

## Como executar o projeto

### 1. Clonar o repositório

```bash
git clone https://github.com/raphaelmardegandev/FinanceManager.git
cd FinanceManager
```

### 2. Restaurar as dependências

```bash
dotnet restore FinanceManager.API/FinanceManager.API.csproj
```

### 3. Configurar o ambiente

O FinanceManager utiliza SQLite como banco de dados e JWT para autenticação.

A conexão com o SQLite já está configurada no arquivo `appsettings.json`. A chave JWT deve ser configurada localmente utilizando o **.NET User Secrets**, sem armazená-la no repositório.

**Gerar uma chave JWT segura**

No PowerShell, execute:

```powershell
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$bytes = New-Object byte[] 64
$rng.GetBytes($bytes)
$jwtKey = [Convert]::ToBase64String($bytes)
```

**Armazenar a chave no User Secrets**

Na raiz do projeto, execute:

```powershell
dotnet user-secrets set "Jwt:Key" "$jwtKey" --project FinanceManager.API/FinanceManager.API.csproj
```

**Limpar as variáveis temporárias**

```powershell
$rng.Dispose()
Remove-Variable rng, bytes, jwtKey
```

O identificador do User Secrets já está configurado no arquivo `FinanceManager.API.csproj`.

**Importante:**

- Nunca armazene a chave JWT em arquivos versionados.
- Cada desenvolvedor deve gerar sua própria chave.
- O User Secrets é destinado ao desenvolvimento local.
- Em produção, utilize variáveis de ambiente protegidas ou um gerenciador de segredos.

### 4. Executar a aplicação

No PowerShell, execute:

```powershell
$env:ASPNETCORE_ENVIRONMENT = "Development"
$env:DOTNET_ENVIRONMENT = "Development"

dotnet run --project FinanceManager.API/FinanceManager.API.csproj
```

Após iniciar, abra no navegador o endereço informado no terminal.

A aplicação também disponibiliza o Swagger em `/swagger` no ambiente de desenvolvimento.

As migrações do Entity Framework Core são aplicadas na inicialização, conforme a configuração atual do projeto.

## Como utilizar

1. Acesse a página de cadastro e crie um usuário.
2. Faça login no sistema.
3. Cadastre suas contas financeiras.
4. Crie categorias para organizar receitas e despesas.
5. Registre suas movimentações financeiras.
6. Acompanhe os resultados no Dashboard.
7. Utilize o módulo Relatórios para consultar e exportar os dados.

## API

A aplicação possui uma API REST para comunicação entre o frontend e o backend.

### Principais endpoints

| Método | Endpoint | Descrição |
| --- | --- | --- |
| POST | `/api/auth/register` | Cadastro de usuário |
| POST | `/api/auth/login` | Autenticação |
| GET | `/api/accounts` | Consulta de contas |
| GET | `/api/categories` | Consulta de categorias |
| GET | `/api/transactions` | Consulta de transações |
| GET | `/api/dashboard` | Indicadores financeiros |
| GET | `/api/reports` | Consulta de relatórios |
| GET | `/api/reports/pdf` | Exportação de relatório em PDF |

Os endpoints de negócio utilizam autenticação JWT.

O token deve ser enviado no cabeçalho HTTP:

```http
Authorization: Bearer SEU_TOKEN
```

## Relatórios financeiros

O módulo de relatórios permite consultar movimentações utilizando os seguintes filtros:

- Data inicial e final
- Tipo de transação
- Conta financeira
- Categoria

O resultado apresenta:

- Total de receitas
- Total de despesas
- Saldo do período
- Quantidade de transações
- Lista de movimentações financeiras

### Exportação CSV

Permite exportar as movimentações para um arquivo CSV, que pode ser aberto em ferramentas como Microsoft Excel.

### Exportação PDF

Permite gerar um relatório financeiro em PDF contendo:

- Período consultado
- Resumo de receitas, despesas e saldo
- Movimentações financeiras
- Paginação automática

A geração do PDF é realizada no backend utilizando QuestPDF.

### Exemplo de consulta

```http
GET /api/reports?startDate=2026-09-01&endDate=2026-09-30
```

### Exemplo de exportação PDF

```http
GET /api/reports/pdf?startDate=2026-09-01&endDate=2026-09-30
```

## Segurança

A aplicação utiliza autenticação JWT para proteger os endpoints de negócio.

O projeto ainda está em desenvolvimento. Antes de disponibilizá-lo para uso com dados financeiros reais de diferentes usuários, é necessário implementar e validar o isolamento de dados por usuário, revisar as regras de autorização e configurar adequadamente o gerenciamento de segredos.

## Melhorias futuras

- Isolamento de dados por usuário
- Testes automatizados
- Melhorias na responsividade para dispositivos móveis
- Aprimoramento das validações e tratamento de erros
- Possibilidade de disponibilizar uma versão instalável (PWA)

## Status do projeto

Os cinco módulos principais estão implementados:

- Contas
- Categorias
- Transações
- Dashboard
- Relatórios

O projeto permanece em evolução, com foco em melhorias de segurança, qualidade de código e experiência do usuário.

## Licença

A licença do código-fonte ainda não foi definida.

As bibliotecas utilizadas seguem suas respectivas licenças, incluindo as condições de uso do QuestPDF.

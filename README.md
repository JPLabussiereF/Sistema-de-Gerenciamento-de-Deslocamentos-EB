# Sistema de Gerenciamento de Deslocamentos - Elétrica Bahiana

![Logo da Elétrica Bahiana](/frontend/images/logo.png)

## Sobre o Projeto

O Sistema de Gerenciamento de Deslocamentos da Elétrica Bahiana foi desenvolvido para facilitar o trabalho de vendedores externos, permitindo o registro eficiente de visitas aos seus respectivos clientes. Os dados coletados são armazenados em um banco de dados dedicado e servirão de base para análises futuras no Power BI.

### Funcionalidades Principais

- **Registro de Deslocamentos**: Permite aos vendedores registrar suas visitas, incluindo origem, destino, cliente, quilometragem e tipo de ação.
- **Gerenciamento de Clientes**: Interface administrativa para atribuir vendedores a clientes específicos.
- **Importação de Dados**: Possibilidade de importar listas de clientes através de arquivos CSV.
- **Autenticação de Usuários**: Sistema de login seguro com diferentes níveis de acesso (administrador e vendedor).
- **Responsividade**: Interface adaptável a dispositivos móveis, permitindo o registro em campo.

## Tecnologias Utilizadas

### Frontend
- HTML5
- CSS3
- JavaScript (ES6+)

### Backend
- Node.js
- Express.js

### Banco de Dados
- MySQL (via XAMPP)

## Estrutura do Projeto

### Frontend

```
frontend/
├── images/
│   └── logo.png
├── scripts/
│   ├── login.js            # Script de autenticação 
│   ├── deslocamento.js     # Script de registro de deslocamentos
│   └── gerenciamento-clientes.js  # Script de gerenciamento de clientes
├── styles/
│   ├── common.css          # Estilos compartilhados entre páginas
│   ├── login.css           # Estilos específicos para a página de login
│   ├── deslocamento.css    # Estilos específicos para a página de deslocamentos
│   └── gerenciamento-clientes.css # Estilos para a interface administrativa
└── pages/
    ├── login.html          # Página de autenticação
    ├── deslocamento.html   # Interface para registrar deslocamentos
    └── gerenciamento-clientes.html # Interface administrativa
```

### Backend

```
backend/
├── db.js                 # Configuração de conexão com banco de dados MySQL
├── server.js             # Ponto de entrada da aplicação Express
├── updatePasswordHash.js # Script para atualizar senhas com hash
├── utils/
│   └── passwordUtils.js  # Utilitário para hash e verificação de senhas
├── routes/
│   ├── auth.js           # Rotas de autenticação
│   ├── clientes.js       # Rotas para gerenciamento de clientes
│   ├── deslocamentos.js  # Rotas para registro de deslocamentos
│   └── autocomplete.js   # Rotas para busca e autocompletar campos
```

## Instalação e Configuração

### Pré-requisitos

- Node.js (v14.0.0 ou superior)
- XAMPP ou similar (para MySQL)
- Navegador moderno (Chrome, Firefox, Edge)

### Configuração do Banco de Dados

1. Inicie o XAMPP e certifique-se de que os serviços MySQL e Apache estão ativos
2. Acesse o [phpMyAdmin](http://localhost/phpmyadmin) - http://localhost/phpmyadmin
3. Crie um banco de dados chamado `eletrica_bahiana`
4. Utilize o script SQL abaixo para criar as tabelas necessárias

```sql
-- Estrutura da tabela `usuario`
CREATE TABLE `usuario` (
  `id_usuario` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `cpf` varchar(14) NOT NULL,
  `senha` varchar(255) NOT NULL,
  `funcao` enum('adm','vendedor') NOT NULL,
  PRIMARY KEY (`id_usuario`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `cpf` (`cpf`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Estrutura da tabela `cliente`
CREATE TABLE `cliente` (
  `id_cliente` int(11) NOT NULL AUTO_INCREMENT,
  `cod_cliente` varchar(20) DEFAULT NULL,
  `nome_cliente` varchar(100) NOT NULL,
  `cnpj` varchar(18) DEFAULT NULL,
  `logradouro` varchar(100) DEFAULT NULL,
  `numero` varchar(10) DEFAULT NULL,
  `complemento` varchar(50) DEFAULT NULL,
  `bairro` varchar(50) DEFAULT NULL,
  `cep` varchar(10) DEFAULT NULL,
  `cidade` varchar(50) DEFAULT NULL,
  `estado` varchar(2) DEFAULT NULL,
  `id_usuario` int(11) DEFAULT NULL,
  PRIMARY KEY (`id_cliente`),
  KEY `id_usuario` (`id_usuario`),
  FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Estrutura da tabela `formulario_deslocamento`
CREATE TABLE `formulario_deslocamento` (
  `id_formulario` int(11) NOT NULL AUTO_INCREMENT,
  `id_usuario` int(11) NOT NULL,
  `id_cliente` int(11) DEFAULT NULL,
  `cod_cliente` varchar(20) DEFAULT NULL,
  `origem` varchar(100) NOT NULL,
  `destino` varchar(100) NOT NULL,
  `km_inicio` decimal(10,1) NOT NULL,
  `km_final` decimal(10,1) NOT NULL,
  `distancia` decimal(10,1) GENERATED ALWAYS AS (km_final - km_inicio) STORED,
  `acao_trajeto` enum('visita','casa','eb','almoco') NOT NULL,
  `data_hora_registrado` datetime NOT NULL,
  PRIMARY KEY (`id_formulario`),
  KEY `id_usuario` (`id_usuario`),
  KEY `id_cliente` (`id_cliente`),
  FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`),
  FOREIGN KEY (`id_cliente`) REFERENCES `cliente` (`id_cliente`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

5. Insira um usuário administrador inicial para acessar o sistema:

```sql
INSERT INTO `usuario` (`nome`, `email`, `cpf`, `senha`, `funcao`) 
VALUES ('Administrador', 'admin@eletricabahiana.com.br', '000.000.000-00', 'senhaadmin', 'adm');
```

6. Execute o script de atualização de hash para proteger as senhas:

```bash
node backend/updatePasswordHash.js
```

### Instalação do Backend

```bash
# Navegar até a pasta do backend
cd backend

# Instalar dependências
npm install express mysql2 bcrypt cors body-parser

# Iniciar servidor
node server.js
```

### Configuração do Frontend

1. Certifique-se de que as referências de arquivos nos HTMLs estão apontando para os locais corretos.

2. Você pode servir os arquivos de frontend de duas maneiras:

   a. **Diretamente do filesystem**: Abra os arquivos HTML diretamente no navegador (método mais rápido para desenvolvimento).
   
   b. **Usando um servidor web**: Configure o Apache, Nginx, ou outro servidor web para servir os arquivos estáticos.

## Segurança

### Autenticação e Autorização

- Senhas armazenadas com hash bcrypt (módulo nativo do Node.js)
- Verificação de autorização para rotas administrativas
- Proteção contra acesso não autorizado às APIs
- Separação clara de permissões entre administradores e vendedores

### Estrutura do Banco

- Relações entre tabelas garantidas por chaves estrangeiras
- Armazenamento de identificadores de cliente mesmo quando o cliente é removido
- Campo de distância calculado automaticamente como coluna virtual no MySQL

### Validações

- Verificação de limites diários para evitar submissão excessiva de dados
- Validações de negócio (ex: km final > km inicial)
- Verificação de relações lógicas (ex: se cliente=X, destino deve ser X)
- Sanitização de dados de importação CSV

## Manutenção

### Gerenciamento de Usuários

Como o sistema não inclui interface para cadastro de usuários, novos vendedores ou administradores devem ser adicionados diretamente no banco de dados:

```sql
-- Adicionar um novo vendedor
INSERT INTO usuario (nome, email, cpf, senha, funcao) 
VALUES ('Nome do Vendedor', 'vendedor@eletricabahiana.com.br', '123.456.789-00', 'senha123', 'vendedor');

-- Adicionar um novo administrador
INSERT INTO usuario (nome, email, cpf, senha, funcao) 
VALUES ('Nome do Admin', 'admin2@eletricabahiana.com.br', '987.654.321-00', 'senha123', 'adm');
```

Após inserir novos usuários, execute o script de atualização de senha para garantir o armazenamento seguro:

```bash
node backend/scripts/updatePasswordHash.js
```

### Backup do Banco de Dados

Recomenda-se realizar backups regulares do banco de dados:

```bash
# Usando mysqldump (no terminal)
mysqldump -u root -p eletrica_bahiana > backup_eletrica_bahiana_$(date +%Y%m%d).sql
```

## Integração com Power BI

Os dados coletados pelo sistema são projetados para análise posterior no Power BI. Recomendações para integração:

1. **Conexão com o Banco**: Configure uma conexão direta no Power BI com o banco MySQL
2. **Principais Métricas para Análise**:
   - Total de deslocamentos por vendedor
   - Distância total percorrida por período
   - Clientes mais visitados
   - Distribuição geográfica das visitas (utilizando cidade/estado)
   - Tempo médio entre visitas por cliente
   - Eficiência de deslocamento (distância vs. número de clientes visitados)

## Contribuição e Suporte

### Solução de Problemas Comuns

- **Erro de conexão com banco**: Verifique se o XAMPP está rodando e se as credenciais em `db.js` estão corretas
- **Erro de login**: Execute `updatePasswordHash.js` para garantir que as senhas estão no formato correto
- **Problemas com autofill**: Ajuste o CSS para os campos de formulário conforme exemplos em `login.css`
- **Erros de importação CSV**: Verifique a formatação do arquivo, especialmente delimitadores e codificação

### Contato

Para suporte ou informações adicionais, entre em contato com [João Pedro Labussiere](https://www.linkedin.com/in/joaolabussiere/)

## Recursos Adicionais

### Sistema de Autenticação

O sistema utiliza autenticação baseada em credenciais (CPF ou e-mail + senha) com as seguintes características:

- Armazenamento seguro de senhas utilizando bcrypt
- Verificação de permissões baseada em função (administrador ou vendedor)
- Sessão de usuário armazenada no localStorage do navegador

### Limite Diário de Registros

Para evitar duplicações ou registros excessivos, cada vendedor possui um limite configurável de formulários que pode enviar por dia (padrão: 50).

### Importação de Clientes

Os administradores podem importar listas de clientes via CSV com os seguintes campos:
- Código do cliente
- Nome do cliente
- CNPJ
- Endereço (logradouro, bairro, CEP, cidade, estado)

### Suporte a Autocompletar

A aplicação conta com mecanismos de autocompletar para facilitar a entrada de dados nos seguintes campos:
- Seleção de clientes
- Seleção de origem e destino (incluindo locais frequentes e clientes atribuídos)

### Validação de Dados

O sistema implementa validações importantes:
- Verificação de consistência entre origem, destino e cliente
- Validação de quilometragem (final sempre maior que inicial)
- Validação de coerência nas ações de trajeto (Casa, Almoço, EB, Visita)
- Verificação automática de seleções baseadas no destino

## Fluxos de Trabalho

### Para Vendedores

1. **Login no Sistema**
   - Acesse a página de login
   - Informe seu CPF ou e-mail institucional (@eletricabahiana.com.br)
   - Insira sua senha
   
2. **Registro de Deslocamento**
   - Selecione o cliente visitado (ou "Sem cliente" para deslocamentos não relacionados a clientes)
   - Informe origem e destino do deslocamento
   - Preencha data e hora do deslocamento
   - Registre quilometragem inicial e final do veículo
   - Selecione o tipo de ação do trajeto (Visita, Casa, EB, Almoço)
   - Confirme o envio do registro
   
3. **Acompanhamento de Registros**
   - Visualize contador de registros diários
   - Receba feedback sobre limite de envios
   - Consulte histórico de deslocamentos (disponível na API)

### Para Administradores

1. **Login no Sistema**
   - Acesse a página de login
   - Informe seu CPF ou e-mail institucional de administrador
   - Insira sua senha
   
2. **Gestão de Clientes**
   - Visualize a lista completa de clientes da empresa
   - Pesquise clientes por nome, código ou vendedor responsável
   - Atribua ou altere o vendedor responsável por cada cliente
   
3. **Importação de Clientes**
   - Prepare arquivo CSV com dados dos clientes (código, nome, CNPJ, endereço)
   - Acesse a opção "Importar Clientes CSV"
   - Selecione o arquivo preparado
   - Acompanhe o progresso da importação
   - Verifique o sumário com contagem de registros processados
   
4. **Análise de Dados (Integração externa)**
   - Utilize o Power BI para conectar-se ao banco de dados
   - Analise métricas de deslocamento, visitas por cliente e eficiência
   - Gere relatórios de atividade dos vendedores
   - Compare distâncias percorridas e número de visitas
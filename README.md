# Bot Vendas - SaaS para Automação de WhatsApp

## 📌 Visão Geral
Bot Vendas é um sistema SaaS que automatiza o atendimento via WhatsApp para empresas. Ele permite que os usuários cadastrem seus estoques, personalizem o fluxo de conversação do bot e gerenciem suas vendas de forma prática e automatizada.

## 🏗 Estrutura do Projeto
O projeto é dividido em três partes principais:
- **Backend (`backend/`)**: Responsável pela API e lógica de negócios.
- **Frontend (`frontend/`)**: Interface do usuário para gerenciamento do sistema.

## 🚀 Tecnologias Utilizadas
- **Backend**: Node.js, Express, MySQL/PostgreSQL
- **Frontend**: React.js/Vue.js 

## 📌 Instalação e Configuração
### 1️⃣ Clonar o Repositório
```bash
git clone https://github.com/seu-usuario/bot-vendas.git
cd bot-vendas
```

### 2️⃣ Configuração do Backend
```bash
cd backend
npm install
cp .env.example .env  # Configurar credenciais
npm start
```

### 3️⃣ Configuração do Frontend
```bash
cd frontend
npm install
npm run dev
```

### 4️⃣ Configuração do Bot
```bash
cd BotVendas
npm install
npm start
```

## 🎯 Funcionalidades
- Cadastro e gerenciamento de empresas
- Configuração do bot e fluxos de resposta
- Gestão de estoque e pedidos
- Integração com WhatsApp para atendimento automatizado

## 📌 Banco de Dados
O dump do banco de dados está disponível no arquivo `rzbotvendas.sql`. Para restaurá-lo:
```bash
mysql -u usuario -p senha < rzbotvendas.sql
```

## 🔗 Próximos Passos
- Melhorar a personalização do bot
- Implementar mais opções de pagamento
- Otimizar a interface do dashboard

## 🤝 Contribuição
Contribuições são bem-vindas! Para contribuir, siga os passos:
1. Faça um fork do repositório.
2. Crie uma branch com sua feature (`git checkout -b minha-feature`).
3. Faça commit das mudanças (`git commit -m 'Minha feature'`).
4. Faça push para a branch (`git push origin minha-feature`).
5. Abra um Pull Request.

---
**Desenvolvido por YNF ANTHONY** 🚀


# Sistema de Ordens de Serviço - Oficina Mecânica v2.0

## 📋 Descrição
Sistema web completo para gerenciamento de Ordens de Serviço em oficinas mecânicas, com suporte a múltiplos usuários, controle de custos, gerenciamento de peças/serviços e registro completo de movimentações.

## ✨ Funcionalidades

### 🔧 **Gerenciamento de OS**
- Lançamento de novas Ordens de Serviço
- Consulta e filtro por status, cliente, veículo e data
- Edição completa de OS existentes
- Exclusão de OS com confirmação
- Numeração automática sequencial
- **NOVO:** Controle de custo do serviço
- **NOVO:** Cálculo automático do valor total

### 💰 **Gestão Financeira**
- **NOVO:** Campo para custo do serviço
- **NOVO:** Adição de peças e serviços à OS
- **NOVO:** Cálculo automático do total geral
- **NOVO:** Controle de quantidade e valores unitários

### 🔍 **Gerenciamento de Peças/Serviços**
- **NOVO:** Busca inteligente de peças/serviços
- **NOVO:** Autocomplete baseado em lançamentos anteriores
- **NOVO:** Cadastro de novos produtos/serviços
- **NOVO:** Reutilização de itens já utilizados
- **NOVO:** Tabela detalhada de itens por OS

### 👥 **Sistema de Usuários**
- Autenticação com login/senha
- Múltiplos perfis: Operador, Supervisor, Administrador
- Cadastro e gerenciamento de usuários (apenas admins)
- Controle de acesso baseado em perfis

### 📊 **Dashboard e Relatórios**
- Estatísticas em tempo real
- Histórico completo de cada OS
- Timeline de movimentações
- **NOVO:** Valores financeiros nas estatísticas

### 📝 **Registro de Movimentações**
- Todas as ações são registradas automaticamente
- Log com data/hora, usuário e detalhes
- **NOVO:** Registro de alterações de valores
- Histórico salvo em arquivo TXT (simulado via LocalStorage)

### 🎨 **Interface Moderna**
- Design responsivo com Bootstrap 5
- Ícones Bootstrap Icons
- Animações e transições suaves
- **NOVO:** Modais para gerenciamento de produtos
- **NOVO:** Interface intuitiva para busca de peças

## 🚀 Como Usar

### Primeiro Acesso
1. Abra o arquivo `index.html` no navegador
2. Faça login com: usuário `admin` e senha `admin`

### Lançamento de OS
1. Acesse a aba "Lançar OS"
2. Preencha os dados do cliente e veículo
3. **NOVO:** Defina o custo do serviço
4. **NOVO:** Busque e adicione peças/serviços necessários
5. **NOVO:** Visualize o total calculado automaticamente
6. Clique em "Lançar OS"

### Gerenciamento de Peças/Serviços
1. **Buscar Peças:** Digite no campo de busca para encontrar itens
2. **Novo Produto:** Clique em "Novo Produto" para cadastrar
3. **Adicionar à OS:** Selecione quantidade e confirme
4. **Remover Item:** Use o botão de lixeira na tabela

### Consulta de OS
1. Acesse a aba "Consultar OS"
2. Use os filtros para encontrar OS específicas
3. Visualize valores e peças utilizadas
4. Edite ou exclua conforme necessário

## 📁 Estrutura de Arquivos

```
os_mecanica/
├── index.html              # Página principal
├── css/
│   └── style.css           # Estilos personalizados
├── js/
│   └── script.js           # Lógica do sistema (atualizada)
├── data/
│   ├── os.json             # Dados das OS (com custos)
│   ├── produtos_servicos.json  # NOVO: Base de produtos/serviços
│   └── movimentacoes.txt   # Log de movimentações
└── README.md               # Esta documentação
```

## 🔧 Tecnologias Utilizadas
- HTML5
- CSS3 + Bootstrap 5
- JavaScript (ES6+)
- LocalStorage para persistência
- Bootstrap Icons

## 💾 Armazenamento de Dados
- **Ordens de Serviço:** LocalStorage (`ordemServicos`)
- **Usuários:** LocalStorage (`usuarios`)
- **Produtos/Serviços:** LocalStorage (`produtosServicos`) - NOVO
- **Movimentações:** Simulado via LocalStorage

## 🆕 Novidades da Versão 2.0

### Gestão Financeira Completa
- Controle de custo do serviço
- Adição de peças e serviços
- Cálculo automático de totais
- Histórico de valores

### Sistema de Produtos/Serviços
- Base de dados de produtos
- Busca inteligente com autocomplete
- Reutilização de itens anteriores
- Cadastro rápido de novos produtos

### Interface Aprimorada
- Modais para melhor experiência
- Tabelas detalhadas de itens
- Campos de busca responsivos
- Cálculos em tempo real

## 🔐 Usuários Padrão
- **Administrador:** admin / admin
- **Operador:** operador / 123456
- **Supervisor:** supervisor / 123456

## 📞 Suporte
Sistema desenvolvido para oficinas mecânicas com foco em simplicidade e eficiência. Todas as funcionalidades foram testadas e validadas.

---
**Versão:** 2.0  
**Data:** Janeiro 2025  
**Desenvolvido com:** HTML, CSS, JavaScript e Bootstrap


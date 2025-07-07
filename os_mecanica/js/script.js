// Sistema de OS - Oficina Mecânica
// Variáveis globais
let ordemServicos = [];
let usuarios = [];
let produtosServicos = [];
let usuarioLogado = null;
let proximoNumeroOS = 1;
let proximoIdProduto = 1;
let pecasOSAtual = [];

// Inicialização do sistema
document.addEventListener('DOMContentLoaded', function() {
    carregarDados();
    verificarLogin();
    configurarEventos();
    configurarEventosPecas();
    atualizarEstatisticas();
});

// Configurar eventos dos formulários
function configurarEventos() {
    // Formulário de OS
    document.getElementById('osForm').addEventListener('submit', function(e) {
        e.preventDefault();
        adicionarOS();
    });

    // Formulário de login
    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        realizarLogin();
    });

    // Formulário de usuário
    document.getElementById('usuarioForm').addEventListener('submit', function(e) {
        e.preventDefault();
        adicionarUsuario();
    });

    // Formulário de edição de OS
    document.getElementById('editarOSForm').addEventListener('submit', function(e) {
        e.preventDefault();
        salvarEdicaoOS();
    });
}

// Verificar se há usuário logado
function verificarLogin() {
    const usuarioSalvo = localStorage.getItem('usuarioLogado');
    if (usuarioSalvo) {
        usuarioLogado = JSON.parse(usuarioSalvo);
        document.getElementById('nomeUsuario').textContent = usuarioLogado.nome;
        document.getElementById('loginModal').style.display = 'none';
    } else {
        // Mostrar modal de login
        const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
        loginModal.show();
    }
}

// Realizar login
function realizarLogin() {
    const usuario = document.getElementById('loginUsuario').value;
    const senha = document.getElementById('loginSenha').value;

    // Verificar credenciais
    const usuarioEncontrado = usuarios.find(u => u.nome === usuario && u.senha === senha);
    
    if (usuarioEncontrado || (usuario === 'admin' && senha === 'admin')) {
        usuarioLogado = usuarioEncontrado || { nome: 'admin', perfil: 'admin' };
        localStorage.setItem('usuarioLogado', JSON.stringify(usuarioLogado));
        document.getElementById('nomeUsuario').textContent = usuarioLogado.nome;
        
        // Fechar modal
        const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
        loginModal.hide();
        
        mostrarAlerta('Login realizado com sucesso!', 'success');
    } else {
        mostrarAlerta('Usuário ou senha incorretos!', 'danger');
    }
}

// Logout
function logout() {
    usuarioLogado = null;
    localStorage.removeItem('usuarioLogado');
    document.getElementById('nomeUsuario').textContent = '-';
    
    // Mostrar modal de login
    const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
    loginModal.show();
    
    mostrarAlerta('Logout realizado com sucesso!', 'info');
}

// Carregar dados do localStorage
function carregarDados() {
    const osSalvas = localStorage.getItem('ordemServicos');
    if (osSalvas) {
        ordemServicos = JSON.parse(osSalvas);
        proximoNumeroOS = Math.max(...ordemServicos.map(os => os.numero), 0) + 1;
    }

    const usuariosSalvos = localStorage.getItem('usuarios');
    if (usuariosSalvos) {
        usuarios = JSON.parse(usuariosSalvos);
    }

    const produtosSalvos = localStorage.getItem('produtosServicos');
    if (produtosSalvos) {
        produtosServicos = JSON.parse(produtosSalvos);
        proximoIdProduto = Math.max(...produtosServicos.map(p => p.id), 0) + 1;
    }

    carregarOS();
    carregarUsuarios();
}

// Salvar dados no localStorage
function salvarDados() {
    localStorage.setItem('ordemServicos', JSON.stringify(ordemServicos));
    localStorage.setItem('usuarios', JSON.stringify(usuarios));
    localStorage.setItem('produtosServicos', JSON.stringify(produtosServicos));
}

// Adicionar nova OS
function adicionarOS() {
    if (!usuarioLogado) {
        mostrarAlerta('Você precisa estar logado para lançar uma OS!', 'warning');
        return;
    }

    const custoServico = parseFloat(document.getElementById('custoServico').value) || 0;
    const totalPecas = pecasOSAtual.reduce((total, peca) => total + (peca.quantidade * peca.valorUnitario), 0);
    const totalGeral = custoServico + totalPecas;

    const os = {
        numero: proximoNumeroOS++,
        cliente: document.getElementById('cliente').value,
        telefone: document.getElementById('telefone').value,
        veiculo: document.getElementById('veiculo').value,
        placa: document.getElementById('placa').value,
        problema: document.getElementById('problema').value,
        status: document.getElementById('status').value,
        prioridade: document.getElementById('prioridade').value,
        observacoes: document.getElementById('observacoes').value,
        custoServico: custoServico,
        pecasServicos: [...pecasOSAtual],
        totalGeral: totalGeral,
        dataAbertura: new Date().toISOString(),
        usuarioAbertura: usuarioLogado.nome,
        historico: [{
            data: new Date().toISOString(),
            usuario: usuarioLogado.nome,
            acao: 'Abertura da OS',
            detalhes: `Status: ${document.getElementById('status').value}, Prioridade: ${document.getElementById('prioridade').value}, Total: R$ ${totalGeral.toFixed(2)}`
        }]
    };

    ordemServicos.push(os);
    salvarDados();
    salvarMovimentacao(os, 'Abertura da OS');
    
    limparFormulario();
    carregarOS();
    atualizarEstatisticas();
    
    mostrarAlerta(`OS #${os.numero} lançada com sucesso! Total: R$ ${totalGeral.toFixed(2)}`, 'success');
}

// Limpar formulário
function limparFormulario() {
    document.getElementById('osForm').reset();
    document.getElementById('status').value = 'aberta';
    document.getElementById('prioridade').value = 'media';
    document.getElementById('custoServico').value = '0';
    document.getElementById('totalGeral').value = '0,00';
    pecasOSAtual = [];
    atualizarTabelaPecasOS();
    calcularTotalGeral();
}

// Carregar OS na tabela
function carregarOS() {
    const tbody = document.getElementById('tabelaOS');
    tbody.innerHTML = '';

    ordemServicos.forEach(os => {
        const totalGeral = os.totalGeral || 0;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>#${os.numero}</strong></td>
            <td>${formatarData(os.dataAbertura)}</td>
            <td>${os.cliente}</td>
            <td>${os.veiculo}</td>
            <td><span class="badge badge-status badge-${os.status}">${formatarStatus(os.status)}</span></td>
            <td><span class="badge badge-prioridade badge-${os.prioridade}">${formatarPrioridade(os.prioridade)}</span></td>
            <td><strong class="text-success">R$ ${totalGeral.toFixed(2)}</strong></td>
            <td>
    <button class="btn btn-sm btn-primary" onclick="editarOS(${os.numero})">
        <i class="bi bi-pencil"></i>
    </button>
    <button class="btn btn-sm btn-success" onclick="enviarPorWhatsApp(${os.numero})" title="Enviar por WhatsApp">
        <i class="bi bi-whatsapp"></i>
    </button>
    <button class="btn btn-sm btn-warning" onclick="enviarPorEmail(${os.numero})" title="Enviar por Email">
        <i class="bi bi-envelope"></i>
    </button>
    <button class="btn btn-sm btn-info" onclick="verHistorico(${os.numero})">
        <i class="bi bi-clock-history"></i>
    </button>
    <button class="btn btn-sm btn-danger" onclick="excluirOS(${os.numero})">
        <i class="bi bi-trash"></i>
    </button>
</td>
        `;
        tbody.appendChild(tr);
    });
}

// Filtrar OS
function filtrarOS() {
    const filtroStatus = document.getElementById('filtroStatus').value;
    const filtroCliente = document.getElementById('filtroCliente').value.toLowerCase();
    const filtroVeiculo = document.getElementById('filtroVeiculo').value.toLowerCase();
    const filtroData = document.getElementById('filtroData').value;

    const tbody = document.getElementById('tabelaOS');
    tbody.innerHTML = '';

    const osFiltradas = ordemServicos.filter(os => {
        const matchStatus = !filtroStatus || os.status === filtroStatus;
        const matchCliente = !filtroCliente || os.cliente.toLowerCase().includes(filtroCliente);
        const matchVeiculo = !filtroVeiculo || os.veiculo.toLowerCase().includes(filtroVeiculo);
        const matchData = !filtroData || os.dataAbertura.startsWith(filtroData);

        return matchStatus && matchCliente && matchVeiculo && matchData;
    });

    osFiltradas.forEach(os => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>#${os.numero}</strong></td>
            <td>${formatarData(os.dataAbertura)}</td>
            <td>${os.cliente}</td>
            <td>${os.veiculo}</td>
            <td><span class="badge badge-status badge-${os.status}">${formatarStatus(os.status)}</span></td>
            <td><span class="badge badge-prioridade badge-${os.prioridade}">${formatarPrioridade(os.prioridade)}</span></td>
          <td>
    <button class="btn btn-sm btn-primary" onclick="editarOS(${os.numero})">
        <i class="bi bi-pencil"></i>
    </button>
    <button class="btn btn-sm btn-success" onclick="enviarPorWhatsApp(${os.numero})" title="Enviar por WhatsApp">
        <i class="bi bi-whatsapp"></i>
    </button>
    <button class="btn btn-sm btn-warning" onclick="enviarPorEmail(${os.numero})" title="Enviar por Email">
        <i class="bi bi-envelope"></i>
    </button>
    <button class="btn btn-sm btn-info" onclick="verHistorico(${os.numero})">
        <i class="bi bi-clock-history"></i>
    </button>
    <button class="btn btn-sm btn-danger" onclick="excluirOS(${os.numero})">
        <i class="bi bi-trash"></i>
    </button>
</td>
        `;
        tbody.appendChild(tr);
    });
}

// Editar OS
function editarOS(numero) {
    const os = ordemServicos.find(o => o.numero === numero);
    if (!os) return;

    // Armazenar OS atual para edição
    osAtualEdicao = os;
    
    // Preencher formulário de edição
    document.getElementById('editarOSId').value = os.numero;
    document.getElementById('editarCliente').value = os.cliente;
    document.getElementById('editarTelefone').value = os.telefone || '';
    document.getElementById('editarVeiculo').value = os.veiculo;
    document.getElementById('editarPlaca').value = os.placa || '';
    document.getElementById('editarProblema').value = os.problema;
    document.getElementById('editarStatus').value = os.status;
    document.getElementById('editarPrioridade').value = os.prioridade;
    document.getElementById('editarObservacoes').value = os.observacoes || '';
    
    // Preencher dados de custo e peças
    document.getElementById('editarCustoServico').value = os.custoServico || 0;
    
    // Carregar peças/serviços da OS
    pecasOSEdicao = os.pecasServicos ? [...os.pecasServicos] : [];
    atualizarTabelaPecasOSEdicao();
    calcularTotalGeralEdicao();

    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('editarOSModal'));
    modal.show();
}

// Salvar edição da OS
function salvarEdicaoOS() {
    if (!usuarioLogado) {
        mostrarAlerta('Você precisa estar logado para editar uma OS!', 'warning');
        return;
    }

    const numero = parseInt(document.getElementById('editarOSId').value);
    const os = ordemServicos.find(o => o.numero === numero);
    if (!os) return;

    const statusAnterior = os.status;
    const prioridadeAnterior = os.prioridade;
    const custoAnterior = os.custoServico || 0;
    const totalAnterior = os.totalGeral || 0;

    // Atualizar dados básicos
    os.cliente = document.getElementById('editarCliente').value;
    os.telefone = document.getElementById('editarTelefone').value;
    os.veiculo = document.getElementById('editarVeiculo').value;
    os.placa = document.getElementById('editarPlaca').value;
    os.problema = document.getElementById('editarProblema').value;
    os.status = document.getElementById('editarStatus').value;
    os.prioridade = document.getElementById('editarPrioridade').value;
    os.observacoes = document.getElementById('editarObservacoes').value;
    
    // Atualizar dados financeiros
    os.custoServico = parseFloat(document.getElementById('editarCustoServico').value) || 0;
    os.pecasServicos = [...pecasOSEdicao];
    
    // Calcular total geral
    const totalPecas = os.pecasServicos.reduce((total, peca) => total + peca.total, 0);
    os.totalGeral = os.custoServico + totalPecas;

    // Adicionar nova observação se fornecida
    const novaObservacao = document.getElementById('novaObservacao').value;
    if (novaObservacao.trim()) {
        if (!os.historico) os.historico = [];
        os.historico.push({
            data: new Date().toISOString(),
            usuario: usuarioLogado.nome,
            acao: 'Observação adicionada',
            detalhes: novaObservacao
        });
    }

    // Registrar mudanças no histórico
    let mudancas = [];
    if (statusAnterior !== os.status) {
        mudancas.push(`Status: ${formatarStatus(statusAnterior)} → ${formatarStatus(os.status)}`);
    }
    if (prioridadeAnterior !== os.prioridade) {
        mudancas.push(`Prioridade: ${formatarPrioridade(prioridadeAnterior)} → ${formatarPrioridade(os.prioridade)}`);
    }
    if (custoAnterior !== os.custoServico) {
        mudancas.push(`Custo do serviço: R$ ${custoAnterior.toFixed(2)} → R$ ${os.custoServico.toFixed(2)}`);
    }
    if (totalAnterior !== os.totalGeral) {
        mudancas.push(`Total geral: R$ ${totalAnterior.toFixed(2)} → R$ ${os.totalGeral.toFixed(2)}`);
    }

    if (mudancas.length > 0 || novaObservacao.trim()) {
        if (!os.historico) os.historico = [];
        os.historico.push({
            data: new Date().toISOString(),
            usuario: usuarioLogado.nome,
            acao: 'OS atualizada',
            detalhes: mudancas.join(', ')
        });

        salvarMovimentacao(os, 'Atualização da OS', mudancas.join(', '));
    }

    salvarDados();
    carregarOS();
    atualizarEstatisticas();

    // Fechar modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('editarOSModal'));
    modal.hide();

    mostrarAlerta(`OS #${numero} atualizada com sucesso!`, 'success');
}

// Ver histórico da OS
function verHistorico(numero) {
    const os = ordemServicos.find(o => o.numero === numero);
    if (!os || !os.historico) return;

    const content = document.getElementById('historicoContent');
    content.innerHTML = `
        <h6>OS #${os.numero} - ${os.cliente}</h6>
        <div class="timeline">
            ${os.historico.map(h => `
                <div class="timeline-item">
                    <div class="timeline-content">
                        <strong>${h.acao}</strong><br>
                        <small class="text-muted">${formatarDataHora(h.data)} - ${h.usuario}</small><br>
                        ${h.detalhes ? `<em>${h.detalhes}</em>` : ''}
                    </div>
                </div>
            `).join('')}
        </div>
    `;

    const modal = new bootstrap.Modal(document.getElementById('historicoModal'));
    modal.show();
}

// Excluir OS
function excluirOS(numero) {
    if (!usuarioLogado) {
        mostrarAlerta('Você precisa estar logado para excluir uma OS!', 'warning');
        return;
    }

    if (confirm(`Tem certeza que deseja excluir a OS #${numero}?`)) {
        const index = ordemServicos.findIndex(os => os.numero === numero);
        if (index !== -1) {
            const os = ordemServicos[index];
            salvarMovimentacao(os, 'Exclusão da OS');
            ordemServicos.splice(index, 1);
            salvarDados();
            carregarOS();
            atualizarEstatisticas();
            mostrarAlerta(`OS #${numero} excluída com sucesso!`, 'success');
        }
    }
}

// Adicionar usuário
function adicionarUsuario() {
    if (!usuarioLogado || usuarioLogado.perfil !== 'admin') {
        mostrarAlerta('Apenas administradores podem cadastrar usuários!', 'warning');
        return;
    }

    const nome = document.getElementById('nomeUsuarioNovo').value;
    const senha = document.getElementById('senhaUsuarioNovo').value;
    const perfil = document.getElementById('perfilUsuario').value;

    // Verificar se usuário já existe
    if (usuarios.find(u => u.nome === nome)) {
        mostrarAlerta('Usuário já existe!', 'warning');
        return;
    }

    const usuario = { nome, senha, perfil };
    usuarios.push(usuario);
    salvarDados();
    carregarUsuarios();

    // Limpar formulário
    document.getElementById('usuarioForm').reset();
    
    mostrarAlerta(`Usuário ${nome} cadastrado com sucesso!`, 'success');
}

// Carregar usuários na tabela
function carregarUsuarios() {
    const tbody = document.getElementById('tabelaUsuarios');
    tbody.innerHTML = '';

    usuarios.forEach((usuario, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${usuario.nome}</td>
            <td><span class="badge bg-secondary">${usuario.perfil}</span></td>
            <td>
                <button class="btn btn-sm btn-danger" onclick="excluirUsuario(${index})">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Excluir usuário
function excluirUsuario(index) {
    if (!usuarioLogado || usuarioLogado.perfil !== 'admin') {
        mostrarAlerta('Apenas administradores podem excluir usuários!', 'warning');
        return;
    }

    if (confirm('Tem certeza que deseja excluir este usuário?')) {
        usuarios.splice(index, 1);
        salvarDados();
        carregarUsuarios();
        mostrarAlerta('Usuário excluído com sucesso!', 'success');
    }
}

// Navegação entre seções
function showSection(sectionId) {
    // Esconder todas as seções
    document.querySelectorAll('.content-section').forEach(section => {
        section.style.display = 'none';
    });

    // Mostrar seção selecionada
    document.getElementById(sectionId).style.display = 'block';

    // Atualizar navbar
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Carregar dados específicos da seção
    if (sectionId === 'consultar-os') {
        carregarOS();
    } else if (sectionId === 'usuarios') {
        carregarUsuarios();
    }
}

// Atualizar estatísticas
function atualizarEstatisticas() {
    document.getElementById('totalOS').textContent = ordemServicos.length;
    document.getElementById('osAbertas').textContent = ordemServicos.filter(os => os.status === 'aberta').length;
    document.getElementById('osAndamento').textContent = ordemServicos.filter(os => os.status === 'em_andamento').length;
    document.getElementById('osConcluidas').textContent = ordemServicos.filter(os => os.status === 'concluida').length;
}

// Salvar movimentação em arquivo TXT
function salvarMovimentacao(os, acao, detalhes = '') {
    const agora = new Date();
    const linha = `${formatarDataHora(agora.toISOString())} | OS #${os.numero} | ${os.cliente} | ${acao} | Usuário: ${usuarioLogado.nome} | ${detalhes}\n`;
    
    // Simular salvamento em arquivo (em um ambiente real, seria necessário um backend)
    const movimentacoes = localStorage.getItem('movimentacoes') || '';
    localStorage.setItem('movimentacoes', movimentacoes + linha);
}

// Funções auxiliares
function formatarData(dataISO) {
    return new Date(dataISO).toLocaleDateString('pt-BR');
}

function formatarDataHora(dataISO) {
    return new Date(dataISO).toLocaleString('pt-BR');
}

function formatarStatus(status) {
    const statusMap = {
        'aberta': 'Aberta',
        'em_andamento': 'Em Andamento',
        'aguardando_pecas': 'Aguardando Peças',
        'concluida': 'Concluída',
        'cancelada': 'Cancelada'
    };
    return statusMap[status] || status;
}

function formatarPrioridade(prioridade) {
    const prioridadeMap = {
        'baixa': 'Baixa',
        'media': 'Média',
        'alta': 'Alta',
        'urgente': 'Urgente'
    };
    return prioridadeMap[prioridade] || prioridade;
}

function mostrarAlerta(mensagem, tipo) {
    // Criar elemento de alerta
    const alerta = document.createElement('div');
    alerta.className = `alert alert-${tipo} alert-dismissible fade show position-fixed`;
    alerta.style.top = '80px';
    alerta.style.right = '20px';
    alerta.style.zIndex = '9999';
    alerta.innerHTML = `
        ${mensagem}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    document.body.appendChild(alerta);

    // Remover após 5 segundos
    setTimeout(() => {
        if (alerta.parentNode) {
            alerta.parentNode.removeChild(alerta);
        }
    }, 5000);
}



// ===== FUNÇÕES PARA GERENCIAMENTO DE PEÇAS/SERVIÇOS =====

// Configurar eventos relacionados a peças/serviços
function configurarEventosPecas() {
    // Evento de busca de peças
    const buscaPeca = document.getElementById('buscaPeca');
    if (buscaPeca) {
        buscaPeca.addEventListener('input', function() {
            buscarPecasServicos(this.value);
        });

        buscaPeca.addEventListener('blur', function() {
            setTimeout(() => {
                document.getElementById('sugestoesPecas').style.display = 'none';
            }, 200);
        });
    }

    // Evento para calcular total quando custo do serviço mudar
    const custoServico = document.getElementById('custoServico');
    if (custoServico) {
        custoServico.addEventListener('input', calcularTotalGeral);
    }

    // Eventos para o modal de seleção de peça
    const quantidadePeca = document.getElementById('quantidadePeca');
    const valorUnitarioPeca = document.getElementById('valorUnitarioPeca');
    
    if (quantidadePeca) {
        quantidadePeca.addEventListener('input', calcularTotalPeca);
    }
    
    if (valorUnitarioPeca) {
        valorUnitarioPeca.addEventListener('input', calcularTotalPeca);
    }
}

// Buscar peças/serviços
function buscarPecasServicos(termo) {
    if (termo.length < 2) {
        document.getElementById('sugestoesPecas').style.display = 'none';
        return;
    }

    const sugestoes = document.getElementById('sugestoesPecas');
    sugestoes.innerHTML = '';

    // Buscar em produtos cadastrados
    const produtosFiltrados = produtosServicos.filter(produto => 
        produto.descricao.toLowerCase().includes(termo.toLowerCase())
    );

    // Buscar em peças já utilizadas em outras OS
    const pecasUtilizadas = [];
    ordemServicos.forEach(os => {
        if (os.pecasServicos) {
            os.pecasServicos.forEach(peca => {
                if (peca.descricao.toLowerCase().includes(termo.toLowerCase())) {
                    const existe = pecasUtilizadas.find(p => p.descricao === peca.descricao);
                    if (!existe) {
                        pecasUtilizadas.push({
                            id: 'usado_' + Date.now(),
                            descricao: peca.descricao,
                            valorUnitario: peca.valorUnitario,
                            tipo: 'usado'
                        });
                    }
                }
            });
        }
    });

    // Combinar resultados
    const todosProdutos = [...produtosFiltrados, ...pecasUtilizadas];

    if (todosProdutos.length > 0) {
        todosProdutos.forEach(produto => {
            const item = document.createElement('a');
            item.className = 'list-group-item list-group-item-action';
            item.innerHTML = `
                <div class="d-flex w-100 justify-content-between">
                    <h6 class="mb-1">${produto.descricao}</h6>
                    <small>R$ ${produto.valorUnitario.toFixed(2)}</small>
                </div>
                <small class="text-muted">${produto.tipo === 'usado' ? 'Usado anteriormente' : produto.tipo}</small>
            `;
            item.onclick = () => selecionarPeca(produto);
            sugestoes.appendChild(item);
        });
        sugestoes.style.display = 'block';
    } else {
        sugestoes.style.display = 'none';
    }
}

// Selecionar peça para adicionar à OS
function selecionarPeca(produto) {
    document.getElementById('idProdutoSelecionado').value = produto.id;
    document.getElementById('descricaoSelecionada').value = produto.descricao;
    document.getElementById('valorUnitarioPeca').value = produto.valorUnitario;
    document.getElementById('quantidadePeca').value = 1;
    calcularTotalPeca();

    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('selecionarPecaModal'));
    modal.show();

    // Limpar busca
    document.getElementById('buscaPeca').value = '';
    document.getElementById('sugestoesPecas').style.display = 'none';
}

// Calcular total da peça no modal
function calcularTotalPeca() {
    const quantidade = parseFloat(document.getElementById('quantidadePeca').value) || 0;
    const valorUnitario = parseFloat(document.getElementById('valorUnitarioPeca').value) || 0;
    const total = quantidade * valorUnitario;
    document.getElementById('totalPeca').value = `R$ ${total.toFixed(2)}`;
}

// Adicionar peça à OS
function adicionarPecaOS() {
    const descricao = document.getElementById('descricaoSelecionada').value;
    const quantidade = parseFloat(document.getElementById('quantidadePeca').value);
    const valorUnitario = parseFloat(document.getElementById('valorUnitarioPeca').value);

    if (!descricao || quantidade <= 0 || valorUnitario < 0) {
        mostrarAlerta('Preencha todos os campos corretamente!', 'warning');
        return;
    }

    const peca = {
        id: Date.now(),
        descricao: descricao,
        quantidade: quantidade,
        valorUnitario: valorUnitario,
        total: quantidade * valorUnitario
    };

    pecasOSAtual.push(peca);
    atualizarTabelaPecasOS();
    calcularTotalGeral();

    // Fechar modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('selecionarPecaModal'));
    modal.hide();

    mostrarAlerta('Peça/serviço adicionado com sucesso!', 'success');
}

// Atualizar tabela de peças da OS
function atualizarTabelaPecasOS() {
    const tbody = document.getElementById('tabelaPecasOS');
    tbody.innerHTML = '';

    pecasOSAtual.forEach((peca, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${peca.descricao}</td>
            <td>${peca.quantidade}</td>
            <td>R$ ${peca.valorUnitario.toFixed(2)}</td>
            <td>R$ ${peca.total.toFixed(2)}</td>
            <td>
                <button class="btn btn-sm btn-danger" onclick="removerPecaOS(${index})">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Remover peça da OS
function removerPecaOS(index) {
    pecasOSAtual.splice(index, 1);
    atualizarTabelaPecasOS();
    calcularTotalGeral();
    mostrarAlerta('Peça/serviço removido!', 'info');
}

// Calcular total geral da OS
function calcularTotalGeral() {
    const custoServico = parseFloat(document.getElementById('custoServico').value) || 0;
    const totalPecas = pecasOSAtual.reduce((total, peca) => total + peca.total, 0);
    const totalGeral = custoServico + totalPecas;
    
    document.getElementById('totalGeral').value = `R$ ${totalGeral.toFixed(2)}`;
}

// Abrir modal para novo produto
function abrirModalNovoProduto() {
    document.getElementById('novoProdutoForm').reset();
    const modal = new bootstrap.Modal(document.getElementById('novoProdutoModal'));
    modal.show();
}

// Salvar novo produto/serviço
function salvarNovoProduto() {
    const descricao = document.getElementById('descricaoProduto').value;
    const tipo = document.getElementById('tipoProduto').value;
    const valor = parseFloat(document.getElementById('valorProduto').value);
    const observacoes = document.getElementById('observacoesProduto').value;

    if (!descricao || valor < 0) {
        mostrarAlerta('Preencha todos os campos obrigatórios!', 'warning');
        return;
    }

    const produto = {
        id: proximoIdProduto++,
        descricao: descricao,
        tipo: tipo,
        valorUnitario: valor,
        observacoes: observacoes,
        dataCadastro: new Date().toISOString(),
        usuarioCadastro: usuarioLogado.nome
    };

    produtosServicos.push(produto);
    salvarDados();

    // Fechar modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('novoProdutoModal'));
    modal.hide();

    mostrarAlerta(`${tipo === 'peca' ? 'Peça' : 'Serviço'} cadastrado com sucesso!`, 'success');

    // Adicionar automaticamente à OS se desejar
    selecionarPeca(produto);
}


// ===== FUNÇÕES PARA EDIÇÃO DE OS COM PRODUTOS =====

let pecasOSEdicao = [];
let osAtualEdicao = null;

// Configurar eventos para edição de peças
function configurarEventosEdicaoPecas() {
    // Evento de busca de peças na edição
    const editarBuscaPeca = document.getElementById('editarBuscaPeca');
    if (editarBuscaPeca) {
        editarBuscaPeca.addEventListener('input', function() {
            buscarPecasServicosEdicao(this.value);
        });

        editarBuscaPeca.addEventListener('blur', function() {
            setTimeout(() => {
                document.getElementById('editarSugestoesPecas').style.display = 'none';
            }, 200);
        });
    }

    // Evento para calcular total quando custo do serviço mudar na edição
    const editarCustoServico = document.getElementById('editarCustoServico');
    if (editarCustoServico) {
        editarCustoServico.addEventListener('input', calcularTotalGeralEdicao);
    }
}

// Buscar peças/serviços na edição
function buscarPecasServicosEdicao(termo) {
    if (termo.length < 2) {
        document.getElementById('editarSugestoesPecas').style.display = 'none';
        return;
    }

    const sugestoes = document.getElementById('editarSugestoesPecas');
    sugestoes.innerHTML = '';

    // Buscar em produtos cadastrados
    const produtosFiltrados = produtosServicos.filter(produto => 
        produto.descricao.toLowerCase().includes(termo.toLowerCase())
    );

    // Buscar em peças já utilizadas em outras OS
    const pecasUtilizadas = [];
    ordemServicos.forEach(os => {
        if (os.pecasServicos) {
            os.pecasServicos.forEach(peca => {
                if (peca.descricao.toLowerCase().includes(termo.toLowerCase())) {
                    const existe = pecasUtilizadas.find(p => p.descricao === peca.descricao);
                    if (!existe) {
                        pecasUtilizadas.push({
                            id: 'usado_' + Date.now(),
                            descricao: peca.descricao,
                            valorUnitario: peca.valorUnitario,
                            tipo: 'usado'
                        });
                    }
                }
            });
        }
    });

    // Combinar resultados
    const todosProdutos = [...produtosFiltrados, ...pecasUtilizadas];

    if (todosProdutos.length > 0) {
        todosProdutos.forEach(produto => {
            const item = document.createElement('a');
            item.className = 'list-group-item list-group-item-action';
            item.innerHTML = `
                <div class="d-flex w-100 justify-content-between">
                    <h6 class="mb-1">${produto.descricao}</h6>
                    <small>R$ ${produto.valorUnitario.toFixed(2)}</small>
                </div>
                <small class="text-muted">${produto.tipo === 'usado' ? 'Usado anteriormente' : produto.tipo}</small>
            `;
            item.onclick = () => selecionarPecaEdicao(produto);
            sugestoes.appendChild(item);
        });
        sugestoes.style.display = 'block';
    } else {
        sugestoes.style.display = 'none';
    }
}

// Selecionar peça para adicionar à OS na edição
function selecionarPecaEdicao(produto) {
    document.getElementById('idProdutoSelecionado').value = produto.id;
    document.getElementById('descricaoSelecionada').value = produto.descricao;
    document.getElementById('valorUnitarioPeca').value = produto.valorUnitario;
    document.getElementById('quantidadePeca').value = 1;
    calcularTotalPeca();

    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('selecionarPecaModal'));
    modal.show();

    // Limpar busca
    document.getElementById('editarBuscaPeca').value = '';
    document.getElementById('editarSugestoesPecas').style.display = 'none';
    
    // Definir que estamos em modo edição
    document.getElementById('selecionarPecaModal').setAttribute('data-modo', 'edicao');
}

// Atualizar tabela de peças da OS na edição
function atualizarTabelaPecasOSEdicao() {
    const tbody = document.getElementById('editarTabelaPecasOS');
    tbody.innerHTML = '';

    pecasOSEdicao.forEach((peca, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${peca.descricao}</td>
            <td>${peca.quantidade}</td>
            <td>R$ ${peca.valorUnitario.toFixed(2)}</td>
            <td>R$ ${peca.total.toFixed(2)}</td>
            <td>
                <button class="btn btn-sm btn-danger" onclick="removerPecaOSEdicao(${index})">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Remover peça da OS na edição
function removerPecaOSEdicao(index) {
    pecasOSEdicao.splice(index, 1);
    atualizarTabelaPecasOSEdicao();
    calcularTotalGeralEdicao();
    mostrarAlerta('Peça/serviço removido!', 'info');
}

// Calcular total geral da OS na edição
function calcularTotalGeralEdicao() {
    const custoServico = parseFloat(document.getElementById('editarCustoServico').value) || 0;
    const totalPecas = pecasOSEdicao.reduce((total, peca) => total + peca.total, 0);
    const totalGeral = custoServico + totalPecas;
    
    document.getElementById('editarTotalGeral').value = `R$ ${totalGeral.toFixed(2)}`;
}

// Abrir modal para novo produto na edição
function abrirModalNovoProdutoEdicao() {
    document.getElementById('novoProdutoForm').reset();
    const modal = new bootstrap.Modal(document.getElementById('novoProdutoModal'));
    modal.show();
    
    // Definir que estamos em modo edição
    document.getElementById('novoProdutoModal').setAttribute('data-modo', 'edicao');
}

// Modificar a função adicionarPecaOS para suportar edição
function adicionarPecaOSOriginal() {
    const descricao = document.getElementById('descricaoSelecionada').value;
    const quantidade = parseFloat(document.getElementById('quantidadePeca').value);
    const valorUnitario = parseFloat(document.getElementById('valorUnitarioPeca').value);

    if (!descricao || quantidade <= 0 || valorUnitario < 0) {
        mostrarAlerta('Preencha todos os campos corretamente!', 'warning');
        return;
    }

    const peca = {
        id: Date.now(),
        descricao: descricao,
        quantidade: quantidade,
        valorUnitario: valorUnitario,
        total: quantidade * valorUnitario
    };

    // Verificar se estamos em modo edição
    const modal = document.getElementById('selecionarPecaModal');
    const modoEdicao = modal.getAttribute('data-modo') === 'edicao';

    if (modoEdicao) {
        pecasOSEdicao.push(peca);
        atualizarTabelaPecasOSEdicao();
        calcularTotalGeralEdicao();
    } else {
        pecasOSAtual.push(peca);
        atualizarTabelaPecasOS();
        calcularTotalGeral();
    }

    // Fechar modal
    const modalInstance = bootstrap.Modal.getInstance(modal);
    modalInstance.hide();

    mostrarAlerta('Peça/serviço adicionado com sucesso!', 'success');
}

// Substituir a função original
window.adicionarPecaOS = adicionarPecaOSOriginal;

// ===== FUNÇÕES PARA ENVIO POR WHATSAPP E EMAIL =====

// Enviar OS por WhatsApp
function enviarPorWhatsApp(numero) {
    const os = ordemServicos.find(o => o.numero === numero);
    if (!os) {
        mostrarAlerta('OS não encontrada!', 'danger');
        return;
    }

    // Verificar se há telefone cadastrado
    if (!os.telefone) {
        mostrarAlerta('Cliente não possui telefone cadastrado!', 'warning');
        return;
    }

    // Formatar mensagem para WhatsApp
    const mensagem = formatarMensagemOS(os);
    
    // Limpar telefone (remover caracteres especiais)
    const telefone = os.telefone.replace(/\D/g, '');
    
    // Verificar se o telefone tem o formato correto (11 dígitos para celular brasileiro)
    if (telefone.length < 10 || telefone.length > 11) {
        mostrarAlerta('Número de telefone inválido!', 'warning');
        return;
    }

    // Adicionar código do país se necessário
    const telefoneCompleto = telefone.startsWith('55') ? telefone : '55' + telefone;
    
    // Criar URL do WhatsApp
    const urlWhatsApp = `https://wa.me/${telefoneCompleto}?text=${encodeURIComponent(mensagem)}`;
    
    // Abrir WhatsApp em nova aba
    window.open(urlWhatsApp, '_blank');
    
    // Registrar no histórico
    if (!os.historico) os.historico = [];
    os.historico.push({
        data: new Date().toISOString(),
        usuario: usuarioLogado.nome,
        acao: 'Enviado por WhatsApp',
        detalhes: `Mensagem enviada para ${os.telefone}`
    });
    
    salvarDados();
    mostrarAlerta(`OS #${numero} enviada por WhatsApp!`, 'success');
}

// Enviar OS por Email
function enviarPorEmail(numero) {
    const os = ordemServicos.find(o => o.numero === numero);
    if (!os) {
        mostrarAlerta('OS não encontrada!', 'danger');
        return;
    }

    // Formatar mensagem para email
    const assunto = `Ordem de Serviço #${os.numero} - ${os.cliente}`;
    const corpo = formatarMensagemOS(os);
    
    // Criar URL do email
    const urlEmail = `mailto:?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`;
    
    // Abrir cliente de email
    window.location.href = urlEmail;
    
    // Registrar no histórico
    if (!os.historico) os.historico = [];
    os.historico.push({
        data: new Date().toISOString(),
        usuario: usuarioLogado.nome,
        acao: 'Enviado por Email',
        detalhes: 'Email preparado para envio'
    });
    
    salvarDados();
    mostrarAlerta(`OS #${numero} preparada para envio por email!`, 'success');
}

// Formatar mensagem da OS para envio
function formatarMensagemOS(os) {
    const dataFormatada = formatarDataHora(os.dataAbertura);
    const statusFormatado = formatarStatus(os.status);
    const prioridadeFormatada = formatarPrioridade(os.prioridade);
    
    // Calcular total de peças/serviços
    const totalPecas = os.pecasServicos ? os.pecasServicos.reduce((total, peca) => total + peca.total, 0) : 0;
    const custoServico = os.custoServico || 0;
    const totalGeral = custoServico + totalPecas;
    
    // Formatar lista de peças/serviços
    let listaPecas = '';
    if (os.pecasServicos && os.pecasServicos.length > 0) {
        listaPecas = '\n\n📋 *Peças/Serviços:*\n';
        os.pecasServicos.forEach(peca => {
            listaPecas += `• ${peca.descricao} - Qtd: ${peca.quantidade} - Valor: R$ ${peca.valorUnitario.toFixed(2)} - Total: R$ ${peca.total.toFixed(2)}\n`;
        });
    }
    
    const mensagem = `🔧 *ORDEM DE SERVIÇO #${os.numero}*

👤 *Cliente:* ${os.cliente}
${os.telefone ? `📞 *Telefone:* ${os.telefone}` : ''}
🚗 *Veículo:* ${os.veiculo}
${os.placa ? `🏷️ *Placa:* ${os.placa}` : ''}

📝 *Problema Relatado:*
${os.problema}

📊 *Status:* ${statusFormatado}
⚡ *Prioridade:* ${prioridadeFormatada}
📅 *Data de Abertura:* ${dataFormatada}
👨‍🔧 *Responsável:* ${os.usuarioAbertura}

💰 *Valores:*
• Custo do Serviço: R$ ${custoServico.toFixed(2)}
• Total em Peças: R$ ${totalPecas.toFixed(2)}
• *TOTAL GERAL: R$ ${totalGeral.toFixed(2)}*${listaPecas}

${os.observacoes ? `\n📋 *Observações:*\n${os.observacoes}` : ''}

---
Sistema de OS - Oficina Mecânica`;

    return mensagem;
}
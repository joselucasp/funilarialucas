
// Sistema de OS - Oficina Mecânica
// Variáveis globais
let ordemServicos = [];
let usuarios = [];
let produtosServicos = [];
let usuarioLogado = null;
let proximoNumeroOS = 1;
let proximoIdProduto = 1;
let pecasOSEdicao = [];
let osAtualEdicao = null;
let pecasOSAtual = []; // ou const, dependendo do uso




// Inicialização do sistema
document.addEventListener('DOMContentLoaded', function() {
    carregarDados();
    verificarLogin();
    configurarEventos();
    configurarEventosPecas();
    atualizarEstatisticas();
    configurarEventosEdicaoPecas();
   
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
            <button class="btn btn-sm btn-info" onclick="verHistorico(${os.numero})">
            <i class="bi bi-clock-history"></i>
            </button>
            <button class="btn btn-sm btn-danger" onclick="excluirOS(${os.numero})">
            <i class="bi bi-trash"></i>
            </button>
            <button class="btn btn-sm btn-danger" onclick="exportarOSIndividual(${os.numero})" title="Exportar PDF">
    <i class="bi bi-file-earmark-pdf"></i>
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
    calcularTotalGeralEdicao(); // Chamar a função de cálculo para edição

    // Mostrar modal de edição da OS
    const modal = new bootstrap.Modal(document.getElementById("editarOSModal"));
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
    const totalPecasEdicao = os.pecasServicos.reduce((total, peca) => total + peca.total, 0);
    os.totalGeral = os.custoServico + totalPecasEdicao;

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
document.getElementById("buscaPeca").value = "";
document.getElementById("sugestoesPecas").style.display = "none";

// Garantir que o modal não está em modo edição ao adicionar nova OS
// document.getElementById("selecionarPecaModal").removeAttribute("data-modo");
}

// Calcular total da peça no modal
function calcularTotalPeca() {
    const quantidade = parseFloat(document.getElementById('quantidadePeca').value) || 0;
    const valorUnitario = parseFloat(document.getElementById('valorUnitarioPeca').value) || 0;
    const total = quantidade * valorUnitario;
    document.getElementById('totalPeca').value = `R$ ${total.toFixed(2)}`;
}

// Adicionar peça à OS (funciona para novo cadastro ou edição)
//const modal = bootstrap.Modal.getInstance(document.getElementById('selecionarPecaModal'));
//function adicionarPecaOS() {
    
    //const descricao = document.getElementById('descricaoSelecionada').value;
    //const quantidade = parseFloat(document.getElementById('quantidadePeca').value);
    //const valorUnitario = parseFloat(document.getElementById('valorUnitarioPeca').value);

function adicionarPecaOS() {
  const modalEl = document.getElementById('selecionarPecaModal');
  const modoEdicao = modalEl.getAttribute('data-modo');
  const numero = parseInt(document.getElementById('editarOSId').value);

  const descricao = document.getElementById('descricaoSelecionada').value;
  const quantidade = parseFloat(document.getElementById('quantidadePeca').value);
  const valorUnitario = parseFloat(document.getElementById('valorUnitarioPeca').value);
  

  if (!descricao || quantidade <= 0 || valorUnitario < 0) {
    mostrarAlerta('Preencha todos os campos corretamente!', 'warning');
    return;
  }

  const peca = {
    id: Date.now(),
    descricao,
    quantidade,
    valorUnitario,
    total: quantidade * valorUnitario
  };


 // pecasOSAtual.push(peca);
 // pecasOSEdicao.push(peca);
  

  if (modoEdicao === 'edicao') {  
    pecasOSEdicao.push(peca);
    atualizarTabelaPecasOSEdicao();
    calcularTotalGeralEdicao(); // Chamar a função de cálculo para edição
  } else {
    pecasOSAtual.push(peca);
    atualizarTabelaPecasOS();
    calcularTotalGeral();
  }

  const modalInstance = bootstrap.Modal.getInstance(modalEl);
  modalInstance.hide();
  mostrarAlerta('Peça/serviço adicionada com sucesso!', 'success');
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

// Adicionar o produto recém-criado diretamente à pecasOSAtual
pecasOSAtual.push(produto);
atualizarTabelaPecasOS();
calcularTotalGeral();

// Fechar modal
const modalEl = document.getElementById('novoProdutoModal');
const modal = bootstrap.Modal.getInstance(modalEl);

// Esperar o modal fechar para remover foco
modalEl.addEventListener('hidden.bs.modal', () => {
    document.activeElement.blur(); // remove foco depois do fechamento
    // ou: document.getElementById('botaoNovoProduto').focus();
}, { once: true });

modal.hide();

mostrarAlerta(`${tipo === 'peca' ? 'Peça' : 'Serviço'} cadastrado com sucesso!`, 'success');
}




// ===== FUNÇÕES PARA EDIÇÃO DE OS COM PRODUTOS =====


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
    const editarCustoServico = document.getElementById("editarCustoServico");
    if (editarCustoServico) {
        editarCustoServico.addEventListener("input", calcularTotalGeralEdicao);
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
    document.getElementById("idProdutoSelecionado").value = produto.id;
    document.getElementById("descricaoSelecionada").value = produto.descricao;
    document.getElementById("valorUnitarioPeca").value = produto.valorUnitario;
    document.getElementById("quantidadePeca").value = 1;
    calcularTotalPeca();

    // Definir que estamos em modo edição ANTES de mostrar o modal
    document.getElementById("selecionarPecaModal").setAttribute("data-modo", "edicao");

    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById("selecionarPecaModal"));
    modal.show();

    // Limpar busca
    document.getElementById("editarBuscaPeca").value = "";
    document.getElementById("editarSugestoesPecas").style.display = "none";
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
    calcularTotalGeralEdicao(); // Chamar a função de cálculo para edição
    mostrarAlerta("Peça/serviço removido!", "info");
}

// Calcular total geral da OS na edição
function calcularTotalGeralEdicao() {
    const custoServico = parseFloat(document.getElementById("editarCustoServico").value) || 0;
    const totalPecas = pecasOSEdicao.reduce((total, peca) => total + peca.total, 0);
    const totalGeral = custoServico + totalPecas;
    
    document.getElementById("editarTotalGeral").value = `R$ ${totalGeral.toFixed(2)}`;
}

// Abre modal de seleção de peça no modo edição
function abrirModalEdicao(os) {
  osAtualEdicao = os;
  pecasOSEdicao = os.pecasServicos ? os.pecasServicos.slice() : [];
  document.getElementById("editarCustoServico").value = os.custoServico || 0;
  atualizarTabelaPecasOSEdicao();
  calcularTotalGeralEdicao();

  const modalEl = document.getElementById("selecionarPecaModal");
  modalEl.setAttribute("data-modo", "edicao");
  // Não abrir o modal de seleção de peça aqui, ele é aberto pela função selecionarPecaEdicao
}



// ===== SISTEMA FINANCEIRO =====

// Variáveis para gráficos
let graficoReceitaMensal = null;
let graficoDistribuicao = null;

// Atualizar relatório financeiro
function atualizarRelatorioFinanceiro() {
    const dataInicio = document.getElementById('filtroDataInicio').value;
    const dataFim = document.getElementById('filtroDataFim').value;
    
    // Filtrar OS concluídas
    let osConcluidas = ordemServicos.filter(os => os.status === 'concluida');
    
    // Aplicar filtro de data se especificado
    if (dataInicio || dataFim) {
        osConcluidas = osConcluidas.filter(os => {
            const dataOS = new Date(os.dataAbertura).toISOString().split('T')[0];
            const dentroInicio = !dataInicio || dataOS >= dataInicio;
            const dentroFim = !dataFim || dataOS <= dataFim;
            return dentroInicio && dentroFim;
        });
    }
    
    // Calcular totais
    const totalOS = osConcluidas.length;
    let receitaServicos = 0;
    let receitaPecas = 0;
    
    osConcluidas.forEach(os => {
        receitaServicos += os.custoServico || 0;
        if (os.pecasServicos) {
            receitaPecas += os.pecasServicos.reduce((total, peca) => total + peca.total, 0);
        }
    });
    
    const receitaTotal = receitaServicos + receitaPecas;
    
    // Atualizar cards
    document.getElementById('totalOSConcluidas').textContent = totalOS;
    document.getElementById('receitaTotal').textContent = `R$ ${receitaTotal.toFixed(2)}`;
    document.getElementById('receitaServicos').textContent = `R$ ${receitaServicos.toFixed(2)}`;
    document.getElementById('receitaPecas').textContent = `R$ ${receitaPecas.toFixed(2)}`;
    
    // Atualizar tabela
    carregarTabelaFinanceiro(osConcluidas);
    
    // Atualizar estatísticas
    atualizarEstatisticasFinanceiras(osConcluidas, receitaTotal);
    
    // Atualizar gráficos
    atualizarGraficos(osConcluidas);
    
    // Atualizar top clientes
    atualizarTopClientes(osConcluidas);
}

// Carregar tabela financeira
function carregarTabelaFinanceiro(osConcluidas) {
    const tbody = document.getElementById('tabelaFinanceiro');
    tbody.innerHTML = '';
    
    osConcluidas.forEach(os => {
        const custoServico = os.custoServico || 0;
        const valorPecas = os.pecasServicos ? os.pecasServicos.reduce((total, peca) => total + peca.total, 0) : 0;
        const totalOS = custoServico + valorPecas;
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>#${os.numero}</strong></td>
            <td>${formatarData(os.dataAbertura)}</td>
            <td>${os.cliente}</td>
            <td>${os.veiculo}</td>
            <td class="text-info">R$ ${custoServico.toFixed(2)}</td>
            <td class="text-warning">R$ ${valorPecas.toFixed(2)}</td>
            <td class="text-success"><strong>R$ ${totalOS.toFixed(2)}</strong></td>
            <td>
                <button class="btn btn-sm btn-info" onclick="verHistorico(${os.numero})" title="Ver Histórico">
                    <i class="bi bi-clock-history"></i>
                </button>
                <button class="btn btn-sm btn-primary" onclick="verDetalhesFinanceiros(${os.numero})" title="Ver Detalhes">
                    <i class="bi bi-eye"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Atualizar estatísticas financeiras
function atualizarEstatisticasFinanceiras(osConcluidas, receitaTotal) {
    if (osConcluidas.length === 0) {
        document.getElementById('ticketMedio').textContent = 'R$ 0,00';
        document.getElementById('maiorOS').textContent = 'R$ 0,00';
        document.getElementById('menorOS').textContent = 'R$ 0,00';
        document.getElementById('osPorDia').textContent = '0';
        document.getElementById('receitaPorDia').textContent = 'R$ 0,00';
        return;
    }
    
    // Calcular valores de cada OS
    const valoresOS = osConcluidas.map(os => {
        const custoServico = os.custoServico || 0;
        const valorPecas = os.pecasServicos ? os.pecasServicos.reduce((total, peca) => total + peca.total, 0) : 0;
        return custoServico + valorPecas;
    });
    
    // Ticket médio
    const ticketMedio = receitaTotal / osConcluidas.length;
    document.getElementById('ticketMedio').textContent = `R$ ${ticketMedio.toFixed(2)}`;
    
    // Maior e menor OS
    const maiorOS = Math.max(...valoresOS);
    const menorOS = Math.min(...valoresOS);
    document.getElementById('maiorOS').textContent = `R$ ${maiorOS.toFixed(2)}`;
    document.getElementById('menorOS').textContent = `R$ ${menorOS.toFixed(2)}`;
    
    // Calcular período em dias
    const dataInicio = document.getElementById('filtroDataInicio').value;
    const dataFim = document.getElementById('filtroDataFim').value;
    
    let diasPeriodo = 1;
    if (dataInicio && dataFim) {
        const inicio = new Date(dataInicio);
        const fim = new Date(dataFim);
        diasPeriodo = Math.max(1, Math.ceil((fim - inicio) / (1000 * 60 * 60 * 24)) + 1);
    } else if (osConcluidas.length > 0) {
        // Calcular baseado nas datas das OS
        const datas = osConcluidas.map(os => new Date(os.dataAbertura));
        const dataMin = new Date(Math.min(...datas));
        const dataMax = new Date(Math.max(...datas));
        diasPeriodo = Math.max(1, Math.ceil((dataMax - dataMin) / (1000 * 60 * 60 * 24)) + 1);
    }
    
    // OS por dia e receita por dia
    const osPorDia = (osConcluidas.length / diasPeriodo).toFixed(1);
    const receitaPorDia = (receitaTotal / diasPeriodo).toFixed(2);
    
    document.getElementById('osPorDia').textContent = osPorDia;
    document.getElementById('receitaPorDia').textContent = `R$ ${receitaPorDia}`;
}

// Aplicar filtro de período rápido
function aplicarFiltroPeriodo() {
    const periodo = document.getElementById('filtroPeriodo').value;
    const hoje = new Date();
    let dataInicio = '';
    let dataFim = '';
    
    switch (periodo) {
        case 'hoje':
            dataInicio = dataFim = hoje.toISOString().split('T')[0];
            break;
        case 'semana':
            const inicioSemana = new Date(hoje);
            inicioSemana.setDate(hoje.getDate() - hoje.getDay());
            dataInicio = inicioSemana.toISOString().split('T')[0];
            dataFim = hoje.toISOString().split('T')[0];
            break;
        case 'mes':
            dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0];
            dataFim = hoje.toISOString().split('T')[0];
            break;
        case 'trimestre':
            const mesAtual = hoje.getMonth();
            const inicioTrimestre = Math.floor(mesAtual / 3) * 3;
            dataInicio = new Date(hoje.getFullYear(), inicioTrimestre, 1).toISOString().split('T')[0];
            dataFim = hoje.toISOString().split('T')[0];
            break;
        case 'ano':
            dataInicio = new Date(hoje.getFullYear(), 0, 1).toISOString().split('T')[0];
            dataFim = hoje.toISOString().split('T')[0];
            break;
        case 'todos':
            dataInicio = dataFim = '';
            break;
    }
    
    document.getElementById('filtroDataInicio').value = dataInicio;
    document.getElementById('filtroDataFim').value = dataFim;
    
    atualizarRelatorioFinanceiro();
}

// Atualizar top clientes
function atualizarTopClientes(osConcluidas) {
    const clientesMap = {};
    
    osConcluidas.forEach(os => {
        const custoServico = os.custoServico || 0;
        const valorPecas = os.pecasServicos ? os.pecasServicos.reduce((total, peca) => total + peca.total, 0) : 0;
        const totalOS = custoServico + valorPecas;
        
        if (!clientesMap[os.cliente]) {
            clientesMap[os.cliente] = { total: 0, quantidade: 0 };
        }
        clientesMap[os.cliente].total += totalOS;
        clientesMap[os.cliente].quantidade += 1;
    });
    
    // Converter para array e ordenar
    const topClientes = Object.entries(clientesMap)
        .map(([cliente, dados]) => ({ cliente, ...dados }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);
    
    const container = document.getElementById('topClientes');
    container.innerHTML = '';
    
    if (topClientes.length === 0) {
        container.innerHTML = '<p class="text-muted">Nenhum cliente encontrado no período.</p>';
        return;
    }
    
    topClientes.forEach((cliente, index) => {
        const div = document.createElement('div');
        div.className = 'mb-2';
        div.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <strong>${index + 1}. ${cliente.cliente}</strong><br>
                    <small class="text-muted">${cliente.quantidade} OS</small>
                </div>
                <div class="text-end">
                    <strong class="text-success">R$ ${cliente.total.toFixed(2)}</strong>
                </div>
            </div>
            ${index < topClientes.length - 1 ? '<hr class="my-2">' : ''}
        `;
        container.appendChild(div);
    });
}

// Ver detalhes financeiros de uma OS
function verDetalhesFinanceiros(numero) {
    const os = ordemServicos.find(o => o.numero === numero);
    if (!os) return;
    
    const custoServico = os.custoServico || 0;
    const valorPecas = os.pecasServicos ? os.pecasServicos.reduce((total, peca) => total + peca.total, 0) : 0;
    const totalOS = custoServico + valorPecas;
    
    let detalhePecas = '';
    if (os.pecasServicos && os.pecasServicos.length > 0) {
        detalhePecas = '<h6>Peças/Serviços:</h6><ul>';
        os.pecasServicos.forEach(peca => {
            detalhePecas += `<li>${peca.descricao} - Qtd: ${peca.quantidade} - Valor Unit: R$ ${peca.valorUnitario.toFixed(2)} - Total: R$ ${peca.total.toFixed(2)}</li>`;
        });
        detalhePecas += '</ul>';
    }
    
    const content = `
        <h6>OS #${os.numero} - ${os.cliente}</h6>
        <p><strong>Veículo:</strong> ${os.veiculo}</p>
        <p><strong>Data:</strong> ${formatarDataHora(os.dataAbertura)}</p>
        <hr>
        <p><strong>Custo do Serviço:</strong> R$ ${custoServico.toFixed(2)}</p>
        <p><strong>Valor em Peças:</strong> R$ ${valorPecas.toFixed(2)}</p>
        <h5><strong>Total Geral: R$ ${totalOS.toFixed(2)}</strong></h5>
        ${detalhePecas}
    `;
    
    document.getElementById('historicoContent').innerHTML = content;
    document.getElementById('historicoModalLabel').textContent = 'Detalhes Financeiros';
    
    const modal = new bootstrap.Modal(document.getElementById('historicoModal'));
    modal.show();
}

// Exportar relatório financeiro
function exportarRelatorioFinanceiro() {
    const dataInicio = document.getElementById('filtroDataInicio').value;
    const dataFim = document.getElementById('filtroDataFim').value;
    
    let osConcluidas = ordemServicos.filter(os => os.status === 'concluida');
    
    if (dataInicio || dataFim) {
        osConcluidas = osConcluidas.filter(os => {
            const dataOS = new Date(os.dataAbertura).toISOString().split('T')[0];
            const dentroInicio = !dataInicio || dataOS >= dataInicio;
            const dentroFim = !dataFim || dataOS <= dataFim;
            return dentroInicio && dentroFim;
        });
    }
    
    // Criar CSV
    let csv = 'OS,Data,Cliente,Veiculo,Custo_Servico,Valor_Pecas,Total\n';
    
    osConcluidas.forEach(os => {
        const custoServico = os.custoServico || 0;
        const valorPecas = os.pecasServicos ? os.pecasServicos.reduce((total, peca) => total + peca.total, 0) : 0;
        const totalOS = custoServico + valorPecas;
        
        csv += `${os.numero},${formatarData(os.dataAbertura)},"${os.cliente}","${os.veiculo}",${custoServico.toFixed(2)},${valorPecas.toFixed(2)},${totalOS.toFixed(2)}\n`;
    });
    
    // Download do arquivo
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio_financeiro_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    mostrarAlerta('Relatório exportado com sucesso!', 'success');
}

// Atualizar gráficos (versão simplificada sem Chart.js)
function atualizarGraficos(osConcluidas) {
    // Para implementação completa, seria necessário incluir Chart.js
    // Por enquanto, vamos mostrar uma mensagem informativa
    
    const canvasReceita = document.getElementById('graficoReceitaMensal');
    const canvasDistribuicao = document.getElementById('graficoDistribuicao');
    
    if (canvasReceita) {
        const ctx = canvasReceita.getContext('2d');
        ctx.clearRect(0, 0, canvasReceita.width, canvasReceita.height);
        ctx.fillStyle = '#6c757d';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Gráfico de Receita Mensal', canvasReceita.width / 2, canvasReceita.height / 2 - 10);
        ctx.fillText('(Implementar Chart.js para gráficos completos)', canvasReceita.width / 2, canvasReceita.height / 2 + 10);
    }
    
    if (canvasDistribuicao) {
        const ctx = canvasDistribuicao.getContext('2d');
        ctx.clearRect(0, 0, canvasDistribuicao.width, canvasDistribuicao.height);
        ctx.fillStyle = '#6c757d';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Gráfico de Distribuição', canvasDistribuicao.width / 2, canvasDistribuicao.height / 2 - 10);
        ctx.fillText('(Implementar Chart.js para gráficos completos)', canvasDistribuicao.width / 2, canvasDistribuicao.height / 2 + 10);
    }
}

// Modificar a função showSection para incluir o financeiro
function showFinanceiroSection() {
    showSection('financeiro');
    const filtro = document.getElementById('filtroPeriodo');
    if (filtro) {
        filtro.value = 'mes';
        aplicarFiltroPeriodo();
}
}


async function exportarOSParaPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const filtroStatus = document.getElementById('filtroStatus').value;
    const filtroCliente = document.getElementById('filtroCliente').value.toLowerCase();
    const filtroVeiculo = document.getElementById('filtroVeiculo').value.toLowerCase();
    const filtroData = document.getElementById('filtroData').value;

    const osFiltradas = ordemServicos.filter(os => {
        const matchStatus = !filtroStatus || os.status === filtroStatus;
        const matchCliente = !filtroCliente || os.cliente.toLowerCase().includes(filtroCliente);
        const matchVeiculo = !filtroVeiculo || os.veiculo.toLowerCase().includes(filtroVeiculo);
        const matchData = !filtroData || os.dataAbertura.startsWith(filtroData);
        return matchStatus && matchCliente && matchVeiculo && matchData;
    });

    if (osFiltradas.length === 0) {
        mostrarAlerta("Nenhuma OS encontrada para exportar!", "warning");
        return;
    }

    doc.text("Relatório de Ordens de Serviço", 14, 15);

    const rows = osFiltradas.map(os => [
        `#${os.numero}`,
        formatarData(os.dataAbertura),
        os.cliente,
        os.veiculo,
        formatarStatus(os.status),
        formatarPrioridade(os.prioridade),
        `R$ ${os.totalGeral.toFixed(2)}`
    ]);

    doc.autoTable({
        head: [["OS", "Data", "Cliente", "Veículo", "Status", "Prioridade", "Total"]],
        body: rows,
        startY: 20,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [40, 40, 40] }
    });

    doc.save(`ordens_servico.pdf`);
}
// Importe o plugin autoTable se estiver usando um sistema de módulos.
// Se não, certifique-se de que o script jspdf-autotable.js foi carregado no seu HTML.
// import 'jspdf-autotable';

function exportarOSIndividual(numero) {
    const os = ordemServicos.find(o => o.numero === numero);
    if (!os) {
        mostrarAlerta('OS não encontrada!', 'danger');
        return;
    }

    // 1. Cole sua string Base64 aqui
    // Substitua a string de exemplo pela sua string completa.
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // --- Cabeçalho ---
    // Centraliza dinamicamente para se adaptar a qualquer tamanho de página
    const pageWidth = doc.internal.pageSize.getWidth();
    const centerX = pageWidth / 2;

    doc.addImage(logoBase64, 'PNG', centerX - 20, 10, 40, 20); // Imagem centralizada
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(226, 0, 0); // Vermelho ARF
    doc.text("ARF FUNILARIA E PINTURA", centerX, 35, { align: 'center' });

    doc.setDrawColor(200, 0, 0);
    doc.setLineWidth(0.6);
    doc.line(20, 38, pageWidth - 20, 38); // Linha decorativa de margem a margem

    // --- Título da OS ---
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text(`Ordem de Serviço #${os.numero}`, 20, 48);

    // --- Dados da OS ---
    doc.setFontSize(10);
    const dadosGerais = [
        ["Cliente:", os.cliente],
        ["Telefone:", os.telefone || "-"],
        ["Veículo:", os.veiculo],
        ["Placa:", os.placa || "-"],
        ["Problema:", os.problema],
        ["Status:", formatarStatus(os.status)],
        ["Prioridade:", formatarPrioridade(os.prioridade)],
        ["Abertura:", formatarDataHora(os.dataAbertura)],
        ["Total Geral:", `R$ ${os.totalGeral.toFixed(2)}`],
    ];

    let y = 56;
    dadosGerais.forEach(([label, valor]) => {
        doc.setFont('helvetica', 'bold');
        doc.text(label, 20, y);
        doc.setFont('helvetica', 'normal');
        // O método `splitTextToSize` quebra o texto longo para evitar que ele saia da página
        const valorFormatado = doc.splitTextToSize(String(valor), pageWidth - 80); // Largura máxima do texto
        doc.text(valorFormatado, 55, y);
        // Ajusta a posição Y com base no número de linhas do valor
        y += (valorFormatado.length * 5) + 2;
    });

    // --- Tabela de Peças e Serviços ---
    if (os.pecasServicos && os.pecasServicos.length > 0) {
        y += 4; // Espaçamento antes da tabela
        doc.autoTable({
            head: [["Descrição", "Qtd", "Valor Unit.", "Total"]],
            body: os.pecasServicos.map(p => [
                p.descricao,
                p.quantidade.toString(),
                `R$ ${p.valorUnitario.toFixed(2)}`,
                `R$ ${(p.total || (p.quantidade * p.valorUnitario)).toFixed(2)}`
            ]),
            startY: y,
            theme: 'grid', // Um tema visualmente limpo
            styles: {
                fontSize: 9,
                cellPadding: 2
            },
            headStyles: {
                fillColor: [226, 0, 0], // Vermelho ARF para o cabeçalho
                textColor: 255,
                fontStyle: 'bold'
            },
            alternateRowStyles: {
                fillColor: [245, 245, 245]
            },
            margin: { left: 20, right: 20 }
        });
    }

    // --- Rodapé ---
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text("ARF Funilaria e Pintura - Rua Exemplo, 123 - Tel: (11) 99999-9999", centerX, pageHeight - 10, { align: 'center' });

    // --- Salvar o PDF ---
    doc.save(`OS_${os.numero}.pdf`);
}







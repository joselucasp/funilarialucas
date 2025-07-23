// Sistema de OS - Oficina Mecânica - Versão com Servidor
// Variáveis globais
let ordemServicos = [];
let usuarios = [];
let produtosServicos = [];
let usuarioLogado = null;
let proximoNumeroOS = 1;
let proximoIdProduto = 1;
let pecasOSEdicao = [];
let osAtualEdicao = null;
let pecasOSAtual = [];

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

// Verificar se há usuário logado (mantém localStorage para sessão)
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

// Realizar login (mantém localStorage para sessão)
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

// Logout (mantém localStorage para sessão)
function logout() {
    usuarioLogado = null;
    localStorage.removeItem('usuarioLogado');
    document.getElementById('nomeUsuario').textContent = '-';
    
    // Mostrar modal de login
    const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
    loginModal.show();
    
    mostrarAlerta('Logout realizado com sucesso!', 'info');
}

// Carregar dados do servidor (substitui localStorage)
async function carregarDados() {
    try {
        const response = await fetch('/api/dados');
        const data = await response.json();

        if (data.success) {
            ordemServicos = data.ordemServicos || [];
            produtosServicos = data.produtosServicos || [];
            
            // Calcular próximos IDs
            proximoNumeroOS = ordemServicos.length > 0 ? Math.max(...ordemServicos.map(os => os.numero), 0) + 1 : 1;
            proximoIdProduto = produtosServicos.length > 0 ? Math.max(...produtosServicos.map(p => p.id), 0) + 1 : 1;

            carregarOS();
            carregarUsuarios();
        } else {
            console.error('Erro ao carregar dados:', data.message);
            mostrarAlerta('Erro ao carregar dados do servidor.', 'danger');
        }
    } catch (error) {
        console.error('Erro ao conectar com o servidor:', error);
        mostrarAlerta('Erro de conexão com o servidor.', 'danger');
    }
}

// Salvar dados no servidor (substitui localStorage)
async function salvarDados() {
    try {
        const response = await fetch('/api/dados', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ordemServicos: ordemServicos,
                produtosServicos: produtosServicos
            }),
        });

        const result = await response.json();
        
        if (!result.success) {
            console.error('Erro ao salvar dados:', result.message);
            mostrarAlerta('Erro ao salvar dados no servidor.', 'danger');
        }
    } catch (error) {
        console.error('Erro ao conectar com o servidor:', error);
        mostrarAlerta('Erro de conexão. Não foi possível salvar os dados.', 'danger');
    }
}

// Salvar movimentação no servidor (substitui localStorage)
async function salvarMovimentacao(os, acao, detalhes = '') {
    const agora = new Date();
    const linha = `${formatarDataHora(agora.toISOString())} | OS #${os.numero} | ${os.cliente} | ${acao} | Usuário: ${usuarioLogado.nome} | ${detalhes}`;

    try {
        const response = await fetch('/api/movimentacao', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ linha: linha }),
        });

        const result = await response.json();
        
        if (!result.success) {
            console.error('Erro ao salvar movimentação:', result.message);
        }
    } catch (error) {
        console.error('Erro ao salvar movimentação:', error);
    }
}

// Adicionar nova OS
async function adicionarOS() {
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
    await salvarDados();
    await salvarMovimentacao(os, 'Abertura da OS');
    
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
            <td><span class="badge bg-${getStatusColor(os.status)}">${getStatusText(os.status)}</span></td>
            <td><span class="badge bg-${getPrioridadeColor(os.prioridade)}">${getPrioridadeText(os.prioridade)}</span></td>
            <td><strong>R$ ${totalGeral.toFixed(2)}</strong></td>
            <td>
                <button class="btn btn-sm btn-primary me-1" onclick="editarOS(${os.numero})" title="Editar">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-info me-1" onclick="verHistorico(${os.numero})" title="Histórico">
                    <i class="bi bi-clock-history"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="excluirOS(${os.numero})" title="Excluir">
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

// Carregar usuários (mantém localStorage para usuários locais)
function carregarUsuarios() {
    const usuariosSalvos = localStorage.getItem('usuarios');
    if (usuariosSalvos) {
        usuarios = JSON.parse(usuariosSalvos);
    }

    const tbody = document.getElementById('tabelaUsuarios');
    tbody.innerHTML = '';

    usuarios.forEach(usuario => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${usuario.nome}</td>
            <td><span class="badge bg-secondary">${usuario.perfil}</span></td>
            <td>
                <button class="btn btn-sm btn-danger" onclick="excluirUsuario('${usuario.nome}')">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Adicionar usuário (mantém localStorage)
function adicionarUsuario() {
    const nome = document.getElementById('nomeUsuarioNovo').value;
    const senha = document.getElementById('senhaUsuarioNovo').value;
    const perfil = document.getElementById('perfilUsuario').value;

    // Verificar se usuário já existe
    if (usuarios.find(u => u.nome === nome)) {
        mostrarAlerta('Usuário já existe!', 'warning');
        return;
    }

    const novoUsuario = {
        nome: nome,
        senha: senha,
        perfil: perfil
    };

    usuarios.push(novoUsuario);
    localStorage.setItem('usuarios', JSON.stringify(usuarios));
    
    document.getElementById('usuarioForm').reset();
    carregarUsuarios();
    
    mostrarAlerta('Usuário cadastrado com sucesso!', 'success');
}

// Excluir usuário (mantém localStorage)
function excluirUsuario(nome) {
    if (confirm(`Tem certeza que deseja excluir o usuário "${nome}"?`)) {
        usuarios = usuarios.filter(u => u.nome !== nome);
        localStorage.setItem('usuarios', JSON.stringify(usuarios));
        carregarUsuarios();
        mostrarAlerta('Usuário excluído com sucesso!', 'success');
    }
}

// Editar OS
function editarOS(numero) {
    const os = ordemServicos.find(o => o.numero === numero);
    if (!os) return;

    osAtualEdicao = os;
    pecasOSEdicao = [...(os.pecasServicos || [])];

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
    document.getElementById('editarCustoServico').value = os.custoServico || 0;

    atualizarTabelaPecasEdicao();
    calcularTotalGeralEdicao();

    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('editarOSModal'));
    modal.show();
}

// Salvar edição da OS
async function salvarEdicaoOS() {
    if (!osAtualEdicao) return;

    const custoServico = parseFloat(document.getElementById('editarCustoServico').value) || 0;
    const totalPecas = pecasOSEdicao.reduce((total, peca) => total + (peca.quantidade * peca.valorUnitario), 0);
    const totalGeral = custoServico + totalPecas;

    const statusAnterior = osAtualEdicao.status;
    const novoStatus = document.getElementById('editarStatus').value;

    // Atualizar OS
    const osIndex = ordemServicos.findIndex(o => o.numero === osAtualEdicao.numero);
    if (osIndex !== -1) {
        ordemServicos[osIndex] = {
            ...osAtualEdicao,
            cliente: document.getElementById('editarCliente').value,
            telefone: document.getElementById('editarTelefone').value,
            veiculo: document.getElementById('editarVeiculo').value,
            placa: document.getElementById('editarPlaca').value,
            problema: document.getElementById('editarProblema').value,
            status: novoStatus,
            prioridade: document.getElementById('editarPrioridade').value,
            observacoes: document.getElementById('editarObservacoes').value,
            custoServico: custoServico,
            pecasServicos: [...pecasOSEdicao],
            totalGeral: totalGeral
        };

        // Adicionar ao histórico
        const novaObservacao = document.getElementById('novaObservacao').value;
        let detalhesHistorico = `Dados atualizados. Total: R$ ${totalGeral.toFixed(2)}`;
        
        if (statusAnterior !== novoStatus) {
            detalhesHistorico += ` | Status alterado de "${getStatusText(statusAnterior)}" para "${getStatusText(novoStatus)}"`;
        }
        
        if (novaObservacao) {
            detalhesHistorico += ` | Nova observação: ${novaObservacao}`;
        }

        ordemServicos[osIndex].historico.push({
            data: new Date().toISOString(),
            usuario: usuarioLogado.nome,
            acao: 'Edição da OS',
            detalhes: detalhesHistorico
        });

        await salvarDados();
        await salvarMovimentacao(ordemServicos[osIndex], 'Edição da OS', detalhesHistorico);

        // Fechar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('editarOSModal'));
        modal.hide();

        carregarOS();
        atualizarEstatisticas();
        
        mostrarAlerta('OS atualizada com sucesso!', 'success');
    }
}

// Excluir OS
async function excluirOS(numero) {
    if (confirm(`Tem certeza que deseja excluir a OS #${numero}?`)) {
        const osIndex = ordemServicos.findIndex(o => o.numero === numero);
        if (osIndex !== -1) {
            const os = ordemServicos[osIndex];
            await salvarMovimentacao(os, 'Exclusão da OS', 'OS excluída do sistema');
            
            ordemServicos.splice(osIndex, 1);
            await salvarDados();
            
            carregarOS();
            atualizarEstatisticas();
            
            mostrarAlerta('OS excluída com sucesso!', 'success');
        }
    }
}

// Ver histórico da OS
function verHistorico(numero) {
    const os = ordemServicos.find(o => o.numero === numero);
    if (!os) return;

    const historicoContent = document.getElementById('historicoContent');
    historicoContent.innerHTML = '';

    if (os.historico && os.historico.length > 0) {
        os.historico.forEach(item => {
            const div = document.createElement('div');
            div.className = 'border-bottom pb-2 mb-2';
            div.innerHTML = `
                <div class="d-flex justify-content-between">
                    <strong>${item.acao}</strong>
                    <small class="text-muted">${formatarDataHora(item.data)}</small>
                </div>
                <div class="text-muted">Usuário: ${item.usuario}</div>
                <div>${item.detalhes}</div>
            `;
            historicoContent.appendChild(div);
        });
    } else {
        historicoContent.innerHTML = '<p class="text-muted">Nenhum histórico disponível.</p>';
    }

    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('historicoModal'));
    modal.show();
}

// Funções auxiliares para formatação
function formatarData(dataISO) {
    const data = new Date(dataISO);
    return data.toLocaleDateString('pt-BR');
}

function formatarDataHora(dataISO) {
    const data = new Date(dataISO);
    return data.toLocaleString('pt-BR');
}

function getStatusColor(status) {
    const cores = {
        'aberta': 'primary',
        'em_andamento': 'warning',
        'aguardando_pecas': 'info',
        'concluida': 'success',
        'cancelada': 'danger'
    };
    return cores[status] || 'secondary';
}

function getStatusText(status) {
    const textos = {
        'aberta': 'Aberta',
        'em_andamento': 'Em Andamento',
        'aguardando_pecas': 'Aguardando Peças',
        'concluida': 'Concluída',
        'cancelada': 'Cancelada'
    };
    return textos[status] || status;
}

function getPrioridadeColor(prioridade) {
    const cores = {
        'baixa': 'success',
        'media': 'warning',
        'alta': 'danger',
        'urgente': 'dark'
    };
    return cores[prioridade] || 'secondary';
}

function getPrioridadeText(prioridade) {
    const textos = {
        'baixa': 'Baixa',
        'media': 'Média',
        'alta': 'Alta',
        'urgente': 'Urgente'
    };
    return textos[prioridade] || prioridade;
}

// Mostrar alerta
function mostrarAlerta(mensagem, tipo) {
    // Criar elemento de alerta
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${tipo} alert-dismissible fade show position-fixed`;
    alertDiv.style.cssText = 'top: 80px; right: 20px; z-index: 9999; min-width: 300px;';
    alertDiv.innerHTML = `
        ${mensagem}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    document.body.appendChild(alertDiv);

    // Remover automaticamente após 5 segundos
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.parentNode.removeChild(alertDiv);
        }
    }, 5000);
}

// Funções para navegação entre seções
function showSection(sectionId) {
    // Ocultar todas as seções
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.style.display = 'none';
    });

    // Mostrar seção selecionada
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.style.display = 'block';
    }

    // Atualizar estatísticas se for a seção de lançar OS
    if (sectionId === 'lancar-os') {
        atualizarEstatisticas();
    }
}

function showFinanceiroSection(sectionId) {
    showSection(sectionId);
    atualizarRelatorioFinanceiro();
}

// Atualizar estatísticas
function atualizarEstatisticas() {
    const totalOS = ordemServicos.length;
    const osAbertas = ordemServicos.filter(os => os.status === 'aberta').length;
    const osAndamento = ordemServicos.filter(os => os.status === 'em_andamento').length;
    const osConcluidas = ordemServicos.filter(os => os.status === 'concluida').length;

    document.getElementById('totalOS').textContent = totalOS;
    document.getElementById('osAbertas').textContent = osAbertas;
    document.getElementById('osAndamento').textContent = osAndamento;
    document.getElementById('osConcluidas').textContent = osConcluidas;
}

// Filtrar OS
function filtrarOS() {
    const filtroStatus = document.getElementById('filtroStatus').value.toLowerCase();
    const filtroCliente = document.getElementById('filtroCliente').value.toLowerCase();
    const filtroVeiculo = document.getElementById('filtroVeiculo').value.toLowerCase();
    const filtroData = document.getElementById('filtroData').value;

    const tbody = document.getElementById('tabelaOS');
    const rows = tbody.querySelectorAll('tr');

    rows.forEach(row => {
        const status = row.cells[4].textContent.toLowerCase();
        const cliente = row.cells[2].textContent.toLowerCase();
        const veiculo = row.cells[3].textContent.toLowerCase();
        const data = row.cells[1].textContent;

        let mostrar = true;

        if (filtroStatus && !status.includes(filtroStatus)) {
            mostrar = false;
        }

        if (filtroCliente && !cliente.includes(filtroCliente)) {
            mostrar = false;
        }

        if (filtroVeiculo && !veiculo.includes(filtroVeiculo)) {
            mostrar = false;
        }

        if (filtroData) {
            const dataFormatada = new Date(filtroData).toLocaleDateString('pt-BR');
            if (!data.includes(dataFormatada)) {
                mostrar = false;
            }
        }

        row.style.display = mostrar ? '' : 'none';
    });
}

// Configurar eventos para peças/serviços
function configurarEventosPecas() {
    const buscaPeca = document.getElementById('buscaPeca');
    const sugestoesPecas = document.getElementById('sugestoesPecas');

    buscaPeca.addEventListener('input', function() {
        const termo = this.value.toLowerCase();
        
        if (termo.length < 2) {
            sugestoesPecas.style.display = 'none';
            return;
        }

        const sugestoes = produtosServicos.filter(produto => 
            produto.descricao.toLowerCase().includes(termo)
        );

        sugestoesPecas.innerHTML = '';
        
        if (sugestoes.length > 0) {
            sugestoes.forEach(produto => {
                const item = document.createElement('a');
                item.className = 'list-group-item list-group-item-action';
                item.href = '#';
                item.innerHTML = `
                    <div class="d-flex justify-content-between">
                        <span>${produto.descricao}</span>
                        <span class="text-muted">R$ ${produto.valor.toFixed(2)}</span>
                    </div>
                `;
                item.onclick = function(e) {
                    e.preventDefault();
                    selecionarProduto(produto);
                };
                sugestoesPecas.appendChild(item);
            });
            sugestoesPecas.style.display = 'block';
        } else {
            sugestoesPecas.style.display = 'none';
        }
    });

    // Ocultar sugestões ao clicar fora
    document.addEventListener('click', function(e) {
        if (!buscaPeca.contains(e.target) && !sugestoesPecas.contains(e.target)) {
            sugestoesPecas.style.display = 'none';
        }
    });
}

// Configurar eventos para edição de peças/serviços
function configurarEventosEdicaoPecas() {
    const editarBuscaPeca = document.getElementById('editarBuscaPeca');
    const editarSugestoesPecas = document.getElementById('editarSugestoesPecas');

    editarBuscaPeca.addEventListener('input', function() {
        const termo = this.value.toLowerCase();
        
        if (termo.length < 2) {
            editarSugestoesPecas.style.display = 'none';
            return;
        }

        const sugestoes = produtosServicos.filter(produto => 
            produto.descricao.toLowerCase().includes(termo)
        );

        editarSugestoesPecas.innerHTML = '';
        
        if (sugestoes.length > 0) {
            sugestoes.forEach(produto => {
                const item = document.createElement('a');
                item.className = 'list-group-item list-group-item-action';
                item.href = '#';
                item.innerHTML = `
                    <div class="d-flex justify-content-between">
                        <span>${produto.descricao}</span>
                        <span class="text-muted">R$ ${produto.valor.toFixed(2)}</span>
                    </div>
                `;
                item.onclick = function(e) {
                    e.preventDefault();
                    selecionarProdutoEdicao(produto);
                };
                editarSugestoesPecas.appendChild(item);
            });
            editarSugestoesPecas.style.display = 'block';
        } else {
            editarSugestoesPecas.style.display = 'none';
        }
    });

    // Ocultar sugestões ao clicar fora
    document.addEventListener('click', function(e) {
        if (!editarBuscaPeca.contains(e.target) && !editarSugestoesPecas.contains(e.target)) {
            editarSugestoesPecas.style.display = 'none';
        }
    });
}

// Selecionar produto para adicionar à OS
function selecionarProduto(produto) {
    document.getElementById('idProdutoSelecionado').value = produto.id;
    document.getElementById('descricaoSelecionada').value = produto.descricao;
    document.getElementById('valorUnitarioPeca').value = produto.valor;
    document.getElementById('quantidadePeca').value = 1;
    calcularTotalPeca();

    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('selecionarPecaModal'));
    modal.show();

    // Limpar busca
    document.getElementById('buscaPeca').value = '';
    document.getElementById('sugestoesPecas').style.display = 'none';
}

// Selecionar produto para edição da OS
function selecionarProdutoEdicao(produto) {
    document.getElementById('idProdutoSelecionado').value = produto.id;
    document.getElementById('descricaoSelecionada').value = produto.descricao;
    document.getElementById('valorUnitarioPeca').value = produto.valor;
    document.getElementById('quantidadePeca').value = 1;
    calcularTotalPeca();

    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('selecionarPecaModal'));
    modal.show();

    // Limpar busca
    document.getElementById('editarBuscaPeca').value = '';
    document.getElementById('editarSugestoesPecas').style.display = 'none';
}

// Calcular total da peça
function calcularTotalPeca() {
    const quantidade = parseFloat(document.getElementById('quantidadePeca').value) || 0;
    const valorUnitario = parseFloat(document.getElementById('valorUnitarioPeca').value) || 0;
    const total = quantidade * valorUnitario;
    document.getElementById('totalPeca').value = total.toFixed(2);
}

// Adicionar peça à OS
function adicionarPecaOS() {

    const editarOSId = parseFloat(document.getElementById('editarOSId').value) || 0;
    const idProduto = document.getElementById('idProdutoSelecionado').value;
    const descricao = document.getElementById('descricaoSelecionada').value;
    const quantidade = parseFloat(document.getElementById('quantidadePeca').value) || 0;
    const valorUnitario = parseFloat(document.getElementById('valorUnitarioPeca').value) || 0;

    if (!descricao || quantidade <= 0 || valorUnitario <= 0) {
        mostrarAlerta('Preencha todos os campos corretamente!', 'warning');
        return;
    }


    if (editarOSId > 0){

        const pecaExistenteEdicao = pecasOSEdicao.find(p => p.idProduto === idProduto);
         
         if (pecaExistenteEdicao) {
             // Atualizar quantidade se já existe
             pecaExistenteEdicao.quantidade += quantidade;
         } else {
             // Adicionar nova peça
             pecasOSEdicao.push({
                 idProduto: idProduto,
                 descricao: descricao,
                 quantidade: quantidade,
                 valorUnitario: valorUnitario
             });
         }
     
         atualizarTabelaPecasEdicao();
         calcularTotalGeralEdicao();


    }
    else{

    
     
         const pecaExistente = pecasOSAtual.find(p => p.idProduto === idProduto);
         
         if (pecaExistente) {
             // Atualizar quantidade se já existe
             pecaExistente.quantidade += quantidade;
         } else {
             // Adicionar nova peça
             pecasOSAtual.push({
                 idProduto: idProduto,
                 descricao: descricao,
                 quantidade: quantidade,
                 valorUnitario: valorUnitario
             });
         }
     
         atualizarTabelaPecasOS();
         calcularTotalGeral();
    }

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
        const total = peca.quantidade * peca.valorUnitario;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${peca.descricao}</td>
            <td>${peca.quantidade}</td>
            <td>R$ ${peca.valorUnitario.toFixed(2)}</td>
            <td>R$ ${total.toFixed(2)}</td>
            <td>
                <button class="btn btn-sm btn-danger" onclick="removerPecaOS(${index})">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Atualizar tabela de peças da edição
function atualizarTabelaPecasEdicao() {
    const tbody = document.getElementById('editarTabelaPecasOS');
    tbody.innerHTML = '';

    pecasOSEdicao.forEach((peca, index) => {
        const total = peca.quantidade * peca.valorUnitario;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${peca.descricao}</td>
            <td>${peca.quantidade}</td>
            <td>R$ ${peca.valorUnitario.toFixed(2)}</td>
            <td>R$ ${total.toFixed(2)}</td>
            <td>
                <button class="btn btn-sm btn-danger" onclick="removerPecaEdicao(${index})">
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
}

// Remover peça da edição
function removerPecaEdicao(index) {
    pecasOSEdicao.splice(index, 1);
    atualizarTabelaPecasEdicao();
    calcularTotalGeralEdicao();
}

// Calcular total geral da OS
function calcularTotalGeral() {
    const custoServico = parseFloat(document.getElementById('custoServico').value) || 0;
    const totalPecas = pecasOSAtual.reduce((total, peca) => total + (peca.quantidade * peca.valorUnitario), 0);
    const totalGeral = custoServico + totalPecas;
    
    document.getElementById('totalGeral').value = totalGeral.toFixed(2);
}

// Calcular total geral da edição
function calcularTotalGeralEdicao() {
    const custoServico = parseFloat(document.getElementById('editarCustoServico').value) || 0;
    const totalPecas = pecasOSEdicao.reduce((total, peca) => total + (peca.quantidade * peca.valorUnitario), 0);
    const totalGeral = custoServico + totalPecas;
    
    document.getElementById('editarTotalGeral').value = totalGeral.toFixed(2);
}

// Eventos para recalcular total
document.addEventListener('DOMContentLoaded', function() {
    const custoServico = document.getElementById('custoServico');
    const editarCustoServico = document.getElementById('editarCustoServico');
    const quantidadePeca = document.getElementById('quantidadePeca');
    const valorUnitarioPeca = document.getElementById('valorUnitarioPeca');

    if (custoServico) {
        custoServico.addEventListener('input', calcularTotalGeral);
    }
    
    if (editarCustoServico) {
        editarCustoServico.addEventListener('input', calcularTotalGeralEdicao);
    }
    
    if (quantidadePeca) {
        quantidadePeca.addEventListener('input', calcularTotalPeca);
    }
    
    if (valorUnitarioPeca) {
        valorUnitarioPeca.addEventListener('input', calcularTotalPeca);
    }
});

// Abrir modal para novo produto
function abrirModalNovoProduto() {
    document.getElementById('novoProdutoForm').reset();
    const modal = new bootstrap.Modal(document.getElementById('novoProdutoModal'));
    modal.show();
}

// Salvar novo produto
async function salvarNovoProduto() {
    const descricao = document.getElementById('descricaoProduto').value;
    const tipo = document.getElementById('tipoProduto').value;
    const valor = parseFloat(document.getElementById('valorProduto').value);
    const observacoes = document.getElementById('observacoesProduto').value;

    if (!descricao || valor <= 0) {
        mostrarAlerta('Preencha todos os campos obrigatórios!', 'warning');
        return;
    }

    const novoProduto = {
        id: proximoIdProduto++,
        descricao: descricao,
        tipo: tipo,
        valor: valor,
        observacoes: observacoes
    };

    produtosServicos.push(novoProduto);
    await salvarDados();

    // Fechar modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('novoProdutoModal'));
    modal.hide();

    mostrarAlerta('Produto/serviço cadastrado com sucesso!', 'success');
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
        getStatusText(os.status),
        getPrioridadeText(os.prioridade),
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
        ["Status:", getStatusText(os.status)],
       ["Prioridade:", getPrioridadeText(os.prioridade)],
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







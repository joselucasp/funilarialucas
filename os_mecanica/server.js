// Servidor Node.js para Sistema de OS - Oficina Mecânica
const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Caminhos dos arquivos
const OS_FILE = path.join(__dirname, 'data', 'os.json');
const PRODUTOS_FILE = path.join(__dirname, 'data', 'produtos_servicos.json');
const MOVIMENTACOES_FILE = path.join(__dirname, 'data', 'movimentacoes.txt');

// Função auxiliar para ler arquivos JSON
async function lerArquivoJSON(caminho, valorPadrao = []) {
    try {
        const conteudo = await fs.readFile(caminho, 'utf-8');
        return JSON.parse(conteudo);
    } catch (error) {
        console.log(`Arquivo ${caminho} não encontrado ou inválido, usando valor padrão.`);
        return valorPadrao;
    }
}

// Função auxiliar para escrever arquivos JSON
async function escreverArquivoJSON(caminho, dados) {
    await fs.writeFile(caminho, JSON.stringify(dados, null, 2), 'utf-8');
}

// Rota para obter todos os dados iniciais
app.get('/api/dados', async (req, res) => {
    try {
        const ordemServicos = await lerArquivoJSON(OS_FILE, []);
        const produtosServicos = await lerArquivoJSON(PRODUTOS_FILE, []);
        
        res.json({ 
            ordemServicos, 
            produtosServicos,
            success: true 
        });
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        res.status(500).json({ 
            message: 'Erro no servidor ao carregar dados.',
            success: false 
        });
    }
});

// Rota para salvar ordens de serviço
app.post('/api/os', async (req, res) => {
    try {
        const { ordemServicos } = req.body;
        
        if (!ordemServicos || !Array.isArray(ordemServicos)) {
            return res.status(400).json({ 
                message: 'Dados de ordens de serviço inválidos.',
                success: false 
            });
        }

        await escreverArquivoJSON(OS_FILE, ordemServicos);
        
        res.json({ 
            message: 'Ordens de serviço salvas com sucesso!',
            success: true 
        });
    } catch (error) {
        console.error('Erro ao salvar ordens de serviço:', error);
        res.status(500).json({ 
            message: 'Erro no servidor ao salvar ordens de serviço.',
            success: false 
        });
    }
});

// Rota para salvar produtos e serviços
app.post('/api/produtos', async (req, res) => {
    try {
        const { produtosServicos } = req.body;
        
        if (!produtosServicos || !Array.isArray(produtosServicos)) {
            return res.status(400).json({ 
                message: 'Dados de produtos/serviços inválidos.',
                success: false 
            });
        }

        await escreverArquivoJSON(PRODUTOS_FILE, produtosServicos);
        
        res.json({ 
            message: 'Produtos/serviços salvos com sucesso!',
            success: true 
        });
    } catch (error) {
        console.error('Erro ao salvar produtos/serviços:', error);
        res.status(500).json({ 
            message: 'Erro no servidor ao salvar produtos/serviços.',
            success: false 
        });
    }
});

// Rota para salvar todos os dados de uma vez
app.post('/api/dados', async (req, res) => {
    try {
        const { ordemServicos, produtosServicos } = req.body;

        // Salva os dados nos arquivos JSON
        if (ordemServicos && Array.isArray(ordemServicos)) {
            await escreverArquivoJSON(OS_FILE, ordemServicos);
        }
        
        if (produtosServicos && Array.isArray(produtosServicos)) {
            await escreverArquivoJSON(PRODUTOS_FILE, produtosServicos);
        }

        res.json({ 
            message: 'Dados salvos com sucesso!',
            success: true 
        });
    } catch (error) {
        console.error('Erro ao salvar dados:', error);
        res.status(500).json({ 
            message: 'Erro no servidor ao salvar dados.',
            success: false 
        });
    }
});

// Rota para registrar movimentação
app.post('/api/movimentacao', async (req, res) => {
    try {
        const { linha } = req.body;
        
        if (!linha || typeof linha !== 'string') {
            return res.status(400).json({ 
                message: 'Dados de movimentação inválidos.',
                success: false 
            });
        }

        // Adiciona a nova linha ao final do arquivo
        await fs.appendFile(MOVIMENTACOES_FILE, linha + '\n');
        
        res.json({ 
            message: 'Movimentação registrada com sucesso!',
            success: true 
        });
    } catch (error) {
        console.error('Erro ao salvar movimentação:', error);
        res.status(500).json({ 
            message: 'Erro no servidor ao salvar movimentação.',
            success: false 
        });
    }
});

// Rota para obter movimentações
app.get('/api/movimentacoes', async (req, res) => {
    try {
        const conteudo = await fs.readFile(MOVIMENTACOES_FILE, 'utf-8');
        const linhas = conteudo.split('\n').filter(linha => linha.trim() && !linha.startsWith('#'));
        
        res.json({ 
            movimentacoes: linhas,
            success: true 
        });
    } catch (error) {
        console.error('Erro ao ler movimentações:', error);
        res.json({ 
            movimentacoes: [],
            success: true 
        });
    }
});

// Rota para servir o arquivo HTML principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
    console.log('Sistema de OS - Oficina Mecânica');
    console.log('Pressione Ctrl+C para parar o servidor');
});

// Tratamento de erros não capturados
process.on('uncaughtException', (error) => {
    console.error('Erro não capturado:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Promise rejeitada não tratada:', reason);
});


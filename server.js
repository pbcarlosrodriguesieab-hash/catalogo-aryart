import express from 'express';
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express(); 

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Conexão com o Banco de Dados SQLite
const db = new sqlite3.Database('./banco_aryart.db', (err) => {
    if (err) console.error('Erro ao abrir banco:', err.message);
    else console.log('Banco de dados SQLite Conectado!');
});

// Criação automática de todas as tabelas necessárias do catálogo
db.serialize(() => {
    // 1. Tabela para guardar o WhatsApp de atendimento e os títulos da loja
    db.run(`CREATE TABLE IF NOT EXISTS configuracoes (
        id INTEGER PRIMARY KEY,
        whatsapp TEXT,
        titulo TEXT,
        subtitulo TEXT
    )`);

    // 2. Tabela para salvar as Abas/Categorias dinâmicas
    db.run(`CREATE TABLE IF NOT EXISTS abas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT UNIQUE
    )`);

    // 3. Tabela para salvar os Produtos do catálogo com até 6 fotos
    db.run(`CREATE TABLE IF NOT EXISTS produtos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT,
        aba TEXT,
        preco REAL,
        imgs TEXT
    )`);

    // Configuração inicial padrão para o site não iniciar em branco no primeiro acesso
    db.get("SELECT COUNT(*) as qtd FROM configuracoes", [], (err, row) => {
        if (row && row.qtd === 0) {
            db.run("INSERT INTO configuracoes (id, whatsapp, titulo, subtitulo) VALUES (1, '5511977534671', 'Ary Art', 'Seu catálogo de sublimação.')");
        }
    });
});

// --- ROTAS DA API PARA CONFIGURAÇÕES GERAIS ---
app.get('/api/config', (req, res) => {
    db.get("SELECT * FROM configuracoes WHERE id = 1", [], (err, row) => {
        res.json(row || { whatsapp: '5511977534671', titulo: 'Ary Art', subtitulo: 'Seu catálogo de sublimação.' });
    });
});

app.post('/api/config', (req, res) => {
    const { whatsapp, titulo, subtitulo } = req.body;
    db.run("UPDATE configuracoes SET whatsapp = ?, titulo = ?, subtitulo = ? WHERE id = 1", [whatsapp, titulo, subtitulo], function(err) {
        if (err) return res.status(500).json({ erro: err.message });
        res.json({ sucesso: true });
    });
});

// --- ROTAS DA API FOR GERENCIAR AS ABAS (CATEGORIAS) ---
app.get('/api/abas', (req, res) => {
    db.all("SELECT nome FROM abas", [], (err, rows) => {
        if (err) return res.status(500).json({ erro: err.message });
        let lista = [];
        if (rows) rows.forEach(r => lista.push(r.nome));
        res.json(lista);
    });
});

app.post('/api/abas', (req, res) => {
    const { nome } = req.body;
    db.run("INSERT OR IGNORE INTO abas (nome) VALUES (?)", [nome], function(err) {
        if (err) return res.status(500).json({ erro: err.message });
        res.json({ sucesso: true });
    });
});

app.delete('/api/abas/:nome', (req, res) => {
    db.run("DELETE FROM abas WHERE nome = ?", [req.params.nome], function(err) {
        if (err) return res.status(500).json({ erro: err.message });
        res.json({ sucesso: true });
    });
});

// --- ROTAS DA API PARA GERENCIAR PRODUTOS ---
app.get('/api/produtos', (req, res) => {
    db.all("SELECT * FROM produtos ORDER BY id DESC", [], (err, rows) => {
        if (err) return res.status(500).json({ erro: err.message });
        res.json(rows || []);
    });
});

app.post('/api/produtos', (req, res) => {
    const { nome, aba, preco, imgs } = req.body;
    db.run("INSERT INTO produtos (nome, aba, preco, imgs) VALUES (?, ?, ?, ?)", [nome, aba, preco, imgs], function(err) {
        if (err) return res.status(500).json({ erro: err.message });
        res.json({ sucesso: true, id: this.lastID });
    });
});

app.delete('/api/produtos/:id', (req, res) => {
    db.run("DELETE FROM produtos WHERE id = ?", [req.params.id], function(err) {
        if (err) return res.status(500).json({ erro: err.message });
        res.json({ sucesso: true });
    });
});

// LIGA O SERVIDOR (Porta adaptada para rodar no seu PC ou na Internet automaticamente)
const PORTA = process.env.PORT || 3000;
app.listen(PORTA, '0.0.0.0', () => {
    console.log('\n======================================');
    console.log('SISTEMA ARY ART ATUALIZADO COM SUCESSO!');
    console.log(`Servidor rodando em: http://localhost:${PORTA}`);
    console.log('======================================\n');
});

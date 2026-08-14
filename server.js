const express = require('express');
const cors = require('cors');
const path = require('path');
const { createClient } = require('@libsql/client');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, '.')));

const db = createClient({
    url: (process.env.TURSO_DATABASE_URL || "").trim(),
    authToken: (process.env.TURSO_AUTH_TOKEN || "").trim()
});

async function iniciarBanco() {
    await db.execute(`CREATE TABLE IF NOT EXISTS produtos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        preco REAL NOT NULL,
        categoria_id TEXT NOT NULL,
        subcategoria_id TEXT NOT NULL,
        imagens TEXT,
        descricao TEXT,
        link_pagamento TEXT
    )`);
    await db.execute(`CREATE TABLE IF NOT EXISTS pedidos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cliente TEXT,
        contato TEXT,
        observacoes TEXT,
        itens TEXT,
        total REAL,
        criado_em TEXT
    )`);
    console.log("Banco de dados na nuvem (Turso) conectado com sucesso!");
}
iniciarBanco().catch(err => console.error("Erro ao conectar no banco:", err));

app.get('/api/produtos', async (req, res) => {
    try {
        const result = await db.execute("SELECT * FROM produtos");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ erro: err.message });
    }
});

app.post('/api/produtos', async (req, res) => {
    const { nome, preco, categoria_id, subcategoria_id, imagens, link_pagamento } = req.body;
    try {
        const result = await db.execute({
            sql: "INSERT INTO produtos (nome, preco, categoria_id, subcategoria_id, imagens, descricao, link_pagamento) VALUES (?, ?, ?, ?, ?, ?, ?)",
            args: [nome, preco, categoria_id, subcategoria_id, imagens || "[]", "", link_pagamento || ""]
        });
        res.json({ id: Number(result.lastInsertRowid) });
    } catch (err) {
        res.status(500).json({ erro: err.message });
    }
});

app.delete('/api/produtos/:id', async (req, res) => {
    try {
        await db.execute({ sql: "DELETE FROM produtos WHERE id = ?", args: [req.params.id] });
        res.json({ mensagem: "Removido" });
    } catch (err) {
        res.status(500).json({ erro: err.message });
    }
});

// ===== ROTAS DE PEDIDOS =====
app.get('/api/pedidos', async (req, res) => {
    try {
        const result = await db.execute("SELECT * FROM pedidos ORDER BY id DESC");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ erro: err.message });
    }
});

app.post('/api/pedidos', async (req, res) => {
    const { cliente, contato, observacoes, itens, total } = req.body;
    try {
        const result = await db.execute({
            sql: "INSERT INTO pedidos (cliente, contato, observacoes, itens, total, criado_em) VALUES (?, ?, ?, ?, ?, ?)",
            args: [cliente || "", contato || "", observacoes || "", JSON.stringify(itens || []), total || 0, new Date().toLocaleString('pt-BR')]
        });
        res.json({ id: Number(result.lastInsertRowid) });
    } catch (err) {
        res.status(500).json({ erro: err.message });
    }
});

app.delete('/api/pedidos/:id', async (req, res) => {
    try {
        await db.execute({ sql: "DELETE FROM pedidos WHERE id = ?", args: [req.params.id] });
        res.json({ mensagem: "Removido" });
    } catch (err) {
        res.status(500).json({ erro: err.message });
    }
});

app.get('/index.html', (req, res) => { res.sendFile(path.join(__dirname, 'index.html')); });
app.get('/', (req, res) => { res.sendFile(path.join(__dirname, 'index.html')); });

app.listen(PORT, () => { console.log(`Servidor rodando na porta ${PORT}`); });

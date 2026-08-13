const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, '.')));

const caminhoBanco = './banco_aryart_v3.db';

const db = new sqlite3.Database(caminhoBanco, (err) => {
    if (err) {
        console.error("Erro ao abrir o banco de dados:", err.message);
    } else {
        console.log("Banco de dados SQLite Conectado com sucesso!");
        criarTabelas();
    }
});

function criarTabelas() {
    db.run(`CREATE TABLE IF NOT EXISTS produtos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        preco REAL NOT NULL,
        categoria_id TEXT NOT NULL,
        subcategoria_id TEXT NOT NULL,
        imagens TEXT,
        descricao TEXT
    )`, function() {
        // Adiciona a coluna nova de link de pagamento (sem apagar os produtos antigos)
        db.run("ALTER TABLE produtos ADD COLUMN link_pagamento TEXT", () => {});
    });
}

app.get('/api/produtos', (req, res) => {
    db.all("SELECT * FROM produtos", [], (err, rows) => {
        if (err) return res.status(500).json({ erro: err.message });
        res.json(rows);
    });
});

app.post('/api/produtos', (req, res) => {
    const { nome, preco, categoria_id, subcategoria_id, imagens, link_pagamento } = req.body;

    db.run(
        "INSERT INTO produtos (nome, preco, categoria_id, subcategoria_id, imagens, descricao, link_pagamento) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [nome, preco, categoria_id, subcategoria_id, imagens || "[]", "", link_pagamento || ""],
        function(err) {
            if (err) return res.status(500).json({ erro: err.message });
            res.json({ id: this.lastID });
        }
    );
});

app.delete('/api/produtos/:id', (req, res) => {
    const { id } = req.params;
    db.run("DELETE FROM produtos WHERE id = ?", [id], function(err) {
        if (err) return res.status(500).json({ erro: err.message });
        res.json({ mensagem: "Removido" });
    });
});

app.get('/index.html', (req, res) => { res.sendFile(path.join(__dirname, 'index.html')); });
app.get('/', (req, res) => { res.sendFile(path.join(__dirname, 'index.html')); });

app.listen(PORT, () => { console.log(`Servidor rodando na porta ${PORT}`); });

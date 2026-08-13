 const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '.')));

// Usando o banco definitivo e limpo v3
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
    )`);
}

// ROTA DE BUSCA: Entrega os produtos salvos para a vitrine
app.get('/api/produtos', (req, res) => {
    db.all("SELECT * FROM produtos", [], (err, rows) => {
        if (err) return res.status(500).json({ erro: err.message });
        res.json(rows);
    });
});

// ROTA DE CADASTRO: Grava o produto exatamente como texto simples enviado pelo admin
app.post('/api/produtos', (req, res) => {
    const { nome, preco, categoria_id, subcategoria_id, imagens } = req.body;

    db.run(
        "INSERT INTO produtos (nome, preco, categoria_id, subcategoria_id, imagens, descricao) VALUES (?, ?, ?, ?, ?, ?)",
        [nome, preco, categoria_id, subcategoria_id, imagens || "", ""],
        function(err) {
            if (err) return res.status(500).json({ erro: err.message });
            res.json({ id: this.lastID, nome, preco, categoria_id, subcategoria_id, imagens });
        }
    );
});

// ROTA DE EXCLUSÃO
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

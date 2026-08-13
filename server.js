const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '.')));

// Como estamos no plano grátis, salvamos na pasta atual do servidor
const caminhoBanco = './banco_aryart.db';

const db = new sqlite3.Database(caminhoBanco, (err) => {
    if (err) {
        console.error("Erro ao abrir o banco de dados:", err.message);
    } else {
        console.log("Banco de dados SQLite Conectado!");
        criarTabelas();
    }
});

function criarTabelas() {
    // 1. Cria a gaveta de categorias
    db.run(`CREATE TABLE IF NOT EXISTS categorias (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL UNIQUE
    )`, () => {
        // AQUI ESTÁ O TRUQUE: O servidor vai tentar criar as suas abas automaticamente se elas sumirem
        // Você pode mudar os nomes dentro dos parênteses ou adicionar novos separados por vírgula!
        const abasPadrao = ["Canecas", "Camisetas", "Almofadas", "Chaveiros"];
        abasPadrao.forEach(nomeAba => {
            db.run("INSERT OR IGNORE INTO categorias (nome) VALUES (?)", [nomeAba]);
        });
    });

    // 2. Cria a gaveta de produtos
    db.run(`CREATE TABLE IF NOT EXISTS produtos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        preco REAL NOT NULL,
        categoria_id INTEGER,
        imagens TEXT,
        descricao TEXT,
        FOREIGN KEY (categoria_id) REFERENCES categorias(id)
    )`);
}

// --- ROTAS DO SISTEMA ---
app.get('/api/categorias', (req, res) => {
    db.all("SELECT * FROM categorias", [], (err, rows) => {
        if (err) return res.status(500).json({ erro: err.message });
        res.json(rows);
    });
});

app.post('/api/categorias', (req, res) => {
    const { nome } = req.body;
    db.run("INSERT OR IGNORE INTO categorias (nome) VALUES (?)", [nome], function(err) {
        if (err) return res.status(500).json({ erro: err.message });
        res.json({ id: this.lastID, nome });
    });
});

app.get('/api/produtos', (req, res) => {
    db.all("SELECT * FROM produtos", [], (err, rows) => {
        if (err) return res.status(500).json({ erro: err.message });
        const produtosFormatados = rows.map(p => ({
            ...p,
            imagens: JSON.parse(p.imagens || '[]')
        }));
        res.json(produtosFormatados);
    });
});

app.post('/api/produtos', (req, res) => {
    const { nome, preco, categoria_id, imagens, descricao } = req.body;
    const imagensString = JSON.stringify(imagens || []);

    db.run(
        "INSERT INTO produtos (nome, preco, categoria_id, imagens, descricao) VALUES (?, ?, ?, ?, ?)",
        [nome, preco, categoria_id, imagensString, descricao || ""],
        function(err) {
            if (err) return res.status(500).json({ erro: err.message });
            res.json({ id: this.lastID, nome, preco, categoria_id, imagens });
        }
    );
});

app.delete('/api/produtos/:id', (req, res) => {
    const { id } = req.params;
    db.run("DELETE FROM produtos WHERE id = ?", [id], function(err) {
        if (err) return res.status(500).json({ erro: err.message });
        res.json({ mensagem: "Produto removido com sucesso", alteracoes: this.changes });
    });
});

console.log("SISTEMA ARY ART ATUALIZADO COM SUCESSO!");

app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});

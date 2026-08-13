const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '.')));

// IMPORTANTE: Mudamos para v3 para forçar o banco de dados a criar as abas novas sem erros
const caminhoBanco = './banco_aryart_v3.db';

const db = new sqlite3.Database(caminhoBanco, (err) => {
    if (err) {
        console.error("Erro ao abrir o banco de dados:", err.message);
    } else {
        console.log("Banco de dados SQLite Conectado!");
        criarTabelas();
    }
});

function criarTabelas() {
    // 1. Cria e preenche as abas principais
    db.run(`CREATE TABLE IF NOT EXISTS categorias (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL UNIQUE
    )`, () => {
        const abasPrincipais = ["Bags", "Chinelos", "Lembrancinhas", "Azulejos", "Canecas", "Camisetas", "Almofadas", "Chaveiros", "Outros"];
        abasPrincipais.forEach(nome => {
            db.run("INSERT OR IGNORE INTO categorias (nome) VALUES (?)", [nome]);
        });
    });

    // 2. Cria e preenche os submenus
    db.run(`CREATE TABLE IF NOT EXISTS subcategorias (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL UNIQUE
    )`, () => {
        const submenus = ["Times", "Datas Comemorativas", "Profissões", "Diversas", "Novidades"];
        submenus.forEach(nome => {
            db.run("INSERT OR IGNORE INTO subcategorias (nome) VALUES (?)", [nome]);
        });
    });

    // 3. Cria a tabela de produtos
    db.run(`CREATE TABLE IF NOT EXISTS produtos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        preco REAL NOT NULL,
        categoria_id INTEGER,
        subcategoria_id INTEGER,
        imagens TEXT,
        descricao TEXT,
        FOREIGN KEY (categoria_id) REFERENCES categorias(id),
        FOREIGN KEY (subcategoria_id) REFERENCES subcategorias(id)
    )`);
}

// --- ROTAS DA API ---
app.get('/api/categorias', (req, res) => {
    db.all("SELECT * FROM categorias", [], (err, rows) => {
        if (err) return res.status(500).json({ erro: err.message });
        res.json(rows);
    });
});

app.get('/api/subcategorias', (req, res) => {
    db.all("SELECT * FROM subcategorias", [], (err, rows) => {
        if (err) return res.status(500).json({ erro: err.message });
        res.json(rows);
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
    const { nome, preco, categoria_id, subcategoria_id, imagens, descricao } = req.body;
    const imagensString = JSON.stringify(imagens || []);

    db.run(
        "INSERT INTO produtos (nome, preco, categoria_id, subcategoria_id, imagens, descricao) VALUES (?, ?, ?, ?, ?, ?)",
        [nome, preco, categoria_id, subcategoria_id, imagensString, descricao || ""],
        function(err) {
            if (err) return res.status(500).json({ erro: err.message });
            res.json({ id: this.lastID, nome, preco, categoria_id, subcategoria_id, imagens });
        }
    );
});

app.delete('/api/produtos/:id', (req, res) => {
    const { id } = req.params;
    db.run("DELETE FROM produtos WHERE id = ?", [id], function(err) {
        if (err) return res.status(500).json({ erro: err.message });
        res.json({ mensagem: "Produto removido com sucesso" });
    });
});

app.get('/index.html', (req, res) => { res.sendFile(path.join(__dirname, 'index.html')); });
app.get('/', (req, res) => { res.sendFile(path.join(__dirname, 'index.html')); });

app.listen(PORT, () => { console.log(`Servidor rodando na porta ${PORT}`); });

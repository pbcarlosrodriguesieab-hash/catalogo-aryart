 const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '.')));

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
    // 1. Tabela de Abas Principais
    db.run(`CREATE TABLE IF NOT EXISTS categorias (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL UNIQUE
    )`, () => {
        // Cadastra as abas principais que você pediu
        const abasPrincipais = ["Bags", "Chinelos", "Lembrancinhas", "Azulejos", "Canecas", "Camisetas", "Almofadas", "Chaveiros", "Outros"];
        abasPrincipais.forEach(nome => {
            db.run("INSERT OR IGNORE INTO categorias (nome) VALUES (?)", [nome]);
        });
    });

    // 2. Tabela de Submenus
    db.run(`CREATE TABLE IF NOT EXISTS subcategorias (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL UNIQUE
    )`, () => {
        // Cadastra os submenus que vão servir para todas as abas
        const submenus = ["Times", "Datas Comemorativas", "Profissões", "Diversas", "Novidades"];
        submenus.forEach(nome => {
            db.run("INSERT OR IGNORE INTO subcategorias (nome) VALUES (?)", [nome]);
        });
    });

    // 3. Tabela de Produtos (Agora aceita categoria_id E subcategoria_id)
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

// Pegar Abas Principais
app.get('/api/categorias', (req, res) => {
    db.all("SELECT * FROM categorias", [], (err, rows) => {
        if (err) return res.status(500).json({ erro: err.message });
        res.json(rows);
    });
});

// Pegar Submenus
app.get('/api/subcategorias', (req, res) => {
    db.all("SELECT * FROM subcategorias", [], (err, rows) => {
        if (err) return res.status(500).json({ erro: err.message });
        res.json(rows);
    });
});

// Pegar Produtos
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

// Cadastrar Produto
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

// Excluir Produto
app.delete('/api/produtos/:id', (req, res) => {
    const { id } = req.params;
    db.run("DELETE FROM produtos WHERE id = ?", [id], function(err) {
        if (err) return res.status(500).json({ erro: err.message });
        res.json({ mensagem: "Produto removido com sucesso" });
    });
});

app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});

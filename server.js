 const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Configurações para ler dados e aceitar conexões
app.use(cors());
app.use(express.json());

// AQUI ESTÁ O AJUSTE: Diz ao servidor para procurar as páginas (index e admin) soltas na pasta principal
app.use(express.static(path.join(__dirname, '.')));

// Conectar ao banco de dados definitivo (arquivo banco_aryart.db)
const db = new sqlite3.Database('./banco_aryart.db', (err) => {
    if (err) {
        console.error("Erro ao abrir o banco de dados:", err.message);
    } else {
        console.log("Banco de dados SQLite Conectado com sucesso!");
        criarTabelas();
    }
});

// Criando as gavetas do banco de dados se elas não existirem
function criarTabelas() {
    db.run(`CREATE TABLE IF NOT EXISTS categorias (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL UNIQUE
    )`);

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

// --- ROTAS DO SISTEMA (Comunicação com o Painel Admin e Vitrine) ---

// 1. Buscar todas as categorias/abas
app.get('/api/categorias', (req, res) => {
    db.all("SELECT * FROM categorias", [], (err, rows) => {
        if (err) return res.status(500).json({ erro: err.message });
        res.json(rows);
    });
});

// 2. Rota extra de segurança para abas
app.get('/api/abas', (req, res) => {
    db.all("SELECT * FROM categorias", [], (err, rows) => {
        if (err) return res.status(500).json({ erro: err.message });
        res.json(rows);
    });
});

// 3. Salvar uma nova categoria/aba
app.post('/api/categorias', (req, res) => {
    const { nome } = req.body;
    db.run("INSERT OR IGNORE INTO categorias (nome) VALUES (?)", [nome], function(err) {
        if (err) return res.status(500).json({ erro: err.message });
        res.json({ id: this.lastID, nome });
    });
});

// 4. Buscar todos os produtos salvos
app.get('/api/produtos', (req, res) => {
    db.all("SELECT * FROM produtos", [], (err, rows) => {
        if (err) return res.status(500).json({ erro: err.message });
        // Converte o formato do texto de volta para lista de imagens
        const produtosFormatados = rows.map(p => ({
            ...p,
            imagens: JSON.parse(p.imagens || '[]')
        }));
        res.json(produtosFormatados);
    });
});

// 5. Salvar um produto novo no SQLite
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

console.log("SISTEMA ARY ART ATUALIZADO COM SUCESSO!");

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});

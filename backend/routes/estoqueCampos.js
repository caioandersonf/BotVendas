// routes/estoqueCampos.js
const express = require("express");
const mysql = require("mysql2/promise");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Pasta de uploads
const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Configuração do multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

router.get("/campos", async (req, res) => {
    const banco_dados = req.query.banco_dados;

    if (!banco_dados) {
        return res.status(400).json({ error: "Banco de dados não informado" });
    }

    try {
        const conn = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: banco_dados
        });

        const [columns] = await conn.query("SHOW COLUMNS FROM estoque");

        // Filtro básico (ignorar colunas de controle)
        const campos = columns
            .filter(col => !["id", "criado_em"].includes(col.Field))
            .map(col => ({
                nome: col.Field,
                tipo: col.Type
            }));

        await conn.end();
        return res.json(campos);
    } catch (err) {
        console.error("Erro ao buscar campos do estoque:", err);
        return res.status(500).json({ error: "Erro ao buscar campos do estoque" });
    }
});

router.post("/", upload.single("imagem"), async (req, res) => {
    const { banco_dados, ...item } = req.body;

    if (!banco_dados) return res.status(400).json({ error: "Banco de dados não informado" });

    // Adiciona nome do arquivo da imagem, se existir
    if (req.file) item.imagem = req.file.filename;

    try {
        const conn = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: banco_dados
        });

        const campos = Object.keys(item);
        const valores = Object.values(item);

        const placeholders = campos.map(() => '?').join(", ");
        const sql = `INSERT INTO estoque (${campos.join(", ")}) VALUES (${placeholders})`;

        await conn.query(sql, valores);
        await conn.end();

        return res.status(201).json({ message: "Item cadastrado com sucesso!" });
    } catch (err) {
        console.error("❌ Erro ao cadastrar item:", err);
        return res.status(500).json({ error: "Erro ao cadastrar item", details: err.message });
    }
});

router.get("/", async (req, res) => {
    const { banco_dados } = req.query;

    if (!banco_dados) {
        return res.status(400).json({ error: "Banco de dados não informado" });
    }

    try {
        const conn = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: banco_dados
        });

        const [rows] = await conn.query("SELECT * FROM estoque");
        const [columns] = await conn.query("SHOW COLUMNS FROM estoque");

        await conn.end();

        return res.json({
            colunas: columns.map(c => c.Field),
            dados: rows
        });
    } catch (err) {
        console.error("❌ Erro ao buscar estoque:", err);
        return res.status(500).json({ error: "Erro ao buscar estoque" });
    }
});

router.delete("/:id", async (req, res) => {
    const { id } = req.params;
    const { banco_dados } = req.query;

    if (!banco_dados) {
        return res.status(400).json({ error: "Banco de dados não informado" });
    }

    try {
        const conn = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: banco_dados
        });

        await conn.query("DELETE FROM estoque WHERE id = ?", [id]);
        await conn.end();

        res.json({ message: "Item excluído com sucesso!" });
    } catch (err) {
        console.error("Erro ao excluir item:", err);
        res.status(500).json({ error: "Erro ao excluir item" });
    }
});

router.get("/:id", async (req, res) => {
    const { id } = req.params;
    const { banco_dados } = req.query;

    if (!banco_dados) return res.status(400).json({ error: "Banco de dados não informado" });

    try {
        const conn = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: banco_dados
        });

        const [rows] = await conn.query("SELECT * FROM estoque WHERE id = ?", [id]);
        await conn.end();

        res.json(rows[0] || {});
    } catch (err) {
        console.error("Erro ao buscar item:", err);
        res.status(500).json({ error: "Erro ao buscar item" });
    }
});

router.put("/:id", upload.single("imagem"), async (req, res) => {
    const { id } = req.params;
    const { banco_dados, ...dados } = req.body;

    if (!banco_dados) return res.status(400).json({ error: "Banco de dados não informado" });

    if (req.file) dados.imagem = req.file.filename;

    try {
        const conn = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: banco_dados
        });

        const campos = Object.keys(dados);
        const valores = Object.values(dados);

        const updates = campos.map(c => `${c} = ?`).join(", ");
        const sql = `UPDATE estoque SET ${updates} WHERE id = ?`;

        await conn.query(sql, [...valores, id]);
        await conn.end();

        res.json({ message: "Item atualizado com sucesso!" });
    } catch (err) {
        console.error("Erro ao atualizar item:", err);
        res.status(500).json({ error: "Erro ao atualizar item" });
    }
});

router.get("/indicadores", async (req, res) => {
    const { banco_dados } = req.query;

    if (!banco_dados) return res.status(400).json({ error: "Banco de dados não informado" });

    try {
        const conn = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: banco_dados
        });

        const [dados] = await conn.query("SELECT preco, quantidade FROM estoque");
        await conn.end();

        const totalProdutos = dados.length;
        const totalQuantidade = dados.reduce((acc, item) => acc + (item.quantidade || 0), 0);
        const totalValor = dados.reduce((acc, item) => acc + ((item.preco || 0) * (item.quantidade || 0)), 0);

        res.json({
            totalProdutos,
            totalQuantidade,
            totalValor
        });
    } catch (err) {
        console.error("Erro ao buscar indicadores:", err);
        res.status(500).json({ error: "Erro ao buscar indicadores" });
    }
});


module.exports = router;

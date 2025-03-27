// routes/estoqueCampos.js
const express = require("express");
const mysql = require("mysql2/promise");
const router = express.Router();

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

module.exports = router;

const express = require("express");
const mysql = require("mysql2/promise");
const router = express.Router();

router.get("/resumo", async (req, res) => {
    const { banco_dados } = req.query;

    if (!banco_dados) return res.status(400).json({ error: "Banco de dados não informado" });

    try {
        const conn = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: banco_dados
        });

        const [estoque] = await conn.query("SELECT nome, preco, quantidade FROM estoque");

        const totalProdutos = estoque.length;
        const totalQuantidade = estoque.reduce((acc, item) => acc + (item.quantidade || 0), 0);

        const produtosEstoqueBaixo = estoque.filter(item => (item.quantidade || 0) < 5).length;

        // mock dos produtos mais vendidos (depois trocamos por tabela real de vendas)
        const produtosMaisVendidos = estoque.slice(0, 3).map(item => item.nome);

        await conn.end();

        return res.json({
            totalProdutos,
            totalQuantidade,
            produtosEstoqueBaixo,
            produtosMaisVendidos
        });

    } catch (err) {
        console.error("Erro no resumo:", err);
        res.status(500).json({ error: "Erro ao buscar resumo do dashboard" });
    }
});

module.exports = router;

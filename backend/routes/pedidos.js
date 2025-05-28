const express = require("express");
const router = express.Router();
const mysql = require("mysql2/promise");
const { centralDb } = require("../config/db");

router.post("/", async (req, res) => {
  const dados = req.body;
  const numeroBot = dados.numero_bot;

  if (!numeroBot) {
    return res.status(400).json({ error: "Número do bot não informado." });
  }

  try {
    // 1. Buscar banco de dados da loja com base no número do bot
    const [empresas] = await centralDb.query(
      "SELECT banco_dados FROM empresas WHERE whatsapp = ? LIMIT 1",
      [numeroBot]
    );

    if (!empresas.length) {
      return res.status(404).json({ error: "Loja não encontrada para o número do bot." });
    }

    const nomeBanco = empresas[0].banco_dados;

    const empresaDb = await mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "",
      database: nomeBanco,
    });

    // 2. Extrair e preparar dados do pedido
    const { nome, cpf, telefone } = dados.cliente;
    const { tipo, cidade, bairro, rua, numero, complemento } = dados.entrega;
    const { forma, troco } = dados.pagamento;
    const itens = dados.produtos.map(p => `${p.nome} (x${p.quantidade})`).join(", ");
    const total = dados.produtos.reduce((sum, p) => sum + p.quantidade * p.preco, 0).toFixed(2);

    // 3. Inserir pedido no banco da empresa
    await empresaDb.query(`
      INSERT INTO pedidos (
        nome_cliente, cpf_cliente, telefone_cliente,
        tipo_entrega, cidade, bairro, rua, numero, complemento,
        pagamento, troco, itens, total, status, data_pedido
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Aguardando Aprovação', NOW())
    `, [
      nome, cpf, telefone,
      tipo, cidade, bairro, rua, numero, complemento,
      forma, troco, itens, total
    ]);

    res.json({ message: "✅ Pedido registrado com sucesso." });
    await empresaDb.end();

  } catch (err) {
    console.error("❌ Erro ao salvar pedido:", err);
    res.status(500).json({ error: "Erro ao salvar pedido", details: err.message });
  }
});

module.exports = router;

const express = require('express');
const mysql = require('mysql2/promise');
const router = express.Router();
const { centralDb } = require('../config/db');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

router.post('/pedidos', async (req, res) => {
  try {
    console.log('📥 Requisição recebida em /api/pedidos');
    console.log('Dados recebidos:', req.body);

    const {
      cliente,
      tipoEntrega,
      endereco,
      pagamento,
      troco,
      itens,
      total,
      numeroLoja // <- chave para buscar o banco correto
    } = req.body;

    console.log('🔍 Buscando banco para número:', JSON.stringify(numeroLoja)); 

    const numeroFormatado = String(numeroLoja).trim();

    if (!numeroLoja || !cliente || !itens || itens.length === 0 || !total) {
      return res.status(400).json({ mensagem: 'Dados incompletos.' });
    }

    // 🔍 Buscar nome do banco no banco central
    const [empresas] = await centralDb.query(
      'SELECT banco_dados FROM empresas WHERE TRIM(whatsapp) = ? LIMIT 1',
      [numeroFormatado]
    );

    if (!empresas.length) {
      return res.status(404).json({ mensagem: 'Empresa não encontrada com esse número.' });
    }

    const nomeBanco = empresas[0].banco_dados;

    // 🔌 Conectar ao banco da empresa
    const empresaDb = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: nomeBanco
    });

    // Serializar os itens como texto (JSON)
    const itensJSON = JSON.stringify(itens);

    // 📝 Inserir pedido
    const [resultado] = await empresaDb.query(
      `INSERT INTO pedidos (
        nome_cliente, cpf_cliente, telefone_cliente,
        tipo_entrega, cidade, bairro, rua, numero, complemento,
        pagamento, troco, itens, total, status, data_pedido
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        cliente.nome,
        cliente.cpf,
        cliente.telefone,
        tipoEntrega,
        endereco?.cidade || '',
        endereco?.bairro || '',
        endereco?.rua || '',
        endereco?.numero || '',
        endereco?.complemento || '',
        pagamento,
        troco,
        itensJSON,
        total,
        'Aguardando Aprovação'
      ]
    );

    await empresaDb.end();

    res.status(201).json({
      mensagem: 'Pedido registrado com sucesso!',
      pedidoId: resultado.insertId
    });

  } catch (err) {
    console.error('❌ Erro ao salvar pedido:', err);
    res.status(500).json({
    mensagem: 'Erro interno ao registrar pedido.',
    erro: err.message || err
  });

  }
});

router.get('/pedidos', async (req, res) => {
  const { banco_dados } = req.query;

  if (!banco_dados) {
    return res.status(400).json({ mensagem: 'Banco de dados não informado.' });
  }

  try {
    const empresaDb = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: banco_dados
    });

    const [pedidos] = await empresaDb.query('SELECT * FROM pedidos ORDER BY data_pedido DESC');

    await empresaDb.end();

    res.json(pedidos);
  } catch (err) {
    console.error('❌ Erro ao buscar pedidos:', err);
    res.status(500).json({
      mensagem: 'Erro interno ao buscar pedidos.',
      erro: err.message || err
    });
  }
});

router.post('/pedidos/atualizar-status', async (req, res) => {
  const { banco_dados, id, status, motivo_cancelamento } = req.body;

  if (!banco_dados || !id || !status) {
    return res.status(400).json({ mensagem: 'Dados obrigatórios faltando.' });
  }

  try {
    const empresaDb = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: banco_dados
    });

    // 1. Obter status atual e itens do pedido
    const [[pedido]] = await empresaDb.query(
      'SELECT status, itens FROM pedidos WHERE id = ?',
      [id]
    );

    if (!pedido) {
      return res.status(404).json({ mensagem: 'Pedido não encontrado.' });
    }

    const statusAnterior = pedido.status;
    const itens = JSON.parse(pedido.itens || '[]');

    // 2. Atualizar o status do pedido
    await empresaDb.query(
      'UPDATE pedidos SET status = ?, motivo_cancelamento = ? WHERE id = ?',
      [status, motivo_cancelamento || null, id]
    );

    // 3. Lógica de estoque
    if (status === 'Aprovado' && statusAnterior === 'Aguardando Aprovação') {
      for (const item of itens) {
        await empresaDb.query(
          'UPDATE estoque SET quantidade = quantidade - 1 WHERE nome = ? LIMIT 1',
          [item.nome]
        );
      }
    } else if (status === 'Cancelado' && statusAnterior === 'Aprovado') {
      for (const item of itens) {
        await empresaDb.query(
          'UPDATE estoque SET quantidade = quantidade + 1 WHERE nome = ? LIMIT 1',
          [item.nome]
        );
      }
    }

    // 4. Se aprovado, enviar mensagem para o cliente pelo bot
    if (status === 'Aprovado') {
      const telefoneCliente = pedido.telefone_cliente;
      const tipoEntrega = pedido.tipo_entrega;

      try {
        await fetch('http://localhost:5001/api/notificar-cliente', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            telefone: telefoneCliente,
            tipoEntrega
          })
        });
      } catch (err) {
        console.error('⚠️ Erro ao notificar cliente via bot:', err.message);
      }
    }

    await empresaDb.end();

    res.json({ mensagem: 'Status atualizado com sucesso.' });

  } catch (err) {
    console.error('❌ Erro ao atualizar status:', err);
    res.status(500).json({
      mensagem: 'Erro interno ao atualizar status.',
      erro: err.message || err
    });
  }
});

module.exports = router;

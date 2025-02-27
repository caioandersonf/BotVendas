const express = require('express');
const mysql = require('mysql2/promise');
const router = express.Router();

const centralDb = require('../config/db');

router.get('/', async (req, res) => {
    try {
        const [rows] = await centralDb.query('SELECT * FROM empresas');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar empresas', details: error });
    }
});

router.post('/', async (req, res) => {
    console.log("🔹 Dados recebidos no backend:", req.body);

    try {
        const {
            nome, email, telefone, proprietario, tipo_negocio, localizacao, banco_dados, cnpj_cpf,
            horario_abertura, horario_fechamento, formas_pagamento, plano_ativo, status_empresa,
            instagram, whatsapp, site, descricao, logo_url, observacoes
        } = req.body;

        console.log("🔹 Validando entrada de dados...");

        if (!banco_dados || banco_dados.trim() === '') {
            banco_dados = `empresa_${cnpj_cpf.replace(/\D/g, '')}`.toLowerCase();
        }

        console.log(`🔹 Banco gerado: ${banco_dados}`);

        console.log("🔹 Inserindo empresa no banco central...");
        await centralDb.query(
            `INSERT INTO empresas 
            (nome, email, telefone, proprietario, tipo_negocio, localizacao, banco_dados, cnpj_cpf, 
            instagram, whatsapp, site, descricao, horario_funcionamento, formas_pagamento, 
            plano_ativo, status_empresa, logo_url, observacoes) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                nome, email, telefone, proprietario, tipo_negocio, localizacao, banco_dados, cnpj_cpf,
                instagram, whatsapp, site, descricao, 
                `${horario_abertura} - ${horario_fechamento}`, JSON.stringify(formas_pagamento), 
                plano_ativo, status_empresa, logo_url, observacoes
            ]
        );        
        
        console.log("✅ Empresa cadastrada no banco central!");

        console.log(`🔹 Criando banco de dados '${banco_dados}'...`);
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '', // Coloque sua senha do MySQL se necessário
        });

        await connection.query(`CREATE DATABASE IF NOT EXISTS ${banco_dados}`);
        await connection.end();
        console.log(`✅ Banco '${banco_dados}' criado com sucesso!`);

        console.log(`🔹 Criando tabelas no banco '${banco_dados}'...`);
        const empresaDb = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: banco_dados,
        });

        await empresaDb.query(`
            CREATE TABLE IF NOT EXISTS usuarios (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                senha VARCHAR(255) DEFAULT NULL, -- Começa sem senha
                criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("✅ Tabela 'usuarios' criada no banco da empresa!");
        
        await empresaDb.query(`INSERT INTO usuarios (email) VALUES (?)`, [email]);
        console.log(`✅ Email '${email}' salvo na tabela 'usuarios' da empresa!`);        

        await empresaDb.query(`
            CREATE TABLE IF NOT EXISTS estoque (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nome VARCHAR(255) NOT NULL,
                descricao TEXT DEFAULT NULL,
                quantidade INT NOT NULL DEFAULT 0,
                valor DECIMAL(10,2) NOT NULL,
                tipo VARCHAR(50) DEFAULT NULL, -- Ex: "Eletrônico", "Roupas", "Alimentos"
                codigo_sku VARCHAR(50) UNIQUE DEFAULT NULL, -- Código único do produto
                imagem_url VARCHAR(255) DEFAULT NULL,
                criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("✅ Tabela 'clientes' criada!");

        await empresaDb.query(`
            CREATE TABLE IF NOT EXISTS pedidos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nome_cliente VARCHAR(255) NOT NULL,
                telefone_cliente VARCHAR(20) NOT NULL,
                itens TEXT NOT NULL, -- Lista de produtos comprados em JSON
                total DECIMAL(10,2) NOT NULL,
                status ENUM('Pendente', 'Pago', 'Cancelado') DEFAULT 'Pendente',
                data_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("✅ Tabela 'pedidos' criada!");

        await empresaDb.end();
        console.log(`✅ Todas as tabelas criadas para '${banco_dados}'!`);

        res.status(201).json({ message: 'Empresa criada e banco configurado com sucesso!' });

    } catch (error) {
        console.error("❌ ERRO NO BACKEND:", error);
        res.status(500).json({ 
            error: 'Erro ao criar empresa', 
            details: error.message,
            stack: error.stack  // Exibe a pilha de erro para entender melhor
        });
    }    
});



module.exports = router;

const express = require('express');
const mysql = require('mysql2/promise');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const centralDb = require('../config/db');

const router = express.Router();

// Configuração do serviço de email (substitua pelos seus dados)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'castielumanjodosenhor@gmail.com',
        pass: 'unngqonibuwharkx'
    }
});

// 🔹 Gera um token aleatório para redefinição de senha
const gerarToken = () => crypto.randomBytes(20).toString('hex');

// 🔹 Solicita a criação da senha (usuário insere o email)
router.post('/solicitar-definicao-senha', async (req, res) => {
    const { email } = req.body;

    try {
        // 🔎 Verifica se o email pertence a alguma empresa
        const [empresas] = await centralDb.query(`SELECT banco_dados FROM empresas WHERE email = ?`, [email]);
        if (empresas.length === 0) {
            return res.status(404).json({ error: "Email não cadastrado!" });
        }

        const banco_dados = empresas[0].banco_dados;

        // Conectar ao banco da empresa para verificar se o usuário existe
        const empresaDb = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: banco_dados
        });

        const [usuarios] = await empresaDb.query(`SELECT * FROM usuarios WHERE email = ?`, [email]);
        if (usuarios.length === 0) {
            return res.status(404).json({ error: "Usuário não encontrado na empresa!" });
        }

        // 🔹 Gerar token para redefinição de senha
        const token = gerarToken();
        const expiracao = new Date(Date.now() + 3600000); // Token expira em 1 hora

        // Criar tabela de tokens se não existir
        await empresaDb.query(`
            CREATE TABLE IF NOT EXISTS tokens_recuperacao (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) NOT NULL,
                token VARCHAR(255) NOT NULL,
                expiracao DATETIME NOT NULL
            );
        `);

        // Salvar token no banco da empresa
        await empresaDb.query(
            `INSERT INTO tokens_recuperacao (email, token, expiracao) VALUES (?, ?, ?) 
             ON DUPLICATE KEY UPDATE token = VALUES(token), expiracao = VALUES(expiracao)`,
            [email, token, expiracao]
        );

        // 🔹 Enviar email com o link de redefinição
        const resetLink = `http://localhost:3000/definir-senha?token=${token}&banco=${banco_dados}`;

        const mailOptions = {
            from: '"Suporte" <castielumanjodosenhor@gmail.com>',
            to: email,
            subject: 'Criação de Senha - Atendente Virtual',
            text: `Olá, clique no link abaixo para definir sua senha:\n\n${resetLink}\n\nO link expira em 1 hora.`
        };

        await transporter.sendMail(mailOptions);
        res.json({ message: "Email enviado com sucesso!" });

    } catch (error) {
        console.error("Erro ao solicitar definição de senha:", error);
        res.status(500).json({ error: "Erro ao processar a solicitação" });
    }
});

// 🔹 Rota para definir uma nova senha
router.post('/definir-senha', async (req, res) => {
    const { token, banco, novaSenha } = req.body;

    if (!token || !banco || !novaSenha) {
        return res.status(400).json({ error: "Dados incompletos!" });
    }

    try {
        // Conectar ao banco da empresa
        const empresaDb = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: banco
        });

        // Verifica se o token é válido e ainda não expirou
        const [tokens] = await empresaDb.query(
            `SELECT * FROM tokens_recuperacao WHERE token = ? AND expiracao > NOW()`, 
            [token]
        );

        if (tokens.length === 0) {
            return res.status(400).json({ error: "Token inválido ou expirado!" });
        }

        const email = tokens[0].email;

        // Atualiza a senha no banco da empresa (Aqui estou assumindo que a senha é salva sem hash. Se tiver hash, aplique bcrypt)
        await empresaDb.query(
            `UPDATE usuarios SET senha = ? WHERE email = ?`, 
            [novaSenha, email]
        );

        // Remove o token após a redefinição da senha
        await empresaDb.query(`DELETE FROM tokens_recuperacao WHERE token = ?`, [token]);

        res.json({ message: "Senha redefinida com sucesso!" });

    } catch (error) {
        console.error("Erro ao definir senha:", error);
        res.status(500).json({ error: "Erro ao processar a redefinição de senha" });
    }
});


module.exports = router;

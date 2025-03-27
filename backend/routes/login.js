const express = require('express');
const { centralDb, getConnection } = require('../config/db'); // Importando corretamente
const router = express.Router();

router.post('/login', async (req, res) => {
    const { email, senha } = req.body;

    try {
        console.log("🔹 Recebendo login com dados:", req.body);

        if (!email || !senha) {
            return res.status(400).json({ error: "Email e senha são obrigatórios!" });
        }

        // Verifica se `centralDb` está definido corretamente
        console.log("🔹 Verificando conexão com o banco central...");
        if (!centralDb || typeof centralDb.query !== 'function') {
            console.error("❌ ERRO: Conexão com o banco central não foi inicializada corretamente.");
            return res.status(500).json({ error: "Erro interno no servidor ao acessar o banco central" });
        }

        // Buscar a empresa pelo email no banco central
        const [empresas] = await centralDb.query(
            `SELECT banco_dados, nome, proprietario FROM empresas WHERE email = ?`, [email]
        );        

        if (empresas.length === 0) {
            console.log("❌ Empresa não encontrada:", email);
            return res.status(404).json({ error: "Empresa não encontrada!" });
        }

        const banco_dados = empresas[0].banco_dados;
        console.log("✅ Empresa encontrada:", banco_dados);

        // Conectar ao banco da empresa
        console.log("🔹 Tentando conectar ao banco da empresa...");
        const empresaDb = await getConnection(banco_dados);

        if (!empresaDb || typeof empresaDb.query !== 'function') {
            console.error("❌ ERRO: Falha ao conectar ao banco da empresa.");
            return res.status(500).json({ error: "Erro ao acessar o banco da empresa" });
        }

        console.log("✅ Conexão com banco da empresa bem-sucedida!");

        // Buscar o usuário no banco da empresa pelo email
        const [usuarios] = await empresaDb.query(
            `SELECT * FROM usuarios WHERE email = ?`, [email]
        );

        if (usuarios.length === 0) {
            console.log("❌ Usuário não encontrado no banco da empresa.");
            return res.status(401).json({ error: "Usuário ou senha incorretos!" });
        }

        const usuario = usuarios[0];

        // Comparar senha (Se não estiver com hash, basta comparar diretamente)
        if (senha !== usuario.senha) {
            console.log("❌ Senha incorreta.");
            return res.status(401).json({ error: "Usuário ou senha incorretos!" });
        }

        console.log("✅ Login bem-sucedido!");
        res.json({ 
            message: "Login realizado com sucesso!", 
            usuario: {
                id: usuario.id,
                email: usuario.email,
                nome: empresas[0].nome, 
                proprietario: empresas[0].proprietario, 
                banco_dados: empresas[0].banco_dados,
                tipo_negocio: empresas[0].tipo_negocio,
                criado_em: usuario.criado_em
            } 
        });        
    } catch (error) {
        console.error("❌ Erro ao fazer login:", error);
        res.status(500).json({ error: "Erro ao processar o login" });
    }
});

module.exports = router;

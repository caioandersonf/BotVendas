import React, { useState, useEffect } from 'react';

const DefinirSenha = () => {
    const [novaSenha, setNovaSenha] = useState('');
    const [confirmarSenha, setConfirmarSenha] = useState('');
    const [mensagem, setMensagem] = useState('');
    const [token, setToken] = useState('');
    const [banco, setBanco] = useState('');

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        setToken(urlParams.get('token') || '');
        setBanco(urlParams.get('banco') || '');
    }, []);

    const handleDefinirSenha = async () => {
        if (!novaSenha || !confirmarSenha) {
            setMensagem('Preencha os dois campos.');
            return;
        }

        if (novaSenha !== confirmarSenha) {
            setMensagem('As senhas não coincidem.');
            return;
        }

        const response = await fetch('http://localhost:5000/api/recovery/definir-senha', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, banco, novaSenha }),
        });

        const data = await response.json().catch(() => null);

        console.log('Resposta da API:', response.status, data);

        if (response.ok) {
            setMensagem('Senha redefinida com sucesso! Você pode fazer login agora.');
        } else {
            setMensagem(`Erro ao redefinir senha: ${data?.error || 'Erro desconhecido'}`);
        }
    };

    return (
        <div>
            <h2>Definir Nova Senha</h2>
            <input
                type="password"
                placeholder="Digite sua nova senha"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
            />
            <input
                type="password"
                placeholder="Confirme sua nova senha"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
            />
            <button onClick={handleDefinirSenha}>Salvar Senha</button>
            <p>{mensagem}</p>
        </div>
    );
};

export default DefinirSenha;

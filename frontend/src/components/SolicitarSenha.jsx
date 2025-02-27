import React, { useState } from 'react';

const SolicitarSenha = () => {
    const [email, setEmail] = useState('');
    const [mensagem, setMensagem] = useState('');

    const handleSolicitarSenha = async () => {
        const response = await fetch('http://localhost:5000/api/recovery/solicitar-definicao-senha', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        const data = await response.json();
        if (response.ok) {
            setMensagem("Verifique seu email para criar sua senha!");
        } else {
            setMensagem(`Erro: ${data.error}`);
        }
    };

    return (
        <div>
            <h2>Definir Senha</h2>
            <input 
                type="email" 
                placeholder="Digite seu email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
            />
            <button onClick={handleSolicitarSenha}>Enviar Link</button>
            <p>{mensagem}</p>
        </div>
    );
};

export default SolicitarSenha;

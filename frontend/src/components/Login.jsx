import { useState } from "react";

const Login = () => {
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [mensagem, setMensagem] = useState("");

    const handleLogin = async (e) => {
        e.preventDefault();
        setMensagem("");

        try {
            const response = await fetch("http://localhost:5000/api/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, senha }),
            });

            const data = await response.json();

            if (response.ok) {
                setMensagem("Login realizado com sucesso!");
                console.log("Usuário logado:", data.usuario);
            } else {
                setMensagem(data.error || "Erro ao fazer login");
            }
        } catch (error) {
            setMensagem("Erro de conexão com o servidor");
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <h2 className="text-2xl font-bold mb-4">Login</h2>
            <form onSubmit={handleLogin} className="flex flex-col w-80 bg-white p-6 rounded-xl shadow-lg">
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="border p-2 rounded mb-3"
                    required
                />
                <input
                    type="password"
                    placeholder="Senha"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="border p-2 rounded mb-3"
                    required
                />
                <button
                    type="submit"
                    className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition"
                >
                    Entrar
                </button>
                {mensagem && <p className="text-red-500 mt-3">{mensagem}</p>}
            </form>
        </div>
    );
};

export default Login;

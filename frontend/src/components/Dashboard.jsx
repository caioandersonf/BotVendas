import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
    const [usuario, setUsuario] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        // Buscar usuário salvo no localStorage
        const usuarioLogado = localStorage.getItem("usuario");
        if (!usuarioLogado) {
            navigate("/login"); // Se não tiver login, volta para a tela de login
        } else {
            setUsuario(JSON.parse(usuarioLogado));
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem("usuario");
        navigate("/login");
    };

    if (!usuario) {
        return <p>Carregando...</p>;
    }

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
            <h2 className="text-3xl font-bold mb-4">Bem-vindo, {usuario.proprietario}!</h2>
            <p className="text-lg text-gray-700 mb-6">Loja: {usuario.nome}</p>

            <div className="flex gap-4">
                <button 
                    onClick={() => navigate("/pedidos")} 
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
                >
                    Ver Pedidos
                </button>

                <button 
                    onClick={() => navigate("/estoque")} 
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
                >
                    Ver Estoque
                </button>
            </div>

            <button 
                onClick={handleLogout} 
                className="mt-6 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
            >
                Sair
            </button>
        </div>
    );
};

export default Dashboard;

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const DashboardEstoque = () => {
    const [indicadores, setIndicadores] = useState({});
    const navigate = useNavigate();

    useEffect(() => {
        const usuario = JSON.parse(localStorage.getItem("usuario"));
        if (usuario?.banco_dados) {
            fetch(`http://localhost:5000/api/estoque/indicadores?banco_dados=${usuario.banco_dados}`)
                .then(res => res.json())
                .then(setIndicadores)
                .catch(err => console.error("Erro ao buscar indicadores:", err));
        }
    }, []);

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center p-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-8">📈 Visão Geral do Estoque</h1>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-5xl">
                <div className="bg-white rounded-lg shadow-md p-6 text-center">
                    <h2 className="text-xl font-semibold text-gray-700">Produtos Cadastrados</h2>
                    <p className="text-3xl text-blue-600 mt-2">{indicadores.totalProdutos || 0}</p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6 text-center">
                    <h2 className="text-xl font-semibold text-gray-700">Itens no Estoque</h2>
                    <p className="text-3xl text-green-600 mt-2">{indicadores.totalQuantidade || 0}</p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6 text-center">
                    <h2 className="text-xl font-semibold text-gray-700">Valor Total</h2>
                    <p className="text-3xl text-emerald-600 mt-2">R$ {indicadores.totalValor?.toFixed(2) || "0,00"}</p>
                </div>
            </div>

            <button
                onClick={() => navigate("/dashboard")}
                className="mt-10 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
                Voltar ao Dashboard
            </button>
        </div>
    );
};

export default DashboardEstoque;

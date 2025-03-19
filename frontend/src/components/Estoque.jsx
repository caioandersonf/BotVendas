import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Estoque = () => {
    const [estoque, setEstoque] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        // Buscar itens do estoque no backend
        const fetchEstoque = async () => {
            try {
                const response = await fetch("http://localhost:5000/api/estoque"); // Ajuste para a URL correta do backend
                const data = await response.json();
                setEstoque(data);
            } catch (error) {
                console.error("Erro ao buscar estoque:", error);
            }
        };
        fetchEstoque();
    }, []);

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
            <h2 className="text-3xl font-bold mb-4">Estoque</h2>
            
            <table className="w-full max-w-4xl bg-white shadow-md rounded-lg p-4">
                <thead>
                    <tr className="bg-gray-200">
                        <th className="border p-2">Produto</th>
                        <th className="border p-2">Quantidade</th>
                        <th className="border p-2">Preço</th>
                    </tr>
                </thead>
                <tbody>
                    {estoque.map((item) => (
                        <tr key={item.id} className="border">
                            <td className="border p-2">{item.nome}</td>
                            <td className="border p-2">{item.quantidade}</td>
                            <td className="border p-2">R$ {item.preco.toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <button onClick={() => navigate("/cadastrar-item")} className="px-4 py-2 bg-green-500 text-white rounded-md mt-4 hover:bg-green-600">
                Cadastrar Novo Item
            </button>

            <button onClick={() => navigate("/dashboard")} className="px-4 py-2 bg-blue-500 text-white rounded-md mt-4 hover:bg-blue-600">
                Voltar ao Dashboard
            </button>
        </div>
    );
};

export default Estoque;

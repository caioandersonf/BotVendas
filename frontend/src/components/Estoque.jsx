import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Estoque = () => {
    const [colunas, setColunas] = useState([]);
    const [dados, setDados] = useState([]);
    const [busca, setBusca] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        buscarEstoque();
    }, []);

    const buscarEstoque = () => {
        const usuario = JSON.parse(localStorage.getItem("usuario"));
        if (usuario?.banco_dados) {
            fetch(`http://localhost:5000/api/estoque?banco_dados=${usuario.banco_dados}`)
                .then(res => res.json())
                .then(({ colunas, dados }) => {
                    setColunas(colunas.filter(col => col !== "id"));
                    setDados(dados);
                })
                .catch(err => console.error("Erro ao buscar estoque:", err));
        }
    };

    const handleExcluir = async (id) => {
        const usuario = JSON.parse(localStorage.getItem("usuario"));
        if (window.confirm("Tem certeza que deseja excluir este item?")) {
            try {
                const res = await fetch(`http://localhost:5000/api/estoque/${id}?banco_dados=${usuario.banco_dados}`, {
                    method: "DELETE"
                });
                if (res.ok) {
                    buscarEstoque();
                } else {
                    console.error("Erro ao excluir");
                }
            } catch (err) {
                console.error("Erro ao excluir:", err);
            }
        }
    };

    const formatarCampo = (coluna, valor) => {
        if (coluna === "preco") return `R$ ${parseFloat(valor).toFixed(2)}`;
        if (coluna === "criado_em") return new Date(valor).toLocaleString("pt-BR") || "-";
        if (coluna === "imagem" && valor)
            return (
                <img
                    src={`http://localhost:5000/uploads/${valor}`}
                    alt="Produto"
                    className="w-16 h-16 object-cover rounded shadow"
                />
            );
        return valor || "-";
    };

    const dadosFiltrados = dados.filter(item =>
        item.nome?.toLowerCase().includes(busca.toLowerCase())
    );

    return (
        <div className="flex flex-col items-center justify-start min-h-screen bg-gray-100 p-8">
            <h2 className="text-4xl font-bold mb-6 text-gray-800">📦 Estoque</h2>

            <input
                type="text"
                placeholder="Buscar por nome..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="mb-6 px-4 py-2 border rounded-md w-full max-w-md shadow-sm"
            />

            <div className="overflow-x-auto w-full max-w-6xl">
                <table className="w-full bg-white shadow-md rounded-lg overflow-hidden border">
                    <thead className="bg-blue-100 text-gray-700">
                        <tr>
                            {colunas.map((col, i) => (
                                <th key={i} className="px-4 py-3 border-b capitalize text-left">{col.replace("_", " ")}</th>
                            ))}
                            <th className="px-4 py-3 border-b">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {dadosFiltrados.map((item, i) => (
                            <tr key={i} className="hover:bg-gray-100 transition">
                                {colunas.map((col, j) => (
                                    <td key={j} className="px-4 py-2 border-b text-sm text-gray-700">
                                        {formatarCampo(col, item[col])}
                                    </td>
                                ))}
                                <td className="px-4 py-2 border-b flex gap-2">
                                    <button
                                        onClick={() => navigate(`/editar-item/${item.id}`)}
                                        className="px-3 py-1 bg-yellow-400 text-white rounded hover:bg-yellow-500 text-sm"
                                    >
                                        Editar
                                    </button>
                                    <button
                                        onClick={() => handleExcluir(item.id)}
                                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                                    >
                                        Excluir
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex gap-4 mt-8">
                <button
                    onClick={() => navigate("/cadastrar-item")}
                    className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
                >
                    ➕ Cadastrar Novo Item
                </button>
                <button
                    onClick={() => navigate("/dashboard")}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                >
                    🔙 Voltar ao Dashboard
                </button>
            </div>
        </div>
    );
};

export default Estoque;

import { useState } from "react";
import { useNavigate } from "react-router-dom";

const CadastrarItem = () => {
    const [novoItem, setNovoItem] = useState({ nome: "", quantidade: "", preco: "" });
    const [camposExtras, setCamposExtras] = useState([]);
    const [novoCampo, setNovoCampo] = useState("");
    const navigate = useNavigate();

    const handleCadastro = async () => {
        const itemCompleto = { ...novoItem, camposExtras };
        try {
            const response = await fetch("http://localhost:5000/api/estoque", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(itemCompleto)
            });
            if (response.ok) {
                navigate("/estoque"); // Redireciona para a página de estoque após cadastro
            } else {
                console.error("Erro ao cadastrar item");
            }
        } catch (error) {
            console.error("Erro na requisição de cadastro:", error);
        }
    };

    const adicionarCampoExtra = () => {
        if (novoCampo.trim() !== "") {
            setCamposExtras([...camposExtras, { nome: novoCampo, valor: "" }]);
            setNovoCampo("");
        }
    };

    const atualizarCampoExtra = (index, valor) => {
        const novosCampos = [...camposExtras];
        novosCampos[index].valor = valor;
        setCamposExtras(novosCampos);
    };

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
            <h2 className="text-3xl font-bold mb-4">Cadastrar Novo Item</h2>
            
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                <input 
                    type="text" 
                    placeholder="Nome do Produto" 
                    value={novoItem.nome} 
                    onChange={(e) => setNovoItem({ ...novoItem, nome: e.target.value })} 
                    className="w-full p-2 border rounded-md mb-2"
                />
                <input 
                    type="number" 
                    placeholder="Quantidade" 
                    value={novoItem.quantidade} 
                    onChange={(e) => setNovoItem({ ...novoItem, quantidade: e.target.value })} 
                    className="w-full p-2 border rounded-md mb-2"
                />
                <input 
                    type="number" 
                    placeholder="Preço" 
                    value={novoItem.preco} 
                    onChange={(e) => setNovoItem({ ...novoItem, preco: e.target.value })} 
                    className="w-full p-2 border rounded-md mb-2"
                />

                <h3 className="text-lg font-semibold mb-2">Campos Personalizados</h3>
                {camposExtras.map((campo, index) => (
                    <input 
                        key={index}
                        type="text" 
                        placeholder={campo.nome} 
                        value={campo.valor} 
                        onChange={(e) => atualizarCampoExtra(index, e.target.value)} 
                        className="w-full p-2 border rounded-md mb-2"
                    />
                ))}

                <div className="flex space-x-2">
                    <input 
                        type="text" 
                        placeholder="Nome do novo campo" 
                        value={novoCampo} 
                        onChange={(e) => setNovoCampo(e.target.value)} 
                        className="w-full p-2 border rounded-md"
                    />
                    <button onClick={adicionarCampoExtra} className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600">
                        +
                    </button>
                </div>
                
                <button 
                    onClick={handleCadastro} 
                    className="w-full px-4 py-2 bg-green-500 text-white rounded-md mt-2 hover:bg-green-600"
                >
                    Cadastrar Item
                </button>
            </div>

            <button onClick={() => navigate("/estoque")} className="px-4 py-2 bg-blue-500 text-white rounded-md mt-4 hover:bg-blue-600">
                Voltar ao Estoque
            </button>
        </div>
    );
};

export default CadastrarItem;

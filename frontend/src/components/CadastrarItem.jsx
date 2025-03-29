import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const CadastrarItem = () => {
    const [camposEstoque, setCamposEstoque] = useState([]);
    const [novoItem, setNovoItem] = useState({});
    const [imagem, setImagem] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const usuario = JSON.parse(localStorage.getItem("usuario"));
        if (usuario?.banco_dados) {
            fetch(`http://localhost:5000/api/estoque/campos?banco_dados=${usuario.banco_dados}`)
                .then(res => res.json())
                .then(data => setCamposEstoque(data))
                .catch(err => console.error("Erro ao buscar campos do estoque:", err));
        }
    }, []);

    const handleCadastro = async () => {
        const usuario = JSON.parse(localStorage.getItem("usuario"));
        const formData = new FormData();

        // Adiciona campos dinâmicos
        Object.keys(novoItem).forEach(chave => {
            formData.append(chave, novoItem[chave]);
        });

        // Adiciona banco e imagem
        formData.append("banco_dados", usuario.banco_dados);
        if (imagem) {
            formData.append("imagem", imagem);
        }

        try {
            const response = await fetch("http://localhost:5000/api/estoque", {
                method: "POST",
                body: formData
            });

            if (response.ok) {
                navigate("/estoque");
            } else {
                console.error("Erro ao cadastrar item");
            }
        } catch (error) {
            console.error("Erro na requisição de cadastro:", error);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
            <h2 className="text-3xl font-bold mb-4">Cadastrar Novo Item</h2>

            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                {camposEstoque.map((campo, index) => (
                    <input
                        key={index}
                        type={campo.tipo.includes("int") || campo.tipo.includes("decimal") ? "number" : "text"}
                        placeholder={campo.nome}
                        value={novoItem[campo.nome] || ""}
                        onChange={(e) =>
                            setNovoItem({ ...novoItem, [campo.nome]: e.target.value })
                        }
                        className="w-full p-2 border rounded-md mb-2"
                    />
                ))}

                {/* Upload de imagem */}
                <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImagem(e.target.files[0])}
                    className="w-full p-2 border rounded-md mb-2"
                />

                <button
                    onClick={handleCadastro}
                    className="w-full px-4 py-2 bg-green-500 text-white rounded-md mt-2 hover:bg-green-600"
                >
                    Cadastrar Item
                </button>
            </div>

            <button
                onClick={() => navigate("/estoque")}
                className="px-4 py-2 bg-blue-500 text-white rounded-md mt-4 hover:bg-blue-600"
            >
                Voltar ao Estoque
            </button>
        </div>
    );
};

export default CadastrarItem;

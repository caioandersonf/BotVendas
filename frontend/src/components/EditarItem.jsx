import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

const EditarItem = () => {
    const [campos, setCampos] = useState([]);
    const [item, setItem] = useState({});
    const [novaImagem, setNovaImagem] = useState(null);
    const navigate = useNavigate();
    const { id } = useParams();

    useEffect(() => {
        const usuario = JSON.parse(localStorage.getItem("usuario"));
        if (!usuario?.banco_dados) return;

        // Buscar campos
        fetch(`http://localhost:5000/api/estoque/campos?banco_dados=${usuario.banco_dados}`)
            .then(res => res.json())
            .then(setCampos);

        // Buscar dados do item
        fetch(`http://localhost:5000/api/estoque/${id}?banco_dados=${usuario.banco_dados}`)
            .then(res => res.json())
            .then(setItem);
    }, [id]);

    const handleEditar = async () => {
        const usuario = JSON.parse(localStorage.getItem("usuario"));
        const formData = new FormData();

        for (const key in item) {
            formData.append(key, item[key]);
        }

        formData.append("banco_dados", usuario.banco_dados);

        if (novaImagem) {
            formData.append("imagem", novaImagem);
        }

        try {
            const res = await fetch(`http://localhost:5000/api/estoque/${id}`, {
                method: "PUT",
                body: formData
            });

            if (res.ok) {
                navigate("/estoque");
            } else {
                console.error("Erro ao atualizar item");
            }
        } catch (err) {
            console.error("Erro:", err);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-8">
            <h2 className="text-3xl font-bold mb-6">Editar Item</h2>

            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                {campos.map((campo, index) => (
                    <input
                        key={index}
                        type={campo.tipo.includes("int") || campo.tipo.includes("decimal") ? "number" : "text"}
                        placeholder={campo.nome}
                        value={item[campo.nome] || ""}
                        onChange={(e) =>
                            setItem({ ...item, [campo.nome]: e.target.value })
                        }
                        className="w-full p-2 border rounded-md mb-3"
                    />
                ))}

                {item.imagem && (
                    <img
                        src={`http://localhost:5000/uploads/${item.imagem}`}
                        alt="Imagem atual"
                        className="w-full h-40 object-contain mb-3 rounded"
                    />
                )}

                {/* Upload de nova imagem */}
                <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setNovaImagem(e.target.files[0])}
                    className="w-full p-2 border rounded-md mb-3"
                />

                <button
                    onClick={handleEditar}
                    className="w-full px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
                >
                    Salvar Alterações
                </button>
            </div>

            <button
                onClick={() => navigate("/estoque")}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
                Voltar ao Estoque
            </button>
        </div>
    );
};

export default EditarItem;

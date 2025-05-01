import './EditarItem.css';
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
        <div className="editar-container">
          <h2>Editar Item</h2>
      
          <div className="editar-card">
            {campos.map((campo, index) => (
              <input
                key={index}
                type={campo.tipo.includes("int") || campo.tipo.includes("decimal") ? "number" : "text"}
                placeholder={campo.nome}
                value={item[campo.nome] || ""}
                onChange={(e) =>
                  setItem({ ...item, [campo.nome]: e.target.value })
                }
              />
            ))}
      
            {item.imagem && (
              <img
                src={`http://localhost:5000/uploads/${item.imagem}`}
                alt="Imagem atual"
                className="imagem-preview"
              />
            )}
      
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setNovaImagem(e.target.files[0])}
            />
      
            <button onClick={handleEditar} className="btn-amarelo">
              Salvar Alterações
            </button>
          </div>
      
          <button onClick={() => navigate("/estoque")} className="btn-voltar">
            Voltar ao Estoque
          </button>
        </div>
    );
};

export default EditarItem;

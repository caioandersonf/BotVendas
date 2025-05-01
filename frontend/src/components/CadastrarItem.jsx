import './CadastrarItem.css';
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
        <div className="cadastrar-container">
          <h2>Cadastrar Novo Item</h2>
      
          <div className="cadastrar-card">
            {camposEstoque.map((campo, index) => (
              <input
                key={index}
                type={campo.tipo.includes("int") || campo.tipo.includes("decimal") ? "number" : "text"}
                placeholder={campo.nome}
                value={novoItem[campo.nome] || ""}
                onChange={(e) =>
                  setNovoItem({ ...novoItem, [campo.nome]: e.target.value })
                }
              />
            ))}
      
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImagem(e.target.files[0])}
            />
      
            <button onClick={handleCadastro} className="btn-verde">
              Cadastrar Item
            </button>
          </div>
      
          <button onClick={() => navigate("/estoque")} className="btn-voltar">
            Voltar ao Estoque
          </button>
        </div>
      );      
};

export default CadastrarItem;

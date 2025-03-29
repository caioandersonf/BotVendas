import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Estoque = () => {
    const [colunas, setColunas] = useState([]);
    const [dados, setDados] = useState([]);
    const [camposFiltraveis, setCamposFiltraveis] = useState([]);
    const [filtros, setFiltros] = useState({});
    const [busca, setBusca] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        buscarEstoque();
    }, []);

    const buscarEstoque = async () => {
        const usuario = JSON.parse(localStorage.getItem("usuario"));
        if (!usuario?.banco_dados) return;

        const resEstoque = await fetch(`http://localhost:5000/api/estoque?banco_dados=${usuario.banco_dados}`);
        const { colunas, dados } = await resEstoque.json();

        setColunas(colunas.filter(col => col !== "id"));
        setDados(dados);

        const resCampos = await fetch(`http://localhost:5000/api/estoque/campos?banco_dados=${usuario.banco_dados}`);
        const campos = await resCampos.json();

        const camposExcluidos = ["id", "imagem", "preco", "quantidade", "criado_em"];
        const filtraveis = campos.filter(c => !camposExcluidos.includes(c.nome));

        setCamposFiltraveis(filtraveis);
    };

    const handleExcluir = async (id) => {
        const usuario = JSON.parse(localStorage.getItem("usuario"));
        if (window.confirm("Tem certeza que deseja excluir este item?")) {
            try {
                const res = await fetch(`http://localhost:5000/api/estoque/${id}?banco_dados=${usuario.banco_dados}`, {
                    method: "DELETE"
                });
                if (res.ok) buscarEstoque();
            } catch (err) {
                console.error("Erro ao excluir:", err);
            }
        }
    };

    const handleFiltroChange = (campo, valor) => {
        setFiltros(prev => ({
            ...prev,
            [campo]: valor
        }));
    };

    const formatarCampo = (coluna, valor) => {
        if (coluna === "preco") return `R$ ${parseFloat(valor).toFixed(2)}`;
        if (coluna === "criado_em") return new Date(valor).toLocaleString("pt-BR");
        if (coluna === "imagem" && valor) {
            return (
                <img
                    src={`http://localhost:5000/uploads/${valor}`}
                    alt="Produto"
                    style={{
                        width: "80px",
                        height: "80px",
                        objectFit: "cover",
                        borderRadius: "6px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.3)"
                    }}
                />
            );
        }
        return valor || "-";
    };

    const dadosFiltrados = dados.filter(item => {
        const buscaNome = item.nome?.toLowerCase().includes(busca.toLowerCase());

        const filtrosAtendidos = Object.entries(filtros).every(([campo, valor]) => {
            if (!valor) return true;
            return String(item[campo]) === String(valor);
        });

        return buscaNome && filtrosAtendidos;
    });

    const opcoesUnicas = (campo) => {
        const unicos = new Set(dados.map(d => d[campo]).filter(Boolean));
        return Array.from(unicos);
    };

    return (
        <div className="admin-container">
            <h2>📦 Estoque</h2>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", marginBottom: "20px" }}>
                <input
                    type="text"
                    placeholder="Buscar por nome..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    style={{
                        padding: "10px",
                        border: "1px solid #5A5E7A",
                        borderRadius: "8px",
                        backgroundColor: "#252545",
                        color: "#B0B3C0",
                        flex: "1",
                        minWidth: "200px"
                    }}
                />

                {camposFiltraveis.map((campo, i) => (
                    <select
                        key={i}
                        onChange={e => handleFiltroChange(campo.nome, e.target.value)}
                        value={filtros[campo.nome] || ""}
                        style={{
                            padding: "10px",
                            border: "1px solid #5A5E7A",
                            borderRadius: "8px",
                            backgroundColor: "#252545",
                            color: "#B0B3C0",
                            minWidth: "150px"
                        }}
                    >
                        <option value="">{campo.nome}</option>
                        {opcoesUnicas(campo.nome).map((op, idx) => (
                            <option key={idx} value={op}>{op}</option>
                        ))}
                    </select>
                ))}
            </div>

            <div style={{ overflowX: "auto", width: "100%" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", color: "#ffffff" }}>
                    <thead>
                        <tr>
                            {colunas.map((col, i) => (
                                <th
                                    key={i}
                                    style={{
                                        padding: "12px",
                                        backgroundColor: "#1f1f3b",
                                        borderBottom: "2px solid #444",
                                        textAlign: "left",
                                        textTransform: "capitalize"
                                    }}
                                >
                                    {col.replace("_", " ")}
                                </th>
                            ))}
                            <th style={{ padding: "12px", backgroundColor: "#1f1f3b", borderBottom: "2px solid #444" }}>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {dadosFiltrados.map((item, i) => (
                            <tr key={i} style={{ borderBottom: "1px solid #333" }}>
                                {colunas.map((col, j) => (
                                    <td key={j} style={{
                                        padding: "10px",
                                        color: col === "quantidade" && item[col] <= 3 ? "#ff4d4d" : "#ffffff",
                                        fontWeight: col === "quantidade" && item[col] <= 3 ? "bold" : "normal"
                                    }}>
                                        {col === "quantidade" && item[col] <= 3
                                        ? `⚠️ ${item[col]}`
                                        : formatarCampo(col, item[col])
                                        }
                                    </td>
                                ))}
                                <td style={{ padding: "10px" }}>
                                    <button
                                        onClick={() => navigate(`/editar-item/${item.id}`)}
                                        style={{
                                            marginRight: "10px",
                                            backgroundColor: "#FFD700",
                                            color: "#000",
                                            padding: "6px 12px",
                                            borderRadius: "5px",
                                            border: "none",
                                            cursor: "pointer"
                                        }}
                                    >
                                        Editar
                                    </button>
                                    <button
                                        onClick={() => handleExcluir(item.id)}
                                        style={{
                                            backgroundColor: "#FF3B30",
                                            color: "#fff",
                                            padding: "6px 12px",
                                            borderRadius: "5px",
                                            border: "none",
                                            cursor: "pointer"
                                        }}
                                    >
                                        Excluir
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div style={{ display: "flex", gap: "20px", marginTop: "30px" }}>
                <button
                    onClick={() => navigate("/cadastrar-item")}
                    className="btn-cadastrar"
                >
                    ➕ Cadastrar Novo Item
                </button>
                <button
                    onClick={() => navigate("/dashboard")}
                    className="btn-voltar"
                >
                    🔙 Voltar ao Dashboard
                </button>
                </div>

                        </div>
                    );
                };
export default Estoque;

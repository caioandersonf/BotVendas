import './Dashboard.css';
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
    const [usuario, setUsuario] = useState(null);
    const [produtos, setProdutos] = useState([]);
    const [quantidadeTotal, setQuantidadeTotal] = useState(0);
    const [indiceProduto, setIndiceProduto] = useState(0);
    const [horaAtual, setHoraAtual] = useState(new Date());
    const navigate = useNavigate();

    useEffect(() => {
        const usuarioLogado = localStorage.getItem("usuario");

        if (!usuarioLogado) {
            navigate("/login");
        } else {
            const user = JSON.parse(usuarioLogado);
            setUsuario(user);

            fetch(`/api/estoque?banco_dados=${user.banco_dados}`)
                .then(res => res.json())
                .then(data => {
                    if (data?.dados?.length) {
                        setProdutos(data.dados);

                        const soma = data.dados.reduce((acc, item) => acc + (Number(item.quantidade) || 0), 0);
                        setQuantidadeTotal(soma);
                    }
                })
                .catch(err => console.error("Erro ao buscar estoque:", err));
        }
    }, [navigate]);

    useEffect(() => {
        if (produtos.length > 1) {
            const interval = setInterval(() => {
                setIndiceProduto((prev) => (prev + 1) % produtos.length);
            }, 4000);
            return () => clearInterval(interval);
        }
    }, [produtos]);

    useEffect(() => {
        const timer = setInterval(() => {
            setHoraAtual(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("usuario");
        navigate("/login");
    };

    if (!usuario) {
        return <p>Carregando...</p>;
    }

    return (
        <div className="dashboard-container">
            <h2 className="dashboard-title">Bem-vindo, {usuario.proprietario}!</h2>
            <p className="dashboard-subtitle">Loja: {usuario.nome}</p>
            <p className="dashboard-clock">{horaAtual.toLocaleTimeString()}</p>

            <div className="indicadores">
                <div className="indicador-card">
                    <h4>Produto em Destaque</h4>
                    <p>{produtos[indiceProduto]?.nome || "-"}</p>
                    <small>{produtos[indiceProduto]?.quantidade || 0} unidades</small>
                </div>
                <div className="indicador-card">
                    <h4>Total de Itens</h4>
                    <p>{quantidadeTotal}</p>
                </div>
            </div>

            <div className="dashboard-buttons">
                <button
                    onClick={() => navigate("/pedidos")}
                    className="dashboard-button pedidos"
                >
                    Ver Pedidos
                </button>

                <button
                    onClick={() => navigate("/estoque")}
                    className="dashboard-button estoque"
                >
                    Ver Estoque
                </button>
            </div>

            <button
                onClick={handleLogout}
                className="dashboard-button sair"
            >
                Sair
            </button>
        </div>
    );
};

export default Dashboard;

import './Pedidos.css';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Pedidos = () => {
    const [usuario, setUsuario] = useState(null);
    const [pedidos, setPedidos] = useState([]);
    const [busca, setBusca] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const usuarioLogado = localStorage.getItem('usuario');

        if (!usuarioLogado) {
            navigate('/login');
        } else {
            const user = JSON.parse(usuarioLogado);
            setUsuario(user);
            buscarPedidos(user.banco_dados);
        }
    }, [navigate]);

    const buscarPedidos = async (banco) => {
        try {
            const res = await fetch(`/api/pedidos?banco_dados=${banco}`);
            const data = await res.json();
            console.log("🔎 Dados recebidos:", data);
            setPedidos(data);
        } catch (error) {
            console.error('Erro ao buscar pedidos:', error);
        }
    };

    const atualizarStatus = async (id, status, motivo = '') => {
        try {
            await fetch(`/api/pedidos/atualizar-status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    banco_dados: usuario.banco_dados,
                    id,
                    status,
                    motivo_cancelamento: motivo
                })
            });
            buscarPedidos(usuario.banco_dados);
        } catch (error) {
            console.error('Erro ao atualizar pedido:', error);
        }
    };

    const pedidosFiltrados = pedidos.filter(p =>
        p.nome_cliente.toLowerCase().includes(busca.toLowerCase()) ||
        p.telefone_cliente?.toLowerCase().includes(busca.toLowerCase()) ||
        p.cpf_cliente?.toLowerCase().includes(busca.toLowerCase())
    );

    const formatarStatus = (status) => {
        const baseStyle = {
            padding: '4px 10px',
            borderRadius: '20px',
            fontWeight: 'bold',
            display: 'inline-block',
            textTransform: 'uppercase'
        };
        if (status === 'Aguardando') return <span style={{ ...baseStyle, backgroundColor: '#facc15', color: '#000' }}>⏳ {status}</span>;
        if (status === 'Aprovado') return <span style={{ ...baseStyle, backgroundColor: '#22c55e', color: '#fff' }}>✅ {status}</span>;
        if (status === 'Cancelado') return <span style={{ ...baseStyle, backgroundColor: '#ef4444', color: '#fff' }}>❌ {status}</span>;
        return <span style={baseStyle}>{status}</span>;
    };

    const [statusEditando, setStatusEditando] = useState({});
    const [motivos, setMotivos] = useState({});

    const formatarItens = (itensJson) => {
        try {
            const itens = JSON.parse(itensJson);
            return (
                <ul>
                    {itens.map((item, index) => (
                        <li key={index}>
                            {item.nome} (x{item.quantidade}) - R$ {parseFloat(item.preco).toFixed(2)}
                        </li>
                    ))}
                </ul>
            );
        } catch (error) {
            console.error('Erro ao parsear itens do pedido:', error);
            return <span>Erro ao carregar itens.</span>;
        }
    };

    return (
        <div className="pedidos-container">
            <h2>📬 Pedidos Recebidos</h2>

            <input
                type="text"
                placeholder="Buscar por cliente, telefone ou CPF..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                style={{
                    padding: '10px',
                    marginBottom: '20px',
                    borderRadius: '6px',
                    border: '1px solid #aaa',
                    width: '100%',
                    maxWidth: '400px',
                    background: '#252545',
                    color: '#fff'
                }}
            />

            <div className="pedidos-tabela" style={{ overflowX: 'auto', width: '100%' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', color: '#ffffff' }}>
                    <thead>
                        <tr>
                            <th>Cliente</th>
                            <th>Telefone</th>
                            <th>CPF</th>
                            <th>Entrega</th>
                            <th>Endereço</th>
                            <th>Itens</th>
                            <th>Total</th>
                            <th>Status</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pedidosFiltrados.length === 0 ? (
                            <tr>
                                <td colSpan="9" style={{ textAlign: 'center', padding: '1rem' }}>
                                    Nenhum pedido encontrado.
                                </td>
                            </tr>
                        ) : (
                            pedidosFiltrados.map((p) => (
                                <tr key={p.id} style={{ borderBottom: '1px solid #333' }}>
                                    <td>{p.nome_cliente}</td>
                                    <td>{p.telefone_cliente}</td>
                                    <td>{p.cpf_cliente}</td>
                                    <td>{p.tipo_entrega}</td>
                                    <td>
                                        {p.rua}, {p.numero} - {p.bairro}, {p.cidade}<br />
                                        <small>{p.complemento}</small>
                                    </td>
                                    <td>{formatarItens(p.itens)}</td> {/* Modified line here */}
                                    <td>R$ {parseFloat(p.total).toFixed(2)}</td>
                                    <td>{formatarStatus(p.status)}</td>
                                    <td>
                                        <select
                                            value={statusEditando[p.id] || p.status}
                                            onChange={(e) => {
                                                const novoStatus = e.target.value;
                                                setStatusEditando((prev) => ({ ...prev, [p.id]: novoStatus }));
                                                if (novoStatus === 'Cancelado') {
                                                    setMotivos((prev) => ({ ...prev, [p.id]: '' }));
                                                }
                                            }}
                                            style={{
                                                padding: '6px',
                                                borderRadius: '6px',
                                                backgroundColor: '#1e1e2f',
                                                color: '#fff',
                                                border: '1px solid #555',
                                                marginBottom: '6px',
                                            }}
                                        >
                                            <option value="Aguardando Aprovação">Aguardando</option>
                                            <option value="Aprovado">Aprovado</option>
                                            <option value="Cancelado">Cancelado</option>
                                        </select>

                                        {statusEditando[p.id] === 'Cancelado' && (
                                            <input
                                                type="text"
                                                placeholder="Motivo do cancelamento"
                                                value={motivos[p.id] || ''}
                                                onChange={(e) =>
                                                    setMotivos((prev) => ({ ...prev, [p.id]: e.target.value }))
                                                }
                                                style={{
                                                    width: '100%',
                                                    padding: '6px',
                                                    borderRadius: '6px',
                                                    border: '1px solid #ccc',
                                                    marginBottom: '6px',
                                                    backgroundColor: '#2a2a40',
                                                    color: '#fff',
                                                }}
                                            />
                                        )}

                                        <button
                                            onClick={() =>
                                                atualizarStatus(
                                                    p.id,
                                                    statusEditando[p.id] || p.status,
                                                    statusEditando[p.id] === 'Cancelado' ? motivos[p.id] : ''
                                                )
                                            }
                                            style={{
                                                padding: '6px 12px',
                                                borderRadius: '6px',
                                                backgroundColor: '#3b82f6',
                                                color: '#fff',
                                                border: 'none',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            Enviar
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div style={{ marginTop: '2rem' }}>
                <button
                    onClick={() => navigate('/dashboard')}
                    style={{
                        backgroundColor: '#3b82f6',
                        color: '#fff',
                        padding: '10px 20px',
                        borderRadius: '6px',
                        border: 'none',
                        cursor: 'pointer'
                    }}
                >
                    ⬅ Voltar ao Dashboard
                </button>
            </div>

        </div>
    );
};

export default Pedidos;
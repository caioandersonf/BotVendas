import './Pedidos.css';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Pedidos = () => {
    const [usuario, setUsuario] = useState(null);
    const [pedidos, setPedidos] = useState([]);
    const [motivoCancelamento, setMotivoCancelamento] = useState('');
    const [pedidoSelecionado, setPedidoSelecionado] = useState(null);
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
        p.cpf?.toLowerCase().includes(busca.toLowerCase())
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
                                    <td>{p.cpf}</td>
                                    <td>{p.tipo_entrega}</td>
                                    <td>
                                        {p.rua}, {p.numero} - {p.bairro}, {p.cidade}<br />
                                        <small>{p.complemento}</small>
                                    </td>
                                    <td><pre>{p.itens}</pre></td>
                                    <td>R$ {parseFloat(p.total).toFixed(2)}</td>
                                    <td>{formatarStatus(p.status)}</td>
                                    <td>
                                        {p.status === 'Aguardando' && (
                                            <>
                                                <button
                                                    className="botao-aprovar"
                                                    onClick={() => atualizarStatus(p.id, 'Aprovado')}
                                                >
                                                    Aprovar
                                                </button>
                                                <button
                                                    className="botao-cancelar"
                                                    onClick={() => setPedidoSelecionado(p.id)}
                                                >
                                                    Cancelar
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {pedidoSelecionado && (
                <div className="modal-cancelamento">
                    <h4>Motivo do Cancelamento</h4>
                    <textarea
                        placeholder="Descreva o motivo..."
                        value={motivoCancelamento}
                        onChange={(e) => setMotivoCancelamento(e.target.value)}
                    />
                    <button
                        onClick={() => {
                            atualizarStatus(pedidoSelecionado, 'Cancelado', motivoCancelamento);
                            setPedidoSelecionado(null);
                            setMotivoCancelamento('');
                        }}
                    >
                        Confirmar Cancelamento
                    </button>
                    <button onClick={() => setPedidoSelecionado(null)}>Voltar</button>
                </div>
            )}
        </div>
    );
};

export default Pedidos;

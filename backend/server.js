const express = require('express');
const cors = require('cors');
const empresasRoutes = require('./routes/empresas');
const recoveryRoutes = require('./routes/recovery');
const loginRoutes = require('./routes/login'); 
const pedidosRoutes = require('./routes/pedidos');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/empresas', empresasRoutes);
app.use('/api/recovery', recoveryRoutes);
app.use('/api', loginRoutes);
app.use('/api/estoque', require('./routes/estoqueCampos'));
app.use("/uploads", express.static("uploads"));
app.use('/api', pedidosRoutes);

console.log('✅ Rota de pedidos carregada com sucesso!');


const PORT = 5000;
app.listen(PORT, () => {
    console.log(`🔥 Servidor rodando na porta ${PORT}`);
});

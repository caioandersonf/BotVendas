const express = require('express');
const cors = require('cors');
const empresasRoutes = require('./routes/empresas');
const recoveryRoutes = require('./routes/recovery');
const loginRoutes = require('./routes/login'); 

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/empresas', empresasRoutes);
app.use('/api/recovery', recoveryRoutes);
app.use('/api', loginRoutes);
app.use('/api/estoque', require('./routes/estoqueCampos'));
app.use("/uploads", express.static("uploads"));


const PORT = 5000;
app.listen(PORT, () => {
    console.log(`🔥 Servidor rodando na porta ${PORT}`);
});

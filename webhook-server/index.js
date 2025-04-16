import express from 'express';
import bodyParser from 'body-parser';

const app = express();
const PORT = 3000;

// Middleware para interpretar JSON corretamente
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

app.post('/webhook', (req, res) => {
  console.log('🔥 Evento recebido do WPPConnect:');
  console.log(JSON.stringify(req.body, null, 2)); // Exibe bonito
  res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log(`✅ Webhook rodando em http://localhost:${PORT}/webhook`);
});

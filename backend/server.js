const express = require('express');
const cors = require('cors');
const db = require('./database');
const { format, parseISO } = require('date-fns');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Rota raiz
app.get('/', (req, res) => {
  res.json({
    message: "Backend da Planilha Financeira Hello Kitty 🎀",
    endpoints: {
      entries: "/api/entries",
      singleEntry: "/api/entries/:id",
      batchEntries: "/api/entries/batch (POST)",
      notifications: "/api/notifications"
    },
    status: "online"
  });
});

// Rotas da API
app.get('/api/entries', (req, res, next) => {
  db.getAllEntries((err, entries) => {
    if (err) return next(err);
    res.json(entries);
  });
});

app.get('/api/entries/:id', (req, res, next) => {
  const { id } = req.params;
  db.getEntryById(id, (err, entry) => {
    if (err) return next(err);
    if (!entry) return res.status(404).json({ error: 'Entrada não encontrada' });
    res.json(entry);
  });
});

app.post('/api/entries', (req, res, next) => {
  const requiredFields = ['client', 'date', 'product', 'commission', 'forecast', 'status'];
  const missingFields = requiredFields.filter(field => !req.body[field]);

  if (missingFields.length > 0) {
    return res.status(400).json({
      error: 'Campos obrigatórios faltando',
      missingFields
    });
  }

  db.createEntry(req.body, (err, id) => {
    if (err) return next(err);
    res.status(201).json({ id, ...req.body });
  });
});

app.post('/api/entries/batch', (req, res, next) => {
  if (!Array.isArray(req.body)) {
    return res.status(400).json({ error: 'O corpo da requisição deve ser um array' });
  }

  const invalidEntries = req.body.filter(entry => {
    const requiredFields = ['client', 'date', 'product', 'commission', 'forecast', 'status'];
    return requiredFields.some(field => !entry[field]);
  });

  if (invalidEntries.length > 0) {
    return res.status(400).json({
      error: 'Algumas entradas estão incompletas',
      invalidEntriesCount: invalidEntries.length
    });
  }

  db.createBatchEntries(req.body, (err, count) => {
    if (err) return next(err);
    res.status(201).json({ 
      message: `${count} entradas criadas com sucesso`,
      count
    });
  });
});

app.put('/api/entries/:id', (req, res, next) => {
  const { id } = req.params;
  const requiredFields = ['client', 'date', 'product', 'commission', 'forecast', 'status'];
  const missingFields = requiredFields.filter(field => !req.body[field]);

  if (missingFields.length > 0) {
    return res.status(400).json({
      error: 'Campos obrigatórios faltando',
      missingFields
    });
  }

  db.updateEntry(id, req.body, (err) => {
    if (err) return next(err);
    res.json({ id, ...req.body });
  });
});

app.delete('/api/entries/:id', (req, res, next) => {
  const { id } = req.params;
  db.deleteEntry(id, (err) => {
    if (err) return next(err);
    res.json({ 
      success: true,
      message: `Entrada ${id} excluída com sucesso`
    });
  });
});

app.get('/api/notifications', (req, res, next) => {
  db.getUpcomingNotifications((err, notifications) => {
    if (err) return next(err);
    res.json(notifications);
  });
});

// Middleware de erro
app.use((err, req, res, next) => {
  console.error('[ERRO]', err.stack);
  res.status(500).json({ 
    error: 'Erro interno do servidor',
    message: err.message 
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`\n🎀 Servidor Hello Kitty rodando na porta ${PORT}`);
  console.log(`🔗 Acesse: http://localhost:${PORT}\n`);
});
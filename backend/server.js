const express = require('express');
const cors = require('cors');
const db = require('./database');
const { format, parseISO } = require('date-fns');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Rotas da API
app.get('/api/entries', async (req, res) => {
    try {
        db.getAllEntries((err, entries) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Erro ao buscar entradas' });
            }
            res.json(entries);
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.get('/api/entries/:id', async (req, res) => {
    try {
        const { id } = req.params;
        db.getEntryById(id, (err, entry) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Erro ao buscar entrada' });
            }
            if (!entry) {
                return res.status(404).json({ error: 'Entrada não encontrada' });
            }
            res.json(entry);
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.post('/api/entries', async (req, res) => {
    try {
        const entry = req.body;
        
        // Validação simples
        if (!entry.client || !entry.date || !entry.product || !entry.commission || !entry.forecast || !entry.status) {
            return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
        }
        
        db.createEntry(entry, (err, id) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Erro ao criar entrada' });
            }
            res.status(201).json({ id, ...entry });
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.post('/api/entries/batch', async (req, res) => {
    try {
        const entries = req.body;
        
        if (!Array.isArray(entries) || entries.length === 0) {
            return res.status(400).json({ error: 'Nenhuma entrada fornecida' });
        }
        
        // Validação básica
        for (const entry of entries) {
            if (!entry.client || !entry.date || !entry.product || !entry.commission || !entry.forecast || !entry.status) {
                return res.status(400).json({ error: 'Todos os campos são obrigatórios em cada entrada' });
            }
        }
        
        db.createBatchEntries(entries, (err, count) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Erro ao criar entradas em lote' });
            }
            res.status(201).json({ count });
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.put('/api/entries/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const entry = req.body;
        
        // Validação simples
        if (!entry.client || !entry.date || !entry.product || !entry.commission || !entry.forecast || !entry.status) {
            return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
        }
        
        db.updateEntry(id, entry, (err) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Erro ao atualizar entrada' });
            }
            res.json({ id, ...entry });
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.delete('/api/entries/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        db.deleteEntry(id, (err) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Erro ao excluir entrada' });
            }
            res.json({ success: true });
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.get('/api/notifications', async (req, res) => {
    try {
        db.getUpcomingNotifications((err, notifications) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Erro ao buscar notificações' });
            }
            res.json(notifications);
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const autocompleteRoutes = require('./routes/autocomplete');
const deslocamentosRoutes = require('./routes/deslocamentos');
const clientesRoutes = require('./routes/clientes'); 

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use('/api', authRoutes);
app.use('/api/autocomplete', autocompleteRoutes);
app.use('/api/deslocamentos', deslocamentosRoutes);
app.use('/api/clientes', clientesRoutes); 

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
require('dotenv').config()
const express = require('express');
const ejs = require('ejs');
const mongoose = require('mongoose');

require('./models/user');

const app = express();
const PORT = process.env.PORT || 3000;
app.set('view engine', 'ejs');

// Middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Routes
app.use(require('./routes/auth'));
// app.use(require('./routes/secrets'));


// MongoDB config
mongoose.connect('mongodb://localhost:27017/userDB', { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.set('useCreateIndex', true);

app.listen(PORT, () => console.log(`Server running at port ${PORT}: http://localhost:${PORT}/`))
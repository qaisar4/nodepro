const express = require('express');
const cookieParser = require('cookie-parser');
const routes = require('./routes');
const cors = require('cors');

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors())

app.use('/api/v1', routes);

module.exports = app;

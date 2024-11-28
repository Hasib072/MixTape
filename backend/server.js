// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);

app.set("view engine", "ejs");

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

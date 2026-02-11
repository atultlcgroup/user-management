const express = require('express');
const app = express();
require('dotenv').config();
const userRoutes = require('./routes/user.route');

app.use(express.json());
app.use('/users', userRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

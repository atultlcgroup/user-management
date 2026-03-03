const express = require('express');
const app = express();
require('dotenv').config();
const userRoutes = require('./src/routes/user.route');
const { httpLogger } = require('./src/Logger/log-to-s3/httpLogger');
const { setupShutdown } = require('./src/Logger/log-to-s3/shutdown-cleanup');

app.use(express.json());
app.use(httpLogger);
setupShutdown();
app.use('/users', userRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

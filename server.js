require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/db/db');
const requireEnv = require('./src/utils/requireEnv.util');

const port = requireEnv('PORT');

connectDB();

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
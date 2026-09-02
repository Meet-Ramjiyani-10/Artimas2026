const path = require('path');
const dotenv = require('dotenv');

// Load environment variables before initializing any application modules
dotenv.config({
  path: path.resolve(__dirname, '../.env'),
  override: true,
});

const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to MongoDB using process.env.MONGODB_URI
    await connectDB();

    // Start Express server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();

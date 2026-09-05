const path = require('path');
const dotenv = require('dotenv');

// Ensure environment variables from server/.env are loaded before database connection
dotenv.config({
  path: path.resolve(__dirname, '../../.env'),
  override: true,
});

const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {}

const mongoose = require('mongoose');

const connectDB = async () => {
  // Read process.env.MONGODB_URI directly and sanitize any surrounding quotes
  const rawUri = process.env.MONGODB_URI ? process.env.MONGODB_URI.trim() : '';
  const uri = rawUri.replace(/^["']|["']$/g, '').trim();

  const isLoaded = Boolean(uri);
  const isAtlas = uri.startsWith('mongodb+srv://') || uri.includes('.mongodb.net');
  const isLocal = uri.includes('localhost') || uri.includes('127.0.0.1');
  const connectionType = isAtlas ? 'Atlas' : (isLocal ? 'local' : 'custom');

  // Diagnostic logging — strictly never prints credentials, username, password, or connection string
  console.log(`MongoDB URI loaded: ${isLoaded ? 'yes' : 'no'}`);
  console.log(`MongoDB connection type: ${connectionType}`);

  if (!isLoaded) {
    console.error('MongoDB connection error: MONGODB_URI is not defined in server/.env');
    process.exit(1);
  }

  try {
    // Directly use process.env.MONGODB_URI with no fallback
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
      socketTimeoutMS: 45000,
    });

    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

// Graceful shutdown
mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed (app termination)');
  process.exit(0);
});

module.exports = connectDB;

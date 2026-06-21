const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/jobfinder';
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000, connectTimeoutMS: 3000 });
    console.log('MongoDB connected');
    return true;
  } catch (err) {
    console.error('MongoDB not available, using file-based storage:', err.message);
    return false;
  }
}

module.exports = connectDB;

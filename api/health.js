import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

dotenv.config();

// Initialize Express app.
const app = express();

// Middleware to ensure a single database connection.
const connectDB = async () => {
  if (mongoose.connections[0].readyState) {
    console.log('✅ Already connected to MongoDB.');
    return;
  }
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
  }
};

connectDB();

// --- MIDDLEWARES (APPLIED ONCE) ---
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true
}));
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: 'Too many requests, try again later.'
  }
}));

// Health check route.
app.get('/', async (req, res) => {
  res.json({
    success: true,
    message: '🟢 API is working!',
    db_status: mongoose.connections[0].readyState === 1 ? 'connected' : 'disconnected',
    time: new Date().toISOString()
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Global Error Handler:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { error: err.message })
  });
});

// --- EXPORT THE HANDLER FOR VERCEL ---

// This is the most reliable pattern for a single file on Vercel.

export default function handler(req, res) {

  return app(req, res);

}

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import contactRoutes from './routes/contactRoutes.js';

dotenv.config();

let isConnected = false; // Track DB connection

// Serverless handler for Vercel
export default async function handler(req, res) {
  const app = express();

  // Trust proxy (fixes rate-limit issues)
  app.set('trust proxy', 1);

  // Middlewares
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

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  app.use((reqLog, resLog, next) => {
    console.log(`${new Date().toISOString()} - ${reqLog.method} ${reqLog.url}`);
    next();
  });

  // Routes
  app.use('/api/contact', contactRoutes);

  app.get('/api/health', (req, res) => {
    res.json({
      success: true,
      message: '🟢 API is working!',
      time: new Date().toISOString()
    });
  });

  app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
  });

  app.use((err, req, res, next) => {
    console.error('Error handler:', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { error: err.message })
    });
  });

  // Connect to MongoDB if not already
  if (!isConnected) {
    try {
      const conn = await mongoose.connect(process.env.MONGODB_URI);
      isConnected = true;
      console.log(`✅ MongoDB connected: ${conn.connection.host}`);
    } catch (error) {
      console.error('❌ MongoDB error:', error.message);
    }
  }

  return app(req, res); // 🧠 Express adapter for Vercel
}

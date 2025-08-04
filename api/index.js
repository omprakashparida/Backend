import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import contactRoutes from './routes/contactRoutes.js';

dotenv.config();

const app = express();

// ✅ Fixes rate-limit issue with Vercel (important!)
app.set('trust proxy', 1);

// 🛡️ Security middleware
app.use(helmet());

// 🌐 CORS setup
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://portfolio-9lgiozojm-om-prakash-paridas-projects-3a26066e.vercel.app'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// ⚡ Rate limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
});
app.use(globalLimiter);

// 📦 Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 📜 Logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - ${req.ip}`);
  next();
});

// 📬 Contact form route
app.use('/api/contact', contactRoutes);

// ✅ Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running 💪',
    timestamp: new Date().toISOString()
  });
});

// ❌ 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// 🛠️ Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { error: error.message })
  });
});

// 🔌 DB connection
let isConnected = false;
const connectDB = async () => {
  if (isConnected) return;
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    isConnected = true;
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ DB Connection Error:', error);
  }
};

// 🚀 Vercel handler
export default async function handler(req, res) {
  await connectDB();
  return app(req, res);
}

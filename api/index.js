import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import contactRoutes from '../routes/contactRoutes.js';

dotenv.config();

// --- INITIALIZE THE APP ONCE ---
const app = express();

// --- DATABASE CONNECTION ---
// This pattern ensures we only connect once.
const connectDB = async () => {
  // mongoose.connections[0].readyState:
  // 0 = disconnected
  // 1 = connected
  // 2 = connecting
  // 3 = disconnecting
  if (mongoose.connections[0].readyState) {
    console.log('✅ Already connected to MongoDB.');
    return;
  }
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    // Exit process with failure in a serverless env is tricky,
    // logging the error is the most important part.
  }
};

// Connect to the database when the serverless function starts
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

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});


// --- ROUTES (APPLIED ONCE) ---
// --- CORRECTED ROUTES ---
// The public URL is still /api/contact, but Express handles it as /contact
app.use('/contact', contactRoutes);

// The public URL is still /api/health, but Express handles it as /health
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: '🟢 API is working!',
    db_status: mongoose.connections[0].readyState === 1 ? 'connected' : 'disconnected',
    time: new Date().toISOString()
  });
});


// --- ERROR HANDLERS (APPLIED ONCE) ---
// 404 Not Found Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
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

// --- EXPORT THE HANDLER ---
// The handler is now just a lightweight function that passes
// requests to our pre-built app.
export default app;

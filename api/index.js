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
// Setting 'trust proxy' to 1 is the correct and secure setting for Vercel.
// This will fix the ValidationError from express-rate-limit.
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

// --- ROUTES ---

// Added a root route to prevent 404 on the base URL.
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to the Vercel API. Use /api/health or /api/contact to access API endpoints.'
  });
});

// Added routes to handle favicon requests and prevent 404 errors.
// A 204 No Content status code is returned as this is a backend API,
// not a frontend serving a static file.
app.get('/favicon.ico', (req, res) => res.status(204).end());
app.get('/favicon.png', (req, res) => res.status(204).end());

// Create an API router to handle all endpoints under the '/api' path.
const apiRouter = express.Router();

// Health check route, mounted on the apiRouter.
apiRouter.get('/health', (req, res) => {
  res.json({
    success: true,
    message: '🟢 API is working!',
    db_status: mongoose.connections[0].readyState === 1 ? 'connected' : 'disconnected',
    time: new Date().toISOString()
  });
});

// Contact routes, also mounted on the apiRouter.
apiRouter.use('/contact', contactRoutes);

// Mount the apiRouter to the '/api' path in the main application.
// This will now handle requests to:
// - your-app.vercel.app/api/health
// - your-app.vercel.app/api/contact
app.use('/api', apiRouter);

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

// --- EXPORT THE HANDLER FOR VERCEL ---
// This is a more robust pattern for Vercel, which will automatically wrap the
// Express app as a serverless function.
export default app;

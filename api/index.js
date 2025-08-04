
import express from 'express';

const app = express();

// Optional: Enable CORS for frontend testing
import cors from 'cors';
app.use(cors());

// Simple Health Route
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '🟢 API is working!',
    time: new Date().toISOString()
  });
});

// Export for Vercel (serverless handler)
export default function handler(req, res) {
  return app(req, res);
}


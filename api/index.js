import express from 'express';

// Initialize the app.
const app = express();

// Root route to prevent 404 on the base URL.
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to the Vercel API. Use /api/health or /api/contact to access API endpoints.'
  });
});

// Routes to handle favicon requests.
app.get('/favicon.ico', (req, res) => res.status(204).end());
app.get('/favicon.png', (req, res) => res.status(204).end());

// --- EXPORT THE HANDLER FOR VERCEL ---
// This is the most reliable pattern for a single file on Vercel.
export default function handler(req, res) {
  return app(req, res);
}


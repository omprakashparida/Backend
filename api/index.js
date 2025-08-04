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
// A 204 No Content status code is returned as this is a backend API.
app.get('/favicon.ico', (req, res) => res.status(204).end());
app.get('/favicon.png', (req, res) => res.status(204).end());

// Export the handler for Vercel.
export default app;

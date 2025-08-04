import app from '../server.js';

\

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running 💪',
    timestamp: new Date().toISOString()
  });
});


export default app;

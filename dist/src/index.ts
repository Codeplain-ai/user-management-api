import express, { Express, Request, Response, NextFunction } from 'express';
import { healthCheckRouter } from './routes/health-check';
import { usersRouter } from './routes/users';

const app: Express = express();
const PORT = 8000;

// Middleware
app.use(express.json());

// Error handling middleware for JSON parsing errors
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof SyntaxError && 'body' in err) {
    console.error(`[ERROR] JSON parsing error: ${err.message}, URL: ${req.url}, Method: ${req.method}`);
    return res.status(400).json({
      error: 'invalid_json',
      message: 'Request body contains invalid JSON',
      details: err.message
    });
  }
  next(err);
});

// Routes
app.use('/health_check', healthCheckRouter);
app.use('/users', usersRouter);

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(`[ERROR] Unhandled error: ${err.message}, Stack: ${err.stack}, URL: ${req.url}, Method: ${req.method}`);
  res.status(500).json({
    error: 'internal_server_error',
    message: 'An unexpected error occurred',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`[INFO] Server is running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[INFO] SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('[INFO] HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('[INFO] SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('[INFO] HTTP server closed');
    process.exit(0);
  });
});

export { app };
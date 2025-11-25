import { Router, Request, Response } from 'express';

export const healthCheckRouter = Router();

healthCheckRouter.get('/', (req: Request, res: Response) => {
  try {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'api'
    });
  } catch (error) {
    console.error('[ERROR] Health check failed:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({
      status: 'error',
      error: 'health_check_failed',
      message: 'Health check endpoint encountered an error',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});
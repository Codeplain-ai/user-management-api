import { Router, Request, Response } from 'express';
import { createUser, getUserById, deleteUserById } from '../services/user-service';
import { handleUserRouteError } from './error-handler';

export const usersRouter = Router();

/**
 * POST /users - Create a new user
 */
usersRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    // Validate request body structure
    if (!req.body || typeof req.body !== 'object') {
      console.error('[ERROR] Invalid request body: body is not an object', {
        url: req.url,
        method: req.method,
        body: req.body
      });
      return res.status(400).json({
        status: 'error',
        error: 'invalid_request',
        message: 'Request body must be a JSON object',
        field: 'body'
      });
    }

    // Create user
    const user = await createUser({ name, email, password });

    // Return created user (without password)
    return res.status(201).json({
      status: 'success',
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        created_at: user.created_at.toISOString(),
        updated_at: user.updated_at.toISOString()
      }
    });
  } catch (error) {
    handleUserRouteError(error, req, res, 'creating user');
  }
});

/**
 * GET /users/:id - Get a user by ID
 */
usersRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate that ID parameter exists
    if (!id) {
      console.error('[ERROR] Missing user ID parameter', {
        url: req.url,
        method: req.method
      });
      return res.status(400).json({
        status: 'error',
        error: 'validation_error',
        message: 'User ID is required',
        field: 'id'
      });
    }

    // Get user by ID
    const user = await getUserById(id);

    // Return user data
    return res.status(200).json({
      status: 'success',
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        created_at: user.created_at.toISOString(),
        updated_at: user.updated_at.toISOString()
      }
    });
  } catch (error) {
    handleUserRouteError(error, req, res, 'retrieving user');
  }
});

/**
 * DELETE /users/:id - Delete a user by ID
 */
usersRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate that ID parameter exists
    if (!id) {
      console.error('[ERROR] Missing user ID parameter', {
        url: req.url,
        method: req.method
      });
      return res.status(400).json({
        status: 'error',
        error: 'validation_error',
        message: 'User ID is required',
        field: 'id'
      });
    }

    // Delete user by ID
    await deleteUserById(id);

    // Return 204 No Content on success
    return res.status(204).send();
  } catch (error) {
    handleUserRouteError(error, req, res, 'deleting user');
  }
});
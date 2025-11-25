import { query } from '../db/connection';
import * as crypto from 'crypto';

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  created_at: Date;
  updated_at: Date;
}

export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class DuplicateEmailError extends Error {
  constructor(email: string) {
    super(`User with email '${email}' already exists`);
    this.name = 'DuplicateEmailError';
  }
}

export class UserNotFoundError extends Error {
  constructor(id: string) {
    super(`User with ID '${id}' not found`);
    this.name = 'UserNotFoundError';
  }
}

/**
 * Hash a password using SHA-256 (using crypto since bcrypt requires native dependencies)
 */
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate UUID format
 */
function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

function validateUserInput(input: CreateUserInput): void {
  if (!input.name || typeof input.name !== 'string') {
    throw new ValidationError('Name is required and must be a string', 'name');
  }

  if (input.name.trim().length === 0) {
    throw new ValidationError('Name cannot be empty', 'name');
  }

  if (input.name.length > 255) {
    throw new ValidationError('Name must be 255 characters or less', 'name');
  }

  if (!input.email || typeof input.email !== 'string') {
    throw new ValidationError('Email is required and must be a string', 'email');
  }

  if (!isValidEmail(input.email)) {
    throw new ValidationError('Email must be a valid email address', 'email');
  }

  if (input.email.length > 255) {
    throw new ValidationError('Email must be 255 characters or less', 'email');
  }

  if (!input.password || typeof input.password !== 'string') {
    throw new ValidationError('Password is required and must be a string', 'password');
  }

  if (input.password.length < 8) {
    throw new ValidationError('Password must be at least 8 characters long', 'password');
  }

  if (input.password.length > 255) {
    throw new ValidationError('Password must be 255 characters or less', 'password');
  }
}

/**
 * Create a new user
 */
export async function createUser(input: CreateUserInput): Promise<User> {
  try {
    // Validate input
    validateUserInput(input);

    // Hash password
    const hashedPassword = hashPassword(input.password);

    // Insert user into database
    const result = await query<User>(
      `INSERT INTO users (name, email, password)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, created_at, updated_at`,
      [input.name.trim(), input.email.toLowerCase().trim(), hashedPassword]
    );

    if (result.rows.length === 0) {
      throw new Error('Failed to create user: no rows returned from database');
    }

    const user = result.rows[0];
    console.log('[INFO] User created successfully:', { id: user.id, email: user.email });

    return user;
  } catch (error) {
    // Handle duplicate email error (PostgreSQL unique constraint violation)
    if (error instanceof Error && 'code' in error && error.code === '23505') {
      console.error('[ERROR] Duplicate email error:', { email: input.email });
      throw new DuplicateEmailError(input.email);
    }

    // Re-throw validation errors
    if (error instanceof ValidationError) {
      throw error;
    }

    // Log and re-throw other errors
    console.error('[ERROR] Failed to create user:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      input: { name: input.name, email: input.email }
    });

    throw error;
  }
}

/**
 * Delete a user by ID
 */
export async function deleteUserById(id: string): Promise<void> {
  try {
    // Validate UUID format
    if (!id || typeof id !== 'string') {
      throw new ValidationError('User ID is required and must be a string', 'id');
    }

    if (!isValidUUID(id)) {
      throw new ValidationError('User ID must be a valid UUID', 'id');
    }

    // Delete user from database
    const result = await query(
      `DELETE FROM users WHERE id = $1`,
      [id]
    );

    if (result.rowCount === 0) {
      console.log('[INFO] User not found for deletion:', { id });
      throw new UserNotFoundError(id);
    }

    console.log('[INFO] User deleted successfully:', { id });
  } catch (error) {
    // Re-throw known errors
    if (error instanceof ValidationError || error instanceof UserNotFoundError) {
      throw error;
    }

    // Log and re-throw other errors
    console.error('[ERROR] Failed to delete user:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      id
    });

    throw error;
  }
}

/**
 * Get a user by ID
 */
export async function getUserById(id: string): Promise<User> {
  try {
    // Validate UUID format
    if (!id || typeof id !== 'string') {
      throw new ValidationError('User ID is required and must be a string', 'id');
    }

    if (!isValidUUID(id)) {
      throw new ValidationError('User ID must be a valid UUID', 'id');
    }

    // Query database for user
    const result = await query<User>(
      `SELECT id, name, email, created_at, updated_at
       FROM users
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      console.log('[INFO] User not found:', { id });
      throw new UserNotFoundError(id);
    }

    const user = result.rows[0];
    console.log('[INFO] User retrieved successfully:', { id: user.id, email: user.email });

    return user;
  } catch (error) {
    // Re-throw known errors
    if (error instanceof ValidationError || error instanceof UserNotFoundError) {
      throw error;
    }

    // Log and re-throw other errors
    console.error('[ERROR] Failed to retrieve user:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      id
    });

    throw error;
  }
}
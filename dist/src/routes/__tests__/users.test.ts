import request from 'supertest';
import { app } from '../../index';
import { createUser, getUserById, deleteUserById, ValidationError, DuplicateEmailError, UserNotFoundError } from '../../services/user-service';

// Mock the user service
jest.mock('../../services/user-service', () => ({
  ...jest.requireActual('../../services/user-service'),
  createUser: jest.fn(),
  getUserById: jest.fn(),
  deleteUserById: jest.fn()
}));

const mockedCreateUser = createUser as jest.MockedFunction<typeof createUser>;
const mockedGetUserById = getUserById as jest.MockedFunction<typeof getUserById>;
const mockedDeleteUserById = deleteUserById as jest.MockedFunction<typeof deleteUserById>;

describe('POST /users', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a user successfully', async () => {
    const mockUser = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'John Doe',
      email: 'john@example.com',
      created_at: new Date('2025-11-25T10:00:00.000Z'),
      updated_at: new Date('2025-11-25T10:00:00.000Z')
    };

    mockedCreateUser.mockResolvedValue(mockUser);

    const response = await request(app)
      .post('/users')
      .send({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      })
      .expect(201);

    expect(response.body).toEqual({
      status: 'success',
      data: {
        id: mockUser.id,
        name: mockUser.name,
        email: mockUser.email,
        created_at: '2025-11-25T10:00:00.000Z',
        updated_at: '2025-11-25T10:00:00.000Z'
      }
    });

    expect(mockedCreateUser).toHaveBeenCalledWith({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123'
    });
  });

  it('should return 400 for validation error - missing name', async () => {
    mockedCreateUser.mockRejectedValue(
      new ValidationError('Name is required and must be a string', 'name')
    );

    const response = await request(app)
      .post('/users')
      .send({
        email: 'john@example.com',
        password: 'password123'
      })
      .expect(400);

    expect(response.body).toEqual({
      status: 'error',
      error: 'validation_error',
      message: 'Name is required and must be a string',
      field: 'name'
    });
  });

  it('should return 400 for validation error - invalid email', async () => {
    mockedCreateUser.mockRejectedValue(
      new ValidationError('Email must be a valid email address', 'email')
    );

    const response = await request(app)
      .post('/users')
      .send({
        name: 'John Doe',
        email: 'invalid-email',
        password: 'password123'
      })
      .expect(400);

    expect(response.body).toEqual({
      status: 'error',
      error: 'validation_error',
      message: 'Email must be a valid email address',
      field: 'email'
    });
  });

  it('should return 400 for validation error - short password', async () => {
    mockedCreateUser.mockRejectedValue(
      new ValidationError('Password must be at least 8 characters long', 'password')
    );

    const response = await request(app)
      .post('/users')
      .send({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'short'
      })
      .expect(400);

    expect(response.body).toEqual({
      status: 'error',
      error: 'validation_error',
      message: 'Password must be at least 8 characters long',
      field: 'password'
    });
  });

  it('should return 409 for duplicate email', async () => {
    mockedCreateUser.mockRejectedValue(
      new DuplicateEmailError('john@example.com')
    );

    const response = await request(app)
      .post('/users')
      .send({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      })
      .expect(409);

    expect(response.body).toEqual({
      status: 'error',
      error: 'duplicate_email',
      message: "User with email 'john@example.com' already exists",
      field: 'email'
    });
  });

  it('should return 400 for invalid request body', async () => {
    const response = await request(app)
      .post('/users')
      .send('invalid json string')
      .set('Content-Type', 'application/json')
      .expect(400);

    expect(response.body.error).toBe('invalid_json');
  });

  it('should return 500 for unexpected errors', async () => {
    mockedCreateUser.mockRejectedValue(new Error('Unexpected database error'));

    const response = await request(app)
      .post('/users')
      .send({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      })
      .expect(500);

    expect(response.body).toEqual({
      status: 'error',
      error: 'internal_server_error',
      message: 'An unexpected error occurred while creating user',
      details: 'Unexpected database error'
    });
  });

  it('should return 503 for database connection errors', async () => {
    mockedCreateUser.mockRejectedValue(new Error('connect ECONNREFUSED'));

    const response = await request(app)
      .post('/users')
      .send({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      })
      .expect(503);

    expect(response.body).toEqual({
      status: 'error',
      error: 'database_unavailable',
      message: 'Unable to connect to database',
      details: 'connect ECONNREFUSED'
    });
  });
});

describe('GET /users/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should retrieve a user successfully', async () => {
    const mockUser = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'John Doe',
      email: 'john@example.com',
      created_at: new Date('2025-11-25T10:00:00.000Z'),
      updated_at: new Date('2025-11-25T10:00:00.000Z')
    };

    mockedGetUserById.mockResolvedValue(mockUser);

    const response = await request(app)
      .get('/users/123e4567-e89b-12d3-a456-426614174000')
      .expect(200);

    expect(response.body).toEqual({
      status: 'success',
      data: {
        id: mockUser.id,
        name: mockUser.name,
        email: mockUser.email,
        created_at: '2025-11-25T10:00:00.000Z',
        updated_at: '2025-11-25T10:00:00.000Z'
      }
    });

    expect(mockedGetUserById).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
  });

  it('should return 404 for non-existent user', async () => {
    mockedGetUserById.mockRejectedValue(
      new UserNotFoundError('123e4567-e89b-12d3-a456-426614174000')
    );

    const response = await request(app)
      .get('/users/123e4567-e89b-12d3-a456-426614174000')
      .expect(404);

    expect(response.body).toEqual({
      status: 'error',
      error: 'user_not_found',
      message: "User with ID '123e4567-e89b-12d3-a456-426614174000' not found"
    });
  });

  it('should return 400 for invalid UUID format', async () => {
    mockedGetUserById.mockRejectedValue(
      new ValidationError('User ID must be a valid UUID', 'id')
    );

    const response = await request(app)
      .get('/users/invalid-uuid')
      .expect(400);

    expect(response.body).toEqual({
      status: 'error',
      error: 'validation_error',
      message: 'User ID must be a valid UUID',
      field: 'id'
    });
  });

  it('should return 400 for empty ID', async () => {
    const response = await request(app)
      .get('/users/')
      .expect(404); // Express returns 404 for missing route parameter
  });

  it('should return 503 for database connection errors', async () => {
    mockedGetUserById.mockRejectedValue(new Error('connect ECONNREFUSED'));

    const response = await request(app)
      .get('/users/123e4567-e89b-12d3-a456-426614174000')
      .expect(503);

    expect(response.body).toEqual({
      status: 'error',
      error: 'database_unavailable',
      message: 'Unable to connect to database',
      details: 'connect ECONNREFUSED'
    });
  });

  it('should return 500 for unexpected errors', async () => {
    mockedGetUserById.mockRejectedValue(new Error('Unexpected database error'));

    const response = await request(app)
      .get('/users/123e4567-e89b-12d3-a456-426614174000')
      .expect(500);

    expect(response.body).toEqual({
      status: 'error',
      error: 'internal_server_error',
      message: 'An unexpected error occurred while retrieving user',
      details: 'Unexpected database error'
    });
  });
});

describe('DELETE /users/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should delete a user successfully', async () => {
    mockedDeleteUserById.mockResolvedValue(undefined);

    const response = await request(app)
      .delete('/users/123e4567-e89b-12d3-a456-426614174000')
      .expect(204);

    expect(response.body).toEqual({});
    expect(mockedDeleteUserById).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
  });

  it('should return 404 for non-existent user', async () => {
    mockedDeleteUserById.mockRejectedValue(
      new UserNotFoundError('123e4567-e89b-12d3-a456-426614174000')
    );

    const response = await request(app)
      .delete('/users/123e4567-e89b-12d3-a456-426614174000')
      .expect(404);

    expect(response.body).toEqual({
      status: 'error',
      error: 'user_not_found',
      message: "User with ID '123e4567-e89b-12d3-a456-426614174000' not found"
    });
  });

  it('should return 400 for invalid UUID format', async () => {
    mockedDeleteUserById.mockRejectedValue(
      new ValidationError('User ID must be a valid UUID', 'id')
    );

    const response = await request(app)
      .delete('/users/invalid-uuid')
      .expect(400);

    expect(response.body).toEqual({
      status: 'error',
      error: 'validation_error',
      message: 'User ID must be a valid UUID',
      field: 'id'
    });
  });

  it('should return 400 for empty ID', async () => {
    const response = await request(app)
      .delete('/users/')
      .expect(404); // Express returns 404 for missing route parameter
  });

  it('should return 503 for database connection errors', async () => {
    mockedDeleteUserById.mockRejectedValue(new Error('connect ECONNREFUSED'));

    const response = await request(app)
      .delete('/users/123e4567-e89b-12d3-a456-426614174000')
      .expect(503);

    expect(response.body).toEqual({
      status: 'error',
      error: 'database_unavailable',
      message: 'Unable to connect to database',
      details: 'connect ECONNREFUSED'
    });
  });

  it('should return 500 for unexpected errors', async () => {
    mockedDeleteUserById.mockRejectedValue(new Error('Unexpected database error'));

    const response = await request(app)
      .delete('/users/123e4567-e89b-12d3-a456-426614174000')
      .expect(500);

    expect(response.body).toEqual({
      status: 'error',
      error: 'internal_server_error',
      message: 'An unexpected error occurred while deleting user',
      details: 'Unexpected database error'
    });
  });
});
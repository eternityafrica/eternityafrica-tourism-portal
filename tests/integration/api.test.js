const request = require('supertest');
const app = require('../src/server');

describe('API Health Check', () => {
    test('GET /health should return 200', async () => {
        const response = await request(app).get('/health');
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('healthy');
    });

    test('GET / should return API information', async () => {
        const response = await request(app).get('/');
        expect(response.status).toBe(200);
        expect(response.body.name).toBe('Eternity Africa Tourism Portal');
        expect(response.body.version).toBe('1.0.0');
    });
});

describe('Authentication Endpoints', () => {
    test('POST /api/auth/register should create new user', async () => {
        const userData = {
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            password: 'password123'
        };

        const response = await request(app)
            .post('/api/auth/register')
            .send(userData);

        expect(response.status).toBe(201);
        expect(response.body.message).toBe('User registered successfully');
        expect(response.body.token).toBeDefined();
        expect(response.body.user.email).toBe(userData.email);
    });

    test('POST /api/auth/register should fail with existing email', async () => {
        const userData = {
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            password: 'password123'
        };

        // First registration
        await request(app)
            .post('/api/auth/register')
            .send(userData);

        // Second registration with same email
        const response = await request(app)
            .post('/api/auth/register')
            .send(userData);

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('User already exists with this email');
    });
});

describe('Tours Endpoints', () => {
    test('GET /api/tours should return tour packages', async () => {
        const response = await request(app).get('/api/tours');
        expect(response.status).toBe(200);
        expect(response.body.tours).toBeDefined();
        expect(response.body.pagination).toBeDefined();
    });
});

describe('404 Handler', () => {
    test('Should return 404 for non-existent endpoints', async () => {
        const response = await request(app).get('/api/nonexistent');
        expect(response.status).toBe(404);
        expect(response.body.message).toBe('Endpoint not found');
    });
});
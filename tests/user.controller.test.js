jest.mock('../src/models/user.model');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

const User = require('../src/models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'testsecret';

const userController = require('../src/controllers/user.controller');

function mockRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

describe('userController.createUser', () => {
    it('creates user and returns token', async () => {
        const req = { body: { name: 'Alice', email: 'a@b.com', mobile: '123', password: 'pass' } };
        const res = mockRes();
        bcrypt.hash.mockResolvedValue('hashedpwd');
        User.create.mockResolvedValue({ id: 1, name: 'Alice', email: 'a@b.com', mobile: '123', password: 'hashedpwd' });
        jwt.sign.mockReturnValue('token123');

        await userController.createUser(req, res);

        expect(bcrypt.hash).toHaveBeenCalledWith('pass', 10);
        expect(User.create).toHaveBeenCalled();
        expect(jwt.sign).toHaveBeenCalledWith({ id: 1, email: 'a@b.com' }, 'testsecret', { expiresIn: '1h' });
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ token: 'token123', user: expect.any(Object) }));
        const sent = res.json.mock.calls[0][0].user;
        expect(sent.password).toBeUndefined();
    });

    it('server error', async () => {
        const req = { body: { name: 'Alice', email: 'a@b.com', mobile: '123', password: 'pass' } };
        const res = mockRes();
        bcrypt.hash.mockRejectedValue(new Error('Server error'));

        await userController.createUser(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'Server error' });
    });
});

describe('userController.loginUser', () => {
    it('returns token for valid credentials', async () => {
        const req = { body: { email: 'a@b.com', password: 'pass' } };
        const res = mockRes();
        User.getByEmail.mockResolvedValue({ id: 1, email: 'a@b.com', password: 'hashedpwd' });
        bcrypt.compare.mockResolvedValue(true);
        jwt.sign.mockReturnValue('toklogin');

        await userController.loginUser(req, res);

        expect(User.getByEmail).toHaveBeenCalledWith('a@b.com');
        expect(bcrypt.compare).toHaveBeenCalledWith('pass', 'hashedpwd');
        expect(res.json).toHaveBeenCalledWith({ token: 'toklogin', user: expect.any(Object) });
        expect(res.json.mock.calls[0][0].user.password).toBeUndefined();
    });

    it('invalid credentials', async () => {
        const req = { body: { email: 'a@b.com', password: 'wrongpass' } };
        const res = mockRes();
        User.getByEmail.mockResolvedValue({ id: 1, email: 'a@b.com', password: 'hashedpwd' });
        bcrypt.compare.mockResolvedValue(false);

        await userController.loginUser(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: 'Invalid credentials' });
    });

    it('server error', async () => {
        const req = { body: { email: 'a@b.com', password: 'pass' } };
        const res = mockRes();
        User.getByEmail.mockRejectedValue(new Error('Server error'));

        await userController.loginUser(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'Server error' });
    });
});

describe('userController.getAllUsers', () => {
    it('returns list of users', async () => {
        const req = {};
        const res = mockRes();
        User.getAll.mockResolvedValue([{ id: 1, name: 'A' }, { id: 2, name: 'B' }]);
        await userController.getAllUsers(req, res);
        expect(User.getAll).toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith([{ id: 1, name: 'A' }, { id: 2, name: 'B' }]);
    });

    it('server error', async () => {
        const req = {};
        const res = mockRes();
        User.getAll.mockRejectedValue(new Error('Server error'));
        await userController.getAllUsers(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'Server error' });
    });
});

describe('userController.getUserById', () => {
    it('returns user if found', async () => {
        const req = { params: { id: 1 } };
        const res = mockRes();
        User.getById.mockResolvedValue({ id: 1, name: 'A' });
        await userController.getUserById(req, res);
        expect(User.getById).toHaveBeenCalledWith(1);
        expect(res.json).toHaveBeenCalledWith({ id: 1, name: 'A' });
    });

    it('returns 404 if not found', async () => {
        const req = { params: { id: 5 } };
        const res = mockRes();
        User.getById.mockResolvedValue(null);
        await userController.getUserById(req, res);
        expect(User.getById).toHaveBeenCalledWith(5);
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
    });

    it('server error', async () => {
        const req = { params: { id: 1 } };
        const res = mockRes();
        User.getById.mockRejectedValue(new Error('Server error'));
        await userController.getUserById(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'Server error' });
    });
});

describe('userController.updateUser', () => {
    it('updates user and returns updated data', async () => {
        const req = { params: { id: 1 }, body: { name: 'A', email: 'a@b.com', mobile: '123', isActive: true } };
        const res = mockRes();
        User.update.mockResolvedValue({ id: 1, name: 'A', email: 'a@b.com', mobile: '123', isActive: true });
        await userController.updateUser(req, res);
        expect(User.update).toHaveBeenCalledWith(1, 'A', 'a@b.com', '123', true, null);
        expect(res.json).toHaveBeenCalledWith({ id: 1, name: 'A', email: 'a@b.com', mobile: '123', isActive: true });
    });

    it('returns 404 if user not found', async () => {
        const req = { params: { id: 5 }, body: { name: 'A', email: 'a@b.com', mobile: '123', isActive: true } };
        const res = mockRes();
        User.update.mockResolvedValue(null);
        await userController.updateUser(req, res);
        expect(User.update).toHaveBeenCalledWith(5, 'A', 'a@b.com', '123', true, null);
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
    });

    it('server error', async () => {
        const req = { params: { id: 1 }, body: { name: 'A', email: 'a@b.com', mobile: '123', isActive: true } };
        const res = mockRes();
        User.update.mockRejectedValue(new Error('Server error'));
        await userController.updateUser(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'Server error' });
    });

    it('updates password if provided', async () => {
        const req = { params: { id: 1 }, body: { name: 'A', email: 'a@b.com', mobile: '123', isActive: true, password: 'newpassword' } };
        const res = mockRes();
        bcrypt.hash.mockResolvedValue('hashedpwd');
        User.update.mockResolvedValue({ id: 1, name: 'A', email: 'a@b.com', mobile: '123', isActive: true, password: 'hashedpwd' });
        await userController.updateUser(req, res);
        expect(bcrypt.hash).toHaveBeenCalledWith('newpassword', 10);
        expect(User.update).toHaveBeenCalledWith(1, 'A', 'a@b.com', '123', true, 'hashedpwd');
        expect(res.json).toHaveBeenCalledWith({ id: 1, name: 'A', email: 'a@b.com', mobile: '123', isActive: true });
    });
});

describe('userController.deleteUser', () => {
    it('deletes user and returns message', async () => {
        const req = { params: { id: 1 } };
        const res = mockRes();
        User.delete.mockResolvedValue({ id: 1, is_active: false, is_deleted: true });
        await userController.deleteUser(req, res);
        expect(User.delete).toHaveBeenCalledWith(1);
        expect(res.json).toHaveBeenCalledWith({ message: 'User deleted', user: { id: 1, is_active: false, is_deleted: true } });
    });

    it('returns 404 if user not found', async () => {
        const req = { params: { id: 5 } };
        const res = mockRes();
        User.delete.mockResolvedValue(null);
        await userController.deleteUser(req, res);
        expect(User.delete).toHaveBeenCalledWith(5);
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
    });

    it('server error', async () => {
        const req = { params: { id: 1 } };
        const res = mockRes();
        User.delete.mockRejectedValue(new Error('Server error'));
        await userController.deleteUser(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'Server error' });
    });
});
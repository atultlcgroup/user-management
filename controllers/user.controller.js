const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

const userController = {
    async createUser(req, res) {
        try {
            const { name, email, mobile, password } = req.body;
            if (!password) return res.status(400).json({ error: 'Password is required' });
            const hashed = await bcrypt.hash(password, 10);
            const user = await User.create(name, email, mobile, hashed);
            if (!user) return res.status(500).json({ error: 'Server error' });
            if (user) delete user.password;
            if (!JWT_SECRET) return res.status(500).json({ error: 'JWT secret not configured' });
            const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
            res.json({ token, user });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Server error' });
        }
    },

    async getAllUsers(req, res) {
        try {
            const users = await User.getAll();
            res.json(users);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Server error' });
        }
    },

    async getUserById(req, res) {
        try {
            const user = await User.getById(req.params.id);
            if (!user) return res.status(404).json({ error: 'User not found' });
            res.json(user);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Server error' });
        }
    },

    async updateUser(req, res) {
        try {
            const { name, email, mobile, isActive, password } = req.body;
            let hashed = null;
            if (password) hashed = await bcrypt.hash(password, 10);
            const user = await User.update(req.params.id, name, email, mobile, isActive, hashed);
            if (!user) return res.status(404).json({ error: 'User not found' });
            if (user) delete user.password;
            res.json(user);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Server error' });
        }
    },

    async loginUser(req, res) {
        try {
            const { email, password } = req.body;
            if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
            const user = await User.getByEmail(email);
            if (!user?.password) return res.status(401).json({ error: 'Invalid credentials' });
            const match = await bcrypt.compare(password, user.password);
            if (!match) return res.status(401).json({ error: 'Invalid credentials' });
            if (!JWT_SECRET) return res.status(500).json({ error: 'JWT secret not configured' });
            const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
            if (user) delete user.password;
            res.json({ token, user });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Server error' });
        }
    },

    async deleteUser(req, res) {
        try {
            const user = await User.delete(req.params.id);
            if (!user) return res.status(404).json({ error: 'User not found' });
            res.json({ message: 'User deleted', user });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Server error' });
        }
    },
};

module.exports = userController;

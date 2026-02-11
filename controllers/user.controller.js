const User = require('../models/user.model');

const userController = {
    async createUser(req, res) {
        try {
            const { name, email, mobile } = req.body;
            const user = await User.create(name, email, mobile);
            res.json(user);
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
            const { name, email, mobile, isActive } = req.body;
            const user = await User.update(req.params.id, name, email, mobile, isActive);
            if (!user) return res.status(404).json({ error: 'User not found' });
            res.json(user);
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

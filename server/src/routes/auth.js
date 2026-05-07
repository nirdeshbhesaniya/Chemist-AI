const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// @POST /api/auth/register
router.post('/register', [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

        const { name, email, password, organization, role } = req.body;
        const existing = await User.findOne({ email });
        if (existing) return res.status(409).json({ error: 'Email already registered' });

        const user = await User.create({ name, email, password, organization, role });
        const token = generateToken(user._id);

        res.status(201).json({
            token,
            user: { id: user._id, name: user.name, email: user.email, organization: user.organization, role: user.role }
        });
    } catch (err) { next(err); }
});

// @POST /api/auth/login
router.post('/login', [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required')
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

        const { email, password } = req.body;
        const user = await User.findOne({ email }).select('+password');
        if (!user || !(await user.matchPassword(password))) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = generateToken(user._id);
        res.json({
            token,
            user: { id: user._id, name: user.name, email: user.email, organization: user.organization, role: user.role }
        });
    } catch (err) { next(err); }
});

// @GET /api/auth/me
router.get('/me', protect, async (req, res) => {
    res.json({ user: req.user });
});

module.exports = router;

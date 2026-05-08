const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    // TEMPORARY: Bypass authentication for demo purposes
    // We'll try to find a mock user or the first user in DB to keep the app working
    try {
        let user = await User.findOne({});
        if (!user) {
            // Create a dummy user if none exists so the app doesn't crash
            user = await User.create({
                name: 'Demo User',
                email: 'demo@chemistai.com',
                password: 'demopassword',
                role: 'chemist'
            });
        }
        req.user = user;
        return next();
    } catch (err) {
        console.error('Auth Bypass Error:', err);
        next();
    }
};

module.exports = { protect };


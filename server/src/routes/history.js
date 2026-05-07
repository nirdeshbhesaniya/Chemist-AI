const express = require('express');
const { protect } = require('../middleware/auth');
const QueryHistory = require('../models/QueryHistory');

const router = express.Router();

// @GET /api/history - Get user's query history
router.get('/', protect, async (req, res, next) => {
    try {
        const { useCase, limit = 20, page = 1 } = req.query;
        const filter = { userId: req.user._id };
        if (useCase && useCase !== 'all') filter.useCase = useCase;

        const total = await QueryHistory.countDocuments(filter);
        const history = await QueryHistory.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * parseInt(limit))
            .limit(parseInt(limit))
            .select('-output'); // Don't return full output in list (too large)

        res.json({ success: true, total, page: parseInt(page), limit: parseInt(limit), history });
    } catch (err) { next(err); }
});

// @GET /api/history/:id - Get single query detail
router.get('/:id', protect, async (req, res, next) => {
    try {
        const query = await QueryHistory.findOne({ _id: req.params.id, userId: req.user._id });
        if (!query) return res.status(404).json({ error: 'Query not found' });
        res.json({ success: true, data: query });
    } catch (err) { next(err); }
});

// @DELETE /api/history/:id - Delete a query
router.delete('/:id', protect, async (req, res, next) => {
    try {
        const query = await QueryHistory.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
        if (!query) return res.status(404).json({ error: 'Query not found' });
        res.json({ success: true, message: 'Query deleted' });
    } catch (err) { next(err); }
});

// @GET /api/history/stats - Usage statistics
router.get('/user/stats', protect, async (req, res, next) => {
    try {
        const stats = await QueryHistory.aggregate([
            { $match: { userId: req.user._id } },
            { $group: { _id: '$useCase', count: { $sum: 1 }, lastUsed: { $max: '$createdAt' } } },
            { $sort: { count: -1 } }
        ]);
        const total = await QueryHistory.countDocuments({ userId: req.user._id });
        res.json({ success: true, total, byUseCase: stats });
    } catch (err) { next(err); }
});

module.exports = router;

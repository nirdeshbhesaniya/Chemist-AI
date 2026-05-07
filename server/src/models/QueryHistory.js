const mongoose = require('mongoose');

const queryHistorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    useCase: {
        type: String,
        required: true,
        enum: ['manufacturing', 'optimize', 'properties', 'retrosynthesis', 'predict', 'patents']
    },
    title: {
        type: String,
        required: true
    },
    input: {
        molecule: String,
        smiles: String,
        inputType: { type: String, enum: ['name', 'smiles', 'ketcher'] },
        additionalData: mongoose.Schema.Types.Mixed
    },
    output: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    tokensUsed: {
        type: Number,
        default: 0
    },
    model: {
        type: String,
        default: 'deepseek/deepseek-r1:free'
    }
}, { timestamps: true });

// Index for fast user history lookup
queryHistorySchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('QueryHistory', queryHistorySchema);

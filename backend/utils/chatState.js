// Hybrid Chatbot State Management (In-Memory fallback)
const NodeCache = require('node-cache');
// Cache lasts 1 hour by default
const chatCache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });

const getChatState = (userId) => {
    return chatCache.get(userId) || { step: 'IDLE', data: {} };
};

const setChatState = (userId, stateObj) => {
    chatCache.set(userId, stateObj);
};

const clearChatState = (userId) => {
    chatCache.set(userId, { step: 'IDLE', data: {} });
};

module.exports = {
    getChatState,
    setChatState,
    clearChatState
};

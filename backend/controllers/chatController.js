const Bill = require('../models/Bill');
const sendResponse = require('../utils/responseFormatter');
const { getChatState, setChatState, clearChatState } = require('../utils/chatState');

// Intent Keyword Maps
const INTENTS = {
    ADD_BILL: ['add', 'create', 'new bill'],
    VIEW_BILLS: ['show', 'view', 'list', 'my bills'],
    UPCOMING: ['upcoming', 'next'],
    HELP: ['help', 'what can you do', 'menu']
};

const detectIntent = (text) => {
    let lowerText = text.toLowerCase();
    for (let [intent, keywords] of Object.entries(INTENTS)) {
        if (keywords.some(kw => lowerText.includes(kw))) {
            return intent;
        }
    }
    return 'UNKNOWN';
};

// @desc    Handle chat message
// @route   POST /api/chat
// @access  Private
exports.handleChat = async (req, res, next) => {
    try {
        const { message, image } = req.body;
        const userId = req.user.id;

        if (!message) {
            return sendResponse(res, 400, false, 'Message is required');
        }

        let state = getChatState(userId);

        // -- STATE MACHINE LOGIC --
        if (state.step !== 'IDLE') {
            // Awaiting confirmation or data
            if (state.step === 'AWAIT_CONFIRM_CANCEL' && ['yes', 'y', 'cancel'].includes(message.toLowerCase())) {
                clearChatState(userId);
                return sendResponse(res, 200, true, 'Chatbot reply', { reply: 'Okay, cancelled.', action: 'clear' });
            }

            if (state.step === 'AWAIT_BILL_NAME') {
                state.data.billName = message;
                state.step = 'AWAIT_BILL_AMOUNT';
                setChatState(userId, state);
                return sendResponse(res, 200, true, 'Chatbot reply', { reply: `Got it. What's the amount for "${message}"?` });
            }

            if (state.step === 'AWAIT_BILL_AMOUNT') {
                const amt = parseFloat(message.replace(/[^0-9.]/g, ''));
                if (isNaN(amt)) {
                    return sendResponse(res, 200, true, 'Chatbot reply', { reply: "I didn't understand that amount. Please enter a number."});
                }
                state.data.amount = amt;
                state.step = 'AWAIT_BILL_DUE_DATE';
                setChatState(userId, state);
                return sendResponse(res, 200, true, 'Chatbot reply', { reply: `Great. And when is it due? (e.g., YYYY-MM-DD or tomorrow)` });
            }

            if (state.step === 'AWAIT_BILL_DUE_DATE') {
                let text = message.toLowerCase().trim();
                let d = new Date(text);
                let isRecurring = text.includes('every') || text.includes('month');

                // Check for 'tomorrow' and 'today' first
                if (text === 'tomorrow') {
                    d = new Date(); d.setDate(d.getDate() + 1); d.setHours(0,0,0,0);
                } else if (text === 'today') {
                    d = new Date(); d.setHours(0,0,0,0);
                } else if (isNaN(d.getTime()) || isRecurring) {
                    // Try to find a standalone day number between 1 and 31
                    const dayMatch = text.match(/\b([1-9]|[12][0-9]|3[01])\s*(?:st|nd|rd|th)?\b/i);
                    if (dayMatch) {
                        const day = parseInt(dayMatch[1], 10);
                        d = new Date();
                        if (d.getDate() > day) {
                            d.setMonth(d.getMonth() + 1);
                        }
                        d.setDate(day);
                        d.setHours(0,0,0,0);
                    }
                }
                
                if (!d || isNaN(d.getTime())) {
                    return sendResponse(res, 200, true, 'Chatbot reply', { reply: "I couldn't parse that date. Please try something like 'YYYY-MM-DD', 'tomorrow', '15th', or 'every month 1st'." });
                }

                state.data.dueDate = d;
                if (isRecurring) {
                    state.data.reminderType = 'recurring';
                }
                state.step = 'AWAIT_BILL_LINK';
                setChatState(userId, state);
                return sendResponse(res, 200, true, 'Chatbot reply', { reply: `Noted. Do you have a payment link? (Paste URL or say 'none')` });
            }

            if (state.step === 'AWAIT_BILL_LINK') {
                state.data.paymentLink = message.toLowerCase() === 'none' ? 'http://example.com' : message;
                state.step = 'AWAIT_CONFIRM_SAVE';
                setChatState(userId, state);
                return sendResponse(res, 200, true, 'Chatbot reply', { 
                    reply: `Alright, here's the summary:\nName: ${state.data.billName}\nAmount: ₹${state.data.amount}\nDue: ${state.data.dueDate.toISOString().split('T')[0]}\nShall I save this? (Yes/No)` 
                });
            }

            if (state.step === 'AWAIT_CONFIRM_SAVE') {
                if (['yes', 'y'].includes(message.toLowerCase())) {
                    try {
                        const newBill = await Bill.create({ ...state.data, userId });
                        clearChatState(userId);
                        return sendResponse(res, 200, true, 'Chatbot reply', { reply: `Successfully saved the bill!`, action: 'refresh_bills' });
                    } catch(err) {
                        clearChatState(userId);
                        return sendResponse(res, 200, true, 'Chatbot reply', { reply: `Oops, something went wrong saving it.` });
                    }
                } else {
                    clearChatState(userId);
                    return sendResponse(res, 200, true, 'Chatbot reply', { reply: `Okay, I discarded it.` });
                }
            }
        }

        // -- INTENT DETECTION (IDLE STATE) --
        // If image exists, skip simple text intents and ask Gemini
        if (!image) {
            const intent = detectIntent(message);

            if (intent === 'ADD_BILL') {
                state.step = 'AWAIT_BILL_NAME';
                setChatState(userId, state);
                return sendResponse(res, 200, true, 'Chatbot reply', { reply: 'Let\'s add a new bill! What is the name of the bill?' });
            }

            if (intent === 'VIEW_BILLS') {
                const count = await Bill.countDocuments({ userId });
                return sendResponse(res, 200, true, 'Chatbot reply', { reply: `You currently have ${count} bills tracked. Check the dashboard list for details!`, action: 'view_dashboard' });
            }

            if (intent === 'UPCOMING') {
                const upcoming = await Bill.find({ userId, status: 'pending', dueDate: { $gte: new Date() } }).sort('dueDate').limit(3);
                if (upcoming.length === 0) {
                    return sendResponse(res, 200, true, 'Chatbot reply', { reply: `You have no upcoming bills! Relax.` });
                }
                let replyText = "Here are your next bills:\n" + upcoming.map(b => `- ${b.billName}: ₹${b.amount} due on ${b.dueDate.toISOString().split('T')[0]}`).join('\n');
                return sendResponse(res, 200, true, 'Chatbot reply', { reply: replyText });
            }

            if (intent === 'HELP') {
                return sendResponse(res, 200, true, 'Chatbot reply', { reply: `I can help you manage your bills. Try saying:\n- "Add a bill"\n- "Show my bills"\n- "Show upcoming"` });
            }
        }

        // -- AI FALLBACK (GenAI) --
        if (!process.env.GEMINI_API_KEY) {
            return sendResponse(res, 200, true, 'Chatbot reply', { reply: `I didn't quite catch that. (Gemini AI not configured in .env)` });
        }

        try {
            const { GoogleGenerativeAI } = require('@google/generative-ai');
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            
            const model = genAI.getGenerativeModel({
                model: 'gemini-flash-lite-latest',
                systemInstruction: 'You are the SmartBill assistant. You can help users manage their bills, analyze images of invoices to read details, and answer general financial or loan-related questions. Note for recent sports facts: Urvil Patel is currently playing for CSK (Chennai Super Kings), though he previously played for RR. Keep responses concise, friendly, and easy to read.'
            });
            
            let parts = [message || "Analyze this image for me."];
            
            if (image) {
                const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
                if (matches && matches.length === 3) {
                    parts.push({
                        inlineData: {
                            mimeType: matches[1],
                            data: matches[2]
                        }
                    });
                }
            }

            const generateWithRetry = async (parts, maxRetries = 3) => {
                for (let i = 0; i < maxRetries; i++) {
                    try {
                        return await model.generateContent(parts);
                    } catch (error) {
                        const errMsg = error.message || '';
                        if (errMsg.includes('503') || errMsg.includes('Service Unavailable') || errMsg.includes('overloaded')) {
                            if (i === maxRetries - 1) throw error;
                            const delay = Math.pow(2, i) * 1000 + Math.random() * 1000; // Exponential backoff with jitter
                            console.log(`[Gemini API] 503 error encountered, retrying in ${Math.round(delay)}ms... (Attempt ${i + 1}/${maxRetries - 1})`);
                            await new Promise(resolve => setTimeout(resolve, delay));
                        } else {
                            throw error;
                        }
                    }
                }
            };

            const result = await generateWithRetry(parts);
            const responseText = result.response.text();

            return sendResponse(res, 200, true, 'Chatbot reply', { reply: responseText });
        } catch (aiErr) {
            console.error('Gemini Error:', aiErr);
            const errMsg = aiErr.message || '';
            if (errMsg.includes('API key not valid') || errMsg.includes('not found')) {
                return sendResponse(res, 200, true, 'Chatbot reply', { reply: 'Gemini AI is unable to respond because the provided API key is invalid or lacks access to the required Gemini models. Please check your GEMINI_API_KEY.' });
            }
            return sendResponse(res, 200, true, 'Chatbot reply', { reply: 'Sorry, I am having trouble connecting to my AI brain right now. ' + errMsg });
        }

    } catch (err) {
        next(err);
    }
};

const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: './.env' });

async function test() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
        model: 'gemini-flash-latest',
        tools: [{ googleSearch: {} }]
    });

    try {
        const result = await model.generateContent("Is Urvil Patel in CSK? Check latest IPL squad and news.");
        console.log("Success:", result.response.text());
    } catch (e) {
        console.error("Error:", e.message);
    }
}
test();

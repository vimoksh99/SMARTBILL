const { GoogleGenerativeAI } = require('@google/generative-ai');
const key = 'AIzaSyBWG0_eAMLpzV4kiZa1jP8y85yYNfuJsYw';
const genAI = new GoogleGenerativeAI(key);

async function testMode(m) {
    try {
        console.log(`Testing ${m}...`);
        const model = genAI.getGenerativeModel({ model: m });
        const res = await model.generateContent("hello");
        console.log(`Success ${m}:`, res.response.text());
    } catch(err) {
        console.error(`Error ${m}:`, err.message);
    }
}

async function run() {
    await testMode('gemini-1.5-flash');
    await testMode('gemini-flash-latest');
    await testMode('gemini-1.5-pro');
}

run();

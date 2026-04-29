const axios = require('axios');

async function testChat() {
    try {
        // 1. Login to get token
        const loginRes = await axios.post('http://localhost:3000/api/auth/login', {
            email: 'admin1@smartbill.com',
            password: 'Smartbill@lpu.in'
        });
        
        const token = loginRes.data.token;
        console.log("Logged in successfully, token received.");

        // 2. Test chat
        const chatRes = await axios.post('http://localhost:3000/api/chat', {
            message: 'Hello, who are you?'
        }, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log("Chat Response:", chatRes.data);
    } catch (err) {
        console.error("Test Failed:");
        if (err.response) {
            console.error("Status:", err.response.status);
            console.error("Data:", err.response.data);
        } else {
            console.error(err.message);
        }
    }
}

testChat();

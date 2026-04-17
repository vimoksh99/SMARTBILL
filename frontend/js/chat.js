const chatToggle = document.getElementById('chatbot-toggle');
const chatWindow = document.getElementById('chat-window');
const closeChat = document.getElementById('close-chat');
const chatHistory = document.getElementById('chat-history');
const chatInput = document.getElementById('chat-input');

chatToggle.addEventListener('click', () => {
    chatWindow.style.display = 'flex';
    chatToggle.style.display = 'none';
});

closeChat.addEventListener('click', () => {
    chatWindow.style.display = 'none';
    chatToggle.style.display = 'block';
});

function appendMessage(text, sender) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-message ${sender}`;
    msgDiv.innerHTML = `<div class="msg-bubble">${text.replace(/\n/g, '<br>')}</div>`;
    chatHistory.appendChild(msgDiv);
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

function showTyping() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'chat-message bot typing';
    typingDiv.innerHTML = `
        <div class="typing-indicator">
            <span></span><span></span><span></span>
        </div>
    `;
    typingDiv.id = 'typing-indicator';
    chatHistory.appendChild(typingDiv);
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

function removeTyping() {
    const el = document.getElementById('typing-indicator');
    if (el) el.remove();
}

async function sendUserMsg() {
    const text = chatInput.value.trim();
    if (!text) return;

    appendMessage(text, 'user');
    chatInput.value = '';

    await sendChatMsgAPI(text);
}

function handleEnter(e) {
    if (e.key === 'Enter') {
        sendUserMsg();
    }
}

async function sendChatMsg(text) {
    appendMessage(text, 'user');
    await sendChatMsgAPI(text);
}

async function sendChatMsgAPI(text) {
    showTyping();
    try {
        const res = await fetch('https://smartbill-vqjf.onrender.com/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ message: text })
        });
        const data = await res.json();

        setTimeout(() => {
            removeTyping();
            if (data.success) {
                appendMessage(data.data.reply, 'bot');
                
                // Handle actions triggered by bot
                if (data.data.action === 'refresh_bills') {
                    if (typeof refreshAll === 'function') refreshAll();
                } else if (data.data.action === 'view_dashboard') {
                    // Do nothing or visual cue
                }
            } else {
                appendMessage("Error communicating with server.", 'bot');
            }
        }, 800); // Simulate network/typing delay
    } catch (err) {
        removeTyping();
        appendMessage("Network error.", 'bot');
    }
}

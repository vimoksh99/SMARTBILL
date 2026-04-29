const API_BASE_URL = 'http://localhost:3000';
const chatToggle = document.getElementById('chatbot-toggle');
const chatWindow = document.getElementById('chat-window');
const closeChat = document.getElementById('close-chat');
const chatHistory = document.getElementById('chat-history');
const chatInput = document.getElementById('chat-input');
const micBtn = document.getElementById('mic-btn');

// Speech Recognition System
window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let isRecording = false;

if (window.SpeechRecognition && micBtn) {
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    micBtn.addEventListener('click', () => {
        if(isRecording) {
            recognition.stop();
            return;
        }
        try {
            recognition.start();
            isRecording = true;
            micBtn.style.transform = 'scale(1.2)';
            micBtn.innerText = '🔴';
        } catch(e) {}
    });

    recognition.onresult = (e) => {
        const text = e.results[0][0].transcript;
        chatInput.value = text;
        sendUserMsg();
    };

    recognition.onend = () => {
        isRecording = false;
        micBtn.style.transform = 'scale(1)';
        micBtn.innerText = '🎙️';
    };
} else if (micBtn) {
    micBtn.style.display = 'none';
}

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

let currentChatImageBase64 = null;

function previewChatImage(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        currentChatImageBase64 = e.target.result; // Data URL
        document.getElementById('chat-preview-img').src = currentChatImageBase64;
        document.getElementById('chat-image-preview').style.display = 'flex';
    };
    reader.readAsDataURL(file);
}

function removeChatImage() {
    currentChatImageBase64 = null;
    document.getElementById('chat-image-input').value = '';
    document.getElementById('chat-image-preview').style.display = 'none';
}

async function sendChatMsg(text) {
    appendMessage(text, 'user');
    await sendChatMsgAPI(text);
}

async function sendChatMsgAPI(text) {
    showTyping();
    const payload = { message: text };
    
    if (currentChatImageBase64) {
        payload.image = currentChatImageBase64;
        removeChatImage(); // clear after sending
    }

    try {
        const res = await fetch(API_BASE_URL + '/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(payload)
        });
        const data = await res.json();

        removeTyping();
        if (data.success) {
            appendMessage(data.data.reply, 'bot');
            
            // Handle actions triggered by bot
            if (data.data.action === 'refresh_bills') {
                if (typeof refreshAll === 'function') refreshAll();
                
                // Gamification: Fire confetti on successful bill add
                if (typeof confetti === 'function') {
                    confetti({
                        particleCount: 150,
                        spread: 80,
                        origin: { y: 0.6 }
                    });
                }
                
            } else if (data.data.action === 'view_dashboard') {
                // Do nothing or visual cue
            }
        } else {
            appendMessage("Error communicating with server.", 'bot');
        }
    } catch (err) {
        removeTyping();
        appendMessage("Network error.", 'bot');
    }
}

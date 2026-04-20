// Check auth
const token = localStorage.getItem('token');
if (!token) {
    window.location.href = './index.html';
}

// Global Fetch Interceptor to handle Block/Delete instantly
const originalFetch = window.fetch;
window.fetch = async (...args) => {
    const res = await originalFetch(...args);
    // 401/403 meaning Blocked or Deleted
    if (res.status === 401 || res.status === 403) {
        if (args[0] && String(args[0]).includes('/api/')) {
            const overlay = document.createElement('div');
            overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:99999;display:flex;align-items:center;justify-content:center;';
            overlay.innerHTML = '<div style="background:#1e1e2f;padding:2rem;border-radius:12px;text-align:center;color:white;max-width:400px;border:1px solid rgba(255,255,255,0.1);"><h3 style="margin-top:0;">Access Denied</h3><p style="color:#a0aec0;margin-bottom:1.5rem;">Your account has been removed or blocked by the admin.</p><button id="logout-alert-btn" style="background:#6366f1;color:white;border:none;padding:10px 24px;border-radius:8px;cursor:pointer;font-weight:bold;">Okay</button></div>';
            document.body.appendChild(overlay);
            
            await new Promise(resolve => {
                document.getElementById('logout-alert-btn').onclick = () => resolve();
            });

            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = './index.html';
        }
    }
    return res;
};

document.getElementById('logout-btn').addEventListener('click', async () => {
    try {
        await fetch('https://smartbill-vqjf.onrender.com/api/auth/logout');
    } catch (err) {}
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = './index.html';
});

document.getElementById('complaint-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const subjectEl = document.getElementById('subject');
    const messageEl = document.getElementById('message');
    const msgBox = document.getElementById('toast-msg');

    const submitBtn = document.getElementById('submit-btn');

    submitBtn.innerText = 'Sending...';
    submitBtn.style.opacity = '0.7';

    try {
        const res = await fetch('https://smartbill-vqjf.onrender.com/api/complaints', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ subject: subjectEl.value, message: messageEl.value })
        });
        const data = await res.json();
        
        msgBox.classList.add('show');
        if (data.success) {
            msgBox.style.background = 'rgba(16, 185, 129, 0.2)';
            msgBox.style.color = '#34d399';
            msgBox.innerText = 'Message submitted successfully!';
            document.getElementById('complaint-form').reset();
            subjectEl.value = '';
            messageEl.value = '';
            fetchMyTickets();
        } else {
            msgBox.style.background = 'rgba(239, 68, 68, 0.2)';
            msgBox.style.color = '#f87171';
            msgBox.innerText = data.message || 'Error submitting message.';
        }
        
        setTimeout(() => msgBox.classList.remove('show'), 4000);
    } catch (err) {
        msgBox.classList.add('show');
        msgBox.style.background = 'rgba(239, 68, 68, 0.2)';
        msgBox.style.color = '#f87171';
        msgBox.innerText = 'Server error. Try again later.';
        setTimeout(() => msgBox.classList.remove('show'), 4000);
    } finally {
        submitBtn.innerText = 'Send Message 🚀';
        submitBtn.style.opacity = '1';
    }
});

let myTicketsData = [];
let showAllTickets = false;

// Fetch My Tickets
window.fetchMyTickets = async () => {
    try {
        const res = await fetch('https://smartbill-vqjf.onrender.com/api/complaints/my', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        
        if (data.success) {
            myTicketsData = data.data;
            showAllTickets = false;
            renderTickets();
        }
    } catch (err) {
        console.error('Failed to load tickets', err);
    }
};

function renderTickets() {
    const container = document.getElementById('tickets-container');
    container.innerHTML = '';

    if (myTicketsData.length === 0) {
        container.innerHTML = '<div style="color: #a0aec0; text-align: center; padding: 2rem; border: 1px dashed rgba(255,255,255,0.1); border-radius: 12px; background: rgba(0,0,0,0.2);">You have not opened any support tickets yet.</div>';
        return;
    }

    const displayData = showAllTickets ? myTicketsData : myTicketsData.slice(0, 1);

    displayData.forEach(t => {
        const date = new Date(t.createdAt).toLocaleDateString();
        const statusColor = t.status === 'Resolved' ? '#34d399' : '#fbbf24';
        const statusBg = t.status === 'Resolved' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)';
        
        let replyHtml = '';
        if (t.status === 'Resolved' && t.adminReply) {
            replyHtml = `
            <div style="margin-top: 1rem; padding: 1rem; background: rgba(99, 102, 241, 0.15); border-left: 3px solid #8b5cf6; border-radius: 0 8px 8px 0;">
                <strong style="color: #a5b4fc; font-size: 0.85rem; text-transform: uppercase;">Admin Response:</strong>
                <p style="color: #e2e8f0; margin-top: 0.3rem;">${t.adminReply}</p>
            </div>`;
        }

        const card = document.createElement('div');
        card.style.cssText = 'background: rgba(20, 20, 43, 0.6); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 1.5rem;';
        
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.8rem;">
                <h4 style="color: white; font-size: 1.2rem; margin: 0;">${t.subject}</h4>
                <span style="background: ${statusBg}; color: ${statusColor}; padding: 4px 10px; border-radius: 8px; font-size: 0.8rem; font-weight: 700;">${t.status}</span>
            </div>
            <p style="color: #a0aec0; margin-bottom: 0.5rem; font-size: 0.95rem;">${t.message}</p>
            <div style="color: #64748b; font-size: 0.8rem;">Ticket opened on: ${date}</div>
            ${replyHtml}
        `;
        container.appendChild(card);
    });

    if (myTicketsData.length > 1) {
        const toggleBtnWrap = document.createElement('div');
        toggleBtnWrap.style.textAlign = 'center';
        toggleBtnWrap.style.marginTop = '1rem';
        
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'secondary-btn';
        toggleBtn.style.cssText = 'background: rgba(255,255,255,0.05); padding: 8px 20px; border-radius: 20px; font-size: 0.9rem; border: 1px solid rgba(255,255,255,0.1); color: #a0aec0;';
        toggleBtn.innerText = showAllTickets ? 'Show Less' : 'Show All Tickets';
        toggleBtn.onclick = () => {
            showAllTickets = !showAllTickets;
            renderTickets();
        };
        
        toggleBtnWrap.appendChild(toggleBtn);
        container.appendChild(toggleBtnWrap);
    }
}

async function fetchSettings() {
    try {
        const res = await fetch('https://smartbill-vqjf.onrender.com/api/settings');
        const data = await res.json();
        if(data.success && data.data) {
            document.getElementById('contact-email').innerText = data.data.supportEmail || 'N/A';
            document.getElementById('contact-phone').innerText = data.data.supportPhone || 'N/A';
            document.getElementById('contact-address').innerText = data.data.supportAddress || 'N/A';
        }
    } catch(err) {
        console.error('Error fetching settings', err);
    }
}

async function fetchFounders() {
    try {
        const res = await fetch('https://smartbill-vqjf.onrender.com/api/founders');
        const data = await res.json();
        const list = document.getElementById('public-founders-list');
        
        if (data.success && list) {
            list.innerHTML = '';
            if(data.data.length === 0) {
                list.innerHTML = '<div style="color: #a0aec0; text-align: center; font-size: 1.1rem; padding: 3rem;">Founder profiles arriving soon.</div>';
                return;
            }

            data.data.forEach(f => {
                const card = document.createElement('div');
                card.className = 'founder-card-premium';
                card.innerHTML = `
                    <img src="${f.imageBase64}" class="founder-photo-premium" alt="${f.name}">
                    <h3 class="founder-name-premium">${f.name}</h3>
                    <div class="founder-desc-premium">${f.description}</div>
                `;
                list.appendChild(card);
            });
        }
    } catch(err) {
        console.error('Error fetching founders', err);
    }
}

// Auto fetch on load
fetchMyTickets();
fetchSettings();
fetchFounders();

// Poll auth status every 15 seconds to instantly catch admin block
setInterval(async () => {
    if (token) {
        try {
            await fetch('https://smartbill-vqjf.onrender.com/api/auth/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch (err) {}
    }
}, 15000);

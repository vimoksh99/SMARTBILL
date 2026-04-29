const API_BASE_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:') ? 'http://localhost:3000' : 'https://YOUR-BACKEND-URL.onrender.com';
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user'));

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

document.getElementById('user-greeting').innerText = `Hello, ${user ? user.name : 'User'}`;

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = './index.html';
}

async function fetchAnalytics() {
    const res = await fetch(API_BASE_URL + '/api/bills/analytics', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const { success, data } = await res.json();
    if(success) {
        document.getElementById('stat-pending').innerText = `₹${data.totalPending.toFixed(2)}`;
        document.getElementById('stat-paid').innerText = `₹${data.totalPaid.toFixed(2)}`;
        document.getElementById('stat-upcoming').innerText = data.upcomingCount;
        document.getElementById('stat-overdue').innerText = data.overdueCount;
    }
}

let notificationsData = [];

async function fetchNotifications() {
    try {
        const res = await fetch(API_BASE_URL + '/api/notifications', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const { success, data } = await res.json();
        if(success) {
            notificationsData = data;
            renderNotifications();
        }
    } catch(err) { console.error(err); }
}

function renderNotifications() {
    const unread = notificationsData.filter(n => !n.read).length;
    const countBadge = document.getElementById('notif-count');
    if(countBadge) {
        countBadge.innerText = unread;
        countBadge.style.display = unread > 0 ? 'inline-block' : 'none';
    }

    const body = document.getElementById('notif-body');
    if (!body) return;
    
    body.innerHTML = '';
    
    if (notificationsData.length === 0) {
        body.innerHTML = '<div style="padding: 1.5rem; text-align: center; color: var(--text-secondary); font-size: 0.9rem;">No notifications yet.</div>';
        return;
    }

    notificationsData.forEach(n => {
        const item = document.createElement('div');
        item.className = `notif-item ${n.read ? '' : 'unread'}`;
        item.onclick = (e) => {
            e.stopPropagation();
            if(!n.read) markAsRead(n._id);
        };
        
        const dateStr = new Date(n.createdAt).toLocaleDateString() + ' ' + new Date(n.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        item.innerHTML = `
            <p>${n.message}</p>
            <small>${dateStr}</small>
        `;
        body.appendChild(item);
    });
}

async function markAsRead(id) {
    try {
        const res = await fetch(`${API_BASE_URL}/api/notifications/${id}/read`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if(res.ok) fetchNotifications();
    } catch(err) { console.error(err); }
}

async function markAllAsRead(e) {
    if(e) e.stopPropagation();
    try {
        const unreadNotifs = notificationsData.filter(n => !n.read);
        for(let n of unreadNotifs) {
            await fetch(`${API_BASE_URL}/api/notifications/${n._id}/read`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        }
        fetchNotifications();
    } catch(err) { console.error(err); }
}

// Dropdown Toggle Setup
const notifBtn = document.getElementById('notif-icon-btn');
const notifDropdown = document.getElementById('notif-dropdown');
if(notifBtn && notifDropdown) {
    notifBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isShowing = notifDropdown.style.display === 'flex';
        notifDropdown.style.display = isShowing ? 'none' : 'flex';
    });
    
    document.addEventListener('click', (e) => {
        if (!notifDropdown.contains(e.target) && !notifBtn.contains(e.target)) {
            notifDropdown.style.display = 'none';
        }
    });

    const markAllBtn = document.getElementById('mark-all-read');
    if(markAllBtn) markAllBtn.addEventListener('click', markAllAsRead);
}

async function fetchBills() {
    document.getElementById('loading').style.display = 'block';
    const res = await fetch(API_BASE_URL + '/api/bills', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const { success, data } = await res.json();
    document.getElementById('loading').style.display = 'none';

    const container = document.getElementById('bills-container');
    const emptyState = document.getElementById('empty-state');
    
    if(!success || data.length === 0) {
        container.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';
    container.innerHTML = '';

    data.forEach(bill => {
        const card = document.createElement('div');
        card.className = 'bill-card glass-panel';
        
        const isOverdue = bill.status === 'overdue';
        const isPaid = bill.status === 'paid';
        
        card.innerHTML = `
            <div class="bill-header">
                <span class="bill-title">${bill.billName}</span>
                <span class="bill-status status-${bill.status}">${bill.status}</span>
            </div>
            <div class="bill-details">
                <p>Due: ${new Date(bill.dueDate).toISOString().split('T')[0]}</p>
                <p>Category: ${bill.category}</p>
                <div class="bill-amount">₹${bill.amount.toFixed(2)}</div>
            </div>
            <div class="bill-actions">
                ${!isPaid ? `<button class="primary-btn" onclick="openPayment('${bill.paymentLink}', '${bill._id}')">Pay Now</button>` : ''}
                <button class="secondary-btn" onclick="deleteBill('${bill._id}')">Delete</button>
            </div>
        `;
        container.appendChild(card);
    });
}

function openAddModal() {
    document.getElementById('bill-modal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('bill-modal').style.display = 'none';
}

document.getElementById('bill-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        billName: document.getElementById('bill-name').value,
        amount: parseFloat(document.getElementById('bill-amount').value),
        dueDate: document.getElementById('bill-due-date').value,
        category: document.getElementById('bill-category').value,
        paymentLink: document.getElementById('bill-link').value
    };

    const res = await fetch(API_BASE_URL + '/api/bills', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
    });
    
    if (res.ok) {
        closeModal();
        e.target.reset();
        refreshAll();
    }
});

let currentPaymentBillId = null;

function openPayment(link, billId) {
    currentPaymentBillId = billId;
    document.getElementById('pay-now-link').href = link;
    document.getElementById('payment-modal').style.display = 'flex';
}

function closePaymentModal() {
    document.getElementById('payment-modal').style.display = 'none';
}

function markPaymentAttempt() { }

async function markAsPaidConfirm() {
    if(!currentPaymentBillId) return;
    await fetch(`${API_BASE_URL}/api/bills/${currentPaymentBillId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'paid' })
    });
    closePaymentModal();
    refreshAll();
    
    // Gamification: Massive Screen-wide Confetti for Paying a Bill
    if (typeof confetti === 'function') {
        const duration = 2000;
        const end = Date.now() + duration;

        (function frame() {
            confetti({
                particleCount: 5,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42', '#ffa62d', '#ff36ff']
            });
            confetti({
                particleCount: 5,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42', '#ffa62d', '#ff36ff']
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        }());
    }
}

async function deleteBill(id) {
    const isConfirmed = await customConfirm('Delete Bill', 'Are you sure you want to delete this bill?');
    if(isConfirmed) {
        await fetch(`${API_BASE_URL}/api/bills/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        refreshAll();
    }
}

function exportData(type) {
    window.open(`${API_BASE_URL}/api/export/${type}?token=${token}`, '_blank');
}

function refreshAll() {
    fetchBills();
    fetchAnalytics();
    fetchNotifications();
}

/* --- MODAL UTILS --- */
function openModalContainer(title, msg, confirmText, cancelText) {
    return new Promise((resolve) => {
        const modal = document.getElementById('custom-modal');
        const titleEl = document.getElementById('modal-title');
        const msgEl = document.getElementById('modal-msg');
        const confirmBtn = document.getElementById('modal-confirm-btn');
        const cancelBtn = document.getElementById('modal-cancel-btn');

        titleEl.innerText = title;
        msgEl.innerText = msg;
        confirmBtn.innerText = confirmText || 'Confirm';
        cancelBtn.innerText = cancelText || 'Cancel';
        
        cancelBtn.style.display = cancelText === null ? 'none' : 'block';

        modal.style.display = 'flex';

        const handleConfirm = () => {
            cleanup();
            resolve(true);
        };
        const handleCancel = () => {
            cleanup();
            resolve(false);
        };

        const cleanup = () => {
            confirmBtn.removeEventListener('click', handleConfirm);
            cancelBtn.removeEventListener('click', handleCancel);
            modal.style.display = 'none';
        };

        confirmBtn.addEventListener('click', handleConfirm);
        cancelBtn.addEventListener('click', handleCancel);
    });
}
window.customConfirm = (title, msg) => openModalContainer(title, msg, "Yes", "No");

// Initial fetch
refreshAll();

// Poll auth status every 15 seconds to instantly catch admin block
setInterval(async () => {
    if (token) {
        try {
            await fetch(API_BASE_URL + '/api/auth/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch (err) {}
    }
}, 15000);

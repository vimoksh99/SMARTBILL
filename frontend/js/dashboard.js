const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user'));

if (!token) {
    window.location.href = './index.html';
}

document.getElementById('user-greeting').innerText = `Hello, ${user ? user.name : 'User'}`;

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = './index.html';
}

async function fetchAnalytics() {
    const res = await fetch('https://smartbill-vqjf.onrender.com/api/bills/analytics', {
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

async function fetchNotifications() {
    const res = await fetch('https://smartbill-vqjf.onrender.com/api/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const { success, data } = await res.json();
    if(success) {
        const unread = data.filter(n => !n.read).length;
        document.getElementById('notif-count').innerText = unread;
    }
}

async function fetchBills() {
    document.getElementById('loading').style.display = 'block';
    const res = await fetch('https://smartbill-vqjf.onrender.com/api/bills', {
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

    const res = await fetch('https://smartbill-vqjf.onrender.com/api/bills', {
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
    await fetch(`https://smartbill-vqjf.onrender.com/api/bills/${currentPaymentBillId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'paid' })
    });
    closePaymentModal();
    refreshAll();
}

async function deleteBill(id) {
    const isConfirmed = await customConfirm('Delete Bill', 'Are you sure you want to delete this bill?');
    if(isConfirmed) {
        await fetch(`https://smartbill-vqjf.onrender.com/api/bills/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        refreshAll();
    }
}

function exportData(type) {
    window.open(`https://smartbill-vqjf.onrender.com/api/export/${type}?token=${token}`, '_blank');
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

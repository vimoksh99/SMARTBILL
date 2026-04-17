// Check Authentication & Role
const token = localStorage.getItem('token');
const userStr = localStorage.getItem('user');

if (!token || !userStr) {
    window.location.href = './index.html';
}

const user = JSON.parse(userStr);
if (user.role !== 'admin') {
    window.location.href = './dashboard.html';
}

// Logout
document.getElementById('logout-btn').addEventListener('click', async () => {
    try {
        await fetch('https://smartbill-vqjf.onrender.com/api/auth/logout');
    } catch (err) {}
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = './index.html';
});

// Init Admin Dashboard
async function init() {
    setupTabs();
    await fetchStats();
    await fetchUsers();
    await fetchComplaints();
}

function setupTabs() {
    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');
    const pageTitle = document.getElementById('page-title');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            // Remove active classes
            navItems.forEach(n => n.classList.remove('active'));
            tabContents.forEach(t => t.classList.remove('active'));

            // Add active class to clicked tab and corresponding section
            item.classList.add('active');
            const targetId = item.getAttribute('data-tab');
            document.getElementById(targetId).classList.add('active');

            // Update title
            if(targetId === 'overview') pageTitle.innerText = 'Overview Dashboard';
            if(targetId === 'users') pageTitle.innerText = 'User Management';
            if(targetId === 'complaints') pageTitle.innerText = 'Support Tickets';
            
            // Auto refresh specific section
            if(targetId === 'users') fetchUsers();
            if(targetId === 'complaints') fetchComplaints();
            if(targetId === 'overview') fetchStats();
            if(targetId === 'settings') fetchSettings();
            if(targetId === 'founders') fetchFoundersAdmin();
        });
    });
}


async function fetchStats() {
    try {
        const res = await fetch('https://smartbill-vqjf.onrender.com/api/admin/dashboard', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
            document.getElementById('total-users').innerText = data.data.totalUsers;
            document.getElementById('pending-complaints').innerText = data.data.pendingComplaints;
        }
    } catch (err) {
        console.error('Error fetching stats', err);
    }
}

async function fetchUsers() {
    try {
        const res = await fetch('https://smartbill-vqjf.onrender.com/api/admin/users', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
            renderUsers(data.data);
        }
    } catch (err) {
        console.error('Error fetching users', err);
    }
}

function renderUsers(users) {
    const tbody = document.getElementById('users-list');
    tbody.innerHTML = '';
    
    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No members found.</td></tr>';
        return;
    }

    users.forEach(u => {
        const tr = document.createElement('tr');
        const d = new Date(u.createdAt).toLocaleDateString();
        const statusBadge = u.isBlocked ? 
            `<span class="status-badge status-overdue" style="display:inline-block; text-align:center; min-width: 80px;">Blocked</span>` : 
            `<span class="status-badge status-paid" style="display:inline-block; text-align:center; min-width: 80px;">Active</span>`;
        
        const actionBtn = u.isBlocked ?
            `<button style="background:var(--success); color:#fff; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; margin-right: 5px;" onclick="toggleBlock('${u._id}')">Unblock</button>` :
            `<button style="background:var(--danger); color:#fff; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; margin-right: 5px;" onclick="toggleBlock('${u._id}')">Block</button>`;

        const deleteBtn = `<button style="background:transparent; color:#ff6b6b; border: 1px solid #ff6b6b; padding:5px 10px; border-radius:6px; cursor:pointer;" onclick="deleteUser('${u._id}')">Delete</button>`;

        tr.innerHTML = `
            <td>${u.name}</td>
            <td>${u.email}</td>
            <td>${d}</td>
            <td>${statusBadge}</td>
            <td>${actionBtn} ${deleteBtn}</td>
        `;
        tbody.appendChild(tr);
    });
}

window.toggleBlock = async (id) => {
    const isConfirmed = await customConfirm("Block User", "Are you sure you want to change this user's block status?");
    if(!isConfirmed) return;

    try {
        const res = await fetch(`https://smartbill-vqjf.onrender.com/api/admin/users/${id}/block`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
            fetchUsers(); // Refresh
        } else {
            customAlert("Error", data.message);
        }
    } catch (err) {
        customAlert("Error", "Server error");
    }
};

window.deleteUser = async (id) => {
    const isConfirmed = await customConfirm("Destructive Action", "Are you sure you want to permanently delete this user? ALL of their data (bills, history, settings) will be wiped instantly.");
    if(!isConfirmed) return;

    try {
        const res = await fetch(`https://smartbill-vqjf.onrender.com/api/admin/users/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
            fetchUsers(); // Refresh
            fetchStats(); // Update counters if necessary
        } else {
            customAlert("Error", data.message);
        }
    } catch (err) {
        customAlert("Error", "Server error");
    }
};

async function fetchComplaints() {
    try {
        const res = await fetch('https://smartbill-vqjf.onrender.com/api/admin/complaints', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
            renderComplaints(data.data);
        }
    } catch (err) {
        console.error('Error fetching complaints', err);
    }
}

function renderComplaints(complaints) {
    const tbody = document.getElementById('complaints-list');
    tbody.innerHTML = '';

    if (complaints.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No complaints found.</td></tr>';
        return;
    }

    complaints.forEach(c => {
        const tr = document.createElement('tr');
        const d = new Date(c.createdAt).toLocaleDateString();
        const userName = c.user ? c.user.name : 'Unknown User';
        
        const statusBadge = c.status === 'Resolved' ? 
            `<span class="status-badge status-paid" style="display:inline-block; text-align:center; min-width: 80px;">Resolved</span>` : 
            `<span class="status-badge status-pending" style="display:inline-block; text-align:center; min-width: 80px;">Pending</span>`;
        
        const actionBtn = c.status === 'Pending' ?
            `<button style="background:var(--accent-color); color:#fff; border:none; padding:6px 12px; border-radius:6px; cursor:pointer;" onclick="resolveComplaint('${c._id}')">Resolve &nbsp;✓</button>` :
            `<span style="color:#aaa;font-size:0.9em; font-weight: 500;">✓ Completed</span>`;

        tr.innerHTML = `
            <td>${userName}</td>
            <td><strong>${c.subject}</strong></td>
            <td style="max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${c.message}">${c.message}</td>
            <td>${d}</td>
            <td>${statusBadge}</td>
            <td>${actionBtn}</td>
        `;
        tbody.appendChild(tr);
    });
}

window.resolveComplaint = async (id) => {
    const reply = await customPrompt("Resolve Ticket", "Enter your response to the user's ticket:");
    if (reply === null) return; // User cancelled

    try {
        const res = await fetch(`https://smartbill-vqjf.onrender.com/api/admin/complaints/${id}`, {
            method: 'PUT',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: 'Resolved', reply })
        });
        const data = await res.json();
        if (data.success) {
            fetchComplaints(); // Refresh table
            fetchStats(); // Update pending counter
        } else {
            customAlert("Error", data.message);
        }
    } catch (err) {
        customAlert("Error", "Server error");
    }
};

/* --- MODAL UTILS --- */
function openModalContainer(title, msg, showInput, confirmText, cancelText) {
    return new Promise((resolve) => {
        const modal = document.getElementById('custom-modal');
        const titleEl = document.getElementById('modal-title');
        const msgEl = document.getElementById('modal-msg');
        const inputEl = document.getElementById('modal-input');
        const confirmBtn = document.getElementById('modal-confirm-btn');
        const cancelBtn = document.getElementById('modal-cancel-btn');

        titleEl.innerText = title;
        msgEl.innerText = msg;
        confirmBtn.innerText = confirmText || 'Confirm';
        cancelBtn.innerText = cancelText || 'Cancel';
        
        inputEl.style.display = showInput ? 'block' : 'none';
        inputEl.value = '';
        cancelBtn.style.display = cancelText === null ? 'none' : 'block';

        modal.style.display = 'flex';

        // Handlers
        const handleConfirm = () => {
            cleanup();
            if (showInput) resolve(inputEl.value || "");
            else resolve(true);
        };
        const handleCancel = () => {
            cleanup();
            resolve(showInput ? null : false);
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

window.customAlert = (title, msg) => openModalContainer(title, msg, false, "OK", null);
window.customConfirm = (title, msg) => openModalContainer(title, msg, false, "Yes", "No");
window.customPrompt = (title, msg) => openModalContainer(title, msg, true, "Submit", "Cancel");

/* --- SETTINGS LOGIC --- */
async function fetchSettings() {
    try {
        const res = await fetch('https://smartbill-vqjf.onrender.com/api/settings');
        const data = await res.json();
        if(data.success && data.data) {
            document.getElementById('set-email').value = data.data.supportEmail || '';
            document.getElementById('set-phone').value = data.data.supportPhone || '';
            document.getElementById('set-address').value = data.data.supportAddress || '';
        }
    } catch(err) {
        console.error('Error fetching settings', err);
    }
}

const settingsForm = document.getElementById('admin-settings-form');
if (settingsForm) {
    settingsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const supportEmail = document.getElementById('set-email').value;
        const supportPhone = document.getElementById('set-phone').value;
        const supportAddress = document.getElementById('set-address').value;

        try {
            const res = await fetch('https://smartbill-vqjf.onrender.com/api/settings', {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ supportEmail, supportPhone, supportAddress })
            });
            const data = await res.json();
            if(data.success) {
                customAlert("Success", "Platform settings updated successfully!");
            } else {
                customAlert("Error", data.message || "Failed to update settings");
            }
        } catch(err) {
            customAlert("Error", "Server error updating settings");
        }
    });
}

/* --- PASSWORD UPDATE LOGIC --- */
const pwdForm = document.getElementById('admin-password-form');
if (pwdForm) {
    pwdForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const currentPassword = document.getElementById('set-current-pwd').value;
        const newPassword = document.getElementById('set-new-pwd').value;

        try {
            const res = await fetch('https://smartbill-vqjf.onrender.com/api/auth/updatepassword', {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ currentPassword, newPassword })
            });
            const data = await res.json();
            if(data.success) {
                customAlert("Success", "Password updated successfully!");
                pwdForm.reset();
            } else {
                customAlert("Error", data.message || "Failed to update password");
            }
        } catch(err) {
            customAlert("Error", "Server error updating password");
        }
    });
}

/* --- FOUNDERS LOGIC --- */
window.fetchFoundersAdmin = async () => {
    try {
        const res = await fetch('https://smartbill-vqjf.onrender.com/api/founders');
        const data = await res.json();
        
        const grid = document.getElementById('founders-grid');
        if(!grid) return;

        if (data.success) {
            grid.innerHTML = '';
            if(data.data.length === 0) {
                grid.innerHTML = '<div style="color: #a0aec0; width:100%;">No founders added yet.</div>';
                return;
            }

            data.data.forEach(f => {
                const card = document.createElement('div');
                card.style.cssText = 'background: rgba(0,0,0,0.3); border-radius: 12px; padding: 1rem; position: relative; display: flex; flex-direction: column; align-items: center; border: 1px solid var(--glass-border);';
                
                card.innerHTML = `
                    <div style="width: 80px; height: 80px; border-radius: 50%; overflow: hidden; margin-bottom: 1rem; border: 2px solid var(--accent-color);">
                        <img src="${f.imageBase64}" style="width: 100%; height: 100%; object-fit: cover;" alt="${f.name}">
                    </div>
                    <h4 style="color: white; margin-bottom: 0.5rem; text-align: center;">${f.name}</h4>
                    <p style="color: #a0aec0; font-size: 0.85rem; text-align: center; margin-bottom: 1rem;">${f.description}</p>
                    <button class="secondary-btn" style="width: 100%; padding: 0.4rem; font-size: 0.85rem; border-color: #ff6b6b; color: #ff6b6b;" onclick="deleteFounder('${f._id}')">Remove</button>
                `;
                grid.appendChild(card);
            });
        }
    } catch (err) {
        console.error('Failed to load founders', err);
    }
}

window.deleteFounder = async (id) => {
    const confirmDel = await customConfirm("Delete", "Remove this founder profile?");
    if(!confirmDel) return;
    try {
        const res = await fetch(`https://smartbill-vqjf.onrender.com/api/founders/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if(data.success) fetchFoundersAdmin();
    } catch(err) {
        customAlert("Error", "Server error");
    }
};

const founderForm = document.getElementById('add-founder-form');
if (founderForm) {
    founderForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('founder-name').value;
        const desc = document.getElementById('founder-desc').value;
        const fileInput = document.getElementById('founder-photo');
        const btn = founderForm.querySelector('button');
        
        if (!fileInput.files || fileInput.files.length === 0) return;
        
        btn.innerText = 'Uploading...';
        btn.style.opacity = '0.7';

        const file = fileInput.files[0];
        
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            const base64Str = reader.result;
            
            try {
                const res = await fetch('https://smartbill-vqjf.onrender.com/api/founders', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ name, description: desc, imageBase64: base64Str })
                });
                const data = await res.json();
                if(data.success) {
                    customAlert("Success", "Founder added successfully!");
                    founderForm.reset();
                    fetchFoundersAdmin();
                } else {
                    customAlert("Error", data.message || "Failed to add founder");
                }
            } catch(err) {
                customAlert("Error", "Server error updating founder");
            } finally {
                btn.innerText = 'Upload Founder Profile';
                btn.style.opacity = '1';
            }
        };
        reader.onerror = () => {
            customAlert("Error", "Failed to read image file");
            btn.innerText = 'Upload Founder Profile';
            btn.style.opacity = '1';
        };
    });
}

// Start
init();

const API_BASE_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:') ? 'http://localhost:3000' : 'https://smartbill-bf0b.onrender.com';

function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));

    const tabBtn = document.getElementById(`tab-${tab}`);
    if (tabBtn) tabBtn.classList.add('active');
    
    document.getElementById(`${tab}-form`).classList.add('active');
}

// Check if already logged in
if (localStorage.getItem('token')) {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.role === 'admin') {
        window.location.href = './admin_dashboard.html';
    } else {
        window.location.href = './dashboard.html';
    }
}

// API_BASE_URL is defined at the top of the file
let currentEmail = '';

document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errObj = document.getElementById('login-error');

    try {
        const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (data.success) {
            if (data.token) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.data));
                window.location.href = data.data.role === 'admin' ? './admin_dashboard.html' : './dashboard.html';
            } else {
                currentEmail = email;
                switchTab('verify-otp');
                let msg = data.message || 'OTP sent to your email.';
                if (data.otp) msg += `\n[TEST MODE] Your OTP is: ${data.otp}`;
                document.getElementById('verify-message').innerText = msg;
            }
        } else {
            errObj.innerText = data.message || 'Login failed';
        }
    } catch (err) {
        errObj.innerText = 'Server error';
    }
});

document.getElementById('signup-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const errObj = document.getElementById('signup-error');

    try {
        const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        const data = await res.json();

        if (data.success) {
            currentEmail = email;
            switchTab('verify-otp');
            let msg = data.message || 'OTP sent to your email for verification.';
            if (data.otp) msg += `\n[TEST MODE] Your OTP is: ${data.otp}`;
            document.getElementById('verify-message').innerText = msg;
        } else {
            errObj.innerText = data.message || 'Signup failed';
        }
    } catch (err) {
        errObj.innerText = 'Server error';
    }
});

// Verify OTP for Login/Signup
document.getElementById('verify-otp-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const otp = document.getElementById('verify-otp-input').value;
    const errObj = document.getElementById('verify-otp-error');

    try {
        const res = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: currentEmail, otp })
        });
        const data = await res.json();

        if (data.success) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.data));
            if (data.data.role === 'admin') {
                window.location.href = './admin_dashboard.html';
            } else {
                window.location.href = './dashboard.html';
            }
        } else {
            errObj.innerText = data.message || 'Invalid OTP';
        }
    } catch (err) {
        errObj.innerText = 'Server error';
    }
});

async function resendOTP() {
    if (!currentEmail) return;
    const resendLink = document.getElementById('resend-otp-link');
    const errObj = document.getElementById('verify-otp-error');
    
    resendLink.innerText = 'Sending...';
    resendLink.style.pointerEvents = 'none';
    errObj.style.color = '#333';
    errObj.innerText = '';
    
    try {
        const res = await fetch(`${API_BASE_URL}/api/auth/resend-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: currentEmail })
        });
        const data = await res.json();
        
        if (data.success) {
            errObj.style.color = 'var(--accent-color)';
            let msg = 'OTP successfully resent!';
            if (data.otp) msg += `\n[TEST MODE] Your OTP is: ${data.otp}`;
            errObj.innerText = msg;
        } else {
            errObj.style.color = 'var(--danger)';
            errObj.innerText = data.message || 'Failed to resend';
        }
    } catch(err) {
        errObj.style.color = 'var(--danger)';
        errObj.innerText = 'Server error';
    } finally {
        resendLink.innerText = 'Resend OTP';
        resendLink.style.pointerEvents = 'auto';
    }
}

// Forgot Password Request OTP
let resetEmailContext = '';
document.getElementById('forgot-email-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('forgot-email-input').value;
    const errObj = document.getElementById('forgot-email-error');
    errObj.style.color = '#333';
    errObj.innerText = 'Sending OTP...';

    try {
        const res = await fetch(`${API_BASE_URL}/api/auth/forgotpassword`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        const data = await res.json();

        if (data.success) {
            resetEmailContext = email;
            switchTab('reset-password');
            if (data.otp) {
                setTimeout(() => alert(`[TEST MODE] Your Password Reset OTP is: ${data.otp}`), 500);
            }
        } else {
            errObj.style.color = 'var(--error-color)';
            errObj.innerText = data.message || 'Error sending OTP';
        }
    } catch (err) {
        errObj.style.color = 'var(--error-color)';
        errObj.innerText = 'Server error';
    }
});

// Submit OTP and New Password
document.getElementById('reset-password-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const otp = document.getElementById('reset-otp').value;
    const password = document.getElementById('reset-new-password').value;
    const errObj = document.getElementById('reset-password-error');

    try {
        const res = await fetch(`${API_BASE_URL}/api/auth/resetpassword`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: resetEmailContext, otp, newPassword: password })
        });
        const data = await res.json();

        if (data.success) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.data));
            window.location.href = './dashboard.html';
        } else {
            errObj.innerText = data.message || 'Invalid OTP';
        }
    } catch (err) {
        errObj.innerText = 'Server error';
    }
});

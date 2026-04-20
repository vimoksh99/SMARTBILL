const BUDGET_LIMIT = 50000;

const categories = [
    {
        id: 'grocery',
        name: 'Grocery',
        color: '#10b981', // emerald
        value: 0,
        icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />'
    },
    {
        id: 'dairy',
        name: 'Dairy Products',
        color: '#f59e0b', // amber
        value: 0,
        icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />' // Milk box abstraction
    },
    {
        id: 'rent',
        name: 'Rent',
        color: '#6366f1', // indigo
        value: 0,
        icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />'
    },
    {
        id: 'electricity',
        name: 'Electricity',
        color: '#eab308', // yellow
        value: 0,
        icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />'
    },
    {
        id: 'transport',
        name: 'Transport',
        color: '#ec4899', // pink
        value: 0,
        icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />'
    },
    {
        id: 'entertainment',
        name: 'Entertainment',
        color: '#a855f7', // purple
        value: 0,
        icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />'
    },
    {
        id: 'others',
        name: 'Others',
        color: '#64748b', // slate
        value: 0,
        icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />'
    }
];

// App State
let currentSlide = 0;
let chartInstance = null;
let salary = 0;

// DOM Elements
const salaryDisplayEl = document.getElementById('salaryDisplayValue');
const savingsEl = document.getElementById('savingsValue');
const totalExpensesEl = document.getElementById('totalExpensesValue');
const highestExpenseEl = document.getElementById('highestExpenseValue');
const warningBanner = document.getElementById('warningBanner');
const sliderTrack = document.getElementById('sliderTrack');
const slideIndicator = document.getElementById('slideIndicator');
const prevBtn = document.getElementById('prevSlideBtn');
const nextBtn = document.getElementById('nextSlideBtn');
const openEntryBtn = document.getElementById('openEntryBtn');
const closeEntryBtn = document.getElementById('closeEntryBtn');
const resetBtn = document.getElementById('resetBtn');
const entryOverlay = document.getElementById('entryOverlay');
const dashboardPanel = document.querySelector('.dashboard-panel');

// Initialization
function initApp() {
    renderSlides();
    initChart();
    updateDashboard();
    setupEventListeners();
}

function renderSlides() {
    sliderTrack.innerHTML = '';
    
    // Create Salary Slide
    const salarySlide = document.createElement('div');
    salarySlide.className = 'slide-card';
    salarySlide.innerHTML = `
        <div class="cat-icon-container" style="background: linear-gradient(135deg, #065f46, #022c22);">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        </div>
        <h3 style="color: var(--secondary-color);">Monthly Salary</h3>
        <div class="input-group">
            <span class="input-prefix">₹</span>
            <input type="number" 
                   class="expense-input salary-input" 
                   id="input-salary" 
                   value="${salary || ''}" 
                   placeholder="0"
                   min="0"
                   step="1">
        </div>
    `;
    sliderTrack.appendChild(salarySlide);

    categories.forEach((cat, index) => {
        const slide = document.createElement('div');
        slide.className = 'slide-card';
        slide.innerHTML = `
            <div class="cat-icon-container">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    ${cat.icon}
                </svg>
            </div>
            <h3>${cat.name}</h3>
            <div class="input-group">
                <span class="input-prefix">₹</span>
                <input type="number" 
                       class="expense-input category-input" 
                       id="input-${index}" 
                       value="${cat.value || ''}" 
                       placeholder="0"
                       min="0"
                       step="1"
                       data-index="${index}">
            </div>
        `;
        sliderTrack.appendChild(slide);
    });
}

function setupEventListeners() {
    openEntryBtn.addEventListener('click', openOverlay);
    closeEntryBtn.addEventListener('click', closeOverlay);
    
    // Slider Nav
    prevBtn.addEventListener('click', () => changeSlide(-1));
    nextBtn.addEventListener('click', () => changeSlide(1));

    // Input changes
    document.querySelectorAll('.category-input').forEach(input => {
        input.addEventListener('input', (e) => {
            const val = parseInt(e.target.value) || 0;
            const index = e.target.getAttribute('data-index');
            categories[index].value = val >= 0 ? val : 0;
            updateDashboard();
        });
    });

    // Salary input
    const salaryInput = document.getElementById('input-salary');
    if (salaryInput) {
        salaryInput.addEventListener('input', (e) => {
            const val = parseInt(e.target.value) || 0;
            salary = val >= 0 ? val : 0;
            updateDashboard();
        });
    }

    // Reset button
    resetBtn.addEventListener('click', resetAll);
}

function openOverlay(startSlideIndex = 0) {
    if (typeof startSlideIndex === 'number' && startSlideIndex >= 0 && startSlideIndex <= categories.length) {
        currentSlide = startSlideIndex;
    }
    updateSliderView();
    entryOverlay.classList.add('active');
    dashboardPanel.classList.add('blur-bg');
    
    // Focus the input of the current slide
    setTimeout(() => {
        let input;
        if (currentSlide === 0) {
            input = document.getElementById('input-salary');
        } else {
            input = document.getElementById(`input-${currentSlide - 1}`);
        }
        if(input) input.focus();
    }, 400); // Wait for transition
}

function closeOverlay() {
    entryOverlay.classList.remove('active');
    dashboardPanel.classList.remove('blur-bg');
}

function changeSlide(direction) {
    currentSlide += direction;
    if (currentSlide < 0) currentSlide = 0;
    if (currentSlide > categories.length) currentSlide = categories.length;
    updateSliderView();
}

function updateSliderView() {
    // Move track
    sliderTrack.style.transform = `translateX(-${currentSlide * 100}%)`;
    
    // Update indicator
    slideIndicator.textContent = currentSlide === 0 ? 'Salary Setup' : `Exp: ${currentSlide} / ${categories.length}`;
    
    // Buttons state
    prevBtn.disabled = currentSlide === 0;
    nextBtn.disabled = currentSlide === categories.length;
}

function updateDashboard() {
    // Calculations
    const total = categories.reduce((sum, cat) => sum + cat.value, 0);
    const savings = salary - total;
    
    let maxVal = 0;
    let highestCat = 'None';
    categories.forEach(cat => {
        if(cat.value > maxVal) {
            maxVal = cat.value;
            highestCat = cat.name;
        }
    });

    // Update DOM
    if (salaryDisplayEl) salaryDisplayEl.textContent = `₹${salary.toLocaleString('en-IN')}`;
    totalExpensesEl.textContent = `₹${total.toLocaleString('en-IN')}`;
    highestExpenseEl.textContent = highestCat;
    
    if (savingsEl) {
        savingsEl.textContent = `₹${savings.toLocaleString('en-IN')}`;
        savingsEl.style.color = savings >= 0 ? 'var(--secondary-color)' : 'var(--danger-color)';
    }

    // Warning text
    if (total > BUDGET_LIMIT || savings < 0) {
        warningBanner.classList.remove('hidden');
    } else {
        warningBanner.classList.add('hidden');
    }

    // Chart update
    updateChart();
}

function resetAll() {
    salary = 0;
    categories.forEach(cat => cat.value = 0);
    document.querySelectorAll('.expense-input').forEach(input => input.value = '');
    updateDashboard();
}

function initChart() {
    const ctx = document.getElementById('expenseChart').getContext('2d');
    
    // Default config with empty data to allow smooth animation on start
    chartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: categories.map(c => c.name),
            datasets: [{
                data: categories.map(c => c.value),
                backgroundColor: categories.map(c => c.color),
                borderWidth: 0,
                hoverOffset: 15
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%', // makes it a stylish ring
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#f8fafc',
                        font: {
                            family: "'Outfit', sans-serif"
                        },
                        padding: 20
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.raw;
                            const total = context.chart._metasets[0].total;
                            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                            return ` ${context.label}: ₹${value.toLocaleString('en-IN')} (${percentage}%)`;
                        }
                    },
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    titleFont: { family: "'Outfit', sans-serif", size: 14 },
                    bodyFont: { family: "'Outfit', sans-serif", size: 13 },
                    padding: 12,
                    cornerRadius: 8,
                    displayColors: true
                }
            },
            onClick: (event, elements) => {
                if (elements && elements.length > 0) {
                    const index = elements[0].index;
                    openOverlay(index + 1); // +1 because index 0 is salary slide
                }
            }
        }
    });
}

function updateChart() {
    if (!chartInstance) return;
    
    // If all values are 0, we can render a dummy grey segment or just empty 
    const isAllZero = categories.every(c => c.value === 0);
    
    if (isAllZero) {
        chartInstance.data.datasets[0].data = [1];
        chartInstance.data.datasets[0].backgroundColor = ['rgba(255,255,255,0.05)'];
        // hide legend items
        chartInstance.data.labels = ['No Expenses'];
    } else {
        chartInstance.data.datasets[0].data = categories.map(c => c.value);
        chartInstance.data.datasets[0].backgroundColor = categories.map(c => c.color);
        chartInstance.data.labels = categories.map(c => c.name);
    }
    
    chartInstance.update();
}

// Start app
document.addEventListener('DOMContentLoaded', initApp);

// Poll auth status every 15 seconds to instantly catch admin block
const token = localStorage.getItem('token');
if (token) {
    setInterval(async () => {
        try {
            const res = await fetch('https://smartbill-vqjf.onrender.com/api/auth/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.status === 401 || res.status === 403) {
                const overlay = document.createElement('div');
                overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:99999;display:flex;align-items:center;justify-content:center;';
                overlay.innerHTML = '<div style="background:#1e1e2f;padding:2rem;border-radius:12px;text-align:center;color:white;max-width:400px;border:1px solid rgba(255,255,255,0.1);"><h3 style="margin-top:0;">Access Denied</h3><p style="color:#a0aec0;margin-bottom:1.5rem;">Your account has been removed or blocked by the admin.</p><button id="logout-alert-btn" style="background:#6366f1;color:white;border:none;padding:10px 24px;border-radius:8px;cursor:pointer;font-weight:bold;">Okay</button></div>';
                document.body.appendChild(overlay);
                
                document.getElementById('logout-alert-btn').onclick = () => {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = './index.html';
                };
            }
        } catch (err) {}
    }, 15000);
}

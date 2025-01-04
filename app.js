// Constants
const DEFAULT_PROJECT_TITLE = "Plants";

// Load project data from localStorage or initialize
let projectData = JSON.parse(localStorage.getItem('projectData')) || {
    projectTitle: DEFAULT_PROJECT_TITLE,
    entries: {}
};

// Save project data to localStorage
function saveProjectData() {
    localStorage.setItem('projectData', JSON.stringify(projectData));
}

// Calendar state
let currentDate = new Date();
let selectedDate = null;

// DOM Elements
const projectTitleEl = document.getElementById('project-title');
const totalHoursEl = document.getElementById('total-hours');
const totalMilesEl = document.getElementById('total-miles');
const currentMonthEl = document.getElementById('current-month');
const calendarEl = document.getElementById('calendar');
const entryFormEl = document.getElementById('entry-form');
const startTimeEl = document.getElementById('start-time');
const endTimeEl = document.getElementById('end-time');
const setNowEl = document.getElementById('set-now');
const startMileageEl = document.getElementById('start-mileage');
const endMileageEl = document.getElementById('end-mileage');

// Initialize app
function init() {
    projectTitleEl.textContent = projectData.projectTitle;
    renderCalendar();
    setupEventListeners();
    
    // Save data before page unload
    window.addEventListener('beforeunload', saveProjectData);
}

// Render calendar
function renderCalendar() {
    calendarEl.innerHTML = '';
    
    // Get first day of month and total days
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const totalDays = new Date(year, month + 1, 0).getDate();
    
    // Update month header
    currentMonthEl.textContent = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    
    // Add empty cells for days before first day
    for (let i = 0; i < firstDay.getDay(); i++) {
        calendarEl.appendChild(createDayElement(''));
    }
    
    // Add day cells
    const today = new Date();
    for (let day = 1; day <= totalDays; day++) {
        const date = new Date(year, month, day);
        const isToday = date.toDateString() === today.toDateString();
        const isFuture = date > today;
        const entry = projectData.entries[date.toISOString().split('T')[0]] || { hours: 0, miles: 0 };
        
        const dayEl = createDayElement(day, isToday, isFuture, entry);
        calendarEl.appendChild(dayEl);
    }
    
    updateStats();
}

// Create day element
function createDayElement(day, isToday = false, isFuture = false, entry = {}) {
    const dayEl = document.createElement('div');
    dayEl.className = 'p-2 text-center rounded-lg';
    
    if (day === '') {
        dayEl.classList.add('invisible');
        return dayEl;
    }
    
    if (isToday) {
        dayEl.classList.add('bg-blue-100', 'hover:bg-blue-200', 'cursor-pointer');
    } else if (isFuture) {
        dayEl.classList.add('text-gray-400');
    } else {
        dayEl.classList.add('hover:bg-gray-200', 'cursor-pointer');
    }
    
    if (!isFuture) {
        dayEl.addEventListener('click', () => showEntryForm(new Date(currentDate.getFullYear(), currentDate.getMonth(), day)));
    }
    
    dayEl.innerHTML = `
        <div class="font-bold">${day}</div>
        ${entry.hours ? `<div class="text-sm">${formatDuration(entry.hours)}</div>` : ''}
        ${entry.miles ? `<div class="text-sm">${formatMiles(entry.miles)}</div>` : ''}
    `;
    
    return dayEl;
}

// Update stats
function formatMiles(miles) {
    const rounded = Number(miles).toFixed(1);
    return rounded.endsWith('.0') ? `${Math.floor(miles)}mi` : rounded;
}

function formatDuration(hours) {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return m === 0 ? `${h}h` : `${h}:${String(m).padStart(2, '0')}`;
}

function updateStats() {
    const currentMonthEntries = Object.entries(projectData.entries)
        .filter(([date]) => date.startsWith(currentDate.toISOString().slice(0, 7)));
    
    const totalHours = currentMonthEntries.reduce((sum, [, entry]) => sum + (entry.hours || 0), 0);
    const totalMiles = currentMonthEntries.reduce((sum, [, entry]) => sum + (entry.miles || 0), 0);
    
    totalHoursEl.textContent = formatDuration(totalHours);
    totalMilesEl.textContent = Number(totalMiles).toFixed(1);
}

// Show entry form
function showEntryForm(date) {
    selectedDate = date;
    const dateStr = date.toISOString().split('T')[0];
    const entry = projectData.entries[dateStr] || { 
        startTime: '09:00',
        endTime: '17:00',
        startMileage: 0,
        endMileage: 0
    };
    
    // Format date as "Month Day, Year"
    const formattedDate = date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });
    
    document.getElementById('entry-date').textContent = formattedDate;
    startTimeEl.value = entry.startTime;
    endTimeEl.value = entry.endTime;
    startMileageEl.value = entry.startMileage;
    endMileageEl.value = entry.endMileage;
    entryFormEl.classList.remove('hidden');
}

// Save entry
function calculateHours(startTime, endTime) {
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    return ((endH * 60 + endM) - (startH * 60 + startM)) / 60;
}

function saveEntry() {
    const dateStr = selectedDate.toISOString().split('T')[0];
    const startTime = startTimeEl.value;
    const endTime = endTimeEl.value;
    const startMileage = parseFloat(startMileageEl.value) || 0;
    const endMileage = parseFloat(endMileageEl.value) || 0;
    
    projectData.entries[dateStr] = {
        startTime,
        endTime,
        startMileage,
        endMileage,
        hours: calculateHours(startTime, endTime),
        miles: endMileage - startMileage
    };
    
    entryFormEl.classList.add('hidden');
    saveProjectData();
    renderCalendar();
}

// Event listeners
function setupEventListeners() {
    document.getElementById('prev-month').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });
    
    document.getElementById('next-month').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });
    
    document.getElementById('save-entry').addEventListener('click', saveEntry);
    
    document.getElementById('cancel-entry').addEventListener('click', () => {
        entryFormEl.classList.add('hidden');
    });
    
    // Set current time buttons
    setNowEl.addEventListener('click', () => {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        endTimeEl.value = `${hours}:${minutes}`;
    });

    document.getElementById('set-now-start').addEventListener('click', () => {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        startTimeEl.value = `${hours}:${minutes}`;
    });
}

// Initialize app
init();

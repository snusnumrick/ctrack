// Constants
const DEFAULT_PROJECT_TITLE = "Plants";
// Data version - increment this when making breaking changes
const DATA_VERSION = 1;

// Export functions for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        calculateHours,
        formatDuration,
        formatMiles,
        loadProjectData,
        DATA_VERSION,
        DEFAULT_PROJECT_TITLE,
        init,
        initDOMElements
    };
}

// Load project data from localStorage with migration support
let projectData = loadProjectData();

function loadProjectData() {
    try {
        // Get raw data from localStorage
        const rawData = localStorage.getItem('projectData');

        // Initialize if no data exists
        if (!rawData) {
            return {
                version: DATA_VERSION,
                projectTitle: DEFAULT_PROJECT_TITLE,
                entries: {}
            };
        }

        // Parse and migrate data
        let data = JSON.parse(rawData);

        // Backup old data before migration
        if (!data.version || data.version < DATA_VERSION) {
            const backupKey = 'projectData_backup_' + new Date().toISOString();
            localStorage.setItem(backupKey, rawData);
            console.log('Created data backup:', backupKey);
        }

        // Migration system
        if (!data.version) {
            // Version 0 to 1 migration
            data = {
                version: 1,
                projectTitle: data.projectTitle || DEFAULT_PROJECT_TITLE,
                entries: data.entries || {}
            };
        }

        // Add future migrations here using else if (data.version === X)

        // Validate entries
        if (data.entries) {
            for (const [date, entry] of Object.entries(data.entries)) {
                if (!entry.hours) entry.hours = 0;
                if (!entry.miles) entry.miles = 0;
                if (!entry.startTime) entry.startTime = '09:00';
                if (!entry.endTime) entry.endTime = '17:00';
            }
        }

        // Save migrated data
        localStorage.setItem('projectData', JSON.stringify(data));
        return data;
    } catch (error) {
        console.error('Error loading project data:', error);
        return {
            version: DATA_VERSION,
            projectTitle: DEFAULT_PROJECT_TITLE,
            entries: {}
        };
    }
}

// Save project data to localStorage with version
function saveProjectData() {
    try {
        projectData.version = DATA_VERSION;
        localStorage.setItem('projectData', JSON.stringify(projectData));
    } catch (error) {
        console.error('Error saving project data:', error);
        // Try to save to sessionStorage as fallback
        try {
            sessionStorage.setItem('projectData', JSON.stringify(projectData));
            console.warn('Saved data to sessionStorage as fallback');
        } catch (fallbackError) {
            console.error('Failed to save data to sessionStorage:', fallbackError);
        }
    }
}

// Calendar state
let currentDate = new Date();
let selectedDate = null;

// DOM Elements
let projectTitleEl, totalHoursEl, totalMilesEl, currentMonthEl, calendarEl,
    entryFormEl, startTimeEl, endTimeEl, setNowEl, startMileageEl, endMileageEl;

function initDOMElements() {
    projectTitleEl = document.getElementById('project-title');
    totalHoursEl = document.getElementById('total-hours');
    totalMilesEl = document.getElementById('total-miles');
    currentMonthEl = document.getElementById('current-month');
    calendarEl = document.getElementById('calendar');
    entryFormEl = document.getElementById('entry-form');

    // Remove references to old single time inputs
    // Set now buttons are now handled within each interval
}

// Initialize app
function init() {
    initDOMElements();
    projectTitleEl.textContent = projectData.projectTitle;
    projectTitleEl.classList.add('text-gray-900', 'dark:text-gray-100');
    renderCalendar();
    setupEventListeners();
    setupSwipeGestures();

    // Save data before page unload
    window.addEventListener('beforeunload', saveProjectData);
}

// Swipe gesture handling
function setupSwipeGestures() {
    const container = document.getElementById('main-container');
    let touchStartX = 0;
    let touchEndX = 0;
    const minSwipeDistance = 50; // Minimum distance in pixels to consider it a swipe

    container.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    });

    container.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipeGesture();
    });

    function handleSwipeGesture() {
        const distance = touchEndX - touchStartX;
        
        if (Math.abs(distance) < minSwipeDistance) return;

        if (distance > 0) {
            // Swipe right - previous month/interval
            if (entryFormEl.classList.contains('hidden')) {
                currentDate.setMonth(currentDate.getMonth() - 1);
                renderCalendar();
            } else {
                if (currentIntervalIndex > 0) {
                    currentIntervalIndex--;
                    updateIntervalDisplay();
                }
            }
        } else {
            // Swipe left - next month/interval
            if (entryFormEl.classList.contains('hidden')) {
                currentDate.setMonth(currentDate.getMonth() + 1);
                renderCalendar();
            } else {
                if (currentIntervalIndex < intervals.length - 1) {
                    currentIntervalIndex++;
                    updateIntervalDisplay();
                } else {
                    addInterval();
                    currentIntervalIndex = intervals.length - 1;
                    updateIntervalDisplay();
                }
            }
        }
    }
}

// Render calendar
function renderCalendar() {
    calendarEl.innerHTML = '';

    // Add day names row
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayNames.forEach(day => {
        const dayEl = document.createElement('div');
        dayEl.className = 'p-2 text-center font-medium text-gray-600 dark:text-gray-400';
        dayEl.textContent = day;
        calendarEl.appendChild(dayEl);
    });

    // Get first day of month and total days
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const totalDays = new Date(year, month + 1, 0).getDate();

    // Update month header
    currentMonthEl.textContent = currentDate.toLocaleString('default', {month: 'long', year: 'numeric'});

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
        const entry = projectData.entries[date.toISOString().split('T')[0]] || {hours: 0, miles: 0};

        const dayEl = createDayElement(day, isToday, isFuture, entry);
        calendarEl.appendChild(dayEl);
    }

    updateStats();
}

// Create day element
function createDayElement(day, isToday = false, isFuture = false, entry = {}) {
    const dayEl = document.createElement('div');
    dayEl.className = 'p-2 text-center rounded-lg dark:text-gray-100';

    if (day === '') {
        dayEl.classList.add('invisible');
        return dayEl;
    }

    if (isToday) {
        dayEl.classList.add('bg-blue-100', 'dark:bg-blue-800', 'hover:bg-blue-200', 'dark:hover:bg-blue-700', 'cursor-pointer');
    } else if (isFuture) {
        dayEl.classList.add('text-gray-400', 'dark:text-gray-500');
    } else {
        dayEl.classList.add('hover:bg-gray-200', 'dark:hover:bg-gray-700', 'cursor-pointer');
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
    if (!miles || isNaN(miles) || miles === 0) return '';
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

    const totals = currentMonthEntries.reduce((acc, [, entry]) => {
        if (Array.isArray(entry.intervals)) {
            entry.hours = entry.intervals.reduce((sum, interval) => sum + (interval.hours || 0), 0);
            entry.miles = entry.intervals.reduce((sum, interval) => sum + (interval.miles || 0), 0);
        }
        acc.hours += entry.hours || 0;
        acc.miles += entry.miles || 0;
        return acc;
    }, {hours: 0, miles: 0});

    totalHoursEl.textContent = formatDuration(totals.hours);
    totalMilesEl.textContent = Number(totals.miles).toFixed(1);
}

// Show entry form
function showEntryForm(date) {
    selectedDate = date;
    const dateStr = date.toISOString().split('T')[0];
    const entry = projectData.entries[dateStr] || {
        intervals: [{
            startTime: '',
            endTime: '',
            startMileage: null,
            endMileage: null
        }]
    };

    // Format date as "Month Day, Year"
    const formattedDate = date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });

    const entryDateEl = document.getElementById('entry-date');
    entryDateEl.textContent = formattedDate;
    entryDateEl.classList.add('dark:text-gray-100');

    // Reset interval state
    intervals = [];
    currentIntervalIndex = 0;

    // Add each interval with saved values
    entry.intervals.forEach(interval => {
        const newInterval = {
            startTime: interval.startTime || '',
            endTime: interval.endTime || '',
            startMileage: interval.startMileage || null,
            endMileage: interval.endMileage || null
        };
        addInterval(newInterval);
    });

    entryFormEl.classList.remove('hidden');
    // Reset interval state
    currentIntervalIndex = 0;
    updateIntervalDisplay();
    setupIntervalNavigation();
}

let currentIntervalIndex = 0;
let intervals = [];

function addInterval(interval = {}) {
    console.log('Adding new interval', {interval});
    const template = document.getElementById('interval-template');
    const clone = template.content.cloneNode(true);

    const intervalEl = clone.querySelector('.interval-item');
    // Set initial values from interval data
    intervalEl.querySelector('.interval-start-time').value = interval.startTime || '';
    intervalEl.querySelector('.interval-end-time').value = interval.endTime || '';

    // Add click handlers to initialize with current time
    intervalEl.querySelector('.interval-start-time').addEventListener('click', (e) => {
        if (!e.target.value) {
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            e.target.value = `${hours}:${minutes}`;
        }
    });

    intervalEl.querySelector('.interval-end-time').addEventListener('click', (e) => {
        if (!e.target.value) {
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            e.target.value = `${hours}:${minutes}`;
        }
    });
    intervalEl.querySelector('.interval-start-mileage').value = interval.startMileage || '';
    intervalEl.querySelector('.interval-end-mileage').value = interval.endMileage || '';

    // Increment currentIntervalIndex when adding new interval
    currentIntervalIndex = intervals.length;

    // Add remove interval handler
    intervalEl.querySelector('.remove-interval').addEventListener('click', () => {
        if (intervals.length > 1) {
            intervals.splice(currentIntervalIndex, 1);
            if (currentIntervalIndex >= intervals.length) {
                currentIntervalIndex = intervals.length - 1;
            }
            updateIntervalDisplay();
        }
    });

    intervals.push(intervalEl);
    updateIntervalDisplay();
}

function updateIntervalDisplay() {
    console.log('Updating interval display', {
        currentIntervalIndex,
        intervalsLength: intervals.length,
        intervals
    });
    const container = document.getElementById('interval-container');
    container.innerHTML = '';
    if (intervals.length > 0) {
        container.appendChild(intervals[currentIntervalIndex]);
    }
    updateIntervalCounter();
    updateNavButtons();
}

function updateIntervalCounter() {
    const counter = document.getElementById('interval-counter');
    counter.textContent = `${currentIntervalIndex + 1}/${intervals.length}`;
}

function updateNavButtons() {
    const prevBtn = document.getElementById('prev-interval');
    const nextBtn = document.getElementById('next-interval');
    const removeBtns = document.querySelectorAll('.remove-interval');

    prevBtn.disabled = currentIntervalIndex === 0;
    nextBtn.disabled = false;

    // Disable remove button if there's only one interval
    removeBtns.forEach(btn => {
        btn.disabled = intervals.length === 1;
    });
}

function setupIntervalNavigation() {
    console.log('Setting up interval navigation');

    // Get button references
    const prevBtn = document.getElementById('prev-interval');
    const nextBtn = document.getElementById('next-interval');

    // Debug button states
    console.log('Button states before setup:', {
        prevBtnExists: !!prevBtn,
        nextBtnExists: !!nextBtn,
        prevBtnDisabled: prevBtn?.disabled,
        nextBtnDisabled: nextBtn?.disabled
    });

    // Remove any existing event listeners by replacing buttons
    const newPrevBtn = prevBtn.cloneNode(true);
    const newNextBtn = nextBtn.cloneNode(true);

    // Store references to the new buttons
    prevBtn.replaceWith(newPrevBtn);
    nextBtn.replaceWith(newNextBtn);

    // Create new event handlers
    const handlePrevClick = (e) => {
        console.log('Previous interval clicked', {
            eventType: e.type,
            target: e.target,
            currentIntervalIndex,
            intervalsLength: intervals.length
        });
        if (currentIntervalIndex > 0) {
            currentIntervalIndex--;
            updateIntervalDisplay();
        }
    };

    const handleNextClick = (e) => {
        console.log('Next interval clicked', {
            eventType: e.type,
            target: e.target,
            currentIntervalIndex,
            intervalsLength: intervals.length
        });
        if (currentIntervalIndex < intervals.length - 1) {
            currentIntervalIndex++;
            updateIntervalDisplay();
        } else {
            console.log('Adding new interval via next button click');
            addInterval();
            currentIntervalIndex = intervals.length - 1;
            updateIntervalDisplay();
            updateNavButtons(); // Add this line to update button states
        }
    };

    // Add event listeners using the new handlers
    newPrevBtn.addEventListener('click', handlePrevClick);
    newNextBtn.addEventListener('click', handleNextClick);

    // Debug log that listeners were added
    console.log('Event listeners added to navigation buttons');

    // Update button states
    updateNavButtons();

    console.log('Interval navigation setup complete', {
        currentIntervalIndex,
        intervalsLength: intervals.length
    });

}

// Save entry
function calculateHours(startTime, endTime) {
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    return ((endH * 60 + endM) - (startH * 60 + startM)) / 60;
}

function saveEntry() {
    const dateStr = selectedDate.toISOString().split('T')[0];
    const savedIntervals = [];
    let totalHours = 0;
    let totalMiles = 0;

    // Get all intervals from the DOM
    intervals.forEach(intervalEl => {
        const startTime = intervalEl.querySelector('.interval-start-time').value;
        const endTime = intervalEl.querySelector('.interval-end-time').value;
        const startMileage = parseFloat(intervalEl.querySelector('.interval-start-mileage').value);
        const endMileage = parseFloat(intervalEl.querySelector('.interval-end-mileage').value);

        const hours = calculateHours(startTime, endTime);
        // Only calculate miles if both values are non-negative numbers
        const miles = (typeof startMileage === 'number' && !isNaN(startMileage) && startMileage >= 0 &&
            typeof endMileage === 'number' && !isNaN(endMileage) && endMileage >= 0)
            ? endMileage - startMileage
            : 0;
        savedIntervals.push({
            startTime,
            endTime,
            startMileage,
            endMileage,
            hours,
            miles
        });

        totalHours += hours;
        totalMiles += miles;
    });

    // Save all intervals and totals
    projectData.entries[dateStr] = {
        intervals: savedIntervals,
        hours: totalHours,
        miles: totalMiles
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

    // Set now functionality is handled within each interval
}

// Initialize app
init();

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
    
    // Handle URL shortcuts
    handleURLShortcuts();

    // Save data before page unload
    window.addEventListener('beforeunload', saveProjectData);
}

// Handle URL shortcuts from manifest
function handleURLShortcuts() {
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get('action');
    
    if (action === 'add-today') {
        // Open today's entry form
        const today = new Date();
        showEntryForm(today);
        
        // Clear the URL parameter to avoid reopening on refresh
        const url = new URL(window.location);
        url.searchParams.delete('action');
        window.history.replaceState({}, document.title, url.pathname);
    }
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

// Enhanced time input handling
function setupTimeInputHandlers(input) {
    // Format time as user types
    input.addEventListener('input', (e) => {
        let value = e.target.value.replace(/[^\d:]/g, ''); // Remove non-digits except colon
        
        // Remove multiple colons
        const colonCount = (value.match(/:/g) || []).length;
        if (colonCount > 1) {
            value = value.replace(/:/g, '');
        }
        
        // Auto-format with colon for numeric input
        if (value.length >= 3 && !value.includes(':')) {
            // Auto-format with colon (e.g., 1530 -> 15:30)
            value = value.slice(0, 2) + ':' + value.slice(2, 4);
        } else if (value.length === 2 && !value.includes(':') && e.inputType !== 'deleteContentBackward') {
            // Auto-add colon after 2 digits when typing forward
            value = value + ':';
        }
        
        // Limit to 5 characters (HH:MM)
        if (value.length > 5) {
            value = value.slice(0, 5);
        }
        
        e.target.value = value;
        validateTimeInput(e.target);
    });
    
    // Handle paste events
    input.addEventListener('paste', (e) => {
        e.preventDefault();
        const paste = (e.clipboardData || window.clipboardData).getData('text');
        const cleaned = paste.replace(/[^\d:]/g, '');
        input.value = cleaned;
        validateTimeInput(input);
    });
    
    // Force numeric keyboard with aggressive approach
    function forceNumericKeyboard(element) {
        // Store current value and selection
        const currentValue = element.value;
        const selectionStart = element.selectionStart;
        const selectionEnd = element.selectionEnd;
        
        // Temporarily clear the field to force iOS to reconsider keyboard type
        element.value = '';
        element.setAttribute('inputmode', 'decimal');
        element.setAttribute('pattern', '[0-9]*');
        element.setAttribute('type', 'tel');
        
        // Use setTimeout to restore value after iOS makes keyboard decision
        setTimeout(() => {
            element.value = currentValue;
            // Restore cursor position
            if (selectionStart !== null && selectionEnd !== null) {
                element.setSelectionRange(selectionStart, selectionEnd);
            }
        }, 10);
    }
    
    // Ensure numeric keyboard on touch (before focus)
    input.addEventListener('touchstart', (e) => {
        e.target.setAttribute('inputmode', 'decimal');
        e.target.setAttribute('pattern', '[0-9]*');
        e.target.setAttribute('type', 'tel');
    });
    
    // Handle focus - set current time if empty and force numeric keyboard
    input.addEventListener('focus', (e) => {
        if (e.target.value && e.target.value.length > 0) {
            // Field has content - use aggressive approach to force numeric keyboard
            forceNumericKeyboard(e.target);
        } else {
            // Empty field - set current time
            e.target.setAttribute('inputmode', 'decimal');
            e.target.setAttribute('pattern', '[0-9]*');
            e.target.setAttribute('type', 'tel');
            
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            e.target.value = `${hours}:${minutes}`;
            validateTimeInput(e.target);
        }
        // Select all text for easy replacement
        e.target.select();
    });
    
    // Additional click handler for stubborn cases
    input.addEventListener('click', (e) => {
        // Small delay to let focus event complete first
        setTimeout(() => {
            if (e.target.value && e.target.value.length > 0) {
                forceNumericKeyboard(e.target);
            }
        }, 50);
    });
    
    // Validate on blur
    input.addEventListener('blur', (e) => {
        validateTimeInput(e.target);
    });
    
    // Handle keyboard shortcuts
    input.addEventListener('keydown', (e) => {
        // Allow: backspace, delete, tab, escape, enter
        if ([8, 9, 27, 13, 46].indexOf(e.keyCode) !== -1 ||
            // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
            (e.keyCode === 65 && e.ctrlKey === true) ||
            (e.keyCode === 67 && e.ctrlKey === true) ||
            (e.keyCode === 86 && e.ctrlKey === true) ||
            (e.keyCode === 88 && e.ctrlKey === true)) {
            return;
        }
        // Ensure that it is a number or colon and stop the keypress
        if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && 
            (e.keyCode < 96 || e.keyCode > 105) && 
            e.keyCode !== 186) { // 186 is colon
            e.preventDefault();
        }
    });
}

function validateTimeInput(input) {
    const value = input.value;
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    
    // Remove any existing error styling
    input.classList.remove('border-red-500', 'border-green-500');
    
    if (value === '') {
        // Empty is okay
        return true;
    }
    
    if (timeRegex.test(value)) {
        // Valid time format - now check start/end time relationship
        validateTimeSequence(input);
        return true;
    } else {
        // Invalid time format
        input.classList.add('border-red-500');
        return false;
    }
}

function validateTimeSequence(changedInput) {
    // Find the interval container for this input
    const intervalEl = changedInput.closest('.interval-item');
    if (!intervalEl) return;
    
    const startTimeInput = intervalEl.querySelector('.interval-start-time');
    const endTimeInput = intervalEl.querySelector('.interval-end-time');
    
    // Remove previous sequence validation styling
    startTimeInput.classList.remove('border-red-500', 'border-green-500');
    endTimeInput.classList.remove('border-red-500', 'border-green-500');
    
    // Only validate if both fields have values
    if (!startTimeInput.value || !endTimeInput.value) {
        // If both have values, mark as valid format (but not sequence)
        if (startTimeInput.value && /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(startTimeInput.value)) {
            startTimeInput.classList.add('border-green-500');
        }
        if (endTimeInput.value && /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(endTimeInput.value)) {
            endTimeInput.classList.add('border-green-500');
        }
        return;
    }
    
    const startTime = startTimeInput.value;
    const endTime = endTimeInput.value;
    
    // Parse times
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    
    if (endMinutes <= startMinutes) {
        // End time is not after start time
        startTimeInput.classList.add('border-red-500');
        endTimeInput.classList.add('border-red-500');
        
        // Show tooltip or error message
        const errorMsg = intervalEl.querySelector('.time-error-msg');
        if (!errorMsg) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'time-error-msg text-red-500 text-xs mt-1';
            errorDiv.textContent = 'End time must be after start time';
            endTimeInput.parentNode.appendChild(errorDiv);
        }
    } else {
        // Valid sequence
        startTimeInput.classList.add('border-green-500');
        endTimeInput.classList.add('border-green-500');
        
        // Remove error message if it exists
        const errorMsg = intervalEl.querySelector('.time-error-msg');
        if (errorMsg) {
            errorMsg.remove();
        }
    }
}

function addInterval(interval = {}) {
    console.log('Adding new interval', {interval});
    const template = document.getElementById('interval-template');
    const clone = template.content.cloneNode(true);

    const intervalEl = clone.querySelector('.interval-item');
    // Set initial values from interval data
    intervalEl.querySelector('.interval-start-time').value = interval.startTime || '';
    intervalEl.querySelector('.interval-end-time').value = interval.endTime || '';

    // Add enhanced time input handlers
    const startTimeInput = intervalEl.querySelector('.interval-start-time');
    const endTimeInput = intervalEl.querySelector('.interval-end-time');
    
    // Setup time input handlers for both start and end time
    [startTimeInput, endTimeInput].forEach(input => {
        setupTimeInputHandlers(input);
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
    if (!startTime || !endTime) {
        return 0;
    }
    
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    
    if (isNaN(startH) || isNaN(startM) || isNaN(endH) || isNaN(endM)) {
        return 0;
    }
    
    return ((endH * 60 + endM) - (startH * 60 + startM)) / 60;
}

function saveEntry() {
    // Validate all time inputs first
    let hasValidationErrors = false;
    let errorMessages = [];
    
    intervals.forEach((intervalEl, index) => {
        const startTimeInput = intervalEl.querySelector('.interval-start-time');
        const endTimeInput = intervalEl.querySelector('.interval-end-time');
        
        // Validate format
        const startValid = validateTimeInput(startTimeInput);
        const endValid = validateTimeInput(endTimeInput);
        
        if (!startValid || !endValid) {
            hasValidationErrors = true;
            errorMessages.push(`Interval ${index + 1}: Invalid time format. Use 24-hour format (e.g., 15:30)`);
        }
        
        // Check if both times are provided and valid for sequence validation
        if (startTimeInput.value && endTimeInput.value && startValid && endValid) {
            const startTime = startTimeInput.value;
            const endTime = endTimeInput.value;
            
            // Validate that end time is after start time
            const [startH, startM] = startTime.split(':').map(Number);
            const [endH, endM] = endTime.split(':').map(Number);
            const startMinutes = startH * 60 + startM;
            const endMinutes = endH * 60 + endM;
            
            if (endMinutes <= startMinutes) {
                startTimeInput.classList.add('border-red-500');
                endTimeInput.classList.add('border-red-500');
                hasValidationErrors = true;
                errorMessages.push(`Interval ${index + 1}: End time (${endTime}) must be after start time (${startTime})`);
            }
        }
        
        // Check if at least one time is provided (can't have completely empty interval)
        if (!startTimeInput.value && !endTimeInput.value) {
            hasValidationErrors = true;
            errorMessages.push(`Interval ${index + 1}: Please provide at least start and end times`);
        }
    });
    
    if (hasValidationErrors) {
        const errorMessage = errorMessages.length > 0 
            ? errorMessages.join('\n') 
            : 'Please fix the time input errors before saving.';
        alert(errorMessage);
        return;
    }
    
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

    // FAB (Floating Action Button) event listener
    document.getElementById('fab-add-today').addEventListener('click', () => {
        const today = new Date();
        showEntryForm(today);
    });

    // Set now functionality is handled within each interval
}

// Initialize app
init();

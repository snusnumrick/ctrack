// Import app functions without auto-init
import {
    calculateHours,
    formatDuration,
    formatMiles,
    loadProjectData,
    DATA_VERSION,
    DEFAULT_PROJECT_TITLE,
    init
} from '../app.js';

// Initialize app manually for tests
beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = `
        <div id="project-title"></div>
        <div id="total-hours"></div>
        <div id="total-miles"></div>
        <div id="current-month"></div>
        <div id="calendar"></div>
        <div id="entry-form" class="hidden">
            <input id="start-time">
            <input id="end-time">
            <input id="start-mileage">
            <input id="end-mileage">
            <div id="entry-date"></div>
            <button id="save-entry"></button>
            <button id="cancel-entry"></button>
        </div>
        <button id="prev-month"></button>
        <button id="next-month"></button>
        <button id="set-now"></button>
        <button id="set-now-start"></button>
        <div id="calendar"></div>
    `;
    
    // Reset localStorage
    localStorage.clear();
    
    // Initialize app
    init();
});

// Mock localStorage and DOM elements
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    },
    removeItem: (key) => {
      delete store[key];
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

global.localStorage = localStorageMock;

describe('Plants Tracker', () => {
    describe('calculateHours()', () => {
        test('calculates hours between two times', () => {
            expect(calculateHours('09:00', '17:00')).toBe(8);
            expect(calculateHours('08:30', '16:45')).toBeCloseTo(8.25);
            expect(calculateHours('23:00', '01:00')).toBe(2); // Cross midnight
        });
    });

    describe('formatDuration()', () => {
        test('formats hours correctly', () => {
            expect(formatDuration(8)).toBe('8h');
            expect(formatDuration(8.5)).toBe('8:30');
            expect(formatDuration(8.25)).toBe('8:15');
        });
    });

    describe('formatMiles()', () => {
        test('formats miles correctly', () => {
            expect(formatMiles(10)).toBe('10mi');
            expect(formatMiles(10.5)).toBe('10.5');
            expect(formatMiles(10.0)).toBe('10mi');
        });
    });

    describe('loadProjectData()', () => {
        beforeEach(() => {
            localStorage.clear();
        });

        test('creates default data structure when no data exists', () => {
            const data = loadProjectData();
            expect(data).toEqual({
                version: 1,
                projectTitle: "Plants",
                entries: {}
            });
        });

        test('migrates old data format', () => {
            const oldData = {
                projectTitle: "Old Project",
                entries: {
                    '2024-01-01': { hours: 8, miles: 10 }
                }
            };
            localStorage.setItem('projectData', JSON.stringify(oldData));
            
            const data = loadProjectData();
            expect(data.version).toBe(1);
            expect(data.projectTitle).toBe("Old Project");
            expect(data.entries['2024-01-01'].startTime).toBe('09:00');
            expect(data.entries['2024-01-01'].endTime).toBe('17:00');
        });
    });
});

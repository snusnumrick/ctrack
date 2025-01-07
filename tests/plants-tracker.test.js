import { formatDuration } from '../app.js';

describe('formatDuration', () => {
    test('formats whole hours correctly', () => {
        expect(formatDuration(8)).toBe('8h');
    });

    test('formats hours with minutes correctly', () => {
        expect(formatDuration(8.5)).toBe('8:30');
    });

    test('formats partial hours correctly', () => {
        expect(formatDuration(0.5)).toBe('0:30');
    });
});

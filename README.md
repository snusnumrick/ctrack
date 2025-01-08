# Plants Project Tracker

A simple mobile-friendly web application for tracking daily work hours and miles driven for plant-related projects.

## Features

- 📅 Calendar view with month navigation
- ⏰ Time tracking with multiple intervals per day
- 🚗 Mileage tracking with start/end odometer readings
- 💾 Automatic data persistence using localStorage with backup system
- 📊 Monthly statistics with formatted hours (e.g., 4:30) and miles (e.g., 12.5)
- 📱 Mobile-friendly responsive design
- ✨ Clean and simple user interface
- ➕ Add/remove intervals for complex work days
- ⏱️ Click time fields to set current time

## Usage

1. Open the application in your browser
2. Click on any past or current date to enter:
   - Add multiple work intervals with start/end times
   - Enter mileage for each interval
3. Use the navigation buttons to:
   - Switch between intervals
   - Add new intervals
   - Remove intervals (minimum 1 required)
4. Click empty time fields to set current time
5. Use the month navigation buttons to switch between months
6. View your monthly totals in the stats section

## Technical Details

- Built with vanilla JavaScript
- Uses Tailwind CSS for styling
- Data is stored in the browser's localStorage
- Supports fractional hours and miles (e.g., 4.5 hours)
- Today's date is highlighted and clickable
- Future dates are disabled
- Data versioning system for future migrations
- Backup system for old data formats

## Customization

To change the project title:
1. Open `app.js`
2. Modify the `DEFAULT_PROJECT_TITLE` constant at the top of the file

## License

MIT License - Free to use and modify

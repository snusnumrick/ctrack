# Plants Project Tracker

A simple mobile-friendly web application for tracking daily work hours and miles driven for plant-related projects.

## Features

- 📅 Calendar view with month navigation
- ⏰ Time tracking with start/end times
- 🚗 Mileage tracking with start/end odometer readings
- 💾 Automatic data persistence using localStorage with backup system
- 📊 Monthly statistics with formatted hours (e.g., 4:30) and miles (e.g., 12.5)
- 📱 Mobile-friendly responsive design
- ✨ Clean and simple user interface
- ⏱️ "Set to Now" buttons for quick time entry

## Usage

1. Open the application in your browser
2. Click on any past or current date to enter:
   - Start and end times (automatically calculates hours)
   - Start and end mileage (automatically calculates miles)
3. Use the "Set to Now" buttons for quick time entry
4. Use the navigation buttons to switch between months
5. View your monthly totals in the stats section

## Technical Details

- Built with vanilla JavaScript
- Uses Tailwind CSS for styling
- Data is stored in the browser's localStorage
- Supports fractional hours and miles (e.g., 4.5 hours)
- Today's date is highlighted and clickable
- Future dates are disabled

## Customization

To change the project title:
1. Open `app.js`
2. Modify the `DEFAULT_PROJECT_TITLE` constant at the top of the file

## License

MIT License - Free to use and modify

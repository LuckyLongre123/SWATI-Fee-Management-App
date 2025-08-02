# SWATI Student Fee Management System

A modern, responsive web application for managing student fees and payments with Excel export/import functionality.

## Features

### 📊 Dashboard
- Real-time statistics (total students, paid/pending fees, revenue)
- Recent students overview
- Quick access to all features

### 👥 Student Management
- Add new students with complete details
- View and edit student information
- Delete students with confirmation
- Search and filter students by status

### 💰 Fee Management
- Track individual student fee payments
- Monthly fee breakdown with status tracking
- Payment history with detailed records
- Automatic calculation of remaining fees
- Support for partial payments and advance payments

### 📈 Excel Integration
- **Export to Excel**: Download all student data as `.xlsx` files
- **Import from Excel**: Import student data from Excel files
- **Automatic Backups**: Daily backups with timestamp
- **Multiple Sheets**: Students, Payment History, and Summary sheets

## Excel File Structure

### Students Sheet
- Student ID, Name, Age, Email, Phone
- Address, Date of Birth, Joining Date
- Semester Duration, Total Fees, Paid Fees
- Remaining Fees, Created Date

### Payment History Sheet
- Student ID, Student Name, Payment ID
- Amount, Payment Date, Payment Status

### Summary Sheet
- Total Students, Paid/Pending Students
- Total Revenue, Total Pending Amount
- Export Date

## File Naming Convention

- **Regular Export**: `swati_students_data.xlsx`
- **Backup Files**: `swati_backup_YYYY-MM-DD.xlsx`
- **Import**: Accepts `.xlsx` and `.json` files

## Browser Compatibility

- ✅ Chrome (recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Edge

## Technical Details

### Libraries Used
- **SheetJS**: For Excel file generation and parsing
- **Font Awesome**: For icons
- **Google Fonts**: Poppins font family

### Data Storage
- Local Storage for student data
- Automatic backups every 24 hours
- Excel file downloads for external storage

## Usage Instructions

### Adding Students
1. Navigate to "Add Student" page
2. Fill in all required fields
3. Submit the form
4. Student is automatically added to the system

### Exporting Data
1. Click "Export to Excel" button in the header
2. File will be downloaded as `swati_students_data.xlsx`
3. Open with Microsoft Excel, Google Sheets, or any compatible application

### Importing Data
1. Click "Import from Excel" button
2. Select an Excel file with student data
3. System will merge new students (avoiding duplicates)
4. Success message shows number of imported students

### Creating Backups
1. Click "Create Backup" button
2. File will be downloaded with timestamp
3. Backups are also created automatically every 24 hours

## Important Notes

⚠️ **Browser Limitations**: Browsers cannot modify existing files directly. Each export creates a new file.

✅ **Data Safety**: All data is stored locally and can be exported/imported as needed.

🔄 **Auto Backup**: System creates automatic backups every 24 hours when data exists.

📱 **Responsive Design**: Works on desktop, tablet, and mobile devices.

## Troubleshooting

### Excel File Won't Open
- Ensure you're using a modern browser
- Check that the file extension is `.xlsx`
- Try opening with Microsoft Excel or Google Sheets
- Verify the file wasn't corrupted during download

### Import Issues
- Ensure the Excel file has the correct structure
- Check that required columns are present
- Verify data types (numbers for fees, dates for dates)

### Export Issues
- Refresh the page and try again
- Check browser console for errors
- Ensure SheetJS library is loaded

## Development

This is a client-side only application using:
- HTML5
- CSS3 (with responsive design)
- Vanilla JavaScript (ES6+)
- SheetJS for Excel functionality

No server setup required - just open `index.html` in a web browser.

## License

This project is open source and available under the MIT License. 
// --- SWATI Multi-Page App Utilities ---
function getPage() {
    const path = window.location.pathname;
    if (path.endsWith('add-student.html')) return 'add';
    if (path.endsWith('view-students.html')) return 'view';
    if (path.endsWith('student-details.html')) return 'details';
    return 'dashboard';
}

function showToast(message, type = 'success') {
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => { toast.classList.remove('show'); }, 3000);
}

// Excel Export/Import Utilities
class ExcelDataManager {
    constructor() {
        this.fileName = 'swati_students_data';
        this.lastBackupTime = localStorage.getItem('swati_last_backup') || null;
    }

    // Export data to Excel file
    exportToExcel(data, filename = null) {
        try {
            // Check if SheetJS is available
            if (typeof XLSX === 'undefined') {
                console.error('SheetJS library not loaded');
                return false;
            }

            const workbook = this.createWorkbook(data);
            const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
            
            // Use consistent filename without timestamp for regular exports
            const exportFilename = filename || `${this.fileName}.xlsx`;
            this.downloadFile(excelBuffer, exportFilename);
            return true;
        } catch (error) {
            console.error('Export error:', error);
            return false;
        }
    }

    // Import data from Excel file
    importFromExcel(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    // Check if SheetJS is available
                    if (typeof XLSX === 'undefined') {
                        reject(new Error('SheetJS library not loaded'));
                        return;
                    }

                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const students = this.parseWorkbook(workbook);
                    resolve(students);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error('File reading failed'));
            reader.readAsArrayBuffer(file);
        });
    }

    // Create Excel workbook with multiple sheets
    createWorkbook(students) {
        const workbook = XLSX.utils.book_new();

        // Students sheet
        const studentsData = students.map(student => ({
            'ID': student.id,
            'Name': student.name,
            'Age': student.age,
            'Email': student.email,
            'Phone': student.phone,
            'Address': student.address,
            'Date of Birth': student.dob,
            'Joining Date': student.joining,
            'Semester Duration (Months)': student.semester,
            'Total Fees': student.totalFees,
            'Paid Fees': student.paidFees,
            'Remaining Fees': student.totalFees - student.paidFees,
            'Created Date': student.createdAt
        }));

        const studentsSheet = XLSX.utils.json_to_sheet(studentsData);
        XLSX.utils.book_append_sheet(workbook, studentsSheet, 'Students');

        // Payment History sheet
        const paymentHistory = [];
        students.forEach(student => {
            student.feeHistory.forEach(payment => {
                paymentHistory.push({
                    'Student ID': student.id,
                    'Student Name': student.name,
                    'Payment ID': payment.id,
                    'Amount': payment.amount,
                    'Payment Date': payment.date,
                    'Payment Status': 'Completed'
                });
            });
        });

        if (paymentHistory.length > 0) {
            const paymentSheet = XLSX.utils.json_to_sheet(paymentHistory);
            XLSX.utils.book_append_sheet(workbook, paymentSheet, 'PaymentHistory');
        }

        // Summary sheet
        const summary = [{
            'Total Students': students.length,
            'Paid Students': students.filter(s => s.paidFees >= s.totalFees).length,
            'Pending Students': students.filter(s => s.paidFees < s.totalFees).length,
            'Total Revenue': students.reduce((sum, s) => sum + s.paidFees, 0),
            'Total Pending Amount': students.reduce((sum, s) => sum + Math.max(0, s.totalFees - s.paidFees), 0),
            'Export Date': new Date().toISOString()
        }];

        const summarySheet = XLSX.utils.json_to_sheet(summary);
        XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

        return workbook;
    }

    // Parse workbook back to students data
    parseWorkbook(workbook) {
        const studentsSheet = workbook.Sheets['Students'];
        if (!studentsSheet) return [];

        const students = XLSX.utils.sheet_to_json(studentsSheet);
        
        return students.map(student => ({
            id: student.ID,
            name: student.Name,
            age: parseInt(student.Age),
            email: student.Email,
            phone: student.Phone,
            address: student.Address,
            dob: student['Date of Birth'],
            joining: student['Joining Date'],
            semester: parseInt(student['Semester Duration (Months)']),
            totalFees: parseFloat(student['Total Fees']),
            paidFees: parseFloat(student['Paid Fees']),
            feeHistory: [], // Will be populated from PaymentHistory sheet
            createdAt: student['Created Date']
        }));
    }

    // Download file
    downloadFile(buffer, filename) {
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    // Get current timestamp
    getCurrentTimestamp() {
        return new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    }

    // Create backup
    createBackup(students) {
        const success = this.exportToExcel(students, `swati_backup_${this.getCurrentTimestamp()}.xlsx`);
        if (success) {
            this.lastBackupTime = new Date().toISOString();
            localStorage.setItem('swati_last_backup', this.lastBackupTime);
        }
        return success;
    }

    // Auto backup every 24 hours
    shouldAutoBackup() {
        if (!this.lastBackupTime) return true;
        const lastBackup = new Date(this.lastBackupTime);
        const now = new Date();
        const hoursDiff = (now - lastBackup) / (1000 * 60 * 60);
        return hoursDiff >= 24;
    }
}

// Initialize Excel Data Manager
const excelManager = new ExcelDataManager();

// Initialize based on current page
const currentPage = getPage();

if (currentPage === 'add') {
    document.getElementById('add-student-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        const students = JSON.parse(localStorage.getItem('swati_students')) || [];
        const email = formData.get('email');
        if (students.some(s => s.email === email)) {
            showToast('Student with this email already exists', 'error');
            return;
        }
        const student = {
            id: Date.now().toString(),
            name: formData.get('name'),
            age: parseInt(formData.get('age')),
            email: email,
            phone: formData.get('phone'),
            address: formData.get('address'),
            dob: formData.get('dob'),
            joining: formData.get('joining'),
            semester: parseInt(formData.get('semester')),
            totalFees: parseFloat(formData.get('fees')),
            paidFees: 0,
            feeHistory: [],
            createdAt: new Date().toISOString()
        };
        students.push(student);
        localStorage.setItem('swati_students', JSON.stringify(students));
        
        showToast('Student added successfully!', 'success');
        setTimeout(() => { window.location.href = 'view-students.html'; }, 1000);
    });
}

// --- End Multi-Page App Utilities ---

// Student Fee Management System - SWATI
class StudentFeeManager {
    constructor() {
        this.students = JSON.parse(localStorage.getItem('swati_students')) || [];
        this.currentStudentId = null;
        this.excelManager = excelManager;
        this.init();
        
        // Auto backup check removed - backups only created manually
    }

    init() {
        this.setupEventListeners();
        this.updateDashboard();
        this.renderStudentsList();
        this.renderRecentStudents();
        this.addExcelControls();
    }

    addExcelControls() {
        // Add Excel controls to the header
        const header = document.querySelector('.header');
        if (header) {
            const excelControls = document.createElement('div');
            excelControls.className = 'excel-controls';
            excelControls.innerHTML = `
                <div class="excel-buttons">
                    <button class="btn btn-success btn-small" onclick="app.exportData()">
                        <i class="fas fa-file-excel"></i>
                        Export to Excel
                    </button>
                    <button class="btn btn-info btn-small" onclick="app.importData()">
                        <i class="fas fa-file-upload"></i>
                        Import from Excel
                    </button>
                </div>
                <div class="excel-info">
                    <small><i class="fas fa-info-circle"></i> 
                    Export: swati_students_data.xlsx | 
                    <i class="fas fa-exclamation-triangle"></i> Browser can't modify existing files directly
                    </small>
                </div>
            `;
            header.appendChild(excelControls);
        }
    }

    // Export data to Excel
    exportData() {
        if (this.students.length === 0) {
            this.showToast('No data to export', 'error');
            return;
        }

        // Check if SheetJS is loaded
        if (typeof XLSX === 'undefined') {
            this.showToast('Excel library is loading, please wait a moment and try again', 'warning');
            return;
        }

        const success = this.excelManager.exportToExcel(this.students);
        if (success) {
            this.showToast('Data exported successfully! File: swati_students_data.xlsx', 'success');
        } else {
            this.showToast('Export failed. Please try again.', 'error');
        }
    }

    // Import data from Excel
    importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.xlsx,.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            this.excelManager.importFromExcel(file)
                .then(importedStudents => {
                    if (importedStudents.length === 0) {
                        this.showToast('No valid data found in file', 'error');
                        return;
                    }

                    // Merge with existing data, avoiding duplicates
                    const existingEmails = new Set(this.students.map(s => s.email));
                    const newStudents = importedStudents.filter(s => !existingEmails.has(s.email));
                    
                    if (newStudents.length === 0) {
                        this.showToast('All students already exist in the system', 'warning');
                        return;
                    }

                    this.students = [...this.students, ...newStudents];
                    this.saveStudents();
                    this.showToast(`${newStudents.length} students imported successfully!`, 'success');
                    
                    // Update all views
                    this.updateDashboard();
                    this.renderStudentsList();
                    this.renderRecentStudents();
                })
                .catch(error => {
                    console.error('Import error:', error);
                    this.showToast('Import failed. Please check file format.', 'error');
                });
        };
        input.click();
    }

    // Create backup
    createBackup() {
        if (this.students.length === 0) {
            this.showToast('No data to backup', 'error');
            return;
        }

        const success = this.excelManager.createBackup(this.students);
        if (success) {
            this.showToast('Backup created successfully!', 'success');
        } else {
            this.showToast('Backup failed. Please try again.', 'error');
        }
    }

    setupEventListeners() {
        // Search and filter (only on view-students page)
        const searchInput = document.getElementById('search-students');
        const filterSelect = document.getElementById('filter-status');
        
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterStudents();
            });
        }

        if (filterSelect) {
            filterSelect.addEventListener('change', (e) => {
                this.filterStudents();
            });
        }

        // Modal close
        const closeModal = document.getElementById('close-modal');
        const closeEditModal = document.getElementById('close-edit-modal');
        const cancelEdit = document.getElementById('cancel-edit');
        const studentModal = document.getElementById('student-modal');
        const editStudentModal = document.getElementById('edit-student-modal');
        const editStudentForm = document.getElementById('edit-student-form');

        if (closeModal) {
            closeModal.addEventListener('click', () => {
                this.closeModal();
            });
        }

        if (closeEditModal) {
            closeEditModal.addEventListener('click', () => {
                this.closeEditModal();
            });
        }

        if (cancelEdit) {
            cancelEdit.addEventListener('click', () => {
                this.closeEditModal();
            });
        }

        // Close modal on outside click
        if (studentModal) {
            studentModal.addEventListener('click', (e) => {
                if (e.target.id === 'student-modal') {
                    this.closeModal();
                }
            });
        }

        if (editStudentModal) {
            editStudentModal.addEventListener('click', (e) => {
                if (e.target.id === 'edit-student-modal') {
                    this.closeEditModal();
                }
            });
        }

        // Edit student form
        if (editStudentForm) {
            editStudentForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.updateStudent();
            });
        }
    }

    addStudent() {
        const form = document.getElementById('add-student-form');
        const formData = new FormData(form);
        
        const student = {
            id: Date.now().toString(),
            name: formData.get('name'),
            age: parseInt(formData.get('age')),
            email: formData.get('email'),
            phone: formData.get('phone'),
            address: formData.get('address'),
            dob: formData.get('dob'),
            joining: formData.get('joining'),
            semester: parseInt(formData.get('semester')),
            totalFees: parseFloat(formData.get('fees')),
            paidFees: 0,
            feeHistory: [],
            createdAt: new Date().toISOString()
        };

        // Validate required fields
        if (!student.name || !student.email || !student.phone) {
            this.showToast('Please fill all required fields', 'error');
            return;
        }

        // Check if email already exists
        if (this.students.some(s => s.email === student.email)) {
            this.showToast('Student with this email already exists', 'error');
            return;
        }

        this.students.push(student);
        this.saveStudents();
        
        this.showToast('Student added successfully!', 'success');
        form.reset();
        
        // Switch to dashboard to show updated stats
        this.updateDashboard();
    }

    renderStudentsList() {
        const studentsList = document.getElementById('students-list');
        if (!studentsList) return;

        const searchInput = document.getElementById('search-students');
        const filterSelect = document.getElementById('filter-status');
        
        const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
        const filterStatus = filterSelect ? filterSelect.value : 'all';

        let filteredStudents = this.students.filter(student => {
            const matchesSearch = student.name.toLowerCase().includes(searchTerm) ||
                                student.email.toLowerCase().includes(searchTerm) ||
                                student.phone.includes(searchTerm);
            
            const matchesStatus = filterStatus === 'all' || 
                                (filterStatus === 'paid' && this.isFeesPaid(student)) ||
                                (filterStatus === 'pending' && !this.isFeesPaid(student));
            
            return matchesSearch && matchesStatus;
        });

        if (filteredStudents.length === 0) {
            studentsList.innerHTML = '<p class="no-data">No students found</p>';
            return;
        }

        studentsList.innerHTML = filteredStudents.map(student => {
            const remainingFees = student.totalFees - student.paidFees;
            const progressPercentage = (student.paidFees / student.totalFees) * 100;
            
            return `
                <div class="student-card">
                    <div class="student-header">
                        <h3 class="student-name">${student.name}</h3>
                    </div>
                    <div class="student-info">
                        <div class="info-item">
                            <span class="info-label">Fees Paid</span>
                            <span class="info-value">₹${student.paidFees.toLocaleString()}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Total Fees</span>
                            <span class="info-value">₹${student.totalFees.toLocaleString()}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Remaining</span>
                            <span class="info-value">₹${remainingFees.toLocaleString()}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Progress</span>
                            <div class="fee-progress-mini">
                                <div class="progress-bar-mini">
                                    <div class="progress-fill-mini" style="width: ${progressPercentage}%"></div>
                                </div>
                                <span class="progress-text">${progressPercentage.toFixed(1)}%</span>
                            </div>
                        </div>
                    </div>
                    <div class="student-actions">
                        <button class="btn btn-info btn-small" onclick="app.viewStudentDetails('${student.id}')">
                            <i class="fas fa-eye"></i>
                            View Details
                        </button>
                        <button class="btn btn-warning btn-small" onclick="app.editStudent('${student.id}')">
                            <i class="fas fa-edit"></i>
                            Edit
                        </button>
                        <button class="btn btn-danger btn-small" onclick="app.deleteStudent('${student.id}')">
                            <i class="fas fa-trash"></i>
                            Delete
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    viewStudentDetails(studentId) {
        const student = this.students.find(s => s.id === studentId);
        if (!student) return;

        this.currentStudentId = studentId;
        const modalBody = document.getElementById('modal-body');
        if (!modalBody) return;
        
        // Force a small delay to ensure data is updated
        setTimeout(() => {
            const updatedStudent = this.students.find(s => s.id === studentId);
            if (!updatedStudent) return;
            
            // Test month calculation for debugging
            this.testMonthCalculation(updatedStudent);
            
            const isPaid = this.isFeesPaid(updatedStudent);
            const remainingFees = updatedStudent.totalFees - updatedStudent.paidFees;
            const progressPercentage = (updatedStudent.paidFees / updatedStudent.totalFees) * 100;
            const nextDueDate = this.calculateNextDueDate(updatedStudent);
            const pendingInfo = this.getPendingMonthsInfo(updatedStudent);

            modalBody.innerHTML = `
            <div class="student-detail-grid">
                <div class="detail-section">
                    <h3><i class="fas fa-user"></i> Personal Information</h3>
                    <div class="student-info">
                        <div class="info-item">
                            <span class="info-label">Full Name</span>
                            <span class="info-value">${updatedStudent.name}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Age</span>
                            <span class="info-value">${updatedStudent.age} years</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Date of Birth</span>
                            <span class="info-value">${this.formatDate(updatedStudent.dob)}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Email</span>
                            <span class="info-value">${updatedStudent.email}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Phone</span>
                            <span class="info-value">${updatedStudent.phone}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Address</span>
                            <span class="info-value">${updatedStudent.address}</span>
                        </div>
                    </div>
                </div>

                <div class="detail-section">
                    <h3><i class="fas fa-calendar"></i> Academic Information</h3>
                    <div class="student-info">
                        <div class="info-item">
                            <span class="info-label">Joining Date</span>
                            <span class="info-value">${this.formatDate(updatedStudent.joining)}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Semester Duration</span>
                            <span class="info-value">${updatedStudent.semester} months</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Total Semester Fees</span>
                            <span class="info-value">₹${updatedStudent.totalFees.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                <div class="fee-status-section">
                    <h3><i class="fas fa-rupee-sign"></i> Fee Status</h3>
                    <div class="student-info">
                        <div class="info-item">
                            <span class="info-label">Paid Amount</span>
                            <span class="info-value">₹${student.paidFees.toLocaleString()}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Remaining Amount</span>
                            <span class="info-value">₹${remainingFees.toLocaleString()}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Payment Status</span>
                            <span class="info-value">
                                <span class="student-status ${isPaid ? 'status-paid' : 'status-pending'}">
                                    ${isPaid ? 'Fees Paid' : 'Fees Pending'}
                                </span>
                            </span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Next Due Date</span>
                            <span class="info-value">${nextDueDate}</span>
                        </div>
                    </div>
                    
                    <div class="fee-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progressPercentage}%"></div>
                        </div>
                        <p style="text-align: center; margin-top: 5px; font-size: 0.9rem; color: #666;">
                            ${progressPercentage.toFixed(1)}% Complete
                        </p>
                    </div>

                    ${!isPaid ? `
                        <div class="fee-actions">
                            <input type="number" class="fee-input" id="fee-amount" placeholder="Enter amount to pay" min="1" max="${remainingFees}">
                            <button class="btn btn-primary btn-small" onclick="app.payFees()">
                                <i class="fas fa-credit-card"></i>
                                Pay Fees
                            </button>
                        </div>
                    ` : ''}

                    ${pendingInfo.totalPendingMonths > 0 ? `
                        <div class="pending-summary">
                            <h4><i class="fas fa-exclamation-triangle"></i> Pending Summary</h4>
                            <div class="pending-details">
                                <div class="pending-detail-item">
                                    <span class="pending-detail-label">Pending Months</span>
                                    <span class="pending-detail-value">${pendingInfo.totalPendingMonths}</span>
                                </div>
                                <div class="pending-detail-item">
                                    <span class="pending-detail-label">Overdue Months</span>
                                    <span class="pending-detail-value">${pendingInfo.totalOverdueMonths}</span>
                                </div>
                                <div class="pending-detail-item">
                                    <span class="pending-detail-label">Total Pending</span>
                                    <span class="pending-detail-value">₹${pendingInfo.totalPendingAmount.toLocaleString()}</span>
                                </div>
                                <div class="pending-detail-item">
                                    <span class="pending-detail-label">Overdue Amount</span>
                                    <span class="pending-detail-value">₹${pendingInfo.totalOverdueAmount.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    ` : ''}
                </div>

                <div class="monthly-fees-section">
                    <h3><i class="fas fa-calendar-alt"></i> Monthly Fee Breakdown</h3>
                    ${pendingInfo.monthlyFees.map(month => `
                        <div class="monthly-fee-item ${month.status}">
                            <div class="monthly-fee-info">
                                <span class="monthly-fee-month">${month.month}</span>
                                <span class="monthly-fee-amount">Required: ₹${month.amount.toLocaleString()}</span>
                                <span class="monthly-fee-amount">Paid: ₹${month.paid.toLocaleString()}</span>
                                ${month.carryForward > 0 ? `<span class='monthly-fee-amount' style='color:#388e3c;'>Advance: ₹${month.carryForward.toLocaleString()}</span>` : ''}
                            </div>
                            <span class="monthly-fee-status ${month.status}">
                                ${month.status === 'paid' ? (month.carryForward > 0 ? 'Paid (Advance)' : 'Paid') : month.status === 'partial' ? 'Partial' : month.status === 'overdue' ? 'Overdue' : 'Pending'}
                            </span>
                        </div>
                    `).join('')}
                </div>

                ${updatedStudent.feeHistory.length > 0 ? `
                    <div class="detail-section">
                        <h3><i class="fas fa-history"></i> Payment History</h3>
                        <div style="max-height: 200px; overflow-y: auto;">
                            ${updatedStudent.feeHistory.map(payment => `
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid #eee;">
                                    <div>
                                        <strong>₹${payment.amount.toLocaleString()}</strong>
                                        <br>
                                        <small style="color: #666;">${this.formatDate(payment.date)}</small>
                                    </div>
                                    <button class="btn btn-danger btn-small" onclick="app.deletePayment('${updatedStudent.id}', '${payment.id}')">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;

            const modal = document.getElementById('student-modal');
            if (modal) {
                modal.classList.add('show');
            }
        }, 50); // Small delay to ensure data is updated
    }

    payFees() {
        const amountInput = document.getElementById('fee-amount');
        const amount = parseFloat(amountInput.value);
        
        if (!amount || amount <= 0) {
            this.showToast('Please enter a valid amount', 'error');
            return;
        }

        const student = this.students.find(s => s.id === this.currentStudentId);
        if (!student) return;

        const remainingFees = student.totalFees - student.paidFees;
        if (amount > remainingFees) {
            this.showToast(`Amount cannot exceed remaining fees (₹${remainingFees.toLocaleString()})`, 'error');
            return;
        }

        // Add payment to history
        const payment = {
            id: Date.now().toString(),
            amount: amount,
            date: new Date().toISOString()
        };

        student.feeHistory.push(payment);
        student.paidFees += amount;

        this.saveStudents();
        
        this.showToast(`Payment of ₹${amount.toLocaleString()} recorded successfully!`, 'success');
        
        // Clear the input field
        amountInput.value = '';
        
        // Update dashboard and lists first
        this.updateDashboard();
        this.renderStudentsList();
        this.renderRecentStudents();
        
        // Force refresh the modal content
        this.refreshModalContent();
    }

    // Helper function to refresh modal content
    refreshModalContent() {
        if (this.currentStudentId) {
            // Force a complete refresh of the modal
            setTimeout(() => {
                this.viewStudentDetails(this.currentStudentId);
            }, 150);
        }
    }

    // Utility to add months to a date without mutation
    addMonths(date, count) {
        const d = new Date(date);
        const originalDay = d.getDate();
        d.setMonth(d.getMonth() + count);
        
        // Handle edge case where the original day doesn't exist in the new month
        // (e.g., Jan 31 + 1 month = Feb 31, which becomes Mar 3)
        // We want to keep it in the same month if possible
        if (d.getDate() !== originalDay) {
            d.setDate(0); // Go to last day of previous month
        }
        
        return d;
    }

    /**
     * Returns an array of months for the student's semester, with fee status for each month.
     * Each month object: { month, date, amount, paid, carryForward, status }
     */
    getMonthlyFeeBreakdown(student) {
        const joiningDate = new Date(student.joining);
        
        // Validate joining date
        if (isNaN(joiningDate.getTime())) {
            console.error('Invalid joining date:', student.joining);
            return [];
        }
        
        const monthlyFee = student.totalFees / student.semester;
        
        // Validate semester duration
        if (student.semester <= 0) {
            console.error('Invalid semester duration:', student.semester);
            return [];
        }
        
        const months = [];
        
        // Sort payments by date
        const payments = [...student.feeHistory].sort((a, b) => new Date(a.date) - new Date(b.date));
        let paymentIndex = 0;
        let paymentCarry = 0; // carry forward extra payment
        
        // Generate months from joining date for the semester duration
        for (let i = 0; i < student.semester; i++) {
            const monthDate = this.addMonths(joiningDate, i);
            const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
            const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
            
            // Format month name with year for clarity
            const monthName = monthDate.toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'long'
            });
            
            // Add semester month number for clarity
            const semesterMonthNumber = i + 1;
            
            let paidThisMonth = 0;
            let toAllocate = paymentCarry;
            
            // Allocate payments for this month
            while (paymentIndex < payments.length) {
                const payment = payments[paymentIndex];
                const paymentDate = new Date(payment.date);
                
                if (paymentDate >= monthStart && paymentDate <= monthEnd) {
                    toAllocate += payment.amount;
                    paymentIndex++;
                } else if (paymentDate < monthStart) {
                    paymentIndex++;
                } else {
                    break;
                }
            }
            
            paidThisMonth = Math.min(toAllocate, monthlyFee);
            paymentCarry = toAllocate - paidThisMonth;
            
            // Determine status
            let status = 'pending';
            if (paidThisMonth >= monthlyFee) {
                status = 'paid';
            } else if (paidThisMonth > 0) {
                status = 'partial';
            }
            
            // Check if month is overdue (current date is past this month)
            const currentDate = new Date();
            if (status !== 'paid' && currentDate > monthEnd) {
                status = 'overdue';
            }
            
            // Format date range for this month
            const monthStartFormatted = monthStart.toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short'
            });
            const monthEndFormatted = monthEnd.toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
            
            months.push({
                month: `${monthName} (Month ${semesterMonthNumber}) - ${monthStartFormatted} to ${monthEndFormatted}`,
                date: monthDate,
                amount: monthlyFee,
                paid: paidThisMonth,
                carryForward: paymentCarry,
                status: status
            });
        }
        
        return months;
    }

    // Helper function to test month calculation
    testMonthCalculation(student) {
        console.log('=== Testing Month Calculation ===');
        console.log('Student:', student.name);
        console.log('Joining Date:', student.joining);
        console.log('Semester Duration:', student.semester, 'months');
        
        const joiningDate = new Date(student.joining);
        console.log('Parsed joining date:', joiningDate);
        
        for (let i = 0; i < student.semester; i++) {
            const monthDate = this.addMonths(joiningDate, i);
            const monthName = monthDate.toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'long'
            });
            console.log(`Month ${i + 1}: ${monthName} (${monthDate.toISOString().split('T')[0]})`);
        }
        console.log('=== End Test ===');
    }

    /**
     * Returns a summary of pending/overdue months and amounts from the monthly breakdown.
     * { totalPendingMonths, totalOverdueMonths, totalPendingAmount, totalOverdueAmount }
     */
    getPendingSummary(monthlyBreakdown) {
        const pendingMonths = monthlyBreakdown.filter(m => m.status !== 'paid');
        const overdueMonths = monthlyBreakdown.filter(m => m.status === 'overdue');
        const totalPendingAmount = pendingMonths.reduce((sum, m) => sum + (m.amount - m.paid), 0);
        const totalOverdueAmount = overdueMonths.reduce((sum, m) => sum + (m.amount - m.paid), 0);
        return {
            totalPendingMonths: pendingMonths.length,
            totalOverdueMonths: overdueMonths.length,
            totalPendingAmount,
            totalOverdueAmount
        };
    }

    // Update getPendingMonthsInfo to use the new helpers
    getPendingMonthsInfo(student) {
        const monthlyFees = this.getMonthlyFeeBreakdown(student);
        const summary = this.getPendingSummary(monthlyFees);
        return {
            ...summary,
            monthlyFees
        };
    }

    isMonthPaid(student, monthDate) {
        const monthlyFees = this.getMonthlyFeeBreakdown(student);
        const month = monthlyFees.find(m => m.month === monthDate.toLocaleDateString('en-IN', { month: 'long' }));
        return month && month.status === 'paid';
    }

    deletePayment(studentId, paymentId) {
        const student = this.students.find(s => s.id === studentId);
        if (!student) return;

        const payment = student.feeHistory.find(p => p.id === paymentId);
        if (!payment) return;

        // Remove payment from history and update paid amount
        student.feeHistory = student.feeHistory.filter(p => p.id !== paymentId);
        student.paidFees -= payment.amount;

        this.saveStudents();
        
        this.showToast('Payment deleted successfully!', 'success');
        
        // Update dashboard and lists first
        this.updateDashboard();
        this.renderStudentsList();
        this.renderRecentStudents();
        
        // Force refresh the modal content
        this.refreshModalContent();
    }

    deleteStudent(studentId) {
        if (!confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
            return;
        }

        this.students = this.students.filter(s => s.id !== studentId);
        this.saveStudents();
        
        this.showToast('Student deleted successfully!', 'success');
        
        this.updateDashboard();
        this.renderStudentsList();
        this.renderRecentStudents();
    }

    filterStudents() {
        this.renderStudentsList();
    }

    updateDashboard() {
        const totalStudents = this.students.length;
        const paidStudents = this.students.filter(s => this.isFeesPaid(s)).length;
        const pendingStudents = totalStudents - paidStudents;
        const totalRevenue = this.students.reduce((sum, s) => sum + s.paidFees, 0);

        const totalStudentsEl = document.getElementById('total-students');
        const paidStudentsEl = document.getElementById('paid-students');
        const pendingStudentsEl = document.getElementById('pending-students');
        const totalRevenueEl = document.getElementById('total-revenue');

        if (totalStudentsEl) totalStudentsEl.textContent = totalStudents;
        if (paidStudentsEl) paidStudentsEl.textContent = paidStudents;
        if (pendingStudentsEl) pendingStudentsEl.textContent = pendingStudents;
        if (totalRevenueEl) totalRevenueEl.textContent = `₹${totalRevenue.toLocaleString()}`;
    }

    renderRecentStudents() {
        const recentList = document.getElementById('recent-students-list');
        if (!recentList) return;

        const recentStudents = this.students
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5);

        if (recentStudents.length === 0) {
            recentList.innerHTML = '<p class="no-data">No students added yet</p>';
            return;
        }

        recentList.innerHTML = recentStudents.map(student => {
            const isPaid = this.isFeesPaid(student);
            const statusClass = isPaid ? 'status-paid' : 'status-pending';
            const statusText = isPaid ? 'Paid' : 'Pending';

            return `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px; border-bottom: 1px solid #eee; border-radius: 8px; margin-bottom: 10px; background: white;">
                    <div>
                        <strong>${student.name}</strong>
                        <br>
                        <small style="color: #666;">${student.email}</small>
                    </div>
                    <div style="text-align: right;">
                        <span class="student-status ${statusClass}" style="font-size: 0.8rem;">${statusText}</span>
                        <br>
                        <small style="color: #666;">₹${student.paidFees.toLocaleString()}/${student.totalFees.toLocaleString()}</small>
                    </div>
                </div>
            `;
        }).join('');
    }

    isFeesPaid(student) {
        return student.paidFees >= student.totalFees;
    }

    calculateNextDueDate(student) {
        if (this.isFeesPaid(student)) {
            return 'All fees paid';
        }

        const joiningDate = new Date(student.joining);
        const monthsSinceJoining = this.getMonthsDifference(joiningDate, new Date());
        const monthsPerPayment = student.semester / 6; // Assuming 6 payments per semester
        
        if (monthsSinceJoining >= student.semester) {
            return 'Overdue';
        }

        const nextPaymentMonth = Math.ceil(monthsSinceJoining / monthsPerPayment) * monthsPerPayment;
        const nextDueDate = new Date(joiningDate);
        nextDueDate.setMonth(joiningDate.getMonth() + nextPaymentMonth);
        
        return this.formatDate(nextDueDate.toISOString().split('T')[0]);
    }

    getMonthsDifference(date1, date2) {
        return (date2.getFullYear() - date1.getFullYear()) * 12 + 
               (date2.getMonth() - date1.getMonth());
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    closeModal() {
        const modal = document.getElementById('student-modal');
        if (modal) {
            modal.classList.remove('show');
        }
        this.currentStudentId = null;
    }

    editStudent(studentId) {
        const student = this.students.find(s => s.id === studentId);
        if (!student) return;

        // Populate edit form
        const editForm = document.getElementById('edit-student-form');
        if (!editForm) return;

        document.getElementById('edit-student-id').value = student.id;
        document.getElementById('edit-student-name').value = student.name;
        document.getElementById('edit-student-age').value = student.age;
        document.getElementById('edit-student-email').value = student.email;
        document.getElementById('edit-student-phone').value = student.phone;
        document.getElementById('edit-student-dob').value = student.dob;
        document.getElementById('edit-student-joining').value = student.joining;
        document.getElementById('edit-student-semester').value = student.semester;
        document.getElementById('edit-student-fees').value = student.totalFees;
        document.getElementById('edit-student-address').value = student.address;

        // Show edit modal
        const editModal = document.getElementById('edit-student-modal');
        if (editModal) {
            editModal.classList.add('show');
        }
    }

    updateStudent() {
        const form = document.getElementById('edit-student-form');
        const formData = new FormData(form);
        
        const studentId = formData.get('id');
        const student = this.students.find(s => s.id === studentId);
        if (!student) return;

        // Check if email is changed and if it already exists
        const newEmail = formData.get('email');
        if (newEmail !== student.email && this.students.some(s => s.email === newEmail && s.id !== studentId)) {
            this.showToast('Student with this email already exists', 'error');
            return;
        }

        // Update student data
        student.name = formData.get('name');
        student.age = parseInt(formData.get('age'));
        student.email = newEmail;
        student.phone = formData.get('phone');
        student.address = formData.get('address');
        student.dob = formData.get('dob');
        student.joining = formData.get('joining');
        student.semester = parseInt(formData.get('semester'));
        student.totalFees = parseFloat(formData.get('fees'));

        this.saveStudents();
        
        this.showToast('Student updated successfully!', 'success');
        this.closeEditModal();
        
        // Update all views
        this.updateDashboard();
        this.renderStudentsList();
        this.renderRecentStudents();
    }

    closeEditModal() {
        const editModal = document.getElementById('edit-student-modal');
        if (editModal) {
            editModal.classList.remove('show');
        }
        const editForm = document.getElementById('edit-student-form');
        if (editForm) {
            editForm.reset();
        }
    }

    showToast(message, type = 'success') {
        showToast(message, type);
    }

    saveStudents() {
        localStorage.setItem('swati_students', JSON.stringify(this.students));
    }
}

// Initialize the application only if not on add-student page
let app;
if (currentPage !== 'add') {
    app = new StudentFeeManager();
}
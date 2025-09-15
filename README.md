## 📚 SWATI — Student Fee Management (LocalStorage)

<div align="center">
  <img src="https://readme-typing-svg.herokuapp.com?font=Montserrat&weight=600&size=32&pause=1000&color=38BDF8&center=true&vCenter=true&width=900&height=70&lines=SWATI+Student+Fee+Management;HTML+%7C+CSS+%7C+JavaScript+%7C+SheetJS;LocalStorage+Powered+%7C+No+Backend+Required" alt="Typing SVG" />
  
  <div style="margin-top: 6px;">
    <img src="https://img.shields.io/badge/Status-Production_Ready-2ea44f?style=for-the-badge" alt="Status" />
    <img src="https://img.shields.io/badge/Version-1.0.0-blue?style=for-the-badge" alt="Version" />
    <img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" alt="License" />
  </div>

  <div style="margin-top: 10px;">
    <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5" />
    <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS3" />
    <img src="https://img.shields.io/badge/JavaScript-323330?style=for-the-badge&logo=javascript&logoColor=F7DF1E" alt="JavaScript" />
    <img src="https://img.shields.io/badge/SheetJS%20(XLSX)-1f9d55?style=for-the-badge" alt="SheetJS" />
  </div>
</div>

<p align="center">
  <img src="./images/logo.png" alt="SWATI" width="110" />
  <br />
  <small>Single‑page front‑end app • LocalStorage persistence • Excel import/export</small>
</p>

---

## 🚀 Overview

**SWATI** is a production‑ready, client‑side Student Fee Management app. Add students, record payments, analyze monthly status, and export/import data via Excel — all in the browser using LocalStorage and SheetJS. No backend required.

- 🔹 Add students with personal, academic, and fee details
- 🔹 Track payments with history and progress bars
- 🔹 Analyze monthly status: paid, partial, pending, overdue
- 🔹 Export/Import data to/from `.xlsx` for backups and migration

---

## 🛠️ Tech Stack

<div align="center">

| Frontend | Storage | Utilities |
|----------|---------|-----------|
| HTML5, CSS3, JavaScript | Browser LocalStorage | SheetJS (XLSX) |

</div>

---

## 📂 Project Structure

```
📦 SWATI-Fee-Management-App/
├── index.html              # Dashboard: KPIs, recent students, modals
├── add-student.html        # Form to add a new student
├── view-students.html      # List, search, filter, details, edit
├── student-details.html    # Shell page; details rendered via modal/UI
├── script.js               # App logic, LocalStorage CRUD, Excel import/export
├── style.css               # Modern responsive UI styles
└── images/
    └── logo.png            # Brand logo used in header/sidebar
```

---

## 🔗 Pages & Flow

- **Dashboard (`index.html`)**
  - Shows total students, paid/pending counts, total revenue
  - Recent students list with status chips
  - Excel controls: Export to Excel, Import from Excel
  - Student Details modal + Edit modal (invoked from lists)

- **Add Student (`add-student.html`)**
  - Validated form; prevents duplicate email
  - Saves to LocalStorage then redirects to `view-students.html`

- **View Students (`view-students.html`)**
  - Search by name/email/phone, filter by status (Paid/Pending)
  - View details, pay fees, edit, or delete

```mermaid
flowchart LR
  A[Add Student] --> B((Save to LocalStorage))
  B --> C[Redirect to View Students]
  C -- Manage --> D[Edit / Pay / Delete]
  A -. Import Excel .-> B
  D -. Export Excel .-> E[(Download .xlsx)]
```

---

## 🧠 How It Works

1. Data is persisted in `localStorage` under the key `swati_students`.
2. Each student stores personal info, academic info, total/paid fees, and `feeHistory`.
3. Monthly fee breakdown is computed from `joining` date, `semester` duration, and payments, labeling months as `paid`, `partial`, `pending`, or `overdue`.
4. Export/Import uses SheetJS:
   - Export generates a workbook with sheets: `Students`, `PaymentHistory`, and `Summary`.
   - Import reads `Students` and merges unique entries by email.

```mermaid
sequenceDiagram
  autonumber
  participant UI as Browser UI
  participant LS as LocalStorage
  participant XLSX as SheetJS

  UI->>UI: Create/Update/Delete student
  UI->>LS: Persist array swati_students
  UI->>XLSX: Export -> build workbook (3 sheets)
  UI->>XLSX: Import -> parse Students sheet
  XLSX-->>UI: JSON rows
  UI->>LS: Merge by unique email
```

---

## 🧩 Data Model (LocalStorage)

```json
{
  "id": "1705409823456",
  "name": "Alice Johnson",
  "age": 21,
  "email": "alice@example.com",
  "phone": "9876543210",
  "address": "New Delhi, IN",
  "dob": "2004-05-10",
  "joining": "2025-01-01",
  "semester": 6,
  "totalFees": 60000,
  "paidFees": 10000,
  "feeHistory": [
    { "id": "1705410123456", "amount": 10000, "date": "2025-02-01T10:20:30.000Z" }
  ],
  "createdAt": "2025-01-01T08:00:00.000Z"
}
```

### ER Perspective (Student ↔ Payment)

- Conceptually, `feeHistory` is an embedded array of `Payment` records inside each `Student`.

```mermaid
erDiagram
  STUDENT ||--o{ PAYMENT : has
  STUDENT {
    string id PK
    string name
    number age
    string email UK
    string phone
    string address
    date dob
    date joining
    number semester
    number totalFees
    number paidFees
    date createdAt
  }
  PAYMENT {
    string id PK
    number amount
    date date
  }
```

Collection key: `localStorage['swati_students'] = Student[]`.

---

## ✅ Features

- **Dashboard KPIs**: Total Students, Fees Paid, Fees Pending, Total Revenue
- **Recent Students** with quick status preview
- **Student Details modal** with personal, academic, and fee summary
- **Payment History** with add and delete actions
- **Monthly Breakdown** with paid/partial/pending/overdue tags and progress
- **Search & Filter** in the students list
- **Edit/Delete** student records
- **Excel Export/Import/Backup** via SheetJS

---

## ⚙️ Installation & Local Setup

No build step needed.

```bash
# Option A: Open directly
Open index.html in your browser

# Option B: Serve locally (recommended for navigation)
# Using Node (http-server)
px http-server . -p 8080 --cors
# then open http://localhost:8080

# Or using Python
python -m http.server 8080
# then open http://localhost:8080
```

### Usage Workflow

1) Open `add-student.html` and add a student.
2) You’ll be redirected to `view-students.html` to manage records.
3) Use the Dashboard (`index.html`) for stats and Excel export/import.

Data lives entirely in your browser. Use Export regularly to create backups.

---

## 📤 Excel Export/Import

- Export creates `swati_students_data.xlsx` with:
  - `Students`: flattened students data
  - `PaymentHistory`: one row per payment
  - `Summary`: totals and aggregates
- Import merges by unique email. Unknown columns are ignored.

Tip: Browsers cannot overwrite existing files directly; each export downloads a new file.

---

## 🔒 Notes & Limitations

- LocalStorage is browser‑scoped; clearing site data removes records. Keep backups.
- No server‑side validation or authentication. For production multi‑user use, pair with a backend and database.
- Overpayments are prevented; partial months are tracked with carry‑forward.

---

## 🛣️ Roadmap

- Cloud backend (API + DB) and auth roles
- Pagination and advanced filters in list view
- Printable receipts and shareable payment links
- Cloud export (Google Drive/OneDrive) and scheduled backups

---

## 👨‍💻 Developer

<div align="center">
  <img src="https://readme-typing-svg.herokuapp.com?font=Montserrat&weight=500&size=24&pause=1000&color=38BDF8&center=true&vCenter=true&width=600&height=50&lines=Lucky+Longre;Full-Stack+Developer;Problem+Solver" alt="Developer" />
  
  <p><em>Computer Science Student & Aspiring Software Developer</em></p>
  
  <div style="margin: 16px 0;">
    <a href="https://shadowx-frontend.onrender.com" target="_blank">
      <img src="https://img.shields.io/badge/🌐_Portfolio-Visit_Website-0A66C2?style=for-the-badge&logo=vercel&logoColor=white" alt="Portfolio" />
    </a>
    <a href="mailto:officialluckylongre@gmail.com">
      <img src="https://img.shields.io/badge/📧_Email-Contact_Me-D14836?style=for-the-badge&logo=gmail&logoColor=white" alt="Email" />
    </a>
    <a href="https://www.linkedin.com/in/lucky-longre/" target="_blank">
      <img src="https://img.shields.io/badge/💼_LinkedIn-Connect-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn" />
    </a>
  </div>
  
  <p>
    <img src="https://img.shields.io/badge/Course-Computer_Science-brightgreen?style=flat-square" alt="Course" />
    <img src="https://img.shields.io/badge/Specialization-Full_Stack_Development-blue?style=flat-square" alt="Specialization" />
    <img src="https://img.shields.io/badge/Location-New_Delhi,_India-orange?style=flat-square" alt="Location" />
  </p>
</div>

---

## 📄 License

MIT



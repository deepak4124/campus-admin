---

title: "ADR-0001: Student Management, Attendance, and Fee Receipt Architecture"
date: "2026-06-02"
status: "Proposed"
deciders:

* "Jasmine Jose"
  context: "Define the architecture, workflows, and database structure for managing students, attendance, faculty attendance, fee collection, and receipt generation in the playschool administration portal."

---

# ADR-0001: Student Management, Attendance, and Fee Receipt Architecture

## Status

Proposed

## Context

The playschool administration portal requires functionality to manage student records, admissions, attendance tracking, faculty management, faculty attendance, fee collection, and receipt generation.

The system must support:

* Maintaining a centralized master database of students and faculty.
* Recording daily attendance for students and faculty.
* Generating attendance reports for administrative use.
* Generating student-specific attendance reports that can be sent to parents through email or WhatsApp.
* Recording fee payments made by parents.
* Generating receipts automatically from recorded payment information.
* Sending receipts digitally through email or WhatsApp.
* Supporting future administrative modules without requiring major redesigns.

The solution should minimize manual data entry, ensure data consistency across modules, and provide a scalable foundation for future enhancements such as fee tracking, class management, parent portals, and reporting dashboards.

## Decision

A centralized database-driven architecture will be adopted.

Student and faculty information will be maintained in dedicated master tables and referenced by all operational modules.

### Student Management

A Student Master table will serve as the primary source of truth for student information including:

* Admission number
* Student details
* Parent details
* Class assignment
* Enrollment status

An Admissions table will store admission-specific information separately from student profile information.

### Fee Collection and Receipt Generation

Fee collection will follow a Student Database + Fee Entry workflow.

Workflow:

1. Administrator selects a student from the student database.
2. Student details are automatically populated.
3. Administrator records:

   * Amount paid
   * Payment method
   * Payment date
   * Payment time
   * Optional remarks
4. System automatically generates:

   * Receipt number
   * Receipt record
   * PDF receipt
5. Receipt can be:

   * Downloaded
   * Emailed to the parent
   * Sent via WhatsApp

Receipt information shall include:

* School details
* Receipt number
* Receipt date and time
* Payment date and time
* Student information
* Parent information
* Payment line items
* Total amount paid
* Payment method
* Transaction reference (when applicable)
* Amount in words
* Footer declaration

Receipt items will be stored separately from the receipt header to support future expansion of fee categories.

### Student Attendance

Attendance will be recorded daily.

Workflow:

1. Administrator selects attendance date.
2. Student list is displayed.
3. Students are marked Present or Absent.
4. Attendance records are stored individually for each student.

The attendance system will initially support only:

* Present
* Absent

Additional statuses such as Half-Day, Leave, or Late Arrival are intentionally excluded to keep the workflow simple and aligned with playschool requirements.

### Faculty Attendance

Faculty attendance will follow the same workflow as student attendance.

Faculty records will be maintained in a dedicated Faculty Master table.

Attendance records will be stored separately from faculty profile information.

### Attendance Reporting

The system will support:

#### Monthly Student Attendance Report

Generated for:

* Individual students
* Classes
* Entire school

Report metrics:

* Total school days
* Days present
* Days absent
* Attendance percentage

#### Parent Attendance Report

A student-specific report shall be generated and sent via email or WhatsApp.

The report will contain:

* Student name
* Admission number
* Class
* Reporting period
* Total school days
* Days present
* Days absent
* Attendance percentage
* Exact dates on which the student was absent

This report is intended for parent communication and attendance monitoring.

### Database Design

The following database tables will be implemented.

#### classes

Stores class definitions.

Columns:

* class_id (PK)
* class_name
* academic_year
* class_teacher_id
* created_at
* updated_at

#### students

Stores student profile information.

Columns:

* student_id (PK)
* admission_no (Unique)
* first_name
* last_name
* dob
* gender
* class_id (FK)
* parent_name
* parent_phone
* parent_email
* address
* admission_date
* status
* created_at
* updated_at

#### admissions

Stores admission-specific records.

Columns:

* admission_id (PK)
* student_id (FK)
* admission_date
* admission_fee
* joining_class
* notes
* created_at

#### student_attendance

Stores daily student attendance.

Columns:

* attendance_id (PK)
* student_id (FK)
* attendance_date
* status
* remarks
* marked_by
* marked_at

#### faculty

Stores faculty profile information.

Columns:

* faculty_id (PK)
* employee_code (Unique)
* first_name
* last_name
* designation
* phone
* email
* joining_date
* status
* created_at
* updated_at

#### faculty_attendance

Stores daily faculty attendance.

Columns:

* attendance_id (PK)
* faculty_id (FK)
* attendance_date
* status
* remarks
* marked_by
* marked_at

#### receipts

Stores receipt header information.

Columns:

* receipt_id (PK)
* receipt_number (Unique)
* student_id (FK)
* payment_date
* payment_method
* total_amount
* notes
* created_at

#### receipt_items

Stores receipt line items.

Columns:

* item_id (PK)
* receipt_id (FK)
* fee_type
* amount

### Entity Relationships

Classes (1) → (N) Students

Students (1) → (1) Admissions

Students (1) → (N) Student Attendance

Students (1) → (N) Receipts

Receipts (1) → (N) Receipt Items

Faculty (1) → (N) Faculty Attendance

## Alternatives Considered

### Option A: Manual Receipt Generation Without Student Database

Administrators manually enter all student and payment details for each transaction.

Not chosen because:

* High risk of data entry errors.
* Duplicate information entry.
* Difficult to scale.
* No centralized student record management.

### Option B: Fully Automated Payment Gateway Integration

Payments are recorded automatically through a payment gateway and receipts are generated via webhooks.

Not chosen because:

* Increased implementation complexity.
* Does not support cash-based fee collection workflows.
* Not required for the initial version of the playschool administration portal.

### Option C: Single Combined Attendance Table for Students and Faculty

Store both student and faculty attendance in one table using a person type field.

Not chosen because:

* Reduces schema clarity.
* Introduces mixed entity relationships.
* Separate attendance tables provide better maintainability and reporting simplicity.

## Consequences

### Positive Outcomes

* Centralized source of truth for student and faculty records.
* Reduced manual data entry.
* Consistent data across attendance and fee modules.
* Simplified parent communication workflows.
* Scalable architecture for future modules.
* Support for digital receipt distribution.
* Efficient attendance reporting and auditing.

### Negative Outcomes or Risks

* Requires initial setup and maintenance of master data.
* Attendance records may grow significantly over time.
* Receipt and report generation requires PDF generation infrastructure.
* WhatsApp delivery may require third-party integration and associated costs.

## Implementation Notes

* Attendance should default students and faculty to Present to reduce administrative effort.
* Receipt numbers should be generated automatically and remain immutable.
* PDF generation service should be reusable across receipts and attendance reports.
* Parent contact information should be validated during student onboarding.
* Attendance reports should support PDF export.
* Email and WhatsApp delivery should be implemented as reusable notification services.
* Future enhancements may include:

  * Parent portal
  * Online fee payment
  * Fee due tracking
  * Attendance dashboards
  * Student promotion and class transfer workflows

## References

* Playschool Administration Portal Requirements
* Attendance Management Module Design
* Fee Collection and Receipt Generation Module Design
* Student and Faculty Master Data Model

---
title: "ADR-0001: Database Design"
date: "2026-05-30"
status: "Proposed"
deciders:
  - "Deepak"
context: "Normalized schema for faculty, students, admissions, and attendance."
---

# ADR-0001: Database Design

## Purpose
Define a normalized relational schema for faculty, students, admissions, and attendance tracking.

## Scope
- Faculty
- Students
- Admission forms
- Student attendance
- Faculty attendance

## Goals
- Preserve normalization to reduce duplication.
- Support reliable attendance reporting.
- Allow admissions to exist independently of students.
- Keep schema simple and extensible for future features.

## Non-Goals
- Fee management, timetable, or grading logic.
- Historical changes or audit trails beyond timestamps.

## ERD
```mermaid
erDiagram
  FACULTY ||--o{ FACULTY_ATTENDANCE : records
  STUDENT ||--o{ STUDENT_ATTENDANCE : records
  ADMISSION_FORM ||--o{ STUDENT : results_in

  FACULTY {
    uuid id PK
    text first_name
    text last_name
    text email
    text phone
    text department
    date date_of_joining
    text status
    timestamptz created_at
    timestamptz updated_at
  }

  STUDENT {
    uuid id PK
    uuid admission_form_id FK
    text first_name
    text last_name
    date dob
    text email
    text phone
    text grade_level
    text section
    text status
    timestamptz created_at
    timestamptz updated_at
  }

  ADMISSION_FORM {
    uuid id PK
    text applicant_first_name
    text applicant_last_name
    date applicant_dob
    text guardian_name
    text guardian_email
    text guardian_phone
    text address
    text desired_grade_level
    text status
    timestamptz submitted_at
  }

  STUDENT_ATTENDANCE {
    uuid id PK
    uuid student_id FK
    date attendance_date
    text status
    text reason
    timestamptz created_at
  }

  FACULTY_ATTENDANCE {
    uuid id PK
    uuid faculty_id FK
    date attendance_date
    text status
    text reason
    timestamptz created_at
  }
}
```

## Entity Details
### Faculty
Stores core identity and employment details.

### Student
Stores core identity and academic placement. `admission_form_id` is optional until acceptance.

### Admission Form
Represents incoming applicants. Exists before a student record is created.

### Student Attendance
One row per student per date.

### Faculty Attendance
One row per faculty member per date.

## Normalization Notes
- Admission data is separated from students to avoid premature student records.
- Attendance tables avoid redundant information by referencing the person and date.
- `status` fields are modeled as text for flexibility; can be migrated to enums later.

## Constraints
- `student_attendance`: UNIQUE (`student_id`, `attendance_date`)
- `faculty_attendance`: UNIQUE (`faculty_id`, `attendance_date`)
- Optional: UNIQUE (`admission_form_id`) in `student` if one form maps to one student.

## Indexes
- `student_attendance (student_id, attendance_date)`
- `faculty_attendance (faculty_id, attendance_date)`
- `admission_form (status, submitted_at)`

## Open Questions
- Do you need multiple guardians per applicant?
- Will attendance require period-level tracking?
- Should `status` use enums or a lookup table?

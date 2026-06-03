"use client";

import type { ChangeEvent, FormEvent, ReactNode } from "react";
import { useMemo, useState } from "react";
import { apiRequest } from "./api";

type IconName =
  | "bell"
  | "calendar"
  | "camera"
  | "chart"
  | "grid"
  | "id"
  | "menu"
  | "money"
  | "parents"
  | "receipt"
  | "reference"
  | "search"
  | "settings"
  | "students"
  | "terms"
  | "user";

type ApiStudent = {
  student_id: string;
  admission_no?: string;
  first_name?: string;
  last_name?: string;
  class_id?: string;
  class_name?: string;
  parent_name?: string;
  parent_phone?: string;
  parent_email?: string;
  status?: string;
};

type ApiSearchStudentsResponse = {
  results: ApiStudent[];
};

type ApplicationResponse = {
  application_id: string;
  admission_no?: string;
  status: string;
};

type ReceiptResponse = {
  receipt_id: string;
  receipt_number: string;
  status: string;
  email_status: string;
};

type EmergencyContact = {
  name: string;
  phone: string;
  relation: string;
};

type Sibling = {
  fullName: string;
  dob: string;
  school: string;
};

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Bombay (Oh)", "Rh-null", "Unknown"];

const PHONE_LOCATIONS = [
  { label: "India", code: "+91" },
  { label: "United States", code: "+1" },
  { label: "Canada", code: "+1" },
  { label: "United Kingdom", code: "+44" },
  { label: "United Arab Emirates", code: "+971" },
  { label: "Singapore", code: "+65" },
  { label: "Australia", code: "+61" },
  { label: "Qatar", code: "+974" },
  { label: "Saudi Arabia", code: "+966" },
  { label: "Oman", code: "+968" },
  { label: "Kuwait", code: "+965" },
  { label: "Bahrain", code: "+973" },
  { label: "Malaysia", code: "+60" },
];

const FEE_CATEGORIES = ["Tuition Fee", "Transport Fee", "Annual Sports Fund", "Admission Fee", "Meal Plan", "Books & Materials"];

const paymentRows = [
  { category: "Tuition Fee", month: "October", amount: "$1,200.00" },
  { category: "Transport Fee", month: "September", amount: "$150.00" },
  { category: "Annual Sports Fund", month: "August", amount: "$200.00" },
];

const navItems: Array<{ label: string; href: string; icon: IconName; active?: boolean }> = [
  { label: "Dashboard", href: "/", icon: "grid" },
  { label: "Students", href: "/students", icon: "students" },
  { label: "Student Attendance", href: "/student-attendance", icon: "calendar" },
  { label: "Faculty Attendance", href: "/faculty-attendance", icon: "id" },
  { label: "Fee Management", href: "/fee-management", icon: "money", active: true },
  { label: "Reports", href: "/reports", icon: "chart" },
];

export function FeeManagementView() {
  const [query, setQuery] = useState("");
  const [students, setStudents] = useState<ApiStudent[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<ApiStudent | null>(null);
  const [searchStatus, setSearchStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [feeCategory, setFeeCategory] = useState("Tuition Fee");

  async function searchStudents(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!query.trim()) {
      setSearchStatus("Enter a student name, roll number, phone, or email.");
      return;
    }

    setSearchStatus("Searching students...");
    setStudents([]);

    try {
      const data = await apiRequest<ApiSearchStudentsResponse>(`/students/search?q=${encodeURIComponent(query.trim())}&limit=8`);
      setStudents(data.results);
      setSelectedStudent(data.results[0] ?? null);
      setSearchStatus(data.results.length ? `${data.results.length} student result found.` : "No matching students found.");
    } catch (error) {
      setSearchStatus(error instanceof Error ? error.message : "Student search failed.");
    }
  }

  async function registerPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const amount = Number(formData.get("amount_paid"));
    const paymentDate = String(formData.get("payment_date") || "");
    const paymentTime = String(formData.get("payment_time") || "09:00");

    if (!selectedStudent) {
      setPaymentStatus("Search and select a student before registering a payment.");
      return;
    }
    if (!amount || amount <= 0) {
      setPaymentStatus("Enter a valid amount paid.");
      return;
    }
    if (!paymentDate) {
      setPaymentStatus("Choose a payment date.");
      return;
    }

    setPaymentStatus("Registering payment...");

    try {
      const data = await apiRequest<ReceiptResponse>("/receipts", {
        method: "POST",
        body: JSON.stringify({
          student_id: selectedStudent.student_id,
          payment_date: new Date(`${paymentDate}T${paymentTime || "09:00"}`).toISOString(),
          payment_method: paymentMethod,
          total_amount: amount,
          notes: "Created from admin fee management screen",
          send_email: false,
          items: [{ fee_type: feeCategory, amount }],
        }),
      });
      setPaymentStatus(`Receipt ${data.receipt_number} created.`);
    } catch (error) {
      setPaymentStatus(error instanceof Error ? error.message : "Receipt submission failed.");
    }
  }

  function sendWhatsappReceipt() {
    if (!selectedStudent) {
      setPaymentStatus("Select a student before sending a receipt.");
      return;
    }
    setPaymentStatus("WhatsApp sending is not implemented in the backend yet. Receipt creation is connected.");
  }

  return (
    <section className="fee-shell" aria-label="Fee Management">
      <aside className="fee-sidebar">
        <div>
          <h1 className="brand-title">Clean Paper</h1>
          <p className="brand-subtitle">Administrative Portal</p>
        </div>

        <nav className="fee-nav" aria-label="Primary navigation">
          {navItems.map((item) => (
            <a className={item.active ? "active" : ""} href={item.href} key={item.label}>
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </a>
          ))}
        </nav>

        <button className="sidebar-user" type="button" onClick={logoutAdmin}>
          <Avatar variant="admin" />
          <div>
            <strong>Admin</strong>
            <span>Sign out</span>
          </div>
        </button>
      </aside>

      <div className="fee-main" id="fee-management">
        <header className="fee-topbar">
          <h2>Fee Management</h2>
          <div className="top-actions">
            <label className="global-search">
              <Icon name="search" />
              <input aria-label="Global search" placeholder="Global search..." />
            </label>
            <button className="icon-button" type="button" aria-label="Notifications" onClick={() => setPaymentStatus("No new notifications.")}>
              <Icon name="bell" />
            </button>
            <button className="icon-button" type="button" aria-label="Settings" onClick={() => setPaymentStatus("Settings will be available after auth is integrated.")}>
              <Icon name="settings" />
            </button>
            <span className="top-divider" />
            <Avatar />
          </div>
        </header>

        <div className="fee-content">
          <section className="student-lookup" aria-label="Find student">
            <form onSubmit={searchStudents}>
              <label className="section-label" htmlFor="student-search">
                Find Student
              </label>
              <div className="student-search">
                <input id="student-search" placeholder="Search by name or roll number..." value={query} onChange={(event) => setQuery(event.target.value)} />
                <button className="icon-button" type="submit" aria-label="Search students">
                  <Icon name="students" />
                </button>
              </div>
            </form>

            {students.length > 1 ? (
              <div className="search-results" aria-label="Student search results">
                {students.map((student) => (
                  <button
                    className={student.student_id === selectedStudent?.student_id ? "selected" : ""}
                    key={student.student_id}
                    type="button"
                    onClick={() => setSelectedStudent(student)}
                  >
                    <span>{studentName(student)}</span>
                    <small>{student.admission_no ?? "No admission number"}</small>
                  </button>
                ))}
              </div>
            ) : null}

            <article className="student-card">
              <Avatar variant="student" />
              <h3>{selectedStudent ? studentName(selectedStudent) : "Leo Chen"}</h3>
              <p>Roll Number: {selectedStudent?.admission_no ?? "#2024-0892"}</p>
              <dl>
                <div>
                  <dt>Class</dt>
                  <dd>{selectedStudent?.class_name ?? "Grade 4"}</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>{selectedStudent?.status ?? "Active"}</dd>
                </div>
                <div>
                  <dt>Parent Contacts</dt>
                  <dd>{selectedStudent?.parent_phone ?? "+1 (555) 012-3456"}</dd>
                </div>
                <div>
                  <dt>Parent Email</dt>
                  <dd>{selectedStudent?.parent_email ?? "Not available"}</dd>
                </div>
              </dl>
              {searchStatus ? <p className="status-message">{searchStatus}</p> : null}
            </article>
          </section>

          <section className="payment-panel">
            <div className="payment-history">
              <h3>Payment History</h3>
              <table>
                <thead>
                  <tr>
                    <th>Fee Category</th>
                    <th>Month</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentRows.map((row) => (
                    <tr key={row.category}>
                      <td>{row.category}</td>
                      <td>{row.month}</td>
                      <td className="amount">{row.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <form className="payment-form" onSubmit={registerPayment}>
              <h3>Register New Payment</h3>
              <Field label="Fee Category" name="fee_category" options={FEE_CATEGORIES} type="select" value={feeCategory} onChange={setFeeCategory} />
              <Field label="Payment Date" name="payment_date" type="date" />
              <div className="payment-method">
                <span className="section-label">Payment Method</span>
                <SegmentedControl
                  ariaLabel="Payment method"
                  options={[
                    { label: "Cash", value: "cash" },
                    { label: "Card", value: "card" },
                    { label: "Transfer", value: "bank_transfer" },
                    { label: "UPI", value: "upi" },
                  ]}
                  value={paymentMethod}
                  onChange={setPaymentMethod}
                />
              </div>
              <Field label="Payment Time" name="payment_time" type="time" />
              <Field label="Amount Paid" name="amount_paid" placeholder="0.00" type="number" />
              <div className="payment-actions">
                <button className="primary-button" type="submit">
                  Register Payment
                </button>
                <button className="secondary-button" type="button" onClick={sendWhatsappReceipt}>
                  <Icon name="receipt" />
                  Send WhatsApp Receipt
                </button>
              </div>
              {paymentStatus ? <p className="form-status">{paymentStatus}</p> : null}
            </form>
          </section>
        </div>
      </div>
    </section>
  );
}

export function AdmissionFormView() {
  const [gender, setGender] = useState("Male");
  const [contacts, setContacts] = useState<EmergencyContact[]>([
    { name: "Grandparent", phone: "+1 555-0123", relation: "Grandparent" },
    { name: "", phone: "", relation: "" },
  ]);
  const [siblings, setSiblings] = useState<Sibling[]>([{ fullName: "", dob: "", school: "" }]);
  const [status, setStatus] = useState("");
  const [photoName, setPhotoName] = useState("");

  function updateContact(index: number, key: keyof EmergencyContact, value: string) {
    setContacts((current) => current.map((contact, contactIndex) => (contactIndex === index ? { ...contact, [key]: value } : contact)));
  }

  function updateSibling(index: number, key: keyof Sibling, value: string) {
    setSiblings((current) => current.map((sibling, siblingIndex) => (siblingIndex === index ? { ...sibling, [key]: value } : sibling)));
  }

  function saveDraft(form: HTMLFormElement) {
    const formData = new FormData(form);
    const draft = {
      fields: Object.fromEntries(formData.entries()),
      gender,
      contacts,
      siblings,
    };
    localStorage.setItem("clean-paper-admission-draft", JSON.stringify(draft));
    setStatus("Draft saved in this browser.");
  }

  async function submitAdmission(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const fullName = String(formData.get("full_name") || "").trim();
    const { firstName, lastName } = splitName(fullName);

    if (!firstName) {
      setStatus("Enter the student's full name.");
      return;
    }
    if (!formData.get("terms")) {
      setStatus("Accept the terms and conditions before submitting.");
      return;
    }

    const fatherPhone = phoneValue(String(formData.get("father_phone_code")), String(formData.get("father_phone")));
    const motherPhone = phoneValue(String(formData.get("mother_phone_code")), String(formData.get("mother_phone")));
    const address = String(formData.get("address") || "").trim();
    const referenceName = String(formData.get("reference_name") || "").trim();
    const referencePhone = String(formData.get("reference_phone") || "").trim();

    setStatus("Submitting application...");

    try {
      const data = await apiRequest<ApplicationResponse>("/applications", {
        method: "POST",
        body: JSON.stringify({
          student: compactObject({
            first_name: firstName,
            last_name: lastName,
            dob: emptyToNull(String(formData.get("dob") || "")),
            gender,
            mother_tongue: emptyToNull(String(formData.get("mother_tongue") || "")),
            blood_group: emptyToNull(String(formData.get("blood_group") || "")),
            allergy_food: emptyToNull(String(formData.get("allergies") || "")),
            parent_name: emptyToNull(String(formData.get("father_name") || "")),
            parent_phone: fatherPhone || motherPhone || null,
            address: address || null,
            admission_date: new Date().toISOString().slice(0, 10),
            status: "active",
          }),
          admission: {
            admission_date: new Date().toISOString().slice(0, 10),
            joining_class: "New Admission",
            notes: "Submitted from public admission form",
          },
          parents: compactObject({
            father_name: emptyToNull(String(formData.get("father_name") || "")),
            father_occupation: emptyToNull(String(formData.get("father_occupation") || "")),
            father_phone: fatherPhone,
            mother_name: emptyToNull(String(formData.get("mother_name") || "")),
            mother_occupation: emptyToNull(String(formData.get("mother_occupation") || "")),
            mother_phone: motherPhone,
          }),
          emergency_contacts: contacts
            .map((contact, index) => ({
              priority: index + 1,
              contact_name: contact.name.trim(),
              relation: contact.relation.trim() || undefined,
              phone: contact.phone.trim(),
            }))
            .filter((contact) => contact.contact_name && contact.phone),
          siblings: siblings
            .map((sibling) => ({
              full_name: sibling.fullName.trim() || undefined,
              dob: sibling.dob || undefined,
              school_name: sibling.school.trim() || undefined,
            }))
            .filter((sibling) => sibling.full_name || sibling.dob || sibling.school_name),
          references: referenceName || referencePhone ? [compactObject({ reference_through: referenceName, reference_phone: referencePhone })] : undefined,
        }),
      });
      localStorage.removeItem("clean-paper-admission-draft");
      setStatus(`Application ${data.status}. Admission number: ${data.admission_no ?? data.application_id}`);
      form.reset();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Application submission failed.");
    }
  }

  return (
    <section className="admission-page" aria-label="Student Admission Form">
      <AdmissionHeader />

      <div className="form-title">
        <h2>Student Admission Form</h2>
        <p>Academic Year 2024-2025</p>
      </div>

      <form className="admission-form" onSubmit={submitAdmission}>
        <FormSection icon="user" number="1." title="Student Information">
          <div className="student-grid">
            <div className="student-fields">
              <Field label="Full Name" name="full_name" placeholder="Enter student's full name" />
              <Field label="Date of Birth" name="dob" type="date" />
              <div className="form-field">
                <span className="field-label">Gender</span>
                <SegmentedControl
                  ariaLabel="Gender"
                  className="gender-control"
                  options={[
                    { label: "Male", value: "Male" },
                    { label: "Female", value: "Female" },
                    { label: "Other", value: "Other" },
                  ]}
                  value={gender}
                  onChange={setGender}
                />
              </div>
              <Field label="Mother Tongue" name="mother_tongue" placeholder="e.g. English, Spanish" value="English" />
              <Field label="Blood Group" name="blood_group" options={BLOOD_GROUPS} type="select" value="A+" />
              <Field label="Allergies" name="allergies" placeholder="Any food allergies" />
            </div>
            <label className="photo-upload">
              <span>Student Photo</span>
              <input
                accept="image/png,image/jpeg"
                className="visually-hidden"
                type="file"
                onChange={(event) => setPhotoName(event.target.files?.[0]?.name ?? "")}
              />
              <div>
                <Icon name="camera" />
                <small>{photoName || "Drag & drop or click to upload"}</small>
                <em>JPEG, PNG - max 2MB</em>
              </div>
            </label>
          </div>
        </FormSection>

        <FormSection icon="parents" number="2." title="Parents Information">
          <div className="parents-grid">
            <ParentBlock title="Father's Details" name="Father's full name" prefix="father" />
            <ParentBlock title="Mother's Details" name="Mother's full name" prefix="mother" />
          </div>
          <Field className="full-row desktop-address" label="Residential Address" name="address" placeholder="Street name, City, State, ZIP code" type="textarea" />
        </FormSection>

        <FormSection icon="id" number="3." title="Emergency Contacts">
          <div className="contact-list">
            {contacts.map((contact, index) => (
              <ContactRow contact={contact} index={index} key={index} onChange={updateContact} />
            ))}
          </div>
          <button className="add-button" type="button" onClick={() => setContacts((current) => [...current, { name: "", phone: "", relation: "" }].slice(0, 3))}>
            + Add Contact
          </button>
        </FormSection>

        <FormSection icon="students" number="4." title="Sibling Information">
          <div className="sibling-grid">
            {siblings.map((sibling, index) => (
              <SiblingFields index={index} key={index} sibling={sibling} onChange={updateSibling} />
            ))}
          </div>
          <button className="add-button mobile-only" type="button" onClick={() => setSiblings((current) => [...current, { fullName: "", dob: "", school: "" }])}>
            + Add Another Sibling
          </button>
        </FormSection>

        <FormSection icon="reference" number="5." title="Reference Details">
          <div className="reference-grid">
            <Field label="Reference Name" name="reference_name" placeholder="Person who referred you" />
            <Field label="Contact Number" name="reference_phone" placeholder="Reference phone number" />
          </div>
        </FormSection>

        <FormSection icon="terms" number="6." title="Terms & Conditions">
          <div className="terms-box">
            <p>
              <strong>1. Admission Policy:</strong> Submission of this form does not guarantee admission. Admissions are based on seat availability and assessment results.
            </p>
            <p>
              <strong>2. Fee Structure:</strong> All fees are non-refundable and must be paid by the 5th of every month. Late payments will incur a penalty.
            </p>
            <p>
              <strong>3. Health & Safety:</strong> Parents must disclose all medical conditions. The school is not liable for undisclosed health issues.
            </p>
            <p>
              <strong>4. Documentation:</strong> Birth certificates and previous school records must be submitted within 7 days of provisional admission.
            </p>
          </div>
          <label className="check-row">
            <input name="terms" type="checkbox" />
            <span>I declare that I have read and understood the above instruction and fees details and agree to abide by the school regulations.</span>
          </label>
        </FormSection>

        {status ? <p className="form-status">{status}</p> : null}
        <div className="admission-actions">
          <button className="secondary-button" type="button" onClick={(event) => saveDraft(event.currentTarget.form!)}>
            Save Draft
          </button>
          <button className="primary-button" type="submit">
            Submit Application
          </button>
        </div>
      </form>
    </section>
  );
}

export function AdminPlaceholderView({ title, description, actionLabel, endpoint }: { title: string; description: string; actionLabel: string; endpoint: string }) {
  const [status, setStatus] = useState("");

  async function runCheck() {
    setStatus("Contacting backend...");
    try {
      const data = await apiRequest<Record<string, unknown>>(endpoint);
      setStatus(`Backend response received: ${Object.keys(data).join(", ") || "ok"}.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Backend request failed.");
    }
  }

  return (
    <main className="admin-placeholder">
      <section>
        <h1>{title}</h1>
        <p>{description}</p>
        <button className="primary-button" type="button" onClick={runCheck}>
          {actionLabel}
        </button>
        {status ? <p className="form-status">{status}</p> : null}
      </section>
    </main>
  );
}

function AdmissionHeader() {
  return (
    <header className="admission-header">
      <div className="mobile-brand">
        <Icon name="menu" />
        <strong>Clean Paper</strong>
      </div>
      <strong className="desktop-brand">Clean Paper</strong>
      <div className="admission-search">
        <Icon name="search" />
        <input placeholder="Search application..." aria-label="Search application" />
      </div>
      <button className="icon-button" type="button" aria-label="Notifications" onClick={() => window.alert("No admission notifications yet.")}>
        <Icon name="bell" />
      </button>
      <button className="icon-button" type="button" aria-label="Settings" onClick={() => window.alert("Public admission settings are managed by admins.")}>
        <Icon name="settings" />
      </button>
      <Avatar />
    </header>
  );
}

function ParentBlock({ title, name, prefix }: { title: string; name: string; prefix: "father" | "mother" }) {
  return (
    <div className="parent-block">
      <h4>{title}</h4>
      <Field label="Name" name={`${prefix}_name`} placeholder={name} />
      <Field label="Occupation" name={`${prefix}_occupation`} placeholder="Current profession" />
      <div className="phone-row">
        <span className="field-label">Mobile Number</span>
        <div>
          <select aria-label={`${title} country code`} name={`${prefix}_phone_code`}>
            {PHONE_LOCATIONS.map((location) => (
              <option key={`${location.label}-${location.code}`} value={location.code}>
                {location.code} {location.label}
              </option>
            ))}
          </select>
          <input name={`${prefix}_phone`} placeholder="Phone number" />
        </div>
      </div>
    </div>
  );
}

function ContactRow({ contact, index, onChange }: { contact: EmergencyContact; index: number; onChange: (index: number, key: keyof EmergencyContact, value: string) => void }) {
  return (
    <div className="contact-row">
      <span className={index === 0 ? "contact-number" : "contact-number muted"}>{index + 1}</span>
      <input placeholder="Relation" value={contact.relation} onChange={(event) => onChange(index, "relation", event.target.value)} />
      <input placeholder="Name" value={contact.name} onChange={(event) => onChange(index, "name", event.target.value)} />
      <input placeholder="Contact Number" value={contact.phone} onChange={(event) => onChange(index, "phone", event.target.value)} />
    </div>
  );
}

function SiblingFields({ sibling, index, onChange }: { sibling: Sibling; index: number; onChange: (index: number, key: keyof Sibling, value: string) => void }) {
  return (
    <>
      <Field label="Sibling Name" name={`sibling_name_${index}`} placeholder="Full name" value={sibling.fullName} onChange={(value) => onChange(index, "fullName", value)} />
      <Field label="DOB" name={`sibling_dob_${index}`} type="date" value={sibling.dob} onChange={(value) => onChange(index, "dob", value)} />
      <Field label="Current School" name={`sibling_school_${index}`} placeholder="School Name" value={sibling.school} onChange={(value) => onChange(index, "school", value)} />
    </>
  );
}

function FormSection({ children, icon, number, title }: { children: ReactNode; icon: IconName; number: string; title: string }) {
  return (
    <section className="form-section">
      <h3>
        <Icon name={icon} />
        <span>
          <b>{number}</b> {title}
        </span>
      </h3>
      <div className="section-body">{children}</div>
    </section>
  );
}

function Field({
  className = "",
  label,
  name,
  onChange,
  options = [],
  placeholder,
  type = "text",
  value,
}: {
  className?: string;
  label: string;
  name: string;
  onChange?: (value: string) => void;
  options?: string[];
  placeholder?: string;
  type?: "date" | "number" | "select" | "textarea" | "text" | "time";
  value?: string;
}) {
  const inputProps = useMemo(
    () => ({
      name,
      ...(onChange ? { value: value ?? "", onChange: (event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value) } : { defaultValue: value }),
    }),
    [name, onChange, value],
  );

  return (
    <label className={`form-field ${className}`}>
      <span className="field-label">{label}</span>
      {type === "select" ? (
        <select
          name={name}
          {...(onChange ? { value: value ?? "", onChange: (event: ChangeEvent<HTMLSelectElement>) => onChange(event.target.value) } : { defaultValue: value })}
        >
          {options.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
      ) : type === "textarea" ? (
        <textarea name={name} placeholder={placeholder} />
      ) : (
        <input {...inputProps} placeholder={placeholder ?? (type === "time" ? "--:-- --" : "mm/dd/yyyy")} type={type} />
      )}
    </label>
  );
}

function SegmentedControl({
  ariaLabel,
  className = "",
  onChange,
  options,
  value,
}: {
  ariaLabel: string;
  className?: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  value: string;
}) {
  return (
    <div className={`segmented-control ${className}`} role="group" aria-label={ariaLabel}>
      {options.map((option) => (
        <button className={option.value === value ? "selected" : ""} key={option.value} type="button" onClick={() => onChange(option.value)}>
          {option.label}
        </button>
      ))}
    </div>
  );
}

function Avatar({ variant = "profile" }: { variant?: "admin" | "profile" | "student" }) {
  return (
    <span className={`avatar avatar-${variant}`} aria-hidden="true">
      {variant === "student" ? <span /> : null}
    </span>
  );
}

function Icon({ name }: { name: IconName }) {
  return (
    <svg aria-hidden="true" className={`icon icon-${name}`} fill="none" viewBox="0 0 24 24">
      {iconPaths[name]}
    </svg>
  );
}

function studentName(student: ApiStudent) {
  return [student.first_name, student.last_name].filter(Boolean).join(" ") || "Selected Student";
}

function splitName(name: string) {
  const [firstName, ...rest] = name.split(/\s+/).filter(Boolean);
  return { firstName: firstName ?? "", lastName: rest.join(" ") || null };
}

function emptyToNull(value: string) {
  return value.trim() || null;
}

function phoneValue(code: string, number: string) {
  const cleanNumber = number.trim();
  if (!cleanNumber) {
    return null;
  }
  return `${code} ${cleanNumber}`;
}

function compactObject<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(Object.entries(value).filter(([, fieldValue]) => fieldValue !== null && fieldValue !== undefined && fieldValue !== "")) as Partial<T>;
}

function logoutAdmin() {
  document.cookie = "admin_session=; path=/; max-age=0; SameSite=Lax";
  window.location.href = "/admin/login";
}

const iconPaths: Record<IconName, ReactNode> = {
  bell: (
    <>
      <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </>
  ),
  calendar: (
    <>
      <path d="M8 2v4M16 2v4M3 10h18" />
      <rect height="18" rx="2" width="18" x="3" y="4" />
    </>
  ),
  camera: (
    <>
      <path d="M7 7h2l1.5-2h3L15 7h2a3 3 0 0 1 3 3v8H4v-8a3 3 0 0 1 3-3Z" />
      <circle cx="12" cy="13" r="3" />
      <path d="M18 4v4M16 6h4" />
    </>
  ),
  chart: (
    <>
      <path d="M4 20V4h16v16H4Z" />
      <path d="M8 16v-5M12 16V8M16 16v-8" />
    </>
  ),
  grid: (
    <>
      <path d="M4 4h7v7H4zM15 4h5v7h-5zM4 15h7v5H4zM15 15h5v5h-5z" />
    </>
  ),
  id: (
    <>
      <rect height="16" rx="2" width="18" x="3" y="4" />
      <path d="M8 9h3M8 13h8M8 17h8M15 8v3h3" />
    </>
  ),
  menu: (
    <>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </>
  ),
  money: (
    <>
      <rect height="14" rx="2" width="20" x="2" y="5" />
      <circle cx="12" cy="12" r="3" />
      <path d="M5 9v0M19 15v0" />
    </>
  ),
  parents: (
    <>
      <path d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
      <path d="M3 20a5 5 0 0 1 10 0M11 20a5 5 0 0 1 10 0" />
    </>
  ),
  receipt: (
    <>
      <path d="M5 4h14v16l-3-2-3 2-3-2-3 2V4Z" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </>
  ),
  reference: (
    <>
      <path d="M5 19h14M7 17 5 9l5 4 2-8 2 8 5-4-2 8" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m16 16 5 5" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.5-2.4 1a8 8 0 0 0-1.8-1L14 3h-4l-.7 3a8 8 0 0 0-1.8 1L5.1 6 3 9.5 5.1 11a7 7 0 0 0 0 2L3 14.5 5.1 18l2.4-1a8 8 0 0 0 1.8 1L10 21h4l.7-3a8 8 0 0 0 1.8-1l2.4 1 2-3.5-2-1.5a7 7 0 0 0 .1-1Z" />
    </>
  ),
  students: (
    <>
      <path d="M12 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM4 20a6 6 0 0 1 12 0" />
      <path d="M17 10a3 3 0 0 1 0 6M18 20a5 5 0 0 0-3-4" />
    </>
  ),
  terms: (
    <>
      <path d="M6 4h10l2 2v16H6z" />
      <path d="M9 10h6M9 14h6M9 18h4" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M5 21a7 7 0 0 1 14 0" />
    </>
  ),
};

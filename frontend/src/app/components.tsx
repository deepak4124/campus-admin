"use client";

import type { ChangeEvent, FormEvent, ReactNode } from "react";
import { useMemo, useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { apiRequest } from "./api";
import * as XLSX from "xlsx";

type IconName =
  | "bell"
  | "calendar"
  | "camera"
  | "chart"
  | "clock"
  | "grid"
  | "id"
  | "mail"
  | "menu"
  | "money"
  | "parents"
  | "phone"
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
  photo_url?: string;
  dob?: string;
  gender?: string;
  mother_tongue?: string;
  blood_group?: string;
  allergy_food?: string;
  address?: string;
  admission_date?: string;
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

type ApiReceipt = {
  receipt_id: string;
  receipt_number: string;
  payment_date: string;
  total_amount: number;
  receipt_items: { fee_type: string; amount: number }[];
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

const FEE_CATEGORIES = ["Tuition Fee", "Academic Fee", "Miscellaneous"];

const navSections = [
  {
    title: "General",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: "grid" as const }
    ]
  },
  {
    title: "Directory",
    items: [
      { label: "Students", href: "/students", icon: "students" as const },
      { label: "Faculty", href: "/faculty", icon: "user" as const }
    ]
  },
  {
    title: "Attendance & Audits",
    items: [
      { label: "Student Attendance", href: "/student-attendance", icon: "calendar" as const },
      { label: "Faculty Attendance", href: "/faculty-attendance", icon: "id" as const }
    ]
  },
  {
    title: "Management & Reports",
    items: [
      { label: "Fee Management", href: "/fee-management", icon: "money" as const },
      { label: "Reports", href: "/reports", icon: "chart" as const }
    ]
  }
];

export function DashboardLayout({ children, title, className = "" }: { children: ReactNode; title?: string; className?: string }) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const sessionStartStr = localStorage.getItem("supabase_session_start");
    if (!sessionStartStr) return;

    const sessionStart = parseInt(sessionStartStr, 10);
    const ONE_HOUR = 60 * 60 * 1000;

    const checkSession = () => {
      const elapsed = Date.now() - sessionStart;
      if (elapsed >= ONE_HOUR) {
        logoutAdmin();
      }
    };

    checkSession();
    const interval = setInterval(checkSession, 15000); // Check every 15s
    return () => clearInterval(interval);
  }, []);

  // Escape key listener to close drawer
  useEffect(() => {
    if (!isSidebarOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSidebarOpen]);

  // Body scroll lock when drawer is open
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isSidebarOpen]);
  
  return (
    <section className="fee-shell" aria-label={title || "Dashboard"}>
      {isSidebarOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={() => setIsSidebarOpen(false)} 
          aria-hidden="true"
        />
      )}

      <aside className={`fee-sidebar ${isSidebarOpen ? "open" : ""}`}>
        <div className="fee-brand" style={{ position: "relative", display: "flex", flexDirection: "column", gap: "16px", marginBottom: "8px" }}>
          <img src="/bdps logo.jpeg" alt="Blooming Daffodils Logo" style={{ width: "48px", height: "48px", borderRadius: "8px", objectFit: "cover" }} />
          <div>
            <h1 className="brand-title">Blooming Daffodils</h1>
            <p className="brand-subtitle">Administrative Portal</p>
          </div>
          <button 
            className="sidebar-close-btn" 
            onClick={() => setIsSidebarOpen(false)} 
            aria-label="Close menu"
            type="button"
          >
            ✕
          </button>
        </div>

        <nav className="fee-nav" aria-label="Primary navigation">
          {navSections.map((section) => (
            <div key={section.title} className="nav-section">
              <span className="nav-section-title">{section.title}</span>
              <div className="nav-section-items">
                {section.items.map((item) => {
                  const isActive = item.href === "/" ? pathname === "/" : pathname?.startsWith(item.href);
                  return (
                    <a 
                      className={isActive ? "active" : ""} 
                      href={item.href} 
                      key={item.label}
                      onClick={() => setIsSidebarOpen(false)}
                    >
                      <Icon name={item.icon} />
                      <span>{item.label}</span>
                    </a>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      <div className="fee-main" id="dashboard-main">
        <header className="fee-topbar">
          <button 
            className="hamburger-menu-btn" 
            onClick={() => setIsSidebarOpen(true)} 
            aria-label="Open menu"
            type="button"
          >
            <Icon name="menu" />
          </button>
          <h2>{title || "Dashboard"}</h2>
          <div className="top-actions" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <button className="icon-button" aria-label="Notifications" type="button">
              <Icon name="bell" />
            </button>
            <div className="top-divider" />
            <div className="header-profile-card" onClick={logoutAdmin}>
              <div className="avatar-wrapper">AD</div>
              <div className="profile-info">
                <span className="profile-name">School Admin</span>
                <span className="profile-sub">Sign out</span>
              </div>
              <svg className="chevron-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </header>

        <div className={`fee-content ${className}`}>{children}</div>
      </div>
    </section>
  );
}

export function FeeManagementView() {
  const [query, setQuery] = useState("");
  const [students, setStudents] = useState<ApiStudent[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<ApiStudent | null>(null);
  const [searchStatus, setSearchStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [feeCategory, setFeeCategory] = useState("Tuition Fee");
  const [receipts, setReceipts] = useState<ApiReceipt[]>([]);

  useEffect(() => {
    if (!selectedStudent) {
      setReceipts([]);
      return;
    }
    
    apiRequest<ApiReceipt[]>(`/receipts/student/${selectedStudent.student_id}`)
      .then(setReceipts)
      .catch((err) => console.error("Failed to load receipts:", err));
  }, [selectedStudent, paymentStatus]);

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
          payment_date: new Date(`${paymentDate}T00:00:00Z`).toISOString(),
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

  async function sendEmailReceipt() {
    if (!selectedStudent) {
      setPaymentStatus("Select a student before sending a receipt.");
      return;
    }
    const parentEmail = selectedStudent.parent_email;
    if (!parentEmail) {
      setPaymentStatus("Cannot send receipt: Father's email address is missing for this student.");
      return;
    }
    setPaymentStatus("Sending receipt to email...");
    try {
      await apiRequest<{ status: string; email: string }>(`/receipts/student/${selectedStudent.student_id}/send-email`, {
        method: "POST",
      });
      setPaymentStatus(`Receipt successfully emailed to ${parentEmail}.`);
    } catch (error) {
      setPaymentStatus(error instanceof Error ? error.message : "Email sending failed.");
    }
  }

  return (
    <DashboardLayout title="Fee Management" className="fee-grid-layout">
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

            {students.length > 0 ? (
              <div className="search-results-dropdown-container">
                <label className="section-label" htmlFor="student-select">
                  Select Student from Results
                </label>
                <select
                  id="student-select"
                  className="student-select-dropdown"
                  value={selectedStudent?.student_id ?? ""}
                  onChange={(event) => {
                    const found = students.find((s) => s.student_id === event.target.value);
                    if (found) {
                      setSelectedStudent(found);
                    }
                  }}
                >
                  {students.map((student) => (
                    <option key={student.student_id} value={student.student_id}>
                      {studentName(student)} ({student.admission_no ?? "No admission number"})
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <article className="student-card">
              <Avatar variant="student" src={selectedStudent?.photo_url} />
              <h3>{selectedStudent ? studentName(selectedStudent) : "Leo Chen"}</h3>
              <p>Roll Number: {selectedStudent?.admission_no ?? "#2024-0892"}</p>
              <dl>
                <div>
                  <dt>Class</dt>
                  <dd>{selectedStudent?.class_name ?? "Pre-School"}</dd>
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
                  {receipts.map((receipt) => (
                    <tr key={receipt.receipt_id}>
                      <td>{receipt.receipt_items?.[0]?.fee_type ?? "Fee"}</td>
                      <td>{new Date(receipt.payment_date).toLocaleDateString()}</td>
                      <td className="amount">₹{receipt.total_amount.toFixed(2)}</td>
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
                    { label: "UPI", value: "upi" },
                  ]}
                  value={paymentMethod}
                  onChange={setPaymentMethod}
                />
              </div>
              <Field label="Amount Paid" name="amount_paid" placeholder="0.00" type="number" />
              <div className="payment-actions">
                <button className="primary-button" type="submit">
                  Register Payment
                </button>
                <button className="secondary-button" type="button" onClick={sendEmailReceipt}>
                  <Icon name="receipt" />
                  Send Receipt to Email
                </button>
              </div>
              {paymentStatus ? <p className="form-status">{paymentStatus}</p> : null}
            </form>
          </section>
    </DashboardLayout>
  );
}

export function AdmissionFormView() {
  const [gender, setGender] = useState("Male");
  const [contacts, setContacts] = useState<EmergencyContact[]>([
    { name: "", phone: "", relation: "" },
    { name: "", phone: "", relation: "" },
  ]);
  const [siblings, setSiblings] = useState<Sibling[]>([{ fullName: "", dob: "", school: "" }]);
  const [status, setStatus] = useState("");
  const [photoName, setPhotoName] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isFormValid, setIsFormValid] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "error" | "success" } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    const form = document.querySelector(".admission-form") as HTMLFormElement | null;
    if (form) {
      setIsFormValid(form.checkValidity());
    }
  }, [contacts, siblings, gender]);

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
    localStorage.setItem("blooming-daffodils-admission-draft", JSON.stringify(draft));
    setStatus("Draft saved in this browser.");
  }

  async function submitAdmission(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    
    // Check validation of required inputs manually to find which ones are missing
    const invalidFields: string[] = [];
    const requiredInputs = form.querySelectorAll("input[required], select[required], textarea[required]");
    requiredInputs.forEach((input) => {
      const el = input as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
      if (!el.checkValidity()) {
        let labelText = "";
        const fieldLabel = el.closest(".form-field")?.querySelector(".field-label");
        if (fieldLabel) {
          labelText = fieldLabel.textContent?.replace("*", "").trim() || "";
        }
        if (!labelText) {
          labelText = el.getAttribute("placeholder")?.replace("*", "").trim() 
                   || el.name.replace("_", " ");
        }
        if (labelText) {
          // Capitalize label text
          labelText = labelText.charAt(0).toUpperCase() + labelText.slice(1);
          if (!invalidFields.includes(labelText)) {
            invalidFields.push(labelText);
          }
        }
      }
    });

    // One emergency contact is mandatory
    const hasFirstContact = contacts[0] && contacts[0].name.trim() && contacts[0].phone.trim() && contacts[0].relation.trim();
    if (!hasFirstContact) {
      if (!invalidFields.includes("First Emergency Contact (Name, Phone, Relation)")) {
        invalidFields.push("First Emergency Contact (Name, Phone, Relation)");
      }
    }

    // Terms is mandatory
    const termsInput = form.querySelector('input[name="terms"]') as HTMLInputElement;
    if (termsInput && !termsInput.checked) {
      if (!invalidFields.includes("Terms and Conditions Declaration")) {
        invalidFields.push("Terms and Conditions Declaration");
      }
    }

    if (invalidFields.length > 0) {
      setToast({
        message: `Please fill in all required fields: ${invalidFields.join(", ")}`,
        type: "error",
      });
      return;
    }

    const fullName = String(formData.get("full_name") || "").trim();
    const { firstName, lastName } = splitName(fullName);

    const fatherPhone = phoneValue(String(formData.get("father_phone_code")), String(formData.get("father_phone")));
    const motherPhone = phoneValue(String(formData.get("mother_phone_code")), String(formData.get("mother_phone")));
    const address = String(formData.get("address") || "").trim();
    const referenceName = String(formData.get("reference_name") || "").trim();
    const referencePhone = String(formData.get("reference_phone") || "").trim();
    const parentEmail = String(formData.get("parent_email") || "").trim();

    setStatus("Submitting application...");

    try {
      let photoUrl: string | undefined = undefined;
      const photoFile = formData.get("photo") as File | null;
      
      if (photoFile && photoFile.size > 0) {
        setStatus("Uploading student photo...");
        const supabase = createClient();
        const fileExt = photoFile.name.split('.').pop() || 'jpg';
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('student_photos')
          .upload(fileName, photoFile);
          
        if (uploadError) {
          throw new Error(`Photo upload failed: ${uploadError.message}`);
        }
        
        const { data: publicUrlData } = supabase.storage
          .from('student_photos')
          .getPublicUrl(fileName);
          
        photoUrl = publicUrlData.publicUrl;
        setStatus("Submitting application...");
      }

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
            parent_email: parentEmail || null,
            address: address || null,
            admission_date: new Date().toISOString().slice(0, 10),
            status: "active",
            photo_url: photoUrl,
          }),
          admission: {
            admission_date: new Date().toISOString().slice(0, 10),
            joining_class: "Pre-School",
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
      localStorage.removeItem("blooming-daffodils-admission-draft");
      const successMsg = `Application submitted successfully! Admission number: ${data.admission_no ?? data.application_id}`;
      setStatus(successMsg);
      setToast({ message: successMsg, type: "success" });
      setPhotoPreview(null);
      setPhotoName("");
      form.reset();
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : "Application submission failed.";
      setStatus(errMsg);
      setToast({ message: errMsg, type: "error" });
    }
  }

  return (
    <section className="admission-page" aria-label="Student Admission Form">
      <AdmissionTopBar />

      {toast && (
        <div className={`toast-notification ${toast.type}`}>
          <span className="toast-message">{toast.message}</span>
          <button className="toast-close" onClick={() => setToast(null)}>×</button>
        </div>
      )}

      <div className="form-title">
        <h2>Student Admission Form</h2>
        <p>Academic Year 2025-2026</p>
      </div>

      <form 
        className="admission-form" 
        onSubmit={submitAdmission}
        onChange={(e) => setIsFormValid(e.currentTarget.checkValidity())}
        onInput={(e) => setIsFormValid(e.currentTarget.checkValidity())}
        noValidate
      >
        <FormSection icon="user" number="1." title="Student Information">
          <div className="student-grid">
            <div className="student-fields">
              <Field 
                label="Full Name" 
                name="full_name" 
                placeholder="Enter student's full name" 
                required={true}
                pattern="^[A-Za-z .]+$"
                title="Full name must only contain alphabetic letters, spaces, and periods"
              />
              <Field 
                label="Date of Birth" 
                name="dob" 
                type="date" 
                required={true}
              />
              <div className="form-field">
                <span className="field-label">Gender</span>
                <SegmentedControl
                  ariaLabel="Gender"
                  className="gender-control"
                  options={[
                    { label: "Male", value: "Male" },
                    { label: "Female", value: "Female" },
                  ]}
                  value={gender}
                  onChange={setGender}
                />
              </div>
              <Field 
                label="Mother Tongue" 
                name="mother_tongue" 
                placeholder="e.g. English, Spanish" 
                value="English" 
                required={true}
                pattern="^[A-Za-z]+$"
                title="Mother tongue must only contain alphabetic letters"
              />
              <Field 
                label="Blood Group" 
                name="blood_group" 
                options={BLOOD_GROUPS} 
                type="select" 
                value="A+" 
                required={true}
              />
              <Field 
                label="Allergies" 
                name="allergies" 
                placeholder="Any food allergies" 
              />
            </div>
            <label className="photo-upload">
              <span>Student Photo</span>
              <input
                accept="image/png,image/jpeg"
                className="visually-hidden"
                type="file"
                name="photo"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    setPhotoName(file.name);
                    setPhotoPreview(URL.createObjectURL(file));
                  } else {
                    setPhotoName("");
                    setPhotoPreview(null);
                  }
                }}
              />
              <div style={{ overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <>
                    <Icon name="camera" />
                    <small>{photoName || "Drag & drop or click to upload"}</small>
                    <em>JPEG, PNG - max 2MB</em>
                  </>
                )}
              </div>
            </label>
          </div>
        </FormSection>

        <FormSection icon="parents" number="2." title="Parents Information">
          <div className="parents-grid">
            <ParentBlock title="Father's Details" name="Father's full name" prefix="father" showEmail={true} />
            <ParentBlock title="Mother's Details" name="Mother's full name" prefix="mother" />
          </div>
          <Field className="full-row address-field" label="Residential Address" name="address" placeholder="Street name, City, State, ZIP code" type="textarea" required={true} />
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
          <button className="add-button" type="button" onClick={() => setSiblings((current) => [...current, { fullName: "", dob: "", school: "" }])}>
            + Add Another Sibling
          </button>
        </FormSection>

        <FormSection icon="reference" number="5." title="Reference Details">
          <div className="reference-grid">
            <Field 
              label="Reference Name" 
              name="reference_name" 
              placeholder="Person who referred you" 
              pattern="^[A-Za-z .]+$"
              title="Name must only contain alphabetic letters, spaces, and periods"
            />
            <Field 
              label="Contact Number" 
              name="reference_phone" 
              placeholder="Reference phone number" 
              maxLength={10}
              pattern="^[0-9]{10}$"
              title="Mobile number must be exactly 10 digits"
              onInput={(e) => {
                e.currentTarget.value = e.currentTarget.value.replace(/\D/g, '').slice(0, 10);
              }}
            />
          </div>
        </FormSection>

        <FormSection icon="terms" number="6." title="Terms & Conditions of Blooming Daffodils Play School">
          <div className="terms-box" style={{ maxHeight: "none", overflow: "visible" }}>
            <h4 style={{ margin: "0 0 8px 0", color: "var(--accent)", fontSize: "16px" }}>School Timings:</h4>
            <p style={{ margin: "0 0 12px 0" }}>
              <strong>For Play group & Pre KG :</strong> 9:30 AM - 12:30 PM
            </p>
            <p style={{ margin: "0 0 12px 0" }}>
              Regular attendance and punctuality are desired. In case of long absence, a Medical Certificate should be produced.
            </p>
            <p style={{ margin: "0 0 12px 0" }}>
              Parents are requested to leave their children at school before 9:30 A.M. As it is requested that children be taught punctuality during their early childhood and parents play a key role in it.
            </p>
            <p style={{ margin: "0 0 16px 0" }}>
              Please be punctual for arrival & departure timings of school.
            </p>

            <h4 style={{ margin: "0 0 8px 0", color: "var(--accent)", fontSize: "16px" }}>Others:</h4>
            <ul style={{ margin: "0 0 16px 0", paddingLeft: "20px", listStyleType: "disc" }}>
              <li style={{ marginBottom: "6px" }}>Children are not allowed to wear any gold ornaments, as the management is not responsible for loss of the same.</li>
              <li style={{ marginBottom: "6px" }}>Both boys and girls should keep their hair neat, fingernails short and clean.</li>
              <li style={{ marginBottom: "6px" }}>Child will be handed to parents only.</li>
              <li style={{ marginBottom: "6px" }}>The school shall remain closed on Saturday, Sunday and on all government holidays.</li>
            </ul>

            <h4 style={{ margin: "0 0 8px 0", color: "var(--accent)", fontSize: "16px" }}>Fees Details:</h4>
            <ul style={{ margin: "0 0 12px 0", paddingLeft: "20px", listStyleType: "disc" }}>
              {/* <li style={{ marginBottom: "6px" }}><strong>Registration Fees :</strong> ₹ 5,000/-</li>
              <li style={{ marginBottom: "6px" }}><strong>Monthly Fees :</strong> ₹ 2,000/- [April & May fees]</li> */}
              <li style={{ marginBottom: "6px" }}><strong>Total Annual Fees :</strong> ₹ 28,000/- (Net fees must be paid before March of the academic year)</li>
              <li style={{ marginBottom: "6px" }}><strong>Details should be submitted :</strong> Birth Certificate, 3 Passport size photos</li>
            </ul>
            <p style={{ margin: "12px 0", color: "#b91c1c", fontWeight: "800", textTransform: "uppercase", fontSize: "14px" }}>
              FEES ONCE PAID WILL NOT BE REFUNDED AT ANY COST
            </p>
          </div>
          <label className="check-row" style={{ marginTop: "16px", borderTop: "1px solid var(--border-soft)", paddingTop: "16px" }}>
            <input name="terms" type="checkbox" required />
            <span>I declare that I have read and understood the above instruction & Fees details.</span>
          </label>
        </FormSection>

        {status ? <p className="form-status">{status}</p> : null}
        <div className="admission-actions">
          <button className={`primary-button ${isFormValid ? "btn-ready" : "btn-not-ready"}`} type="submit">
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
    <DashboardLayout title={title}>
      <section className="admin-placeholder" style={{ padding: 0 }}>
        <p>{description}</p>
        <button className="primary-button" type="button" onClick={runCheck} style={{ marginTop: "1rem" }}>
          {actionLabel}
        </button>
        {status ? <p className="form-status">{status}</p> : null}
      </section>
    </DashboardLayout>
  );
}

export function DashboardView() {
  const [students, setStudents] = useState<ApiStudent[]>([]);
  const [faculty, setFaculty] = useState<ApiFaculty[]>([]);
  const [studentLogs, setStudentLogs] = useState<any[]>([]);
  const [facultyLogs, setFacultyLogs] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Holiday form states
  const [newHolidayDate, setNewHolidayDate] = useState("");
  const [newHolidayName, setNewHolidayName] = useState("");
  const [submittingHoliday, setSubmittingHoliday] = useState(false);
  const [holidayStatus, setHolidayStatus] = useState("");

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  const currentMonthStr = useMemo(() => new Date().toISOString().substring(0, 7), []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [studRes, facRes, studLogsRes, facLogsRes, holidaysRes] = await Promise.all([
        apiRequest<{ students: ApiStudent[] }>("/students"),
        apiRequest<{ results: ApiFaculty[] }>("/faculty?limit=200"),
        apiRequest<any[]>("/attendance/students"),
        apiRequest<any[]>("/attendance/faculty"),
        apiRequest<any[]>("/attendance/holidays")
      ]);

      setStudents(studRes.students || []);
      setFaculty(facRes.results || []);
      setStudentLogs(studLogsRes || []);
      setFacultyLogs(facLogsRes || []);
      setHolidays(holidaysRes || []);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Calculations
  const todayStudentStats = useMemo(() => {
    const activeTotal = students.length;
    const present = studentLogs.filter((r) => r.attendance_date === todayStr && r.status === "present").length;
    const absent = studentLogs.filter((r) => r.attendance_date === todayStr && r.status === "absent").length;
    return { present, total: activeTotal, absent };
  }, [students, studentLogs, todayStr]);

  const todayFacultyStats = useMemo(() => {
    const activeTotal = faculty.length;
    const present = facultyLogs.filter((r) => r.attendance_date === todayStr && r.status === "present").length;
    const absent = facultyLogs.filter((r) => r.attendance_date === todayStr && r.status === "absent").length;
    return { present, total: activeTotal, absent };
  }, [faculty, facultyLogs, todayStr]);

  const monthlyStudentRate = useMemo(() => {
    const monthLogs = studentLogs.filter((r) => r.attendance_date.startsWith(currentMonthStr));
    if (monthLogs.length === 0) return 100;
    const present = monthLogs.filter((r) => r.status === "present").length;
    return Math.round((present / monthLogs.length) * 100);
  }, [studentLogs, currentMonthStr]);

  const monthlyFacultyRate = useMemo(() => {
    const monthLogs = facultyLogs.filter((r) => r.attendance_date.startsWith(currentMonthStr));
    if (monthLogs.length === 0) return 100;
    const present = monthLogs.filter((r) => r.status === "present").length;
    return Math.round((present / monthLogs.length) * 100);
  }, [facultyLogs, currentMonthStr]);

  const flaggedStudents = useMemo(() => {
    const list: { name: string; roll: string; rate: number }[] = [];
    students.forEach((student) => {
      const studentMonthLogs = studentLogs.filter(
        (r) => r.student_id === student.student_id && r.attendance_date.startsWith(currentMonthStr)
      );
      if (studentMonthLogs.length > 0) {
        const presentCount = studentMonthLogs.filter((r) => r.status === "present").length;
        const rate = Math.round((presentCount / studentMonthLogs.length) * 100);
        if (rate < 90) {
          list.push({
            name: [student.first_name, student.last_name].filter(Boolean).join(" ") || "Student",
            roll: student.admission_no || "N/A",
            rate
          });
        }
      }
    });
    return list.sort((a, b) => a.rate - b.rate).slice(0, 5);
  }, [students, studentLogs, currentMonthStr]);

  const upcomingHolidays = useMemo(() => {
    return holidays
      .filter((h) => h.holiday_date >= todayStr)
      .sort((a, b) => a.holiday_date.localeCompare(b.holiday_date))
      .slice(0, 5);
  }, [holidays, todayStr]);

  async function handleAddHoliday(e: FormEvent) {
    e.preventDefault();
    if (!newHolidayDate || !newHolidayName) return;

    setSubmittingHoliday(true);
    setHolidayStatus("");

    try {
      await apiRequest("/attendance/holidays", {
        method: "POST",
        body: JSON.stringify({
          holiday_date: newHolidayDate,
          name: newHolidayName
        })
      });
      setHolidayStatus("Holiday added successfully!");
      setNewHolidayDate("");
      setNewHolidayName("");
      loadData();
    } catch (error) {
      console.error(error);
      setHolidayStatus(error instanceof Error ? error.message : "Failed to add holiday.");
    } finally {
      setSubmittingHoliday(false);
    }
  }

  async function handleDeleteHoliday(holidayId: string) {
    if (!confirm("Are you sure you want to delete this holiday?")) return;
    try {
      await apiRequest(`/attendance/holidays/${holidayId}`, { method: "DELETE" });
      loadData();
    } catch (error) {
      console.error("Failed to delete holiday:", error);
    }
  }

  function formatHolidayDate(dateStr: string) {
    const [year, month, day] = dateStr.split("-");
    const d = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  return (
    <DashboardLayout title="Dashboard">
      <div className="attendance-page-content" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {loading ? (
          <p className="status-message">Loading dashboard metrics...</p>
        ) : (
          <>
            {/* Metric Cards Row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px" }}>
              {/* Card 1: Today's Student Presence */}
              <div className="audit-date-card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <span style={{ fontSize: "11px", textTransform: "uppercase", fontWeight: 700, color: "var(--muted)", letterSpacing: "0.05em" }}>
                  {"Today's Student Presence"}
                </span>
                <span style={{ fontSize: "28px", fontWeight: 800, color: "var(--ink)" }}>
                  {todayStudentStats.present} / {todayStudentStats.total}
                </span>
                <span style={{ fontSize: "11px", color: "var(--muted)" }}>
                  {todayStudentStats.total - todayStudentStats.present - todayStudentStats.absent} unmarked today
                </span>
              </div>

              {/* Card 2: Today's Faculty Presence */}
              <div className="audit-date-card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <span style={{ fontSize: "11px", textTransform: "uppercase", fontWeight: 700, color: "var(--muted)", letterSpacing: "0.05em" }}>
                  {"Today's Faculty Check-ins"}
                </span>
                <span style={{ fontSize: "28px", fontWeight: 800, color: "var(--ink)" }}>
                  {todayFacultyStats.present} / {todayFacultyStats.total}
                </span>
                <span style={{ fontSize: "11px", color: "var(--muted)" }}>
                  {todayFacultyStats.total - todayFacultyStats.present - todayFacultyStats.absent} unmarked today
                </span>
              </div>

              {/* Card 3: Monthly Student Attendance Rate */}
              <div className="audit-date-card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <span style={{ fontSize: "11px", textTransform: "uppercase", fontWeight: 700, color: "var(--muted)", letterSpacing: "0.05em" }}>
                  Student Attendance Rate
                </span>
                <span style={{ fontSize: "28px", fontWeight: 800, color: "#16a34a" }}>
                  {monthlyStudentRate}%
                </span>
                <span style={{ fontSize: "11px", color: "var(--muted)" }}>
                  Average for this month
                </span>
              </div>

              {/* Card 4: Monthly Faculty Attendance Rate */}
              <div className="audit-date-card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <span style={{ fontSize: "11px", textTransform: "uppercase", fontWeight: 700, color: "var(--muted)", letterSpacing: "0.05em" }}>
                  Faculty Attendance Rate
                </span>
                <span style={{ fontSize: "28px", fontWeight: 800, color: "#16a34a" }}>
                  {monthlyFacultyRate}%
                </span>
                <span style={{ fontSize: "11px", color: "var(--muted)" }}>
                  Average for this month
                </span>
              </div>
            </div>

            {/* Two-Column Details Section */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "24px", alignItems: "start" }}>
              {/* Column 1: Custom Holiday Planner */}
              <div className="audit-date-card" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>Custom Holiday Planner</h3>
                
                <form onSubmit={handleAddHoliday} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div className="form-field">
                    <span className="field-label">Holiday Date</span>
                    <input
                      type="date"
                      value={newHolidayDate}
                      onChange={(e) => setNewHolidayDate(e.target.value)}
                      required={true}
                    />
                  </div>
                  <div className="form-field">
                    <span className="field-label">Holiday Name</span>
                    <input
                      type="text"
                      placeholder="e.g. Independence Day"
                      value={newHolidayName}
                      onChange={(e) => setNewHolidayName(e.target.value)}
                      required={true}
                    />
                  </div>
                  <button
                    className="primary-button"
                    type="submit"
                    disabled={submittingHoliday}
                    style={{ minHeight: "38px" }}
                  >
                    {submittingHoliday ? "Adding..." : "Add Holiday"}
                  </button>
                  {holidayStatus && <p className="form-status" style={{ margin: 0 }}>{holidayStatus}</p>}
                </form>

                <div style={{ borderTop: "1px solid var(--border)", paddingTop: "16px" }}>
                  <h4 style={{ margin: "0 0 12px 0", fontSize: "13px", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                    Registered Holidays
                  </h4>
                  {holidays.length === 0 ? (
                    <p style={{ margin: 0, fontSize: "13px", color: "var(--muted)", fontStyle: "italic" }}>
                      No custom holidays registered.
                    </p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "220px", overflowY: "auto" }}>
                      {holidays.map((h) => (
                        <div
                          key={h.holiday_id}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "8px 12px",
                            background: "var(--tint)",
                            borderRadius: "6px",
                            border: "1px solid var(--border-soft)"
                          }}
                        >
                          <div>
                            <span style={{ fontSize: "13px", fontWeight: 600, display: "block" }}>{h.name}</span>
                            <span style={{ fontSize: "11px", color: "var(--muted)" }}>{formatHolidayDate(h.holiday_date)}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteHoliday(h.holiday_id)}
                            style={{
                              background: "none",
                              border: "none",
                              color: "#dc2626",
                              fontSize: "11px",
                              fontWeight: 600,
                              cursor: "pointer",
                              padding: "4px"
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Column 2: Flagged Students & Upcoming Holidays */}
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                {/* Low Attendance Alert */}
                <div className="audit-date-card" style={{ padding: "24px" }}>
                  <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: 700, color: "#b91c1c", display: "flex", alignItems: "center", gap: "8px" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                      <line x1="12" y1="9" x2="12" y2="13" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    Attendance Alert (&lt;90% rate)
                  </h3>
                  {flaggedStudents.length === 0 ? (
                    <p style={{ margin: 0, fontSize: "13px", color: "#15803d", fontStyle: "italic", fontWeight: 500 }}>
                      ✓ All students maintain &gt;90% attendance this month.
                    </p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {flaggedStudents.map((s, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "10px 14px",
                            background: "#fff5f5",
                            borderRadius: "8px",
                            border: "1px solid #fee2e2"
                          }}
                        >
                          <div>
                            <span style={{ fontSize: "13px", fontWeight: 600, color: "#991b1b" }}>{s.name}</span>
                            <span style={{ fontSize: "11px", color: "#b91c1c", display: "block" }}>Roll: {s.roll}</span>
                          </div>
                          <span style={{ fontSize: "13px", fontWeight: 700, color: "#b91c1c" }}>
                            {s.rate}% attendance
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Upcoming Holidays */}
                <div className="audit-date-card" style={{ padding: "24px" }}>
                  <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: 700 }}>Upcoming Holidays</h3>
                  {upcomingHolidays.length === 0 ? (
                    <p style={{ margin: 0, fontSize: "13px", color: "var(--muted)", fontStyle: "italic" }}>
                      No upcoming holidays scheduled.
                    </p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {upcomingHolidays.map((h) => (
                        <div
                          key={h.holiday_id}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "10px 14px",
                            background: "var(--tint)",
                            borderRadius: "8px",
                            border: "1px solid var(--border-soft)"
                          }}
                        >
                          <span style={{ fontSize: "13px", fontWeight: 600 }}>{h.name}</span>
                          <span style={{ fontSize: "12px", color: "var(--muted)", fontWeight: 500 }}>
                            {formatHolidayDate(h.holiday_date)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}


function AdmissionTopBar() {
  return (
    <header className="admission-top-bar">
      <div className="brand-logo">
        <img src="/bdps logo.jpeg" alt="Blooming Daffodils Logo" className="school-logo" />
        <span>Blooming Daffodils</span>
      </div>
      <a href="/login" className="signin-btn">
        Sign In
      </a>
    </header>
  );
}

function ParentBlock({ title, name, prefix, showEmail }: { title: string; name: string; prefix: "father" | "mother"; showEmail?: boolean }) {
  return (
    <div className="parent-block">
      <h4>{title}</h4>
      <Field 
        label="Name" 
        name={`${prefix}_name`} 
        placeholder={name} 
        required={true} 
        pattern="^[A-Za-z .]+$" 
        title="Name must only contain alphabetic letters, spaces, and periods" 
      />
      <Field 
        label="Occupation" 
        name={`${prefix}_occupation`} 
        placeholder="Current profession" 
        required={true} 
      />
      {showEmail && (
        <Field 
          label="Email Address" 
          name="parent_email" 
          placeholder="parent@example.com" 
          required={true}
          type="email"
        />
      )}
      <div className="phone-row">
        <span className="field-label">
          Mobile Number
          <span className="required-asterisk" style={{ color: "#ef4444", marginLeft: "4px" }}>*</span>
        </span>
        <div>
          <select aria-label={`${title} country code`} name={`${prefix}_phone_code`}>
            {PHONE_LOCATIONS.map((location) => (
              <option key={`${location.label}-${location.code}`} value={location.code}>
                {location.code} {location.label}
              </option>
            ))}
          </select>
          <input 
            name={`${prefix}_phone`} 
            placeholder="Phone number" 
            required={true}
            maxLength={10}
            pattern="^[0-9]{10}$"
            title="Mobile number must be exactly 10 digits"
            onInput={(e) => {
              e.currentTarget.value = e.currentTarget.value.replace(/\D/g, '').slice(0, 10);
            }}
          />
        </div>
      </div>
    </div>
  );
}

function ContactRow({ contact, index, onChange }: { contact: EmergencyContact; index: number; onChange: (index: number, key: keyof EmergencyContact, value: string) => void }) {
  const isMandatory = index === 0;
  return (
    <div className="contact-row">
      <span className={index === 0 ? "contact-number" : "contact-number muted"}>{index + 1}</span>
      <input 
        placeholder={`Relation${isMandatory ? " *" : ""}`}
        value={contact.relation} 
        onChange={(event) => onChange(index, "relation", event.target.value)} 
        required={isMandatory}
      />
      <input 
        placeholder={`Name${isMandatory ? " *" : ""}`}
        value={contact.name} 
        onChange={(event) => onChange(index, "name", event.target.value)} 
        required={isMandatory}
        pattern="^[A-Za-z .]+$"
        title="Name must only contain alphabetic letters, spaces, and periods"
      />
      <input 
        placeholder={`Contact Number${isMandatory ? " *" : ""}`}
        value={contact.phone} 
        onChange={(event) => {
          const val = event.target.value.replace(/\D/g, '').slice(0, 10);
          onChange(index, "phone", val);
        }} 
        required={isMandatory}
        maxLength={10}
        pattern="^[0-9]{10}$"
        title="Mobile number must be exactly 10 digits"
      />
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
  required,
  maxLength,
  pattern,
  title,
  onInput,
}: {
  className?: string;
  label: string;
  name: string;
  onChange?: (value: string) => void;
  options?: string[];
  placeholder?: string;
  type?: "date" | "number" | "select" | "textarea" | "text" | "time" | "email";
  value?: string;
  required?: boolean;
  maxLength?: number;
  pattern?: string;
  title?: string;
  onInput?: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  const inputProps = useMemo(
    () => ({
      name,
      required,
      maxLength,
      pattern,
      title,
      ...(onInput ? { onInput } : {}),
      ...(onChange ? { value: value ?? "", onChange: (event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value) } : { defaultValue: value }),
    }),
    [name, onChange, onInput, value, required, maxLength, pattern, title],
  );

  return (
    <label className={`form-field ${className}`}>
      <span className="field-label">
        {label}
        {required && <span className="required-asterisk" style={{ color: "#ef4444", marginLeft: "4px" }}>*</span>}
      </span>
      {type === "select" ? (
        <select
          name={name}
          required={required}
          {...(onChange ? { value: value ?? "", onChange: (event: ChangeEvent<HTMLSelectElement>) => onChange(event.target.value) } : { defaultValue: value })}
        >
          {options.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
      ) : type === "textarea" ? (
        <textarea name={name} placeholder={placeholder} required={required} />
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

function Avatar({ variant = "profile", src }: { variant?: "admin" | "profile" | "student"; src?: string }) {
  if (src) {
    return (
      <span className={`avatar avatar-${variant}`} aria-hidden="true" style={{ overflow: "hidden", display: "inline-block" }}>
        <img src={src} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </span>
    );
  }
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


async function logoutAdmin() {
  const supabase = createClient();
  await supabase.auth.signOut();
  window.location.href = "/login";
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
  clock: (
    <>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
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
  mail: (
    <>
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
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
  phone: (
    <>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
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

export function StudentAttendanceView() {
  const [students, setStudents] = useState<ApiStudent[]>([]);
  const [attendanceDate, setAttendanceDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [records, setRecords] = useState<Record<string, { status: "present" | "absent"; remarks: string }>>({});
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Weekly/Monthly Grid & Tab states
  const [activeTab, setActiveTab] = useState<"mark" | "sheet">("mark");
  const [sheetMode, setSheetMode] = useState<"weekly" | "monthly">("weekly");
  const [allAttendanceRecords, setAllAttendanceRecords] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Monday
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  });
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(currentWeekStart);
      d.setDate(currentWeekStart.getDate() + i);
      days.push(d);
    }
    return days;
  }, [currentWeekStart]);

  const weekRangeLabel = useMemo(() => {
    const start = weekDays[0];
    const end = weekDays[6];
    const opt: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };
    return `${start.toLocaleDateString("en-US", opt)} - ${end.toLocaleDateString("en-US", opt)}`;
  }, [weekDays]);

  function changeWeek(offset: number) {
    setCurrentWeekStart((prev) => {
      const next = new Date(prev);
      next.setDate(prev.getDate() + offset * 7);
      return next;
    });
  }

  const daysInMonth = useMemo(() => {
    if (!selectedMonth) return [];
    const [yearStr, monthStr] = selectedMonth.split("-");
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1; // 0-indexed
    const date = new Date(year, month, 1);
    const days = [];
    while (date.getMonth() === month) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  }, [selectedMonth]);

  const loadStudents = useCallback(() => {
    setLoadingStudents(true);
    setStatus("");
    apiRequest<{ students: ApiStudent[] }>("/students")
      .then((res) => {
        setStudents(res.students || []);
        const initialRecords: Record<string, { status: "present" | "absent"; remarks: string }> = {};
        res.students.forEach((student) => {
          initialRecords[student.student_id] = { status: "present", remarks: "" };
        });
        setRecords(initialRecords);
      })
      .catch((err) => {
        console.error("Failed to load students:", err);
        setStatus("Failed to load student list.");
      })
      .finally(() => setLoadingStudents(false));
  }, []);

  const loadAttendanceRecords = useCallback(() => {
    setLoadingRecords(true);
    Promise.all([
      apiRequest<any[]>("/attendance/students"),
      apiRequest<any[]>("/attendance/holidays")
    ])
      .then(([logs, holidaysList]) => {
        setAllAttendanceRecords(logs || []);
        setHolidays(holidaysList || []);
      })
      .catch((err) => {
        console.error("Failed to load student attendance logs/holidays:", err);
      })
      .finally(() => setLoadingRecords(false));
  }, []);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  useEffect(() => {
    if (activeTab === "sheet") {
      loadAttendanceRecords();
    }
  }, [activeTab, loadAttendanceRecords]);

  const filteredStudents = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return students;
    return students.filter((s) => {
      const name = studentName(s).toLowerCase();
      const roll = (s.admission_no || "").toLowerCase();
      return name.includes(query) || roll.includes(query);
    });
  }, [students, searchQuery]);

  const attendanceStats = useMemo(() => {
    let presentCount = 0;
    let absentCount = 0;
    let weekendCount = 0;

    weekDays.forEach((day) => {
      const dateStr = day.toISOString().split("T")[0];
      const isWeekend = day.getDay() === 0 || day.getDay() === 6;
      const isHoliday = holidays.some((h) => h.holiday_date === dateStr);
      if (isWeekend || isHoliday) {
        weekendCount += filteredStudents.length;
      } else {
        filteredStudents.forEach((stud) => {
          const rec = allAttendanceRecords.find(
            (r) => r.student_id === stud.student_id && r.attendance_date === dateStr
          );
          if (rec) {
            if (rec.status === "present") {
              presentCount++;
            } else if (rec.status === "absent") {
              absentCount++;
            }
          }
        });
      }
    });

    const total = presentCount + absentCount + weekendCount || 1;
    return {
      presentPct: Math.round((presentCount / total) * 100),
      absentPct: Math.round((absentCount / total) * 100),
      weekendPct: Math.round((weekendCount / total) * 100),
      presentCount,
      absentCount,
      weekendCount
    };
  }, [weekDays, filteredStudents, allAttendanceRecords, holidays]);

  const monthlyStats = useMemo(() => {
    let presentCount = 0;
    let absentCount = 0;
    let weekendCount = 0;

    daysInMonth.forEach((day) => {
      const dateStr = day.toISOString().split("T")[0];
      const isWeekend = day.getDay() === 0 || day.getDay() === 6;
      const isHoliday = holidays.some((h) => h.holiday_date === dateStr);
      if (isWeekend || isHoliday) {
        weekendCount += filteredStudents.length;
      } else {
        filteredStudents.forEach((stud) => {
          const rec = allAttendanceRecords.find(
            (r) => r.student_id === stud.student_id && r.attendance_date === dateStr
          );
          if (rec) {
            if (rec.status === "present") {
              presentCount++;
            } else if (rec.status === "absent") {
              absentCount++;
            }
          }
        });
      }
    });

    const total = presentCount + absentCount + weekendCount || 1;
    return {
      presentPct: Math.round((presentCount / total) * 100),
      absentPct: Math.round((absentCount / total) * 100),
      weekendPct: Math.round((weekendCount / total) * 100),
    };
  }, [daysInMonth, filteredStudents, allAttendanceRecords, holidays]);

  function handleStatusChange(studentId: string, newStatus: "present" | "absent") {
    setRecords((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status: newStatus,
      },
    }));
  }

  function handleRemarksChange(studentId: string, newRemarks: string) {
    setRecords((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        remarks: newRemarks,
      },
    }));
  }

  function markAll(status: "present" | "absent") {
    setRecords((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((id) => {
        updated[id] = { ...updated[id], status };
      });
      return updated;
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (students.length === 0) {
      setStatus("No students to mark attendance.");
      return;
    }

    setIsSubmitting(true);
    setStatus("Submitting attendance...");

    const submissionRecords = students.map((student) => ({
      student_id: student.student_id,
      status: records[student.student_id]?.status || "present",
      remarks: records[student.student_id]?.remarks || null,
    }));

    try {
      await apiRequest("/attendance/students", {
        method: "POST",
        body: JSON.stringify({
          class_id: null,
          attendance_date: attendanceDate,
          records: submissionRecords,
        }),
      });
      setStatus("Attendance submitted successfully!");
      loadAttendanceRecords();
    } catch (err) {
      console.error(err);
      setStatus(err instanceof Error ? err.message : "Failed to submit attendance.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <DashboardLayout title="Student Attendance">
      <div className="attendance-page-content">
        <div className="audit-header-section" style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
            <div className="directory-tabs">
              <button
                className={activeTab === "mark" ? "tab-btn active" : "tab-btn"}
                type="button"
                onClick={() => setActiveTab("mark")}
              >
                Mark Attendance
              </button>
              <button
                className={activeTab === "sheet" ? "tab-btn active" : "tab-btn"}
                type="button"
                onClick={() => setActiveTab("sheet")}
              >
                Attendance Sheet
              </button>
            </div>

            {activeTab === "sheet" && (
              <div className="sub-tabs">
                <button
                  className={sheetMode === "weekly" ? "sub-tab-btn active" : "sub-tab-btn"}
                  type="button"
                  onClick={() => setSheetMode("weekly")}
                >
                  Weekly Grid
                </button>
                <button
                  className={sheetMode === "monthly" ? "sub-tab-btn active" : "sub-tab-btn"}
                  type="button"
                  onClick={() => setSheetMode("monthly")}
                >
                  Monthly Grid
                </button>
              </div>
            )}
          </div>

          {activeTab === "sheet" && (
            <div className="audit-filters-container" style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
              {sheetMode === "weekly" ? (
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--ink)", background: "var(--tint)", padding: "8px 16px", borderRadius: "8px", border: "1px solid var(--border)" }}>
                    {weekRangeLabel}
                  </span>
                  <div style={{ display: "flex", gap: "4px" }}>
                    <button
                      className="secondary-button"
                      type="button"
                      onClick={() => changeWeek(-1)}
                      style={{ minHeight: "36px", padding: "0 10px", borderRadius: "8px" }}
                      title="Previous Week"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6"></polyline>
                      </svg>
                    </button>
                    <button
                      className="secondary-button"
                      type="button"
                      onClick={() => changeWeek(1)}
                      style={{ minHeight: "36px", padding: "0 10px", borderRadius: "8px" }}
                      title="Next Week"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6"></polyline>
                      </svg>
                    </button>
                  </div>
                </div>
              ) : (
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="audit-search-input"
                  style={{ margin: 0, width: "200px" }}
                  aria-label="Filter by month"
                />
              )}
              <input
                type="text"
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="audit-search-input"
                style={{ margin: 0 }}
              />
            </div>
          )}
        </div>

        {activeTab === "mark" ? (
          <form onSubmit={handleSubmit}>
            <div className="attendance-filters" style={{ gridTemplateColumns: "1fr" }}>
              <div className="form-field">
                <span className="field-label">Attendance Date</span>
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  required={true}
                />
              </div>
            </div>

            {loadingStudents ? (
              <p className="status-message">Loading students...</p>
            ) : students.length > 0 ? (
              <>
                <div className="attendance-bulk-actions">
                  <button type="button" className="secondary-button" onClick={() => markAll("present")}>
                    Mark All Present
                  </button>
                  <button type="button" className="secondary-button" onClick={() => markAll("absent")}>
                    Mark All Absent
                  </button>
                </div>

                <div className="attendance-table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Roll Number</th>
                        <th>Status</th>
                        <th>Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student) => (
                        <tr key={student.student_id}>
                          <td>
                            <div className="student-profile-cell">
                              <span>{studentName(student)}</span>
                            </div>
                          </td>
                          <td>{student.admission_no || "N/A"}</td>
                          <td>
                            <div className="segmented-control attendance-status-segmented" role="group" aria-label="Attendance Status">
                              <button
                                type="button"
                                className={records[student.student_id]?.status === "present" ? "selected present-active" : ""}
                                onClick={() => handleStatusChange(student.student_id, "present")}
                              >
                                Present
                              </button>
                              <button
                                type="button"
                                className={records[student.student_id]?.status === "absent" ? "selected absent-active" : ""}
                                onClick={() => handleStatusChange(student.student_id, "absent")}
                              >
                                Absent
                              </button>
                            </div>
                          </td>
                          <td>
                            <input
                              type="text"
                              placeholder="Remarks (e.g. late, sick)"
                              value={records[student.student_id]?.remarks || ""}
                              onChange={(e) => handleRemarksChange(student.student_id, e.target.value)}
                              className="table-remarks-input"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="attendance-submit-section">
                  {status ? <p className="form-status" style={{ flex: 1 }}>{status}</p> : null}
                  <button className="primary-button" type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Submitting..." : "Submit Attendance"}
                  </button>
                </div>
              </>
            ) : (
              <p className="status-message">No active students found.</p>
            )}

            {status && students.length === 0 ? <p className="status-message">{status}</p> : null}
          </form>
        ) : (
          /* Attendance Sheet Display grid */
          <>
            {sheetMode === "weekly" ? (
              <>
                {/* Weekly summary stats bar */}
                <div className="attendance-stats-summary">
                  <div className="stat-item">
                    <span className="bullet holiday"></span>
                    <span>Holiday: {attendanceStats.weekendPct}%</span>
                  </div>
                  <div className="stat-item">
                    <span className="bullet present"></span>
                    <span>Present: {attendanceStats.presentPct}%</span>
                  </div>
                  <div className="stat-item">
                    <span className="bullet absent"></span>
                    <span>Absent: {attendanceStats.absentPct}%</span>
                  </div>
                </div>

                {loadingRecords ? (
                  <p className="status-message">Loading attendance records...</p>
                ) : filteredStudents.length > 0 ? (
                  <div className="attendance-grid-container">
                    <table className="attendance-grid-table">
                      <thead>
                        <tr>
                          <th>Student Profile</th>
                          {weekDays.map((day, idx) => {
                            const dateNum = day.getDate();
                            const weekdayStr = day.toLocaleDateString("en-US", { weekday: "short" });
                            return (
                              <th key={idx} style={{ textAlign: "center" }}>
                                <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--ink)" }}>{dateNum}</div>
                                <div style={{ fontSize: "9px", color: "var(--muted)", fontWeight: 500 }}>{weekdayStr}</div>
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStudents.map((student) => {
                          const name = studentName(student);
                          return (
                            <tr key={student.student_id}>
                              <td>
                                <div className="grid-profile-cell">
                                  <Avatar variant="profile" />
                                  <div>
                                    <div className="grid-profile-name">{name}</div>
                                    <div className="grid-profile-code">Roll: {student.admission_no || "N/A"}</div>
                                  </div>
                                </div>
                              </td>
                              {weekDays.map((day, idx) => {
                                const dateStr = day.toISOString().split("T")[0];
                                const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                                
                                // Find record
                                const rec = allAttendanceRecords.find(
                                  (r) => r.student_id === student.student_id && r.attendance_date === dateStr
                                );
                                
                                const customHoliday = holidays.find((h) => h.holiday_date === dateStr);
                                if (isWeekend || customHoliday) {
                                  return (
                                    <td key={idx}>
                                      <div className="grid-attendance-card holiday">
                                        <span className="grid-card-status">Holiday</span>
                                        <span className="grid-card-notes">{customHoliday ? customHoliday.name : "Weekend"}</span>
                                      </div>
                                    </td>
                                  );
                                }
                                
                                if (rec) {
                                  if (rec.status === "present") {
                                    return (
                                      <td key={idx}>
                                        <div className="grid-attendance-card present">
                                          <span className="grid-card-status">Present</span>
                                          {rec.remarks && (
                                            <span className="grid-card-notes" title={rec.remarks}>{rec.remarks}</span>
                                          )}
                                        </div>
                                      </td>
                                    );
                                  } else {
                                    return (
                                      <td key={idx}>
                                        <div className="grid-attendance-card absent">
                                          <span className="grid-card-status">Absent</span>
                                          {rec.remarks && (
                                            <span className="grid-card-notes" title={rec.remarks}>{rec.remarks}</span>
                                          )}
                                        </div>
                                      </td>
                                    );
                                  }
                                }
                                
                                return (
                                  <td key={idx}>
                                    <div className="grid-attendance-card none">
                                      <span className="grid-card-status">—</span>
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="status-message">No students found matching search query.</p>
                )}
              </>
            ) : (
              <>
                {/* Monthly summary stats bar */}
                <div className="attendance-stats-summary">
                  <div className="stat-item">
                    <span className="bullet holiday"></span>
                    <span>Holiday: {monthlyStats.weekendPct}%</span>
                  </div>
                  <div className="stat-item">
                    <span className="bullet present"></span>
                    <span>Present: {monthlyStats.presentPct}%</span>
                  </div>
                  <div className="stat-item">
                    <span className="bullet absent"></span>
                    <span>Absent: {monthlyStats.absentPct}%</span>
                  </div>
                </div>

                {loadingRecords ? (
                  <p className="status-message">Loading attendance records...</p>
                ) : filteredStudents.length > 0 ? (
                  <div className="attendance-grid-container">
                    <table className="attendance-grid-table">
                      <thead>
                        <tr>
                          <th>Student Profile</th>
                          {daysInMonth.map((day, idx) => {
                            const dateNum = day.getDate();
                            const weekdayStr = day.toLocaleDateString("en-US", { weekday: "narrow" });
                            return (
                              <th key={idx} style={{ textAlign: "center", padding: "8px 4px", minWidth: "36px" }}>
                                <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--ink)" }}>{dateNum}</div>
                                <div style={{ fontSize: "8px", color: "var(--muted)", fontWeight: 500 }}>{weekdayStr}</div>
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStudents.map((student) => {
                          const name = studentName(student);
                          return (
                            <tr key={student.student_id}>
                              <td>
                                <div className="grid-profile-cell">
                                  <Avatar variant="profile" />
                                  <div>
                                    <div className="grid-profile-name">{name}</div>
                                    <div className="grid-profile-code">Roll: {student.admission_no || "N/A"}</div>
                                  </div>
                                </div>
                              </td>
                              {daysInMonth.map((day, idx) => {
                                const dateStr = day.toISOString().split("T")[0];
                                const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                                
                                // Find record
                                const rec = allAttendanceRecords.find(
                                  (r) => r.student_id === student.student_id && r.attendance_date === dateStr
                                );
                                
                                const customHoliday = holidays.find((h) => h.holiday_date === dateStr);
                                if (isWeekend || customHoliday) {
                                  return (
                                    <td key={idx} style={{ padding: "4px 2px" }}>
                                      <div className="grid-attendance-dot holiday" title={`${dateStr}: ${customHoliday ? customHoliday.name : "Weekend"}`}>
                                        H
                                      </div>
                                    </td>
                                  );
                                }
                                
                                if (rec) {
                                  const titleText = `${dateStr}: ${rec.status.toUpperCase()}${rec.remarks ? ` - ${rec.remarks}` : ""}`;
                                  if (rec.status === "present") {
                                    return (
                                      <td key={idx} style={{ padding: "4px 2px" }}>
                                        <div className="grid-attendance-dot present" title={titleText}>
                                          P
                                        </div>
                                      </td>
                                    );
                                  } else {
                                    return (
                                      <td key={idx} style={{ padding: "4px 2px" }}>
                                        <div className="grid-attendance-dot absent" title={titleText}>
                                          A
                                        </div>
                                      </td>
                                    );
                                  }
                                }
                                
                                return (
                                  <td key={idx} style={{ padding: "4px 2px" }}>
                                    <div className="grid-attendance-dot none" title={`${dateStr}: No Record`}>
                                      —
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="status-message">No students found matching search query.</p>
                )}
              </>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}


type ApiFaculty = {
  faculty_id: string;
  employee_code?: string;
  first_name?: string;
  last_name?: string;
  designation?: string;
  phone?: string;
  email?: string;
  status?: string;
};

type AuditFacultyRecord = {
  attendance_id: string;
  faculty_id: string;
  attendance_date: string;
  status: string;
  remarks: string | null;
  faculty?: ApiFaculty;
};

export function FacultyAttendanceView() {
  const [faculty, setFaculty] = useState<ApiFaculty[]>([]);
  const [attendanceDate, setAttendanceDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [records, setRecords] = useState<Record<string, { status: "present" | "absent"; checkInTime: string; notes: string }>>({});
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rowSubmitting, setRowSubmitting] = useState<Record<string, boolean>>({});
  const [rowStatus, setRowStatus] = useState<Record<string, string>>({});

  // Consolidated Sheet & Feed States (merged from CheckInAuditView)
  const [activeTab, setActiveTab] = useState<"mark" | "sheet">("mark");
  const [sheetMode, setSheetMode] = useState<"weekly" | "monthly" | "feed">("weekly");
  const [allAttendanceRecords, setAllAttendanceRecords] = useState<AuditFacultyRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Monday
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  });

  const monthOptions = useMemo(() => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      options.push({ label, value });
    }
    return options;
  }, []);

  const getTodayTimeStr = () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  useEffect(() => {
    setLoading(true);
    apiRequest<{ results: ApiFaculty[] }>("/faculty?limit=200")
      .then((res) => {
        setFaculty(res.results || []);
        const initialTime = getTodayTimeStr();
        const initialRecords: Record<string, { status: "present" | "absent"; checkInTime: string; notes: string }> = {};
        res.results.forEach((member) => {
          initialRecords[member.faculty_id] = { status: "present", checkInTime: initialTime, notes: "" };
        });
        setRecords(initialRecords);
      })
      .catch((err) => {
        console.error("Failed to load faculty:", err);
        setStatus("Failed to load faculty list.");
      })
      .finally(() => setLoading(false));
  }, []);

  const loadAttendanceRecords = useCallback(() => {
    setLoadingRecords(true);
    Promise.all([
      apiRequest<AuditFacultyRecord[]>("/attendance/faculty"),
      apiRequest<any[]>("/attendance/holidays")
    ])
      .then(([data, holidaysList]) => {
        setAllAttendanceRecords(data || []);
        setHolidays(holidaysList || []);
      })
      .catch((err) => {
        console.error("Failed to load audit logs/holidays:", err);
      })
      .finally(() => setLoadingRecords(false));
  }, []);

  useEffect(() => {
    if (activeTab === "sheet") {
      loadAttendanceRecords();
    }
  }, [activeTab, loadAttendanceRecords]);

  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(currentWeekStart);
      d.setDate(currentWeekStart.getDate() + i);
      days.push(d);
    }
    return days;
  }, [currentWeekStart]);

  const weekRangeLabel = useMemo(() => {
    const start = weekDays[0];
    const end = weekDays[6];
    const opt: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };
    return `${start.toLocaleDateString("en-US", opt)} - ${end.toLocaleDateString("en-US", opt)}`;
  }, [weekDays]);

  const daysInMonth = useMemo(() => {
    if (!selectedMonth) return [];
    const [yearStr, monthStr] = selectedMonth.split("-");
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1; // 0-indexed
    const date = new Date(year, month, 1);
    const days = [];
    while (date.getMonth() === month) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  }, [selectedMonth]);

  function changeWeek(offset: number) {
    setCurrentWeekStart((prev) => {
      const next = new Date(prev);
      next.setDate(prev.getDate() + offset * 7);
      return next;
    });
  }

  const filteredFaculty = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return faculty;
    return faculty.filter((f) => {
      const name = `${f.first_name || ""} ${f.last_name || ""}`.toLowerCase();
      const code = (f.employee_code || "").toLowerCase();
      return name.includes(query) || code.includes(query);
    });
  }, [faculty, searchQuery]);

  const attendanceStats = useMemo(() => {
    let presentCount = 0;
    let absentCount = 0;
    let weekendCount = 0;

    weekDays.forEach((day) => {
      const dateStr = day.toISOString().split("T")[0];
      const isWeekend = day.getDay() === 0 || day.getDay() === 6;
      const isHoliday = holidays.some((h) => h.holiday_date === dateStr);
      if (isWeekend || isHoliday) {
        weekendCount += filteredFaculty.length;
      } else {
        filteredFaculty.forEach((fac) => {
          const rec = allAttendanceRecords.find(
            (r) => r.faculty_id === fac.faculty_id && r.attendance_date === dateStr
          );
          if (rec) {
            if (rec.status === "present") {
              presentCount++;
            } else if (rec.status === "absent") {
              absentCount++;
            }
          }
        });
      }
    });

    const total = presentCount + absentCount + weekendCount || 1;
    return {
      presentPct: Math.round((presentCount / total) * 100),
      absentPct: Math.round((absentCount / total) * 100),
      weekendPct: Math.round((weekendCount / total) * 100),
    };
  }, [weekDays, filteredFaculty, allAttendanceRecords, holidays]);

  const monthlyStats = useMemo(() => {
    let presentCount = 0;
    let absentCount = 0;
    let weekendCount = 0;

    daysInMonth.forEach((day) => {
      const dateStr = day.toISOString().split("T")[0];
      const isWeekend = day.getDay() === 0 || day.getDay() === 6;
      const isHoliday = holidays.some((h) => h.holiday_date === dateStr);
      if (isWeekend || isHoliday) {
        weekendCount += filteredFaculty.length;
      } else {
        filteredFaculty.forEach((fac) => {
          const rec = allAttendanceRecords.find(
            (r) => r.faculty_id === fac.faculty_id && r.attendance_date === dateStr
          );
          if (rec) {
            if (rec.status === "present") {
              presentCount++;
            } else if (rec.status === "absent") {
              absentCount++;
            }
          }
        });
      }
    });

    const total = presentCount + absentCount + weekendCount || 1;
    return {
      presentPct: Math.round((presentCount / total) * 100),
      absentPct: Math.round((absentCount / total) * 100),
      weekendPct: Math.round((weekendCount / total) * 100),
    };
  }, [daysInMonth, filteredFaculty, allAttendanceRecords, holidays]);

  const filteredFeedRecords = useMemo(() => {
    return allAttendanceRecords.filter((rec) => {
      const monthMatch = rec.attendance_date.startsWith(selectedMonth);
      if (!monthMatch) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const code = rec.faculty?.employee_code?.toLowerCase() || "";
        const name = `${rec.faculty?.first_name || ""} ${rec.faculty?.last_name || ""}`.toLowerCase();
        return code.includes(query) || name.includes(query);
      }

      return true;
    });
  }, [allAttendanceRecords, selectedMonth, searchQuery]);

  const groupedFeedRecords = useMemo(() => {
    const groups: Record<string, AuditFacultyRecord[]> = {};
    const sorted = [...filteredFeedRecords].sort((a, b) => {
      if (a.attendance_date !== b.attendance_date) {
        return b.attendance_date.localeCompare(a.attendance_date);
      }
      const timeA = parseRemarks(a.remarks).time;
      const timeB = parseRemarks(b.remarks).time;
      if (timeA !== timeB) {
        return timeB.localeCompare(timeA);
      }
      return (a.faculty?.employee_code || "").localeCompare(b.faculty?.employee_code || "");
    });

    sorted.forEach((rec) => {
      const dateKey = rec.attendance_date;
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(rec);
    });

    return groups;
  }, [filteredFeedRecords]);

  function parseRemarks(remarksStr: string | null) {
    if (!remarksStr) return { time: "—", notes: "—" };
    try {
      const parsed = JSON.parse(remarksStr);
      return {
        time: parsed.check_in_time || "—",
        notes: parsed.notes || "—",
      };
    } catch {
      return {
        time: "—",
        notes: remarksStr || "—",
      };
    }
  }

  function formatDateHeader(dateStr: string) {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const dateObj = new Date(year, month, day);
      return dateObj.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
    return dateStr;
  }

  function handleStatusChange(facultyId: string, newStatus: "present" | "absent") {
    setRecords((prev) => ({
      ...prev,
      [facultyId]: {
        ...prev[facultyId],
        status: newStatus,
      },
    }));
  }

  function handleCheckInTimeChange(facultyId: string, newTime: string) {
    setRecords((prev) => ({
      ...prev,
      [facultyId]: {
        ...prev[facultyId],
        checkInTime: newTime,
      },
    }));
  }

  function handleNotesChange(facultyId: string, newNotes: string) {
    setRecords((prev) => ({
      ...prev,
      [facultyId]: {
        ...prev[facultyId],
        notes: newNotes,
      },
    }));
  }

  function markAll(status: "present" | "absent") {
    const initialTime = getTodayTimeStr();
    setRecords((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((id) => {
        updated[id] = {
          ...updated[id],
          status,
          checkInTime: updated[id]?.checkInTime || initialTime,
        };
      });
      return updated;
    });
  }

  async function handleIndividualSubmit(memberId: string) {
    setRowSubmitting((prev) => ({ ...prev, [memberId]: true }));
    setRowStatus((prev) => ({ ...prev, [memberId]: "" }));

    const record = records[memberId] || { status: "present", checkInTime: "09:00", notes: "" };
    const remarksJson = JSON.stringify({
      check_in_time: record.status === "present" ? record.checkInTime : null,
      notes: record.notes || "",
    });

    const submissionRecord = {
      faculty_id: memberId,
      status: record.status,
      remarks: remarksJson,
    };

    try {
      await apiRequest("/attendance/faculty", {
        method: "POST",
        body: JSON.stringify({
          attendance_date: attendanceDate,
          records: [submissionRecord],
        }),
      });
      setRowStatus((prev) => ({ ...prev, [memberId]: "Saved ✓" }));
      setTimeout(() => {
        setRowStatus((prev) => ({ ...prev, [memberId]: "" }));
      }, 3000);
      loadAttendanceRecords();
    } catch (err) {
      console.error(err);
      setRowStatus((prev) => ({ ...prev, [memberId]: "Failed" }));
    } finally {
      setRowSubmitting((prev) => ({ ...prev, [memberId]: false }));
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (faculty.length === 0) {
      setStatus("No faculty members to mark attendance.");
      return;
    }

    setIsSubmitting(true);
    setStatus("Submitting attendance...");

    const submissionRecords = faculty.map((member) => {
      const record = records[member.faculty_id] || { status: "present", checkInTime: "09:00", notes: "" };
      const remarksJson = JSON.stringify({
        check_in_time: record.status === "present" ? record.checkInTime : null,
        notes: record.notes || "",
      });

      return {
        faculty_id: member.faculty_id,
        status: record.status,
        remarks: remarksJson,
      };
    });

    try {
      await apiRequest("/attendance/faculty", {
        method: "POST",
        body: JSON.stringify({
          attendance_date: attendanceDate,
          records: submissionRecords,
        }),
      });
      setStatus("Attendance submitted successfully!");
      loadAttendanceRecords();
    } catch (err) {
      console.error(err);
      setStatus(err instanceof Error ? err.message : "Failed to submit attendance.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function facultyName(member: ApiFaculty) {
    return [member.first_name, member.last_name].filter(Boolean).join(" ") || "Faculty Member";
  }

  return (
    <DashboardLayout title="Faculty Attendance">
      <div className="attendance-page-content">
        <div className="audit-header-section" style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
            <div className="directory-tabs">
              <button
                className={activeTab === "mark" ? "tab-btn active" : "tab-btn"}
                type="button"
                onClick={() => setActiveTab("mark")}
              >
                Mark Attendance
              </button>
              <button
                className={activeTab === "sheet" ? "tab-btn active" : "tab-btn"}
                type="button"
                onClick={() => setActiveTab("sheet")}
              >
                Attendance Sheet
              </button>
            </div>

            {activeTab === "sheet" && (
              <div className="sub-tabs">
                <button
                  className={sheetMode === "weekly" ? "sub-tab-btn active" : "sub-tab-btn"}
                  type="button"
                  onClick={() => setSheetMode("weekly")}
                >
                  Weekly Grid
                </button>
                <button
                  className={sheetMode === "monthly" ? "sub-tab-btn active" : "sub-tab-btn"}
                  type="button"
                  onClick={() => setSheetMode("monthly")}
                >
                  Monthly Grid
                </button>
                <button
                  className={sheetMode === "feed" ? "sub-tab-btn active" : "sub-tab-btn"}
                  type="button"
                  onClick={() => setSheetMode("feed")}
                >
                  History Feed
                </button>
              </div>
            )}
          </div>

          {activeTab === "sheet" && (
            <div className="audit-filters-container" style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
              {sheetMode === "weekly" ? (
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--ink)", background: "var(--tint)", padding: "8px 16px", borderRadius: "8px", border: "1px solid var(--border)" }}>
                    {weekRangeLabel}
                  </span>
                  <div style={{ display: "flex", gap: "4px" }}>
                    <button
                      className="secondary-button"
                      type="button"
                      onClick={() => changeWeek(-1)}
                      style={{ minHeight: "36px", padding: "0 10px", borderRadius: "8px" }}
                      title="Previous Week"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6"></polyline>
                      </svg>
                    </button>
                    <button
                      className="secondary-button"
                      type="button"
                      onClick={() => changeWeek(1)}
                      style={{ minHeight: "36px", padding: "0 10px", borderRadius: "8px" }}
                      title="Next Week"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6"></polyline>
                      </svg>
                    </button>
                  </div>
                </div>
              ) : (
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="audit-search-input"
                  style={{ margin: 0, width: "200px" }}
                  aria-label="Filter by month"
                />
              )}
              <input
                type="text"
                placeholder="Search faculty..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="audit-search-input"
                style={{ margin: 0 }}
              />
            </div>
          )}
        </div>

        {activeTab === "mark" ? (
          <form onSubmit={handleSubmit}>
            <div className="attendance-filters" style={{ gridTemplateColumns: "1fr" }}>
              <div className="form-field">
                <span className="field-label">Attendance Date</span>
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  required={true}
                />
              </div>
            </div>

            {loading ? (
              <p className="status-message">Loading faculty directory...</p>
            ) : faculty.length > 0 ? (
              <>
                <div className="attendance-bulk-actions">
                  <button type="button" className="secondary-button" onClick={() => markAll("present")}>
                    Mark All Checked In
                  </button>
                  <button type="button" className="secondary-button" onClick={() => markAll("absent")}>
                    Mark All Absent
                  </button>
                </div>

                <div className="attendance-table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Faculty Member</th>
                        <th>Employee Code</th>
                        <th>Designation</th>
                        <th>Status</th>
                        <th>Check-in Time</th>
                        <th>Notes</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {faculty.map((member) => {
                        const record = records[member.faculty_id] || { status: "present", checkInTime: "09:00", notes: "" };
                        return (
                          <tr key={member.faculty_id}>
                            <td>
                              <div className="faculty-profile-cell">
                                <Avatar variant="profile" />
                                <span>{facultyName(member)}</span>
                              </div>
                            </td>
                            <td>{member.employee_code || "N/A"}</td>
                            <td>{member.designation || "Staff"}</td>
                            <td>
                              <div className="segmented-control attendance-status-segmented" role="group" aria-label="Attendance Status">
                                <button
                                  type="button"
                                  className={record.status === "present" ? "selected present-active" : ""}
                                  onClick={() => handleStatusChange(member.faculty_id, "present")}
                                >
                                  Checked In
                                </button>
                                <button
                                  type="button"
                                  className={record.status === "absent" ? "selected absent-active" : ""}
                                  onClick={() => handleStatusChange(member.faculty_id, "absent")}
                                >
                                  Absent
                                </button>
                              </div>
                            </td>
                            <td>
                              {record.status === "present" ? (
                                <input
                                  type="time"
                                  value={record.checkInTime}
                                  onChange={(e) => handleCheckInTimeChange(member.faculty_id, e.target.value)}
                                  className="table-time-input"
                                />
                              ) : (
                                <span style={{ color: "var(--muted)" }}>—</span>
                              )}
                            </td>
                            <td>
                              <input
                                type="text"
                                placeholder="Notes (optional)"
                                value={record.notes}
                                onChange={(e) => handleNotesChange(member.faculty_id, e.target.value)}
                                className="table-remarks-input"
                              />
                            </td>
                            <td>
                              <div className="row-actions-cell" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <button
                                  type="button"
                                  className="row-submit-button"
                                  onClick={() => handleIndividualSubmit(member.faculty_id)}
                                  disabled={rowSubmitting[member.faculty_id]}
                                >
                                  {rowSubmitting[member.faculty_id]
                                    ? "Saving..."
                                    : record.status === "present"
                                    ? "Check In"
                                    : "Save Absent"}
                                </button>
                                {rowStatus[member.faculty_id] && (
                                  <span
                                    className={`row-status-indicator ${
                                      rowStatus[member.faculty_id].includes("Saved") ? "success" : "error"
                                    }`}
                                  >
                                    {rowStatus[member.faculty_id]}
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="attendance-submit-section">
                  {status ? <p className="form-status" style={{ flex: 1 }}>{status}</p> : null}
                  <button className="primary-button" type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Submitting..." : "Submit Attendance"}
                  </button>
                </div>
              </>
            ) : (
              <p className="status-message">No active faculty found.</p>
            )}

            {status && faculty.length === 0 ? <p className="status-message">{status}</p> : null}
          </form>
        ) : (
          /* Attendance Sheets display */
          <>
            {sheetMode === "weekly" ? (
              <>
                <div className="attendance-stats-summary">
                  <div className="stat-item">
                    <span className="bullet holiday"></span>
                    <span>Holiday: {attendanceStats.weekendPct}%</span>
                  </div>
                  <div className="stat-item">
                    <span className="bullet present"></span>
                    <span>Checked In: {attendanceStats.presentPct}%</span>
                  </div>
                  <div className="stat-item">
                    <span className="bullet absent"></span>
                    <span>Absent: {attendanceStats.absentPct}%</span>
                  </div>
                </div>

                {loadingRecords ? (
                  <p className="status-message">Loading attendance records...</p>
                ) : filteredFaculty.length > 0 ? (
                  <div className="attendance-grid-container">
                    <table className="attendance-grid-table">
                      <thead>
                        <tr>
                          <th>Staff Profile</th>
                          {weekDays.map((day, idx) => {
                            const dateNum = day.getDate();
                            const weekdayStr = day.toLocaleDateString("en-US", { weekday: "short" });
                            return (
                              <th key={idx} style={{ textAlign: "center" }}>
                                <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--ink)" }}>{dateNum}</div>
                                <div style={{ fontSize: "9px", color: "var(--muted)", fontWeight: 500 }}>{weekdayStr}</div>
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredFaculty.map((member) => {
                          const name = facultyName(member);
                          return (
                            <tr key={member.faculty_id}>
                              <td>
                                <div className="grid-profile-cell">
                                  <Avatar variant="profile" />
                                  <div>
                                    <div className="grid-profile-name">{name}</div>
                                    <div className="grid-profile-code">Code: {member.employee_code || "N/A"}</div>
                                  </div>
                                </div>
                              </td>
                              {weekDays.map((day, idx) => {
                                const dateStr = day.toISOString().split("T")[0];
                                const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                                
                                // Find record
                                const rec = allAttendanceRecords.find(
                                  (r) => r.faculty_id === member.faculty_id && r.attendance_date === dateStr
                                );
                                
                                const customHoliday = holidays.find((h) => h.holiday_date === dateStr);
                                if (isWeekend || customHoliday) {
                                  return (
                                    <td key={idx}>
                                      <div className="grid-attendance-card holiday">
                                        <span className="grid-card-status">Holiday</span>
                                        <span className="grid-card-notes">{customHoliday ? customHoliday.name : "Weekend"}</span>
                                      </div>
                                    </td>
                                  );
                                }
                                
                                if (rec) {
                                  const { time, notes } = parseRemarks(rec.remarks);
                                  if (rec.status === "present") {
                                    return (
                                      <td key={idx}>
                                        <div className="grid-attendance-card present">
                                          <span className="grid-card-status">Present</span>
                                          <span className="grid-card-time">{time !== "—" ? time : "09:00"}</span>
                                          {notes && notes !== "—" && (
                                            <span className="grid-card-notes" title={notes}>{notes}</span>
                                          )}
                                        </div>
                                      </td>
                                    );
                                  } else {
                                    return (
                                      <td key={idx}>
                                        <div className="grid-attendance-card absent">
                                          <span className="grid-card-status">Absent</span>
                                          {notes && notes !== "—" && (
                                            <span className="grid-card-notes" title={notes}>{notes}</span>
                                          )}
                                        </div>
                                      </td>
                                    );
                                  }
                                }
                                
                                return (
                                  <td key={idx}>
                                    <div className="grid-attendance-card none">
                                      <span className="grid-card-status">—</span>
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="status-message">No faculty members found matching search query.</p>
                )}
              </>
            ) : sheetMode === "monthly" ? (
              <>
                <div className="attendance-stats-summary">
                  <div className="stat-item">
                    <span className="bullet holiday"></span>
                    <span>Holiday: {monthlyStats.weekendPct}%</span>
                  </div>
                  <div className="stat-item">
                    <span className="bullet present"></span>
                    <span>Checked In: {monthlyStats.presentPct}%</span>
                  </div>
                  <div className="stat-item">
                    <span className="bullet absent"></span>
                    <span>Absent: {monthlyStats.absentPct}%</span>
                  </div>
                </div>

                {loadingRecords ? (
                  <p className="status-message">Loading attendance records...</p>
                ) : filteredFaculty.length > 0 ? (
                  <div className="attendance-grid-container">
                    <table className="attendance-grid-table">
                      <thead>
                        <tr>
                          <th>Staff Profile</th>
                          {daysInMonth.map((day, idx) => {
                            const dateNum = day.getDate();
                            const weekdayStr = day.toLocaleDateString("en-US", { weekday: "narrow" });
                            return (
                              <th key={idx} style={{ textAlign: "center", padding: "8px 4px", minWidth: "36px" }}>
                                <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--ink)" }}>{dateNum}</div>
                                <div style={{ fontSize: "8px", color: "var(--muted)", fontWeight: 500 }}>{weekdayStr}</div>
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredFaculty.map((member) => {
                          const name = facultyName(member);
                          return (
                            <tr key={member.faculty_id}>
                              <td>
                                <div className="grid-profile-cell">
                                  <Avatar variant="profile" />
                                  <div>
                                    <div className="grid-profile-name">{name}</div>
                                    <div className="grid-profile-code">Code: {member.employee_code || "N/A"}</div>
                                  </div>
                                </div>
                              </td>
                              {daysInMonth.map((day, idx) => {
                                const dateStr = day.toISOString().split("T")[0];
                                const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                                
                                // Find record
                                const rec = allAttendanceRecords.find(
                                  (r) => r.faculty_id === member.faculty_id && r.attendance_date === dateStr
                                );
                                
                                const customHoliday = holidays.find((h) => h.holiday_date === dateStr);
                                if (isWeekend || customHoliday) {
                                  return (
                                    <td key={idx} style={{ padding: "4px 2px" }}>
                                      <div className="grid-attendance-dot holiday" title={`${dateStr}: ${customHoliday ? customHoliday.name : "Weekend"}`}>
                                        H
                                      </div>
                                    </td>
                                  );
                                }
                                
                                if (rec) {
                                  const { time, notes } = parseRemarks(rec.remarks);
                                  const formattedTime = time !== "—" ? time : "09:00";
                                  const titleText = `${dateStr}: ${rec.status.toUpperCase()}${rec.status === "present" ? ` at ${formattedTime}` : ""}${notes && notes !== "—" ? ` - ${notes}` : ""}`;
                                  
                                  if (rec.status === "present") {
                                    return (
                                      <td key={idx} style={{ padding: "4px 2px" }}>
                                        <div className="grid-attendance-dot present" title={titleText}>
                                          P
                                        </div>
                                      </td>
                                    );
                                  } else {
                                    return (
                                      <td key={idx} style={{ padding: "4px 2px" }}>
                                        <div className="grid-attendance-dot absent" title={titleText}>
                                          A
                                        </div>
                                      </td>
                                    );
                                  }
                                }
                                
                                return (
                                  <td key={idx} style={{ padding: "4px 2px" }}>
                                    <div className="grid-attendance-dot none" title={`${dateStr}: No Record`}>
                                      —
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="status-message">No faculty members found matching search query.</p>
                )}
              </>
            ) : (
              /* History Feed mode */
              <>
                {loadingRecords ? (
                  <p className="status-message">Loading audit logs...</p>
                ) : Object.keys(groupedFeedRecords).length > 0 ? (
                  <div className="audit-feed">
                    {Object.entries(groupedFeedRecords).map(([dateStr, dayRecords]) => {
                      const dayPresentCount = dayRecords.filter((r) => r.status === "present").length;
                      const dayAbsentCount = dayRecords.filter((r) => r.status === "absent").length;

                      return (
                        <div key={dateStr} className="audit-date-card" style={{ padding: 0, overflow: "hidden" }}>
                          <div className="audit-date-header">
                            <div className="audit-date-title-wrapper" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span className="audit-calendar-icon" aria-hidden="true" style={{ display: "flex", alignItems: "center" }}>
                                <Icon name="calendar" />
                              </span>
                              <h4>{formatDateHeader(dateStr)}</h4>
                            </div>
                            <div className="audit-date-stats">
                              <span className="stats-badge present">{dayPresentCount} Present</span>
                              {dayAbsentCount > 0 && <span className="stats-badge absent">{dayAbsentCount} Absent</span>}
                            </div>
                          </div>
                          <div className="audit-date-body" style={{ padding: "8px 0" }}>
                            <div className="audit-log-list">
                              {dayRecords.map((rec) => {
                                const name = rec.faculty
                                  ? `${rec.faculty.first_name} ${rec.faculty.last_name || ""}`.trim()
                                  : "Faculty Member";
                                const { time, notes } = parseRemarks(rec.remarks);

                                return (
                                  <div key={rec.attendance_id} className="audit-log-item">
                                    <div className="audit-log-faculty-info" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                      <Avatar variant="profile" />
                                      <div className="audit-log-faculty-meta">
                                        <span className="faculty-name" style={{ display: "block", fontSize: "14px", fontWeight: 600 }}>{name}</span>
                                        <span className="faculty-code" style={{ fontSize: "11px", color: "var(--muted)" }}>{rec.faculty?.employee_code || "N/A"}</span>
                                      </div>
                                    </div>

                                    <div className="audit-log-status">
                                      <span className={`status-pill ${rec.status === "present" ? "present" : "absent"}`}>
                                        {rec.status === "present" ? "Checked In" : "Absent"}
                                      </span>
                                    </div>

                                    <div className="audit-log-time" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                      {rec.status === "present" ? (
                                        <>
                                          <span className="time-icon" aria-hidden="true" style={{ display: "flex", alignItems: "center" }}>
                                            <Icon name="clock" />
                                          </span>
                                          <span className="time-value">{time}</span>
                                        </>
                                      ) : (
                                        <span className="time-value absent-time" style={{ color: "var(--muted)" }}>—</span>
                                      )}
                                    </div>

                                    <div className="audit-log-notes">
                                      <span className="notes-label" style={{ marginRight: "4px" }}>Notes:</span>
                                      <span className="notes-value">{notes}</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="status-message">No check-in records found for this criteria.</p>
                )}
              </>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}


export function FacultyManagementView() {
  const [faculty, setFaculty] = useState<ApiFaculty[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"active" | "inactive">("active");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  // Drawer states
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"add" | "edit">("add");
  const [editingFaculty, setEditingFaculty] = useState<ApiFaculty | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [drawerError, setDrawerError] = useState("");

  const [formData, setFormData] = useState({
    employee_code: "",
    first_name: "",
    last_name: "",
    designation: "Teacher",
    phone: "",
    email: "",
    joining_date: "",
    status: "active"
  });

  const loadFaculty = useCallback(() => {
    setLoading(true);
    setStatus("");
    
    Promise.all([
      apiRequest<{ results: ApiFaculty[] }>("/faculty?status=active&limit=250"),
      apiRequest<{ results: ApiFaculty[] }>("/faculty?status=inactive&limit=250")
    ])
      .then(([activeRes, inactiveRes]) => {
        const active = (activeRes.results || []).map(f => ({ ...f, status: "active" }));
        const inactive = (inactiveRes.results || []).map(f => ({ ...f, status: "inactive" }));
        setFaculty([...active, ...inactive]);
      })
      .catch((err) => {
        console.error("Failed to load faculty directory:", err);
        setStatus("Failed to load faculty directory.");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadFaculty();
  }, [loadFaculty]);

  const filteredFaculty = useMemo(() => {
    const statusFiltered = faculty.filter(f => f.status === statusFilter);
    const query = searchQuery.toLowerCase().trim();
    if (!query) return statusFiltered;
    return statusFiltered.filter((f) => {
      const code = (f.employee_code || "").toLowerCase();
      const name = `${f.first_name || ""} ${f.last_name || ""}`.toLowerCase();
      const desig = (f.designation || "").toLowerCase();
      const phone = (f.phone || "").toLowerCase();
      const email = (f.email || "").toLowerCase();
      return (
        code.includes(query) ||
        name.includes(query) ||
        desig.includes(query) ||
        phone.includes(query) ||
        email.includes(query)
      );
    });
  }, [faculty, statusFilter, searchQuery]);

  function openAddDrawer() {
    setDrawerMode("add");
    setEditingFaculty(null);
    setDrawerError("");
    setFormData({
      employee_code: "",
      first_name: "",
      last_name: "",
      designation: "Teacher",
      phone: "",
      email: "",
      joining_date: new Date().toISOString().split("T")[0],
      status: "active"
    });
    setIsDrawerOpen(true);
  }

  function openEditDrawer(member: ApiFaculty) {
    setDrawerMode("edit");
    setEditingFaculty(member);
    setDrawerError("");
    setFormData({
      employee_code: member.employee_code || "",
      first_name: member.first_name || "",
      last_name: member.last_name || "",
      designation: member.designation || "Teacher",
      phone: member.phone || "",
      email: member.email || "",
      joining_date: new Date().toISOString().split("T")[0], // Fallback or retrieve if joining_date was selected
      status: member.status || "active"
    });
    setIsDrawerOpen(true);
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setDrawerError("");
    setIsSubmitting(true);

    const payload = {
      employee_code: formData.employee_code.trim(),
      first_name: formData.first_name.trim(),
      last_name: formData.last_name.trim() || null,
      designation: formData.designation.trim() || "Teacher",
      phone: formData.phone.trim() || null,
      email: formData.email.trim() || null,
      joining_date: formData.joining_date || null,
      status: formData.status
    };

    try {
      if (drawerMode === "add") {
        await apiRequest("/faculty", {
          method: "POST",
          body: JSON.stringify(payload)
        });
      } else {
        await apiRequest(`/faculty/${editingFaculty?.faculty_id}`, {
          method: "PUT",
          body: JSON.stringify(payload)
        });
      }
      setIsDrawerOpen(false);
      loadFaculty();
    } catch (err) {
      console.error(err);
      setDrawerError(err instanceof Error ? err.message : "Failed to save faculty member.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(facultyId: string) {
    if (!confirm("Are you sure you want to delete this faculty member? This will also delete all their related attendance logs.")) {
      return;
    }

    try {
      await apiRequest(`/faculty/${facultyId}`, {
        method: "DELETE"
      });
      loadFaculty();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Failed to delete faculty member.");
    }
  }

  const totalCount = faculty.length;
  const activeCount = faculty.filter((f) => f.status === "active").length;
  const inactiveCount = faculty.filter((f) => f.status === "inactive").length;

  return (
    <DashboardLayout title="Faculty Directory">
      <div className="attendance-page-content">
        <div className="stat-card-row">
          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-card-title">Total Staff</span>
              <div className="stat-card-icon-wrapper">
                <Icon name="students" />
              </div>
            </div>
            <div className="stat-card-body">
              <span className="stat-card-value">{totalCount}</span>
            </div>
            <div className="stat-card-footer">Total registered faculty members</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-card-title">Active Staff</span>
              <div className="stat-card-icon-wrapper">
                <Icon name="user" />
              </div>
            </div>
            <div className="stat-card-body">
              <span className="stat-card-value">{activeCount}</span>
              <span className="stat-card-trend up">
                {totalCount > 0 ? `${Math.round((activeCount / totalCount) * 100)}%` : "0%"}
              </span>
            </div>
            <div className="stat-card-footer">Currently active personnel</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-card-title">Inactive / Archived</span>
              <div className="stat-card-icon-wrapper">
                <Icon name="chart" />
              </div>
            </div>
            <div className="stat-card-body">
              <span className="stat-card-value">{inactiveCount}</span>
              <span className="stat-card-trend neutral">
                {totalCount > 0 ? `${Math.round((inactiveCount / totalCount) * 100)}%` : "0%"}
              </span>
            </div>
            <div className="stat-card-footer">Exited or inactive profiles</div>
          </div>
        </div>

        <div className="audit-header-section" style={{ marginBottom: "20px" }}>
          <h3>Manage Faculty Directory</h3>
          <div className="audit-filters-container">
            <select
              aria-label="Filter status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "active" | "inactive")}
            >
              <option value="active">Active Staff</option>
              <option value="inactive">Inactive Staff</option>
            </select>
            <input
              type="text"
              placeholder="Search faculty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="audit-search-input"
            />
            <button className="primary-button" type="button" onClick={openAddDrawer}>
              Add Faculty
            </button>
          </div>
        </div>

        {loading ? (
          <p className="status-message">Loading faculty directory...</p>
        ) : filteredFaculty.length > 0 ? (
          <div className="attendance-table-container">
            <table>
              <thead>
                <tr>
                  <th>Faculty</th>
                  <th>Designation</th>
                  <th>Contact Info</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFaculty.map((member) => {
                  const name = [member.first_name, member.last_name].filter(Boolean).join(" ") || "Faculty Member";
                  return (
                    <tr key={member.faculty_id}>
                      <td>
                        <div className="faculty-profile-cell">
                          <Avatar variant="profile" />
                          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                            <span style={{ fontWeight: 600, color: "var(--ink)" }}>{name}</span>
                            <span style={{ fontSize: "11px", color: "var(--muted)", fontWeight: 500 }}>
                              Code: {member.employee_code || "N/A"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 500 }}>{member.designation || "Staff"}</span>
                      </td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          {member.phone && (
                            <span style={{ fontSize: "13px", fontWeight: 500 }}>{member.phone}</span>
                          )}
                          {member.email && (
                            <span style={{ fontSize: "11px", color: "var(--muted)" }}>{member.email}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`status-pill ${member.status === "active" ? "present" : "absent"}`}>
                          {member.status === "active" ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                          <button
                            className="secondary-button"
                            type="button"
                            onClick={() => openEditDrawer(member)}
                            style={{ minHeight: "32px", padding: "0 14px", fontSize: "10px", borderRadius: "9999px" }}
                          >
                            Edit
                          </button>
                          <button
                            className="row-submit-button danger-btn"
                            type="button"
                            onClick={() => handleDelete(member.faculty_id)}
                            style={{
                              minHeight: "32px",
                              padding: "0 14px",
                              fontSize: "10px",
                              borderRadius: "9999px",
                              background: "#fee2e2",
                              color: "#b91c1c",
                              border: "1px solid #fee2e2",
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="status-message">No faculty members found for this criteria.</p>
        )}

        {status && <p className="status-message">{status}</p>}
      </div>

      {isDrawerOpen && (
        <div className="drawer-overlay" onClick={() => setIsDrawerOpen(false)}>
          <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h3>{drawerMode === "add" ? "Add New Faculty" : "Edit Faculty"}</h3>
              <button
                className="drawer-close-btn"
                onClick={() => setIsDrawerOpen(false)}
                aria-label="Close drawer"
                type="button"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSave} className="drawer-body">
              <label className="form-field">
                <span className="field-label">
                  Employee Code <span style={{ color: "#ef4444" }}>*</span>
                </span>
                <input
                  type="text"
                  required
                  placeholder="e.g. FAC-04"
                  value={formData.employee_code}
                  onChange={(e) => setFormData((prev) => ({ ...prev, employee_code: e.target.value }))}
                  disabled={drawerMode === "edit"}
                />
              </label>

              <label className="form-field">
                <span className="field-label">
                  First Name <span style={{ color: "#ef4444" }}>*</span>
                </span>
                <input
                  type="text"
                  required
                  placeholder="First Name"
                  value={formData.first_name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, first_name: e.target.value }))}
                />
              </label>

              <label className="form-field">
                <span className="field-label">Last Name</span>
                <input
                  type="text"
                  placeholder="Last Name (optional)"
                  value={formData.last_name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, last_name: e.target.value }))}
                />
              </label>

              <label className="form-field">
                <span className="field-label">Designation</span>
                <input
                  type="text"
                  placeholder="e.g. Teacher"
                  value={formData.designation}
                  onChange={(e) => setFormData((prev) => ({ ...prev, designation: e.target.value }))}
                />
              </label>

              <label className="form-field">
                <span className="field-label">Phone Number</span>
                <input
                  type="text"
                  placeholder="e.g. +919999990001"
                  value={formData.phone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                />
              </label>

              <label className="form-field">
                <span className="field-label">Email Address</span>
                <input
                  type="email"
                  placeholder="e.g. saraswathi@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                />
              </label>

              <label className="form-field">
                <span className="field-label">Joining Date</span>
                <input
                  type="date"
                  value={formData.joining_date}
                  onChange={(e) => setFormData((prev) => ({ ...prev, joining_date: e.target.value }))}
                />
              </label>

              <label className="form-field">
                <span className="field-label">Status</span>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </label>

              {drawerError && (
                <p className="form-status error" style={{ color: "#b91c1c", margin: "12px 0 0 0" }}>
                  {drawerError}
                </p>
              )}

              <div className="drawer-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setIsDrawerOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-button" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Faculty"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}


export function StudentManagementView() {
  const [students, setStudents] = useState<ApiStudent[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"active" | "inactive">("active");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  // Detailed Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<ApiStudent | null>(null);

  // Tabular Registry state
  const [viewMode, setViewMode] = useState<"list" | "detailed">("list");
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [selectedStudentData, setSelectedStudentData] = useState<{
    student: ApiStudent;
    parents?: any;
    emergency_contacts?: any[];
    siblings?: any[];
    references?: any[];
  } | null>(null);

  const loadStudents = useCallback(() => {
    setLoading(true);
    setStatus("");
    
    Promise.all([
      apiRequest<{ students: ApiStudent[] }>("/students?status=active"),
      apiRequest<{ students: ApiStudent[] }>("/students?status=inactive")
    ])
      .then(([activeRes, inactiveRes]) => {
        const active = (activeRes.students || []).map(s => ({ ...s, status: "active" }));
        const inactive = (inactiveRes.students || []).map(s => ({ ...s, status: "inactive" }));
        setStudents([...active, ...inactive]);
      })
      .catch((err) => {
        console.error("Failed to load students directory:", err);
        setStatus("Failed to load students directory.");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const filteredStudents = useMemo(() => {
    const statusFiltered = students.filter(s => s.status === statusFilter);
    const query = searchQuery.toLowerCase().trim();
    if (!query) return statusFiltered;
    return statusFiltered.filter((s) => {
      const adNo = (s.admission_no || "").toLowerCase();
      const name = `${s.first_name || ""} ${s.last_name || ""}`.toLowerCase();
      const className = (s.class_name || "").toLowerCase();
      const pName = (s.parent_name || "").toLowerCase();
      const pPhone = (s.parent_phone || "").toLowerCase();
      const pEmail = (s.parent_email || "").toLowerCase();
      return (
        adNo.includes(query) ||
        name.includes(query) ||
        className.includes(query) ||
        pName.includes(query) ||
        pPhone.includes(query) ||
        pEmail.includes(query)
      );
    });
  }, [students, statusFilter, searchQuery]);

  async function handleToggleStatus(student: ApiStudent) {
    const newStatus = student.status === "active" ? "inactive" : "active";
    try {
      await apiRequest(`/students/${student.student_id}`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus }),
      });
      // If selected student is open in modal, update status inline
      if (selectedStudent && selectedStudent.student_id === student.student_id) {
        setSelectedStudent((prev) => prev ? { ...prev, status: newStatus } : null);
      }
      loadStudents();
    } catch (err) {
      console.error("Failed to toggle status:", err);
      alert(err instanceof Error ? err.message : "Failed to toggle status.");
    }
  }

  async function handleViewDetails(student: ApiStudent) {
    setSelectedStudent(student);
    setIsModalOpen(true);
    setLoadingDetails(true);
    setSelectedStudentData({ student });
    try {
      const data = await apiRequest<any>(`/students/${student.student_id}`);
      setSelectedStudentData(data);
    } catch (err) {
      console.error("Failed to load student details:", err);
    } finally {
      setLoadingDetails(false);
    }
  }

  function downloadXLSX() {
    if (!students || students.length === 0) return;
    
    // Prepare raw data
    const data = students.map((s) => ({
      "Admission No": s.admission_no || "",
      "First Name": s.first_name || "",
      "Last Name": s.last_name || "",
      "Class": s.class_name || "Unassigned",
      "Gender": s.gender || "",
      "Date of Birth": s.dob || "",
      "Mother Tongue": s.mother_tongue || "",
      "Blood Group": s.blood_group || "",
      "Allergies": s.allergy_food || "",
      "Parent Name": s.parent_name || "",
      "Parent Phone": s.parent_phone || "",
      "Parent Email": s.parent_email || "",
      "Address": s.address || "",
      "Status": s.status || "",
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Students");
    
    // Generate buffer
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    
    // Create blob and trigger download
    const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `student_records_${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const totalCount = students.length;
  const activeCount = students.filter((s) => s.status === "active").length;
  const inactiveCount = students.filter((s) => s.status === "inactive").length;

  return (
    <DashboardLayout title="Student Directory">
      <div className="attendance-page-content">
        <div className="stat-card-row">
          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-card-title">Total Registered</span>
              <div className="stat-card-icon-wrapper">
                <Icon name="students" />
              </div>
            </div>
            <div className="stat-card-body">
              <span className="stat-card-value">{totalCount}</span>
            </div>
            <div className="stat-card-footer">Total enrolled students</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-card-title">Active Students</span>
              <div className="stat-card-icon-wrapper">
                <Icon name="user" />
              </div>
            </div>
            <div className="stat-card-body">
              <span className="stat-card-value">{activeCount}</span>
              <span className="stat-card-trend up">
                {totalCount > 0 ? `${Math.round((activeCount / totalCount) * 100)}%` : "0%"}
              </span>
            </div>
            <div className="stat-card-footer">Currently active enrollment</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-card-title">Inactive / Archived</span>
              <div className="stat-card-icon-wrapper">
                <Icon name="chart" />
              </div>
            </div>
            <div className="stat-card-body">
              <span className="stat-card-value">{inactiveCount}</span>
              <span className="stat-card-trend neutral">
                {totalCount > 0 ? `${Math.round((inactiveCount / totalCount) * 100)}%` : "0%"}
              </span>
            </div>
            <div className="stat-card-footer">Withdrawn or inactive profiles</div>
          </div>
        </div>

        <div className="audit-header-section" style={{ marginBottom: "20px", display: "flex", flexDirection: "column", gap: "16px", alignItems: "stretch" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3>Manage Student Directory</h3>
            <button
              className="primary-button"
              onClick={downloadXLSX}
              style={{ minHeight: "36px", padding: "0 18px", fontSize: "10px" }}
            >
              Download XLSX
            </button>
          </div>
          <div className="audit-filters-container" style={{ display: "flex", justifyContent: "space-between", gap: "16px", flexWrap: "wrap", width: "100%" }}>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <div className="directory-tabs">
                <button
                  className={statusFilter === "active" ? "tab-btn active" : "tab-btn"}
                  type="button"
                  onClick={() => setStatusFilter("active")}
                >
                  Active Students
                </button>
                <button
                  className={statusFilter === "inactive" ? "tab-btn active" : "tab-btn"}
                  type="button"
                  onClick={() => setStatusFilter("inactive")}
                >
                  Inactive / Archived
                </button>
              </div>

              <div className="directory-tabs">
                <button
                  className={viewMode === "list" ? "tab-btn active" : "tab-btn"}
                  type="button"
                  onClick={() => setViewMode("list")}
                >
                  Directory View
                </button>
                <button
                  className={viewMode === "detailed" ? "tab-btn active" : "tab-btn"}
                  type="button"
                  onClick={() => setViewMode("detailed")}
                >
                  Detailed Registry
                </button>
              </div>
            </div>

            <input
              type="text"
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="audit-search-input"
              style={{ margin: 0 }}
            />
          </div>
        </div>

        {loading ? (
          <p className="status-message">Loading student directory...</p>
        ) : filteredStudents.length > 0 ? (
          viewMode === "list" ? (
            <div className="student-grid-directory">
              {filteredStudents.map((student) => {
                const name = [student.first_name, student.last_name].filter(Boolean).join(" ") || "Student";
                return (
                  <div key={student.student_id} className="student-card-directory" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '24px' }}>
                    <div className="student-card-avatar-wrapper" style={{ marginBottom: '12px' }}>
                      <Avatar variant="student" src={student.photo_url} />
                    </div>
                    <div className="student-card-name" style={{ marginBottom: '8px', fontSize: '18px' }}>{name}</div>
                    <div style={{ marginBottom: '20px' }}>
                      <span className={`status-pill ${student.status === 'active' ? 'present' : 'absent'}`}>
                        {student.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="student-card-actions" style={{ display: 'flex', gap: '8px', width: '100%', marginTop: 'auto' }}>
                      <button
                        className="secondary-button"
                        type="button"
                        onClick={() => handleViewDetails(student)}
                        style={{ flex: 1, minHeight: '36px', padding: '0 14px', fontSize: '10px', borderRadius: '9999px' }}
                      >
                        Details
                      </button>
                      <button
                        className="row-submit-button"
                        type="button"
                        onClick={() => handleToggleStatus(student)}
                        style={{
                          flex: 1,
                          minHeight: '36px',
                          padding: '0 14px',
                          fontSize: '10px',
                          borderRadius: '9999px',
                          ...(student.status === 'active'
                            ? { background: '#fee2e2', color: '#b91c1c', border: '1px solid #fee2e2' }
                            : { background: '#dcfce7', color: '#15803d', border: '1px solid #dcfce7' }),
                        }}
                      >
                        {student.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="attendance-table-container" style={{ overflowX: "auto" }}>
              <table style={{ minWidth: "1600px" }}>
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Admission No</th>
                    <th>Class</th>
                    <th>DOB</th>
                    <th>Gender</th>
                    <th>Mother Tongue</th>
                    <th>Blood Group</th>
                    <th>Allergies</th>
                    <th>Address</th>
                    <th>Parent / Guardian</th>
                    <th>Parent Phone</th>
                    <th>Parent Email</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => {
                    const name = [student.first_name, student.last_name].filter(Boolean).join(" ") || "Student";
                    return (
                      <tr key={student.student_id}>
                        <td style={{ fontWeight: 600, color: "var(--ink)" }}>{name}</td>
                        <td>{student.admission_no || "N/A"}</td>
                        <td>{student.class_name || "Unassigned"}</td>
                        <td>{student.dob || "—"}</td>
                        <td>{student.gender || "—"}</td>
                        <td>{student.mother_tongue || "—"}</td>
                        <td>{student.blood_group || "—"}</td>
                        <td>{student.allergy_food || "—"}</td>
                        <td style={{ maxWidth: "250px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={student.address}>
                          {student.address || "—"}
                        </td>
                        <td>{student.parent_name || "—"}</td>
                        <td>{student.parent_phone || "—"}</td>
                        <td>{student.parent_email || "—"}</td>
                        <td>
                          <span className={`status-pill ${student.status === "active" ? "present" : "absent"}`}>
                            {student.status === "active" ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                            <button
                              className="secondary-button"
                              type="button"
                              onClick={() => handleViewDetails(student)}
                              style={{ minHeight: "32px", padding: "0 14px", fontSize: "10px", borderRadius: "9999px" }}
                            >
                              Details
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        ) : (
          <p className="status-message">No students found for this criteria.</p>
        )}

        {status && <p className="status-message">{status}</p>}
      </div>

      {isModalOpen && selectedStudent && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Student Profile Details</h3>
              <button
                className="modal-close-btn"
                onClick={() => setIsModalOpen(false)}
                aria-label="Close modal"
                type="button"
              >
                ×
              </button>
            </div>
            <div className="modal-body" style={{ maxHeight: "75vh", overflowY: "auto" }}>
              <div className="modal-profile-section">
                <Avatar variant="student" src={selectedStudent.photo_url} />
                <h4 className="modal-student-name">
                  {[selectedStudent.first_name, selectedStudent.last_name].filter(Boolean).join(" ") || "Student"}
                </h4>
                <span className="modal-student-admission">Admission No: {selectedStudent.admission_no || "N/A"}</span>
              </div>
              
              {loadingDetails ? (
                <p style={{ textAlign: "center", color: "var(--muted)", fontSize: "14px", padding: "20px" }}>
                  Loading additional details...
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                  
                  {/* Student Details */}
                  <div>
                    <h5 style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--muted)", borderBottom: "1px solid var(--border-soft)", paddingBottom: "6px", marginBottom: "12px", fontWeight: 700 }}>
                      Student Information
                    </h5>
                    <div className="modal-details-grid">
                      <div className="detail-item">
                        <span className="detail-label">Class</span>
                        <span className="detail-value">{selectedStudent.class_name || "Unassigned"}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Gender</span>
                        <span className="detail-value">{selectedStudentData?.student?.gender || "—"}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Date of Birth</span>
                        <span className="detail-value">{selectedStudentData?.student?.dob || "—"}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Mother Tongue</span>
                        <span className="detail-value">{selectedStudentData?.student?.mother_tongue || "—"}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Blood Group</span>
                        <span className="detail-value">{selectedStudentData?.student?.blood_group || "—"}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Allergies</span>
                        <span className="detail-value">{selectedStudentData?.student?.allergy_food || "None"}</span>
                      </div>
                      <div className="detail-item full-width">
                        <span className="detail-label">Address</span>
                        <span className="detail-value" style={{ fontWeight: 500 }}>{selectedStudentData?.student?.address || "—"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Parents Details */}
                  {selectedStudentData?.parents && (
                    <div>
                      <h5 style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--muted)", borderBottom: "1px solid var(--border-soft)", paddingBottom: "6px", marginBottom: "12px", fontWeight: 700 }}>
                        Parents & Guardian Details
                      </h5>
                      <div className="modal-details-grid">
                        <div className="detail-item">
                          <span className="detail-label">Father&apos;s Name</span>
                          <span className="detail-value">{selectedStudentData.parents.father_name || "—"}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Father&apos;s Phone</span>
                          <span className="detail-value">{selectedStudentData.parents.father_phone || "—"}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Father&apos;s Occupation</span>
                          <span className="detail-value">{selectedStudentData.parents.father_occupation || "—"}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Mother&apos;s Name</span>
                          <span className="detail-value">{selectedStudentData.parents.mother_name || "—"}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Mother&apos;s Phone</span>
                          <span className="detail-value">{selectedStudentData.parents.mother_phone || "—"}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Mother&apos;s Occupation</span>
                          <span className="detail-value">{selectedStudentData.parents.mother_occupation || "—"}</span>
                        </div>
                        <div className="detail-item full-width">
                          <span className="detail-label">Parent Email</span>
                          <span className="detail-value">{selectedStudent.parent_email || "—"}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Emergency Contacts */}
                  {selectedStudentData?.emergency_contacts && selectedStudentData.emergency_contacts.length > 0 && (
                    <div>
                      <h5 style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--muted)", borderBottom: "1px solid var(--border-soft)", paddingBottom: "6px", marginBottom: "12px", fontWeight: 700 }}>
                        Emergency Contacts
                      </h5>
                      <table style={{ fontSize: "12px", border: "1px solid var(--border-soft)" }}>
                        <thead>
                          <tr style={{ background: "var(--tint)" }}>
                            <th style={{ padding: "8px 12px", fontSize: "10px" }}>Priority</th>
                            <th style={{ padding: "8px 12px", fontSize: "10px" }}>Name</th>
                            <th style={{ padding: "8px 12px", fontSize: "10px" }}>Relation</th>
                            <th style={{ padding: "8px 12px", fontSize: "10px", textAlign: "right" }}>Phone</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedStudentData.emergency_contacts.map((contact) => (
                            <tr key={contact.priority}>
                              <td style={{ padding: "8px 12px" }}>{contact.priority}</td>
                              <td style={{ padding: "8px 12px", fontWeight: 600 }}>{contact.contact_name}</td>
                              <td style={{ padding: "8px 12px" }}>{contact.relation || "—"}</td>
                              <td style={{ padding: "8px 12px", textAlign: "right" }}>{contact.phone}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Siblings */}
                  {selectedStudentData?.siblings && selectedStudentData.siblings.length > 0 && (
                    <div>
                      <h5 style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--muted)", borderBottom: "1px solid var(--border-soft)", paddingBottom: "6px", marginBottom: "12px", fontWeight: 700 }}>
                        Siblings Information
                      </h5>
                      <table style={{ fontSize: "12px", border: "1px solid var(--border-soft)" }}>
                        <thead>
                          <tr style={{ background: "var(--tint)" }}>
                            <th style={{ padding: "8px 12px", fontSize: "10px" }}>Name</th>
                            <th style={{ padding: "8px 12px", fontSize: "10px" }}>DOB</th>
                            <th style={{ padding: "8px 12px", fontSize: "10px", textAlign: "right" }}>School</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedStudentData.siblings.map((sibling, index) => (
                            <tr key={index}>
                              <td style={{ padding: "8px 12px", fontWeight: 600 }}>{sibling.full_name}</td>
                              <td style={{ padding: "8px 12px" }}>{sibling.dob || "—"}</td>
                              <td style={{ padding: "8px 12px", textAlign: "right" }}>{sibling.school_name || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* References */}
                  {selectedStudentData?.references && selectedStudentData.references.length > 0 && (
                    <div>
                      <h5 style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--muted)", borderBottom: "1px solid var(--border-soft)", paddingBottom: "6px", marginBottom: "12px", fontWeight: 700 }}>
                        Reference Information
                      </h5>
                      <table style={{ fontSize: "12px", border: "1px solid var(--border-soft)" }}>
                        <thead>
                          <tr style={{ background: "var(--tint)" }}>
                            <th style={{ padding: "8px 12px", fontSize: "10px" }}>Referred By</th>
                            <th style={{ padding: "8px 12px", fontSize: "10px" }}>Details</th>
                            <th style={{ padding: "8px 12px", fontSize: "10px", textAlign: "right" }}>Phone</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedStudentData.references.map((ref, index) => (
                            <tr key={index}>
                              <td style={{ padding: "8px 12px", fontWeight: 600 }}>{ref.reference_through || "—"}</td>
                              <td style={{ padding: "8px 12px" }}>{ref.reference_details || "—"}</td>
                              <td style={{ padding: "8px 12px", textAlign: "right" }}>{ref.reference_phone || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Status Toggle */}
                  <div className="detail-item full-width status-toggle-item" style={{ borderTop: "1px solid var(--border-soft)", paddingTop: "16px", marginTop: "8px" }}>
                    <span className="detail-label">Status Toggle</span>
                    <div className="status-toggle-wrapper" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
                      <span className={`status-pill ${selectedStudent.status === "active" ? "present" : "absent"}`}>
                        {selectedStudent.status === "active" ? "Active Status" : "Inactive / Archived"}
                      </span>
                      <button
                        className="primary-button"
                        type="button"
                        onClick={() => handleToggleStatus(selectedStudent)}
                        style={selectedStudent.status === "active" ? { background: "#b91c1c", borderColor: "#b91c1c", minHeight: "36px", padding: "0 16px" } : { background: "#15803d", borderColor: "#15803d", minHeight: "36px", padding: "0 16px" }}
                      >
                        {selectedStudent.status === "active" ? "Mark Inactive" : "Mark Active"}
                      </button>
                    </div>
                  </div>
                  
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

"use client";

import type { ChangeEvent, FormEvent, ReactNode } from "react";
import { useMemo, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase";
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
  photo_url?: string;
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

const navItems: Array<{ label: string; href: string; icon: IconName; }> = [
  { label: "Dashboard", href: "/dashboard", icon: "grid" },
  { label: "Students", href: "/students", icon: "students" },
  { label: "Student Attendance", href: "/student-attendance", icon: "calendar" },
  { label: "Faculty Attendance", href: "/faculty-attendance", icon: "id" },
  { label: "Fee Management", href: "/fee-management", icon: "money" },
  { label: "Reports", href: "/reports", icon: "chart" },
];

export function DashboardLayout({ children, title }: { children: ReactNode; title?: string }) {
  const pathname = usePathname();
  
  return (
    <section className="fee-shell" aria-label={title || "Dashboard"}>
      <aside className="fee-sidebar">
        <div className="fee-brand">
          <Icon name="grid" />
          <h1 className="brand-title">Blooming Daffodils</h1>
          <p className="brand-subtitle">Administrative Portal</p>
        </div>

        <nav className="fee-nav" aria-label="Primary navigation">
          {navItems.map((item) => {
            const isActive = item.href === "/" ? pathname === "/" : pathname?.startsWith(item.href);
            return (
              <a className={isActive ? "active" : ""} href={item.href} key={item.label}>
                <Icon name={item.icon} />
                <span>{item.label}</span>
              </a>
            );
          })}
        </nav>

        <button className="sidebar-user" type="button" onClick={logoutAdmin}>
          <Avatar variant="admin" />
          <div>
            <strong>Admin</strong>
            <span>Sign out</span>
          </div>
        </button>
      </aside>

      <div className="fee-main" id="dashboard-main">
        <header className="fee-topbar">
          <h2>{title || "Dashboard"}</h2>
        </header>

        <div className="fee-content">{children}</div>
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
    <DashboardLayout title="Fee Management">
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
                pattern="^[A-Za-z ]+$"
                title="Full name must only contain alphabetic letters and spaces"
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
              pattern="^[A-Za-z ]+$"
              title="Name must only contain alphabetic letters and spaces"
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

function AdmissionTopBar() {
  return (
    <header className="admission-top-bar">
      <div className="brand-logo">
        <img src="/logo.jpg" alt="Blooming Daffodils Logo" className="school-logo" />
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
        pattern="^[A-Za-z ]+$" 
        title="Name must only contain alphabetic letters and spaces" 
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
        pattern="^[A-Za-z ]+$"
        title="Name must only contain alphabetic letters and spaces"
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

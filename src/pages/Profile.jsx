import { useEffect, useRef, useState } from "react";
import {
  Pencil, Camera, Save, X, IndianRupee, Briefcase, User, ShieldCheck,
  Sparkles, Plus, FileText, Upload, Download, Trash2, Eye,
} from "lucide-react";
import * as api from "../services/api";
import { useEmployee } from "../context/EmployeeContext";
import { useToast } from "../context/ToastContext";
import { PrimaryButton, SecondaryButton, SkeletonBlock, ErrorState, Modal } from "../components/ui";

function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold text-navy-500 uppercase tracking-wide">{label}</p>
      <p className="text-sm font-medium text-navy-900 mt-1">{value || "—"}</p>
    </div>
  );
}

function EditableField({ label, value, onChange, error, type = "text", options, span }) {
  const inputCls = `mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400/50 ${error ? "border-coral-500" : "border-navy-900/15"}`;
  return (
    <div className={span ? "sm:col-span-2" : ""}>
      <label className="text-xs font-semibold text-navy-500 uppercase tracking-wide">{label}</label>
      {type === "textarea" ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={2} className={`${inputCls} resize-none`} />
      ) : type === "select" ? (
        <select value={value} onChange={(e) => onChange(e.target.value)} className={inputCls}>
          {options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      ) : (
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className={inputCls} />
      )}
      {error && <p className="text-xs text-coral-500 mt-1">{error}</p>}
    </div>
  );
}

const GENDER_OPTIONS = ["Female", "Male", "Non-binary", "Prefer not to say"];
const EMPLOYMENT_TYPE_OPTIONS = ["Full-Time", "Part-Time", "Contract", "Intern"];

const AVATAR_COLORS = ["#e8912a", "#3d7fc7", "#4c9a6a", "#e05a4e", "#4a5488"];

export default function Profile() {
  const { employee, refreshEmployee, loading: ctxLoading, error: ctxError, reload } = useEmployee();
  const toast = useToast();
  const fileRef = useRef(null);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Skills
  const [skillInput, setSkillInput] = useState("");
  const [addingSkill, setAddingSkill] = useState(false);
  const [removingSkillId, setRemovingSkillId] = useState(null);

  // Resume
  const resumeRef = useRef(null);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [deletingResume, setDeletingResume] = useState(false);
  const [viewingResume, setViewingResume] = useState(false);

  const buildForm = (emp) => ({
    fullName: `${emp.firstName} ${emp.lastName}`.trim(),
    email: emp.email,
    phone: emp.phone,
    address: emp.address,
    dateOfBirth: emp.dateOfBirth,
    gender: emp.gender,
    emergencyContact: emp.emergencyContact,
    department: emp.department,
    position: emp.position,
    manager: emp.manager,
    joiningDate: emp.joiningDate,
    employmentType: emp.employmentType,
    workLocation: emp.workLocation,
  });

  useEffect(() => {
    if (employee) setForm((f) => f ?? buildForm(employee));
  }, [employee]);

  const currency = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

  const startEdit = () => {
    setForm(buildForm(employee));
    setErrors({});
    setEditing(true);
  };

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const validate = () => {
    const errs = {};
    if (form.fullName.trim().split(/\s+/).filter(Boolean).length < 2) errs.fullName = "Enter a first and last name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errs.email = "Enter a valid email address.";
    if (!/^[+\d][\d\s-]{7,}$/.test(form.phone.trim())) errs.phone = "Enter a valid phone number.";
    if (form.address.trim().length < 6) errs.address = "Address looks too short.";
    if (!form.dateOfBirth) errs.dateOfBirth = "Required.";
    if (!form.emergencyContact.trim()) errs.emergencyContact = "Required.";
    if (!form.department.trim()) errs.department = "Required.";
    if (!form.position.trim()) errs.position = "Required.";
    if (!form.manager.trim()) errs.manager = "Required.";
    if (!form.joiningDate) errs.joiningDate = "Required.";
    if (!form.workLocation.trim()) errs.workLocation = "Required.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const save = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const [firstName, ...rest] = form.fullName.trim().split(/\s+/);
      await api.updateMyProfile({
        firstName,
        lastName: rest.join(" "),
        email: form.email.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        dateOfBirth: form.dateOfBirth,
        gender: form.gender,
        emergencyContact: form.emergencyContact.trim(),
        department: form.department.trim(),
        position: form.position.trim(),
        manager: form.manager.trim(),
        joiningDate: form.joiningDate,
        employmentType: form.employmentType,
        workLocation: form.workLocation.trim(),
      });
      await refreshEmployee();
      toast.success("Profile updated successfully.");
      setEditing(false);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoPick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      toast.error("Only PNG, JPG or WEBP images are allowed.");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      toast.error("Image must be smaller than 3MB.");
      return;
    }
    const color = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
    try {
      await api.updateMyProfile({ avatarColor: color });
      await refreshEmployee();
      toast.success("Profile photo updated.");
    } catch (err) {
      toast.error(err.message);
    } finally {
      e.target.value = "";
    }
  };

  const addSkill = async () => {
    const clean = skillInput.trim();
    if (!clean) return;
    setAddingSkill(true);
    try {
      await api.addSkill(clean);
      await refreshEmployee();
      setSkillInput("");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setAddingSkill(false);
    }
  };

  const handleSkillKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSkill();
    }
  };

  const removeSkill = async (id) => {
    setRemovingSkillId(id);
    try {
      await api.removeSkill(id);
      await refreshEmployee();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setRemovingSkillId(null);
    }
  };

  const formatBytes = (n) => {
    if (!n && n !== 0) return "";
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
    return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleResumePick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingResume(true);
    try {
      await api.uploadResume({ fileName: file.name, size: file.size });
      await refreshEmployee();
      toast.success("Resume uploaded successfully.");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploadingResume(false);
      e.target.value = "";
    }
  };

  const handleResumeDelete = async () => {
    setDeletingResume(true);
    try {
      await api.deleteResume();
      await refreshEmployee();
      toast.success("Resume removed.");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeletingResume(false);
    }
  };

  const handleResumeDownload = () => {
    toast.success(`Downloading "${employee.resume.fileName}"…`);
  };

  if (ctxError) return <ErrorState message={ctxError} onRetry={reload} />;

  if (ctxLoading || !employee) {
    return (
      <div className="space-y-6">
        <div className="card p-6 flex items-center gap-5">
          <SkeletonBlock className="w-20 h-20 rounded-full" />
          <div className="space-y-2 flex-1">
            <SkeletonBlock className="h-5 w-48" />
            <SkeletonBlock className="h-4 w-32" />
          </div>
        </div>
        <div className="card p-6 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonBlock key={i} className="h-4 w-full" />)}
        </div>
      </div>
    );
  }

  const initials = `${employee.firstName?.[0] ?? ""}${employee.lastName?.[0] ?? ""}`;

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="card p-6 flex flex-col sm:flex-row sm:items-center gap-5">
        <div className="relative shrink-0">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-white font-display font-bold text-2xl"
            style={{ backgroundColor: employee.avatarColor }}
          >
            {initials}
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-brand-900 text-white flex items-center justify-center border-2 border-mist-100 hover:bg-brand-800"
            aria-label="Change profile photo"
          >
            <Camera size={14} />
          </button>
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handlePhotoPick} />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-display text-xl font-bold text-navy-900">{employee.firstName} {employee.lastName}</h2>
          <p className="text-navy-500 text-sm">{employee.position} · {employee.department}</p>
          <p className="text-xs text-navy-400 mt-1 font-mono">{employee.employeeId}</p>
        </div>
        {!editing ? (
          <SecondaryButton onClick={startEdit} className="shrink-0">
            <Pencil size={14} /> Edit Profile
          </SecondaryButton>
        ) : (
          <div className="flex gap-2 shrink-0">
            <SecondaryButton onClick={() => setEditing(false)}><X size={14} /> Cancel</SecondaryButton>
            <PrimaryButton onClick={save} loading={saving}><Save size={14} /> Save</PrimaryButton>
          </div>
        )}
      </div>

      {/* Personal Information */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-5">
          <User size={17} className="text-navy-500" />
          <h3 className="font-display font-semibold text-navy-900">Personal Information</h3>
        </div>
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-5">
          <Field label="Employee ID" value={employee.employeeId} />

          {editing ? (
            <EditableField label="Full Name" value={form.fullName} onChange={set("fullName")} error={errors.fullName} />
          ) : (
            <Field label="Full Name" value={`${employee.firstName} ${employee.lastName}`} />
          )}

          {editing ? (
            <EditableField label="Email" type="email" value={form.email} onChange={set("email")} error={errors.email} />
          ) : (
            <Field label="Email" value={employee.email} />
          )}

          {editing ? (
            <EditableField label="Phone" value={form.phone} onChange={set("phone")} error={errors.phone} />
          ) : (
            <Field label="Phone" value={employee.phone} />
          )}

          {editing ? (
            <EditableField label="Address" type="textarea" value={form.address} onChange={set("address")} error={errors.address} span />
          ) : (
            <Field label="Address" value={employee.address} />
          )}

          {editing ? (
            <EditableField label="Date of Birth" type="date" value={form.dateOfBirth} onChange={set("dateOfBirth")} error={errors.dateOfBirth} />
          ) : (
            <Field label="Date of Birth" value={employee.dateOfBirth} />
          )}

          {editing ? (
            <EditableField label="Gender" type="select" options={GENDER_OPTIONS} value={form.gender} onChange={set("gender")} error={errors.gender} />
          ) : (
            <Field label="Gender" value={employee.gender} />
          )}

          {editing ? (
            <EditableField label="Emergency Contact" value={form.emergencyContact} onChange={set("emergencyContact")} error={errors.emergencyContact} span />
          ) : (
            <Field label="Emergency Contact" value={employee.emergencyContact} />
          )}
        </div>
      </div>

      {/* Job Information */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-5">
          <Briefcase size={17} className="text-navy-500" />
          <h3 className="font-display font-semibold text-navy-900">Job Information</h3>
        </div>
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-5">
          {editing ? (
            <EditableField label="Department" value={form.department} onChange={set("department")} error={errors.department} />
          ) : (
            <Field label="Department" value={employee.department} />
          )}

          {editing ? (
            <EditableField label="Job Position" value={form.position} onChange={set("position")} error={errors.position} />
          ) : (
            <Field label="Job Position" value={employee.position} />
          )}

          {editing ? (
            <EditableField label="Manager" value={form.manager} onChange={set("manager")} error={errors.manager} />
          ) : (
            <Field label="Manager" value={employee.manager} />
          )}

          {editing ? (
            <EditableField label="Joining Date" type="date" value={form.joiningDate} onChange={set("joiningDate")} error={errors.joiningDate} />
          ) : (
            <Field label="Joining Date" value={employee.joiningDate} />
          )}

          {editing ? (
            <EditableField label="Employment Type" type="select" options={EMPLOYMENT_TYPE_OPTIONS} value={form.employmentType} onChange={set("employmentType")} error={errors.employmentType} />
          ) : (
            <Field label="Employment Type" value={employee.employmentType} />
          )}

          {editing ? (
            <EditableField label="Work Location" value={form.workLocation} onChange={set("workLocation")} error={errors.workLocation} />
          ) : (
            <Field label="Work Location" value={employee.workLocation} />
          )}
        </div>
      </div>

      {/* Skills */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-5">
          <Sparkles size={17} className="text-navy-500" />
          <h3 className="font-display font-semibold text-navy-900">Skills</h3>
        </div>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={handleSkillKeyDown}
            placeholder="Add a skill, e.g. React, SQL, Communication"
            className="flex-1 rounded-lg border border-navy-900/15 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400/50"
          />
          <SecondaryButton onClick={addSkill} loading={addingSkill} disabled={!skillInput.trim()}>
            <Plus size={14} /> Add
          </SecondaryButton>
        </div>

        {(!employee.skills || employee.skills.length === 0) ? (
          <p className="text-sm text-navy-400">No skills added yet. Add your first skill above.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {employee.skills.map((skill) => (
              <span
                key={skill.id}
                className="inline-flex items-center gap-1.5 rounded-full bg-navy-900/[0.05] text-navy-900 text-xs font-semibold px-3 py-1.5"
              >
                {skill.name}
                <button
                  onClick={() => removeSkill(skill.id)}
                  disabled={removingSkillId === skill.id}
                  className="text-navy-400 hover:text-coral-500 disabled:opacity-50"
                  aria-label={`Remove ${skill.name}`}
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Resume */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <FileText size={17} className="text-navy-500" />
            <h3 className="font-display font-semibold text-navy-900">Resume</h3>
          </div>
          <input
            ref={resumeRef}
            type="file"
            accept=".pdf,.doc,.docx"
            className="hidden"
            onChange={handleResumePick}
          />
          {employee.resume && (
            <SecondaryButton onClick={() => resumeRef.current?.click()} loading={uploadingResume}>
              <Upload size={14} /> Replace
            </SecondaryButton>
          )}
        </div>

        {!employee.resume ? (
          <div className="flex flex-col items-center justify-center text-center py-8 px-6 rounded-xl border border-dashed border-navy-900/15">
            <div className="w-12 h-12 rounded-full bg-navy-900/[0.05] flex items-center justify-center mb-3">
              <FileText size={20} className="text-navy-500" />
            </div>
            <p className="font-display font-semibold text-navy-900 text-sm">No resume uploaded yet</p>
            <p className="text-xs text-navy-500 mt-1 max-w-xs">PDF, DOC or DOCX, up to 5MB.</p>
            <SecondaryButton onClick={() => resumeRef.current?.click()} loading={uploadingResume} className="mt-4">
              <Upload size={14} /> Upload Resume
            </SecondaryButton>
          </div>
        ) : (
          <div className="flex items-center gap-4 rounded-xl border border-navy-900/10 px-4 py-3">
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-500 flex items-center justify-center shrink-0">
              <FileText size={17} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-navy-900 truncate">{employee.resume.fileName}</p>
              <p className="text-xs text-navy-500">
                Uploaded {employee.resume.uploadedOn}{employee.resume.size ? ` · ${formatBytes(employee.resume.size)}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => setViewingResume(true)} className="p-2 rounded-lg hover:bg-navy-900/[0.05] text-navy-600" aria-label="View">
                <Eye size={16} />
              </button>
              <button onClick={handleResumeDownload} className="p-2 rounded-lg hover:bg-navy-900/[0.05] text-navy-600" aria-label="Download">
                <Download size={16} />
              </button>
              <button onClick={handleResumeDelete} disabled={deletingResume} className="p-2 rounded-lg hover:bg-coral-100 text-navy-600 hover:text-coral-500 disabled:opacity-50" aria-label="Delete">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      <Modal open={viewingResume} onClose={() => setViewingResume(false)} title={employee.resume?.fileName}>
        <div className="aspect-[4/5] rounded-xl bg-navy-900/[0.03] border border-dashed border-navy-900/15 flex flex-col items-center justify-center gap-2 text-navy-400">
          <FileText size={32} />
          <p className="text-sm">Document preview</p>
          <p className="text-xs">Uploaded {employee.resume?.uploadedOn}</p>
        </div>
      </Modal>

      {/* Salary Information — read only */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <IndianRupee size={17} className="text-navy-500" />
            <h3 className="font-display font-semibold text-navy-900">Salary Information</h3>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-navy-500 bg-navy-900/[0.05] px-2.5 py-1 rounded-full">
            <ShieldCheck size={13} /> Read-only
          </span>
        </div>
        <div className="grid sm:grid-cols-3 gap-x-6 gap-y-5">
          <Field label="Basic Salary" value={currency(employee.salary.basic)} />
          <Field label="Allowances" value={currency(employee.salary.allowances)} />
          <Field label="Deductions" value={currency(employee.salary.deductions)} />
          <Field label="Gross Salary" value={currency(employee.salary.gross)} />
          <Field label="Net Salary" value={currency(employee.salary.net)} />
          <Field label="Pay Frequency" value={employee.salary.payFrequency} />
        </div>
        <p className="text-xs text-navy-400 mt-4">Salary changes can only be made by HR/Admin and are protected server-side.</p>
      </div>
    </div>
  );
}

import { db } from "./db";

// ---------------------------------------------------------------------------
// Simulated Employee API.
//
// Every exported function here mirrors one of the REST endpoints in the
// Dayflow master plan (GET /api/employee/me, POST /api/attendance/check-in,
// etc.). They are async, latency-simulated, and validate business rules the
// same way a real Express handler would — so the frontend components below
// never trust client state, they always call these and re-read the result.
//
// The "server" always derives the employee identity itself (db.get().employee)
// rather than accepting one from the caller, mirroring the requirement that
// the backend must identify the employee from the session, never the client.
// ---------------------------------------------------------------------------

const LATENCY = [280, 620];
const wait = () =>
  new Promise((res) =>
    setTimeout(res, LATENCY[0] + Math.random() * (LATENCY[1] - LATENCY[0]))
  );

class ApiError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

function clock12to24Minutes(clockStr) {
  // "09:05 AM" -> minutes since midnight
  const [time, period] = clockStr.split(" ");
  let [h, m] = time.split(":").map(Number);
  if (period === "PM" && h !== 12) h += 12;
  if (period === "AM" && h === 12) h = 0;
  return h * 60 + m;
}

function nowClock() {
  const d = new Date();
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

// ---- Profile -----------------------------------------------------------

export async function getMe() {
  await wait();
  return structuredClone(db.get().employee);
}

export async function updateMyProfile(patch) {
  await wait();
  const allowed = [
    "firstName", "lastName", "email", "phone", "address",
    "dateOfBirth", "gender", "emergencyContact",
    "department", "position", "manager", "joiningDate", "employmentType", "workLocation",
    "avatarColor",
  ];
  const data = db.get();
  for (const key of Object.keys(patch)) {
    if (!allowed.includes(key)) {
      throw new ApiError(`Field '${key}' is not editable by employees.`, 403);
    }
  }
  if (patch.firstName !== undefined && !patch.firstName.trim()) {
    throw new ApiError("First name is required.", 422);
  }
  if (patch.email !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(patch.email.trim())) {
    throw new ApiError("Enter a valid email address.", 422);
  }
  if (patch.phone !== undefined) {
    if (!/^[+\d][\d\s-]{7,}$/.test(patch.phone.trim())) {
      throw new ApiError("Enter a valid phone number.", 422);
    }
  }
  if (patch.address !== undefined && patch.address.trim().length < 6) {
    throw new ApiError("Address looks too short.", 422);
  }
  if (patch.emergencyContact !== undefined && !patch.emergencyContact.trim()) {
    throw new ApiError("Emergency contact is required.", 422);
  }
  if (patch.department !== undefined && !patch.department.trim()) {
    throw new ApiError("Department is required.", 422);
  }
  if (patch.position !== undefined && !patch.position.trim()) {
    throw new ApiError("Job position is required.", 422);
  }
  if (patch.manager !== undefined && !patch.manager.trim()) {
    throw new ApiError("Manager is required.", 422);
  }
  if (patch.workLocation !== undefined && !patch.workLocation.trim()) {
    throw new ApiError("Work location is required.", 422);
  }
  data.employee = { ...data.employee, ...patch };
  db.set(data);
  return structuredClone(data.employee);
}

// ---- Skills ----------------------------------------------------------------

export async function getMySkills() {
  await wait();
  const data = db.get();
  return structuredClone(data.employee.skills || []);
}

export async function addSkill(name) {
  await wait();
  const clean = (name || "").trim();
  if (!clean) throw new ApiError("Enter a skill name.", 422);
  if (clean.length > 40) throw new ApiError("Skill name is too long.", 422);
  const data = db.get();
  data.employee.skills = data.employee.skills || [];
  if (data.employee.skills.some((s) => s.name.toLowerCase() === clean.toLowerCase())) {
    throw new ApiError("That skill is already on your profile.", 409);
  }
  const skill = { id: `SK-${Date.now()}`, name: clean };
  data.employee.skills.push(skill);
  db.set(data);
  return structuredClone(data.employee.skills);
}

export async function removeSkill(id) {
  await wait();
  const data = db.get();
  data.employee.skills = (data.employee.skills || []).filter((s) => s.id !== id);
  db.set(data);
  return structuredClone(data.employee.skills);
}

// ---- Resume ------------------------------------------------------------

export async function getMyResume() {
  await wait();
  return structuredClone(db.get().employee.resume);
}

export async function uploadResume({ fileName, size }) {
  await wait();
  if (!fileName) throw new ApiError("Choose a file to upload.", 422);
  const okExt = /\.(pdf|doc|docx)$/i.test(fileName);
  if (!okExt) throw new ApiError("Resume must be a PDF, DOC, or DOCX file.", 422);
  if (size > 5 * 1024 * 1024) throw new ApiError("Resume must be smaller than 5MB.", 422);
  const data = db.get();
  data.employee.resume = { fileName, size, uploadedOn: todayIso() };
  db.set(data);
  pushNotification(data, {
    type: "document",
    title: "Resume uploaded",
    body: `Your resume "${fileName}" was uploaded successfully.`,
    link: "/profile",
  });
  return structuredClone(data.employee.resume);
}

export async function deleteResume() {
  await wait();
  const data = db.get();
  data.employee.resume = null;
  db.set(data);
  return null;
}

// ---- Attendance ----------------------------------------------------------

export async function getTodayAttendance() {
  await wait();
  return structuredClone(db.get().attendanceToday);
}

export async function checkIn() {
  await wait();
  const data = db.get();
  if (data.attendanceToday.checkIn) {
    throw new ApiError("You have already checked in today.", 409);
  }
  data.attendanceToday = { status: "Present", checkIn: nowClock(), checkOut: null };
  db.set(data);
  pushNotification(data, {
    type: "attendance",
    title: "Checked in",
    body: `You checked in at ${data.attendanceToday.checkIn}.`,
    link: "/attendance",
  });
  return structuredClone(data.attendanceToday);
}

export async function checkOut() {
  await wait();
  const data = db.get();
  if (!data.attendanceToday.checkIn) {
    throw new ApiError("You must check in before checking out.", 409);
  }
  if (data.attendanceToday.checkOut) {
    throw new ApiError("You have already checked out today.", 409);
  }
  data.attendanceToday.checkOut = nowClock();
  db.set(data);

  const inMin = clock12to24Minutes(data.attendanceToday.checkIn);
  const outMin = clock12to24Minutes(data.attendanceToday.checkOut);
  const workedHrs = Math.max(0, (outMin - inMin) / 60);

  // fold today's completed record into history so Attendance page reflects it
  const existingIdx = data.attendanceHistory.findIndex((r) => r.date === todayIso());
  const record = {
    id: `att_${todayIso()}`,
    date: todayIso(),
    checkIn: data.attendanceToday.checkIn,
    checkOut: data.attendanceToday.checkOut,
    workingHours: Number(workedHrs.toFixed(1)),
    extraHours: Number(Math.max(0, workedHrs - 8).toFixed(1)),
    status: workedHrs < 4.5 ? "Half-day" : "Present",
  };
  if (existingIdx >= 0) data.attendanceHistory[existingIdx] = record;
  else data.attendanceHistory.push(record);
  db.set(data);
  return structuredClone(data.attendanceToday);
}

export async function getAttendanceHistory({ range = "month" } = {}) {
  await wait();
  const data = db.get();
  const now = new Date();
  let rows = [...data.attendanceHistory];
  if (data.attendanceToday.checkIn && !rows.find((r) => r.date === todayIso())) {
    rows.push({
      id: "att_today",
      date: todayIso(),
      checkIn: data.attendanceToday.checkIn,
      checkOut: data.attendanceToday.checkOut,
      workingHours: 0,
      extraHours: 0,
      status: "Present",
    });
  }
  rows.sort((a, b) => (a.date < b.date ? 1 : -1));

  if (range === "today") {
    rows = rows.filter((r) => r.date === todayIso());
  } else if (range === "week") {
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - 7);
    rows = rows.filter((r) => new Date(r.date) >= cutoff);
  } else if (range === "month") {
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - 30);
    rows = rows.filter((r) => new Date(r.date) >= cutoff);
  }
  return rows;
}

export async function getWeeklyAttendance() {
  await wait();
  const data = db.get();
  const now = new Date();
  const day = now.getDay();
  const mondayOffset = day === 0 ? 6 : day - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - mondayOffset);

  const week = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const iso = d.toISOString().slice(0, 10);
    let record = data.attendanceHistory.find((r) => r.date === iso);
    if (!record && iso === todayIso()) {
      record = {
        date: iso,
        checkIn: data.attendanceToday.checkIn,
        checkOut: data.attendanceToday.checkOut,
        workingHours: 0,
        extraHours: 0,
        status: data.attendanceToday.checkIn ? "Present" : "—",
      };
    }
    week.push({
      day: d.toLocaleDateString("en-US", { weekday: "short" }),
      date: iso,
      isToday: iso === todayIso(),
      isFuture: d > now && iso !== todayIso(),
      checkIn: record?.checkIn ?? null,
      checkOut: record?.checkOut ?? null,
      workingHours: record?.workingHours ?? 0,
      status: record?.status ?? (d.getDay() === 0 || d.getDay() === 6 ? "Weekend" : "—"),
    });
  }
  return week;
}

export async function getAttendanceSummary() {
  await wait();
  const data = db.get();
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - 30);
  const rows = data.attendanceHistory.filter((r) => new Date(r.date) >= cutoff);
  return {
    present: rows.filter((r) => r.status === "Present").length,
    absent: rows.filter((r) => r.status === "Absent").length,
    leave: rows.filter((r) => r.status === "Leave").length,
    halfDay: rows.filter((r) => r.status === "Half-day").length,
    totalHours: Number(rows.reduce((s, r) => s + (r.workingHours || 0), 0).toFixed(1)),
    extraHours: Number(rows.reduce((s, r) => s + (r.extraHours || 0), 0).toFixed(1)),
  };
}

// ---- Leave -----------------------------------------------------------------

export async function getLeaveBalance() {
  await wait();
  return structuredClone(db.get().leaveBalance);
}

export async function getMyLeaveRequests() {
  await wait();
  const data = db.get();
  return [...data.leaveRequests].sort((a, b) => (a.startDate < b.startDate ? 1 : -1));
}

function dateRangeOverlaps(aStart, aEnd, bStart, bEnd) {
  return aStart <= bEnd && bStart <= aEnd;
}

export async function applyForLeave({ type, startDate, endDate, remarks }) {
  await wait();
  const data = db.get();

  if (!type || !startDate || !endDate) {
    throw new ApiError("Leave type and dates are required.", 422);
  }
  if (endDate < startDate) {
    throw new ApiError("End date cannot be before start date.", 422);
  }
  const overlap = data.leaveRequests.find(
    (r) =>
      r.status !== "Rejected" &&
      dateRangeOverlaps(startDate, endDate, r.startDate, r.endDate)
  );
  if (overlap) {
    throw new ApiError(
      `This overlaps with an existing ${overlap.status.toLowerCase()} request (${overlap.id}).`,
      409
    );
  }

  const days =
    Math.round((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1;

  const balanceKey = type.toLowerCase();
  if (balanceKey !== "unpaid" && data.leaveBalance[balanceKey] < days) {
    throw new ApiError(
      `Insufficient ${type} leave balance. You have ${data.leaveBalance[balanceKey]} day(s) left.`,
      422
    );
  }

  const request = {
    id: `LR-${Math.floor(2000 + Math.random() * 8000)}`,
    type,
    startDate,
    endDate,
    days,
    remarks: remarks || "",
    status: "Pending",
    comment: "",
  };
  data.leaveRequests.unshift(request);
  db.set(data);
  pushNotification(data, {
    type: "leave",
    title: "Leave request submitted",
    body: `Your ${type} leave request (${request.id}) is awaiting approval.`,
    link: "/time-off",
  });
  return structuredClone(request);
}

export async function cancelLeaveRequest(id) {
  await wait();
  const data = db.get();
  const req = data.leaveRequests.find((r) => r.id === id);
  if (!req) throw new ApiError("Leave request not found.", 404);
  if (req.status !== "Pending") {
    throw new ApiError("Only pending requests can be cancelled.", 409);
  }
  req.status = "Cancelled";
  db.set(data);
  return structuredClone(req);
}

// ---- Payroll -----------------------------------------------------------

export async function getMyPayroll() {
  await wait();
  return structuredClone(db.get().employee.salary);
}

export async function getMySalaryHistory() {
  await wait();
  return structuredClone(db.get().salaryHistory);
}

// ---- Documents -----------------------------------------------------------

export async function getMyDocuments() {
  await wait();
  return structuredClone(db.get().documents);
}

export async function getMyDocumentRequests() {
  await wait();
  const data = db.get();
  return [...data.documentRequests].sort((a, b) => (a.requestedOn < b.requestedOn ? 1 : -1));
}

export async function requestDocument({ type, remarks }) {
  await wait();
  if (!type) throw new ApiError("Choose a document type.", 422);
  const data = db.get();
  const request = {
    id: `DR-${Math.floor(500 + Math.random() * 500)}`,
    type,
    remarks: remarks || "",
    status: "Pending",
    requestedOn: todayIso(),
  };
  data.documentRequests.unshift(request);
  db.set(data);
  return structuredClone(request);
}

// ---- Notifications ---------------------------------------------------------

export async function getNotifications() {
  await wait();
  const data = db.get();
  return [...data.notifications].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

export async function markNotificationRead(id) {
  await wait();
  const data = db.get();
  const n = data.notifications.find((n) => n.id === id);
  if (n) n.read = true;
  db.set(data);
  return structuredClone(data.notifications);
}

export async function markAllNotificationsRead() {
  await wait();
  const data = db.get();
  data.notifications.forEach((n) => (n.read = true));
  db.set(data);
  return structuredClone(data.notifications);
}

function pushNotification(data, { type, title, body, link }) {
  data.notifications.unshift({
    id: `N${Date.now()}`,
    type,
    title,
    body,
    link,
    timestamp: new Date().toISOString(),
    read: false,
  });
  db.set(data);
}

// ---- Policies -----------------------------------------------------------

export async function getPolicies() {
  await wait();
  return structuredClone(db.get().policies);
}

// ---- Settings -----------------------------------------------------------

export async function getSettings() {
  await wait();
  return structuredClone(db.get().settings);
}

export async function updateSettings(patch) {
  await wait();
  const data = db.get();
  data.settings = { ...data.settings, ...patch };
  db.set(data);
  return structuredClone(data.settings);
}

export async function changePassword({ currentPassword, newPassword }) {
  await wait();
  if (!currentPassword || !newPassword) {
    throw new ApiError("Both current and new password are required.", 422);
  }
  if (newPassword.length < 8) {
    throw new ApiError("New password must be at least 8 characters.", 422);
  }

  const data = db.get();

  // Notify the employee in their own feed.
  pushNotification(data, {
    type: "security",
    title: "Password changed",
    body: "Your password was changed successfully. HR has been notified for your account's security records.",
    link: "/settings",
  });

  // Simulate the request/alert that would be raised for HR on the real
  // backend — every password change is logged for HR/IT Security so it
  // shows up on their side even though this employee-only frontend has
  // no HR view to render it in.
  data.hrNotifications = data.hrNotifications || [];
  data.hrNotifications.unshift({
    id: `HR-SEC-${Date.now()}`,
    employeeId: data.employee.employeeId,
    employeeName: `${data.employee.firstName} ${data.employee.lastName}`,
    type: "password_change",
    message: `${data.employee.firstName} ${data.employee.lastName} (${data.employee.employeeId}) changed their account password.`,
    timestamp: new Date().toISOString(),
    acknowledged: false,
  });
  db.set(data);

  return { success: true };
}

export { ApiError };

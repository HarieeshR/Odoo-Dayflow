// ---------------------------------------------------------------------------
// In-memory "database" for the Employee Portal.
//
// This stands in for the real Dayflow backend. Every service function in
// this folder is async and goes through this module the same way a real
// fetch() call would go through an Express/REST layer — so swapping this
// file for real HTTP calls later requires no changes anywhere else in the
// app. State is kept in memory + persisted to localStorage so edits survive
// a refresh, exactly like a real session would.
// ---------------------------------------------------------------------------

const STORAGE_KEY = "dayflow_employee_db_v1";

const today = new Date();
const iso = (d) => d.toISOString().slice(0, 10);
const daysAgo = (n) => {
  const d = new Date(today);
  d.setDate(d.getDate() - n);
  return d;
};

function buildAttendanceHistory() {
  const rows = [];
  for (let i = 45; i >= 1; i--) {
    const date = daysAgo(i);
    const dow = date.getDay();
    if (dow === 0 || dow === 6) {
      rows.push({
        id: `att_${iso(date)}`,
        date: iso(date),
        checkIn: null,
        checkOut: null,
        workingHours: 0,
        extraHours: 0,
        status: "Weekend",
      });
      continue;
    }
    const roll = Math.random();
    if (roll < 0.06) {
      rows.push({ id: `att_${iso(date)}`, date: iso(date), checkIn: null, checkOut: null, workingHours: 0, extraHours: 0, status: "Absent" });
    } else if (roll < 0.11) {
      rows.push({ id: `att_${iso(date)}`, date: iso(date), checkIn: null, checkOut: null, workingHours: 0, extraHours: 0, status: "Leave" });
    } else if (roll < 0.18) {
      const inHour = 9 + Math.random() * 0.7;
      const workHrs = 4 + Math.random() * 0.8;
      rows.push({
        id: `att_${iso(date)}`, date: iso(date),
        checkIn: minutesToClock(inHour * 60),
        checkOut: minutesToClock((inHour + workHrs) * 60),
        workingHours: Number(workHrs.toFixed(1)), extraHours: 0, status: "Half-day",
      });
    } else {
      const inHour = 8.8 + Math.random() * 0.6;
      const workHrs = 8 + Math.random() * 1.6;
      const extra = Math.max(0, workHrs - 8);
      rows.push({
        id: `att_${iso(date)}`, date: iso(date),
        checkIn: minutesToClock(inHour * 60),
        checkOut: minutesToClock((inHour + workHrs) * 60),
        workingHours: Number(workHrs.toFixed(1)), extraHours: Number(extra.toFixed(1)), status: "Present",
      });
    }
  }
  return rows;
}

function minutesToClock(totalMinutes) {
  const h = Math.floor(totalMinutes / 60);
  const m = Math.round(totalMinutes % 60);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period}`;
}

function defaultData() {
  return {
    employee: {
      id: "emp_1001",
      employeeId: "DF-EMP-1042",
      firstName: "Ananya",
      lastName: "Rao",
      email: "ananya.rao@dayflow-corp.com",
      phone: "+91 98765 43210",
      address: "14/2 Lake View Road, Adyar, Chennai, Tamil Nadu 600020",
      dateOfBirth: "1996-03-18",
      gender: "Female",
      emergencyContact: "Suresh Rao (Father) · +91 90000 11122",
      avatarColor: "#e8912a",
      department: "Product Engineering",
      position: "Senior Frontend Engineer",
      manager: "Karthik Subramaniam",
      joiningDate: "2022-06-13",
      employmentType: "Full-Time",
      workLocation: "Chennai (Hybrid)",
      skills: [],
      resume: null,
      salary: {
        basic: 68000,
        allowances: 22000,
        deductions: 7400,
        gross: 90000,
        net: 82600,
        payFrequency: "Monthly",
      },
    },

    attendanceToday: {
      status: "Not Checked In",
      checkIn: null,
      checkOut: null,
    },
    attendanceHistory: buildAttendanceHistory(),

    leaveBalance: { paid: 12, sick: 8, unpaid: 0 },
    leaveRequests: [
      { id: "LR-2031", type: "Paid", startDate: iso(daysAgo(40)), endDate: iso(daysAgo(38)), days: 3, remarks: "Family function", status: "Approved", comment: "" },
      { id: "LR-2044", type: "Sick", startDate: iso(daysAgo(20)), endDate: iso(daysAgo(20)), days: 1, remarks: "Fever", status: "Approved", comment: "" },
      { id: "LR-2058", type: "Unpaid", startDate: iso(daysAgo(9)), endDate: iso(daysAgo(8)), days: 2, remarks: "Personal travel", status: "Rejected", comment: "Team is short-staffed that sprint — please reapply for a later date." },
      { id: "LR-2063", type: "Paid", startDate: iso(daysAgo(2)), endDate: iso(daysAgo(1)), days: 2, remarks: "Cousin's wedding", status: "Pending", comment: "" },
    ],

    salaryHistory: Array.from({ length: 6 }).map((_, i) => {
      const d = new Date(today.getFullYear(), today.getMonth() - (i + 1), 1);
      const month = d.toLocaleString("en-US", { month: "long", year: "numeric" });
      return {
        id: `PS-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`,
        month,
        gross: 90000,
        deductions: 7400,
        net: 82600,
        status: "Paid",
      };
    }),

    documents: [
      { id: "DOC-1", name: "Offer Letter", type: "Offer Letter", date: "2022-06-01", status: "Available" },
      { id: "DOC-2", name: "Appointment Letter", type: "Appointment Letter", date: "2022-06-13", status: "Available" },
      { id: "DOC-3", name: "Salary Certificate — FY24-25", type: "Salary Certificate", date: "2025-04-10", status: "Available" },
      { id: "DOC-4", name: "Experience Letter", type: "Experience Letter", date: "2025-06-13", status: "Available" },
      { id: "DOC-5", name: "Salary Slip — March 2026", type: "Salary Slip", date: "2026-04-01", status: "Available" },
      { id: "DOC-6", name: "Salary Slip — February 2026", type: "Salary Slip", date: "2026-03-01", status: "Available" },
    ],
    documentRequests: [],

    notifications: [
      { id: "N1", type: "leave", title: "Leave request submitted", body: "Your Paid leave request (LR-2063) is awaiting approval.", timestamp: daysAgo(2).toISOString(), read: false, link: "/time-off" },
      { id: "N2", type: "leave", title: "Leave request rejected", body: "Your Unpaid leave request (LR-2058) was rejected by HR.", timestamp: daysAgo(8).toISOString(), read: false, link: "/time-off" },
      { id: "N3", type: "document", title: "Payslip available", body: "Your March 2026 payslip has been generated.", timestamp: daysAgo(10).toISOString(), read: true, link: "/documents" },
      { id: "N4", type: "attendance", title: "Attendance reminder", body: "You haven't checked in yet today.", timestamp: daysAgo(0).toISOString(), read: true, link: "/attendance" },
      { id: "N5", type: "announcement", title: "HR Announcement", body: "Company offsite scheduled for next month — details on the Policies page.", timestamp: daysAgo(15).toISOString(), read: true, link: "/policies" },
      { id: "N6", type: "leave", title: "Leave request approved", body: "Your Sick leave request (LR-2044) was approved.", timestamp: daysAgo(20).toISOString(), read: true, link: "/time-off" },
    ],

    policies: [
      { id: "P1", title: "Leave Policy", category: "Leave", updated: "2026-01-05", summary: "Entitlements, accrual rules, and the approval process for Paid, Sick, and Unpaid leave.", body: "Employees accrue 1 Paid Leave day and 0.7 Sick Leave days per month, credited at month end. Unpaid leave requires manager approval and is deducted at gross daily rate. Leave requests must be submitted at least 3 working days in advance, except Sick Leave which may be applied for on the day. Unused Paid Leave up to 10 days can be carried forward to the next calendar year." },
      { id: "P2", title: "Attendance Policy", category: "Attendance", updated: "2025-11-20", summary: "Check-in windows, grace periods, and how Half-day / Absent status is determined.", body: "Standard working hours are 9:00 AM to 6:00 PM with a 1-hour lunch break. A grace period of 15 minutes is allowed for check-in. Check-in after 1:00 PM without prior approval is marked Half-day. No check-in for the day is marked Absent unless covered by approved leave. Attendance is tracked automatically from your check-in/check-out actions on the dashboard." },
      { id: "P3", title: "Working Hours", category: "Attendance", updated: "2025-09-02", summary: "Core hours, flexible time bands, and overtime handling.", body: "Core collaboration hours are 11:00 AM–4:00 PM, during which all employees are expected to be reachable. Outside core hours, start and end times may flex by up to 90 minutes with manager awareness. Hours worked beyond 8 in a day are logged as Extra Hours and are visible on your Attendance page; overtime pay eligibility depends on your employment grade." },
      { id: "P4", title: "Holiday Policy", category: "Leave", updated: "2026-01-05", summary: "The annual holiday calendar and how regional holidays are handled.", body: "Dayflow observes 12 public holidays annually, published on the Policies page each January. Employees in regional offices may substitute up to 2 national holidays for regionally relevant ones, subject to manager approval submitted at least 2 weeks in advance." },
      { id: "P5", title: "Work From Home Policy", category: "Workplace", updated: "2025-12-11", summary: "Eligibility and expectations for remote working days.", body: "Employees on Hybrid work location may work from home up to 2 days per week without prior approval, and additional days with manager sign-off. Remote days still require check-in/check-out through the Attendance page and availability during core hours." },
      { id: "P6", title: "Code of Conduct", category: "Workplace", updated: "2025-08-01", summary: "Expected standards of professional behavior, confidentiality, and workplace respect.", body: "All employees are expected to act with integrity, treat colleagues with respect, and safeguard confidential company and client information. Harassment, discrimination, and conflicts of interest must be reported to HR promptly. Violations are handled under the disciplinary process outlined in the employee handbook." },
    ],

    settings: {
      notifications: { leave: true, attendance: true, hr: true },
      appearance: "light",
    },

    // Security/HR-facing log — not shown anywhere in this employee frontend,
    // but populated so a future HR view (or real backend) has the audit
    // trail of security-relevant employee actions like password changes.
    hrNotifications: [],
  };
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // fall through to defaults
  }
  const fresh = defaultData();
  save(fresh);
  return fresh;
}

function save(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export const db = {
  get: load,
  set: save,
  reset: () => {
    const fresh = defaultData();
    save(fresh);
    return fresh;
  },
};

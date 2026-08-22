import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import Employee from '../models/Employee.js';
import LeaveType from '../models/LeaveType.js';
import LeaveBalance from '../models/LeaveBalance.js';
import LeaveRequest from '../models/LeaveRequest.js';
import Attendance from '../models/Attendance.js';
import SalaryStructure from '../models/SalaryStructure.js';
import Notification from '../models/Notification.js';
import AuditLog from '../models/AuditLog.js';
import Document from '../models/Document.js';
import SalaryHistory from '../models/SalaryHistory.js';
import { toUtcDateOnly } from '../utils/dates.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dayflow';
const ADMIN_SEED_PASSWORD = process.env.ADMIN_SEED_PASSWORD || 'ChangeMePlease!123';
const EMPLOYEE_SEED_PASSWORD = process.env.EMPLOYEE_SEED_PASSWORD || 'ChangeMePlease!456';

async function seed() {
  try {
    console.log('🌱 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('🗑️ Dropping existing collections...');
    const collections = await mongoose.connection.db.collections();
    for (const collection of collections) {
      await collection.drop();
      console.log(`   - Dropped ${collection.collectionName}`);
    }

    console.log('📝 Creating Leave Types...');
    const leaveTypes = await LeaveType.insertMany([
      { name: 'Paid Time Off (PTO)', code: 'PTO', description: 'Annual paid leave', defaultDays: 24, isPaid: true, requiresAttachment: false },
      { name: 'Sick Leave (SICK)', code: 'SICK', description: 'Medical leave', defaultDays: 7, isPaid: true, requiresAttachment: true },
      { name: 'Unpaid Leave (UNPAID)', code: 'UNPAID', description: 'Leave without pay', defaultDays: 0, isPaid: false, requiresAttachment: false }
    ]);
    console.log(`✅ Created ${leaveTypes.length} Leave Types`);

    console.log('👤 Creating Admin User & Employee...');
    const adminEmployee = new Employee({
      employeeId: 'EMP-0001',
      firstName: 'Karthik',
      lastName: 'Admin',
      email: 'admin@dayflow.com',
      department: 'HR',
      designation: 'HR Director',
      employmentStatus: 'active',
      joiningDate: new Date('2020-01-01'),
      profilePicture: 'https://ui-avatars.com/api/?name=Karthik+Admin&background=1e40af&color=fff&size=256'
    });
    await adminEmployee.save();
    
    const adminUser = new User({
      email: 'admin@dayflow.com',
      password: ADMIN_SEED_PASSWORD,
      role: 'admin',
      employee: adminEmployee._id,
      isFirstLogin: false,
      isActive: true
    });
    await adminUser.save();
    adminEmployee.user = adminUser._id;
    await adminEmployee.save();
    console.log('✅ Created Admin User & Employee');

    console.log('👥 Creating 10 Employees...');
    const employeeData = [
      { id: 'EMP-0002', first: 'Rahul', last: 'Sharma', dept: 'Engineering', desig: 'Senior Developer', email: 'rahul@dayflow.com', wage: 90000 },
      { id: 'EMP-0003', first: 'Priya', last: 'Patel', dept: 'Engineering', desig: 'Frontend Developer', email: 'priya@dayflow.com', wage: 75000 },
      { id: 'EMP-0004', first: 'Amit', last: 'Kumar', dept: 'Engineering', desig: 'Backend Developer', email: 'amit@dayflow.com', wage: 80000 },
      { id: 'EMP-0005', first: 'Sneha', last: 'Reddy', dept: 'HR', desig: 'HR Manager', email: 'sneha@dayflow.com', wage: 65000 },
      { id: 'EMP-0006', first: 'Vikram', last: 'Singh', dept: 'Finance', desig: 'Financial Analyst', email: 'vikram@dayflow.com', wage: 70000 },
      { id: 'EMP-0007', first: 'Ananya', last: 'Gupta', dept: 'Finance', desig: 'Accountant', email: 'ananya@dayflow.com', wage: 55000 },
      { id: 'EMP-0008', first: 'Rajesh', last: 'Nair', dept: 'Marketing', desig: 'Marketing Manager', email: 'rajesh@dayflow.com', wage: 60000 },
      { id: 'EMP-0009', first: 'Deepika', last: 'Joshi', dept: 'Marketing', desig: 'Content Specialist', email: 'deepika@dayflow.com', wage: 50000 },
      { id: 'EMP-0010', first: 'Arjun', last: 'Menon', dept: 'Engineering', desig: 'DevOps Engineer', email: 'arjun@dayflow.com', wage: 85000 },
      { id: 'EMP-0011', first: 'Kavitha', last: 'Iyer', dept: 'HR', desig: 'Recruiter', email: 'kavitha@dayflow.com', wage: 48000 }
    ];

    const employees = [];
    for (const data of employeeData) {
      const emp = new Employee({
        employeeId: data.id,
        firstName: data.first,
        lastName: data.last,
        email: data.email,
        department: data.dept,
        designation: data.desig,
        employmentStatus: 'active',
        joiningDate: new Date('2023-01-15'),
        profilePicture: `https://ui-avatars.com/api/?name=${encodeURIComponent(`${data.first} ${data.last}`)}&background=3b82f6&color=fff&size=256`
      });
      await emp.save();
      employees.push({ emp, wage: data.wage });

      const user = new User({
        email: data.email,
        password: EMPLOYEE_SEED_PASSWORD,
        role: 'employee',
        employee: emp._id,
        isFirstLogin: true
      });
      await user.save();
      emp.user = user._id;
      await emp.save();
    }
    console.log(`✅ Created ${employees.length} Employees and Users`);

    console.log('💰 Creating Salary Structures...');
    const salaryStructures = [];
    for (const { emp, wage } of employees) {
      const basic = wage * 0.5;
      const hra = basic * 0.4;
      const stdAllowance = 3000;
      const perfBonus = basic * 0.1;
      const totalEarnings = basic + hra + stdAllowance + perfBonus;
      
      const pf = basic * 0.12;
      const profTax = 200;
      const totalDeductions = pf + profTax;
      
      const netSalary = totalEarnings - totalDeductions;

      const salaryStructure = new SalaryStructure({
        employee: emp._id,
        monthlyWage: wage,
        components: [
          { name: 'Basic', type: 'percentage', value: 50, baseComponent: 'monthlyWage', calculatedAmount: basic },
          { name: 'HRA', type: 'percentage', value: 40, baseComponent: 'monthlyWage', calculatedAmount: hra },
          { name: 'Standard Allowance', type: 'fixed', value: 3000, calculatedAmount: stdAllowance },
          { name: 'Performance Bonus', type: 'percentage', value: 10, baseComponent: 'monthlyWage', calculatedAmount: perfBonus }
        ],
        deductions: [
          { name: 'Provident Fund', type: 'percentage', value: 12, calculatedAmount: pf },
          { name: 'Professional Tax', type: 'fixed', value: 200, calculatedAmount: profTax }
        ],
        totalEarnings,
        totalDeductions,
        netSalary,
        isActive: true,
        effectiveDate: new Date('2023-01-01')
      });
      await salaryStructure.save();
      salaryStructures.push(salaryStructure);
    }
    console.log(`✅ Created ${salaryStructures.length} Salary Structures`);

    console.log('🗓️ Creating Leave Balances...');
    const currentYear = new Date().getFullYear();
    const ptoType = leaveTypes.find(t => t.name.includes('PTO'));
    const sickType = leaveTypes.find(t => t.name.includes('SICK'));
    const unpaidType = leaveTypes.find(t => t.name.includes('UNPAID'));
    
    const leaveBalances = [];
    const allStaff = [{ emp: adminEmployee }, ...employees];
    for (const { emp } of allStaff) {
      const ptoUsed = Math.floor(Math.random() * 9); // 0-8
      const sickUsed = Math.floor(Math.random() * 4); // 0-3
      
      leaveBalances.push({ employee: emp._id, leaveType: ptoType._id, year: currentYear, totalDays: 24, usedDays: ptoUsed });
      leaveBalances.push({ employee: emp._id, leaveType: sickType._id, year: currentYear, totalDays: 7, usedDays: sickUsed });
      leaveBalances.push({ employee: emp._id, leaveType: unpaidType._id, year: currentYear, totalDays: 30, usedDays: 0 });
    }
    await LeaveBalance.insertMany(leaveBalances);
    console.log(`✅ Created ${leaveBalances.length} Leave Balances`);

    console.log('⏰ Creating Attendance Records (Last 30 business days)...');
    const attendances = [];
    const today = toUtcDateOnly();
    
    let currDate = new Date(today);
    const businessDays = [];
    while (businessDays.length < 30) {
      if (currDate.getDay() !== 0 && currDate.getDay() !== 6) {
        businessDays.push(new Date(currDate));
      }
      currDate.setUTCDate(currDate.getUTCDate() - 1);
    }
    
    for (const date of businessDays) {
      for (const { emp } of employees) {
        const isAbsent = Math.random() < 0.05; // 5% absence
        
        if (isAbsent) {
          attendances.push({
            employee: emp._id,
            date: toUtcDateOnly(date),
            status: 'absent'
          });
        } else {
          const day = toUtcDateOnly(date);
          const checkInHours = 8;
          const checkInMinutes = 30 + Math.floor(Math.random() * 90);
          const checkIn = new Date(day);
          checkIn.setUTCHours(checkInHours, checkInMinutes, 0, 0);

          const checkOutHours = 17;
          const checkOutMinutes = Math.floor(Math.random() * 150);
          const checkOut = new Date(day);
          checkOut.setUTCHours(checkOutHours, checkOutMinutes, 0, 0);
          
          const workMs = checkOut - checkIn;
          const workHours = +(workMs / (1000 * 60 * 60)).toFixed(2);
          const extraHours = workHours > 8 ? +(workHours - 8).toFixed(2) : 0;
          
          let status = 'present';
          if (workHours < 4) status = 'absent';
          else if (workHours < 8) status = 'half_day';
          
          attendances.push({
            employee: emp._id,
            date: day,
            checkIn,
            checkOut,
            workHours,
            extraHours,
            status
          });
        }
      }
    }
    await Attendance.insertMany(attendances);
    console.log(`✅ Created ${attendances.length} Attendance Records`);

    console.log('✈️ Creating Leave Requests...');
    const leaveReqs = [
      { emp: employees[0].emp, type: ptoType, status: 'pending', start: new Date(), end: new Date() },
      { emp: employees[1].emp, type: sickType, status: 'pending', start: new Date(), end: new Date() },
      { emp: employees[2].emp, type: unpaidType, status: 'pending', start: new Date(), end: new Date() },
      { emp: employees[3].emp, type: ptoType, status: 'approved', start: new Date(), end: new Date() },
      { emp: employees[4].emp, type: ptoType, status: 'approved', start: new Date(), end: new Date() },
      { emp: employees[5].emp, type: sickType, status: 'approved', start: new Date(), end: new Date() },
      { emp: employees[6].emp, type: ptoType, status: 'rejected', start: new Date(), end: new Date() },
      { emp: employees[7].emp, type: sickType, status: 'rejected', start: new Date(), end: new Date() }
    ];
    
    for (const lr of leaveReqs) {
      const request = new LeaveRequest({
        employee: lr.emp._id,
        leaveType: lr.type._id,
        startDate: lr.start,
        endDate: lr.end,
        reason: 'Personal reason',
        status: lr.status,
        totalDays: 1
      });
      await request.save();
    }
    console.log(`✅ Created ${leaveReqs.length} Leave Requests`);

    console.log('🔔 Creating Notifications & 📋 Audit Logs...');
    const notifications = [];
    const auditLogs = [];
    
    for (let i = 0; i < 15; i++) {
      const emp = employees[i % employees.length].emp;
      
      notifications.push({
        recipient: adminUser._id,
        title: i < 5 ? 'Welcome' : i < 10 ? 'Leave Update' : 'Salary Update',
        message: 'This is a sample notification message.',
        type: i < 5 ? 'employee_created' : i < 10 ? 'leave_submitted' : 'salary_changed',
        isRead: Math.random() > 0.5
      });
      
      auditLogs.push({
        actor: adminUser._id,
        action: i < 5 ? 'CREATE' : i < 10 ? 'UPDATE' : 'DELETE',
        entityType: i < 5 ? 'Employee' : i < 10 ? 'LeaveRequest' : 'SalaryStructure',
        entityId: emp._id,
        ipAddress: '127.0.0.1'
      });
    }
    await Notification.insertMany(notifications);
    await AuditLog.insertMany(auditLogs);
    console.log(`✅ Created ${notifications.length} Notifications and ${auditLogs.length} Audit Logs`);

    console.log('\n🎉 Database Seeded Successfully!');
    console.log(`
      Summary:
      - Leave Types: ${leaveTypes.length}
      - Admins: 1
      - Employees: ${employees.length}
      - Salary Structures: ${salaryStructures.length}
      - Leave Balances: ${leaveBalances.length}
      - Attendances: ${attendances.length}
      - Leave Requests: ${leaveReqs.length}
      - Notifications: ${notifications.length}
      - Audit Logs: ${auditLogs.length}
    `);
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seed();

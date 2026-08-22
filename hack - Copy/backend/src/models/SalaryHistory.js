import mongoose from 'mongoose';

const componentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['fixed', 'percentage'], required: true },
  value: { type: Number, required: true },
  baseComponent: { type: String },
  calculatedAmount: { type: Number }
}, { _id: false });

const deductionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['fixed', 'percentage'], required: true },
  value: { type: Number, required: true },
  baseComponent: { type: String, default: 'totalEarnings' },
  calculatedAmount: { type: Number }
}, { _id: false });

const salaryHistorySchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  effectiveDate: { type: Date, required: true },
  monthlyWage: { type: Number },
  components: [componentSchema],
  deductions: [deductionSchema],
  totalEarnings: { type: Number },
  totalDeductions: { type: Number },
  netSalary: { type: Number },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  changeReason: { type: String }
}, { timestamps: true });

salaryHistorySchema.index({ employee: 1, effectiveDate: -1 });

export default mongoose.model('SalaryHistory', salaryHistorySchema);
